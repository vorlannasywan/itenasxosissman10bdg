const { Sequelize } = require('sequelize');
require('dotenv').config();

// Membuat instance Sequelize baru dengan konfigurasi dari file .env
const sequelize = new Sequelize(
    process.env.DB_NAME,    // Nama database Anda
    process.env.DB_USER,    // Username database Anda
    process.env.DB_PASSWORD,// Password database Anda
    {
        host: process.env.DB_HOST, // Host database (biasanya 'localhost')
        dialect: 'mysql',          // Jenis database yang digunakan
        logging: false,            // Matikan logging query SQL di console
    }
);

module.exports = sequelize;