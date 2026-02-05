/**
 * Safe Space Central Unit - Express Application Setup
 *
 * This file defines the Express application with all middleware,
 * security configurations, and route handlers.
 *
 * @module app
 */

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const { logger } = require("./utils/logger");
const errorHandler = require("./middleware/errorHandler");
const AppError = require("./utils/AppError");
const authRoutes = require('./modules/auth/auth.routes');


const app = express();

// ============================================
// SECURITY MIDDLEWARE
// ============================================
app.use(helmet());

// CORS Configuration for LAN access
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:4000";
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : [FRONTEND_URL];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman, Raspberry Pi)
      if (!origin) return callback(null, true);

      // Check explicit origins or LAN subnet
      const isAllowed =
        ALLOWED_ORIGINS.some((allowed) => origin === allowed) ||
        origin.startsWith("http://192.168.10.");

      if (isAllowed) {
        callback(null, true);
      } else {
        logger.warn(`Blocked CORS origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// ============================================
// BODY PARSING MIDDLEWARE
// ============================================
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ============================================
// STATIC FILE SERVING
// ============================================
app.use("/uploads", express.static("uploads"));

// ============================================
// LOGGING MIDDLEWARE
// ============================================
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Log all requests
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// ============================================
// HEALTH CHECK ROUTES
// ============================================

/**
 * Health check endpoint for load balancers and monitoring
 * Root path for uptime monitors (e.g., Kubernetes, PM2)
 */
app.get("/health", (req, res) => {
  const healthStatus = {
    status: "operational",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    version: "1.0.0",
    checks: {
      backend: {
        status: "healthy",
        message: "Central Unit is running",
        responseTime: "< 1ms",
      },
      frontend: {
        status: "not-checked",
        message: "Frontend health must be checked from client-side",
      },
      ethernet: {
        status: "listening",
        message: `Server listening on port ${process.env.PORT || 5000}`,
      },
    },
  };

  res.status(200).json(healthStatus);
});

/**
 * Comprehensive API health endpoint
 * Includes backend operational metrics and diagnostic information
 */
app.get("/api/health", (req, res) => {
  const healthStatus = {
    status: "operational",
    timestamp: new Date().toISOString(),
    service: "Safe Space Central Unit",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
    backend: {
      status: "healthy",
      uptime: process.uptime(),
      memoryUsage: {
        rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
      },
      nodeVersion: process.version,
      listeningOn: `${process.env.HOST || "0.0.0.0"}:${process.env.PORT || 5000}`,
    },
    features: {
      socketIO: "enabled",
      corsLan: "enabled",
      nodeAuthentication: "enabled",
      mediaUpload: "enabled",
    },
    frontendCheck: {
      status: "requires-client-request",
      message:
        "Frontend health must be checked from the Dashboard application",
      endpoint: "/api/test-frontend",
    },
  };

  res.status(200).json(healthStatus);
});

/**
 * Frontend connectivity test endpoint
 * Called by Dashboard to verify it can reach the backend
 */
app.get("/api/test-frontend", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Frontend is connected to backend",
    timestamp: new Date().toISOString(),
    backendReachable: true,
    socketIOAvailable: true,
    apiVersion: "1.0.0",
  });
});

// ============================================
// API ROUTES
// ============================================
// Mount incident routes
app.use("/api", require("./modules/incidents/incident.routes"));

// Mount auth routes
app.use('/api/auth', require('./modules/auth/auth.routes'));




// ============================================
// 404 HANDLER
// ============================================
app.all("*", (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404));
});

// ============================================
// GLOBAL ERROR HANDLER
// ============================================
app.use(errorHandler);

module.exports = app;
