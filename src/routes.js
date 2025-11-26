const express = require("express");
const { ObjectId } = require("mongodb");
const router = express.Router();
const { getDB } = require("./db");

const VALID_STATUSES = new Set(["todo", "in-progress", "done"]);

const normalizeTask = (task) => ({
    _id: task._id?.toString(),
    title: task.title,
    status: task.status || "todo"
});

router.get("/tasks", async (req, res) => {
    try {
        const db = getDB();
        const tasks = await db.collection("tasks").find().toArray();
        res.json(tasks.map(normalizeTask));
    } catch (err) {
        res.status(500).json({ error: "Database error" });
    }
});

router.post("/tasks", async (req, res) => {
    try {
        const { title, status = "todo" } = req.body || {};
        if (!title || typeof title !== "string") {
            return res.status(400).json({ error: "Title is required" });
        }
        if (!VALID_STATUSES.has(status)) {
            return res.status(400).json({ error: "Invalid status" });
        }

        const db = getDB();
        const result = await db.collection("tasks").insertOne({ title, status });
        const created = await db.collection("tasks").findOne({ _id: result.insertedId });
        res.status(201).json(normalizeTask(created));
    } catch (err) {
        res.status(500).json({ error: "Database error" });
    }
});

router.put("/tasks/:id", async (req, res) => {
    const { id } = req.params;
    const { title, status } = req.body || {};

    if (!title && !status) {
        return res.status(400).json({ error: "Nothing to update" });
    }
    if (status && !VALID_STATUSES.has(status)) {
        return res.status(400).json({ error: "Invalid status" });
    }

    const filters = [];
    if (ObjectId.isValid(id)) {
        filters.push({ _id: new ObjectId(id) });
    }
    filters.push({ _id: id });

    try {
        const db = getDB();
        const updates = {};
        if (title) updates.title = title;
        if (status) updates.status = status;

        const result = await db.collection("tasks").findOneAndUpdate(
            { $or: filters },
            { $set: updates },
            { returnDocument: "after" }
        );

        // MongoDB driver v7 returns the document directly, older versions return { value, ... }
        const updatedDoc = result?.value ?? result;
        if (!updatedDoc) {
            return res.status(404).json({ error: "Task not found" });
        }

        res.json(normalizeTask(updatedDoc));
    } catch (err) {
        res.status(500).json({ error: "Database error" });
    }
});

router.delete("/tasks/:id", async (req, res) => {
    const { id } = req.params;

    const filters = [];
    if (ObjectId.isValid(id)) {
        filters.push({ _id: new ObjectId(id) });
    }
    filters.push({ _id: id });

    try {
        const db = getDB();
        const result = await db.collection("tasks").deleteOne({ $or: filters });
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: "Task not found" });
        }
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: "Database error" });
    }
});

module.exports = router;
