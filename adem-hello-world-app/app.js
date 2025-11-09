const express = require("express");
const path = require("path");
const routes = require("./src/routes");
const { connectDB } = require("./src/db");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

app.use("/api", routes);

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public/index.html"));
});

connectDB().then(() => {
    app.listen(PORT, () => console.log(`Server up on http://localhost:${PORT}`));
});
