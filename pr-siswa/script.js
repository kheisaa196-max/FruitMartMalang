// ============================================================
//  PR TRACKER — script.js
// ============================================================

const API_URL = "https://script.google.com/macros/s/AKfycbz67DXfu_AhQdZtBST3nOcnwKnjuX2nKb5MOIXHc4paaQ2xx2j6w8B3n4wox63z69LgbA/exec";

let allData = [];

// ============================================================
//  INISIALISASI
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("deadline").value = today;
  loadData();
});

// ============================================================
//  LOAD DATA — coba fetch dulu, fallback ke JSONP
// ============================================================
async function loadData() {
  showState("loading");

  // Coba fetch biasa dulu (works di Live Server / hosting)
  try {
    const res = await fetch(API_URL, { redirect: "follow" });
    const text = await res.text();
    const json = JSON.parse(text);
    if (json && json.success) {
      processData(json.data);
      return;
    }
  } catch (e) {
    // fetch gagal (misal dari file://), coba JSONP
  }

  // Fallback: JSONP
  loadViaJSONP();
}

// ============================================================
//  JSONP fallback
// ============================================================
function loadViaJSONP() {
  const old = document.getElementById("_jsonp");
  if (old) old.remove();

  const cb = "_cb" + Date.now();
  let done = false;

  const timer = setTimeout(() => {
    if (!done) {
      done = true;
      delete window[cb];
      showToast("Timeout koneksi ke Sheets", "error");
      loadDemoData();
    }
  }, 8000);

  window[cb] = function(json) {
    if (done) return;
    done = true;
    clearTimeout(timer);
    delete window[cb];
    const s = document.getElementById("_jsonp");
    if (s) s.remove();

    if (json && json.success) {
      processData(json.data);
    } else {
      showToast("Error: " + (json && json.error || "unknown"), "error");
      loadDemoData();
    }
  };

  const s = document.createElement("script");
  s.id  = "_jsonp";
  s.src = API_URL + "?callback=" + cb + "&t=" + Date.now();
  s.onerror = () => {
    if (!done) {
      done = true;
      clearTimeout(timer);
      delete window[cb];
      loadDemoData();
    }
  };
  document.head.appendChild(s);
}

// ============================================================
//  PROSES DATA dari Sheets
// ============================================================
function processData(raw) {
  // Buang baris header yang ikut terbaca
  allData = (raw || []).filter(r =>
    r.hari && r.hari.toLowerCase() !== "hari" &&
    r.mapel && r.mapel.toLowerCase() !== "mapel"
  );
  renderTable(allData);
  updateStats(allData);
}

// ============================================================
//  DATA DEMO
// ============================================================
function loadDemoData() {
  const today = new Date();
  const fmt = d => d.toISOString().split("T")[0];
  const add = n => { const d = new Date(today); d.setDate(today.getDate() + n); return d; };

  allData = [
    { hari: "Senin",  mapel: "Matematika",      tugas: "Kerjakan soal hal. 45 no. 1–10",     deadline: fmt(add(1)),  status: "Belum"   },
    { hari: "Selasa", mapel: "Bahasa Indonesia", tugas: "Buat ringkasan bab 3",                deadline: fmt(add(3)),  status: "Selesai" },
    { hari: "Rabu",   mapel: "IPA",              tugas: "Laporan praktikum fotosintesis",       deadline: fmt(add(-1)), status: "Belum"   },
    { hari: "Kamis",  mapel: "Bahasa Inggris",   tugas: "Write a short paragraph about hobby", deadline: fmt(add(7)),  status: "Belum"   },
    { hari: "Jumat",  mapel: "IPS",              tugas: "Peta konsep Kerajaan Nusantara",      deadline: fmt(add(2)),  status: "Selesai" },
  ];
  renderTable(allData);
  updateStats(allData);
  showToast("⚠️ Mode demo — tidak terhubung ke Sheets", "info");
}

// ============================================================
//  RENDER TABEL
// ============================================================
function renderTable(data) {
  const tbody = document.getElementById("prTableBody");
  tbody.innerHTML = "";

  if (!data || data.length === 0) {
    showState("empty");
    return;
  }

  showState("table");

  data.forEach((row, i) => {
    const tr = document.createElement("tr");
    const deadlineClass = getDeadlineClass(row.deadline, row.status);
    const deadlineText  = formatDeadline(row.deadline);
    const sisa          = getSisaHari(row.deadline, row.status);
    const badgeClass    = row.status === "Selesai" ? "badge-selesai" : "badge-belum";
    const badgeIcon     = row.status === "Selesai" ? "✅" : "⏳";
    const btnClass      = row.status === "Selesai" ? "done" : "";
    const btnText       = row.status === "Selesai" ? "↩ Belum" : "✔ Selesai";

    tr.innerHTML = `
      <td class="td-num">${i + 1}</td>
      <td class="td-hari">${escHtml(row.hari)}</td>
      <td class="td-mapel">${escHtml(row.mapel)}</td>
      <td class="td-tugas">${escHtml(row.tugas)}</td>
      <td>
        <span class="${deadlineClass}">${deadlineText}</span>
        ${sisa !== null ? `<br><small style="font-size:11px;opacity:.7">${sisa}</small>` : ""}
      </td>
      <td><span class="badge ${badgeClass}">${badgeIcon} ${row.status}</span></td>
      <td>
        <button class="btn-toggle-status ${btnClass}" onclick="toggleStatus(${i})">
          ${btnText}
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ============================================================
//  SUBMIT FORM
// ============================================================
async function submitPR(e) {
  e.preventDefault();

  const submitBtn = document.getElementById("submitBtn");
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';

  const data = {
    hari:     document.getElementById("hari").value,
    mapel:    document.getElementById("mapel").value,
    tugas:    document.getElementById("tugas").value,
    deadline: document.getElementById("deadline").value,
    status:   document.getElementById("status").value,
  };

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify(data),
      redirect: "follow",
    });
    const text = await res.text();
    const json = JSON.parse(text);

    if (json && json.success) {
      showToast("🎉 PR berhasil disimpan ke Google Sheets!", "success");
      resetForm();
      loadData();
    } else {
      throw new Error(json.error || "Gagal");
    }
  } catch (err) {
    // Simpan lokal sebagai fallback
    allData.unshift(data);
    renderTable(allData);
    updateStats(allData);
    showToast("✅ Tersimpan! (refresh untuk sync Sheets)", "success");
    resetForm();
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Simpan PR';
  }
}

// ============================================================
//  TOGGLE STATUS
// ============================================================
async function toggleStatus(index) {
  const filtered  = filterCurrentData();
  const row       = filtered[index];
  const realIndex = allData.findIndex(r =>
    r.hari === row.hari && r.mapel === row.mapel &&
    r.tugas === row.tugas && r.deadline === row.deadline
  );
  if (realIndex === -1) return;

  const newStatus = allData[realIndex].status === "Selesai" ? "Belum" : "Selesai";
  allData[realIndex].status = newStatus;
  renderTable(filterCurrentData());
  updateStats(allData);
  showToast(newStatus === "Selesai" ? "✅ Ditandai selesai!" : "↩ Dikembalikan ke belum", "success");

  try {
    await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ action: "updateStatus", index: realIndex + 2, status: newStatus }),
      redirect: "follow",
    });
  } catch (err) { /* silent */ }
}

// ============================================================
//  FILTER
// ============================================================
function filterData() { renderTable(filterCurrentData()); }

function filterCurrentData() {
  const search = document.getElementById("searchInput").value.toLowerCase().trim();
  const hari   = document.getElementById("filterHari").value;
  const mapel  = document.getElementById("filterMapel").value;
  const status = document.getElementById("filterStatus").value;

  return allData.filter(row => {
    const matchSearch = !search ||
      (row.tugas && row.tugas.toLowerCase().includes(search)) ||
      (row.mapel && row.mapel.toLowerCase().includes(search)) ||
      (row.hari  && row.hari.toLowerCase().includes(search));
    return matchSearch &&
      (!hari   || row.hari   === hari) &&
      (!mapel  || row.mapel  === mapel) &&
      (!status || row.status === status);
  });
}

function resetFilter() {
  document.getElementById("searchInput").value  = "";
  document.getElementById("filterHari").value   = "";
  document.getElementById("filterMapel").value  = "";
  document.getElementById("filterStatus").value = "";
  renderTable(allData);
}

function resetForm() {
  document.getElementById("prForm").reset();
  document.getElementById("deadline").value = new Date().toISOString().split("T")[0];
}

// ============================================================
//  STATS & STATE
// ============================================================
function updateStats(data) {
  const total   = data.length;
  const selesai = data.filter(r => r.status === "Selesai").length;
  document.getElementById("totalPR").textContent   = total;
  document.getElementById("belumPR").textContent   = total - selesai;
  document.getElementById("selesaiPR").textContent = selesai;
}

function showState(state) {
  document.getElementById("loadingState").style.display = state === "loading" ? "block" : "none";
  document.getElementById("emptyState").style.display   = state === "empty"   ? "block" : "none";
  document.getElementById("tableWrap").style.display    = state === "table"   ? "block" : "none";
}

// ============================================================
//  HELPERS
// ============================================================
function formatDeadline(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function getSisaHari(dateStr, status) {
  if (!dateStr || status === "Selesai") return null;
  const today    = new Date(); today.setHours(0,0,0,0);
  const deadline = new Date(dateStr + "T00:00:00");
  const diff     = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
  if (diff < 0)   return `${Math.abs(diff)} hari lalu`;
  if (diff === 0) return "Hari ini!";
  if (diff === 1) return "Besok!";
  return `${diff} hari lagi`;
}

function getDeadlineClass(dateStr, status) {
  if (status === "Selesai") return "deadline-done";
  if (!dateStr) return "deadline-ok";
  const today    = new Date(); today.setHours(0,0,0,0);
  const deadline = new Date(dateStr + "T00:00:00");
  const diff     = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
  if (diff <= 2) return "deadline-urgent";
  if (diff <= 5) return "deadline-soon";
  return "deadline-ok";
}

function escHtml(str) {
  if (!str) return "";
  return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function showToast(message, type = "info") {
  const wrap  = document.getElementById("toastWrap");
  const icons = { success: "fa-circle-check", error: "fa-circle-xmark", info: "fa-circle-info" };
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i> ${message}`;
  wrap.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = "slideOut 0.3s ease forwards";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
