const express = require('express');
const router = express.Router();
const { getFeedback, postFeedback } = require('../controllers/feedbackController');

router.get('/feedback', getFeedback);
router.post('/feedback', postFeedback);

module.exports = router;
