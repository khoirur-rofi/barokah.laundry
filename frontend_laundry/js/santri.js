// File ini mengurus fitur Auto-Suggest nama santri

const inputNama = document.getElementById('nama');
const inputKamar = document.getElementById('kamar');
const inputGender = document.getElementById('gender');
const saranContainer = document.getElementById('saran-nama');

// Event saat user mengetik di kolom nama
inputNama.addEventListener('input', async (e) => {
    const keyword = e.target.value;
    
    // Jika ketikan kurang dari 2 huruf, sembunyikan saran
    if (keyword.length < 2) {
        saranContainer.classList.add('d-none');
        return;
    }

    try {
        // Ambil data dari backend
        const response = await fetch(`${BASE_URL}/santri?search=${keyword}`);
        const santriList = await response.json();

        // Bersihkan isi saran sebelumnya
        saranContainer.innerHTML = '';

        if (santriList.length > 0) {
            saranContainer.classList.remove('d-none'); // Tampilkan kotak saran

            santriList.forEach(santri => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'list-group-item list-group-item-action';
                btn.innerText = `${santri.nama} (Kamar: ${santri.kamar})`;
                
                // Jika saran diklik, otomatis isi data
                btn.onclick = () => {
                    inputNama.value = santri.nama;
                    inputKamar.value = santri.kamar;
                    inputGender.value = santri.gender;
                    saranContainer.classList.add('d-none'); // Sembunyikan saran
                };

                saranContainer.appendChild(btn);
            });
        } else {
            saranContainer.classList.add('d-none');
        }
    } catch (error) {
        console.error("Gagal mengambil data santri:", error);
    }
});

// Sembunyikan kotak saran jika user mengklik tempat lain di layar
document.addEventListener('click', (e) => {
    if (e.target !== inputNama) {
        saranContainer.classList.add('d-none');
    }
});