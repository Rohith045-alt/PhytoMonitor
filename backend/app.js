const express = require("express");
const fileUpload = require("express-fileupload");
const cors = require("cors");
//const cookie = require("cookie-parser");
const path = require("path");
const AppError = require("./helper/AppError");
const app = express();
app.use(express.json());
app.use(fileUpload());
app.use(cors());
//app.use(cookie())

//app.use(express.static(path.join(__dirname, "public")));
app.use("/api/plants", require("./router/plantRoutes"));
app.use(AppError);
module.exports = app;
