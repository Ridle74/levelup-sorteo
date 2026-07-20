// calendar-utils.js — lógica de calendario compartida entre padres.html y horarios.html
// Cualquier fix aquí se refleja automáticamente en ambas vistas.
//
// Dependencias: DATA (global con .cycles, .sessions, .freeSlots, .students)

/* ── Helpers de tiempo ──────────────────────────────── */
function calToH(t) {
  var p = (t||'00:00').split(':').map(Number);
  return p[0] + p[1] / 60;
}
function calToMin(t) {
  var p = (t||'00:00').split(':').map(Number);
  return p[0] * 60 + p[1];
}
function calAddM(t, m) {
  var p = (t||'00:00').split(':').map(Number);
  var tot = p[0] * 60 + p[1] + m;
  return String(Math.floor(tot / 60) % 24).padStart(2,'0') + ':' + String(tot % 60).padStart(2,'0');
}
function calDStr(d) {
  return d.toISOString().slice(0, 10);
}

/* ── Ciclos ─────────────────────────────────────────── */
function getCycleHorizon(list) {
  list = list || DATA.cycles || [];
  var max = null;
  list.forEach(function(c) {
    if (!c.end) return;
    var e = new Date(c.end + 'T00:00:00');
    if (!max || e > max) max = e;
  });
  return max;
}

function cycleCutoffDate(cycleId) {
  if (cycleId != null) {
    var c = (DATA.cycles||[]).find(function(cc) { return String(cc.id) === String(cycleId); });
    if (c) return c.end ? new Date(c.end + 'T00:00:00') : null;
  }
  return getCycleHorizon();
}

function cycleStartDate(cycleId) {
  if (cycleId != null) {
    var c = (DATA.cycles||[]).find(function(cc) { return String(cc.id) === String(cycleId); });
    if (c) return c.start ? new Date(c.start + 'T00:00:00') : null;
  }
  return null;
}

/* ── Filtro de alumno activo ────────────────────────── */
// st: { skipDates, nWeeks, weekStart, cycleId }
// d: objeto Date de la fecha a verificar
// dstr: string 'YYYY-MM-DD' de esa fecha
// Devuelve true si el alumno tiene clase activa en esa fecha.
function calIsStudentActive(st, d, dstr) {
  if ((st.skipDates||[]).indexOf(dstr) !== -1) return false;
  if (st.nWeeks && st.weekStart) {
    var ws = new Date(st.weekStart + 'T00:00:00');
    var we = new Date(ws.getTime() + st.nWeeks * 7 * 24 * 60 * 60 * 1000);
    if (d < ws || d >= we) return false;
  } else {
    var cutoff = cycleCutoffDate(st.cycleId);
    if (cutoff && d > cutoff) return false;
    var cStart = cycleStartDate(st.cycleId);
    if (cStart && d < cStart) return false;
  }
  return true;
}

/* ── Intervalos de sesiones activas ────────────────── */
// slots: array de entradas del slotMap para esta columna
// Devuelve array de [startMin, endMin] de sesiones con al menos un alumno activo.
function calActiveSessIntervals(slots, d, dstr) {
  var intervals = [];
  slots.forEach(function(slot) {
    var hasActive;
    if (slot.oneTimeDate) {
      hasActive = (slot.students||slot.studentIds||[]).length > 0;
    } else {
      hasActive = (slot.students||[]).some(function(st) {
        return calIsStudentActive(st, d, dstr);
      });
    }
    if (hasActive) {
      var sm = calToMin(slot.start);
      intervals.push([sm, sm + (slot.maxDur || slot.dur || 60)]);
    }
  });
  return intervals;
}

/* ── Visibilidad de slot libre ──────────────────────── */
// Devuelve true si el free slot debe mostrarse en la columna con dow y fecha dstr/d.
// intervals: resultado de calActiveSessIntervals para esta columna.
function calShouldShowFreeSlot(fs, d, dstr, dow, intervals) {
  if (fs.recurring === false && fs.date) {
    if (fs.date !== dstr) return false;
  } else {
    if (Array.isArray(fs.skipDates) && fs.skipDates.indexOf(dstr) !== -1) return false;
    var cutoff = cycleCutoffDate(fs.cycleId);
    if (cutoff && d > cutoff) return false;
    var fsStart = cycleStartDate(fs.cycleId);
    if (fsStart && d < fsStart) return false;
    if (Number(fs.day) !== dow) return false;
  }
  // Suprimir si solapa con sesión activa
  var fa = calToMin(fs.start), fb = fa + (fs.dur || 60);
  for (var i = 0; i < intervals.length; i++) {
    if (fa < intervals[i][1] && fb > intervals[i][0]) return false;
  }
  return true;
}
