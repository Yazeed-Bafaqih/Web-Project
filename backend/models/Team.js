const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 50
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  roadmapId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Roadmap'
  },
  privacy: {
    type: String,
    enum: ['public', 'private', 'visible'],
    default: 'public'
  },
  inviteCode: {
    type: String,
    unique: true
  },
  members: [{
    userEmail: String,
    username: String,
    role: {
      type: String,
      enum: ['admin', 'moderator', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    progress: {
      type: Number,
      default: 0
    }
  }],
  streak: {
    type: Number,
    default: 0
  },
  maxMembers: {
    type: Number,
    default: 10,
    min: 5,
    max: 50
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Team', teamSchema);
