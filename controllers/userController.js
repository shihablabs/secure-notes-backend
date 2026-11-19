const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination } = require('../utils/pagination');

// admin: get all users with pagination
const getUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, 10);

  const totalUsers = await User.countDocuments();
  const users = await User.find()
    .select('-password')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.json({
    users,
    page,
    pages: Math.ceil(totalUsers / limit),
    totalUsers
  });
});

// admin: add a new user
const addUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, interests } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ message: 'User already exists' });
  }

  const user = await User.create({
    name,
    email,
    password: password || '123456',
    role: role || 'user',
    interests: interests || []
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
