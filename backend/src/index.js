require('dotenv').config();
const fs = require('fs');
const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { WebSocketServer } = require('ws');

const { sequelize, Interest, Message, Listing, User } = require('./models');
const { verifyToken } = require('./utils/jwt');

const authRoutes = require('./routes/auth.routes');
const listingRoutes = require('./routes/listing.routes');
const tenantRoutes = require('./routes/tenant.routes');
const interestRoutes = require('./routes/interest.routes');
const chatRoutes = require('./routes/chat.routes');
const adminRoutes = require('./routes/admin.routes');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use(morgan('dev'));
app.use('/uploads', express.static(uploadsDir));

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/tenant', tenantRoutes);
app.use('/api/interests', interestRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

const server = http.createServer(app);

const wss = new WebSocketServer({ server, path: '/ws' });
const connections = new Map();

wss.on('connection', async (ws, req) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    const interestId = Number(url.searchParams.get('interestId'));

    if (!token || !interestId) {
      ws.close(4001, 'Missing token or interestId');
      return;
    }

    const decoded = verifyToken(token);
    const user = await User.findByPk(decoded.id);
    if (!user) { ws.close(4001, 'Invalid user'); return; }

    const interest = await Interest.findByPk(interestId, { include: [{ model: Listing, as: 'listing' }] });
    if (!interest) { ws.close(4004, 'Conversation not found'); return; }

    const isParticipant = interest.tenantId === user.id || interest.listing.ownerId === user.id;
    if (!isParticipant) { ws.close(4003, 'Forbidden'); return; }
    if (interest.status !== 'accepted') { ws.close(4003, 'Chat not available until interest is accepted'); return; }

    ws.userId = user.id;
    ws.userName = user.name;
    ws.interestId = interestId;

    if (!connections.has(interestId)) connections.set(interestId, new Set());
    connections.get(interestId).add(ws);

    ws.send(JSON.stringify({ type: 'connected', message: 'Connected to chat' }));

    ws.on('message', async (raw) => {
      try {
        const data = JSON.parse(raw.toString());
        if (data.type === 'message') {
          const content = String(data.content || '').trim();
          if (!content) return;
          const msg = await Message.create({ interestId, senderId: user.id, content });
          const payload = JSON.stringify({
            type: 'message',
            message: {
              id: msg.id,
              interestId,
              senderId: user.id,
              senderName: user.name,
              content,
              createdAt: msg.createdAt
            }
          });
          const peers = connections.get(interestId) || new Set();
          for (const peer of peers) {
            if (peer.readyState === peer.OPEN) peer.send(payload);
          }
        } else if (data.type === 'typing') {
          const peers = connections.get(interestId) || new Set();
          for (const peer of peers) {
            if (peer !== ws && peer.readyState === peer.OPEN) {
              peer.send(JSON.stringify({ type: 'typing', userId: user.id, userName: user.name }));
            }
          }
        }
      } catch (err) {
        ws.send(JSON.stringify({ type: 'error', error: 'Invalid message format' }));
      }
    });

    ws.on('close', () => {
      const set = connections.get(interestId);
      if (set) {
        set.delete(ws);
        if (set.size === 0) connections.delete(interestId);
      }
    });
  } catch (err) {
    console.error('WS connection error:', err.message);
    try { ws.close(4000, 'Connection error'); } catch (e) {}
  }
});

const PORT = process.env.PORT || 5000;

sequelize.sync({ alter: process.env.DB_ALTER === 'true' })
  .then(() => {
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('DB sync failed:', err);
    process.exit(1);
  });

module.exports = { app, server };