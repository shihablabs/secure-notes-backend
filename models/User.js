const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User Schema (freeCodeCamp standard pattern)
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: [6, 'Password must be at least 6 characters']
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    interests: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true // Automatically creates createdAt and updatedAt fields
  }
);

// =========================================================================
// CRITICAL INDEXING STRATEGY (Interview Requirement: schema.index)
// DO NOT create unnecessary indexes. Only strictly required indexes:
// =========================================================================

// 1. Unique index on email: Fast lookup during authentication & prevents duplicates
userSchema.index({ email: 1 }, { unique: true });

// 2. Index on createdAt: Optimizes admin paginated user list queries (sorted by newest)
userSchema.index({ createdAt: -1 });

// 3. Multikey index on interests: Optimizes Aggregation Scenario 1 (Group by Interests)
userSchema.index({ interests: 1 });

// =========================================================================
// Password Hashing Middleware (bcryptjs)
// =========================================================================
userSchema.pre('save', async function () {
  // Only hash password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to verify password on login
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
