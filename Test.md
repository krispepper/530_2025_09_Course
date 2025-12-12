# Backend Testing Instructions - Sunny's Part

## Quick Start

1. SSH into server:
```
   ssh sunnyrishyvardhanb@compsci
```

2. Navigate to project:
```
   cd ~/530_2025_09_Course
   git checkout sunny-works
```

3. Start backend server:
```
   node server.js
```

   Expected output:
   - "Server running on http://localhost:3001"
   - "MongoDB Connected Successfully"

## Testing Options

### Run Automated Tests 
```
npm test
```

**Expected Result:** 25 tests pass
- 13 Authentication tests
- 6 Course Management tests
- 6 Evaluation System tests

### Manual API Testing

In a separate terminal, test the API:

**Register a user:**
```
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@test.com","password":"pass123","role":"student"}'
```

**Login:**
```
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@test.com","password":"pass123"}'
```

### Option 3: Check Database
```
mongosh
use fall2025_530_conf_dev
show collections
db.users.find()
db.courses.find()
db.evaluations.find()
db.responses.find()
exit
```

## Features Implemented

### 1. User Authentication
- User registration with email, password, and role (student/instructor/admin)
- Login with session management
- Password hashing with bcrypt
- Logout functionality
- Role-based access control

### 2. Course Management
- Instructors can create courses
- Admins can enroll students in courses
- Students view only enrolled courses
- Instructors view only their courses
- Admins view all courses
- Update and delete course functionality

### 3. Evaluation System
- Create evaluations with rating and text questions
- Open evaluations (student identity visible)
- Anonymous evaluations (student identity hidden)
- Students submit responses (one per evaluation)
- Prevent duplicate submissions
- Date range validation (start/end dates)
- View results with statistics
- Calculate average ratings and distributions

## API Endpoints

### Authentication
- POST /api/auth/register - Register new user
- POST /api/auth/login - Login user
- POST /api/auth/logout - Logout user
- GET /api/auth/me - Get current user info

### Courses
- POST /api/courses - Create course (instructor/admin)
- GET /api/courses - Get courses (role-based filtering)
- GET /api/courses/:id - Get single course
- PUT /api/courses/:id - Update course
- DELETE /api/courses/:id - Delete course
- POST /api/courses/:id/enroll - Enroll student (admin)
- POST /api/courses/:id/remove - Remove student (admin)

### Evaluations
- POST /api/evaluations - Create evaluation (instructor/admin)
- GET /api/evaluations - Get evaluations (role-based)
- GET /api/evaluations/:id - Get single evaluation
- PUT /api/evaluations/:id - Update evaluation
- DELETE /api/evaluations/:id - Delete evaluation
- POST /api/evaluations/:id/submit - Submit response (student)
- GET /api/evaluations/:id/results - View results (instructor/admin)

## Database

**Database Name:** fall2025_530_conf_dev

**Collections:**
- users - User accounts with authentication
- courses - Course information and enrollments
- evaluations - Evaluation templates with questions
- responses - Student responses to evaluations


## Technical Stack

- Node.js & Express.js - Backend framework
- MongoDB - Database
- Mongoose - ODM
- bcryptjs - Password hashing
- express-session - Session management
- Jest & Supertest - Testing framework


Server Location: sunnyrishyvardhanb@compsci:~/530_2025_09_Course
Branch: sunny-works
Database: fall2025_530_conf_dev
Start Command: node server.js
Test Command: npm test
API URL: http://localhost:5000
