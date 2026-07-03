const { TenantProfile } = require('../models');

exports.getProfile = async (req, res) => {
  const profile = await TenantProfile.findOne({ where: { userId: req.user.id } });
  res.json({ profile });
};

exports.upsertProfile = async (req, res) => {
  try {
    const { preferredLocation, budgetMin, budgetMax, moveInDate, bio } = req.body;
    if (!preferredLocation || budgetMin === undefined || budgetMax === undefined) {
      return res.status(400).json({ error: 'preferredLocation, budgetMin, budgetMax are required' });
    }
    let profile = await TenantProfile.findOne({ where: { userId: req.user.id } });
    if (!profile) {
      profile = await TenantProfile.create({ userId: req.user.id, preferredLocation, budgetMin, budgetMax, moveInDate, bio });
    } else {
      Object.assign(profile, { preferredLocation, budgetMin, budgetMax, moveInDate, bio });
      await profile.save();
    }
    res.json({ profile });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};