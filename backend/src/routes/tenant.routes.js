const router = require('express').Router();
const ctrl = require('../controllers/tenant.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/profile', authenticate, authorize('tenant'), ctrl.getProfile);
router.post('/profile', authenticate, authorize('tenant'), ctrl.upsertProfile);

module.exports = router;