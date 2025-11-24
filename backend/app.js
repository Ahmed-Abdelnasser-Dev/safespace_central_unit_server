/**
 * Safe Space Central Unit - Express Application Setup
 * 
 * This file defines the Express application with all middleware,
 * security configurations, and route handlers.
 * 
 * @module app
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const { logger } = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const AppError = require('./utils/AppError');

const app = express();

// ============================================
// SECURITY MIDDLEWARE
// ============================================
app.use(helmet());

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:4000',
  credentials: true,
}));

// ============================================
// BODY PARSING MIDDLEWARE
// ============================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// STATIC FILE SERVING
// ============================================
app.use('/uploads', express.static('uploads'));

// ============================================
// LOGGING MIDDLEWARE
// ============================================
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Log all requests
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// ============================================
// HEALTH CHECK ROUTES
// ============================================
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Safe Space Central Unit is operational',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Safe Space Central Unit is operational',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Backend API is working correctly',
    data: {
      serverTime: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

// ============================================
// API ROUTES
// ============================================
// Mount incident routes
app.use('/api', require('./modules/incidents/incident.routes'));

// Future routes:
// app.use('/api/auth', require('./modules/auth/auth.routes'));
// app.use('/api/nodes', require('./modules/nodes/node.routes'));

// ============================================
// 404 HANDLER
// ============================================
app.all('*', (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404));
});

// ============================================
// GLOBAL ERROR HANDLER
// ============================================
app.use(errorHandler);

module.exports = app;
