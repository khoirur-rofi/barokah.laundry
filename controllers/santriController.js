const db = require('../db');

exports.searchSantri = async (req, res) => {
    try {
        const { search } = req.query;
        const query = "SELECT id, nama, kamar, gender FROM santri WHERE nama LIKE ?";
        const [rows] = await db.execute(query, [`%${search}%`]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};