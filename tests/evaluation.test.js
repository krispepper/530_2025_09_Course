const request = require('supertest');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const express = require('express');
const session = require('express-session');
const User = require('../models/User');
const Course = require('../models/Course');
const Evaluation = require('../models/Evaluation');
const Response = require('../models/Response');


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
app.use('/api/evaluations', require('../routes/evaluation'));

// Test data
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

const testCourse = {
  courseName: 'Software Engineering',
  courseCode: 'CS530',
  description: 'Test course'
};


beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);
});

// Clear test data after each test
afterEach(async () => {
  await User.deleteMany({});
  await Course.deleteMany({});
  await Evaluation.deleteMany({});
  await Response.deleteMany({});
});

// Close database connection after all tests
afterAll(async () => {
  await mongoose.connection.close();
});

describe('UAT - Evaluation System', () => {

  // UAT-1: Create Evaluation
  describe('UAT-1: Instructor Creates Evaluation', () => {
    test('Should allow instructor to create an evaluation', async () => {
      // Register and login as instructor
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

      // Create course
      const courseResponse = await instructorAgent
        .post('/api/courses')
        .send(testCourse);

      const courseId = courseResponse.body.course.id;

      // Create evaluation
      const evaluationData = {
        title: 'Mid-Term Evaluation',
        courseId: courseId,
        evaluationType: 'open',
        questions: [
          {
            questionText: 'Course content was well organized',
            questionType: 'rating',
            isRequired: true
          },
          {
            questionText: 'What did you like most?',
            questionType: 'text',
            isRequired: true
          }
        ],
        startDate: '2024-11-01T00:00:00.000Z',
        endDate: '2025-12-31T23:59:59.000Z'
      };

      const response = await instructorAgent
        .post('/api/evaluations')
        .send(evaluationData);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Evaluation created successfully');
      expect(response.body.evaluation.title).toBe('Mid-Term Evaluation');
      expect(response.body.evaluation.evaluationType).toBe('open');
      expect(response.body.evaluation.questions).toHaveLength(2);

      // Verify in database
      const evalInDb = await Evaluation.findById(response.body.evaluation._id);
      expect(evalInDb).toBeTruthy();
    });
  });

  // UAT-2: Student Submits Response
  describe('UAT-2: Student Submits Evaluation Response', () => {
    test('Should allow enrolled student to submit response', async () => {
      // Setup: Create instructor, course, and evaluation
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

      const evaluationData = {
        title: 'Test Evaluation',
        courseId: courseId,
        evaluationType: 'open',
        questions: [
          {
            questionText: 'Rate the course',
            questionType: 'rating',
            isRequired: true
          }
        ],
        startDate: '2024-11-01T00:00:00.000Z',
        endDate: '2025-12-31T23:59:59.000Z'
      };

      const evalResponse = await instructorAgent
        .post('/api/evaluations')
        .send(evaluationData);

      const evaluationId = evalResponse.body.evaluation._id;
      const questionId = evalResponse.body.evaluation.questions[0]._id;

      // Register and enroll student
      await request(app)
        .post('/api/auth/register')
        .send(testStudent);

      // Enroll student in course (as admin)
      const adminData = {
        email: 'testadmin@test.com',
        password: 'testpass123',
        role: 'admin'
      };

      await request(app)
        .post('/api/auth/register')
        .send(adminData);

      const adminAgent = request.agent(app);
      await adminAgent
        .post('/api/auth/login')
        .send({
          email: adminData.email,
          password: adminData.password
        });

      await adminAgent
        .post(`/api/courses/${courseId}/enroll`)
        .send({ studentEmail: testStudent.email });

      // Student submits response
      const studentAgent = request.agent(app);
      await studentAgent
        .post('/api/auth/login')
        .send({
          email: testStudent.email,
          password: testStudent.password
        });

      const submitData = {
        answers: [
          {
            questionId: questionId,
            questionText: 'Rate the course',
            questionType: 'rating',
            answerValue: '5'
          }
        ]
      };

      const submitResponse = await studentAgent
        .post(`/api/evaluations/${evaluationId}/submit`)
        .send(submitData);

      expect(submitResponse.status).toBe(201);
      expect(submitResponse.body.message).toBe('Response submitted successfully');

      // Verify in database
      const responseInDb = await Response.findOne({ evaluation: evaluationId });
      expect(responseInDb).toBeTruthy();
      expect(responseInDb.answers).toHaveLength(1);
    });
  });

  // UAT-3: View Evaluations by Role
  describe('UAT-3: View Evaluations Based on Role', () => {
    test('Students should only see evaluations for enrolled courses', async () => {
      // Create instructor and course
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

      // Create evaluation
      const evaluationData = {
        title: 'Test Evaluation',
        courseId: courseId,
        evaluationType: 'open',
        questions: [
          {
            questionText: 'Test question',
            questionType: 'rating',
            isRequired: true
          }
        ],
        startDate: '2024-11-01T00:00:00.000Z',
        endDate: '2025-12-31T23:59:59.000Z'
      };

      await instructorAgent
        .post('/api/evaluations')
        .send(evaluationData);

      // Register student (not enrolled)
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

      // Student should see no evaluations (not enrolled)
      const response = await studentAgent.get('/api/evaluations');
      expect(response.status).toBe(200);
      expect(response.body.count).toBe(0);
    });
  });

  // UAT-4: Anonymous Evaluation
  describe('UAT-4: Anonymous Evaluation Response', () => {
    test('Anonymous responses should not store student information', async () => {
      
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

      // Create ANONYMOUS evaluation
      const evaluationData = {
        title: 'Anonymous Evaluation',
        courseId: courseId,
        evaluationType: 'anonymous',
        questions: [
          {
            questionText: 'Rate anonymously',
            questionType: 'rating',
            isRequired: true
          }
        ],
        startDate: '2024-11-01T00:00:00.000Z',
        endDate: '2025-12-31T23:59:59.000Z'
      };

      const evalResponse = await instructorAgent
        .post('/api/evaluations')
        .send(evaluationData);

      const evaluationId = evalResponse.body.evaluation._id;
      const questionId = evalResponse.body.evaluation.questions[0]._id;

      // Register and enroll student
      await request(app)
        .post('/api/auth/register')
        .send(testStudent);

      const adminData = {
        email: 'testadmin@test.com',
        password: 'testpass123',
        role: 'admin'
      };

      await request(app)
        .post('/api/auth/register')
        .send(adminData);

      const adminAgent = request.agent(app);
      await adminAgent
        .post('/api/auth/login')
        .send({
          email: adminData.email,
          password: adminData.password
        });

      await adminAgent
        .post(`/api/courses/${courseId}/enroll`)
        .send({ studentEmail: testStudent.email });

      // Student submits anonymous response
      const studentAgent = request.agent(app);
      await studentAgent
        .post('/api/auth/login')
        .send({
          email: testStudent.email,
          password: testStudent.password
        });

      const submitData = {
        answers: [
          {
            questionId: questionId,
            questionText: 'Rate anonymously',
            questionType: 'rating',
            answerValue: '4'
          }
        ]
      };

      await studentAgent
        .post(`/api/evaluations/${evaluationId}/submit`)
        .send(submitData);

      // Check response in database
      const responseInDb = await Response.findOne({ evaluation: evaluationId });
      expect(responseInDb.isAnonymous).toBe(true);
      expect(responseInDb.student).toBeNull(); // Student should be null
    });
  });

  // UAT-5: View Results
  describe('UAT-5: Instructor Views Evaluation Results', () => {
    test('Instructor should be able to view results with statistics', async () => {
      // Setup
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

      const evaluationData = {
        title: 'Test Evaluation',
        courseId: courseId,
        evaluationType: 'open',
        questions: [
          {
            questionText: 'Rate the course',
            questionType: 'rating',
            isRequired: true
          }
        ],
        startDate: '2024-11-01T00:00:00.000Z',
        endDate: '2025-12-31T23:59:59.000Z'
      };

      const evalResponse = await instructorAgent
        .post('/api/evaluations')
        .send(evaluationData);

      const evaluationId = evalResponse.body.evaluation._id;
      const questionId = evalResponse.body.evaluation.questions[0]._id;

      // Register and enroll student
      await request(app)
        .post('/api/auth/register')
        .send(testStudent);

      const adminData = {
        email: 'testadmin@test.com',
        password: 'testpass123',
        role: 'admin'
      };

      await request(app)
        .post('/api/auth/register')
        .send(adminData);

      const adminAgent = request.agent(app);
      await adminAgent
        .post('/api/auth/login')
        .send({
          email: adminData.email,
          password: adminData.password
        });

      await adminAgent
        .post(`/api/courses/${courseId}/enroll`)
        .send({ studentEmail: testStudent.email });

      // Student submits response
      const studentAgent = request.agent(app);
      await studentAgent
        .post('/api/auth/login')
        .send({
          email: testStudent.email,
          password: testStudent.password
        });

      const submitData = {
        answers: [
          {
            questionId: questionId,
            questionText: 'Rate the course',
            questionType: 'rating',
            answerValue: '5'
          }
        ]
      };

      await studentAgent
        .post(`/api/evaluations/${evaluationId}/submit`)
        .send(submitData);

      // Instructor views results
      const resultsResponse = await instructorAgent
        .get(`/api/evaluations/${evaluationId}/results`);

      expect(resultsResponse.status).toBe(200);
      expect(resultsResponse.body.totalResponses).toBe(1);
      expect(resultsResponse.body.responses).toHaveLength(1);
      expect(resultsResponse.body.statistics).toBeDefined();
    });
  });

  // UAT-6: Prevent Duplicate Submissions
  describe('UAT-6: Prevent Duplicate Response Submissions', () => {
    test('Should prevent student from submitting twice', async () => {
      // Setup
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

      const evaluationData = {
        title: 'Test Evaluation',
        courseId: courseId,
        evaluationType: 'open',
        questions: [
          {
            questionText: 'Rate the course',
            questionType: 'rating',
            isRequired: true
          }
        ],
        startDate: '2024-11-01T00:00:00.000Z',
        endDate: '2025-12-31T23:59:59.000Z'
      };

      const evalResponse = await instructorAgent
        .post('/api/evaluations')
        .send(evaluationData);

      const evaluationId = evalResponse.body.evaluation._id;
      const questionId = evalResponse.body.evaluation.questions[0]._id;

      // Register and enroll student
      await request(app)
        .post('/api/auth/register')
        .send(testStudent);

      const adminData = {
        email: 'testadmin@test.com',
        password: 'testpass123',
        role: 'admin'
      };

      await request(app)
        .post('/api/auth/register')
        .send(adminData);

      const adminAgent = request.agent(app);
      await adminAgent
        .post('/api/auth/login')
        .send({
          email: adminData.email,
          password: adminData.password
        });

      await adminAgent
        .post(`/api/courses/${courseId}/enroll`)
        .send({ studentEmail: testStudent.email });

      // Student submits first response
      const studentAgent = request.agent(app);
      await studentAgent
        .post('/api/auth/login')
        .send({
          email: testStudent.email,
          password: testStudent.password
        });

      const submitData = {
        answers: [
          {
            questionId: questionId,
            questionText: 'Rate the course',
            questionType: 'rating',
            answerValue: '5'
          }
        ]
      };

      await studentAgent
        .post(`/api/evaluations/${evaluationId}/submit`)
        .send(submitData);

      // Try to submit again (should fail)
      const duplicateResponse = await studentAgent
        .post(`/api/evaluations/${evaluationId}/submit`)
        .send(submitData);

      expect(duplicateResponse.status).toBe(400);
      expect(duplicateResponse.body.message).toBe('You have already submitted a response for this evaluation');
    });
  });

});