const { MongoClient } = require("mongodb");
require("dotenv").config();

let db;

async function seedFeedback(targetDb) {
  const feedback = targetDb.collection("feedback");
  const count = await feedback.countDocuments();
  if (count === 0) {
    await feedback.insertMany([
      { courseId: "CS101", studentId: "s-001", rating: 5, comments: "Great intro course!", createdAt: new Date() },
      { courseId: "CS201", studentId: "s-002", rating: 4, comments: "Challenging but rewarding.", createdAt: new Date() }
    ]);
  }
}

async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGO_URI is not set. Provide a valid MongoDB connection string.");
  }

  const explicitDb = process.env.MONGO_DB_NAME && process.env.MONGO_DB_NAME.trim();
  const inferredDb = (() => {
    try {
      const u = new URL(uri);
      const path = (u.pathname || "").replace(/^\//, "");
      return path || null;
    } catch (_) {
      return null;
    }
  })();
  const dbName = explicitDb || inferredDb;

  if (!dbName) {
    throw new Error("No database name provided. Set MONGO_DB_NAME or include '/<db>' at the end of MONGO_URI.");
  }

  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
  try {
    await client.connect();
    db = client.db(dbName);
    console.log(`MongoDB connected (db: ${dbName})`);
    await seedFeedback(db);
  } catch (err) {
    console.error("MongoDB connection error:", err);
    throw err;
  }
}

function getDB() {
  if (!db) throw new Error("Database not connected");
  return db;
}

module.exports = { connectDB, getDB };
