const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/authMiddleware');
const { getAllBerita, createBerita, updateBerita, deleteBerita } = require('../controllers/beritaController');

const upload = require('../config/cloudinary');

// Rute untuk mendapatkan semua berita dan membuat berita baru
router.route('/')
    .get(protect, getAllBerita)
    .post(protect, upload.array('gambar', 10), createBerita);

// Rute untuk memperbarui dan menghapus berita berdasarkan ID
router.route('/:id')
    .put(protect, upload.array('gambar', 10), updateBerita)
    .delete(protect, deleteBerita);

module.exports = router;