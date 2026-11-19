const mongoose = require('mongoose');
const Post = require('../models/Post');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination } = require('../utils/pagination');

// create post (visible to everyone)
const createPost = asyncHandler(async (req, res) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required' });
  }

  const post = await Post.create({
    title,
    content,
    user: req.user._id
  });

  res.status(201).json(post);
});

// get all posts with pagination (public)
const getPosts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, 10);

  const totalPosts = await Post.countDocuments();
  const posts = await Post.find()
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.json({
    posts,
    page,
    pages: Math.ceil(totalPosts / limit),
    totalPosts
  });
});

// Scenario 2: Retrieve all posts belonging to a particular user using a single $lookup aggregation
const getPostsByUser = asyncHandler(async (req, res) => {
  const userId = req.params.userId;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  const result = await User.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(userId) } },
    {
      $lookup: {
        from: 'posts',
        localField: '_id',
        foreignField: 'user',
        as: 'posts'
      }
    },
    {
      $project: {
        password: 0
      }
    }
  ]);

  if (!result || result.length === 0) {
    return res.status(404).json({ message: 'User not found' });
  }

  res.json(result[0]);
});

module.exports = {
  createPost,
  getPosts,
  getPostsByUser
};
