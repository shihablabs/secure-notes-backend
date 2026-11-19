const mongoose = require('mongoose');
const Post = require('../models/Post');
const User = require('../models/User');

// create post (visible to everyone)
const createPost = async (req, res, next) => {
  try {
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
  } catch (error) {
    next(error);
  }
};

// get all posts with pagination (public)
const getPosts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

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
  } catch (error) {
    next(error);
  }
};

// Scenario 2: Retrieve all posts belonging to a particular user using a single $lookup aggregation
const getPostsByUser = async (req, res, next) => {
  try {
    const userId = req.params.userId;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // single aggregation pipeline with $lookup stage
    const result = await User.aggregate([
      // 1. match the specific user
      { $match: { _id: new mongoose.Types.ObjectId(userId) } },
      // 2. lookup posts belonging to this user
      {
        $lookup: {
          from: 'posts',
          localField: '_id',
          foreignField: 'user',
          as: 'posts'
        }
      },
      // 3. remove sensitive password field
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
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPost,
  getPosts,
  getPostsByUser
};
