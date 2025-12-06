/**
 * Incident Routes
 * 
 * Defines routes for accident detection and incident management.
 * Configures multer for file uploads with validation.
 * 
 * @module modules/incidents/incident.routes
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AppError = require('../../utils/AppError');
const incidentController = require('./incident.controller');
const validate = require('../../middleware/validate');
const { accidentDetectedSchema, accidentDecisionSchema } = require('./incident.schema');

const router = express.Router();

// ============================================
// MULTER CONFIGURATION
// ============================================

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads/incidents');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: nodeId_timestamp_originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const nodeId = req.body.nodeId || 'unknown';
    cb(null, `node${nodeId}_${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// File filter - validate MIME types (images and videos)
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/png', 
    'image/webp', 
    'image/jpeg', 
    'image/jpg',
    'video/mp4',
    'video/webm',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-matroska',
    'application/octet-stream' // Some systems send MP4 as this
  ];
  
  // Log the detected MIME type for debugging
  console.log(`File upload - Name: ${file.originalname}, MIME: ${file.mimetype}`);
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(`File type not allowed. Received: ${file.mimetype}. Only PNG, JPEG, MP4, WEBM, and MOV formats are allowed.`, 400), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, 
  },
});

// ============================================
// MULTER ERROR HANDLER MIDDLEWARE
// ============================================
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new AppError('File size exceeds 10MB limit', 400));
    }
    return next(new AppError(`Upload error: ${err.message}`, 400));
  }
  next(err);
};

// ============================================
// ROUTES
// ============================================

/**
 * POST /api/accident-detected
 * Receives accident detection data from Edge Nodes
 * Protected by Node authentication middleware
 */
router.post(
  '/accident-detected',
  // Accept multiple media files under field name 'media'
  upload.array('media', 10),
  handleMulterError,
  validate(accidentDetectedSchema),
  incidentController.accidentDetected
);

/**
 * POST /api/accident-decision
 * Receives admin/operator decision review for an accident.
 */
router.post(
  '/accident-decision',
  validate(accidentDecisionSchema),
  incidentController.accidentDecision
);

module.exports = router;
