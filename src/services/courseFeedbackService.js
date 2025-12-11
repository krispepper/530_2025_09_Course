// Service layer that encapsulates all course feedback CRUD + summary operations.
const { getDB } = require("../db");
const { ServiceError } = require("../utils/serviceError");

const COLLECTION = "feedback";
const RATING_MIN = 1;
const RATING_MAX = 5;

const normalizeFeedback = doc => ({
    _id: doc._id?.toString(),
    courseId: doc.courseId,
    studentId: doc.studentId,
    rating: doc.rating,
    comments: doc.comments || "",
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : undefined
});

function getCollection() {
    return getDB().collection(COLLECTION);
}

function validateFeedbackInput({ courseId, studentId, rating, comments }) {
    if (!courseId || typeof courseId !== "string") {
        throw new ServiceError("courseId is required", 400);
    }
    if (!studentId || typeof studentId !== "string") {
        throw new ServiceError("studentId is required", 400);
    }
    if (typeof rating !== "number") {
        throw new ServiceError("rating must be a number", 400);
    }
    if (!Number.isInteger(rating) || rating < RATING_MIN || rating > RATING_MAX) {
        throw new ServiceError(`rating must be an integer between ${RATING_MIN} and ${RATING_MAX}`, 400);
    }
    if (comments && typeof comments !== "string") {
        throw new ServiceError("comments must be a string", 400);
    }
}

async function submitFeedback(payload = {}) {
    validateFeedbackInput(payload);

    const feedbackDoc = {
        courseId: payload.courseId.trim(),
        studentId: payload.studentId.trim(),
        rating: payload.rating,
        comments: (payload.comments || "").trim(),
        createdAt: new Date()
    };

    const collection = getCollection();
    const result = await collection.insertOne(feedbackDoc);
    feedbackDoc._id = result.insertedId;
    return normalizeFeedback(feedbackDoc);
}

function sanitizeOptionalString(value, fieldName) {
    if (value === undefined || value === null || value === "") {
        return undefined;
    }
    if (typeof value !== "string") {
        throw new ServiceError(`${fieldName} must be a string`, 400);
    }
    const trimmed = value.trim();
    return trimmed || undefined;
}

function buildFeedbackQuery(filters = {}) {
    const query = {};
    const courseId = sanitizeOptionalString(filters.courseId, "courseId");
    if (courseId) query.courseId = courseId;
    const studentId = sanitizeOptionalString(filters.studentId, "studentId");
    if (studentId) query.studentId = studentId;
    return query;
}

async function listFeedback(filters = {}) {
    const query = buildFeedbackQuery(filters);

    const docs = await getCollection()
        .find(query)
        .sort({ createdAt: -1 })
        .toArray();
    return docs.map(normalizeFeedback);
}

function buildEmptyDistribution() {
    const distribution = {};
    for (let rating = RATING_MIN; rating <= RATING_MAX; rating += 1) {
        distribution[rating] = 0;
    }
    return distribution;
}

function buildSummaryRow(row) {
    const distributionCounts = buildEmptyDistribution();
    (row.ratings || []).forEach(rating => {
        if (typeof rating === "number" && distributionCounts[rating] !== undefined) {
            distributionCounts[rating] += 1;
        }
    });

    const sortedLatest = [...(row.latest || [])]
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 3)
        .map(normalizeFeedback);

    return {
        courseId: row._id,
        totalResponses: row.totalResponses,
        averageRating: Number((row.averageRating ?? 0).toFixed(2)),
        ratingsBreakdown: distributionCounts,
        latestFeedback: sortedLatest
    };
}

function buildSummaryPipeline(courseId) {
    const pipeline = [];
    if (courseId) {
        pipeline.push({ $match: { courseId } });
    }
    pipeline.push(
        { $sort: { createdAt: -1 } },
        {
            $group: {
                _id: "$courseId",
                totalResponses: { $sum: 1 },
                averageRating: { $avg: "$rating" },
                ratings: { $push: "$rating" },
                latest: {
                    $push: {
                        _id: "$_id",
                        courseId: "$courseId",
                        studentId: "$studentId",
                        rating: "$rating",
                        comments: "$comments",
                        createdAt: "$createdAt"
                    }
                }
            }
        },
        {
            $project: {
                _id: 1,
                totalResponses: 1,
                averageRating: 1,
                ratings: 1,
                latest: { $slice: ["$latest", 3] }
            }
        },
        { $sort: { _id: 1 } }
    );
    return pipeline;
}

async function getFeedbackSummary(courseId) {
    const normalizedCourseId = sanitizeOptionalString(courseId, "courseId");
    const pipeline = buildSummaryPipeline(normalizedCourseId);

    const summaryDocs = await getCollection().aggregate(pipeline).toArray();
    return summaryDocs.map(buildSummaryRow);
}

module.exports = {
    getFeedbackSummary,
    listFeedback,
    normalizeFeedback,
    submitFeedback
};
