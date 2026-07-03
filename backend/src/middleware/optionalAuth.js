const { verifyToken } = require('../utils/jwt');
const { User } = require('../models');

async function optionalAuthenticate(req, res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      const decoded = verifyToken(header.split(' ')[1]);
      const user = await User.findByPk(decoded.id);
      if (user && user.isActive) req.user = user;
    } catch (e) {
      // ignore invalid token for optional auth routes
    }
  }
  next();
}

module.exports = optionalAuthenticate;