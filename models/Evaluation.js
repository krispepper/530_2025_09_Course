const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true,
    trim: true
  },
  questionType: {
    type: String,
    enum: ['rating', 'text'],
    required: true
  },
  isRequired: {
    type: Boolean,
    default: true
  }
}, { _id: true });

const EvaluationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  evaluationType: {
    type: String,
    enum: ['open', 'anonymous'],
    required: true
  },
  questions: [QuestionSchema],
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'closed'],
    default: 'active'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Validation: endDate must be after startDate
EvaluationSchema.pre('save', function() {
  if (this.endDate <= this.startDate) {
    throw new Error('End date must be after start date');
  }
});

module.exports = mongoose.model('Evaluation', EvaluationSchema);