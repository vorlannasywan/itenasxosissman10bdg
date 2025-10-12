const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/authMiddleware');
const { getAllMembers, createMember, updateMember, deleteMember } = require('../controllers/memberController');

const upload = require('../config/cloudinary');

router.route('/')
    .get(protect, getAllMembers)
    .post(protect, upload.single('url_foto'), createMember);

router.route('/:id')
    .put(protect, upload.single('url_foto'), updateMember)
    .delete(protect, deleteMember);

module.exports = router;