document.addEventListener('DOMContentLoaded', () => {
  // --- Deklarasi Elemen ---
  const viewList = document.getElementById('view-list');
  const viewForm = document.getElementById('view-form');
  
  const btnTambah = document.getElementById('btn-tambah');
  const btnAtur = document.getElementById('btn-atur');
  const btnBatal = document.getElementById('btn-batal');
  const btnSimpan = document.getElementById('btn-simpan');
  const btnExportResponse = document.getElementById('btn-export-response');
  const btnImportResponse = document.getElementById('btn-import-response');
  const inputFileJson = document.getElementById('input-file-json');
  
  const inputId = document.getElementById('input-id');
  const inputJudul = document.getElementById('input-judul');
  const inputIsi = document.getElementById('input-isi');
  const judulForm = document.getElementById('judul-form');
  const daftarCatatan = document.getElementById('daftar-catatan');
  const teksPetunjuk = document.getElementById('teks-petunjuk');

  // --- State / Variabel Global ---
  let isModeAtur = false;
  let catatanData = [];

  // Muat data pertama kali
  muatData();

  // --- Navigasi Halaman ---
  btnTambah.addEventListener('click', () => bukaForm());
  btnBatal.addEventListener('click', () => {
    tutupForm();
    muatData();
  });

  // --- Mode Atur (Tampilkan tombol edit/hapus) ---
  btnAtur.addEventListener('click', () => {
    isModeAtur = !isModeAtur; // Toggle status (True/False)
    btnAtur.textContent = isModeAtur ? "Selesai" : "Atur";
    btnAtur.className = isModeAtur ? "btn-primary" : "btn-secondary";
    teksPetunjuk.textContent = isModeAtur ? "Mode Edit: Ubah urutan, edit, atau hapus." : "Klik judul untuk menyalin teks";
    renderDaftar(); // Render ulang daftar dengan/tanpa tombol aksi
  });

  // --- Fungsi Form (Simpan/Edit) ---
  btnSimpan.addEventListener('click', () => {
    const judul = inputJudul.value.trim();
    const isi = inputIsi.value.trim();
    const idEdit = inputId.value;

    if (!judul || !isi) {
      alert('Judul dan isi teks tidak boleh kosong!');
      return;
    }

    if (idEdit) {
      // Mode Edit: Update data yang ada
      const index = catatanData.findIndex(c => c.id == idEdit);
      if (index !== -1) {
        catatanData[index].judul = judul;
        catatanData[index].isi = isi;
      }
    } else {
      // Mode Tambah Baru
      catatanData.push({ id: Date.now(), judul: judul, isi: isi });
    }

    simpanKeStorage(() => tutupForm());
  });

  // --- Event Listener untuk Tombol Ambil & Simpan JSON ---
  btnExportResponse.addEventListener('click', async () => {
    // Ambil tab aktif saat ini
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      alert("Tidak ada tab aktif yang ditemukan.");
      return;
    }

    // Jalankan skrip di halaman web aktif
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: ambilModelResponses // Fungsi yang akan dijalankan di halaman web
    }, (results) => {
      if (chrome.runtime.lastError) {
        alert("Gagal mengambil data: " + chrome.runtime.lastError.message);
        return;
      }

      if (results && results[0] && results[0].result) {
        const dataRespons = results[0].result;
        
        if (dataRespons.length === 0) {
          alert("Tidak ditemukan elemen <model-response> di halaman ini.");
          return;
        }

        // Proses download file JSON
        unduhJson(dataRespons);
      }
    });
  });

  // Memicu klik pada input file tersembunyi saat tombol ditekan
  btnImportResponse.addEventListener('click', () => {
    inputFileJson.click();
  });

  // Menangani perubahan file (ketika user memilih file JSON)
  inputFileJson.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const dataRespons = JSON.parse(e.target.result);

        // Validasi apakah struktur file JSON sesuai dengan format export
        if (!Array.isArray(dataRespons)) {
          alert("Format JSON tidak valid. Harus berupa list/array.");
          return;
        }

        let dataBerhasilDiimport = 0;

        dataRespons.forEach((item) => {
          // Pastikan item memiliki isi teks
          if (item.text) {
            const judulRespons = `Response Ke-${item.index || dataBerhasilDiimport + 1}`;
            
            // Masukkan ke array catatanData dengan format ekstensi Anda
            catatanData.push({
              id: Date.now() + Math.random(), // ID Unik agar tidak bentrok
              judul: judulRespons,
              isi: item.text.trim()
            });
            dataBerhasilDiimport++;
          }
        });

        if (dataBerhasilDiimport > 0) {
          // Simpan ke storage lokal chrome dan perbarui tampilan daftar
          simpanKeStorage(() => {
            alert(`Berhasil memuat ${dataBerhasilDiimport} model response!`);
            inputFileJson.value = ''; // Reset input file
          });
        } else {
          alert("Tidak ada data response valid yang bisa dimuat.");
        }

      } catch (err) {
        alert("Gagal membaca file JSON. Pastikan file tidak rusak.");
        console.error(err);
      }
    };

    reader.readAsText(file);
  });

  // Fungsi ini berjalan langsung DI DALAM HALAMAN WEB yang sedang dibuka
  function ambilModelResponses() {
    const modelResponses = document.querySelectorAll('model-response');
    const hasil = [];

    modelResponses.forEach((response, index) => {
      hasil.push({
        index: index + 1,
        timestamp: new Date().toISOString(),
        text: response.innerText.trim()
      });
    });

    return hasil;
  }

  // Fungsi untuk membuat teks JSON menjadi file dan mengunduhnya
  function unduhJson(data) {
    const stringJson = JSON.stringify(data, null, 2); // Format JSON agar rapi (indentasi 2 spasi)
    const blob = new Blob([stringJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    // Membuat elemen link sementara untuk memicu download
    const linkUnduh = document.createElement('a');
    linkUnduh.href = url;
    linkUnduh.download = `model-responses-${Date.now()}.json`; // Nama file unik berdasarkan waktu
    document.body.appendChild(linkUnduh);
    linkUnduh.click();
    
    // Bersihkan elemen setelah selesai download
    document.body.removeChild(linkUnduh);
    URL.revokeObjectURL(url);
  }

  // --- Core Functions ---
  
  function muatData() {
    chrome.storage.local.get({ catatanList: [] }, (result) => {
      catatanData = result.catatanList;
      renderDaftar();
    });
  }

  function simpanKeStorage(callback) {
    chrome.storage.local.set({ catatanList: catatanData }, () => {
      renderDaftar();
      if (callback) callback();
    });
  }

  function bukaForm(dataEdit = null) {
    viewList.classList.add('hidden');
    viewForm.classList.remove('hidden');
    
    if (dataEdit) {
      judulForm.textContent = "Edit Catatan";
      inputId.value = dataEdit.id;
      inputJudul.value = dataEdit.judul;
      inputIsi.value = dataEdit.isi;
    } else {
      judulForm.textContent = "Tambah Catatan";
      inputId.value = '';
      inputJudul.value = '';
      inputIsi.value = '';
    }
  }

  function tutupForm() {
    viewForm.classList.add('hidden');
    viewList.classList.remove('hidden');
  }

  function renderDaftar() {
    daftarCatatan.innerHTML = '';

    catatanData.forEach((catatan, index) => {
      const li = document.createElement('li');

      // Elemen Judul
      const spanJudul = document.createElement('span');
      spanJudul.className = 'judul-teks';
      spanJudul.textContent = catatan.judul;

      // Jika TIDAK dalam mode atur, klik judul akan menyalin
      if (!isModeAtur) {
        spanJudul.title = "Klik untuk menyalin teks";
        spanJudul.addEventListener('click', () => {
          navigator.clipboard.writeText(catatan.isi).then(() => {
            spanJudul.textContent = '✓ Tersalin!';
            spanJudul.style.color = '#4CAF50';
            setTimeout(() => {
              spanJudul.textContent = catatan.judul;
              spanJudul.style.color = '#333';
            }, 1000);
          });
        });
      } else {
        spanJudul.style.cursor = 'default';
        spanJudul.title = "";
      }
      li.appendChild(spanJudul);

      // Jika DALAM mode atur, tampilkan tombol aksi
      if (isModeAtur) {
        const divAksi = document.createElement('div');
        divAksi.className = 'aksi-item';

        // Tombol Naik
        const btnNaik = document.createElement('button');
        btnNaik.className = 'btn-secondary btn-icon';
        btnNaik.innerHTML = '↑';
        btnNaik.disabled = index === 0; // Matikan jika paling atas
        btnNaik.addEventListener('click', () => pindahPosisi(index, -1));

        // Tombol Turun
        const btnTurun = document.createElement('button');
        btnTurun.className = 'btn-secondary btn-icon';
        btnTurun.innerHTML = '↓';
        btnTurun.disabled = index === catatanData.length - 1; // Matikan jika paling bawah
        btnTurun.addEventListener('click', () => pindahPosisi(index, 1));

        // Tombol Edit
        const btnEdit = document.createElement('button');
        btnEdit.className = 'btn-secondary btn-icon';
        btnEdit.innerHTML = '✎';
        btnEdit.addEventListener('click', () => bukaForm(catatan));

        // Tombol Hapus
        const btnHapus = document.createElement('button');
        btnHapus.className = 'btn-danger btn-icon';
        btnHapus.innerHTML = 'X';
        btnHapus.addEventListener('click', () => {
          if(confirm(`Hapus catatan "${catatan.judul}"?`)) {
            catatanData.splice(index, 1);
            simpanKeStorage();
          }
        });

        divAksi.append(btnNaik, btnTurun, btnEdit, btnHapus);
        li.appendChild(divAksi);
      }

      daftarCatatan.appendChild(li);
    });
  }

  function pindahPosisi(index, arah) {
    // arah: -1 untuk naik, 1 untuk turun
    const tujuan = index + arah;
    // Tukar posisi di array
    const temp = catatanData[index];
    catatanData[index] = catatanData[tujuan];
    catatanData[tujuan] = temp;
    
    simpanKeStorage();
  }
});