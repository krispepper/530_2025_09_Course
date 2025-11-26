const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const User = require('../models/User');
const { isAuthenticated, hasRole } = require('../middleware/auth');

// Create a new course
// @access  Instructor, Admin only
router.post('/', isAuthenticated, hasRole('instructor', 'admin'), async (req, res) => {
  try {
    const { courseName, courseCode, description } = req.body;

    // Validate required fields
    if (!courseName || !courseCode) {
      return res.status(400).json({ message: 'Please provide course name and course code' });
    }

    // Check if course code already exists
    const existingCourse = await Course.findOne({ courseCode: courseCode.toUpperCase() });
    if (existingCourse) {
      return res.status(400).json({ message: 'Course with this code already exists' });
    }

    // Create new course
    const course = new Course({
      courseName,
      courseCode: courseCode.toUpperCase(),
      description: description || '',
      instructor: req.session.userId
    });

    await course.save();

    // Populate instructor details
    await course.populate('instructor', 'email role');

    res.status(201).json({
      message: 'Course created successfully',
      course: {
        id: course._id,
        courseName: course.courseName,
        courseCode: course.courseCode,
        description: course.description,
        instructor: course.instructor,
        students: course.students,
        isActive: course.isActive
      }
    });

  } catch (error) {
    console.error('Create Course Error:', error);
    res.status(500).json({ message: 'Server error while creating course' });
  }
});

// Get all courses
// @access  Authenticated users
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const { role } = req.session;

    let courses;

    if (role === 'student') {
      // Students see only courses they're enrolled in
      courses = await Course.find({ students: req.session.userId })
        .populate('instructor', 'email role')
        .populate('students', 'email role');
    } else if (role === 'instructor') {
      // Instructors see only their courses
      courses = await Course.find({ instructor: req.session.userId })
        .populate('instructor', 'email role')
        .populate('students', 'email role');
    } else {
      // Admins see all courses
      courses = await Course.find()
        .populate('instructor', 'email role')
        .populate('students', 'email role');
    }

    res.json({
      count: courses.length,
      courses
    });

  } catch (error) {
    console.error('Get Courses Error:', error);
    res.status(500).json({ message: 'Server error while fetching courses' });
  }
});

// =Get single course by ID
// @access  Authenticated users
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'email role')
      .populate('students', 'email role');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json({ course });

  } catch (error) {
    console.error('Get Course Error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.status(500).json({ message: 'Server error while fetching course' });
  }
});

// @Update course
// @access  Instructor (own course), Admin
router.put('/:id', isAuthenticated, hasRole('instructor', 'admin'), async (req, res) => {
  try {
    const { courseName, courseCode, description, isActive } = req.body;

    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if instructor is updating their own course (or if admin)
    if (req.session.userRole === 'instructor' && course.instructor.toString() !== req.session.userId) {
      return res.status(403).json({ message: 'You can only update your own courses' });
    }

    // Check if new course code already exists (if changing code)
    if (courseCode && courseCode.toUpperCase() !== course.courseCode) {
      const existingCourse = await Course.findOne({ courseCode: courseCode.toUpperCase() });
      if (existingCourse) {
        return res.status(400).json({ message: 'Course code already exists' });
      }
      course.courseCode = courseCode.toUpperCase();
    }

    // Update fields
    if (courseName) course.courseName = courseName;
    if (description !== undefined) course.description = description;
    if (isActive !== undefined) course.isActive = isActive;

    await course.save();
    await course.populate('instructor', 'email role');
    await course.populate('students', 'email role');

    res.json({
      message: 'Course updated successfully',
      course
    });

  } catch (error) {
    console.error('Update Course Error:', error);
    res.status(500).json({ message: 'Server error while updating course' });
  }
});

//  Delete course
// @access  Instructor (own course), Admin
router.delete('/:id', isAuthenticated, hasRole('instructor', 'admin'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if instructor is deleting their own course (or if admin)
    if (req.session.userRole === 'instructor' && course.instructor.toString() !== req.session.userId) {
      return res.status(403).json({ message: 'You can only delete your own courses' });
    }

    await Course.findByIdAndDelete(req.params.id);

    res.json({ message: 'Course deleted successfully' });

  } catch (error) {
    console.error('Delete Course Error:', error);
    res.status(500).json({ message: 'Server error while deleting course' });
  }
});

//  Enroll a student in a course
// @access  Admin only
router.post('/:id/enroll', isAuthenticated, hasRole('admin'), async (req, res) => {
  try {
    const { studentEmail } = req.body;

    if (!studentEmail) {
      return res.status(400).json({ message: 'Please provide student email' });
    }

    // Find the course
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Find the student
    const student = await User.findOne({ email: studentEmail, role: 'student' });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check if already enrolled
    if (course.students.includes(student._id)) {
      return res.status(400).json({ message: 'Student is already enrolled in this course' });
    }

    // Enroll student
    course.students.push(student._id);
    await course.save();
    await course.populate('instructor', 'email role');
    await course.populate('students', 'email role');

    res.json({
      message: 'Student enrolled successfully',
      course
    });

  } catch (error) {
    console.error('Enroll Student Error:', error);
    res.status(500).json({ message: 'Server error while enrolling student' });
  }
});

// Remove a student from a course
// @access  Admin only
router.post('/:id/remove', isAuthenticated, hasRole('admin'), async (req, res) => {
  try {
    const { studentEmail } = req.body;

    if (!studentEmail) {
      return res.status(400).json({ message: 'Please provide student email' });
    }

    // Find the course
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Find the student
    const student = await User.findOne({ email: studentEmail, role: 'student' });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check if student is enrolled
    if (!course.students.includes(student._id)) {
      return res.status(400).json({ message: 'Student is not enrolled in this course' });
    }

    // Remove student
    course.students = course.students.filter(id => id.toString() !== student._id.toString());
    await course.save();
    await course.populate('instructor', 'email role');
    await course.populate('students', 'email role');

    res.json({
      message: 'Student removed successfully',
      course
    });

  } catch (error) {
    console.error('Remove Student Error:', error);
    res.status(500).json({ message: 'Server error while removing student' });
  }
});

module.exports = router;

// POST /api/courses - Create a course (instructor/admin)
// GET /api/courses - Get all courses (filtered by role)
// GET /api/courses/:id - Get single course details
// PUT /api/courses/:id - Update course (instructor of that course or admin)
// DELETE /api/courses/:id - Delete course (instructor of that course or admin)
// POST /api/courses/:id/enroll - Enroll a student (admin only)
// POST /api/courses/:id/remove - Remove a student (admin only)