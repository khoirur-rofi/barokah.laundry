const express = require('express');
const router = express.Router();
const cucianController = require('../controllers/cucianController');
// --- 1. RUTE SPESIFIK (Taruh Paling Atas) ---
router.get('/pengaturan/harga', cucianController.getHarga);
router.put('/pengaturan/harga', cucianController.updateHarga);
router.get('/laporan', cucianController.getLaporan);

// Pastikan Anda memanggil fungsi hapusCucian dari controller
router.delete('/:id', cucianController.hapusCucian);

// --- 2. RUTE LIST DATA (Untuk Halaman Riwayat & Edit) ---
// Ini yang digunakan fetch(`${BASE_URL}/cucian`) di frontend
router.get('/', cucianController.getAllCucian); 

// --- 3. RUTE DENGAN PARAMETER ID ---
// Ambil detail satu data (untuk isi Modal Edit)
router.get('/:id', cucianController.getCucianById);

// Update data cucian (Tombol Simpan di Modal Edit)
router.put('/:id', cucianController.updateCucian);

// Update status pembayaran (Tombol Tandai Lunas)
router.put('/:id/status', cucianController.updateStatus);

// --- 4. RUTE TAMBAH DATA ---
router.post('/', cucianController.createCucian);

module.exports = router;