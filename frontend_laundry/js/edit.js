// ============================================================================
// File: frontend_laundry/js/edit.js
// Deskripsi: Mengelola logika halaman Edit Cucian (Load, Filter, Update, Delete)
// ============================================================================

let allData = []; // Menyimpan data mentah dari server untuk keperluan filter

// --- 1. INISIALISASI & LOAD DATA ---

/**
 * Mengambil data dari server dan menampilkannya pertama kali
 */
async function loadEditData() {
    try {
        const res = await fetch(`${BASE_URL}/cucian`);
        allData = await res.json();
        renderGrid(allData);
    } catch (error) {
        console.error("Gagal memuat data grid:", error);
    }
}

// --- 2. RENDER TAMPILAN (GRID) ---

/**
 * Menampilkan data ke dalam elemen grid di HTML dengan tampilan tombol yang rapi
 * @param {Array} data - Array objek transaksi cucian
 */
function renderGrid(data) {
    const grid = document.getElementById('edit-grid');
    
    if (!data || data.length === 0) {
        grid.innerHTML = '<div class="col-12 text-center text-muted py-5">Data tidak ditemukan.</div>';
        return;
    }

    grid.innerHTML = data.map(t => {
        const borderColor = t.status_pembayaran === 'sudah' ? 'border-success' : 'border-warning';
        
        return `
            <div class="col-6 col-md-4 mb-3 px-1">
                <div class="card h-100 shadow-sm border-start border-4 ${borderColor}">
                    <div class="card-body p-2 d-flex flex-column justify-content-between">
                        <div>
                            <h6 class="fw-bold mb-0 text-truncate" style="font-size: 0.9rem;">${t.nama}</h6>
                            <small class="text-muted" style="font-size: 0.75rem;">
                                <i class="bi bi-door-open"></i> ${t.kamar} | <i class="bi bi-weight"></i> ${t.berat}kg
                            </small>
                        </div>
                        
                        <div class="d-flex gap-2 mt-2">
                            <button onclick="openEditModal('${t.id}', '${t.nama}', '${t.kamar}', ${t.berat})" 
                                    class="btn btn-sm btn-primary flex-grow-1 py-1" 
                                    style="font-size: 0.75rem; border-radius: 6px;">
                                <i class="bi bi-pencil-square"></i> Edit
                            </button>
                            <button onclick="hapusCucian('${t.id}')" 
                                    class="btn btn-sm btn-outline-danger px-2 py-1" 
                                    style="border-radius: 6px;"
                                    title="Hapus">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// --- 3. LOGIKA FILTER (PENCARIAN) ---

/**
 * Menerapkan filter berdasarkan Nama, Kamar, dan Tanggal
 */
function applyFilter() {
    const filterNama = document.getElementById('filterNama').value.toLowerCase().trim();
    const filterKamar = document.getElementById('filterKamar').value.toLowerCase().trim();
    const filterTanggal = document.getElementById('filterTanggal').value;

    const filtered = allData.filter(t => {
        const matchNama = t.nama.toLowerCase().trim().startsWith(filterNama);
        const matchKamar = t.kamar.toLowerCase().trim().startsWith(filterKamar);
        const dateOnly = t.tanggal_masuk.split('T')[0];
        const matchTanggal = filterTanggal === "" || dateOnly === filterTanggal;

        return matchNama && matchKamar && matchTanggal;
    });

    renderGrid(filtered);
}

/**
 * Mengosongkan form pencarian dan mereset tampilan grid
 */
function resetFilter() {
    document.getElementById('filterNama').value = "";
    document.getElementById('filterKamar').value = "";
    document.getElementById('filterTanggal').value = "";
    renderGrid(allData);
}

// Event Listeners untuk Filter
document.getElementById('filterNama')?.addEventListener('input', applyFilter);
document.getElementById('filterKamar')?.addEventListener('input', applyFilter);
document.getElementById('filterTanggal')?.addEventListener('change', applyFilter);


// --- 4. LOGIKA MODAL EDIT ---

function tambahBarisItemEdit(namaItem = '', hargaItem = '') {
    const container = document.getElementById('container-edit-tambahan');
    const div = document.createElement('div');
    div.className = 'row g-2 mb-2 item-tambahan-row align-items-center';
    div.innerHTML = `
        <div class="col-7">
            <input type="text" class="form-control form-control-sm edit-item-nama" value="${namaItem}" required>
        </div>
        <div class="col-3">
            <input type="number" class="form-control form-control-sm edit-item-harga" value="${hargaItem}" required>
        </div>
        <div class="col-2 text-end">
            <button type="button" class="btn btn-danger btn-sm w-100" onclick="this.closest('.item-tambahan-row').remove()">×</button>
        </div>
    `;
    container.appendChild(div);
}

async function openEditModal(id, nama, kamar, berat) {
    document.getElementById('edit-id').value = id;
    document.getElementById('edit-nama').value = nama;
    document.getElementById('edit-kamar').value = kamar;
    document.getElementById('edit-berat').value = berat;
    
    const container = document.getElementById('container-edit-tambahan');
    container.innerHTML = '';

    try {
        const res = await fetch(`${BASE_URL}/cucian/${id}`);
        const data = await res.json();
        if (data.item_tambahan) {
            data.item_tambahan.forEach(item => tambahBarisItemEdit(item.nama, item.harga));
        }
    } catch (e) { 
        console.warn("Gagal memuat item tambahan:", e.message); 
    }

    new bootstrap.Modal(document.getElementById('modalEdit')).show();
}

// --- 5. LOGIKA SIMPAN (UPDATE) ---

document.getElementById('formEditCucian').onsubmit = async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('edit-id').value;
    const itemRows = document.querySelectorAll('.item-tambahan-row');
    
    const updateData = {
        nama: document.getElementById('edit-nama').value,
        kamar: document.getElementById('edit-kamar').value,
        berat: parseFloat(document.getElementById('edit-berat').value) || 0,
        item_tambahan: Array.from(itemRows).map(row => ({
            nama: row.querySelector('.edit-item-nama').value,
            harga: parseInt(row.querySelector('.edit-item-harga').value) || 0
        }))
    };

    try {
        const res = await fetch(`${BASE_URL}/cucian/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        });

        if (res.ok) {
            alert("Data berhasil diperbarui!");
            const modalEl = document.getElementById('modalEdit');
            const modalInstance = bootstrap.Modal.getInstance(modalEl);
            if (modalInstance) modalInstance.hide();
            
            await loadEditData(); 
            applyFilter();
        } else {
            alert("Gagal memperbarui data.");
        }
    } catch (err) {
        console.error("Error update:", err);
    }
};

// --- 6. LOGIKA HAPUS (DELETE) ---

async function hapusCucian(id) {
    if (!confirm("Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.")) {
        return;
    }

    try {
        const res = await fetch(`${BASE_URL}/cucian/${id}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            alert("Data berhasil dihapus!");
            await loadEditData(); 
        } else {
            alert("Gagal menghapus data.");
        }
    } catch (error) {
        console.error("Error menghapus data:", error);
        alert("Terjadi kesalahan koneksi.");
    }
}

// --- 7. AUTO-LOAD ---

loadEditData();
window.addEventListener('focus', loadEditData);