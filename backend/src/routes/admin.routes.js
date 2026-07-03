const router = require('express').Router();
const ctrl = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('admin'));
router.get('/users', ctrl.listUsers);
router.patch('/users/:id', ctrl.updateUserStatus);
router.delete('/users/:id', ctrl.deleteUser);
router.get('/listings', ctrl.listListings);
router.delete('/listings/:id', ctrl.deleteListing);
router.get('/activity', ctrl.activity);

module.exports = router;