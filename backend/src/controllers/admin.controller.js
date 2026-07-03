const { User, Listing, Interest, Message } = require('../models');

exports.listUsers = async (req, res) => {
  const users = await User.findAll({ attributes: { exclude: ['passwordHash'] }, order: [['createdAt', 'DESC']] });
  res.json({ users });
};

exports.updateUserStatus = async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (typeof req.body.isActive === 'boolean') user.isActive = req.body.isActive;
  await user.save();
  res.json({ user: { id: user.id, isActive: user.isActive } });
};

exports.deleteUser = async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  await user.destroy();
  res.json({ success: true });
};

exports.listListings = async (req, res) => {
  const listings = await Listing.findAll({
    include: [{ model: User, as: 'owner', attributes: ['id', 'name', 'email'] }],
    order: [['createdAt', 'DESC']]
  });
  res.json({ listings });
};

exports.deleteListing = async (req, res) => {
  const listing = await Listing.findByPk(req.params.id);
  if (!listing) return res.status(404).json({ error: 'Listing not found' });
  await listing.destroy();
  res.json({ success: true });
};

exports.activity = async (req, res) => {
  const [userCount, listingCount, interestCount, messageCount, pendingInterests, acceptedInterests] = await Promise.all([
    User.count(),
    Listing.count(),
    Interest.count(),
    Message.count(),
    Interest.count({ where: { status: 'pending' } }),
    Interest.count({ where: { status: 'accepted' } })
  ]);
  const recentInterests = await Interest.findAll({ order: [['createdAt', 'DESC']], limit: 10 });
  res.json({
    stats: { userCount, listingCount, interestCount, messageCount, pendingInterests, acceptedInterests },
    recentInterests
  });
};