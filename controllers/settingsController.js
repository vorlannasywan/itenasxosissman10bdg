const Settings = require('../models/Settings');

const getTahunKepengurusan = async (req, res) => {
    try {
        const setting = await Settings.findOne({
            where: {
                kunci: 'tahun_kepengurusan',
                role: req.user.role
            }
        });
        if (!setting) {
            return res.status(404).json({ error: 'Pengaturan tahun kepengurusan tidak ditemukan' });
        }
        res.json(setting);
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ error: 'Terjadi kesalahan pada server' });
    }
};

const updateTahunKepengurusan = async (req, res) => {
    const { nilai } = req.body;
    if (!nilai) {
        return res.status(400).json({ error: 'Nilai tahun kepengurusan tidak boleh kosong' });
    }
    
    try {
        const [updatedRows] = await Settings.update(
            { nilai },
            {
                where: {
                    kunci: 'tahun_kepengurusan',
                    role: req.user.role
                }
            }
        );

        if (updatedRows === 0) {
            return res.status(404).json({ error: 'Pengaturan untuk diperbarui tidak ditemukan' });
        }

        const updatedSetting = await Settings.findOne({ where: { kunci: 'tahun_kepengurusan', role: req.user.role }});
        res.json(updatedSetting);
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ error: 'Gagal memperbarui pengaturan' });
    }
};

module.exports = { getTahunKepengurusan, updateTahunKepengurusan };