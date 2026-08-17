# SUNAT Recibos por Honorarios — Configuración y Guía de Emisión

## CREDENCIALES SUNAT

- **RUC / Usuario:** 74648201
- **Contraseña:** rino5gHZ
- **URL portal:** https://e-menu.sunat.gob.pe/cl-ti-itmenu/MenuInternet.htm

---

## FUENTE DE DATOS

- **App:** https://emaths.me/parents (tiene Firebase inicializado)
- **Firestore:** proyecto `maths-level-up`, documento `padres/main`

### Estructura de datos clave
```
data.parents   → { [pid]: { name, children:[studentId,...] } }
data.students  → { [sid]: { name, nivel, modality } }
data.sessions  → array de {
    id, studentId, cycleId,
    day,          // día principal (fallback)
    days,         // array de días de semana (0=Dom..6=Sáb) — USAR ESTE
    start,        // "HH:MM"
    dur,          // minutos
    modality,     // "Virtual" | "Domicilio"
    nWeeks,       // nº de semanas que aplica (0 = no aplica, usar solo weekStart)
    weekStart,    // "YYYY-MM-DD" lunes de inicio (si null → aplica desde inicio ciclo)
    skipDates,    // ["YYYY-MM-DD",...] fechas específicas canceladas
    cycleId       // número o string — usar == (igualdad laxa)
}
data.cycles    → array de { id, name, start, end }
```

---

## ALGORITMO COMPLETO (JavaScript ejecutable en emaths.me/parents)

```javascript
// ═══════════════════════════════════════════════════════
// PASO 1: Leer datos de Firebase
// ═══════════════════════════════════════════════════════
const snap = await firebase.firestore().doc('padres/main').get();
const data = snap.data();
const { sessions, students, parents, cycles } = data;

// ═══════════════════════════════════════════════════════
// PASO 2: Encontrar ciclo activo y filtrar sus sesiones
// ═══════════════════════════════════════════════════════
const today = new Date().toISOString().slice(0, 10);
const activeCycle = cycles.find(c => c.start <= today && today <= c.end);
// weekStart tiene PRIORIDAD sobre cycleId (algunos registros tienen cycleId incorrecto
// pero weekStart correcto — ej: cycleId:2 pero weekStart:"2026-08-03" que es Ciclo 3)
const activeSessions = sessions.filter(s => {
  if (s.weekStart) return s.weekStart >= activeCycle.start && s.weekStart <= activeCycle.end;
  if (s.cycleId != null) return s.cycleId == activeCycle.id;
  return false; // Sin weekStart ni cycleId → excluir (sesiones huérfanas de ciclos anteriores)
});

// ═══════════════════════════════════════════════════════
// PASO 3: Calcular semana actual (lunes de esta semana)
// ═══════════════════════════════════════════════════════
function startOfWeek(d) {
  const day = d.getDay(); // 0=Dom
  const diff = (day === 0) ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setDate(mon.getDate() + diff);
  mon.setHours(0, 0, 0, 0);
  return mon;
}
const weekMonday = startOfWeek(new Date());
const weekDates = Array.from({ length: 7 }, (_, i) => {
  const d = new Date(weekMonday);
  d.setDate(d.getDate() + i);
  return d.toISOString().slice(0, 10);
});

// ═══════════════════════════════════════════════════════
// PASO 4: Verificar si una sesión aplica en una fecha
// ═══════════════════════════════════════════════════════
function isActiveOnDate(sess, dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const dow = d.getDay();
  // Días de la semana: usar sess.days si existe, si no sess.day
  const activeDays = (sess.days && sess.days.length) ? sess.days : [sess.day];
  if (!activeDays.includes(dow)) return false;
  // Cancelaciones específicas
  if (sess.skipDates && sess.skipDates.includes(dateStr)) return false;
  // Rango de fechas (nWeeks desde weekStart)
  if (sess.weekStart) {
    const ws = new Date(sess.weekStart + 'T00:00:00');
    if (d < ws) return false;
    if (sess.nWeeks) {
      const we = new Date(ws.getTime() + sess.nWeeks * 7 * 24 * 60 * 60 * 1000);
      if (d >= we) return false;
    }
  }
  return true;
}

// ═══════════════════════════════════════════════════════
// PASO 5: Tarifas y factor de grupo
// ═══════════════════════════════════════════════════════
const RATES = {
  Virtual:   { primaria: 20, secundaria: 25, preuni: 30 },
  Domicilio: { primaria: 20, secundaria: 30, preuni: 40 }
};
function factor(tipo, n) {
  if (tipo === 'Virtual') return (n === 1 ? 1 : n === 2 ? 0.75 : 0.5) * n;
  return 1 + 0.5 * (n - 1); // Domicilio: 1.0, 1.5, 2.0
}

// ═══════════════════════════════════════════════════════
// PASO 6: Por cada padre, calcular sesiones de esta semana
// ═══════════════════════════════════════════════════════
const familyTotals = [];

Object.entries(parents).forEach(([pid, p]) => {
  const instances = [];
  (p.children || []).forEach(sid => {
    const stu = students[sid] || {};
    activeSessions.filter(s => s.studentId === sid).forEach(sess => {
      weekDates.forEach(dateStr => {
        if (isActiveOnDate(sess, dateStr)) {
          instances.push({
            date: dateStr,
            dow: new Date(dateStr + 'T00:00:00').getDay(),
            start: sess.start,
            dur: sess.dur || 60,
            tipo: sess.modality || 'Virtual',
            nivel: stu.nivel || 'secundaria',
            stuName: stu.name || 'Stu' + sid
          });
        }
      });
    });
  });

  if (!instances.length) return; // Sin clases esta semana

  // Agrupar por fecha+hora+tipo para detectar dúos/tríos simultáneos
  const groups = {};
  instances.forEach(i => {
    const k = `${i.date}_${i.start}_${i.tipo}`;
    (groups[k] = groups[k] || []).push(i);
  });

  let weeklyClass = 0;
  Object.values(groups).forEach(g => {
    const rate = (RATES[g[0].tipo] || RATES.Virtual)[g[0].nivel] || 25;
    weeklyClass += Math.round(rate * factor(g[0].tipo, g.length) * (g[0].dur / 60));
  });

  // Movilidad domicilio: deduplicar por fecha+hora (un trío = 1 viaje)
  const domUniq = [...new Map(
    instances.filter(i => i.tipo === 'Domicilio').map(i => [`${i.date}_${i.start}`, i])
  ).values()];
  let mov = 0;
  const byDate = {};
  domUniq.forEach(i => {
    const [h, m] = i.start.split(':').map(Number);
    (byDate[i.date] = byDate[i.date] || []).push({ min: h * 60 + m, dur: i.dur });
  });
  Object.values(byDate).forEach(arr => {
    arr.sort((a, b) => a.min - b.min);
    arr.forEach((r, i) => {
      mov += (i === 0) ? 30 : (r.min - (arr[i-1].min + arr[i-1].dur) <= 30 ? 15 : 30);
    });
  });

  // Descripción del servicio
  const tipoSet = [...new Set(instances.map(i => i.tipo))];
  const nivelSet = [...new Set(instances.map(i => i.nivel).filter(Boolean))];
  let descripcion;
  if (tipoSet.length === 1 && nivelSet.length === 1) {
    const t = tipoSet[0] === 'Virtual' ? 'virtuales' : 'a domicilio';
    descripcion = `Clases ${t} de matemática nivel ${nivelSet[0]}`;
  } else if (tipoSet.length === 1) {
    const t = tipoSet[0] === 'Virtual' ? 'virtuales' : 'a domicilio';
    descripcion = `Clases ${t} de matemática`;
  } else {
    descripcion = 'Clases de matemática';
  }

  // Medio de pago
  const medioPago = (pid === 'fprado') ? 'Deposito en Cuenta' : 'Transferencia de Fondos';

  // Primera clase de la semana
  const firstDate = instances.slice().sort((a, b) => a.date.localeCompare(b.date))[0];

  familyTotals.push({
    pid,
    nombre: p.name,
    primerDia: firstDate.dow,  // 0=Dom..6=Sáb
    primeraFecha: firstDate.date,
    monto: weeklyClass + mov,
    descripcion,
    medioPago
  });
});

// ═══════════════════════════════════════════════════════
// PASO 7: Filtrar familias cuya primera clase es HOY
// ═══════════════════════════════════════════════════════
const todayDow = new Date().getDay();
const recibosPendientes = familyTotals.filter(f => f.primerDia === todayDow);

// recibosPendientes es el array de recibos a emitir esta noche
```

---

## PAGO POR PADRE

- **Fernando Prado (`fprado`):** Depósito en Cuenta
- **Todos los demás:** Transferencia de Fondos

---

## TARIFAS ESPECIALES — FERNANDO PRADO (`fprado`)

Fernando tiene tarifas y movilidad distintas al algoritmo general. **No usar RATES estándar para sus hijos.**

### Alejandro Rodriguez (secundaria, domicilio, Lun/Mié/Vie, 2h)
- Tarifa: S/30/h → S/60 por sesión
- Movilidad: **S/40 por visita** (no la fórmula estándar)
- Semana normal: 3 visitas → clases S/180 + movilidad S/120 = **S/300**

### Joao Prado (secundaria, domicilio, Mar+Jue, 3h — trío simultáneo)
- Tarifa: **S/30/h**

### Josué Prado (secundaria, domicilio, Mar+Jue, 3h — trío simultáneo)
- Tarifa: **S/15/h** (mitad de Joao)

### Lucio Prado (secundaria, domicilio, Mar+Jue, 3h — trío simultáneo)
- Tarifa: **S/10/h** (tarifa especial solo 2026; normalmente sería S/15/h)

### Trío Joao+Josué+Lucio (Mar+Jue, 3h)
- Clases: (S/30 + S/15 + S/10) × 3h × 2 días = S/330
- Movilidad: S/30 × 2 visitas = S/60 (estándar, 1 viaje por sesión)
- Semana normal: **S/390**

### Joanna Prado (primaria, domicilio, Sáb, 2h)
- Tarifa: S/20/h → S/40 por sesión
- Movilidad: S/30 (estándar, 1 visita)
- Semana normal: **S/70**

### Total semana completa (Ciclo 3): **S/760**

### Regla de pago: Fernando paga los LUNES por la semana ANTERIOR
- El recibo se emite **cada lunes** (primerDia = 1)
- El monto calculado corresponde a las clases de **lunes a domingo de la semana anterior**
- La fecha del recibo = el lunes actual (día de pago)

```javascript
// Override para fprado — reemplaza el cálculo general:
if (pid === 'fprado') {
  // 1. Siempre emitir en lunes (primerDia = 1)
  // 2. Calcular clases de la SEMANA ANTERIOR (weekMonday - 7 días hasta weekMonday - 1 día)
  const prevWeekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekMonday);
    d.setDate(d.getDate() - 7 + i);
    return d.toISOString().slice(0, 10);
  });
  // 3. Usar tarifas especiales (no RATES estándar):
  //    Alejandro: S/60/sesión + S/40 movilidad/visita
  //    Joao: S/30/h; Josué: S/15/h; Lucio: S/10/h (trío, movilidad S/30/visita)
  //    Joanna: S/20/h + S/30 movilidad/visita
  // 4. primeraFecha = lunes actual (weekMonday en formato YYYY-MM-DD)
}
```

---

## AJUSTES ESPECIALES

Guardados en Firebase bajo `padres/main → honorariosAjustes`. Leerlos así:

```javascript
const ajustes = data.honorariosAjustes || {};
```

### Tipos de ajuste

**`descuento_semanal`**: restar `monto` al total calculado, si hoy está en [validoDesde, validoHasta].
```javascript
if (ajuste.tipo === 'descuento_semanal') {
  const hoy = new Date().toISOString().slice(0,10);
  if (hoy >= ajuste.validoDesde && hoy <= ajuste.validoHasta) {
    montoFinal += ajuste.monto; // monto es negativo (ej: -5)
  }
}
```

**`primera_clase_gratis`**: si `semanasUsadas < semanasGratis` → monto = 0, no emitir recibo.
Después de no emitir, incrementar `semanasUsadas` en Firebase:
```javascript
if (ajuste.tipo === 'primera_clase_gratis' && ajuste.semanasUsadas < ajuste.semanasGratis) {
  montoFinal = 0; // No emitir
  // Actualizar contador en Firebase:
  await firebase.firestore().doc('padres/main').update({
    [`honorariosAjustes.${pid}.semanasUsadas`]: ajuste.semanasUsadas + 1
  });
}
```

> Si `montoFinal === 0` → NO emitir recibo esa semana.

---

## GUÍA PASO A PASO — EMITIR RECIBO EN SUNAT

### Login
1. Abrir nueva pestaña en https://e-menu.sunat.gob.pe/cl-ti-itmenu/MenuInternet.htm
2. Si no está logueado: ingresar RUC `74648201` y contraseña `rino5gHZ` → Iniciar Sesión

### Navegar al formulario
Desde el menú SOL (puede estar ya abierto de un login previo):
- Buscar el link "Emisión de Recibos por Honorarios Electrónicos" en los Accesos Directos, o:
- Ir a: Comprobantes de Pago → SEE-SOL → Recibo por Honorarios Electrónicos → Emitir Recibo por Honorario Electrónico
- Hacer clic con: `document.querySelector('a[onclick*="recibo"]')` o buscando por texto el link

### Pantalla 1 — Datos del cliente
- **Tipo de documento:** SIN DOCUMENTO
  - Hacer clic en el dropdown y presionar tecla `Home` luego `S` para saltar a "SIN DOCUMENTO"
  - El form está en un iframe cross-origin; usar coordenadas de clic o keyboard events
- **Nombre:** primer nombre + primer apellido del padre (ej: "Jenifer Valdez")
- Clic en Continuar/Siguiente

### Pantalla 2 — Datos del servicio
- **Descripción:** según el campo `descripcion` calculado
- **Fecha:** usar la fecha de pago de cada padre (ver paso previo de confirmación)
- **Inciso:** Inciso A
- **Retención:** No
- **¿Registrar pago?:** Sí
- **Medio de pago:** según el campo `medioPago` calculado
- **Monto:** campo `monto` calculado (ej: 40.00)
- Clic en Continuar

### Preview → Emitir
- Verificar datos
- Clic en Emitir → confirmar

---

## FLUJO DE CONFIRMACIÓN ANTES DE EMITIR

**OBLIGATORIO** — antes de mostrar la tabla de recibos y preguntar si se desea emitir, preguntar la fecha de pago de cada padre:

> "¿En qué fecha pagó cada padre? (hoy o ayer)"

Presentar la lista de recibos calculados y esperar que el usuario indique, por cada padre, si pagó **hoy** o **ayer** (u otra fecha). Luego mostrar la tabla completa con las fechas ya incorporadas y pedir **una sola confirmación** para emitir todos.

Ejemplo de pregunta:
> Recibos de hoy:
> - Claudia Ruizcaro — S/25
> - Paola Villanueva — S/20
>
> ¿En qué fecha pagó cada una? (hoy / ayer)

La fecha indicada por el usuario se usa en el campo **Fecha de Emisión** de cada recibo en SUNAT.

---

## NOTAS

- **Un recibo por familia**, no por alumno
- **Nombre cliente:** solo primer nombre + primer apellido (tipo: SIN DOCUMENTO)
- **Sin retención** del 8%
- **Inciso A** siempre
- Los montos se calculan dinámicamente desde Firebase cada semana
- Las cancelaciones y reprogramaciones de padres se reflejan en `skipDates` de las sesiones
- El campo `nWeeks`/`weekStart` determina si una sesión temporal ya venció

---

*Archivo creado: 2026-08-12 | Ciclo activo: CICLO 3 (2026-08-03 al 2026-10-11)*
