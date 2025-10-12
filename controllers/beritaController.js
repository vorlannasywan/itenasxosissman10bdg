const Berita = require('../models/Berita');

const getAllBerita = async (req, res) => {
    try {
        const allBerita = await Berita.findAll({ 
            where: { role: req.user.role },
            order: [['tanggal_publikasi', 'DESC']]
        });
        res.json(allBerita);
    } catch (error) {
        console.error('Error fetching berita:', error);
        res.status(500).json({ error: 'Terjadi kesalahan pada server' });
    }
};

const createBerita = async (req, res) => {
    const { judul, konten } = req.body;
    if (!judul || !konten) {
        return res.status(400).json({ error: 'Judul dan konten tidak boleh kosong' });
    }

    try {
        // DIUBAH: Dapatkan URL langsung dari req.files
        const arrayUrlGambar = req.files ? req.files.map(file => file.path) : [];

        const newBerita = await Berita.create({
            judul,
            konten,
            gambar: arrayUrlGambar,
            role: req.user.role,
        });
        res.status(201).json(newBerita);
    } catch (error) {
        console.error('Error creating berita:', error);
        res.status(500).json({ error: 'Gagal membuat berita' });
    }
};

const updateBerita = async (req, res) => {
    const { judul, konten } = req.body;
    try {
        const berita = await Berita.findByPk(req.params.id);
        if (!berita || berita.role !== req.user.role) {
            return res.status(404).json({ error: 'Berita tidak ditemukan atau akses ditolak' });
        }

        let arrayUrlGambar = berita.gambar;
        
        // DIUBAH: Jika ada file baru yang diunggah, ganti dengan yang baru
        if (req.files && req.files.length > 0) {
            arrayUrlGambar = req.files.map(file => file.path);
        }
        
        berita.judul = judul || berita.judul;
        berita.konten = konten || berita.konten;
        berita.gambar = arrayUrlGambar;
        await berita.save();

        res.json(berita);
    } catch (error) {
        console.error('Error updating berita:', error);
        res.status(500).json({ error: 'Gagal memperbarui berita' });
    }
};

const deleteBerita = async (req, res) => {
    try {
        const berita = await Berita.findByPk(req.params.id);
        if (!berita || berita.role !== req.user.role) {
            return res.status(404).json({ error: 'Berita tidak ditemukan atau akses ditolak' });
        }
        await berita.destroy();
        res.json({ message: 'Berita berhasil dihapus' });
    } catch (error) {
        console.error('Error deleting berita:', error);
        res.status(500).json({ error: 'Gagal menghapus berita' });
    }
};

module.exports = { getAllBerita, createBerita, updateBerita, deleteBerita };