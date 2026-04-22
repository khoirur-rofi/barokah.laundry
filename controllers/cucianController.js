const db = require('../db');

// --- 1. AMBIL DETAIL (Agar Modal Edit Tidak Kosong) ---
exports.getCucianById = async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT c.*, s.nama, s.kamar 
            FROM cucian c 
            LEFT JOIN santri s ON c.santri_id = s.id 
            WHERE c.id = ?`;
        const [rows] = await db.execute(query, [id]);

        if (rows.length === 0) return res.status(404).json({ message: "Data tidak ditemukan" });

        // Ambil item tambahan sesuai nama kolom DB: nama_item, harga_satuan
        const [detail] = await db.execute(
            "SELECT nama_item as nama, harga_satuan as harga FROM cucian_detail WHERE cucian_id = ?", 
            [id]
        );

        res.json({ ...rows[0], item_tambahan: detail });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- 2. UPDATE DATA (Proses Simpan & Hapus Item) ---
// controllers/cucianController.js

// controllers/cucianController.js


exports.updateCucian = async (req, res) => {
    const { id } = req.params;
    const { nama, kamar, berat, item_tambahan } = req.body;
    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        // 1. Ambil data transaksi lama untuk mendapatkan harga_per_kilo
        const [rows] = await conn.execute("SELECT santri_id, harga_per_kilo FROM cucian WHERE id = ?", [id]);
        if (rows.length === 0) return res.status(404).json({ error: "Transaksi tidak ditemukan" });
        
        const { santri_id, harga_per_kilo } = rows[0];

        // 2. Update data Santri (Nama & Kamar)
        await conn.execute("UPDATE santri SET nama = ?, kamar = ? WHERE id = ?", [nama, kamar, santri_id]);

        // 3. HITUNG ULANG BIAYA (Pastikan angka valid)
        const beratNum = parseFloat(berat) || 0;
        const hargaKiloNum = parseFloat(harga_per_kilo) || 0;
        
        const totalKiloan = beratNum * hargaKiloNum;
        
        // Pastikan item_tambahan adalah array sebelum di-reduce
        const tambahanArray = Array.isArray(item_tambahan) ? item_tambahan : [];
        const totalTambahan = tambahanArray.reduce((sum, item) => {
            return sum + (parseInt(item.harga) || 0);
        }, 0);

        const totalHarga = totalKiloan + totalTambahan;

        // 4. Update Tabel Utama `cucian`
        const updateCucianQuery = `
            UPDATE cucian 
            SET berat = ?, total_kiloan = ?, total_tambahan = ?, total_harga = ? 
            WHERE id = ?
        `;
        await conn.execute(updateCucianQuery, [beratNum, totalKiloan, totalTambahan, totalHarga, id]);

        // 5. Update Tabel `cucian_detail`
        await conn.execute("DELETE FROM cucian_detail WHERE cucian_id = ?", [id]);
        
        if (tambahanArray.length > 0) {
            for (const item of tambahanArray) {
                const hargaItem = parseInt(item.harga) || 0;
                await conn.execute(
                    "INSERT INTO cucian_detail (cucian_id, nama_item, jumlah, harga_satuan, subtotal) VALUES (?, ?, ?, ?, ?)",
                    [id, item.nama, 1, hargaItem, hargaItem]
                );
            }
        }

        await conn.commit();
        res.json({ success: true, message: "Data dan Harga berhasil diperbarui" });

    } catch (error) {
        await conn.rollback();
        console.error("EROR SQL saat Update:", error.message);
        res.status(500).json({ error: error.message });
    } finally {
        conn.release();
    }
};

// --- 3. FUNGSI LAIN (Create, List, Status) ---
exports.createCucian = async (req, res) => {
    const { nama, kamar, gender, berat, tambahan } = req.body;
    const conn = await db.getConnection();
    // Di dalam fungsi createCucian, SETELAH await conn.beginTransaction(); tambahkan:

    const [pengaturan] = await conn.execute("SELECT nilai FROM pengaturan WHERE nama_pengaturan = 'harga_per_kilo'");
    const HARGA_PER_KILO = pengaturan.length > 0 ? pengaturan[0].nilai : 5000; // 5000 sbg cadangan

    try {
        await conn.beginTransaction();
        console.log("Memulai proses simpan transaksi untuk:", nama);

        // 1. Cek atau Buat Data Santri
        let [santri] = await conn.execute("SELECT id FROM santri WHERE nama = ?", [nama]);
        let santriId;

        if (santri.length === 0) {
            const [newSantri] = await conn.execute(
                "INSERT INTO santri (nama, kamar, gender) VALUES (?, ?, ?)",
                [nama, kamar, gender]
            );
            santriId = newSantri.insertId;
        } else {
            santriId = santri[0].id;
        }

        // 2. Hitung Biaya
        const totalKiloan = (berat || 0) * HARGA_PER_KILO;
        const totalTambahan = tambahan.reduce((acc, item) => acc + (parseFloat(item.harga_satuan) * parseInt(item.jumlah)), 0);
        const totalHarga = totalKiloan + totalTambahan;

        // 3. Simpan ke Tabel Cucian
        const [result] = await conn.execute(
        "INSERT INTO cucian (santri_id, berat, harga_per_kilo, total_kiloan, total_tambahan, total_harga, status_pembayaran) VALUES (?, ?, ?, ?, ?, ?, 'belum')",
        [santriId, berat, HARGA_PER_KILO, totalKiloan, totalTambahan, totalHarga]
        );

        const cucianId = result.insertId;

        // 4. Simpan Item Tambahan (jika ada)
        if (tambahan && tambahan.length > 0) {
            for (let item of tambahan) {
                await conn.execute(
                    "INSERT INTO cucian_detail (cucian_id, nama_item, jumlah, harga_satuan, subtotal) VALUES (?, ?, ?, ?, ?)",
                    [cucianId, item.nama_item, item.jumlah, item.harga_satuan, (item.harga_satuan * item.jumlah)]
                );
            }
        }

        await conn.commit();
        console.log("Transaksi Berhasil!");

        // 5. KIRIM RESPON (Penting agar browser tidak gantung)
        res.status(201).json({
            success: true,
            message: "Transaksi berhasil disimpan",
            data: { total_harga: totalHarga }
        });

    } catch (error) {
        await conn.rollback();
        console.error("Gagal Simpan:", error.message);
        res.status(500).json({ error: error.message });
    } finally {
        conn.release();
    }
};

// controllers/cucianController.js

// controllers/cucianController.js

exports.getAllCucian = async (req, res) => {
    try {
        const { kamar, tgl_mulai, tgl_selesai } = req.query;
        
        // QUERY DIPERBARUI: Menambahkan GROUP_CONCAT untuk mengambil item tambahan
        let query = `
            SELECT 
                c.*, 
                s.nama, 
                s.kamar,
                (SELECT GROUP_CONCAT(nama_item SEPARATOR ', ') 
                 FROM cucian_detail 
                 WHERE cucian_detail.cucian_id = c.id) as item_tambahan
            FROM cucian c 
            JOIN santri s ON c.santri_id = s.id 
            WHERE 1=1`;
        
        const params = [];

        // Filter Kamar
        if (kamar && kamar.trim() !== "") {
            query += " AND s.kamar LIKE ?";
            params.push(`%${kamar.trim()}%`); 
        }

        // Filter Rentang Tanggal
        if (tgl_mulai && tgl_selesai) {
            query += " AND DATE(c.tanggal_masuk) BETWEEN ? AND ?";
            params.push(tgl_mulai, tgl_selesai);
        } else if (tgl_mulai) {
            query += " AND DATE(c.tanggal_masuk) >= ?";
            params.push(tgl_mulai);
        } else if (tgl_selesai) {
            query += " AND DATE(c.tanggal_masuk) <= ?";
            params.push(tgl_selesai);
        }

        query += " ORDER BY c.tanggal_masuk DESC";

        const [rows] = await db.execute(query, params);
        res.json(rows);
    } catch (error) {
        console.error("Error Get Riwayat:", error.message);
        res.status(500).json({ error: error.message });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        await db.execute("UPDATE cucian SET status_pembayaran = ? WHERE id = ?", [req.body.status_pembayaran, req.params.id]);
        res.json({ message: "Status diperbarui" });
    } catch (error) { res.status(500).json({ error: error.message }); }
};

// --- FITUR PENGATURAN HARGA ---
// controllers/cucianController.js

// Fungsi mengambil harga
exports.getHarga = async (req, res) => {
    try {
        // SQL Anda: nama_pengaturan = 'harga_per_kilo', kolom data = 'nilai'
        const [rows] = await db.execute(
            "SELECT nilai FROM pengaturan WHERE nama_pengaturan = 'harga_per_kilo' LIMIT 1"
        );
        res.json({ harga: rows[0]?.nilai || 0 });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Fungsi update harga
exports.updateHarga = async (req, res) => {
    try {
        const { harga } = req.body;
        // Update kolom 'nilai'
        await db.execute(
            "UPDATE pengaturan SET nilai = ? WHERE nama_pengaturan = 'harga_per_kilo'",
            [harga]
        );
        res.json({ message: "Harga berhasil diperbarui!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// HAPUS SEMUA FUNGSI getLaporan YANG LAMA, GANTI DENGAN INI:
// controllers/cucianController.js
exports.getLaporan = async (req, res) => {
    try {
        const { tgl_mulai, tgl_selesai } = req.query;
        
        // Log ini ADALAH BUKTI bahwa fungsi ini berjalan.
        // Jika tidak muncul di terminal VS Code, berarti server belum terupdate.
        console.log("=== MENJALANKAN QUERY LAPORAN ===");
        console.log(`Rentang: ${tgl_mulai} s/d ${tgl_selesai}`);

        const query = `
            SELECT SUM(total_harga) as total 
            FROM cucian 
            WHERE status_pembayaran LIKE '%sudah%' 
            AND DATE(tanggal_masuk) BETWEEN ? AND ?
        `;

        const [rows] = await db.execute(query, [tgl_mulai, tgl_selesai]);
        
        console.log("Hasil Mentah Database:", rows[0].total);

        // Jika null, paksa jadi 0 untuk menghindari error di frontend
        const hasil = rows[0].total || 0;

        res.json({ total_pendapatan: hasil });
    } catch (error) {
        console.error("Gagal di Controller:", error);
        res.status(500).json({ error: error.message });
    }
};

// --- FUNGSI MENGHAPUS DATA (DELETE) ---
exports.hapusCucian = async (req, res) => {
    const { id } = req.params;
    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        // 1. Hapus detail cucian (karena ada relasi database)
        await conn.execute("DELETE FROM cucian_detail WHERE cucian_id = ?", [id]);

        // 2. Hapus data utama cucian
        const [result] = await conn.execute("DELETE FROM cucian WHERE id = ?", [id]);

        if (result.affectedRows === 0) {
            await conn.rollback();
            return res.status(404).json({ message: "Data tidak ditemukan" });
        }

        await conn.commit();
        res.json({ success: true, message: "Data berhasil dihapus" });

    } catch (error) {
        await conn.rollback();
        console.error("Gagal Hapus Data:", error.message);
        res.status(500).json({ error: error.message });
    } finally {
        conn.release();
    }
};


    }
};

