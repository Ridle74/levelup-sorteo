// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// FIREBASE CONFIG
// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
const firebaseConfig = {
  apiKey:            "AIzaSyB8M29ujqCEatEZMaNHbGEyDmfygipG_Y0",
  authDomain:        "maths-level-up.firebaseapp.com",
  projectId:         "maths-level-up",
  storageBucket:     "maths-level-up.firebasestorage.app",
  messagingSenderId: "854549565666",
  appId:             "1:854549565666:web:2613613306c6cb16b30ebb"
};
firebase.initializeApp(firebaseConfig);
const db  = firebase.firestore();
const REF = db.collection('sorteo').doc('main');

// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// DATA
// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
const DEFAULT_STUDENTS = [
  { id:1,  name:"Mikela Villena",    max:25, color:"#ec4899", icon:"ð§ð¼", pin:"24680" },
  { id:2,  name:"Lucio Prado",       max:24, color:"#3b82f6", icon:"ð",  pin:"47291" },
  { id:3,  name:"Joanna Prado",      max:17, color:"#a855f7", icon:"ð§ð»", pin:"83652" },
  { id:4,  name:"Manuel Villacorta", max:15, color:"#f97316", icon:"ð¦ð»", pin:"15937" },
  { id:5,  name:"Maria Villalobos",  max:14, color:"#eab308", icon:"ð§ð½", pin:"62840" },
  { id:6,  name:"Augusto Giuffra",   max:12, color:"#ef4444", icon:"ð·ï¸",  pin:"39514" },
  { id:7,  name:"Santiago Quinto",   max:11, color:"#22c55e", icon:"ðð»", pin:"70268" },
  { id:8,  name:"Tiago Poma",        max:10, color:"#06b6d4", icon:"ð¶",  pin:"58429" },
  { id:9,  name:"Mateo RÃ­os",        max:6,  color:"#f43f5e", icon:"ð§",  pin:"26173" },
  { id:10, name:"Rafaela Villena",   max:6,  color:"#14b8a6", icon:"ð¨",  pin:"91536" }
];
const ADMIN = { id:0, name:"Profesor (Admin)", max:0, color:"#1f2937", icon:"ð¨ð»âð«", pin:"80808", role:"admin" };

const COLOR_PALETTE = [
  "#EF4444","#991B1B","#F97316","#92400E","#EAB308","#78350F",
  "#84CC16","#14532D","#22C55E","#0D9488","#06B6D4","#164E63",
  "#3B82F6","#1E3A8A","#8B5CF6","#4C1D95","#EC4899","#9D174D",
  "#F43F5E","#475569"
];

// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// ESTADO COMPARTIDO (cada pÃ¡gina lo carga desde Firebase)
// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
let allocations = {};
let overrides   = {};
let appConfig   = { startTime:'', endTime:'', totalNumbers: 200 };

// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// SESSION (login persistente entre pÃ¡ginas)
// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
function getLoggedId() {
  const v = sessionStorage.getItem('loggedId');
  return v !== null ? parseInt(v) : null;
}
function setLoggedId(id) {
  if (id === null) sessionStorage.removeItem('loggedId');
  else sessionStorage.setItem('loggedId', String(id));
}

// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// HELPERS
// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
function getTotal() { return appConfig.totalNumbers || 200; }

function getStudents() {
  const baseMap = {};
  DEFAULT_STUDENTS.forEach(s => { baseMap[s.id] = s; });
  const allIds = new Set([
    ...DEFAULT_STUDENTS.map(s => String(s.id)),
    ...Object.keys(overrides)
  ]);
  const list = [];
  allIds.forEach(idStr => {
    const id = parseInt(idStr);
    if (isNaN(id) || id === 0) return;
    const base = baseMap[id] || { id, name:"Nuevo Alumno", icon:"ð¤", max:0, pin:"1234", color:"#888888" };
    const ov = overrides[idStr] || {};
    if (ov.deleted) return;
    list.push({
      id,
      name:  ov.name  !== undefined ? ov.name  : base.name,
      icon:  ov.icon  !== undefined ? ov.icon  : base.icon,
      max:   ov.max   !== undefined ? ov.max   : base.max,
      pin:   ov.pin   !== undefined ? ov.pin   : base.pin,
      color: ov.color !== undefined ? ov.color : base.color,
    });
  });
  return list.sort((a,b) => {
    const diff = (b.max||0) - (a.max||0);
    return diff !== 0 ? diff : a.id - b.id;
  });
}

function getFullList() { return [ADMIN, ...getStudents()]; }

function getPickCounts() {
  const c = {};
  getFullList().forEach(s => { c[s.id] = 0; });
  Object.values(allocations).forEach(id => { if (c[id] !== undefined) c[id]++; });
  return c;
}

function getPersonalStart(studentId) {
  if (!appConfig.startTime) return null;
  const students = getStudents();
  const idx = students.findIndex(s => s.id === studentId);
  if (idx === -1) return new Date(appConfig.startTime);
  let t = new Date(appConfig.startTime);
  if (t.getHours() < 9)  t.setHours(9,0,0,0);
  else if (t.getHours() > 21) { t.setDate(t.getDate()+1); t.setHours(9,0,0,0); }
  for (let i = 0; i < idx; i++) {
    t.setHours(t.getHours()+1);
    if (t.getHours() > 21) { t.setDate(t.getDate()+1); t.setHours(9,0,0,0); }
  }
  return t;
}

function getVotingStatus(loggedId) {
  if (!appConfig.startTime || !appConfig.endTime) return 'open';
  const now = new Date();
  if (now > new Date(appConfig.endTime)) return 'closed';
  const active = getFullList().find(s => s.id === loggedId);
  if (active?.role === 'admin') return 'open';
  const ps = getPersonalStart(loggedId);
  if (!ps) return 'open';
  if (now < ps) return 'waiting_turn';
  return 'open';
}

function formatFullDate(d) {
  if (!d) return 'No definida';
  const dt = d instanceof Date ? d : new Date(d);
  if (isNaN(dt)) return 'Fecha InvÃ¡lida';
  const dateStr = dt.toLocaleDateString('es-ES', { weekday:'long', day:'numeric', month:'long' });
  const timeStr = dt.toLocaleTimeString('es-ES', { hour:'2-digit', minute:'2-digit', hour12:true });
  return `${dateStr.charAt(0).toUpperCase()+dateStr.slice(1)} a las ${timeStr.toUpperCase()}`;
}

function getSorteoMonth() {
  const dt = appConfig.startTime ? new Date(appConfig.startTime) : new Date();
  if (dt.getDate() < 15) dt.setMonth(dt.getMonth() - 1);
  const month = dt.toLocaleDateString('es-ES', { month: 'long' });
  return month.charAt(0).toUpperCase() + month.slice(1);
}

// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// TOAST
// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
let toastTimeout;
function showToast(msg, type='error') {
  const el = document.getElementById('toast');
  if (!el) return;
  document.getElementById('toast-icon').textContent = type === 'success' ? 'â' : 'â ï¸';
  document.getElementById('toast-msg').textContent  = msg;
  el.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => el.classList.remove('show'), 3000);
}

// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// FIREBASE â GUARDAR
// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
function saveMeta() {
  REF.set({ overrides, config: appConfig }, { merge: true })
    .catch(err => { console.error('Firebase meta save error:', err); showToast('Error al guardar.'); });
}

let saveDebounce = null;
function saveStateDebounced() {
  clearTimeout(saveDebounce);
  saveDebounce = setTimeout(saveMeta, 600);
}

function saveAllocationChange(num, action, ownerId) {
  return db.runTransaction(async tx => {
    const snap = await tx.get(REF);
    const data = snap.exists ? snap.data() : {};
    const current   = Object.assign({}, data.allocations || {});
    const ovServer  = data.overrides || {};
    const cfgServer = data.config    || {};

    if (action === 'delete') {
      delete current[num];
    } else {
      if (ownerId !== 0) {
        const students = getStudents();
        const student  = students.find(s => s.id === ownerId);
        if (student) {
          const count = Object.values(current).filter(id => String(id) === String(ownerId)).length;
          if (count >= (student.max || 0)) throw new Error('CUPO_LLENO:' + student.max);
        }
      }
      current[num] = ownerId;
    }
    tx.set(REF, { allocations: current, overrides: ovServer, config: cfgServer });
  });
}

function setOverride(id, field, value) {
  const key = String(id);
  if (!overrides[key]) overrides[key] = {};
  overrides[key][field] = value;
  saveStateDebounced();
}

function descargarImagen(canvas, nombre = 'tabla-posiciones.png') {
  const a = document.createElement('a');
  a.download = nombre;
  a.href = canvas.toDataURL('image/png');
  a.click();
  showToast('Â¡Imagen descargada!', 'success');
}
