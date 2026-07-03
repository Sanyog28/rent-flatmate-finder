const { Interest, Listing, User, TenantProfile, CompatibilityScore } = require('../models');
const { getOrComputeScore } = require('../services/compatibility.service');
const { sendEmail } = require('../services/email.service');

exports.createInterest = async (req, res) => {
  try {
    const { listingId } = req.body;
    if (!listingId) return res.status(400).json({ error: 'listingId is required' });

    const listing = await Listing.findByPk(listingId, { include: [{ model: User, as: 'owner' }] });
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    if (listing.isFilled) return res.status(400).json({ error: 'Listing already filled' });

    const existing = await Interest.findOne({ where: { tenantId: req.user.id, listingId } });
    if (existing) return res.status(409).json({ error: 'Interest already sent for this listing' });

    const tenantProfile = await TenantProfile.findOne({ where: { userId: req.user.id } });
    if (!tenantProfile) return res.status(400).json({ error: 'Please complete your tenant profile first' });

    const scoreRecord = await getOrComputeScore(listing, tenantProfile);

    const interest = await Interest.create({
      tenantId: req.user.id,
      listingId,
      status: 'pending',
      compatibilityScoreId: scoreRecord.id
    });

    const highScore = scoreRecord.score >= 80;
    if (highScore || process.env.NOTIFY_ALL_INTERESTS === 'true') {
      const subject = highScore
        ? `🔥 High-compatibility tenant interested in "${listing.title}"`
        : `New interest in your listing "${listing.title}"`;
      const html = `
        <p>Hi ${listing.owner.name},</p>
        <p><strong>${req.user.name}</strong> has expressed interest in your listing <strong>${listing.title}</strong>.</p>
        <p>Compatibility score: <strong>${scoreRecord.score}/100</strong></p>
        <p>${scoreRecord.explanation}</p>
        <p>Log in to the platform to accept or decline this request.</p>
      `;
      await sendEmail({ to: listing.owner.email, subject, html, userId: listing.owner.id, type: 'interest_received' });
    }

    res.status(201).json({
      interest,
      compatibility: { score: scoreRecord.score, explanation: scoreRecord.explanation, method: scoreRecord.method }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send interest' });
  }
};

exports.sentInterests = async (req, res) => {
  const interests = await Interest.findAll({
    where: { tenantId: req.user.id },
    include: [
      { model: Listing, as: 'listing', include: [{ model: User, as: 'owner', attributes: ['id', 'name', 'email'] }] },
      { model: CompatibilityScore, as: 'compatibilityScore' }
    ],
    order: [['createdAt', 'DESC']]
  });
  res.json({ interests });
};

exports.receivedInterests = async (req, res) => {
  const interests = await Interest.findAll({
    include: [
      { model: Listing, as: 'listing', where: { ownerId: req.user.id } },
      { model: User, as: 'tenant', attributes: ['id', 'name', 'email'] },
      { model: CompatibilityScore, as: 'compatibilityScore' }
    ],
    order: [['createdAt', 'DESC']]
  });
  res.json({ interests });
};

exports.respondInterest = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['accepted', 'declined'].includes(status)) {
      return res.status(400).json({ error: 'status must be accepted or declined' });
    }

    const interest = await Interest.findByPk(req.params.id, {
      include: [{ model: Listing, as: 'listing' }, { model: User, as: 'tenant' }]
    });
    if (!interest) return res.status(404).json({ error: 'Interest not found' });
    if (interest.listing.ownerId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    if (interest.status !== 'pending') return res.status(400).json({ error: 'Interest already responded to' });

    interest.status = status;
    interest.respondedAt = new Date();
    await interest.save();

    const subject = status === 'accepted'
      ? `Good news! Your interest in "${interest.listing.title}" was accepted`
      : `Update on your interest in "${interest.listing.title}"`;
    const html = `
      <p>Hi ${interest.tenant.name},</p>
      <p>The owner has <strong>${status}</strong> your interest request for <strong>${interest.listing.title}</strong>.</p>
      ${status === 'accepted' ? '<p>You can now chat with the owner directly on the platform.</p>' : ''}
    `;
    await sendEmail({ to: interest.tenant.email, subject, html, userId: interest.tenant.id, type: `interest_${status}` });

    res.json({ interest });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to respond to interest' });
  }
};