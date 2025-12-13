const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Evaluation = require("../models/Evaluation");
const Response = require("../models/Response");
const Course = require("../models/Course");
const { isAuthenticated, hasRole } = require("../middleware/auth");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * POST /api/evaluations
 */
router.post("/", isAuthenticated, hasRole("instructor", "admin"), async (req, res) => {
  try {
    const { title, courseId, evaluationType, questions, startDate, endDate } = req.body;

    if (!title || !courseId || !evaluationType || !questions || !startDate || !endDate) {
      return res.status(400).json({
        message:
          "Please provide all required fields: title, courseId, evaluationType, questions, startDate, endDate"
      });
    }

    if (!isValidObjectId(courseId)) return res.status(400).json({ message: "Invalid courseId" });

    if (!["open", "anonymous"].includes(evaluationType)) {
      return res.status(400).json({ message: 'Evaluation type must be either "open" or "anonymous"' });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: "At least one question is required" });
    }

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (req.session.userRole === "instructor" && String(course.instructor) !== String(req.session.userId)) {
      return res.status(403).json({ message: "You can only create evaluations for your own courses" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }
    if (end <= start) return res.status(400).json({ message: "End date must be after start date" });

    const evaluation = new Evaluation({
      title,
      course: courseId,
      instructor: req.session.userId,
      evaluationType,
      questions: questions.map((q) => ({
        questionText: q.questionText,
        questionType: q.questionType,
        isRequired: q.isRequired !== undefined ? q.isRequired : true
      })),
      startDate: start,
      endDate: end,
      status: "active",
      isActive: true
    });

    await evaluation.save();
    await evaluation.populate("course", "courseName courseCode");
    await evaluation.populate("instructor", "email role");

    return res.status(201).json({
      message: "Evaluation created successfully",
      evaluation
    });
  } catch (err) {
    console.error("Create Evaluation Error:", err);
    return res.status(500).json({ message: "Server error while creating evaluation" });
  }
});

/**
 * GET /api/evaluations
 */
router.get("/", isAuthenticated, async (req, res) => {
  try {
    let evaluations = [];

    if (req.session.userRole === "student") {
      const enrolledCourses = await Course.find({ students: req.session.userId }).select("_id");
      const courseIds = enrolledCourses.map((c) => c._id);

      evaluations = await Evaluation.find({ course: { $in: courseIds }, isActive: true })
        .populate("course", "courseName courseCode")
        .populate("instructor", "email role")
        .sort({ createdAt: -1 });

      const evaluationsWithStatus = await Promise.all(
        evaluations.map(async (ev) => {
          const existing = await Response.findOne({ evaluation: ev._id, submittedBy: req.session.userId });
          return {
            ...ev.toObject(),
            hasSubmitted: !!existing,
            isOpen: new Date() >= ev.startDate && new Date() <= ev.endDate
          };
        })
      );

      return res.json({ count: evaluationsWithStatus.length, evaluations: evaluationsWithStatus });
    }

    if (req.session.userRole === "instructor") {
      evaluations = await Evaluation.find({ instructor: req.session.userId })
        .populate("course", "courseName courseCode")
        .populate("instructor", "email role")
        .sort({ createdAt: -1 });
    } else {
      evaluations = await Evaluation.find()
        .populate("course", "courseName courseCode")
        .populate("instructor", "email role")
        .sort({ createdAt: -1 });
    }

    return res.json({ count: evaluations.length, evaluations });
  } catch (err) {
    console.error("Get Evaluations Error:", err);
    return res.status(500).json({ message: "Server error while fetching evaluations" });
  }
});

/**
 * POST /api/evaluations/ensure
 */
router.post("/ensure", isAuthenticated, hasRole("student"), async (req, res) => {
  try {
    const { courseId } = req.body;

    if (!courseId || !isValidObjectId(courseId)) {
      return res.status(400).json({ message: "Valid courseId is required" });
    }

    const course = await Course.findById(courseId).populate("instructor", "email role");
    if (!course) return res.status(404).json({ message: "Course not found" });

    const enrolled = course.students.map(String).includes(String(req.session.userId));
    if (!enrolled) return res.status(403).json({ message: "You are not enrolled in this course" });

    const defaultQuestions = [
      { questionText: "The course content was well organized.", questionType: "rating", isRequired: true },
      { questionText: "The instructor clearly explained course concepts.", questionType: "rating", isRequired: true },
      { questionText: "The pace of the course was appropriate.", questionType: "rating", isRequired: true },
      { questionText: "Feedback on assignments helped me improve my learning.", questionType: "rating", isRequired: true },
      { questionText: "Overall, I would recommend this course to other students.", questionType: "rating", isRequired: true },
      { questionText: "The grading criteria and expectations were clear.", questionType: "rating", isRequired: true },
      { questionText: "Class activities and discussions helped me stay engaged.", questionType: "rating", isRequired: true },
      { questionText: "The instructor encouraged student participation and questions.", questionType: "rating", isRequired: true },
      { questionText: "The course materials supported my learning effectively.", questionType: "rating", isRequired: true },
      { questionText: "Online resources/tools were easy to access and use.", questionType: "rating", isRequired: true },
      { questionText: "What worked well in this course?", questionType: "text", isRequired: true },
      { questionText: "What could be improved for future students?", questionType: "text", isRequired: true }
    ];

    let evaluation = await Evaluation.findOne({ course: courseId, isActive: true }).sort({ createdAt: -1 });

    if (!evaluation) {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + 30);

      evaluation = new Evaluation({
        title: `Course Evaluation - ${course.courseName}`,
        course: courseId,
        instructor: course.instructor?._id || course.instructor,
        evaluationType: "open",
        questions: defaultQuestions,
        startDate,
        endDate,
        status: "active",
        isActive: true
      });

      await evaluation.save();
    } else {
      const anyResponses = await Response.exists({ evaluation: evaluation._id });
      if (!anyResponses) {
        evaluation.questions = defaultQuestions;
        await evaluation.save();
      }
    }

    const existing = await Response.findOne({
      evaluation: evaluation._id,
      submittedBy: req.session.userId
    });

    return res.json({
      evaluationId: evaluation._id,
      hasSubmitted: !!existing
    });
  } catch (err) {
    console.error("Ensure evaluation error:", err);
    return res.status(500).json({ message: "Failed to create evaluation" });
  }
});

/**
 * GET /api/evaluations/:id
 */
router.get("/:id", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: "Invalid evaluation id" });

    const evaluation = await Evaluation.findById(id)
      .populate("course", "courseName courseCode")
      .populate("instructor", "email role");

    if (!evaluation) return res.status(404).json({ message: "Evaluation not found" });

    return res.json({ evaluation });
  } catch (err) {
    console.error("Get evaluation error:", err);
    return res.status(500).json({ message: "Server error while fetching evaluation" });
  }
});

/**
 * POST /api/evaluations/:id/submit
 */
router.post("/:id/submit", isAuthenticated, hasRole("student"), async (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Session missing userId. Please login again." });
    }

    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: "Invalid evaluation id" });

    const { answers } = req.body;
    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ message: "Please provide answers to the evaluation" });
    }

    const evaluation = await Evaluation.findById(id);
    if (!evaluation) return res.status(404).json({ message: "Evaluation not found" });

    const now = new Date();
    if (evaluation.status !== "active") return res.status(400).json({ message: "This evaluation is closed" });
    if (now < evaluation.startDate || now > evaluation.endDate) {
      return res.status(400).json({ message: "This evaluation is not currently open for submissions" });
    }

    const course = await Course.findById(evaluation.course);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const enrolled = course.students.map(String).includes(String(req.session.userId));
    if (!enrolled) return res.status(403).json({ message: "You are not enrolled in this course" });

    const existing = await Response.findOne({ evaluation: id, submittedBy: req.session.userId });
    if (existing) {
      return res.status(400).json({ message: "You have already submitted a response for this evaluation" });
    }

    const requiredQuestions = evaluation.questions.filter((q) => q.isRequired);
    for (const q of requiredQuestions) {
      const a = answers.find((x) => x.questionId === q._id.toString());
      if (!a || !a.answerValue || String(a.answerValue).trim() === "") {
        return res.status(400).json({ message: `Please answer the required question: "${q.questionText}"` });
      }
    }

    const response = new Response({
      evaluation: id,
      submittedBy: req.session.userId,
      answers: answers.map((a) => ({
        questionId: a.questionId,
        questionText: a.questionText,
        questionType: a.questionType,
        answerValue: a.answerValue
      })),
      isAnonymous: evaluation.evaluationType === "anonymous"
    });

    await response.save();

    return res.status(201).json({
      message: "Response submitted successfully",
      response: { id: response._id, submittedAt: response.submittedAt }
    });
  } catch (err) {
    console.error("Submit Response Error:", err);
    return res.status(500).json({ message: "Server error while submitting response" });
  }
});

/**
 * GET /api/evaluations/:id/results 
 * Instructor/Admin only
 */
router.get("/:id/results", isAuthenticated, hasRole("instructor", "admin"), async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: "Invalid evaluation id" });

    const evaluation = await Evaluation.findById(id).populate(
      "course",
      "courseName courseCode term section"
    );
    if (!evaluation) return res.status(404).json({ message: "Evaluation not found" });

    if (req.session.userRole === "instructor" && String(evaluation.instructor) !== String(req.session.userId)) {
      return res.status(403).json({ message: "You can only view results for your own evaluations" });
    }

    const responses = await Response.find({ evaluation: id })
      .populate("submittedBy", "email role")
      .sort({ submittedAt: -1 });

    const statistics = {};
    evaluation.questions.forEach((q) => {
      if (q.questionType !== "rating") return;

      const ratings = responses
        .map((r) => r.answers.find((a) => String(a.questionId) === String(q._id)))
        .filter(Boolean)
        .map((a) => parseInt(a.answerValue, 10))
        .filter((n) => !Number.isNaN(n));

      if (ratings.length === 0) return;

      const sum = ratings.reduce((acc, v) => acc + v, 0);
      const avg = sum / ratings.length;

      statistics[q._id] = {
        questionText: q.questionText,
        average: Number(avg.toFixed(2)),
        count: ratings.length,
        distribution: {
          1: ratings.filter((r) => r === 1).length,
          2: ratings.filter((r) => r === 2).length,
          3: ratings.filter((r) => r === 3).length,
          4: ratings.filter((r) => r === 4).length,
          5: ratings.filter((r) => r === 5).length
        }
      };
    });

    return res.json({
      evaluation,
      totalResponses: responses.length,
      responses:
        evaluation.evaluationType === "anonymous"
          ? responses.map((r) => ({ ...r.toObject(), submittedBy: null }))
          : responses,
      statistics
    });
  } catch (err) {
    console.error("Get Results Error:", err);
    return res.status(500).json({ message: "Server error while fetching results" });
  }
});

/**
 * GET /api/evaluations/:id/my-response
 */
router.get("/:id/my-response", isAuthenticated, hasRole("student"), async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: "Invalid evaluation id" });

    const response = await Response.findOne({
      evaluation: id,
      submittedBy: req.session.userId
    });

    if (!response) return res.status(404).json({ message: "No submission found" });

    return res.json({
      response: {
        id: response._id,
        submittedAt: response.submittedAt,
        answers: response.answers
      }
    });
  } catch (err) {
    console.error("My response error:", err);
    return res.status(500).json({ message: "Server error while fetching your response" });
  }
});

module.exports = router;