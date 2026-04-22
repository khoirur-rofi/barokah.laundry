// js/laporan.js

async function loadLaporan() {
    const mulai = document.getElementById('lap-mulai').value;
    const selesai = document.getElementById('lap-selesai').value;

    // Peringatan jika tanggal belum dipilih
    if (!mulai || !selesai) {
        alert("Silakan pilih Tanggal Mulai dan Sampai Tanggal terlebih dahulu!");
        return;
    }

    try {
        // Cek di console log browser agar kita tahu request dikirim
        console.log(`Mengirim request: ${BASE_URL}/api/cucian/laporan?tgl_mulai=${mulai}&tgl_selesai=${selesai}`);
        
        const res = await fetch(`${BASE_URL}/api/cucian/laporan?tgl_mulai=${mulai}&tgl_selesai=${selesai}`);
        const data = await res.json();

        console.log("Data diterima dari Server:", data);

        // Memasukkan data ke dalam HTML dengan format Rupiah
        document.getElementById('total-laki').innerText = `Rp ${Number(data.total_laki || 0).toLocaleString('id-ID')}`;
        document.getElementById('total-perempuan').innerText = `Rp ${Number(data.total_perempuan || 0).toLocaleString('id-ID')}`;
        document.getElementById('total-pendapatan').innerText = `Rp ${Number(data.total_pendapatan || 0).toLocaleString('id-ID')}`;
        
        // KUNCI PERBAIKAN: Menghapus class 'd-none' agar hasil muncul di layar
        document.getElementById('hasil-laporan').classList.remove('d-none');

    } catch (error) {
        console.error("Gagal load laporan:", error);
        alert("Terjadi kesalahan saat memuat data dari server.");
    }
}
// Fungsi lainnya (Update Harga)
async function simpanHargaKilo() {
    const harga = document.getElementById('inputHargaKilo').value;
    if (!confirm("Update harga?")) return;
    try {
        const res = await fetch(`${BASE_URL}/api/cucian/pengaturan/harga`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ harga: harga })
        });
        if (res.ok) alert("Harga berhasil diupdate!");
    } catch (e) { console.error(e); }
}
