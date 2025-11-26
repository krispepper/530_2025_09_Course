const request = require('supertest');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const express = require('express');
const session = require('express-session');
const User = require('../models/User');
const Course = require('../models/Course');


const app = express();
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));
app.use('/api/auth', require('../routes/auth'));
app.use('/api/courses', require('../routes/course'));

// sample data
const testInstructor = {
  email: 'testinstructor@test.com',
  password: 'testpass123',
  role: 'instructor'
};

const testStudent = {
  email: 'teststudent@test.com',
  password: 'testpass123',
  role: 'student'
};

const testAdmin = {
  email: 'testadmin@test.com',
  password: 'testpass123',
  role: 'admin'
};

const testCourse = {
  courseName: 'Software Engineering',
  courseCode: 'CS530',
  description: 'Advanced software engineering course'
};

// Connect to database before tests
beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);
});

// Clear test data after each test
afterEach(async () => {
  await User.deleteMany({});
  await Course.deleteMany({});
});

// Close database connection after all tests
afterAll(async () => {
  await mongoose.connection.close();
});

describe('UAT - Course Management', () => {

  // UAT-1: create course
  describe('UAT-1: Instructor Creates Course', () => {
    test('Should allow instructor to create a course successfully', async () => {
      // Register and login as instructor
      await request(app)
        .post('/api/auth/register')
        .send(testInstructor);

      const agent = request.agent(app);
      await agent
        .post('/api/auth/login')
        .send({
          email: testInstructor.email,
          password: testInstructor.password
        });

      // create course
      const response = await agent
        .post('/api/courses')
        .send(testCourse);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Course created successfully');
      expect(response.body.course.courseName).toBe(testCourse.courseName);
      expect(response.body.course.courseCode).toBe(testCourse.courseCode);

      // verify course is in database
      const courseInDb = await Course.findOne({ courseCode: testCourse.courseCode });
      expect(courseInDb).toBeTruthy();
    });
  });

  // UAT-2: view Courses by role
  describe('UAT-2: View Courses Based on User Role', () => {
    test('Students should only see enrolled courses', async () => {
      // create instructor and course
      await request(app)
        .post('/api/auth/register')
        .send(testInstructor);

      const instructorAgent = request.agent(app);
      await instructorAgent
        .post('/api/auth/login')
        .send({
          email: testInstructor.email,
          password: testInstructor.password
        });

      const courseResponse = await instructorAgent
        .post('/api/courses')
        .send(testCourse);

      const courseId = courseResponse.body.course.id;

      // register student
      await request(app)
        .post('/api/auth/register')
        .send(testStudent);

      const studentAgent = request.agent(app);
      await studentAgent
        .post('/api/auth/login')
        .send({
          email: testStudent.email,
          password: testStudent.password
        });

      // student should see no courses (not enrolled yet)
      const beforeEnrollment = await studentAgent.get('/api/courses');
      expect(beforeEnrollment.body.count).toBe(0);

      // Admin enrolls student
      await request(app)
        .post('/api/auth/register')
        .send(testAdmin);

      const adminAgent = request.agent(app);
      await adminAgent
        .post('/api/auth/login')
        .send({
          email: testAdmin.email,
          password: testAdmin.password
        });

      await adminAgent
        .post(`/api/courses/${courseId}/enroll`)
        .send({ studentEmail: testStudent.email });

      // student should now see 1 course (enrolled)
      const afterEnrollment = await studentAgent.get('/api/courses');
      expect(afterEnrollment.body.count).toBe(1);
    });
  });

  // UAT-3: enroll Student
  describe('UAT-3: Admin Enrolls Student in Course', () => {
    test('Admin should be able to enroll a student in a course', async () => {
      // create instructor and course
      await request(app)
        .post('/api/auth/register')
        .send(testInstructor);

      const instructorAgent = request.agent(app);
      await instructorAgent
        .post('/api/auth/login')
        .send({
          email: testInstructor.email,
          password: testInstructor.password
        });

      const courseResponse = await instructorAgent
        .post('/api/courses')
        .send(testCourse);

      const courseId = courseResponse.body.course.id;

      // register student
      await request(app)
        .post('/api/auth/register')
        .send(testStudent);

      // Admin enrolls student
      await request(app)
        .post('/api/auth/register')
        .send(testAdmin);

      const adminAgent = request.agent(app);
      await adminAgent
        .post('/api/auth/login')
        .send({
          email: testAdmin.email,
          password: testAdmin.password
        });

      const response = await adminAgent
        .post(`/api/courses/${courseId}/enroll`)
        .send({ studentEmail: testStudent.email });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Student enrolled successfully');
      expect(response.body.course.students).toHaveLength(1);
      expect(response.body.course.students[0].email).toBe(testStudent.email);
    });
  });

  // UAT-4: update course
  describe('UAT-4: Update Course Information', () => {
    test('Instructor should be able to update their own course', async () => {
      // create instructor and course
      await request(app)
        .post('/api/auth/register')
        .send(testInstructor);

      const agent = request.agent(app);
      await agent
        .post('/api/auth/login')
        .send({
          email: testInstructor.email,
          password: testInstructor.password
        });

      const courseResponse = await agent
        .post('/api/courses')
        .send(testCourse);

      const courseId = courseResponse.body.course.id;

      // update course
      const response = await agent
        .put(`/api/courses/${courseId}`)
        .send({
          courseName: 'Advanced Software Engineering',
          description: 'Updated description'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Course updated successfully');
      expect(response.body.course.courseName).toBe('Advanced Software Engineering');
    });
  });

  // UAT-5: prevent unauthorized actions
  describe('UAT-5: Authorization - Prevent Unauthorized Course Creation', () => {
    test('Students should NOT be able to create courses', async () => {
      // register and login as student
      await request(app)
        .post('/api/auth/register')
        .send(testStudent);

      const agent = request.agent(app);
      await agent
        .post('/api/auth/login')
        .send({
          email: testStudent.email,
          password: testStudent.password
        });

      // Try to create course as student
      const response = await agent
        .post('/api/courses')
        .send(testCourse);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('You do not have permission to access this resource');
    });
  });

  // UAT-6: delete course
  describe('UAT-6: Delete Course', () => {
    test('Instructor should be able to delete their own course', async () => {
      // Create instructor and course
      await request(app)
        .post('/api/auth/register')
        .send(testInstructor);

      const agent = request.agent(app);
      await agent
        .post('/api/auth/login')
        .send({
          email: testInstructor.email,
          password: testInstructor.password
        });

      const courseResponse = await agent
        .post('/api/courses')
        .send(testCourse);

      const courseId = courseResponse.body.course.id;

      // delete course
      const response = await agent
        .delete(`/api/courses/${courseId}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Course deleted successfully');

      // verify course is deleted from database
      const courseInDb = await Course.findById(courseId);
      expect(courseInDb).toBeNull();
    });
  });

});