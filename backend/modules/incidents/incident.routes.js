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

// File filter - validate MIME types
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/png', 'image/webp', 'image/jpeg', 'image/jpg'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Only PNG, WEBP, and JPEG image formats are allowed.', 400), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
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
 */
router.post(
  '/accident-detected',
  upload.single('image'),
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
