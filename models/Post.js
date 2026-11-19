const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a title'],
      trim: true
    },
    content: {
      type: String,
      required: [true, 'Please add content']
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

// index for $lookup stage in aggregation to find posts by user quickly without full collection scan
postSchema.index({ user: 1 });

// index for public posts listing sorted by date
postSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);
