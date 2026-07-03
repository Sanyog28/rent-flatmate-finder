# System Design Write-Up

## 1. Compatibility Scoring Design

Compatibility is modeled as a first-class entity: `CompatibilityScore(tenantProfileId, listingId, score, explanation, method)` with a unique constraint on `(tenantProfileId, listingId)`. This makes the score a cached fact rather than a computed-on-the-fly value, satisfying the requirement to avoid recomputation on every request.

**Computation flow** (`compatibility.service.js`):
1. On browse/detail requests, `getOrComputeScore(listing, tenantProfile)` first checks for an existing row. If found, it's returned immediately — zero LLM calls for repeat views.
2. If absent, it attempts an LLM call; on success or failure (see §2) it persists the result with a `method` tag (`llm` or `fallback`) so the origin of every score is auditable.
3. Browse listings are annotated with `{compatibility: {score, explanation, method}}` and sorted descending by score server-side, so ranking logic lives in one place and is consistent across browse/detail/interest flows.
4. A `POST /listings/:id/recompute-score` endpoint lets a tenant force a fresh score (e.g., after updating their profile) by deleting the cached row and recomputing.

This design cleanly separates **scoring logic** (interchangeable LLM/rule engine) from **caching/persistence** (compatibility service) from **consumption** (listing controller), so the scoring algorithm can be swapped without touching API or DB code.

## 2. LLM Integration and Fallback

`llm.service.js` builds the exact prompt specified in the brief and calls OpenAI's Chat Completions API with `response_format: { type: "json_object" }` to force valid JSON, minimizing parsing errors. Key resilience measures:

- **Timeout:** An `AbortController` cancels the request after 15s so a slow/hanging LLM never blocks the request thread.
- **Strict validation:** The score is clamped to `[0,100]` and coerced to an integer; if the LLM returns a non-numeric or missing score, an error is thrown deliberately to trigger fallback rather than storing garbage data.
- **Fail-closed to rule-based scoring:** Any exception (network failure, missing API key, malformed JSON, timeout, rate limit) is caught in `getOrComputeScore`, logged, and the flow transparently switches to `ruleBasedScore()` — the tenant/owner never sees an error; they simply get a `method: "fallback"` score.
- **Deterministic fallback algorithm:** 60 points max for budget fit (full credit if rent falls within `[budgetMin, budgetMax]`, linearly decaying penalty proportional to how far outside the range), 40 points max for location (exact match, substring/partial match, or keyword overlap tiers). This guarantees the platform is always fully functional even with zero LLM spend/availability, and the explanation text still communicates *why* a score was given.

Because both paths write to the same `CompatibilityScore` table with the same shape, the rest of the system (ranking, notifications, UI badges) is completely agnostic to which engine produced a score.

## 3. Real-Time Chat Implementation

Chat is implemented with the `ws` library sharing the same HTTP server as Express (`server.on(path: '/ws')`), avoiding the need for a separate process or port.

- **Connection & auth:** Clients connect to `wss://host/ws?token=<JWT>&interestId=<id>`. On connection, the server verifies the JWT, loads the `Interest` (with its `Listing`), and checks that (a) the connecting user is either the tenant or the listing owner, and (b) the interest `status === 'accepted'`. Unauthorized or premature connections are closed immediately with a specific code, enforcing the business rule that chat only unlocks after mutual interest.
- **Routing:** An in-memory `Map<interestId, Set<WebSocket>>` groups sockets per conversation. Incoming `{type:'message'}` payloads are persisted to the `messages` table *before* being broadcast, guaranteeing no message is fanned-out without being durably stored — a page refresh or reconnect always sees full history via the companion REST endpoint `GET /chat/:interestId/messages`.
- **History + live merge:** The frontend loads persisted history via REST on mount, then opens the WebSocket and appends new messages as they arrive — the two paths never conflict because REST is only used once at load time and the socket is authoritative afterward.
- **Scaling note:** For a multi-instance deployment, the in-memory connection map would need to be replaced with a pub/sub layer (e.g., Redis) so broadcasts reach sockets on other instances; the `Message` persistence logic is unaffected by this change.

## 4. Notification Flow

Email is centralized in `email.service.js`'s `sendEmail()`, which:
1. Uses Nodemailer with any SMTP provider configured via env vars (Gmail App Password, Brevo, Mailtrap, SendGrid).
2. **Degrades gracefully:** if SMTP env vars are absent, it logs the intended email to console and marks status `skipped_no_smtp_config` instead of throwing — local development and demos work without any email setup.
3. **Never throws:** send failures are caught, logged, and recorded — an email outage never causes a 500 on the interest/accept/decline endpoints, satisfying graceful-degradation requirements broadly.
4. **Audits every attempt** to a `notification_logs` table (`userId, type, channel, payload, status`), giving the admin dashboard visibility into notification health.

**Triggers:**
- On `POST /interests`: the compatibility score is fetched/computed synchronously (cached), then if `score >= 80` an email is sent to the owner immediately. An env flag (`NOTIFY_ALL_INTERESTS`) allows broader always-notify behavior.
- On `PATCH /interests/:id` (owner accepts/declines): an email is sent to the tenant reflecting the outcome, and only after this state transition does the WebSocket chat become reachable, tying notification and chat-unlock logic to the same authoritative status field on `Interest`.

This design keeps each concern (scoring, LLM resilience, chat, notifications) in an isolated service module with a narrow contract, making the system easy to test, replace individual providers (LLM/SMTP), and extend without touching unrelated code.
