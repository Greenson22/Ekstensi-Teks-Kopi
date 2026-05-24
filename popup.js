document.addEventListener('DOMContentLoaded', () => {
  // --- Deklarasi Elemen ---
  const viewList = document.getElementById('view-list');
  const viewForm = document.getElementById('view-form');
  
  const tabCatatan = document.getElementById('tab-catatan');
  const tabModel = document.getElementById('tab-model');
  const tabCatatanKonten = document.getElementById('tab-catatan-konten');
  const tabModelKonten = document.getElementById('tab-model-konten');

  const btnTambah = document.getElementById('btn-tambah');
  const btnAtur = document.getElementById('btn-atur');
  const btnAturModel = document.getElementById('btn-atur-model');
  const btnBatal = document.getElementById('btn-batal');
  const btnSimpan = document.getElementById('btn-simpan');
  const btnExportResponse = document.getElementById('btn-export-response');
  const btnImportResponse = document.getElementById('btn-import-response');
  const inputFileJson = document.getElementById('input-file-json');
  
  // Elemen Hapus Semua Baru
  const btnHapusSemuaCatatan = document.getElementById('btn-hapus-semua-catatan');
  const btnHapusSemuaModel = document.getElementById('btn-hapus-semua-model');
  
  const inputId = document.getElementById('input-id');
  const inputJudul = document.getElementById('input-judul');
  const inputIsi = document.getElementById('input-isi');
  const judulForm = document.getElementById('judul-form');
  
  const daftarCatatan = document.getElementById('daftar-catatan');
  const daftarModelResponse = document.getElementById('daftar-model-response');
  
  const teksPetunjuk = document.getElementById('teks-petunjuk');
  const teksPetunjukModel = document.getElementById('teks-petunjuk-model');

  let isModeAtur = false;
  let isModeAturModel = false;
  let catatanData = [];
  let modelData = [];
  let currentTab = 'catatan';

  muatData();

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

  btnTambah.addEventListener('click', () => bukaForm());
  btnBatal.addEventListener('click', () => {
    tutupForm();
    muatData();
  });

  // Mode Atur Catatan Pribadi
  btnAtur.addEventListener('click', () => {
    isModeAtur = !isModeAtur;
    btnAtur.textContent = isModeAtur ? "Selesai" : "Atur";
    btnAtur.className = isModeAtur ? "btn-primary" : "btn-secondary";
    teksPetunjuk.textContent = isModeAtur ? "Mode Edit: Ubah urutan, edit, atau hapus." : "Klik judul untuk menyalin teks";
    
    // Tampilkan tombol Hapus Semua hanya jika sedang mengatur dan data tidak kosong
    btnHapusSemuaCatatan.style.display = (isModeAtur && catatanData.length > 0) ? "block" : "none";
    renderDaftarCatatan();
  });

  // Mode Atur Model Response
  btnAturModel.addEventListener('click', () => {
    isModeAturModel = !isModeAturModel;
    btnAturModel.textContent = isModeAturModel ? "Selesai" : "Atur";
    btnAturModel.className = isModeAturModel ? "btn-primary" : "btn-secondary";
    teksPetunjukModel.textContent = isModeAturModel ? "Mode Edit: Ubah urutan, edit, atau hapus." : "Klik judul untuk menyalin response";
    
    // Tampilkan tombol Hapus Semua hanya jika sedang mengatur dan data tidak kosong
    btnHapusSemuaModel.style.display = (isModeAturModel && modelData.length > 0) ? "block" : "none";
    renderDaftarModel();
  });

  // Logika Aksi Hapus Semua dengan Konfirmasi Jendela Popup
  btnHapusSemuaCatatan.addEventListener('click', () => {
    const konfirmasi = confirm("APAKAH ANDA YAKIN?\\nTindakan ini akan menghapus SELURUH catatan pribadi Anda secara permanen.");
    if (konfirmasi) {
      catatanData = [];
      simpanCatatanKeStorage(() => {
        isModeAtur = false;
        btnAtur.textContent = "Atur";
        btnAtur.className = "btn-secondary";
        teksPetunjuk.textContent = "Klik judul untuk menyalin teks";
        btnHapusSemuaCatatan.style.display = "none";
        alert("Semua catatan pribadi telah dibersihkan.");
      });
    }
  });

  btnHapusSemuaModel.addEventListener('click', () => {
    const konfirmasi = confirm("APAKAH ANDA YAKIN?\\nTindakan ini akan menghapus SELURUH data model response secara permanen.");
    if (konfirmasi) {
      modelData = [];
      simpanModelKeStorage(() => {
        isModeAturModel = false;
        btnAturModel.textContent = "Atur";
        btnAturModel.className = "btn-secondary";
        teksPetunjukModel.textContent = "Klik judul untuk menyalin response";
        btnHapusSemuaModel.style.display = "none";
        alert("Semua model response telah dibersihkan.");
      });
    }
  });

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
        if (index !== -1) { var _ = catatanData; _[index].judul = judul; _[index].isi = isi; }
      } else {
        catatanData.push({ id: Date.now(), judul: judul, isi: isi });
      }
      simpanCatatanKeStorage(() => { tutupForm(); isModeAtur = false; });
    } else {
      if (idEdit) {
        const index = modelData.findIndex(m => m.id == idEdit);
        if (index !== -1) { var _ = modelData; _[index].judul = judul; _[index].isi = isi; }
      } else {
        modelData.push({ id: Date.now(), judul: judul, isi: isi });
      }
      simpanModelKeStorage(() => { tutupForm(); isModeAturModel = false; });
    }
  });

  btnExportResponse.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const elements = document.querySelectorAll('model-response');
        return Array.from(elements).map((el, i) => ({ index: i + 1, timestamp: new Date().toISOString(), text: el.innerText.trim() }));
      }
    }, (results) => {
      if (results && results[0] && results[0].result) {
        const data = results[0].result;
        if (data.length === 0) { alert("Tidak ditemukan elemen <model-response>."); return; }
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `model-responses-${Date.now()}.json`;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
      }
    });
  });

  btnImportResponse.addEventListener('click', () => inputFileJson.click());
  inputFileJson.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const res = JSON.parse(evt.target.result);
        if (!Array.isArray(res)) return;
        res.forEach((item, index) => {
          if (item.text) modelData.push({ id: Date.now() + Math.random(), judul: `Response Ke-${item.index || index + 1}`, isi: item.text.trim() });
        });
        simpanModelKeStorage(() => { alert("Model response berhasil dimuat!"); inputFileJson.value = ''; });
      } catch (err) { alert("File JSON tidak valid."); }
    };
    reader.readAsText(file);
  });

  function muatData() {
    chrome.storage.local.get({ catatanList: [], modelList: [] }, (result) => {
      catatanData = result.catatanList; modelData = result.modelList;
      renderDaftarCatatan(); renderDaftarModel();
    });
  }

  function simpanCatatanKeStorage(callback) {
    chrome.storage.local.set({ catatanList: catatanData }, () => { renderDaftarCatatan(); if (callback) callback(); });
  }

  function simpanModelKeStorage(callback) {
    chrome.storage.local.set({ modelList: modelData }, () => { renderDaftarModel(); if (callback) callback(); });
  }

  function bukaForm(dataEdit = null) {
    viewList.classList.add('hidden'); viewForm.classList.remove('hidden');
    if (dataEdit) {
      judulForm.textContent = "Edit Catatan"; inputId.value = dataEdit.id;
      inputJudul.value = dataEdit.judul; inputIsi.value = dataEdit.isi;
    } else {
      judulForm.textContent = "Tambah Catatan"; inputId.value = ''; inputJudul.value = ''; inputIsi.value = '';
    }
  }

  function tutupForm() { viewForm.classList.add('hidden'); viewList.classList.remove('hidden'); }

  function renderDaftarCatatan() {
    daftarCatatan.innerHTML = '';
    if (!isModeAtur || catatanData.length === 0) btnHapusSemuaCatatan.style.display = "none";
    catatanData.forEach((catatan, index) => {
      daftarCatatan.appendChild(buatElemenItem(catatan, index, catatanData, isModeAtur, simpanCatatanKeStorage, false));
    });
  }

  function renderDaftarModel() {
    daftarModelResponse.innerHTML = '';
    if (!isModeAturModel || modelData.length === 0) btnHapusSemuaModel.style.display = "none";
    modelData.forEach((model, index) => {
      daftarModelResponse.appendChild(buatElemenItem(model, index, modelData, isModeAturModel, simpanModelKeStorage, true));
    });
  }

  function buatElemenItem(item, index, arrayData, modeAtur, fungsiSimpan, isModelResponse = false) {
    const li = document.createElement('li');
    li.style.flexDirection = 'column';
    li.style.alignItems = 'stretch';
    li.style.gap = '4px';

    const barisAtas = document.createElement('div');
    barisAtas.style.display = 'flex';
    barisAtas.style.justifyContent = 'space-between';
    barisAtas.style.alignItems = 'center';

    const spanJudul = document.createElement('span');
    spanJudul.className = 'judul-teks';
    spanJudul.textContent = item.judul;

    if (!modeAtur) {
      spanJudul.title = "Klik untuk menyalin teks";
      spanJudul.addEventListener('click', () => {
        navigator.clipboard.writeText(item.isi).then(() => {
          spanJudul.textContent = '✓ Tersalin!'; spanJudul.style.color = '#4CAF50';
          setTimeout(() => { spanJudul.textContent = item.judul; spanJudul.style.color = '#333'; }, 1000);
        });
      });
    } else {
      spanJudul.style.cursor = 'default';
    }
    barisAtas.appendChild(spanJudul);

    if (modeAtur) {
      const divAksi = document.createElement('div');
      divAksi.className = 'aksi-item';
      
      const btnNaik = document.createElement('button'); btnNaik.className = 'btn-secondary btn-icon'; btnNaik.innerHTML = '↑'; btnNaik.disabled = index === 0;
      btnNaik.addEventListener('click', () => { const t = arrayData[index]; arrayData[index] = arrayData[index-1]; arrayData[index-1] = t; fungsiSimpan(); });

      const btnTurun = document.createElement('button'); btnTurun.className = 'btn-secondary btn-icon'; btnTurun.innerHTML = '↓'; btnTurun.disabled = index === arrayData.length - 1;
      btnTurun.addEventListener('click', () => { const t = arrayData[index]; arrayData[index] = arrayData[index+1]; arrayData[index+1] = t; fungsiSimpan(); });

      const btnEdit = document.createElement('button'); btnEdit.className = 'btn-secondary btn-icon'; btnEdit.innerHTML = '✎';
      btnEdit.addEventListener('click', () => bukaForm(item));

      const btnHapus = document.createElement('button'); btnHapus.className = 'btn-danger btn-icon'; btnHapus.innerHTML = 'X';
      btnHapus.addEventListener('click', () => { if(confirm(`Hapus "${item.judul}"?`)) { arrayData.splice(index, 1); fungsiSimpan(); } });

      divAksi.append(btnNaik, btnTurun, btnEdit, btnHapus);
      barisAtas.appendChild(divAksi);
    }
    li.appendChild(barisAtas);

    // Fitur Menampilkan Kata Awal / Cuplikan teks (Khusus Model Response)
    if (isModelResponse && item.isi) {
      const pCuplikan = document.createElement('p');
      pCuplikan.className = 'cuplikan-teks';
      
      // Ambil 60 karakter awal isi teks model response untuk dijadikan preview
      const cuplikan = item.isi.length > 65 ? item.isi.substring(0, 62) + '...' : item.isi;
      pCuplikan.textContent = cuplikan;
      li.appendChild(pCuplikan);
    }

    return li;
  }
});