// File: config/cloudinary.js

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    // DIUBAH: Tambahkan baris ini untuk menunjuk ke preset baru Anda
    upload_preset: 'osissman10', 
    
    folder: 'osis-web',
    allowed_formats: ['jpeg', 'png', 'jpg'],
    transformation: [{ width: 1280, height: 720, crop: 'limit' }]
  },
});

const upload = multer({ storage: storage });

module.exports = upload;