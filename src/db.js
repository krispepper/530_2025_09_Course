const { MongoClient } = require("mongodb");
require("dotenv").config();

const uri =
    process.env.NODE_ENV === "test" && process.env.MONGO_URI_DEV
        ? process.env.MONGO_URI_DEV
        : process.env.MONGO_URI;

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
let db;

async function connectDB() {
    try {
        await client.connect();
        db = client.db();
        console.log(`MongoDB connected (${uri})`);

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
