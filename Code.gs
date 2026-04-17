// ============================================================
//  FreshMart — Google Apps Script
//  Tempel kode ini di: script.google.com
//  Lalu Deploy sebagai Web App
// ============================================================

// ID Spreadsheet kamu — ambil dari URL:
// https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
const SPREADSHEET_ID = 'GANTI_DENGAN_SPREADSHEET_ID_KAMU';
const SHEET_NAME     = 'Pesanan'; // nama sheet/tab

function doGet(e) {
  try {
    const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet   = ss.getSheetByName(SHEET_NAME);

    // Buat sheet jika belum ada
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      // Buat header
      sheet.appendRow([
        'No', 'Nama', 'No. HP', 'Alamat',
        'Jenis Buah', 'Berat (Kg)', 'Harga/Kg', 'Total Harga', 'Waktu Pesan'
      ]);
      // Style header (opsional)
      const headerRange = sheet.getRange(1, 1, 1, 9);
      headerRange.setBackground('#021A54');
      headerRange.setFontColor('#ffffff');
      headerRange.setFontWeight('bold');
    }

    // Ambil parameter dari URL
    const p = e.parameter;

    const lastRow = sheet.getLastRow();
    const no      = lastRow; // baris 1 = header, jadi no = lastRow

    // Tambah baris baru
    sheet.appendRow([
      no,
      p.name       || '',
      p.phone      || '',
      p.address    || '',
      p.fruit      || '',
      parseFloat(p.kg)         || 0,
      parseInt(p.pricePerKg)   || 0,
      parseInt(p.total)        || 0,
      p.time       || new Date().toLocaleString('id-ID'),
    ]);

    // Auto resize kolom
    sheet.autoResizeColumns(1, 9);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok', no: no }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
