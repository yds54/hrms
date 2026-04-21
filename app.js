const express = require("express");
const session = require("express-session");
const cors = require("cors");
const passport = require("passport");

require("dotenv").config();

const { errorHandler } = require("./src/utils/error");
const indexRoutes = require("./src/routes/index");
const { swaggerMiddleware } = require("./src/middleware/swaggerMiddleware");

const app = express();
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session setup
app.use(
  session({
    secret: process.env.secrate_jwt,
    resave: false,
    saveUninitialized: true,
  }),
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/api", indexRoutes);
app.use("/api-docs", swaggerMiddleware);
app.use("/uploads", express.static("uploads"));
app.use(errorHandler);

module.exports = app;
