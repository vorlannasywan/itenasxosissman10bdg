const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/authMiddleware');
const { getAllProker, createProker, updateProker, deleteProker } = require('../controllers/prokerController');

const upload = require('../config/cloudinary');

// Rute untuk mendapatkan semua proker dan membuat proker baru
router.route('/')
    .get(protect, getAllProker)
    .post(protect, upload.array('gambar', 10), createProker); // Menerima hingga 10 file dengan nama field 'gambar'

// Rute untuk memperbarui dan menghapus proker berdasarkan ID
router.route('/:id')
    .put(protect, upload.array('gambar', 10), updateProker)
    .delete(protect, deleteProker);

module.exports = router;