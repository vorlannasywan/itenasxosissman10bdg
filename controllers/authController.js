const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const login = async (req, res) => {
    const { username, password } = req.body;

    try {
        if (!username || !password) {
            return res.status(400).json({ error: 'Username dan password tidak boleh kosong' });
        }

        const user = await User.findOne({ where: { username } });

        if (user && (await bcrypt.compare(password, user.password))) {
            const token = jwt.sign(
                { id: user.id, username: user.username, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '1d' }
            );

            res.json({
                token,
                role: user.role
            });
        } else {
            res.status(401).json({ error: 'Username atau password salah' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Terjadi kesalahan pada server' });
    }
};

module.exports = { login };