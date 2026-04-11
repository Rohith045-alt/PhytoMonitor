const express = require("express");
const fileUpload = require("express-fileupload");
const cors = require("cors");
//const cookie = require("cookie-parser");
const path = require("path");
const AppError = require("./helper/AppError");
const errorHandler = require("./middleware/errorHandler");
const app = express();
app.use(express.json());
app.use(fileUpload());
app.use(cors());
//app.use(cookie())
app.use(express.static(path.join(__dirname, "dist")));

// Route for frontend
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

//app.use(express.static(path.join(__dirname, "public")));
app.use("/api/plants", require("./router/plantRoutes"));
app.use(errorHandler);
module.exports = app;
