// Central MongoDB connector plus seed routines for tasks and feedback datasets.
const { MongoClient } = require("mongodb");
require("dotenv").config();

const uri =
    process.env.NODE_ENV === "test" && process.env.MONGO_URI_DEV
        ? process.env.MONGO_URI_DEV
        : process.env.MONGO_URI;

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
let db;

const INITIAL_TASKS = [
    { title: "Design Sprint 1 diagrams", status: "in-progress" },
    { title: "Implement Hello World prototype", status: "done" }
];

const INITIAL_FEEDBACK = [
    {
        courseId: "CS101",
        studentId: "s-001",
        rating: 5,
        comments: "Great intro course!"
    },
    {
        courseId: "CS201",
        studentId: "s-002",
        rating: 4,
        comments: "Challenging but rewarding."
    }
];

async function seedTasks() {
    const tasks = db.collection("tasks");
    const count = await tasks.countDocuments();
    if (count === 0) {
        await tasks.insertMany(INITIAL_TASKS);
    }
}

async function seedFeedback() {
    const feedback = db.collection("feedback");
    const count = await feedback.countDocuments();
    await feedback.createIndex({ courseId: 1 });
    await feedback.createIndex({ studentId: 1 });
    if (count === 0) {
        const docs = INITIAL_FEEDBACK.map(entry => ({
            ...entry,
            createdAt: new Date()
        }));
        await feedback.insertMany(docs);
    }
}

async function connectDB() {
    try {
        await client.connect();
        db = client.db();
        console.log(`MongoDB connected (${uri})`);

        await Promise.all([seedTasks(), seedFeedback()]);
    } catch (err) {
        console.error("MongoDB connection error:", err);
        throw err;
    }
}

function getDB() {
    if (!db) throw new Error("Database not connected");
    return db;
}

async function closeDB() {
    if (!client) return;
    try {
        await client.close();
    } catch (err) {
        if (err.name !== "MongoTopologyClosedError") {
            throw err;
        }
    } finally {
        db = undefined;
    }
}

module.exports = { connectDB, getDB, closeDB };
