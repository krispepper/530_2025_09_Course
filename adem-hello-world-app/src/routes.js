const express = require("express");
const router = express.Router();
const { getDB } = require("./db");

router.get("/tasks", async (req, res) => {
    try {
        const db = getDB();
        const tasks = await db.collection("tasks").find().toArray();
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: "Database error" });
    }
});

module.exports = router;