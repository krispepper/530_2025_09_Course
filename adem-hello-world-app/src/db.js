const { MongoClient } = require("mongodb");
require("dotenv").config();

const client = new MongoClient(process.env.MONGO_URI);
let db;

async function connectDB() {
    try {
        await client.connect();
        db = client.db();
        console.log("MongoDB connected");

        const tasks = db.collection("tasks");
        const count = await tasks.countDocuments();
        if (count === 0) {
            await tasks.insertMany([
                { title: "Design Sprint 1 diagrams", status: "in-progress" },
                { title: "Implement Hello World prototype", status: "done" }
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
