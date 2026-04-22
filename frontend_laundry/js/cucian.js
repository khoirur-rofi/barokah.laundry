// File: js/cucian.js
console.log("=== FILE CUCIAN.JS BERHASIL TERBACA ===");

const containerTambahan = document.getElementById('container-tambahan');
const btnTambahItem = document.getElementById('btnTambahItem');
const formCucian = document.getElementById('formCucian');

// 1. Fitur menambah baris input item tambahan (Selimut/Sepatu)
btnTambahItem.addEventListener('click', () => {
    const row = document.createElement('div');
    row.className = 'row mb-2 item-row';
    row.innerHTML = `
        <div class="col-5">
            <input type="text" class="form-control input-nama-item" placeholder="Item" required>
        </div>
        <div class="col-4">
            <input type="number" class="form-control input-harga-item" placeholder="Harga" required>
        </div>
        <div class="col-2">
            <input type="number" class="form-control input-jumlah-item" value="1" required>
        </div>
        <div class="col-1">
            <button type="button" class="btn btn-danger btn-hapus-item">×</button>
        </div>
    `;
    containerTambahan.appendChild(row);

    row.querySelector('.btn-hapus-item').addEventListener('click', () => row.remove());
});

// 2. Fitur Submit Form
formCucian.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log("=== TOMBOL SIMPAN BERHASIL DITEKAN ===");

    // Ambil nilai berat dan pastikan angkanya valid
    const beratInput = document.getElementById('berat').value;
    const payload = {
        nama: document.getElementById('nama').value,
        kamar: document.getElementById('kamar').value,
        gender: document.getElementById('gender').value,
        berat: parseFloat(beratInput) || 0,
        tambahan: []
    };

    // Ambil data dari baris item tambahan
    const rows = document.querySelectorAll('.item-row');
    rows.forEach(row => {
        payload.tambahan.push({
            nama_item: row.querySelector('.input-nama-item').value,
            harga_satuan: parseFloat(row.querySelector('.input-harga-item').value) || 0,
            jumlah: parseInt(row.querySelector('.input-jumlah-item').value) || 1
        });
    });

    console.log("Data dikirim ke Backend:", payload);

    try {
        console.log("Sedang menghubungi server di:", `${BASE_URL}/api/cucian`);
        
        const response = await fetch(`${BASE_URL}/api/cucian`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        console.log("Status Respon:", response.status); // Harus muncul 200 atau 201

        const result = await response.json();
        console.log("Respon dari Server:", result);

        if (response.ok) {
            alert(`Sukses! Total: Rp ${result.data?.total_harga || 0}`);
            formCucian.reset();
            containerTambahan.innerHTML = '';
        } else {
            alert(`Gagal: ${result.error || 'Server menolak permintaan'}`);
        }
    } catch (error) {
        // JIKA GANTUNG, ERROR INI AKAN MUNCUL SETELAH BEBERAPA DETIK
        console.error("DETEKSI ERROR:", error.message);
        alert("Server Tidak Merespon. Pastikan Backend (Node.js) sudah dijalankan.");
    }
});
