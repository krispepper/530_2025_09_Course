const express = require("express");
const path = require("path");
const session = require("express-session");
const cors = require("cors");
const feedbackRoutes = require("./routes/feedback");
const authRoutes = require("./routes/auth");

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

app.use("/api", feedbackRoutes);
app.use("/api/auth", authRoutes);

app.use(express.static(path.join(__dirname, "public")));

const spaPaths = ["/", "/login", "/dashboard", "/evaluate", "/admin/reports"];

spaPaths.forEach((routePath) => {
  app.get(routePath, (req, res) => {
    res.sendFile(path.join(__dirname, "public/index.html"));
  });
});

module.exports = app;
