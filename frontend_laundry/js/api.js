const BASE_URL = 'https://barokah-laundry.bonto.run';

function cekLogin() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
        // Mencatat URL halaman yang sedang dibuka (misal: laporan.html)
        sessionStorage.setItem('redirectAfterLogin', window.location.href);
        
        alert("Akses ditolak! Silakan login terlebih dahulu.");
        window.location.href = 'login.html';
    }
}

function prosesKeluar() {
    if (confirm("Apakah Anda yakin ingin keluar?")) {
        sessionStorage.removeItem('isLoggedIn');
        window.location.href = 'index.html'; 
    }
}
