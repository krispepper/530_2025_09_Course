const mongoose = require('mongoose');

const AnswerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  questionText: {
    type: String,
    required: true
  },
  questionType: {
    type: String,
    enum: ['rating', 'text'],
    required: true
  },
  answerValue: {
    type: String,
    required: true
  }
}, { _id: false });

const ResponseSchema = new mongoose.Schema({
  evaluation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Evaluation',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  answers: [AnswerSchema],
  isAnonymous: {
    type: Boolean,
    required: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// to prevent duplicate submissions (one response per student per evaluation)
ResponseSchema.index({ evaluation: 1, student: 1 }, { 
  unique: true,
  partialFilterExpression: { student: { $ne: null } }
});

module.exports = mongoose.model('Response', ResponseSchema);