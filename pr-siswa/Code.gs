// ============================================================
//  PR TRACKER — Google Apps Script (Code.gs)
// ============================================================

const SPREADSHEET_ID = "12CaFgxkyjDiz7rywku9m0ERcXTqQivHyRZcEUnBXyeg";
const SHEET_NAME     = "PR"; // Nama tab di spreadsheet

// ============================================================
//  doGet — Ambil semua data (support JSONP untuk file://)
// ============================================================
function doGet(e) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);

    if (!sheet) {
      return respond(e, { success: false, error: 'Sheet "PR" tidak ditemukan' });
    }

    const rows = sheet.getDataRange().getValues();
    const data = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row[0] && !row[1] && !row[2]) continue;

      let deadline = "";
      if (row[3]) {
        try {
          deadline = Utilities.formatDate(new Date(row[3]), "Asia/Jakarta", "yyyy-MM-dd");
        } catch (err) {
          deadline = String(row[3]);
        }
      }

      data.push({
        hari:     String(row[0] || ""),
        mapel:    String(row[1] || ""),
        tugas:    String(row[2] || ""),
        deadline: deadline,
        status:   String(row[4] || "Belum"),
      });
    }

    return respond(e, { success: true, data: data });

  } catch (err) {
    return respond(e, { success: false, error: err.message });
  }
}

// ============================================================
//  doPost — Tambah PR baru atau Update status
// ============================================================
function doPost(e) {
  try {
    const body  = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);

    if (!sheet) {
      return respond(e, { success: false, error: 'Sheet "PR" tidak ditemukan' });
    }

    if (body.action === "updateStatus") {
      sheet.getRange(body.index, 5).setValue(body.status);
      return respond(e, { success: true, message: "Status berhasil diperbarui" });
    }

    sheet.appendRow([
      body.hari     || "",
      body.mapel    || "",
      body.tugas    || "",
      body.deadline || "",
      body.status   || "Belum",
    ]);

    return respond(e, { success: true, message: "PR berhasil disimpan!" });

  } catch (err) {
    return respond(e, { success: false, error: err.message });
  }
}

// ============================================================
//  Helper — respond biasa atau JSONP (jika ada ?callback=...)
//  JSONP dibutuhkan agar bisa diakses dari file:// di browser
// ============================================================
function respond(e, obj) {
  const json     = JSON.stringify(obj);
  const callback = e && e.parameter && e.parameter.callback;

  if (callback) {
    // JSONP response: callback({ ... })
    return ContentService
      .createTextOutput(callback + "(" + json + ")")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  // Response JSON biasa
  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}
