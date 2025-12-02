jest.mock("../src/db", () => ({
    getDB: jest.fn()
}));

const { getDB } = require("../src/db");
const {
    submitFeedback,
    listFeedback,
    getFeedbackSummary
} = require("../src/services/courseFeedbackService");

describe("courseFeedbackService", () => {
    let collection;

    beforeEach(() => {
        const cursor = {
            sort: jest.fn().mockReturnThis(),
            toArray: jest.fn().mockResolvedValue([])
        };

        collection = {
            insertOne: jest.fn().mockResolvedValue({ insertedId: "abc123" }),
            find: jest.fn(() => cursor),
            aggregate: jest.fn(() => ({
                toArray: jest.fn().mockResolvedValue([])
            }))
        };

        getDB.mockReturnValue({
            collection: () => collection
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("stores sanitized feedback entries", async () => {
        const payload = {
            courseId: " CS101 ",
            studentId: " s-001 ",
            rating: 5,
            comments: "Great!"
        };

        const result = await submitFeedback(payload);

        expect(collection.insertOne).toHaveBeenCalledTimes(1);
        const insertedDoc = collection.insertOne.mock.calls[0][0];
        expect(insertedDoc.courseId).toBe("CS101");
        expect(insertedDoc.studentId).toBe("s-001");
        expect(insertedDoc.createdAt).toBeInstanceOf(Date);
        expect(result).toMatchObject({
            _id: "abc123",
            courseId: "CS101",
            studentId: "s-001",
            rating: 5,
            comments: "Great!"
        });
        expect(result.createdAt).toEqual(insertedDoc.createdAt.toISOString());
    });

    it("rejects invalid ratings", async () => {
        await expect(
            submitFeedback({
                courseId: "CS101",
                studentId: "s-001",
                rating: 8
            })
        ).rejects.toThrow("rating must be an integer between 1 and 5");
    });

    it("lists feedback using provided filters", async () => {
        const cursor = collection.find();
        cursor.toArray.mockResolvedValue([
            {
                _id: "id-1",
                courseId: "CS101",
                studentId: "s-001",
                rating: 4,
                comments: "Nice",
                createdAt: new Date("2024-05-01T00:00:00.000Z")
            }
        ]);

        const rows = await listFeedback({ courseId: "CS101" });
        expect(collection.find).toHaveBeenCalledWith({ courseId: "CS101" });
        expect(rows[0]).toMatchObject({
            _id: "id-1",
            courseId: "CS101",
            studentId: "s-001",
            rating: 4,
            comments: "Nice",
            createdAt: "2024-05-01T00:00:00.000Z"
        });
    });

    it("builds summary output with ratings breakdown", async () => {
        collection.aggregate = jest.fn(() => ({
            toArray: jest.fn().mockResolvedValue([
                {
                    _id: "CS101",
                    totalResponses: 2,
                    averageRating: 4.5,
                    ratings: [4, 5],
                    latest: [
                        {
                            _id: "a",
                            courseId: "CS101",
                            studentId: "s-001",
                            rating: 4,
                            comments: "Solid",
                            createdAt: new Date("2024-05-02T10:00:00.000Z")
                        },
                        {
                            _id: "b",
                            courseId: "CS101",
                            studentId: "s-002",
                            rating: 5,
                            comments: "Great",
                            createdAt: new Date("2024-05-03T10:00:00.000Z")
                        }
                    ]
                }
            ])
        }));

        const summary = await getFeedbackSummary();
        expect(collection.aggregate).toHaveBeenCalled();
        expect(summary).toHaveLength(1);
        expect(summary[0]).toMatchObject({
            courseId: "CS101",
            totalResponses: 2,
            averageRating: 4.5,
            ratingsBreakdown: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 1 }
        });
        expect(summary[0].latestFeedback).toHaveLength(2);
        expect(summary[0].latestFeedback[0].studentId).toBe("s-002");
    });
});
