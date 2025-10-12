const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Proker = sequelize.define('Proker', {
    nama: {
        type: DataTypes.STRING,
        allowNull: false
    },
    deskripsi: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    tanggal_mulai: {
        type: DataTypes.DATE,
        allowNull: false
    },
    gambar: {
        type: DataTypes.TEXT, // Disimpan sebagai string JSON
        allowNull: true,
        get() {
            const rawValue = this.getDataValue('gambar');
            return rawValue ? JSON.parse(rawValue) : []; // Diubah menjadi array saat dibaca
        },
        set(value) {
            this.setDataValue('gambar', JSON.stringify(value)); // Diubah menjadi string saat disimpan
        }
    },
    divisi: {
        type: DataTypes.STRING,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('Berlangsung', 'Direncanakan', 'Selesai'),
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM('OSIS', 'MPK'),
        allowNull: false
    },
});

module.exports = Proker;