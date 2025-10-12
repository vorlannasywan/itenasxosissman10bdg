const Member = require('../models/Member');

const getAllMembers = async (req, res) => {
    try {
        let members = await Member.findAll({ where: { role: req.user.role } });
        if (!members || members.length === 0) {
            return res.json([]);
        }

        members.sort((a, b) => {
            const getPeringkat = (jabatan) => {
                if (jabatan.toLowerCase().includes('ketua')) return 1;
                if (jabatan.toLowerCase().includes('wakil')) return 2;
                return 3;
            };
            const peringkatA = getPeringkat(a.jabatan);
            const peringkatB = getPeringkat(b.jabatan);
            return peringkatA - peringkatB || a.jabatan.localeCompare(b.jabatan);
        });

        res.json(members);
    } catch (error) {
        console.error('Error fetching members:', error);
        res.status(500).json({ error: 'Terjadi kesalahan pada server' });
    }
};

const createMember = async (req, res) => {
    const { nama, nisn, jabatan } = req.body;
    if (!nama || !nisn || !jabatan) {
        return res.status(400).json({ error: 'Nama, NISN, dan Jabatan wajib diisi' });
    }

    try {
        let url_foto = 'https://via.placeholder.com/150';
        
        // DIUBAH: Dapatkan URL langsung dari req.file.path
        if (req.file) {
            url_foto = req.file.path;
        }

        const newMember = await Member.create({
            nama, nisn, jabatan, url_foto,
            role: req.user.role,
        });
        res.status(201).json(newMember);
    } catch (error) {
         if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ error: 'NISN sudah terdaftar' });
        }
        console.error('Error creating member:', error);
        res.status(500).json({ error: 'Gagal menambahkan anggota' });
    }
};

const updateMember = async (req, res) => {
    try {
        const member = await Member.findByPk(req.params.id);
        if (!member || member.role !== req.user.role) {
            return res.status(404).json({ error: 'Anggota tidak ditemukan atau akses ditolak' });
        }

        let url_foto = member.url_foto;
        
        // DIUBAH: Jika ada file baru diunggah, ganti URLnya
        if (req.file) {
            url_foto = req.file.path;
        }
        
        const updatedData = { ...req.body, url_foto };
        await member.update(updatedData);

        res.json(member);
    } catch (error) {
        console.error('Error updating member:', error);
        res.status(500).json({ error: 'Gagal memperbarui data anggota' });
    }
};

const deleteMember = async (req, res) => {
    try {
        const member = await Member.findByPk(req.params.id);
        if (!member || member.role !== req.user.role) {
            return res.status(404).json({ error: 'Anggota tidak ditemukan atau akses ditolak' });
        }
        await member.destroy();
        res.json({ message: 'Anggota berhasil dihapus' });
    } catch (error) {
        console.error('Error deleting member:', error);
        res.status(500).json({ error: 'Gagal menghapus anggota' });
    }
};

module.exports = { getAllMembers, createMember, updateMember, deleteMember };