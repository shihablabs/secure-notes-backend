const express = require('express');
const router = express.Router();
const {
  createPost,
  getPosts,
  getPostsByUser
} = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');

// public routes
router.get('/', getPosts);
// Scenario 2: retrieve all posts belonging to a user ($lookup)
router.get('/user/:userId', getPostsByUser);

// protected route (creating post)
router.post('/', protect, createPost);

module.exports = router;
