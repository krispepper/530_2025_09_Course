// server.js
const dotenv = require('dotenv');
const { connectDB } = require('./src/db');
const app = require('./app');

dotenv.config();

const PORT = process.env.PORT || 3000;

(async () => {
  let dbConnected = false;

  try {
    // Try to connect to MongoDB
    await connectDB();
    dbConnected = true;
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    // If MongoDB fails, continue without DB
    console.error('⚠️ Could not connect to MongoDB. Running WITHOUT database.');
    console.error(err.message || err);
  }

  // Optional: make this available in routes if needed
  app.locals.dbConnected = dbConnected;

  app.listen(PORT, () => {
    if (dbConnected) {
      console.log(`🚀 Server running WITH DB on http://localhost:${PORT}`);
    } else {
      console.log(`🚀 Server running WITHOUT DB on http://localhost:${PORT}`);
    }
  });
})();
