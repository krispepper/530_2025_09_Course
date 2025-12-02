const express = require("express");
const router = express.Router();
const taskService = require("./services/taskService");
const feedbackService = require("./services/courseFeedbackService");
const { ServiceError } = require("./utils/serviceError");

function handleError(res, err) {
    if (err instanceof ServiceError) {
        return res.status(err.statusCode).json({ error: err.message });
    }
    console.error(err);
    return res.status(500).json({ error: "Database error" });
}

router.get("/tasks", async (req, res) => {
    try {
        const tasks = await taskService.listTasks();
        res.json(tasks);
    } catch (err) {
        handleError(res, err);
    }
});

router.post("/tasks", async (req, res) => {
    try {
        const created = await taskService.createTask(req.body || {});
        res.status(201).json(created);
    } catch (err) {
        handleError(res, err);
    }
});

router.put("/tasks/:id", async (req, res) => {
    try {
        const updated = await taskService.updateTask(req.params.id, req.body || {});
        if (!updated) {
            return res.status(404).json({ error: "Task not found" });
        }
        res.json(updated);
    } catch (err) {
        handleError(res, err);
    }
});

router.delete("/tasks/:id", async (req, res) => {
    try {
        const removed = await taskService.deleteTask(req.params.id);
        if (!removed) {
            return res.status(404).json({ error: "Task not found" });
        }
        res.status(204).send();
    } catch (err) {
        handleError(res, err);
    }
});

router.post("/feedback", async (req, res) => {
    try {
        const created = await feedbackService.submitFeedback(req.body || {});
        res.status(201).json(created);
    } catch (err) {
        handleError(res, err);
    }
});

router.get("/feedback", async (req, res) => {
    try {
        const filters = {};
        if (req.query?.courseId) filters.courseId = req.query.courseId;
        if (req.query?.studentId) filters.studentId = req.query.studentId;
        const feedback = await feedbackService.listFeedback(filters);
        res.json(feedback);
    } catch (err) {
        handleError(res, err);
    }
});

router.get("/feedback/summary", async (req, res) => {
    try {
        const summary = await feedbackService.getFeedbackSummary(req.query?.courseId);
        res.json(summary);
    } catch (err) {
        handleError(res, err);
    }
});

module.exports = router;
