// const { add, mul } = require("./math.js");

// const math = require("./math.js");

// console.log(math.add(5, 10));

// console.log(math.mul(10, 5));

// const EventEmitter = require("events");

// const emitter = new EventEmitter();

// emitter.on("login", (username) => {
//   console.log(`${username} just logged in `);
// });

// emitter.emit("login", "Rafi");

// let EventEmitter = require("events");
// let fs = require("fs");
// let emitter = new EventEmitter();
// let dataFile = "data.json";
// let eventCounts = {
//   "user-login": 0,
//   "user-purchase": 0,
//   "profile-update": 0,
//   "user-logout": 0,
// };

// if (fs.existsSync(dataFile)) {
//   let data = fs.readFileSync(dataFile);
//   eventCounts = JSON.parse(data).counter;
// }

// function saveContacts() {
//   fs.writeFileSync(dataFile, JSON.stringify({ counter: eventCounts }, null, 2));
// }

// emitter.on("user-login", (userName) => {
//   eventCounts["user-login"]++;
//   saveContacts();
//   console.log(`${userName} logged in`);
// });

// emitter.on("user-purchase", (userName, item) => {
//   eventCounts["user-purchase"]++;
//   saveContacts();
//   console.log(`${userName} purchased ${item}`);
// });

// emitter.on("profile-update", (userName, field) => {
//   eventCounts["profile-update"]++;
//   saveContacts();
//   console.log(`${userName} updated their ${field}`);
// });

// emitter.on("user-logout", (userName) => {
//   eventCounts["user-logout"]++;
//   saveContacts();
//   console.log(`${userName} logged out`);
// });

// emitter.on("summary", () => {
//   console.log(eventCounts);
// });

// emitter.emit("user-login", "Nill Bhai");

// emitter.emit("user-purchase", "Nill", "Laptop");

// emitter.emit("profile-update", "Nill", "email");

// emitter.emit("user-logout", "Nill");

// emitter.emit("summary");
require("dotenv").config();
const express = require("express");

const path = require("path");
const connectedDB = require("./app/config/dbcon");
const homeRoute = require("./app/routes/homeRoutes");
const adminRoute = require("./app/routes/adminRoutes");
const app = express();
const cors = require("cors");
// const checkRole = require("./app/middleware/auth");

connectedDB();
app.use(cors());
app.set("view engine", "ejs");
app.set("views", "views");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = 3000;

app.use(express.static(path.join(__dirname, "public")));

app.use(homeRoute);
app.use(adminRoute);



app.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
});
