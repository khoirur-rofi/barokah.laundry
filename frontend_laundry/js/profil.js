// PROTEKSI HALAMAN
if (sessionStorage.getItem('isLoggedIn') !== 'true') {
    window.location.href = 'login.html';
}

document.getElementById('formProfil').onsubmit = async (e) => {
    e.preventDefault();

    const oldUsername = document.getElementById('old-username').value;
    const oldPassword = document.getElementById('old-password').value;
    const newUsername = document.getElementById('new-username').value;
    const newPassword = document.getElementById('new-password').value;

    if (!confirm("Konfirmasi perubahan akses admin? Anda akan diminta login ulang.")) return;

    try {
        const res = await fetch(`${BASE_URL}/admin/update`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                oldUsername, 
                oldPassword, 
                newUsername, 
                newPassword 
            })
        });

        const result = await res.json();
        
        if (res.ok) {
            alert("Berhasil! Data admin telah diperbarui.");
            sessionStorage.removeItem('isLoggedIn');
            window.location.href = 'login.html';
        } else {
            // Menampilkan pesan error dari backend (misal: "Password lama salah")
            alert("Gagal: " + result.message);
        }
    } catch (error) {
        console.error(error);
        alert("Terjadi kesalahan koneksi ke server.");
    }
};

function logout() {
    sessionStorage.removeItem('isLoggedIn');
    window.location.href = 'login.html';
}