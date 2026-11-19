const User = require('../models/User');

// admin: get all users with pagination
const getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalUsers = await User.countDocuments();
    // sorted by createdAt descending, supported by index { createdAt: -1 }
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
  } catch (error) {
    next(error);
  }
};

// admin: add a new user
const addUser = async (req, res, next) => {
  try {
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
  } catch (error) {
    next(error);
  }
};

// admin: update user details
const updateUser = async (req, res, next) => {
  try {
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
  } catch (error) {
    next(error);
  }
};

// admin: remove a user
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // prevent admin from deleting self
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Admin cannot delete their own account' });
    }

    await user.deleteOne();
    res.json({ message: 'User removed successfully' });
  } catch (error) {
    next(error);
  }
};

// Scenario 1: Group by Interests using single collection.aggregate() call
const getUsersByInterests = async (req, res, next) => {
  try {
    const groupedUsers = await User.aggregate([
      // 1. unwind interests array to create a stream of documents per interest
      { $unwind: '$interests' },
      // 2. group by interest value and collect matching users
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
      // 3. sort interest alphabetically
      { $sort: { _id: 1 } },
      // 4. reshape output format
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
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  addUser,
  updateUser,
  deleteUser,
  getUsersByInterests
};
