const mongoose = require('mongoose');

const RoadmapSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optional for non-authenticated users
  },
  userEmail: {
    type: String,
    required: false
  },
  topic: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    required: true
  },
  hoursPerWeek: {
    type: Number,
    min: 1,
    max: 20,
    required: true
  },
  goal: {
    type: String,
    trim: true,
    maxlength: 500
  },
  roadmapData: {
    type: Object,
    required: true
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  currentPhase: {
    type: Number,
    default: 1
  },
  completedMilestones: [{
    phaseNumber: Number,
    milestoneIndex: Number,
    completedAt: Date
  }],
  status: {
    type: String,
    enum: ['active', 'completed', 'archived'],
    default: 'active'
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  shareToken: {
    type: String,
    unique: true,
    sparse: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for performance
RoadmapSchema.index({ userId: 1, createdAt: -1 });
RoadmapSchema.index({ shareToken: 1 });
RoadmapSchema.index({ topic: 'text' });

// Update timestamp on save
RoadmapSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Roadmap', RoadmapSchema);
