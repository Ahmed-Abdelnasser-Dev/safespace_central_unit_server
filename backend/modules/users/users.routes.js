/**
 * users.routes.js — User management routes
 *
 * All routes protected by JWT (protect).
 * Admin-only routes additionally protected by authorize('admin').
 */

const express    = require('express');
const multer     = require('multer');
const path       = require('path');
const router     = express.Router();
const protect    = require('../../middleware/protect');
const authorize  = require('../../middleware/authorize');
const validate   = require('../../middleware/validate');
const controller = require('./users.controller');
const { createUserSchema, updateProfileSchema, userIdParamSchema, listUsersSchema } = require('./users.schema');

// ─── Multer config for profile photos ─────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename:    (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const name = `profile-${req.user.id}-${Date.now()}${ext}`;
    cb(null, name);
  },
});

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Only JPEG, PNG, and WebP images are allowed'), false);
  },
});

// ─── All routes require authentication ────────────────────────────────────────
router.use(protect);

// Self
router.get('/me',        controller.getMe);
router.patch('/me',      validate(updateProfileSchema), controller.updateMe);
router.patch('/me/photo', upload.single('photo'),       controller.updateProfilePhoto);

// Admin only
router.get('/',          authorize('admin'), validate(listUsersSchema),  controller.listUsers);
router.post('/',         authorize('admin'), validate(createUserSchema),  controller.createUser);
router.get('/:id',       authorize('admin'), validate(userIdParamSchema), controller.getUser);
router.patch('/:id',     authorize('admin'), validate(userIdParamSchema), controller.updateUser);
router.patch('/:id/deactivate', authorize('admin'), validate(userIdParamSchema), controller.deactivateUser);
router.patch('/:id/reactivate', authorize('admin'), validate(userIdParamSchema), controller.reactivateUser);

module.exports = router;