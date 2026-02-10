/**
 * Multer Configuration for File Uploads
 * 
 * Configures file upload handling for:
 * - Node snapshot uploads (incident images)
 * - Max file size validation
 * - File type validation
 * - Storage location
 * 
 * @module middleware/upload
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
const snapshotsDir = path.join(uploadsDir, 'snapshots');

[uploadsDir, snapshotsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Storage configuration for node snapshots
 */
const snapshotStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, snapshotsDir);
  },
  filename: (req, file, cb) => {
    const nodeId = req.params.nodeId || 'unknown';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${nodeId}_${timestamp}${ext}`);
  },
});

/**
 * File filter - only accept images
 */
const imageFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG and PNG images are allowed'), false);
  }
};

/**
 * Multer instance for snapshot uploads
 */
const uploadSnapshot = multer({
  storage: snapshotStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 1, // Single file only
  },
});

module.exports = {
  uploadSnapshot,
};
