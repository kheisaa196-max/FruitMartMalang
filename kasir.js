// ============================================================
//  FreshMart — Kasir Buah Digital
//  kasir.js — Logic utama + integrasi Google Sheets
// ============================================================

// --- KONFIGURASI ---
// Ganti URL ini dengan Web App URL dari Google Apps Script kamu
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw4Cn776BordRbVd71gFzv7WCa54yd4FFUJ_hrKn_JdLNYABgIRVgi3YH6QgBDFjLZE/exec';

// Harga per Kg (Rupiah)
const HARGA = {
  Salak:      15000,
  Jeruk:      18000,
  Alpukat:    25000,
  'Buah Naga': 30000,
  Apel:       22000,
  Anggur:     45000,
  Stroberi:   55000,
  Nangka:     12000,
};

// Emoji buah
const EMOJI = {
  Salak:      '🌴',
  Jeruk:      '🍊',
  Alpukat:    '🥑',
  'Buah Naga': '🐉',
  Apel:       '🍎',
  Anggur:     '🍇',
  Stroberi:   '🍓',
  Nangka:     '🍈',
};

// --- STATE ---
let orders = JSON.parse(localStorage.getItem('freshmart_orders') || '[]');

// --- ELEMEN DOM ---
const nameEl      = document.getElementById('name');
const phoneEl     = document.getElementById('phone');
const addressEl   = document.getElementById('address');
const fruitEl     = document.getElementById('fruit');
const kgEl        = document.getElementById('kg');
const submitBtn   = document.getElementById('submitBtn');
const submitIcon  = document.getElementById('submitIcon');
const submitText  = document.getElementById('submitText');
const resetBtn    = document.getElementById('resetBtn');
const clearBtn    = document.getElementById('clearBtn');
const orderBody   = document.getElementById('orderBody');
const orderForm   = document.getElementById('orderForm');

// Price display
const priceDisplay = document.getElementById('priceDisplay');
const kgDisplay    = document.getElementById('kgDisplay');
const totalDisplay = document.getElementById('totalDisplay');

// Stats
const statTotal   = document.getElementById('statTotal');
const statRevenue = document.getElementById('statRevenue');
const statTop     = document.getElementById('statTop');
const statKg      = document.getElementById('statKg');

// Toast
const toastEl  = document.getElementById('toast');
const toastMsg = document.getElementById('toastMsg');
let toastTimer = null;

// ============================================================
//  TOAST
// ============================================================
function showToast(msg, type = 'success', duration = 3000) {
  if (toastTimer) clearTimeout(toastTimer);
  toastEl.className = `toast ${type}`;
  toastMsg.innerHTML = msg;
  // force reflow
  void toastEl.offsetWidth;
  toastEl.classList.add('show');
  if (duration > 0) {
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), duration);
  }
}

function hideToast() {
  toastEl.classList.remove('show');
}

// ============================================================
//  FORMAT RUPIAH
// ============================================================
function formatRp(num) {
  return 'Rp ' + Number(num).toLocaleString('id-ID');
}

// ============================================================
//  UPDATE PRICE PREVIEW
// ============================================================
function updatePricePreview() {
  const fruit = fruitEl.value;
  const kg    = parseFloat(kgEl.value) || 0;
  const harga = HARGA[fruit] || 0;
  const total = harga * kg;

  priceDisplay.textContent = fruit ? formatRp(harga) : 'Rp —';
  kgDisplay.textContent    = kg > 0 ? `${kg} Kg` : '— Kg';
  totalDisplay.textContent = formatRp(total);
}

fruitEl.addEventListener('change', updatePricePreview);
kgEl.addEventListener('input', updatePricePreview);

// ============================================================
//  VALIDASI
// ============================================================
function showErr(id, show) {
  const el = document.getElementById('err-' + id);
  if (el) el.classList.toggle('hidden', !show);
}

function validate() {
  const name    = nameEl.value.trim();
  const phone   = phoneEl.value.trim();
  const address = addressEl.value.trim();
  const fruit   = fruitEl.value;
  const kg      = parseFloat(kgEl.value);

  let valid = true;

  if (!name)                          { showErr('name', true);  valid = false; } else showErr('name', false);
  if (!phone || !/^\d{10,}$/.test(phone.replace(/\s|-/g, '')))
                                      { showErr('phone', true); valid = false; } else showErr('phone', false);
  if (!address)                       { showErr('address', true); valid = false; } else showErr('address', false);
  if (!fruit)                         { showErr('fruit', true); valid = false; } else showErr('fruit', false);
  if (!kg || kg <= 0)                 { showErr('kg', true);    valid = false; } else showErr('kg', false);

  return valid;
}

// ============================================================
//  RENDER TABEL
// ============================================================
function renderTable() {
  if (orders.length === 0) {
    orderBody.innerHTML = `
      <tr><td colspan="9">
        <div class="empty-state">
          <div class="text-5xl mb-3">🛒</div>
          <p class="font-semibold">Belum ada pesanan</p>
          <p class="text-sm mt-1">Isi form di atas untuk menambah pesanan</p>
        </div>
      </td></tr>`;
    return;
  }

  orderBody.innerHTML = orders.map((o, i) => `
    <tr>
      <td class="px-4 py-3 text-sm font-bold text-gray-400">${i + 1}</td>
      <td class="px-4 py-3 text-sm font-semibold" style="color:#021A54">${escHtml(o.name)}</td>
      <td class="px-4 py-3 text-sm text-gray-600">${escHtml(o.phone)}</td>
      <td class="px-4 py-3 text-sm text-gray-600 max-w-[160px] truncate" title="${escHtml(o.address)}">${escHtml(o.address)}</td>
      <td class="px-4 py-3 text-sm font-semibold">${EMOJI[o.fruit] || ''} ${escHtml(o.fruit)}</td>
      <td class="px-4 py-3 text-sm text-right font-semibold">${o.kg}</td>
      <td class="px-4 py-3 text-sm text-right text-gray-600">${formatRp(o.pricePerKg)}</td>
      <td class="px-4 py-3 text-sm text-right font-bold" style="color:#021A54">${formatRp(o.total)}</td>
      <td class="px-4 py-3 text-xs text-center text-gray-400">${o.time}</td>
    </tr>`).join('');
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ============================================================
//  UPDATE STATS
// ============================================================
function updateStats() {
  const totalOrders  = orders.length;
  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const totalKg      = orders.reduce((s, o) => s + parseFloat(o.kg), 0);

  // Buah terlaris
  const fruitCount = {};
  orders.forEach(o => { fruitCount[o.fruit] = (fruitCount[o.fruit] || 0) + 1; });
  const topFruit = Object.entries(fruitCount).sort((a, b) => b[1] - a[1])[0];

  statTotal.textContent   = totalOrders;
  statRevenue.textContent = formatRp(totalRevenue);
  statKg.textContent      = parseFloat(totalKg.toFixed(1));
  statTop.textContent     = topFruit ? `${EMOJI[topFruit[0]] || ''} ${topFruit[0]}` : '—';
}

// ============================================================
//  SIMPAN KE LOCALSTORAGE
// ============================================================
function saveLocal() {
  localStorage.setItem('freshmart_orders', JSON.stringify(orders));
}

// ============================================================
//  KIRIM KE GOOGLE SHEETS
// ============================================================
async function sendToSheets(order) {
  // Jika URL belum dikonfigurasi, skip (tidak error)
  if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.includes('GANTI')) return;

  const params = new URLSearchParams({
    name:       order.name,
    phone:      order.phone,
    address:    order.address,
    fruit:      order.fruit,
    kg:         order.kg,
    pricePerKg: order.pricePerKg,
    total:      order.total,
    time:       order.time,
  });

  // Gunakan fetch dengan no-cors karena Apps Script redirect
  await fetch(`${APPS_SCRIPT_URL}?${params.toString()}`, { method: 'GET', mode: 'no-cors' });
}

// ============================================================
//  SUBMIT FORM
// ============================================================
orderForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!validate()) return;

  const fruit      = fruitEl.value;
  const kg         = parseFloat(kgEl.value);
  const pricePerKg = HARGA[fruit];
  const total      = pricePerKg * kg;
  const now        = new Date();
  const time       = now.toLocaleString('id-ID', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const order = {
    name:       nameEl.value.trim(),
    phone:      phoneEl.value.trim(),
    address:    addressEl.value.trim(),
    fruit,
    kg,
    pricePerKg,
    total,
    time,
  };

  // Loading state
  submitBtn.disabled   = true;
  submitIcon.innerHTML = '<span class="spinner"></span>';
  submitText.textContent = 'Menyimpan...';
  showToast('<span class="spinner"></span> Menyimpan pesanan...', 'loading', 0);

  try {
    await sendToSheets(order);
    orders.push(order);
    saveLocal();
    renderTable();
    updateStats();
    orderForm.reset();
    updatePricePreview();
    showToast('✅ Pesanan berhasil ditambahkan!', 'success');
  } catch (err) {
    console.error(err);
    showToast('❌ Gagal menyimpan ke Sheets. Data tersimpan lokal.', 'error');
    orders.push(order);
    saveLocal();
    renderTable();
    updateStats();
    orderForm.reset();
    updatePricePreview();
  } finally {
    submitBtn.disabled     = false;
    submitIcon.textContent = '🛒';
    submitText.textContent = 'Tambah Pesanan';
  }
});

// ============================================================
//  RESET FORM
// ============================================================
resetBtn.addEventListener('click', () => {
  orderForm.reset();
  updatePricePreview();
  ['name','phone','address','fruit','kg'].forEach(id => showErr(id, false));
});

// ============================================================
//  HAPUS SEMUA
// ============================================================
clearBtn.addEventListener('click', () => {
  if (orders.length === 0) return;
  if (!confirm('Yakin ingin menghapus semua pesanan dari tampilan lokal?')) return;
  orders = [];
  saveLocal();
  renderTable();
  updateStats();
  showToast('🗑️ Semua pesanan dihapus.', 'success');
});

// ============================================================
//  INIT
// ============================================================
renderTable();
updateStats();
updatePricePreview();
