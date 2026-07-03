const { Interest, Message, User, Listing } = require('../models');

exports.getMessages = async (req, res) => {
  try {
    const interest = await Interest.findByPk(req.params.interestId, {
      include: [{ model: Listing, as: 'listing' }]
    });
    if (!interest) return res.status(404).json({ error: 'Conversation not found' });

    const isTenant = interest.tenantId === req.user.id;
    const isOwner = interest.listing.ownerId === req.user.id;
    if (!isTenant && !isOwner && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    if (interest.status !== 'accepted') return res.status(403).json({ error: 'Chat only available after interest is accepted' });

    const messages = await Message.findAll({
      where: { interestId: interest.id },
      include: [{ model: User, as: 'sender', attributes: ['id', 'name', 'role'] }],
      order: [['createdAt', 'ASC']]
    });
    res.json({ messages, interest });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load messages' });
  }
};

exports.listConversations = async (req, res) => {
  try {
    const asTenant = await Interest.findAll({
      where: { tenantId: req.user.id, status: 'accepted' },
      include: [{ model: Listing, as: 'listing', include: [{ model: User, as: 'owner', attributes: ['id', 'name'] }] }]
    });
    const asOwner = await Interest.findAll({
      where: { status: 'accepted' },
      include: [
        { model: Listing, as: 'listing', where: { ownerId: req.user.id } },
        { model: User, as: 'tenant', attributes: ['id', 'name'] }
      ]
    });
    res.json({ conversations: [...asTenant, ...asOwner] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to list conversations' });
  }
};