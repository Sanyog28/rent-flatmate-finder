const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  passwordHash: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('tenant', 'owner', 'admin'), allowNull: false },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { tableName: 'users' });

const TenantProfile = sequelize.define('TenantProfile', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  preferredLocation: { type: DataTypes.STRING, allowNull: true },
  budgetMin: { type: DataTypes.FLOAT, defaultValue: 0 },
  budgetMax: { type: DataTypes.FLOAT, defaultValue: 0 },
  moveInDate: { type: DataTypes.DATEONLY, allowNull: true },
  bio: { type: DataTypes.TEXT, allowNull: true }
}, { tableName: 'tenant_profiles' });

const Listing = sequelize.define('Listing', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  ownerId: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  location: { type: DataTypes.STRING, allowNull: false },
  rent: { type: DataTypes.FLOAT, allowNull: false },
  availableFrom: { type: DataTypes.DATEONLY, allowNull: false },
  roomType: { type: DataTypes.STRING, allowNull: false },
  furnishingStatus: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  photos: { type: DataTypes.JSON, defaultValue: [] },
  isFilled: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { tableName: 'listings' });

const CompatibilityScore = sequelize.define('CompatibilityScore', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  tenantProfileId: { type: DataTypes.INTEGER, allowNull: false },
  listingId: { type: DataTypes.INTEGER, allowNull: false },
  score: { type: DataTypes.INTEGER, allowNull: false },
  explanation: { type: DataTypes.TEXT, allowNull: false },
  method: { type: DataTypes.ENUM('llm', 'fallback'), allowNull: false }
}, {
  tableName: 'compatibility_scores',
  indexes: [{ unique: true, fields: ['tenantProfileId', 'listingId'] }]
});

const Interest = sequelize.define('Interest', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  tenantId: { type: DataTypes.INTEGER, allowNull: false },
  listingId: { type: DataTypes.INTEGER, allowNull: false },
  status: { type: DataTypes.ENUM('pending', 'accepted', 'declined'), defaultValue: 'pending' },
  compatibilityScoreId: { type: DataTypes.INTEGER, allowNull: true },
  respondedAt: { type: DataTypes.DATE, allowNull: true }
}, {
  tableName: 'interests',
  indexes: [{ unique: true, fields: ['tenantId', 'listingId'] }]
});

const Message = sequelize.define('Message', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  interestId: { type: DataTypes.INTEGER, allowNull: false },
  senderId: { type: DataTypes.INTEGER, allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: false }
}, { tableName: 'messages' });

const NotificationLog = sequelize.define('NotificationLog', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: true },
  type: { type: DataTypes.STRING, allowNull: false },
  channel: { type: DataTypes.STRING, defaultValue: 'email' },
  payload: { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.STRING, defaultValue: 'sent' }
}, { tableName: 'notification_logs' });

User.hasOne(TenantProfile, { foreignKey: 'userId', as: 'tenantProfile' });
TenantProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Listing, { foreignKey: 'ownerId', as: 'listings' });
Listing.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

TenantProfile.hasMany(CompatibilityScore, { foreignKey: 'tenantProfileId', as: 'scores' });
CompatibilityScore.belongsTo(TenantProfile, { foreignKey: 'tenantProfileId', as: 'tenantProfile' });

Listing.hasMany(CompatibilityScore, { foreignKey: 'listingId', as: 'scores' });
CompatibilityScore.belongsTo(Listing, { foreignKey: 'listingId', as: 'listing' });

User.hasMany(Interest, { foreignKey: 'tenantId', as: 'interestsSent' });
Interest.belongsTo(User, { foreignKey: 'tenantId', as: 'tenant' });

Listing.hasMany(Interest, { foreignKey: 'listingId', as: 'interests' });
Interest.belongsTo(Listing, { foreignKey: 'listingId', as: 'listing' });

Interest.belongsTo(CompatibilityScore, { foreignKey: 'compatibilityScoreId', as: 'compatibilityScore' });

Interest.hasMany(Message, { foreignKey: 'interestId', as: 'messages' });
Message.belongsTo(Interest, { foreignKey: 'interestId', as: 'interest' });

User.hasMany(Message, { foreignKey: 'senderId', as: 'messagesSent' });
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

module.exports = {
  sequelize, User, TenantProfile, Listing, CompatibilityScore, Interest, Message, NotificationLog
};