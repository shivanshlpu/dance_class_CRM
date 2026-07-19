const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const studentController = require('../controllers/student.controller');
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'students');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer config for photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `student-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files (JPEG, PNG, WebP) are allowed'));
  },
});

// All routes require authentication
router.use(authenticate);

// CRUD routes
router.post('/',
  requireRole(['owner', 'manager', 'receptionist']),
  upload.single('photo'),
  studentController.createStudent
);

router.get('/',
  requireRole(['owner', 'manager', 'receptionist', 'trainer']),
  studentController.getStudents
);

router.get('/:id',
  requireRole(['owner', 'manager', 'receptionist', 'trainer']),
  studentController.getStudent
);

router.put('/:id',
  requireRole(['owner', 'manager', 'receptionist']),
  upload.single('photo'),
  studentController.updateStudent
);

router.delete('/:id',
  requireRole(['owner', 'manager']),
  studentController.deleteStudent
);

module.exports = router;
