(This is for my reference only)
# Course Evaluation System - Backend API
### Prerequisites
- Node.js installed
- MongoDB Atlas account (cloud database)

### Steps to Start
1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   - Create a `.env` file in the root directory
   - Add the following:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_atlas_connection_string
   SESSION_SECRET=your_secret_key
   ```

3. **Start the server:**
   ```bash
   npm run dev
   ```

4. **You should see:**
   ```
   🚀 Server running on http://localhost:5000
   ✅ MongoDB Connected Successfully
   ```

---

## 🧪 Testing with Postman

### Base URL
```
http://localhost:5000
```

---

## 📡 Available API Endpoints

### 1. Health Check
**Check if API is running**

- **Method:** `GET`
- **Endpoint:** `/`
- **Body:** None

**Response:**
```json
{
  "message": "Course Evaluation API is running!"
}
```

---

### 2. Register a New User
**Create a new user account**

- **Method:** `POST`
- **Endpoint:** `/api/auth/register`
- **Headers:** 
  - `Content-Type: application/json`
- **Body (raw JSON):**
```json
{
  "email": "student@example.com",
  "password": "password123",
  "role": "student"
}
```

**Roles:** `student`, `instructor`, or `admin`

**Success Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "student@example.com",
    "role": "student"
  }
}
```

**Error Response (400):**
```json
{
  "message": "User with this email already exists"
}
```

---

### 3. Login
**Login with existing credentials**

- **Method:** `POST`
- **Endpoint:** `/api/auth/login`
- **Headers:** 
  - `Content-Type: application/json`
- **Body (raw JSON):**
```json
{
  "email": "student@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "student@example.com",
    "role": "student"
  }
}
```

**Error Response (401):**
```json
{
  "message": "Invalid email or password"
}
```

**Note:** This creates a session cookie that will be automatically used in subsequent requests.

---

### 4. Get Current User Info
**Get information about the logged-in user**

- **Method:** `GET`
- **Endpoint:** `/api/auth/me`
- **Body:** None
- **Requires:** Must be logged in (session cookie)

**Success Response (200):**
```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "student@example.com",
    "role": "student"
  }
}
```

**Error Response (401):**
```json
{
  "message": "Not authenticated"
}
```

---

### 5. Logout
**Logout and destroy session**

- **Method:** `POST`
- **Endpoint:** `/api/auth/logout`
- **Body:** None
- **Requires:** Must be logged in

**Success Response (200):**
```json
{
  "message": "Logout successful"
}
```

---

## 📝 Postman Testing Guide

### Step-by-Step Testing Flow

#### **Step 1: Health Check**
1. Open Postman
2. Create new request
3. Set method to `GET`
4. Enter URL: `http://localhost:5000/`
5. Click **Send**
6. Should see: "Course Evaluation API is running!"

#### **Step 2: Register a User**
1. Create new request
2. Set method to `POST`
3. Enter URL: `http://localhost:5000/api/auth/register`
4. Go to **Body** tab
5. Select **raw** and **JSON**
6. Paste:
   ```json
   {
     "email": "test@example.com",
     "password": "password123",
     "role": "student"
   }
   ```
7. Click **Send**
8. Should see success message with user details

#### **Step 3: Login**
1. Create new request
2. Set method to `POST`
3. Enter URL: `http://localhost:5000/api/auth/login`
4. Body → raw → JSON:
   ```json
   {
     "email": "test@example.com",
     "password": "password123"
   }
   ```
5. Click **Send**
6. Session cookie is automatically saved

#### **Step 4: Get Current User**
1. Create new request
2. Set method to `GET`
3. Enter URL: `http://localhost:5000/api/auth/me`
4. Click **Send**
5. Should return logged-in user info

#### **Step 5: Logout**
1. Create new request
2. Set method to `POST`
3. Enter URL: `http://localhost:5000/api/auth/logout`
4. Click **Send**
5. Session is destroyed

#### **Step 6: Verify Logout**
1. Try Step 4 again (Get Current User)
2. Should get "Not authenticated" error

---

## 💾 How Data is Stored in MongoDB

### Database Structure

```
MongoDB Atlas (Cloud)
└── course-evaluation (Database)
    └── users (Collection)
        ├── User Document 1
        ├── User Document 2
        └── User Document 3
```

### User Document Structure

When you register a user, data is stored like this:

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "email": "student@example.com",
  "password": "$2a$10$hashed_password_here",
  "role": "student",
  "createdAt": "2024-11-26T10:30:00.000Z",
  "updatedAt": "2024-11-26T10:30:00.000Z"
}
```

### Key Points:

1. **Database Name:** `course-evaluation`
2. **Collection Name:** `users` (like a table in SQL)
3. **Password:** Hashed using bcrypt (NOT stored as plain text)
4. **Unique Fields:** Email (cannot have duplicate emails)
5. **Timestamps:** Automatically added (createdAt, updatedAt)

---

## 🔍 How to View Data in MongoDB Atlas

### Method 1: MongoDB Atlas Web Interface

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Login to your account
3. Click on your cluster (e.g., "prac-cluster")
4. Click **"Browse Collections"** button
5. You'll see:
   - Database: `course-evaluation`
   - Collection: `users`
6. Click on `users` to see all registered users
7. Each row is a user document with email, hashed password, and role

### Method 2: MongoDB Compass (GUI Tool)

1. Download [MongoDB Compass](https://www.mongodb.com/try/download/compass)
2. Open Compass
3. Connect using your connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/
   ```
4. Navigate to `course-evaluation` → `users`
5. View all user documents

### Method 3: Command Line (mongosh)

```bash
mongosh "your_connection_string"
use course-evaluation
db.users.find().pretty()
```

---

## 🧪 Test Scenarios

### Scenario 1: Successful Registration and Login
```
1. Register → POST /api/auth/register (201 Created)
2. Login → POST /api/auth/login (200 OK)
3. Get User Info → GET /api/auth/me (200 OK)
4. Logout → POST /api/auth/logout (200 OK)
```

### Scenario 2: Duplicate Registration (Should Fail)
```
1. Register user@test.com → Success (201)
2. Register user@test.com again → Error (400)
   Response: "User with this email already exists"
```

### Scenario 3: Wrong Password (Should Fail)
```
1. Register user@test.com with password "abc123"
2. Login with password "wrong" → Error (401)
   Response: "Invalid email or password"
```

### Scenario 4: Access Protected Route Without Login
```
1. GET /api/auth/me (without logging in) → Error (401)
   Response: "Not authenticated"
```

---

## 🔐 Security Features

- ✅ **Password Hashing:** Passwords are hashed using bcrypt (never stored as plain text)
- ✅ **Session Management:** Uses express-session for secure login sessions
- ✅ **Input Validation:** Checks for required fields (email, password, role)
- ✅ **Duplicate Prevention:** Cannot register same email twice
- ✅ **Role-Based System:** Supports student, instructor, and admin roles

--

## 📊 Testing

Run automated tests:
```bash
npm test
```

This runs 13 UAT (User Acceptance Tests) covering:
- User registration
- User login
- Password validation
- Duplicate prevention
- Session management
- Role-based registration


---

---

## 📝 License

This project is for educational purposes.
