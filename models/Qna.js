const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Qna = sequelize.define('Qna', {
    item_id: { // Merujuk ke ID proker atau berita
        type: DataTypes.INTEGER,
        allowNull: false
    },
    item_type: { // Menentukan apakah item_id adalah 'proker' atau 'berita'
        type: DataTypes.ENUM('proker', 'berita'),
        allowNull: false
    },
    nama_penanya: {
        type: DataTypes.STRING,
        allowNull: false
    },
    pertanyaan: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    jawaban: {
        type: DataTypes.TEXT,
        allowNull: true // Jawaban bisa null saat pertanyaan baru dibuat
    },
    tanggal_tanya: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    tanggal_jawab: {
        type: DataTypes.DATE,
        allowNull: true
    },
    role: { // Menentukan pertanyaan ini untuk OSIS atau MPK
        type: DataTypes.ENUM('OSIS', 'MPK'),
        allowNull: false
    },
});

module.exports = Qna;