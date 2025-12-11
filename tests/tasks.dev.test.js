process.env.NODE_ENV = "test";
process.env.MONGO_URI = process.env.MONGO_URI_DEV || process.env.MONGO_URI;

jest.setTimeout(15000);

const request = require("supertest");
const app = require("../app");
const { connectDB, getDB, closeDB } = require("../src/db");

const TEST_TASKS = [
    { title: "Dev DB task A", status: "in-progress" },
    { title: "Dev DB task B", status: "done" }
];

let tasksCollection;
let originalTasks = [];

beforeAll(async () => {
    await connectDB();
    const db = getDB();
    tasksCollection = db.collection("tasks");

    originalTasks = await tasksCollection.find().toArray();
    await tasksCollection.deleteMany({});
    await tasksCollection.insertMany(TEST_TASKS);
});

afterAll(async () => {
    if (tasksCollection) {
        await tasksCollection.deleteMany({});
        if (originalTasks.length) {
            await tasksCollection.insertMany(originalTasks);
        }
    }
    await closeDB();
});

describe("GET /api/tasks against dev database", () => {
    it("returns tasks from the dev database", async () => {
        const res = await request(app).get("/api/tasks").expect(200);

        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body).toHaveLength(TEST_TASKS.length);

        const simplified = res.body.map(({ title, status }) => ({ title, status }));
        expect(simplified).toEqual(
            expect.arrayContaining(
                TEST_TASKS.map(({ title, status }) => ({ title, status }))
            )
        );
    });

    it("creates, updates, and deletes a task", async () => {
        const createRes = await request(app)
            .post("/api/tasks")
            .send({ title: "Dev temp task", status: "todo" })
            .expect(201);

        const createdId = createRes.body._id;
        expect(createRes.body.title).toBe("Dev temp task");
        expect(createRes.body.status).toBe("todo");

        const updateRes = await request(app)
            .put(`/api/tasks/${createdId}`)
            .send({ status: "done" })
            .expect(200);

        expect(updateRes.body.status).toBe("done");

        await request(app).delete(`/api/tasks/${createdId}`).expect(204);

        const listAfterDelete = await request(app).get("/api/tasks").expect(200);
        const exists = listAfterDelete.body.some(t => t._id === createdId);
        expect(exists).toBe(false);
    });
});
