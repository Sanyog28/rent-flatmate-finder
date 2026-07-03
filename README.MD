# Rent & Flatmate Finder

A full-stack platform where **owners** list rooms and **tenants** create profiles describing their
preferences. An **AI compatibility engine** (LLM-powered, with rule-based fallback) scores and ranks
each tenant-listing pair. Once a tenant expresses interest and the owner accepts, both parties can
chat in **real time** via WebSocket. **Email notifications** are sent on key events.

## Tech Stack

- **Backend:** Node.js, Express, Sequelize ORM (SQLite for local dev / PostgreSQL for production), JWT auth, `ws` for WebSocket, Nodemailer for email
- **Frontend:** React 18 + Vite, React Router
- **LLM:** OpenAI Chat Completions API (configurable model), with deterministic rule-based fallback
- **Auth:** JWT with role-based access control (`tenant`, `owner`, `admin`)

## Project Structure

```

rent-flatmate-finder/
├── package.json
├── README.md
├── SYSTEM_DESIGN.md
├── backend/
│   ├── src/
│   │   ├── index.js
│   │   ├── config/
│   │   ├── models/
│   │   ├── middleware/
│   │   ├── services/
│   │   ├── controllers/
│   │   ├── routes/
│   │   └── seed/
│   └── package.json
└── frontend/
├── src/
│   ├── api/
│   ├── context/
│   ├── components/
│   └── pages/
└── package.json