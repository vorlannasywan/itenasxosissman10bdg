const express = require('express');
const router = express.Router();

// Import models dan controllers yang relevan
const Proker = require('../models/Proker');
const Berita = require('../models/Berita');
const Member = require('../models/Member');
const Settings = require('../models/Settings');
const Qna = require('../models/Qna');
const { submitQuestion } = require('../controllers/qnaController');

// Endpoint publik untuk Proker
router.get('/proker', async (req, res) => res.json(await Proker.findAll({ order: [['tanggal_mulai', 'DESC']] })));
router.get('/proker/:id', async (req, res) => res.json(await Proker.findByPk(req.params.id)));

// Endpoint publik untuk Berita
router.get('/berita', async (req, res) => res.json(await Berita.findAll({ order: [['tanggal_publikasi', 'DESC']] })));
router.get('/berita/:id', async (req, res) => res.json(await Berita.findByPk(req.params.id)));

// Endpoint publik untuk Anggota & Pengaturan
router.get('/members', async (req, res) => res.json(await Member.findAll()));
router.get('/settings', async (req, res) => res.json(await Settings.findAll()));

// Endpoint publik untuk Q&A
router.post('/qna', submitQuestion); // Untuk mengirim pertanyaan baru
router.get('/qna/:item_type/:item_id', async (req, res) => {
    try {
        const qnas = await Qna.findAll({
            where: {
                item_type: req.params.item_type,
                item_id: req.params.item_id
            },
            order: [['tanggal_tanya', 'ASC']]
        });
        res.json(qnas);
    } catch (error) {
        res.status(500).json({ error: "Gagal mengambil data Q&A" });
    }
});

module.exports = router;