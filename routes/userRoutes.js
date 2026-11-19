const express = require('express');
const router = express.Router();
const {
  getUsers,
  addUser,
  updateUser,
  deleteUser,
  getUsersByInterests
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

// all routes here require login
router.use(protect);

// Scenario 1: Group users by interests aggregation
router.get('/by-interests', getUsersByInterests);

// Admin-only user management routes
router.route('/')
  .get(authorize('admin'), getUsers)
  .post(authorize('admin'), addUser);

router.route('/:id')
  .put(authorize('admin'), updateUser)
  .delete(authorize('admin'), deleteUser);

module.exports = router;
