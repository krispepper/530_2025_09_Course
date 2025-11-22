const dotenv = require("dotenv");
const app = require("./app");

dotenv.config();

(async () => {
  try {
    await connectDB();
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.warn("MongoDB connection failed — running in NO-DB mode.");
  }

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
})();
