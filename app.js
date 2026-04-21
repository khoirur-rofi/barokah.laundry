const express = require('express');
const cors = require('cors');
const db = require('./db');
const app = express();

// --- IMPORT ROUTES ---
const santriRoutes = require('./routes/santriRoutes');
const cucianRoutes = require('./routes/cucianRoutes');

// --- MIDDLEWARE ---
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleString()}] Ada request masuk: ${req.method} ${req.url}`);
    next();
});
app.use(cors()); 
app.use(express.json());

// --- 1. ROUTE AUTHENTICATION ---
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [rows] = await db.execute(
            "SELECT * FROM users WHERE username = ? AND password = ?", 
            [username, password]
        );

        if (rows.length > 0) {
            res.json({ success: true, message: "Login Berhasil" });
        } else {
            res.status(401).json({ success: false, message: "Username atau Password salah" });
        }
    } catch (error) {
        console.error("Login Error:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// --- 2. ROUTE ADMIN / PROFILE ---
app.put('/api/admin/update', async (req, res) => {
    const { oldUsername, oldPassword, newUsername, newPassword } = req.body;
    try {
        const [rows] = await db.execute(
            "SELECT * FROM users WHERE username = ? AND password = ? AND id = 1", 
            [oldUsername, oldPassword]
        );

        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: "Username atau Password lama salah!" });
        }

        await db.execute(
            "UPDATE users SET username = ?, password = ? WHERE id = 1", 
            [newUsername, newPassword]
        );
        
        res.json({ success: true, message: "Profil berhasil diperbarui!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- 3. ROUTE CUCIAN (Urutan Sangat Penting) ---

// A. Rute Spesifik (Laporan) - Harus di atas app.use/cucianRoutes
app.get('/api/cucian/laporan', async (req, res) => {
    const { tgl_mulai, tgl_selesai } = req.query;
    
    let query = `
        SELECT 
            SUM(CASE WHEN santri.gender = 'L' THEN cucian.total_harga ELSE 0 END) as total_laki,
            SUM(CASE WHEN santri.gender = 'P' THEN cucian.total_harga ELSE 0 END) as total_perempuan,
            SUM(cucian.total_harga) as total_semua
        FROM cucian 
        JOIN santri ON cucian.santri_id = santri.id
        WHERE cucian.status_pembayaran = 'sudah'
    `;
    
    let params = [];
    if (tgl_mulai && tgl_selesai) {
        query += " AND DATE(cucian.tanggal_masuk) BETWEEN ? AND ?";
        params.push(tgl_mulai, tgl_selesai);
    }

    try {
        const [rows] = await db.execute(query, params);
        res.json({
            total_laki: rows[0].total_laki || 0,
            total_perempuan: rows[0].total_perempuan || 0,
            total_pendapatan: rows[0].total_semua || 0
        }); 
    } catch (error) {
        console.error("Gagal hitung laporan gender:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// B. Rute External (cucianRoutes) - Menangani detail, tambah, update :id
app.use('/api/cucian', cucianRoutes);

// C. Rute List / Riwayat (Root /api/cucian) - DENGAN ITEM TAMBAHAN
app.get('/api/cucian', async (req, res) => {
    const { kamar, tgl_mulai, tgl_selesai } = req.query;
    
    // Menggunakan LEFT JOIN ke cucian_detail dan GROUP_CONCAT untuk menggabungkan item tambahan
    let query = `
        SELECT 
            cucian.*, 
            santri.nama, 
            santri.kamar,
            GROUP_CONCAT(cucian_detail.nama_item SEPARATOR ', ') as item_tambahan
        FROM cucian 
        JOIN santri ON cucian.santri_id = santri.id 
        LEFT JOIN cucian_detail ON cucian.id = cucian_detail.cucian_id
        WHERE 1=1
    `;
    let params = [];

    if (kamar) {
        query += " AND santri.kamar = ?";
        params.push(kamar);
    }
    if (tgl_mulai && tgl_selesai) {
        query += " AND DATE(cucian.tanggal_masuk) BETWEEN ? AND ?";
        params.push(tgl_mulai, tgl_selesai);
    }

    // Wajib menggunakan GROUP BY saat menggunakan GROUP_CONCAT
    query += " GROUP BY cucian.id ORDER BY cucian.tanggal_masuk DESC";

    try {
        const [rows] = await db.execute(query, params);
        res.json(rows);
    } catch (error) {
        console.error("Gagal mengambil riwayat:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// Route untuk menghapus data cucian
app.delete('/cucian/:id', (req, res) => {
    const { id } = req.params;

    // Hapus detailnya dulu karena ada relasi Foreign Key
    const deleteDetail = "DELETE FROM cucian_detail WHERE cucian_id = ?";
    const deleteCucian = "DELETE FROM cucian WHERE id = ?";

    db.query(deleteDetail, [id], (err) => {
        if (err) return res.status(500).json({ error: err.message });

        db.query(deleteCucian, [id], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Data berhasil dihapus" });
        });
    });
});

// --- 4. ROUTE LAINNYA ---
app.use('/api/santri', santriRoutes);

// --- START SERVER ---
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server Barokah Laundry berjalan di http://localhost:${PORT}`);
});