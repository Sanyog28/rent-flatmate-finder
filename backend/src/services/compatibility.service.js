const { CompatibilityScore } = require('../models');
const { getLLMCompatibility } = require('./llm.service');

function ruleBasedScore(listing, tenantProfile) {
  let score = 0;
  const reasons = [];

  const rent = Number(listing.rent);
  const min = Number(tenantProfile.budgetMin) || 0;
  const max = Number(tenantProfile.budgetMax) || 0;

  if (max > 0 && rent >= min && rent <= max) {
    score += 60;
    reasons.push('Rent is within the tenant\'s budget range.');
  } else if (max > 0) {
    const nearestBound = rent < min ? min : max;
    const diff = Math.abs(rent - nearestBound);
    const range = Math.max(max - min, 1);
    const penalty = Math.min(60, (diff / range) * 60);
    score += Math.max(0, 60 - penalty);
    reasons.push(rent < min ? 'Rent is below the stated budget.' : 'Rent exceeds the tenant\'s budget.');
  } else {
    reasons.push('Tenant budget not fully specified.');
  }

  const listingLoc = (listing.location || '').toLowerCase().trim();
  const tenantLoc = (tenantProfile.preferredLocation || '').toLowerCase().trim();

  if (listingLoc && tenantLoc) {
    if (listingLoc === tenantLoc) {
      score += 40;
      reasons.push('Location matches exactly.');
    } else if (listingLoc.includes(tenantLoc) || tenantLoc.includes(listingLoc)) {
      score += 25;
      reasons.push('Location partially matches.');
    } else {
      const listingWords = new Set(listingLoc.split(/[\s,]+/));
      const overlap = tenantLoc.split(/[\s,]+/).filter((w) => listingWords.has(w));
      if (overlap.length > 0) {
        score += 15;
        reasons.push('Location has partial keyword overlap.');
      } else {
        reasons.push('Location does not match tenant preference.');
      }
    }
  } else {
    reasons.push('Location data incomplete.');
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  return { score, explanation: `Rule-based score: ${reasons.join(' ')}`, method: 'fallback' };
}

async function getOrComputeScore(listing, tenantProfile) {
  let record = await CompatibilityScore.findOne({
    where: { tenantProfileId: tenantProfile.id, listingId: listing.id }
  });
  if (record) return record;

  let result;
  try {
    result = await getLLMCompatibility(listing, tenantProfile);
  } catch (err) {
    console.error('LLM scoring failed, using rule-based fallback:', err.message);
    result = ruleBasedScore(listing, tenantProfile);
  }

  record = await CompatibilityScore.create({
    tenantProfileId: tenantProfile.id,
    listingId: listing.id,
    score: result.score,
    explanation: result.explanation,
    method: result.method
  });

  return record;
}

module.exports = { getOrComputeScore, ruleBasedScore };