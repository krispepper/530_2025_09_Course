const express = require('express');
const router = express.Router();
const Evaluation = require('../models/Evaluation');
const Response = require('../models/Response');
const Course = require('../models/Course');
const { isAuthenticated, hasRole } = require('../middleware/auth');

// Create a new evaluation
// @access  Instructor, Admin only
router.post('/', isAuthenticated, hasRole('instructor', 'admin'), async (req, res) => {
  try {
    const { title, courseId, evaluationType, questions, startDate, endDate } = req.body;

    // Validate required fields
    if (!title || !courseId || !evaluationType || !questions || !startDate || !endDate) {
      return res.status(400).json({ 
        message: 'Please provide all required fields: title, courseId, evaluationType, questions, startDate, endDate' 
      });
    }

    // Validate evaluation type
    if (!['open', 'anonymous'].includes(evaluationType)) {
      return res.status(400).json({ message: 'Evaluation type must be either "open" or "anonymous"' });
    }

    // Validate questions array
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: 'At least one question is required' });
    }

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if instructor owns this course (or if admin)
    if (req.session.userRole === 'instructor' && course.instructor.toString() !== req.session.userId) {
      return res.status(403).json({ message: 'You can only create evaluations for your own courses' });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    if (end <= start) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    // Create evaluation
    const evaluation = new Evaluation({
      title,
      course: courseId,
      instructor: req.session.userId,
      evaluationType,
      questions: questions.map(q => ({
        questionText: q.questionText,
        questionType: q.questionType,
        isRequired: q.isRequired !== undefined ? q.isRequired : true
      })),
      startDate: start,
      endDate: end,
      status: 'active'
    });

    await evaluation.save();
    await evaluation.populate('course', 'courseName courseCode');
    await evaluation.populate('instructor', 'email role');

    res.status(201).json({
      message: 'Evaluation created successfully',
      evaluation
    });

  } catch (error) {
    console.error('Create Evaluation Error:', error);
    res.status(500).json({ message: 'Server error while creating evaluation' });
  }
});

// Get evaluations based on user role
// @access  Authenticated users
router.get('/', isAuthenticated, async (req, res) => {
  try {
    let evaluations;

    if (req.session.userRole === 'student') {
      // Students see evaluations for courses they're enrolled in
      const enrolledCourses = await Course.find({ students: req.session.userId }).select('_id');
      const courseIds = enrolledCourses.map(c => c._id);

      evaluations = await Evaluation.find({ 
        course: { $in: courseIds },
        isActive: true
      })
        .populate('course', 'courseName courseCode')
        .populate('instructor', 'email role')
        .sort({ createdAt: -1 });

    } else if (req.session.userRole === 'instructor') {
      // Instructors see only their evaluations
      evaluations = await Evaluation.find({ instructor: req.session.userId })
        .populate('course', 'courseName courseCode')
        .populate('instructor', 'email role')
        .sort({ createdAt: -1 });

    } else {
      // Admins see all evaluations
      evaluations = await Evaluation.find()
        .populate('course', 'courseName courseCode')
        .populate('instructor', 'email role')
        .sort({ createdAt: -1 });
    }

    // For students, also check if they've already submitted
    if (req.session.userRole === 'student') {
      const evaluationsWithStatus = await Promise.all(
        evaluations.map(async (evaluation) => {
          const response = await Response.findOne({
            evaluation: eval._id,
            student: req.session.userId
          });

          return {
            ...eval.toObject(),
            hasSubmitted: !!response,
            isOpen: new Date() >= eval.startDate && new Date() <= eval.endDate
          };
        })
      );

      return res.json({
        count: evaluationsWithStatus.length,
        evaluations: evaluationsWithStatus
      });
    }

    res.json({
      count: evaluations.length,
      evaluations
    });

  } catch (error) {
    console.error('Get Evaluations Error:', error);
    res.status(500).json({ message: 'Server error while fetching evaluations' });
  }
});

//Get single evaluation by ID
// @access  Authenticated users
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const evaluation = await Evaluation.findById(req.params.id)
      .populate('course', 'courseName courseCode')
      .populate('instructor', 'email role');

    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation not found' });
    }

    // Check if student has access (must be enrolled in course)
    if (req.session.userRole === 'student') {
      const course = await Course.findById(evaluation.course._id);
      if (!course.students.includes(req.session.userId)) {
        return res.status(403).json({ message: 'You are not enrolled in this course' });
      }

      // Check if already submitted
      const response = await Response.findOne({
        evaluation: evaluation._id,
        student: req.session.userId
      });

      return res.json({
        evaluation,
        hasSubmitted: !!response,
        isOpen: new Date() >= evaluation.startDate && new Date() <= evaluation.endDate
      });
    }

    res.json({ evaluation });

  } catch (error) {
    console.error('Get Evaluation Error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Evaluation not found' });
    }
    res.status(500).json({ message: 'Server error while fetching evaluation' });
  }
});

// Update evaluation
// @access  Instructor (own evaluation), Admin
router.put('/:id', isAuthenticated, hasRole('instructor', 'admin'), async (req, res) => {
  try {
    const evaluation = await Evaluation.findById(req.params.id);

    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation not found' });
    }

    // Check if instructor owns this evaluation (or if admin)
    if (req.session.userRole === 'instructor' && evaluation.instructor.toString() !== req.session.userId) {
      return res.status(403).json({ message: 'You can only update your own evaluations' });
    }

    const { title, questions, startDate, endDate, status } = req.body;

    // Update fields
    if (title) evaluation.title = title;
    if (questions) {
      evaluation.questions = questions.map(q => ({
        questionText: q.questionText,
        questionType: q.questionType,
        isRequired: q.isRequired !== undefined ? q.isRequired : true
      }));
    }
    if (startDate) evaluation.startDate = new Date(startDate);
    if (endDate) evaluation.endDate = new Date(endDate);
    if (status) evaluation.status = status;

    await evaluation.save();
    await evaluation.populate('course', 'courseName courseCode');
    await evaluation.populate('instructor', 'email role');

    res.json({
      message: 'Evaluation updated successfully',
      evaluation
    });

  } catch (error) {
    console.error('Update Evaluation Error:', error);
    res.status(500).json({ message: 'Server error while updating evaluation' });
  }
});

// Delete evaluation
// @access  Instructor (own evaluation), Admin
router.delete('/:id', isAuthenticated, hasRole('instructor', 'admin'), async (req, res) => {
  try {
    const evaluation = await Evaluation.findById(req.params.id);

    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation not found' });
    }

    // Check if instructor owns this evaluation (or if admin)
    if (req.session.userRole === 'instructor' && evaluation.instructor.toString() !== req.session.userId) {
      return res.status(403).json({ message: 'You can only delete your own evaluations' });
    }

    // Delete all responses for this evaluation
    await Response.deleteMany({ evaluation: req.params.id });

    // Delete evaluation
    await Evaluation.findByIdAndDelete(req.params.id);

    res.json({ message: 'Evaluation and all associated responses deleted successfully' });

  } catch (error) {
    console.error('Delete Evaluation Error:', error);
    res.status(500).json({ message: 'Server error while deleting evaluation' });
  }
});

// Submit evaluation response
// @access  Students only
router.post('/:id/submit', isAuthenticated, hasRole('student'), async (req, res) => {
  try {
    const { answers } = req.body;

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ message: 'Please provide answers to the evaluation' });
    }

    // Get evaluation
    const evaluation = await Evaluation.findById(req.params.id);
    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation not found' });
    }

    // Check if evaluation is active
    if (evaluation.status !== 'active') {
      return res.status(400).json({ message: 'This evaluation is closed' });
    }

    // Check if within date range
    const now = new Date();
    if (now < evaluation.startDate || now > evaluation.endDate) {
      return res.status(400).json({ message: 'This evaluation is not currently open for submissions' });
    }

    // Check if student is enrolled in the course
    const course = await Course.findById(evaluation.course);
    if (!course.students.includes(req.session.userId)) {
      return res.status(403).json({ message: 'You are not enrolled in this course' });
    }

    // Check if student has already submitted (for non-anonymous or open evaluations)
    const existingResponse = await Response.findOne({
      evaluation: req.params.id,
      student: req.session.userId
    });

    if (existingResponse) {
      return res.status(400).json({ message: 'You have already submitted a response for this evaluation' });
    }

    // Validate all required questions are answered
    const requiredQuestions = evaluation.questions.filter(q => q.isRequired);
    for (const question of requiredQuestions) {
      const answer = answers.find(a => a.questionId === question._id.toString());
      if (!answer || !answer.answerValue || answer.answerValue.trim() === '') {
        return res.status(400).json({ 
          message: `Please answer the required question: "${question.questionText}"` 
        });
      }
    }

    // Create response
    const response = new Response({
      evaluation: req.params.id,
      student: evaluation.evaluationType === 'anonymous' ? null : req.session.userId,
      answers: answers.map(a => ({
        questionId: a.questionId,
        questionText: a.questionText,
        questionType: a.questionType,
        answerValue: a.answerValue
      })),
      isAnonymous: evaluation.evaluationType === 'anonymous'
    });

    await response.save();

    res.status(201).json({
      message: 'Response submitted successfully',
      response: {
        id: response._id,
        submittedAt: response.submittedAt,
        isAnonymous: response.isAnonymous
      }
    });

  } catch (error) {
    console.error('Submit Response Error:', error);
    
    // Handle duplicate submission error
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You have already submitted a response for this evaluation' });
    }
    
    res.status(500).json({ message: 'Server error while submitting response' });
  }
});

// @route   GET /api/evaluations/:id/results
// @desc    Get evaluation results (responses)
// @access  Instructor (own course), Admin
router.get('/:id/results', isAuthenticated, hasRole('instructor', 'admin'), async (req, res) => {
  try {
    const evaluation = await Evaluation.findById(req.params.id)
      .populate('course', 'courseName courseCode');

    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation not found' });
    }

    // Check if instructor owns this evaluation (or if admin)
    if (req.session.userRole === 'instructor' && evaluation.instructor.toString() !== req.session.userId) {
      return res.status(403).json({ message: 'You can only view results for your own evaluations' });
    }

    // Get all responses
    const responses = await Response.find({ evaluation: req.params.id })
      .populate('student', 'email role')
      .sort({ submittedAt: -1 });

    // Calculate statistics for rating questions
    const statistics = {};
    
    evaluation.questions.forEach(question => {
      if (question.questionType === 'rating') {
        const ratings = responses
          .map(r => r.answers.find(a => a.questionId.toString() === question._id.toString()))
          .filter(a => a && a.answerValue)
          .map(a => parseInt(a.answerValue));

        if (ratings.length > 0) {
          const sum = ratings.reduce((acc, val) => acc + val, 0);
          const average = (sum / ratings.length).toFixed(2);
          
          statistics[question._id] = {
            questionText: question.questionText,
            average: parseFloat(average),
            count: ratings.length,
            distribution: {
              1: ratings.filter(r => r === 1).length,
              2: ratings.filter(r => r === 2).length,
              3: ratings.filter(r => r === 3).length,
              4: ratings.filter(r => r === 4).length,
              5: ratings.filter(r => r === 5).length
            }
          };
        }
      }
    });

    res.json({
      evaluation,
      totalResponses: responses.length,
      responses: evaluation.evaluationType === 'anonymous' 
        ? responses.map(r => ({ ...r.toObject(), student: null }))
        : responses,
      statistics
    });

  } catch (error) {
    console.error('Get Results Error:', error);
    res.status(500).json({ message: 'Server error while fetching results' });
  }
});

module.exports = router;




// POST /api/evaluations - Create evaluation (instructor/admin)
// GET /api/evaluations - Get evaluations (filtered by role)
// GET /api/evaluations/:id - Get single evaluation
// PUT /api/evaluations/:id - Update evaluation
// DELETE /api/evaluations/:id - Delete evaluation + responses
// POST /api/evaluations/:id/submit - Submit response (student)
// GET /api/evaluations/:id/results - View results with statistics (instructor/admin)