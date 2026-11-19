const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
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

// compound index for user's own notes list + pagination (equality on user, sort on createdAt)
noteSchema.index({ user: 1, createdAt: -1 });

// index for admin to list everyone's notes sorted by date
noteSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Note', noteSchema);
