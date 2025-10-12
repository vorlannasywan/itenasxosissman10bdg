const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getTahunKepengurusan, updateTahunKepengurusan } = require('../controllers/settingsController');

router.route('/tahun')
    .get(protect, getTahunKepengurusan)
    .put(protect, updateTahunKepengurusan);

module.exports = router;