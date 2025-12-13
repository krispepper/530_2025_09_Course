const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Course = require("../models/Course");
const User = require("../models/User");
const Evaluation = require("../models/Evaluation");
const Response = require("../models/Response");

const { isAuthenticated, hasRole } = require("../middleware/auth");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * GET instructor courses
 */
router.get("/instructor", isAuthenticated, hasRole("instructor"), async (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Session missing userId. Please login again." });
    }

    const courses = await Course.find({ instructor: req.session.userId })
      .populate("instructor", "email role")
      .populate("students", "email role")
      .sort({ createdAt: -1 });

    return res.json({ count: courses.length, courses });
  } catch (error) {
    console.error("Get Instructor Courses Error:", error);
    return res.status(500).json({ message: "Server error while fetching instructor courses" });
  }
});

/**
 * CREATE a new course
 * @access Instructor
 */
router.post("/", isAuthenticated, hasRole("instructor", "admin"), async (req, res) => {
  try {
    const { courseName, courseCode, description, term, section } = req.body;

    if (!courseName || !courseCode || !term || !section) {
      return res.status(400).json({
        message: "Please provide course name, course code, term, and section"
      });
    }

    const existingCourse = await Course.findOne({
      courseCode: courseCode.toUpperCase()
    });
    if (existingCourse) {
      return res.status(400).json({ message: "Course with this code already exists" });
    }

    const course = new Course({
      courseName: courseName.trim(),
      courseCode: courseCode.toUpperCase().trim(),
      description: description || "",
      term: term.trim(),
      section: section.trim(),
      instructor: req.session.userId
    });

    await course.save();
    await course.populate("instructor", "email role");

    return res.status(201).json({
      message: "Course created successfully",
      course
    });
  } catch (error) {
    console.error("Create Course Error:", error);
    return res.status(500).json({ message: "Server error while creating course" });
  }
});

/**
 * GET all courses (role-based)
 * @access Authenticated users
 */
router.get("/", isAuthenticated, async (req, res) => {
  try {
    let courses;

    if (req.session.userRole === "student") {
      courses = await Course.find({ students: req.session.userId })
        .populate("instructor", "email role")
        .populate("students", "email role");
    } else if (req.session.userRole === "instructor") {
      courses = await Course.find({ instructor: req.session.userId })
        .populate("instructor", "email role")
        .populate("students", "email role");
    } else {
      courses = await Course.find()
        .populate("instructor", "email role")
        .populate("students", "email role");
    }

    return res.json({ count: courses.length, courses });
  } catch (error) {
    console.error("Get Courses Error:", error);
    return res.status(500).json({ message: "Server error while fetching courses" });
  }
});

/**
 * GET single course by ID
 * @access Authenticated users
 */
router.get("/:id", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(404).json({ message: "Course not found" });
    }

    const course = await Course.findById(id)
      .populate("instructor", "email role")
      .populate("students", "email role");

    if (!course) return res.status(404).json({ message: "Course not found" });

    return res.json({ course });
  } catch (error) {
    console.error("Get Course Error:", error);
    return res.status(500).json({ message: "Server error while fetching course" });
  }
});

/**
 * UPDATE course
 * @access Instructor (own course)
 */
router.put("/:id", isAuthenticated, hasRole("instructor", "admin"), async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) return res.status(404).json({ message: "Course not found" });

    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (req.session.userRole === "instructor" && course.instructor.toString() !== req.session.userId) {
      return res.status(403).json({ message: "You can only update your own courses" });
    }

    const { courseName, courseCode, description, term, section, isActive } = req.body;

    if (courseCode && courseCode.toUpperCase() !== course.courseCode) {
      const existingCourse = await Course.findOne({ courseCode: courseCode.toUpperCase() });
      if (existingCourse) return res.status(400).json({ message: "Course code already exists" });
      course.courseCode = courseCode.toUpperCase();
    }

    if (courseName !== undefined) course.courseName = courseName;
    if (description !== undefined) course.description = description;

    if (term !== undefined) course.term = term;
    if (section !== undefined) course.section = section;

    if (isActive !== undefined) course.isActive = isActive;

    await course.save();
    await course.populate("instructor", "email role");
    await course.populate("students", "email role");

    return res.json({ message: "Course updated successfully", course });
  } catch (error) {
    console.error("Update Course Error:", error);
    return res.status(500).json({ message: "Server error while updating course" });
  }
});

/**
 * DELETE course
 * @access Instructor (own course)
 */
router.delete("/:id", isAuthenticated, hasRole("instructor", "admin"), async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) return res.status(404).json({ message: "Course not found" });

    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (req.session.userRole === "instructor" && course.instructor.toString() !== req.session.userId) {
      return res.status(403).json({ message: "You can only delete your own courses" });
    }

    await Course.findByIdAndDelete(id);
    return res.json({ message: "Course deleted successfully" });
  } catch (error) {
    console.error("Delete Course Error:", error);
    return res.status(500).json({ message: "Server error while deleting course" });
  }
});

/**
 * ENROLL student
 * @access Admin only
 */
router.post("/:id/enroll", isAuthenticated, hasRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const { studentEmail } = req.body;

    if (!studentEmail) return res.status(400).json({ message: "Please provide student email" });
    if (!isValidObjectId(id)) return res.status(404).json({ message: "Course not found" });

    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const student = await User.findOne({ email: studentEmail, role: "student" });
    if (!student) return res.status(404).json({ message: "Student not found" });

    if (course.students.includes(student._id)) {
      return res.status(400).json({ message: "Student is already enrolled in this course" });
    }

    course.students.push(student._id);
    await course.save();
    await course.populate("instructor", "email role");
    await course.populate("students", "email role");

    return res.json({ message: "Student enrolled successfully", course });
  } catch (error) {
    console.error("Enroll Student Error:", error);
    return res.status(500).json({ message: "Server error while enrolling student" });
  }
});

/**
 * REMOVE student
 * @access Admin only
 */
router.post("/:id/remove", isAuthenticated, hasRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const { studentEmail } = req.body;

    if (!studentEmail) return res.status(400).json({ message: "Please provide student email" });
    if (!isValidObjectId(id)) return res.status(404).json({ message: "Course not found" });

    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const student = await User.findOne({ email: studentEmail, role: "student" });
    if (!student) return res.status(404).json({ message: "Student not found" });

    if (!course.students.includes(student._id)) {
      return res.status(400).json({ message: "Student is not enrolled in this course" });
    }

    course.students = course.students.filter((sid) => sid.toString() !== student._id.toString());
    await course.save();
    await course.populate("instructor", "email role");
    await course.populate("students", "email role");

    return res.json({ message: "Student removed successfully", course });
  } catch (error) {
    console.error("Remove Student Error:", error);
    return res.status(500).json({ message: "Server error while removing student" });
  }
});

/**
 * @access Instructor (own course) or Admin
 */
router.get("/:id/students", isAuthenticated, hasRole("instructor", "admin"), async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) return res.status(404).json({ message: "Course not found" });

    const course = await Course.findById(id).populate("students", "email role");
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (req.session.userRole === "instructor" && course.instructor.toString() !== req.session.userId) {
      return res.status(403).json({ message: "You can only view students for your own courses" });
    }

    const evaluation = await Evaluation.findOne({ course: id }).sort({ createdAt: -1 });

    if (!evaluation) {
      const students = (course.students || []).map((s) => ({
        studentId: s._id,
        email: s.email,
        hasSubmitted: false,
        responseId: null
      }));
      return res.json({ evaluationId: null, students });
    }

    const responses = await Response.find({ evaluation: evaluation._id })
      .select("_id submittedBy student")
      .lean();

    const byUser = new Map();
    responses.forEach((r) => {
      const uid = String(r.submittedBy || r.student || "");
      if (uid) byUser.set(uid, r);
    });

    const students = (course.students || []).map((s) => {
      const r = byUser.get(String(s._id));
      return {
        studentId: s._id,
        email: s.email,
        hasSubmitted: !!r,
        responseId: r ? r._id : null
      };
    });

    return res.json({ evaluationId: evaluation._id, students });
  } catch (error) {
    console.error("Get Course Students Error:", error);
    return res.status(500).json({ message: "Server error while fetching students" });
  }
});

/**
 * @access Instructor (own course) or Admin
 */
router.get(
  "/:id/students/:studentId/submission",
  isAuthenticated,
  hasRole("instructor", "admin"),
  async (req, res) => {
    try {
      const { id, studentId } = req.params;

      if (!isValidObjectId(id)) return res.status(404).json({ message: "Course not found" });
      if (!isValidObjectId(studentId)) return res.status(404).json({ message: "Student not found" });

      const course = await Course.findById(id);
      if (!course) return res.status(404).json({ message: "Course not found" });

      if (req.session.userRole === "instructor" && course.instructor.toString() !== req.session.userId) {
        return res.status(403).json({ message: "You can only view submissions for your own courses" });
      }

      const evaluation = await Evaluation.findOne({ course: id }).sort({ createdAt: -1 });
      if (!evaluation) {
        return res.json({ hasSubmitted: false, evaluationId: null, responseId: null });
      }

      const resp = await Response.findOne({
        evaluation: evaluation._id,
        $or: [{ submittedBy: studentId }, { student: studentId }]
      }).lean();

      if (!resp) {
        return res.json({ hasSubmitted: false, evaluationId: evaluation._id, responseId: null });
      }

      return res.json({
        hasSubmitted: true,
        evaluationId: evaluation._id,
        responseId: resp._id
      });
    } catch (error) {
      console.error("Get Student Submission Error:", error);
      return res.status(500).json({ message: "Server error while fetching submission" });
    }
  }
);

module.exports = router;