const express = require("express");
const session = require("express-session");
const passport = require("passport");

require("dotenv").config()


const { errorHandler } = require("./src/utils/error");
const indexRoutes = require("./src/routes/index");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session setup
app.use(
  session({
    secret:process.env.secrate_jwt,
    resave: false,
    saveUninitialized: true,
  }),
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/api", indexRoutes);
app.use(errorHandler);

module.exports = app;

