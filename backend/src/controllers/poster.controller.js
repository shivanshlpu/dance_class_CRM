const Poster = require('../models/Poster');
const createAuditLog = require('../utils/auditLog');
const fs = require('fs');
const path = require('path');

const uploadPoster = async (req, res) => {
  try {
    const { category } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'No image file uploaded' });
    }

    if (!category) {
      return res.status(400).json({ message: 'Category is required' });
    }

    // Relative path for the frontend to access via static file serving
    const imageUrl = `/uploads/posters/${req.file.filename}`;

    const poster = await Poster.create({
      category,
      imageUrl,
      isActive: true,
      useCount: 0
    });

    await createAuditLog({
      userId: req.user.userId,
      action: 'create',
      entity: 'Poster',
      entityId: poster._id,
      after: poster.toObject()
    });

    res.status(201).json({ message: 'Poster uploaded successfully', poster });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPosters = async (req, res) => {
  try {
    const posters = await Poster.find().sort({ createdAt: -1 }).lean();
    res.json({ posters });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deletePoster = async (req, res) => {
  try {
    const { id } = req.params;
    const poster = await Poster.findById(id);

    if (!poster) {
      return res.status(404).json({ message: 'Poster not found' });
    }

    // Delete the file from filesystem
    const filePath = path.join(__dirname, '..', '..', poster.imageUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await Poster.findByIdAndDelete(id);

    await createAuditLog({
      userId: req.user.userId,
      action: 'delete',
      entity: 'Poster',
      entityId: id,
      before: poster.toObject()
    });

    res.json({ message: 'Poster deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  uploadPoster,
  getPosters,
  deletePoster
};
