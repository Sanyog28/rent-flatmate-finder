function buildPrompt(listing, tenantProfile) {
  const listingData = {
    location: listing.location,
    rent: listing.rent,
    roomType: listing.roomType,
    furnishingStatus: listing.furnishingStatus,
    availableFrom: listing.availableFrom,
    description: listing.description
  };
  const tenantData = {
    preferredLocation: tenantProfile.preferredLocation,
    budgetMin: tenantProfile.budgetMin,
    budgetMax: tenantProfile.budgetMax,
    moveInDate: tenantProfile.moveInDate,
    bio: tenantProfile.bio
  };

  return `Given this room listing: ${JSON.stringify(listingData)} and this tenant profile: ${JSON.stringify(tenantData)}, compute a compatibility score from 0 to 100 based on budget and location match. Return JSON: { "score": number, "explanation": string }`;
}

async function getLLMCompatibility(listing, tenantProfile) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

  const prompt = buildPrompt(listing, tenantProfile);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a compatibility scoring assistant for a room rental platform. Respond ONLY with valid JSON, no markdown.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`LLM API error ${response.status}: ${text}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('Empty LLM response content');

    const parsed = JSON.parse(content);
    const score = Math.max(0, Math.min(100, Math.round(Number(parsed.score))));
    if (Number.isNaN(score)) throw new Error('LLM returned a non-numeric score');

    const explanation = String(parsed.explanation || 'No explanation provided').slice(0, 1000);
    return { score, explanation, method: 'llm' };
  } finally {
    clearTimeout(timeoutId);
  }
}

module.exports = { getLLMCompatibility, buildPrompt };