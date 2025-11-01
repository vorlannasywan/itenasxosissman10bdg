// Memuat variabel lingkungan dari file .env
require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');
const sequelize = require('./config/database');

// Membuat instance aplikasi Express
const app = express();

// Mengatur Middleware
app.use(cors({ origin: '*' })); // Mengizinkan Cross-Origin Resource Sharing
app.use(express.json()); // Mem-parsing body request JSON
app.use(express.urlencoded({ extended: true })); // Mem-parsing body request URL-encoded
app.use(express.static(path.join(__dirname, 'public'))); // Menyajikan file frontend statis dari folder 'public'
app.use(express.static('public'));


// Mendaftarkan semua Rute API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/proker', require('./routes/proker'));
app.use('/api/berita', require('./routes/berita'));
app.use('/api/members', require('./routes/members'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/qna', require('./routes/qna'));
app.use('/api/public', require('./routes/public'));

// Menentukan port server
const PORT = process.env.PORT || 3000;

// Sinkronisasi model dengan database dan memulai server
sequelize.sync()
    .then(() => {
        app.listen(PORT, () => console.log(`🚀 Server berjalan di http://localhost:${PORT}`));
    })
    .catch(err => console.error('Gagal koneksi ke database:', err));