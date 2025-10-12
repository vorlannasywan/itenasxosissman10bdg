const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Settings = sequelize.define('Settings', {
    kunci: { // Contoh: 'tahun_kepengurusan'
        type: DataTypes.STRING,
        allowNull: false
    },
    nilai: { // Contoh: '2025/2026'
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM('OSIS', 'MPK'),
        allowNull: false
    },
}, {
    timestamps: false // Tabel ini tidak memerlukan kolom createdAt dan updatedAt
});

module.exports = Settings;