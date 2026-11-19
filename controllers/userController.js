const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination } = require('../utils/pagination');

// admin: get all users with pagination, keyword search, and role filter
const getUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, 10);

  let filter = {};

  // Keyword search by name or email
  if (req.query.search && req.query.search.trim()) {
    const searchRegex = new RegExp(req.query.search.trim(), 'i');
    filter.$or = [
      { name: searchRegex },
      { email: searchRegex }
    ];
  }

  // Filter by role (user / admin)
  if (req.query.role && typeof req.query.role === 'string') {
    const cleanRole = req.query.role.trim().toLowerCase();
    if (['user', 'admin'].includes(cleanRole)) {
      filter.role = cleanRole;
    }
  }

  const totalUsers = await User.countDocuments(filter);
  const users = await User.find(filter)
    .select('-password')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.json({
    users,
    page,
    pages: Math.ceil(totalUsers / limit) || 1,
    totalUsers
  });
});

// admin: add a new user
const addUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, interests } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Full name is required' });
  }

  if (!email || !email.trim()) {
    return res.status(400).json({ message: 'Valid email address is required' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const userExists = await User.findOne({ email: cleanEmail });
  if (userExists) {
    return res.status(400).json({ message: 'A user account with this email address already exists' });
  }

  let parsedInterests = [];
  if (Array.isArray(interests)) {
    parsedInterests = interests.filter(Boolean);
  } else if (typeof interests === 'string' && interests.trim()) {
    parsedInterests = interests.split(',').map((i) => i.trim()).filter(Boolean);
  }

  const user = await User.create({
    name: name.trim(),
    email: cleanEmail,
    password: password || '123456',
    role: role || 'user',
    interests: parsedInterests
  });

  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    interests: user.interests
  });
});

// admin: update user details
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  user.name = req.body.name || user.name;
  user.email = req.body.email || user.email;
  user.role = req.body.role || user.role;
  if (req.body.interests) {
    user.interests = req.body.interests;
  }

  const updatedUser = await user.save();
  res.json({
    _id: updatedUser._id,
    name: updatedUser.name,
    email: updatedUser.email,
    role: updatedUser.role,
    interests: updatedUser.interests
  });
});

// admin: remove a user
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (user._id.toString() === req.user._id.toString()) {
    return res.status(400).json({ message: 'Admin cannot delete their own account' });
  }

  await user.deleteOne();
  res.json({ message: 'User removed successfully' });
});

// Scenario 1: Group by Interests using single collection.aggregate() call
const getUsersByInterests = asyncHandler(async (req, res) => {
  const groupedUsers = await User.aggregate([
    { $unwind: '$interests' },
    {
      $group: {
        _id: '$interests',
        users: {
          $push: {
            _id: '$_id',
            name: '$name',
            email: '$email',
            role: '$role'
          }
        },
        totalUsers: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        interest: '$_id',
        totalUsers: 1,
        users: 1
      }
    }
  ]);

  res.json(groupedUsers);
});

module.exports = {
  getUsers,
  addUser,
  updateUser,
  deleteUser,
  getUsersByInterests
};
