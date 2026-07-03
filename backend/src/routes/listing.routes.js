const router = require('express').Router();
const ctrl = require('../controllers/listing.controller');
const { authenticate, authorize } = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const upload = require('../middleware/upload');

router.post('/', authenticate, authorize('owner'), upload.array('photos', 6), ctrl.createListing);
router.get('/mine', authenticate, authorize('owner'), ctrl.myListings);
router.get('/browse', optionalAuth, ctrl.browseListings);
router.get('/:id', optionalAuth, ctrl.getListing);
router.put('/:id', authenticate, authorize('owner', 'admin'), upload.array('photos', 6), ctrl.updateListing);
router.patch('/:id/fill', authenticate, authorize('owner', 'admin'), ctrl.markFilled);
router.delete('/:id', authenticate, authorize('owner', 'admin'), ctrl.deleteListing);
router.post('/:id/recompute-score', authenticate, authorize('tenant'), ctrl.recomputeScore);

module.exports = router;