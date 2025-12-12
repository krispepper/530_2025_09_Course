const mongoose = require("mongoose");

const AnswerSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    questionText: { type: String, required: true, trim: true },
    questionType: { type: String, enum: ["rating", "text"], required: true },
    answerValue: { type: String, required: true }
  },
  { _id: false }
);

const ResponseSchema = new mongoose.Schema(
  {
    evaluation: { type: mongoose.Schema.Types.ObjectId, ref: "Evaluation", required: true },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    answers: { type: [AnswerSchema], required: true },
    isAnonymous: { type: Boolean, default: false },
    submittedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

ResponseSchema.index({ evaluation: 1, submittedBy: 1 }, { unique: true });

module.exports = mongoose.model("Response", ResponseSchema);