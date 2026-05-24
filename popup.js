document.addEventListener('DOMContentLoaded', () => {
  // --- Deklarasi Elemen ---
  const viewList = document.getElementById('view-list');
  const viewForm = document.getElementById('view-form');
  
  // Elemen Navigasi Tab
  const tabCatatan = document.getElementById('tab-catatan');
  const tabModel = document.getElementById('tab-model');
  const tabCatatanKonten = document.getElementById('tab-catatan-konten');
  const tabModelKonten = document.getElementById('tab-model-konten');

  // Elemen Aksi
  const btnTambah = document.getElementById('btn-tambah');
  const btnAtur = document.getElementById('btn-atur');
  const btnAturModel = document.getElementById('btn-atur-model');
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
  const daftarModelResponse = document.getElementById('daftar-model-response');
  
  const teksPetunjuk = document.getElementById('teks-petunjuk');
  const teksPetunjukModel = document.getElementById('teks-petunjuk-model');

  // --- State / Variabel Global ---
  let isModeAtur = false;
  let isModeAturModel = false;
  let catatanData = [];
  let modelData = [];
  let currentTab = 'catatan'; // 'catatan' atau 'model'

  // Muat data pertama kali
  muatData();

  // --- Logika Perpindahan Tab ---
  tabCatatan.addEventListener('click', () => {
    currentTab = 'catatan';
    tabCatatan.classList.add('active');
    tabModel.classList.remove('active');
    tabCatatanKonten.classList.remove('hidden');
    tabModelKonten.classList.add('hidden');
  });

  tabModel.addEventListener('click', () => {
    currentTab = 'model';
    tabModel.classList.add('active');
    tabCatatan.classList.remove('active');
    tabModelKonten.classList.remove('hidden');
    tabCatatanKonten.classList.add('hidden');
  });

  // --- Navigasi Halaman Form ---
  btnTambah.addEventListener('click', () => bukaForm());
  btnBatal.addEventListener('click', () => {
    tutupForm();
    muatData();
  });

  // --- Mode Atur Catatan Pribadi ---
  btnAtur.addEventListener('click', () => {
    isModeAtur = !isModeAtur;
    btnAtur.textContent = isModeAtur ? "Selesai" : "Atur";
    btnAtur.className = isModeAtur ? "btn-primary" : "btn-secondary";
    teksPetunjuk.textContent = isModeAtur ? "Mode Edit: Ubah urutan, edit, atau hapus." : "Klik judul untuk menyalin teks";
    renderDaftarCatatan();
  });

  // --- Mode Atur Model Response ---
  btnAturModel.addEventListener('click', () => {
    isModeAturModel = !isModeAturModel;
    btnAturModel.textContent = isModeAturModel ? "Selesai" : "Atur";
    btnAturModel.className = isModeAturModel ? "btn-primary" : "btn-secondary";
    teksPetunjukModel.textContent = isModeAturModel ? "Mode Edit: Ubah urutan, edit, atau hapus." : "Klik judul untuk menyalin response";
    renderDaftarModel();
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

    if (currentTab === 'catatan') {
      if (idEdit) {
        const index = catatanData.findIndex(c => c.id == idEdit);
        if (index !== -1) {
          catatanData[index].judul = judul;
          catatanData[index].isi = isi;
        }
      } else {
        catatanData.push({ id: Date.now(), judul: judul, isi: isi });
      }
      simpanCatatanKeStorage(() => tutupForm());
    } else {
      if (idEdit) {
        const index = modelData.findIndex(m => m.id == idEdit);
        if (index !== -1) {
          modelData[index].judul = judul;
          modelData[index].isi = isi;
        }
      } else {
        modelData.push({ id: Date.now(), judul: judul, isi: isi });
      }
      simpanModelKeStorage(() => tutupForm());
    }
  });

  // --- Ambil & Simpan JSON ---
  btnExportResponse.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      alert("Tidak ada tab aktif yang ditemukan.");
      return;
    }

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: ambilModelResponses
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

        unduhJson(dataRespons);
      }
    });
  });

  btnImportResponse.addEventListener('click', () => {
    inputFileJson.click();
  });

  inputFileJson.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const dataRespons = JSON.parse(e.target.result);

        if (!Array.isArray(dataRespons)) {
          alert("Format JSON tidak valid. Harus berupa list/array.");
          return;
        }

        let dataBerhasilDiimport = 0;

        dataRespons.forEach((item) => {
          if (item.text) {
            const judulRespons = `Response Ke-${item.index || dataBerhasilDiimport + 1}`;
            
            modelData.push({
              id: Date.now() + Math.random(),
              judul: judulRespons,
              isi: item.text.trim()
            });
            dataBerhasilDiimport++;
          }
        });

        if (dataBerhasilDiimport > 0) {
          simpanModelKeStorage(() => {
            alert(`Berhasil memuat ${dataBerhasilDiimport} model response!`);
            inputFileJson.value = '';
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

  function unduhJson(data) {
    const stringJson = JSON.stringify(data, null, 2);
    const blob = new Blob([stringJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const linkUnduh = document.createElement('a');
    linkUnduh.href = url;
    linkUnduh.download = `model-responses-${Date.now()}.json`;
    document.body.appendChild(linkUnduh);
    linkUnduh.click();
    
    document.body.removeChild(linkUnduh);
    URL.revokeObjectURL(url);
  }

  // --- Core Functions (Storage & Render) ---
  
  function muatData() {
    chrome.storage.local.get({ catatanList: [], modelList: [] }, (result) => {
      catatanData = result.catatanList;
      modelData = result.modelList;
      renderDaftarCatatan();
      renderDaftarModel();
    });
  }

  function simpanCatatanKeStorage(callback) {
    chrome.storage.local.set({ catatanList: catatanData }, () => {
      renderDaftarCatatan();
      if (callback) callback();
    });
  }

  function simpanModelKeStorage(callback) {
    chrome.storage.local.set({ modelList: modelData }, () => {
      renderDaftarModel();
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

  // Render Tab Catatan Pribadi
  function renderDaftarCatatan() {
    daftarCatatan.innerHTML = '';
    catatanData.forEach((catatan, index) => {
      const li = buatElemenItem(catatan, index, catatanData, isModeAtur, simpanCatatanKeStorage);
      daftarCatatan.appendChild(li);
    });
  }

  // Render Tab Model Response
  function renderDaftarModel() {
    daftarModelResponse.innerHTML = '';
    modelData.forEach((model, index) => {
      const li = buatElemenItem(model, index, modelData, isModeAturModel, simpanModelKeStorage);
      daftarModelResponse.appendChild(li);
    });
  }

  // Helper Reusable function untuk membuat item di list (agar kode tidak berulang)
  function buatElemenItem(item, index, arrayData, modeAtur, fungsiSimpan) {
    const li = document.createElement('li');

    const spanJudul = document.createElement('span');
    spanJudul.className = 'judul-teks';
    spanJudul.textContent = item.judul;

    if (!modeAtur) {
      spanJudul.title = "Klik untuk menyalin teks";
      spanJudul.addEventListener('click', () => {
        navigator.clipboard.writeText(item.isi).then(() => {
          spanJudul.textContent = '✓ Tersalin!';
          spanJudul.style.color = '#4CAF50';
          setTimeout(() => {
            spanJudul.textContent = item.judul;
            spanJudul.style.color = '#333';
          }, 1000);
        });
      });
    } else {
      spanJudul.style.cursor = 'default';
      spanJudul.title = "";
    }
    li.appendChild(spanJudul);

    if (modeAtur) {
      const divAksi = document.createElement('div');
      divAksi.className = 'aksi-item';

      const btnNaik = document.createElement('button');
      btnNaik.className = 'btn-secondary btn-icon';
      btnNaik.innerHTML = '↑';
      btnNaik.disabled = index === 0;
      btnNaik.addEventListener('click', () => {
        const temp = arrayData[index];
        arrayData[index] = arrayData[index - 1];
        arrayData[index - 1] = temp;
        fungsiSimpan();
      });

      const btnTurun = document.createElement('button');
      btnTurun.className = 'btn-secondary btn-icon';
      btnTurun.innerHTML = '↓';
      btnTurun.disabled = index === arrayData.length - 1;
      btnTurun.addEventListener('click', () => {
        const temp = arrayData[index];
        arrayData[index] = arrayData[index + 1];
        arrayData[index + 1] = temp;
        fungsiSimpan();
      });

      const btnEdit = document.createElement('button');
      btnEdit.className = 'btn-secondary btn-icon';
      btnEdit.innerHTML = '✎';
      btnEdit.addEventListener('click', () => bukaForm(item));

      const btnHapus = document.createElement('button');
      btnHapus.className = 'btn-danger btn-icon';
      btnHapus.innerHTML = 'X';
      btnHapus.addEventListener('click', () => {
        if(confirm(`Hapus item "${item.judul}"?`)) {
          arrayData.splice(index, 1);
          fungsiSimpan();
        }
      });

      divAksi.append(btnNaik, btnTurun, btnEdit, btnHapus);
      li.appendChild(divAksi);
    }

    return li;
  }
});