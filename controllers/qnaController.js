const Qna = require('../models/Qna');

const submitQuestion = async (req, res) => {
    const { item_id, item_type, nama_penanya, pertanyaan, role } = req.body;
    if (!item_id || !item_type || !nama_penanya || !pertanyaan || !role) {
        return res.status(400).json({ error: 'Semua field wajib diisi' });
    }
    try {
        const newQuestion = await Qna.create({ item_id, item_type, nama_penanya, pertanyaan, role });
        res.status(201).json({ message: 'Pertanyaan berhasil dikirim!', data: newQuestion });
    } catch (error) {
        console.error('Error submitting question:', error);
        res.status(500).json({ error: 'Gagal mengirim pertanyaan' });
    }
};

const getUnansweredQuestions = async (req, res) => {
    try {
        const questions = await Qna.findAll({
            where: { jawaban: null, role: req.user.role },
            order: [['tanggal_tanya', 'ASC']]
        });
        res.json(questions);
    } catch (error) {
        console.error('Error fetching unanswered questions:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

const answerQuestion = async (req, res) => {
    const { jawaban } = req.body;
    if (!jawaban) {
        return res.status(400).json({ error: 'Jawaban tidak boleh kosong' });
    }
    try {
        const question = await Qna.findByPk(req.params.id);
        if (!question || question.role !== req.user.role) {
            return res.status(404).json({ error: 'Pertanyaan tidak ditemukan atau akses ditolak' });
        }

        question.jawaban = jawaban;
        question.tanggal_jawab = new Date();
        await question.save();
        res.json(question);
    } catch (error) {
        console.error('Error answering question:', error);
        res.status(500).json({ error: 'Gagal menjawab pertanyaan' });
    }
};

const deleteQuestion = async (req, res) => {
    try {
        const question = await Qna.findByPk(req.params.id);
        if (!question || question.role !== req.user.role) {
            return res.status(404).json({ error: 'Pertanyaan tidak ditemukan atau akses ditolak' });
        }
        await question.destroy();
        res.json({ message: 'Pertanyaan berhasil dihapus' });
    } catch (error) {
        console.error('Error deleting question:', error);
        res.status(500).json({ error: 'Gagal menghapus pertanyaan' });
    }
};

module.exports = { submitQuestion, getUnansweredQuestions, answerQuestion, deleteQuestion };