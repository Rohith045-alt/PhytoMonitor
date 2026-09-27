const express = require("express");
const fileUpload = require("express-fileupload");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const AppError = require("./helper/AppError");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(express.json({ limit: "10mb" }));
app.use(fileUpload({ limits: { fileSize: 10 * 1024 * 1024 } }));
app.use(cors());

// Health Check Endpoint
app.get("/api/health", (req, res) => {
  const modelPath = path.join(__dirname, "ml_models", "my_plant_disease_model.h5");
  const modelExists = fs.existsSync(modelPath);

  res.status(200).json({
    status: "success",
    service: "PhytoMonitor Backend API",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    ml_model: {
      exists: modelExists,
      path: modelPath
    }
  });
});

// API Routes
app.use("/api/plants", require("./router/plantRoutes"));

// Static files for production frontend
const distPath = path.join(__dirname, "dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(distPath, "index.html"));
    }
    next();
  });
}

// Global Error Handler
app.use(errorHandler);

module.exports = app;


