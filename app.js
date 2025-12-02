const express = require("express");
const path = require("path");
const apiRoutes = require("./src/routes");

const app = express();

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use("/api", apiRoutes);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

app.get("/admin/feedback", (req, res) => {
  res.sendFile(path.join(__dirname, "public/admin.html"));
});

module.exports = app;
