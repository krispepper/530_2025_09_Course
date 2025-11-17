const { getDB } = require('../db');

function collection() {
  const db = getDB();
  return db.collection('feedback');
}

async function listFeedback(filter = {}) {
  return collection().find(filter).toArray();
}

async function createFeedback(doc) {
  const result = await collection().insertOne(doc);
  return { _id: result.insertedId, ...doc };
}

module.exports = { listFeedback, createFeedback };

