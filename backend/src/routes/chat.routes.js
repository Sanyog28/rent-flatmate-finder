const router = require('express').Router();
const ctrl = require('../controllers/chat.controller');
const { authenticate } = require('../middleware/auth');

router.get('/conversations', authenticate, ctrl.listConversations);
router.get('/:interestId/messages', authenticate, ctrl.getMessages);

module.exports = router;