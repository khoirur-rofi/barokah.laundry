const db = require('../db');

exports.searchSantri = async (req, res) => {
    try {
        const { search } = req.query;

        let query = "SELECT id, nama, kamar, gender FROM santri";
        let params = [];

        if (search && search.trim() !== "") {
            query += " WHERE nama LIKE ?";
            params.push(`%${search}%`);
        }

        const [rows] = await db.execute(query, params);
        res.json(rows);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
