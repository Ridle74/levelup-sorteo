# SUNAT Recibos por Honorarios — Emisión desde Pagos Confirmados

## CREDENCIALES SUNAT

- **RUC / Usuario:** 74648201
- **Contraseña:** rino5gHZ
- **URL portal:** https://e-menu.sunat.gob.pe/cl-ti-itmenu/MenuInternet.htm

---

## FUENTE DE DATOS

Los pagos ya están calculados y confirmados en la pestaña **Pagos** de `emaths.me/parents`.
Claude **no recalcula montos** — solo lee lo que el usuario ya confirmó desde esa pestaña.

Los pagos confirmados se guardan en Firestore bajo `padres/main → pagosConfirmados`, con esta estructura:

```
pagosConfirmados: {
  "<pid>_<weekKey>": {
    ts:          "ISO timestamp",
    fecha:       "YYYY-MM-DD",   // fecha de pago ingresada por el usuario
    total:       123,            // monto en S/. (número)
    nombre:      "Claudia Ruizcaro",
    descripcion: "Clases virtuales de matemática nivel secundaria"
  },
  ...
}
```

- `weekKey` = lunes de la semana activa en formato `YYYY-MM-DD`
- `pid === 'fprado'` → **Deposito en Cuenta**; todos los demás → **Transferencia de Fondos**

---

## PASO 1 — Leer pagos confirmados

Abrir `emaths.me/parents` (logueado como admin) e ir a la pestaña **Pagos**.
Ejecutar en la consola del navegador:

```javascript
(function() {
  function startOfWeek(d) {
    var day = d.getDay(), diff = day === 0 ? -6 : 1 - day;
    var mon = new Date(d); mon.setDate(mon.getDate() + diff); mon.setHours(0,0,0,0);
    return mon;
  }
  var weekKey = startOfWeek(new Date()).toISOString().slice(0,10);
  var conf = DATA.pagosConfirmados || {};
  var recibos = Object.keys(conf)
    .filter(function(k) { return k.endsWith('_' + weekKey); })
    .map(function(k) {
      var pid = k.slice(0, -(weekKey.length + 1));
      var p = conf[k];
      return {
        pid:         pid,
        nombre:      p.nombre   || (DATA.parents[pid] || {}).name || pid,
        total:       p.total,
        fecha:       p.fecha,
        descripcion: p.descripcion || 'Clases de matemática',
        medioPago:   pid === 'fprado' ? 'Deposito en Cuenta' : 'Transferencia de Fondos'
      };
    });
  console.log(JSON.stringify(recibos, null, 2));
})();
```

El resultado es el array de recibos a emitir. Copiar la salida.

---

## PASO 2 — Emitir en SUNAT (uno por uno)

### Login
1. Abrir nueva pestaña en: `https://e-menu.sunat.gob.pe/cl-ti-itmenu/MenuInternet.htm`
2. Si no está logueado: ingresar RUC `74648201` y contraseña `rino5gHZ` → Iniciar Sesión

### Navegar al formulario
- Menú SOL → Comprobantes de Pago → SEE-SOL → Recibo por Honorarios Electrónicos → **Emitir Recibo por Honorario Electrónico**

### Por cada recibo del array:

**Pantalla 1 — Datos del cliente**
- **Tipo de documento:** SIN DOCUMENTO
  - Hacer clic en el dropdown y presionar `Home` luego `S` para saltar a "SIN DOCUMENTO"
- **Nombre:** primer nombre + primer apellido del campo `nombre`
  - Ej: "Claudia Ruizcaro" → escribir "Claudia Ruizcaro"
- Clic en Continuar

**Pantalla 2 — Datos del servicio**
- **Descripción:** campo `descripcion` del recibo
- **Fecha:** campo `fecha` del recibo (formato YYYY-MM-DD)
- **Inciso:** Inciso A
- **Retención:** No
- **¿Registrar pago?:** Sí
- **Medio de pago:** campo `medioPago` del recibo
- **Monto:** campo `total` del recibo (ej: 40.00)
- Clic en Continuar

**Preview → Emitir**
- Verificar datos → Clic en Emitir → Confirmar

Repetir para el siguiente recibo.

---

## NOTAS FIJAS

- **Un recibo por familia**, nunca por alumno individual
- **Sin retención** del 8%
- **Inciso A** siempre
- Si `total` está en blanco o es 0 → **no emitir** ese recibo
- Si un pago no aparece en el array → el usuario aún no lo confirmó en la pestaña Pagos; pedirle que lo confirme primero

---

## TARIFAS ESPECIALES — FERNANDO PRADO (`fprado`)

Solo para referencia o si el usuario reporta un error en el monto:
- Alejandro Rodriguez: S/60/sesión (domicilio) + S/40 movilidad/visita → Lun/Mié/Vie = S/300/semana
- Trío Joao+Josué+Lucio: (S/30 + S/15 + S/10) × 3h × 2 días = S/330 + S/60 movilidad = S/390
- Joanna Prado: S/40/sesión (domicilio Sáb) + S/30 movilidad = S/70
- **Total semana completa: S/760**
- **Fernando paga los LUNES por la semana ANTERIOR** — el `weekKey` en su registro corresponde a la semana actual (lunes de hoy) aunque las clases sean de la semana pasada

---

*Actualizado: 2026-09-21 | Ciclo 3 (2026-08-03 al 2026-10-11)*
