const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getUnansweredQuestions, answerQuestion, deleteQuestion } = require('../controllers/qnaController');

// @route   GET /api/qna/unanswered
// @desc    Mendapatkan semua pertanyaan yang belum dijawab untuk role admin
// @access  Private
router.get('/unanswered', protect, getUnansweredQuestions);

// @route   PUT /api/qna/:id
// @desc    Mengirim jawaban untuk sebuah pertanyaan
// @access  Private
router.put('/:id', protect, answerQuestion);

// @route   DELETE /api/qna/:id
// @desc    Menghapus pertanyaan
// @access  Private
router.delete('/:id', protect, deleteQuestion);

module.exports = router;