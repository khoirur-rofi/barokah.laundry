// --- PROTEKSI HALAMAN ---
if (sessionStorage.getItem('isLoggedIn') !== 'true') {
    alert("Silakan login terlebih dahulu!");
    window.location.href = 'login.html';
}

const containerRiwayat = document.getElementById('tabel-riwayat');

/**
 * Fungsi utama untuk memuat data
 */
async function loadData() {
    // 1. Ambil nilai filter dari HTML
    const filterKamar = document.getElementById('filter-kamar');
    const filterMulai = document.getElementById('tgl-mulai');
    const filterSelesai = document.getElementById('tgl-selesai');

    const kamar = filterKamar ? filterKamar.value : '';
    const mulai = filterMulai ? filterMulai.value : '';
    const selesai = filterSelesai ? filterSelesai.value : '';

    // 2. DEFINISIKAN VARIABEL URL (Penting agar tidak error)
    // BASE_URL biasanya didefinisikan di api.js
    const url = `${BASE_URL}/cucian?kamar=${encodeURIComponent(kamar)}&tgl_mulai=${mulai}&tgl_selesai=${selesai}`;

    try {
        // Tampilkan loading
        containerRiwayat.innerHTML = '<div class="text-center py-5 text-muted"><div class="spinner-border spinner-border-sm text-primary me-2"></div>Memuat data...</div>';

        const response = await fetch(url);
        const data = await response.json();

        // Debugging: Cek apakah 'item_tambahan' ada di data
        console.log("Data diterima:", data);

        containerRiwayat.innerHTML = '<div class="row g-2" id="riwayat-grid"></div>';
        const grid = document.getElementById('riwayat-grid');

        if (!data || data.length === 0) {
            containerRiwayat.innerHTML = '<div class="text-center py-5 text-muted">Data tidak ditemukan</div>';
            return;
        }

        data.forEach(item => {
            const tgl = new Date(item.tanggal_masuk).toLocaleDateString('id-ID');
            const isLunas = item.status_pembayaran === 'sudah'; 
            const badgeClass = isLunas ? 'bg-success' : 'bg-warning text-dark';
            
            // Tampilkan item tambahan jika ada (contoh: Selimut, Sepatu)
            const infoTambahan = item.item_tambahan ? 
                `<div class="mt-1 fw-bold text-primary" style="font-size: 0.9rem;"><i class="bi bi-plus-circle-fill"></i> ${item.item_tambahan}</div>` : '';

            const col = document.createElement('div');
            col.className = 'col-6 col-md-4 mb-2 px-1';

            col.innerHTML = `
                <div class="card h-100 shadow-sm border-start border-4 ${isLunas ? 'border-success' : 'border-warning'}">
                    <div class="card-body p-3">
                        <div class="d-flex justify-content-between align-items-start mb-1">
                            <div style="max-width: 75%;">
                                <div class="fw-bold text-dark text-truncate" style="font-size: 1.1rem;">${item.nama || 'Tanpa Nama'}</div>
                                <div class="text-muted fw-medium" style="font-size: 0.85rem;">${tgl} | ${item.kamar || '-'}</div>
                            </div>
                            <span class="badge ${badgeClass}" style="font-size: 0.7rem;">${isLunas ? 'LUNAS' : 'BELUM'}</span>
                        </div>
                        
                        <div class="bg-light p-2 rounded mt-2">
                            <div style="font-size: 0.95rem;"><b>Berat:</b> ${item.berat} Kg</div>
                            
                            ${infoTambahan}

                            <div class="fw-bold text-primary mt-1" style="font-size: 1.2rem;">
                                Rp ${Number(item.total_harga).toLocaleString('id-ID')}
                            </div>
                        </div>

                        ${!isLunas ? `
                            <button class="btn btn-sm btn-success w-100 mt-2 py-2 fw-bold" style="font-size: 0.85rem;" onclick="updateStatus(${item.id})">
                                Set Lunas
                            </button>
                        ` : `
                            <div class="text-center mt-2 text-success fw-bold" style="font-size: 0.8rem;">
                                 <i class="bi bi-check-circle-fill"></i> Selesai
                            </div>
                        `}
                    </div>
                </div>
            `;
            grid.appendChild(col);
        });

    } catch (error) {
        console.error("Gagal load riwayat:", error);
        containerRiwayat.innerHTML = '<div class="alert alert-danger p-2 small text-center">Koneksi ke server terputus</div>';
    }
}

/**
 * Fungsi Tandai Lunas
 */
async function updateStatus(id) {
    if (!confirm("Konfirmasi pelunasan?")) return;
    try {
        const response = await fetch(`${BASE_URL}/cucian/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status_pembayaran: 'sudah' })
        });
        if (response.ok) {
            loadData();
        }
    } catch (error) {
        console.error("Error update:", error);
    }
}

// Event listener enter
if (document.getElementById('filter-kamar')) {
    document.getElementById('filter-kamar').addEventListener('keypress', (e) => { 
        if (e.key === 'Enter') loadData(); 
    });
}

// Jalankan saat pertama kali
loadData();