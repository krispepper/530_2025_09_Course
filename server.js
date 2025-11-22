require("dotenv").config();
const { connectDB } = require("./db");
const app = require("./app");

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await connectDB();
    console.log("DB connected");
  } catch (err) {
    console.log("⚠ MongoDB not running. Continuing without database...");
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();
