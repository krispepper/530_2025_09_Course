const { listFeedback, createFeedback } = require('../models/feedbackModel');

function validateFeedback(body) {
  const errors = [];
  if (!body.courseId || typeof body.courseId !== 'string') errors.push('courseId (string) is required');
  if (!body.studentId || typeof body.studentId !== 'string') errors.push('studentId (string) is required');
  const rating = Number(body.rating);
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) errors.push('rating (1-5) is required');
  if (body.comments && typeof body.comments !== 'string') errors.push('comments must be a string');
  return { valid: errors.length === 0, errors, rating };
}

async function getFeedback(req, res) {
  try {
    const items = await listFeedback();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
}

async function postFeedback(req, res) {
  const { valid, errors, rating } = validateFeedback(req.body || {});
  if (!valid) return res.status(400).json({ errors });
  try {
    const doc = {
      courseId: req.body.courseId,
      studentId: req.body.studentId,
      rating,
      comments: req.body.comments || '',
      createdAt: new Date()
    };
    const saved = await createFeedback(doc);
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
}

module.exports = { getFeedback, postFeedback , validateFeedback };

