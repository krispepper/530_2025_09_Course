require("dotenv").config();
const { connectDB } = require("./src/db");
const app = require("./app");

dotenv.config();

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Server up on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
