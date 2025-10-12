const Proker = require('../models/Proker');

// DIUBAH: Tidak perlu lagi mengimpor helper upload.

const getAllProker = async (req, res) => {
    try {
        const prokers = await Proker.findAll({ 
            where: { role: req.user.role },
            order: [['tanggal_mulai', 'DESC']]
        });
        res.json(prokers);
    } catch (error) {
        console.error('Error fetching proker:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

const createProker = async (req, res) => {
    const { nama, deskripsi, tanggal_mulai, divisi, status } = req.body;
    
    try {
        // DIUBAH: Dapatkan URL langsung dari req.files yang di-upload oleh multer-storage-cloudinary
        const arrayUrlGambar = req.files ? req.files.map(file => file.path) : [];

        const newProker = await Proker.create({
            nama, deskripsi, tanggal_mulai,
            gambar: arrayUrlGambar,
            divisi, status,
            role: req.user.role,
        });
        res.status(201).json(newProker);
    } catch (error) {
        console.error('Error creating proker:', error);
        res.status(500).json({ error: 'Gagal membuat proker' });
    }
};

const updateProker = async (req, res) => {
    try {
        const proker = await Proker.findByPk(req.params.id);
        if (!proker || proker.role !== req.user.role) {
            return res.status(404).json({ error: 'Proker tidak ditemukan atau akses ditolak' });
        }
        
        let arrayUrlGambar = proker.gambar;
        
        // DIUBAH: Jika ada file baru yang diunggah, ganti array gambar dengan yang baru
        if (req.files && req.files.length > 0) {
            arrayUrlGambar = req.files.map(file => file.path);
        }

        const updatedData = { ...req.body, gambar: arrayUrlGambar };
        await proker.update(updatedData);

        res.json(proker);
    } catch (error) {
        console.error('Error updating proker:', error);
        res.status(500).json({ error: 'Gagal memperbarui proker' });
    }
};

const deleteProker = async (req, res) => {
    try {
        const proker = await Proker.findByPk(req.params.id);
        if (!proker || proker.role !== req.user.role) {
            return res.status(404).json({ error: 'Proker tidak ditemukan atau akses ditolak' });
        }
        await proker.destroy();
        res.json({ message: 'Proker berhasil dihapus' });
    } catch (error) {
        console.error('Error deleting proker:', error);
        res.status(500).json({ error: 'Gagal menghapus proker' });
    }
};

module.exports = { getAllProker, createProker, updateProker, deleteProker };