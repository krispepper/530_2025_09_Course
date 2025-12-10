// Service layer encapsulating CRUD logic for sprint tasks collection.
const { ObjectId } = require("mongodb");
const { getDB } = require("../db");
const { ServiceError } = require("../utils/serviceError");

const VALID_STATUSES = new Set(["todo", "in-progress", "done"]);

const normalizeTask = task => ({
    _id: task._id?.toString(),
    title: task.title,
    status: task.status || "todo"
});

function getCollection() {
    return getDB().collection("tasks");
}

function buildIdFilters(id) {
    const filters = [];
    if (ObjectId.isValid(id)) {
        filters.push({ _id: new ObjectId(id) });
    }
    filters.push({ _id: id });
    return filters;
}

function validateStatus(status) {
    if (status && !VALID_STATUSES.has(status)) {
        throw new ServiceError("Invalid status", 400);
    }
}

function validateTitle(title, { required } = { required: true }) {
    if (!title && required) {
        throw new ServiceError("Title is required", 400);
    }
    if (title && typeof title !== "string") {
        throw new ServiceError("Title must be a string", 400);
    }
}

async function listTasks() {
    const tasks = await getCollection().find().toArray();
    return tasks.map(normalizeTask);
}

async function createTask({ title, status = "todo" } = {}) {
    validateTitle(title);
    validateStatus(status);

    const doc = {
        title: title.trim(),
        status
    };

    const collection = getCollection();
    const result = await collection.insertOne(doc);
    const created = await collection.findOne({ _id: result.insertedId });
    return normalizeTask(created);
}

async function updateTask(id, { title, status } = {}) {
    if (!title && !status) {
        throw new ServiceError("Nothing to update", 400);
    }
    validateTitle(title, { required: false });
    validateStatus(status);

    const updates = {};
    if (title) updates.title = title.trim();
    if (status) updates.status = status;

    const result = await getCollection().findOneAndUpdate(
        { $or: buildIdFilters(id) },
        { $set: updates },
        { returnDocument: "after" }
    );

    const updatedDoc = result?.value ?? result;
    return updatedDoc ? normalizeTask(updatedDoc) : null;
}

async function deleteTask(id) {
    const result = await getCollection().deleteOne({ $or: buildIdFilters(id) });
    return result.deletedCount > 0;
}

module.exports = {
    createTask,
    deleteTask,
    listTasks,
    normalizeTask,
    updateTask,
    VALID_STATUSES
};
