// server.js
require("dotenv").config();
require("./cron/slotCorn");

const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const cors = require("cors");

// Database connection function
const connectedDB = require("./app/config/dbcon");

// Routes

const homeRoute = require("./app/routes/homeRoutes");
const adminRoute = require("./app/routes/adminRoutes");

const app = express();

// ------------------- MIDDLEWARE ------------------- //

connectedDB();

app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));

// ------------------- ROUTES ------------------- //
app.use(homeRoute);
app.use(adminRoute);

// ------------------- SERVER ------------------- //
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
