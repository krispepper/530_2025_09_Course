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

    const doc = {
        courseId: payload.courseId.trim(),
        studentId: payload.studentId.trim(),
        rating: payload.rating,
        comments: (payload.comments || "").trim(),
        createdAt: new Date()
    };

    const collection = getCollection();
    const result = await collection.insertOne(doc);
    doc._id = result.insertedId;
    return normalizeFeedback(doc);
}

async function listFeedback(filters = {}) {
    const query = {};
    if (filters.courseId) query.courseId = filters.courseId;
    if (filters.studentId) query.studentId = filters.studentId;

    const docs = await getCollection()
        .find(query)
        .sort({ createdAt: -1 })
        .toArray();
    return docs.map(normalizeFeedback);
}

function buildEmptyDistribution() {
    const map = {};
    for (let rating = RATING_MIN; rating <= RATING_MAX; rating += 1) {
        map[rating] = 0;
    }
    return map;
}

function buildSummaryRow(row) {
    const counts = buildEmptyDistribution();
    (row.ratings || []).forEach(rating => {
        if (typeof rating === "number" && counts[rating] !== undefined) {
            counts[rating] += 1;
        }
    });

    const latest = [...(row.latest || [])]
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 3)
        .map(normalizeFeedback);

    return {
        courseId: row._id,
        totalResponses: row.totalResponses,
        averageRating: Number((row.averageRating ?? 0).toFixed(2)),
        ratingsBreakdown: counts,
        latestFeedback: latest
    };
}

async function getFeedbackSummary(courseId) {
    const matchStage = {};
    if (courseId) {
        matchStage.courseId = courseId;
    }

    const pipeline = [
        { $match: matchStage },
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
        { $sort: { _id: 1 } }
    ];

    const summaryDocs = await getCollection().aggregate(pipeline).toArray();
    return summaryDocs.map(buildSummaryRow);
}

module.exports = {
    getFeedbackSummary,
    listFeedback,
    normalizeFeedback,
    submitFeedback
};
