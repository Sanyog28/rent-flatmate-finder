const router = require('express').Router();
const ctrl = require('../controllers/interest.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/', authenticate, authorize('tenant'), ctrl.createInterest);
router.get('/sent', authenticate, authorize('tenant'), ctrl.sentInterests);
router.get('/received', authenticate, authorize('owner'), ctrl.receivedInterests);
router.patch('/:id', authenticate, authorize('owner'), ctrl.respondInterest);

module.exports = router;