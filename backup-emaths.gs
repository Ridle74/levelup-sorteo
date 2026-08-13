// ============================================================
//  BACKUP AUTOMÁTICO — EasyMaths / Sorteo Tablero
//  Google Apps Script
// ============================================================
//
//  INSTRUCCIONES (una sola vez):
//  1. Crea un Google Sheet nuevo en drive.google.com
//  2. En el Sheet, ve a Extensiones > Apps Script
//  3. Borra el código que aparece y pega TODO este archivo
//  4. Guarda (Ctrl+S), ponle cualquier nombre al proyecto
//  5. Click en "Implementar" > "Nueva implementación"
//     - Tipo: Aplicación web
//     - Ejecutar como: Yo
//     - Quién puede acceder: Cualquier usuario
//  6. Click "Implementar", autoriza los permisos
//  7. Copia la URL que aparece ("URL de la aplicación web")
//  8. Pégala en tablero/index.html donde dice:
//       const BACKUP_URL = '';
//     Quedará así:
//       const BACKUP_URL = 'https://script.google.com/macros/s/TU_ID/exec';
//
//  Listo. Cada vez que abras el tablero como admin, se guarda
//  un backup automático en la pestaña "Backups" del Sheet.
// ============================================================

const SHEET_NAME  = 'Backups';
const MAX_BACKUPS = 60; // guarda los últimos 60 backups (~2 meses si es diario)

function doPost(e) {
  try {
    const data   = JSON.parse(e.postData.contents);
    const sheet  = getOrCreateSheet();
    const now    = new Date();
    const fecha  = Utilities.formatDate(now, 'America/Lima', 'dd/MM/yyyy HH:mm:ss');
    const alumnos = Object.keys(data.allocations || {}).length;

    // Insertar nueva fila debajo del header (la más reciente arriba)
    sheet.insertRowAfter(1);
    sheet.getRange(2, 1, 1, 5).setValues([[
      fecha,
      alumnos,
      JSON.stringify(data.allocations || {}),
      JSON.stringify(data.overrides   || {}),
      JSON.stringify(data.config      || {})
    ]]);

    // Limpiar backups viejos para no crecer infinito
    const total = sheet.getLastRow();
    if (total > MAX_BACKUPS + 1) {
      sheet.deleteRows(MAX_BACKUPS + 2, total - MAX_BACKUPS - 1);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, fecha }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrCreateSheet() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  let sheet   = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);

    // Header
    const header = sheet.getRange(1, 1, 1, 5);
    header.setValues([['Fecha / Hora', 'Alumnos', 'Allocations (JSON)', 'Overrides (JSON)', 'Config (JSON)']]);
    header.setBackground('#105c4d');
    header.setFontColor('#ffffff');
    header.setFontWeight('bold');
    sheet.setFrozenRows(1);

    // Anchos de columna
    sheet.setColumnWidth(1, 160);
    sheet.setColumnWidth(2, 70);
    sheet.setColumnWidth(3, 500);
    sheet.setColumnWidth(4, 300);
    sheet.setColumnWidth(5, 200);
  }

  return sheet;
}

// ── CÓMO RESTAURAR UN BACKUP ──────────────────────────────────
//
//  Opción A (recomendada — desde el tablero):
//  1. Abre el Sheet, copia el contenido de la celda "Allocations (JSON)"
//     de la fila que quieres restaurar
//  2. En el tablero, click en "↩️ RESTAURAR"
//  3. Pega el JSON y confirma
//
//  Opción B (restaurar TODO — allocations + overrides + config):
//  1. En el Sheet, copia la fila completa que quieres (las 3 columnas JSON)
//  2. Construye manualmente: {"allocations": ..., "overrides": ..., "config": ...}
//  3. Pégalo en "↩️ RESTAURAR"
// ─────────────────────────────────────────────────────────────
