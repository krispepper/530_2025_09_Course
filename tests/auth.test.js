const request = require('supertest');
const mongoose = require('mongoose');
const dotenv = require('dotenv');


dotenv.config();

const express = require('express');
const session = require('express-session');
const User = require('../models/User');

const app = express();
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));
app.use('/api/auth', require('../routes/auth'));

// Test data
const testUser = {
  email: 'teststudent@test.com',
  password: 'testpass123',
  role: 'student'
};

const testInstructor = {
  email: 'testinstructor@test.com',
  password: 'testpass123',
  role: 'instructor'
};

// Connect to test database before tests
beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);
});

// Clear test data after each test
afterEach(async () => {
  await User.deleteMany({ email: { $regex: /^test/ } });
});

// Close database connection
afterAll(async () => {
  await mongoose.connection.close();
});

describe('UAT - User Authentication', () => {
  
  // UAT-1: user registration
  describe('UAT-1: User Registration', () => {
    test('Should register a new student successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user.role).toBe(testUser.role);
      
      // verify user is in database
      const userInDb = await User.findOne({ email: testUser.email });
      expect(userInDb).toBeTruthy();
      expect(userInDb.password).not.toBe(testUser.password); // password should be hashed
    });

    test('Should register instructor and admin roles', async () => {
      const instructor = await request(app)
        .post('/api/auth/register')
        .send(testInstructor);

      const admin = await request(app)
        .post('/api/auth/register')
        .send({ email: 'testadmin@test.com', password: 'test123', role: 'admin' });

      expect(instructor.status).toBe(201);
      expect(admin.status).toBe(201);
    });
  });

  // UAT-2: user login
  describe('UAT-2: User Login', () => {
    test('Should login with correct credentials', async () => {
      // first register
      await request(app)
        .post('/api/auth/register')
        .send(testUser);

      // login
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user.role).toBe(testUser.role);
    });
  });

  // UAT-3: login with wrong Password
  describe('UAT-3: Login with Wrong Password', () => {
    test('Should fail login with incorrect password', async () => {
      // first register
      await request(app)
        .post('/api/auth/register')
        .send(testUser);

      // Try login with wrong password
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid email or password');
    });

    test('Should fail login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'somepassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid email or password');
    });
  });

  // UAT-4: duplicate Registration
  describe('UAT-4: Duplicate Registration', () => {
    test('Should prevent duplicate email registration', async () => {
      // register first time
      await request(app)
        .post('/api/auth/register')
        .send(testUser);

      // Try to register again with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('User with this email already exists');
    });
  });

  // UAT-5: get current user Info
  describe('UAT-5: Get Current User Info', () => {
    test('Should return user info when logged in', async () => {
      // register and login
      await request(app)
        .post('/api/auth/register')
        .send(testUser);

      const agent = request.agent(app); // Use agent to maintain session
      
      await agent
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      // get user info
      const response = await agent.get('/api/auth/me');

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user.role).toBe(testUser.role);
    });

    test('Should fail when not logged in', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Not authenticated');
    });
  });

  // UAT-6: logout
  describe('UAT-6: Logout', () => {
    test('Should logout successfully and destroy session', async () => {
      // register and login
      await request(app)
        .post('/api/auth/register')
        .send(testUser);

      const agent = request.agent(app);
      
      await agent
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      // logout
      const logoutResponse = await agent.post('/api/auth/logout');
      expect(logoutResponse.status).toBe(200);
      expect(logoutResponse.body.message).toBe('Logout successful');

      // Try to access protected route after logout
      const meResponse = await agent.get('/api/auth/me');
      expect(meResponse.status).toBe(401);
    });
  });

  describe('UAT-7: Role-Based Registration', () => {
  test('Should register users with all three roles correctly', async () => {
    const student = await request(app)
      .post('/api/auth/register')
      .send({ email: 'teststudent2@test.com', password: 'test123', role: 'student' });

    const instructor = await request(app)
      .post('/api/auth/register')
      .send({ email: 'testinstructor2@test.com', password: 'test123', role: 'instructor' });

    const admin = await request(app)
      .post('/api/auth/register')
      .send({ email: 'testadmin2@test.com', password: 'test123', role: 'admin' });

    expect(student.status).toBe(201);
    expect(student.body.user.role).toBe('student');
    
    expect(instructor.status).toBe(201);
    expect(instructor.body.user.role).toBe('instructor');
    
    expect(admin.status).toBe(201);
    expect(admin.body.user.role).toBe('admin');

    // verify in database
    const studentInDb = await User.findOne({ email: 'teststudent2@test.com' });
    const instructorInDb = await User.findOne({ email: 'testinstructor2@test.com' });
    const adminInDb = await User.findOne({ email: 'testadmin2@test.com' });

    expect(studentInDb.role).toBe('student');
    expect(instructorInDb.role).toBe('instructor');
    expect(adminInDb.role).toBe('admin');
  });
});
  // additional validation tests
  describe('UAT-8: Input Validation', () => {
    test('Should fail registration without email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ password: 'test123', role: 'student' });

      expect(response.status).toBe(400);
    });

    test('Should fail registration without password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@test.com', role: 'student' });

      expect(response.status).toBe(400);
    });

    test('Should fail registration without role', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@test.com', password: 'test123' });

      expect(response.status).toBe(400);
    });
  });

});
