const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Member = sequelize.define('Member', {
    nama: {
        type: DataTypes.STRING,
        allowNull: false
    },
    nisn: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    jabatan: {
        type: DataTypes.STRING,
        allowNull: false
    },
    url_foto: {
        type: DataTypes.STRING,
        allowNull: true
    },
    role: {
        type: DataTypes.ENUM('OSIS', 'MPK'),
        allowNull: false
    },
});

module.exports = Member;