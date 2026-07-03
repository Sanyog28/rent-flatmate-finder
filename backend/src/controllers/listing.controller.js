const { Op } = require('sequelize');
const { Listing, User, TenantProfile, CompatibilityScore } = require('../models');
const { getOrComputeScore } = require('../services/compatibility.service');

exports.createListing = async (req, res) => {
  try {
    const { title, location, rent, availableFrom, roomType, furnishingStatus, description } = req.body;
    if (!title || !location || !rent || !availableFrom || !roomType || !furnishingStatus) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const photos = (req.files || []).map((f) => `/uploads/${f.filename}`);
    const listing = await Listing.create({
      ownerId: req.user.id,
      title,
      location,
      rent,
      availableFrom,
      roomType,
      furnishingStatus,
      description: description || '',
      photos
    });
    res.status(201).json({ listing });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create listing' });
  }
};

exports.updateListing = async (req, res) => {
  try {
    const listing = await Listing.findByPk(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    if (listing.ownerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const fields = ['title', 'location', 'rent', 'availableFrom', 'roomType', 'furnishingStatus', 'description'];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) listing[f] = req.body[f];
    });
    if (req.files && req.files.length) {
      listing.photos = [...(listing.photos || []), ...req.files.map((f) => `/uploads/${f.filename}`)];
    }
    await listing.save();
    res.json({ listing });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update listing' });
  }
};

exports.markFilled = async (req, res) => {
  try {
    const listing = await Listing.findByPk(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    if (listing.ownerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    listing.isFilled = true;
    await listing.save();
    res.json({ listing });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update listing' });
  }
};

exports.deleteListing = async (req, res) => {
  try {
    const listing = await Listing.findByPk(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    if (listing.ownerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    await listing.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete listing' });
  }
};

exports.myListings = async (req, res) => {
  const listings = await Listing.findAll({ where: { ownerId: req.user.id }, order: [['createdAt', 'DESC']] });
  res.json({ listings });
};

exports.browseListings = async (req, res) => {
  try {
    const { location, minBudget, maxBudget } = req.query;
    const where = { isFilled: false };
    if (location) where.location = { [Op.like]: `%${location}%` };
    if (minBudget || maxBudget) {
      where.rent = {};
      if (minBudget) where.rent[Op.gte] = Number(minBudget);
      if (maxBudget) where.rent[Op.lte] = Number(maxBudget);
    }

    const listings = await Listing.findAll({
      where,
      include: [{ model: User, as: 'owner', attributes: ['id', 'name', 'email'] }],
      order: [['createdAt', 'DESC']]
    });

    let tenantProfile = null;
    if (req.user && req.user.role === 'tenant') {
      tenantProfile = await TenantProfile.findOne({ where: { userId: req.user.id } });
    }

    const results = [];
    for (const listing of listings) {
      let compatibility = null;
      if (tenantProfile) {
        const scoreRecord = await getOrComputeScore(listing, tenantProfile);
        compatibility = { score: scoreRecord.score, explanation: scoreRecord.explanation, method: scoreRecord.method };
      }
      results.push({ ...listing.toJSON(), compatibility });
    }

    if (tenantProfile) {
      results.sort((a, b) => (b.compatibility?.score || 0) - (a.compatibility?.score || 0));
    }

    res.json({ listings: results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to browse listings' });
  }
};

exports.getListing = async (req, res) => {
  try {
    const listing = await Listing.findByPk(req.params.id, {
      include: [{ model: User, as: 'owner', attributes: ['id', 'name', 'email'] }]
    });
    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    let compatibility = null;
    if (req.user && req.user.role === 'tenant') {
      const tenantProfile = await TenantProfile.findOne({ where: { userId: req.user.id } });
      if (tenantProfile) {
        const scoreRecord = await getOrComputeScore(listing, tenantProfile);
        compatibility = { score: scoreRecord.score, explanation: scoreRecord.explanation, method: scoreRecord.method };
      }
    }
    res.json({ listing, compatibility });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get listing' });
  }
};

exports.recomputeScore = async (req, res) => {
  try {
    const listing = await Listing.findByPk(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    const tenantProfile = await TenantProfile.findOne({ where: { userId: req.user.id } });
    if (!tenantProfile) return res.status(400).json({ error: 'Complete your tenant profile first' });

    await CompatibilityScore.destroy({ where: { tenantProfileId: tenantProfile.id, listingId: listing.id } });
    const scoreRecord = await getOrComputeScore(listing, tenantProfile);

    res.json({ compatibility: { score: scoreRecord.score, explanation: scoreRecord.explanation, method: scoreRecord.method } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to recompute score' });
  }
};