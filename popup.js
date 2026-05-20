// Menunggu halaman HTML selesai dimuat
document.addEventListener('DOMContentLoaded', () => {
  const inputJudul = document.getElementById('input-judul');
  const inputIsi = document.getElementById('input-isi');
  const btnSimpan = document.getElementById('btn-simpan');
  const daftarCatatan = document.getElementById('daftar-catatan');

  // Menampilkan daftar saat popup dibuka
  tampilkanCatatan();

  // Tombol Simpan diklik
  btnSimpan.addEventListener('click', () => {
    const judul = inputJudul.value.trim();
    const isi = inputIsi.value.trim();

    if (judul === '' || isi === '') {
      alert('Judul dan isi teks tidak boleh kosong!');
      return;
    }

    // Mengambil data lama dari storage
    chrome.storage.local.get({ catatanList: [] }, (result) => {
      const catatanBaru = result.catatanList;
      
      // Menambah catatan baru ke dalam array
      catatanBaru.push({ judul: judul, isi: isi, id: Date.now() });

      // Menyimpan kembali ke storage
      chrome.storage.local.set({ catatanList: catatanBaru }, () => {
        // Kosongkan form input
        inputJudul.value = '';
        inputIsi.value = '';
        // Perbarui tampilan daftar
        tampilkanCatatan();
      });
    });
  });

  // Fungsi untuk menampilkan daftar
  function tampilkanCatatan() {
    daftarCatatan.innerHTML = ''; // Kosongkan daftar sebelum diisi ulang

    chrome.storage.local.get({ catatanList: [] }, (result) => {
      const catatanList = result.catatanList;

      catatanList.forEach((catatan) => {
        const li = document.createElement('li');

        // Elemen Judul yang bisa diklik untuk menyalin
        const spanJudul = document.createElement('span');
        spanJudul.className = 'judul-teks';
        spanJudul.textContent = catatan.judul;
        spanJudul.title = "Klik untuk menyalin teks"; // Tooltip

        // Fungsi menyalin saat judul diklik
        spanJudul.addEventListener('click', () => {
          navigator.clipboard.writeText(catatan.isi).then(() => {
            const teksAsli = spanJudul.textContent;
            spanJudul.textContent = '✓ Tersalin!';
            spanJudul.style.color = '#4CAF50';
            
            // Kembalikan ke teks asli setelah 1.5 detik
            setTimeout(() => {
              spanJudul.textContent = teksAsli;
              spanJudul.style.color = '#333';
            }, 1500);
          });
        });

        // Tombol Hapus (Bonus fitur)
        const btnHapus = document.createElement('button');
        btnHapus.className = 'btn-hapus';
        btnHapus.textContent = 'X';
        btnHapus.addEventListener('click', () => hapusCatatan(catatan.id));

        li.appendChild(spanJudul);
        li.appendChild(btnHapus);
        daftarCatatan.appendChild(li);
      });
    });
  }

  // Fungsi untuk menghapus catatan berdasarkan ID
  function hapusCatatan(id) {
    chrome.storage.local.get({ catatanList: [] }, (result) => {
      const catatanBaru = result.catatanList.filter(catatan => catatan.id !== id);
      chrome.storage.local.set({ catatanList: catatanBaru }, () => {
        tampilkanCatatan(); // Perbarui tampilan setelah dihapus
      });
    });
  }
});