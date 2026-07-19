const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const posterController = require('../controllers/poster.controller');
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

// Setup multer for poster uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '..', '..', 'uploads', 'posters');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'poster-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
});

router.use(authenticate);

// Only managers/owners can manage posters
router.use(requireRole(['owner', 'manager']));

router.get('/', posterController.getPosters);
router.post('/', upload.single('poster'), posterController.uploadPoster);
router.delete('/:id', posterController.deletePoster);

module.exports = router;
