// Lightweight MongoDB helper used by legacy scripts to seed feedback entries.
const { MongoClient } = require("mongodb");
require("dotenv").config();

const client = new MongoClient(process.env.MONGO_URI);
let db;

async function connectDB() {
    try {
        await client.connect();
        db = client.db();
        console.log("MongoDB connected");

        const feedback = db.collection("feedback");
        const count = await feedback.countDocuments();
        if (count === 0) {
            await feedback.insertMany([
                {
                    courseId: "CS101",
                    studentId: "s-001",
                    rating: 5,
                    comments: "Great intro course!",
                    createdAt: new Date()
                },
                {
                    courseId: "CS201",
                    studentId: "s-002",
                    rating: 4,
                    comments: "Challenging but rewarding.",
                    createdAt: new Date()
                }
            ]);
        }
    } catch (err) {
        console.error("MongoDB connection error:", err);
    }
}

function getDB() {
    if (!db) throw new Error("Database not connected");
    return db;
}

module.exports = { connectDB, getDB };
