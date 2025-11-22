const express = require("express");
const path = require("path");
const feedbackRoutes = require("./routes/feedback");

const app = express();

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use("/api", feedbackRoutes);

const spaPaths = ["/", "/dashboard", "/evaluate", "/admin/reports"];

spaPaths.forEach((routePath) => {
  app.get(routePath, (req, res) => {
    res.sendFile(path.join(__dirname, "public/index.html"));
  });
});

module.exports = app;
