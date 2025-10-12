const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Berita = sequelize.define('Berita', {
    judul: {
        type: DataTypes.STRING,
        allowNull: false
    },
    konten: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    tanggal_publikasi: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    gambar: {
        type: DataTypes.TEXT, // Disimpan sebagai string JSON
        allowNull: true,
        get() {
            const rawValue = this.getDataValue('gambar');
            return rawValue ? JSON.parse(rawValue) : [];
        },
        set(value) {
            this.setDataValue('gambar', JSON.stringify(value));
        }
    },
    role: {
        type: DataTypes.ENUM('OSIS', 'MPK'),
        allowNull: false
    },
});

module.exports = Berita;