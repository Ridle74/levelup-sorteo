# Prompt: Crear nuevo curso Level Up desde PDFs

Voy a crear un nuevo curso para la plataforma **Level Up** (`levelup.js` + `student.html`). Necesito que primero validemos la estructura y luego implementes el curso completo siguiendo exactamente las convenciones del proyecto.

---

## Contexto del proyecto

El proyecto vive en `C:\Users\ridle\Documents\GitHub\levelup-sorteo`. Los dos archivos clave son:
- `levelup.js` → generadores de ejercicios, `PREP_CURRICULUM`
- `student.html` → `BINGO_TOPICS`, `BINGO_TOPIC_ORDER`

---

## Convenciones obligatorias

### Estructura de habilidades por unidad

Cada unidad se organiza en **grupos de habilidades**, cada uno seguido de un cuestionario (BQ):

```
[Grupo 1: B1 · B2 · … · Bn] · BQ1 · [Grupo 2: Bn+1 · … · Bm] · BQ2 · … · Examen
```

**Reglas de los grupos:**
- Cada grupo tiene **mínimo 2 habilidades**, sin máximo fijo. Pueden ser 2, 3, 4 o más.
- El número de habilidades por grupo lo determina el contenido del PDF, no una fórmula fija.
- Si al analizar el PDF una habilidad quedaría sola en su grupo, se fusiona con el grupo que guarde más relación temática con ella.
- **No se fuerza que los grupos sean de tamaño par** ni que alternen visual/verbal.
- **Los grupos se ordenan de menor a mayor dificultad**: el primer grupo contiene los ejercicios más básicos y el último los más complejos. Dentro de cada grupo, las habilidades también siguen esta progresión.

**Tipo de cada habilidad (determinado por el contenido, no por la posición):**
- **Visual** → `ico:'🖼'`, ejercicios con SVG o diagramas. Se usa cuando el ejercicio se entiende mejor de forma gráfica. `qCount:3` ó `4`
- **Verbal** → `ico:'📐'`, ejercicios netamente escritos: definiciones, propiedades, problemas de texto. Se usa cuando el ejercicio se entiende mejor de forma escrita. `qCount:3` ó `4`
- Una habilidad es visual o verbal según cómo se presenta mejor en el PDF — no por ser impar o par en la secuencia.

**Cuestionario (BQ):**
- `ico:'⚡'`, `quiz:true`, `qCount:5`
- Cubre **todas las habilidades del grupo** al que pertenece usando `_bqSrcPick([claves],[gens])`
- Siempre hay exactamente un BQ después de cada grupo.

**Examen de unidad (★):**
- Lo maneja `_prepUnitExam` automáticamente — **no va** en el array `skills[]`
- Cubre todas las habilidades de la unidad.

**El examen de unidad BPU:**
- Mezcla todas las habilidades de la unidad: `_bqSrcPick(['clave_b1','clave_b2',...],[_genXxx_B1,_genXxx_B2,...])`

### Número de grupos por unidad (flexible)

Depende de cuántos tipos de ejercicio distintos se pueden extraer del PDF:

| Grupos | Skills aprox. | BQs | Cuándo usarlo |
|--------|--------------|-----|---------------|
| 2 | 4–6 | BQ1, BQ2 | Temas simples, pocas variantes |
| 3 | 6–9 | BQ1–BQ3 | Variedad moderada |
| 4 | 8–12 | BQ1–BQ4 | Temas ricos |
| 5+ | 10+ | BQ1–BQ5+ | Si el PDF justifica aún más variedad |

**Regla de uso del PDF:** Se usan todos los ejercicios del PDF como referencia. Los ejercicios similares se agrupan bajo una misma habilidad en lugar de crear una habilidad por cada ejercicio individual.

**Orden de las unidades dentro del curso:** Las unidades se ordenan de menor a mayor dificultad — primero los temas más sencillos y al final los más complejos, siguiendo la progresión natural del contenido del PDF.

### Orden en `skills[]` del currículo

```
B1, B2, …, Bn, BQ1, Bn+1, …, Bm, BQ2, …
```
(tantas habilidades por grupo como dicte el contenido)

### Registro en `BINGO_TOPICS` (student.html)

Ejemplo con un grupo de 3 habilidades y otro de 2 (los tipos visual/verbal se asignan según contenido):

```js
clave_b1:  { ico:'🖼', lbl:'Nombre habilidad 1', qCount:4, gen:()=>_genXxx_B1() },
clave_b2:  { ico:'📐', lbl:'Nombre habilidad 2', qCount:4, gen:()=>_genXxx_B2() },
clave_b3:  { ico:'🖼', lbl:'Nombre habilidad 3', qCount:4, gen:()=>_genXxx_B3() },
clave_bq1: { ico:'⚡', lbl:'Cuestionario 1 – Tema', qCount:15, gen:()=>_genXxx_BQ1(), quiz:true, srcKeys:['clave_b1','clave_b2','clave_b3'] }, // 3 habilidades × 5 = 15
clave_b4:  { ico:'📐', lbl:'Nombre habilidad 4', qCount:4, gen:()=>_genXxx_B4() },
clave_b5:  { ico:'🖼', lbl:'Nombre habilidad 5', qCount:4, gen:()=>_genXxx_B5() },
clave_bq2: { ico:'⚡', lbl:'Cuestionario 2 – Tema', qCount:10, gen:()=>_genXxx_BQ2(), quiz:true, srcKeys:['clave_b4','clave_b5'] }, // 2 habilidades × 5 = 10
// … continúa según el número de grupos
```

### Helpers de cuestionario en `levelup.js`

```js
// BQ1 cubre todas las habilidades del grupo 1 (pueden ser 2, 3 o más)
function _genXxx_BQ1(){ return _bqSrcPick(['clave_b1','clave_b2','clave_b3'],[_genXxx_B1,_genXxx_B2,_genXxx_B3]); }
_SKILL_META['xxx_bq1']={ico:'⚡', lbl:'Cuestionario 1 – Tema', qCount:15, gen:_genXxx_BQ1, quiz:true, srcKeys:['xxx_b1','xxx_b2','xxx_b3']};
// ⚠️ srcKeys es OBLIGATORIO en todo BQ — sin él el motor usa el qCount global (10) en lugar de srcKeys.length × 5

// BQ2 cubre todas las habilidades del grupo 2
function _genXxx_BQ2(){ return _bqSrcPick(['clave_b4','clave_b5'],[_genXxx_B4,_genXxx_B5]); }
_SKILL_META['xxx_bq2']={ico:'⚡', lbl:'Cuestionario 2 – Tema', qCount:10, gen:_genXxx_BQ2, quiz:true, srcKeys:['xxx_b4','xxx_b5']};
```

### Registro en `PREP_CURRICULUM` (levelup.js)

```js
{ lbl:'Nombre Unidad', area:'AREA', editorial:'EDITORIAL', skills:['clave_b1','clave_b2','clave_bq1','clave_b3','clave_b4','clave_bq2'] },
```

### Nota sobre etiquetas

La función `_cleanLbl` limpia automáticamente los labels en la UI. El alumno ve solo el nombre del tema, sin prefijos técnicos.

---

## Paso 0 – Verificar que el curso es registrable (OBLIGATORIO antes de todo)

Con los cuatro datos del curso (nivel, grado, área, editorial), verifica en `PREP_LEVELS` de `levelup.js` que la combinación existe. Los menús de la app filtran en cascada: nivel → grado → área → editorial; si cualquiera de esas opciones no existe, el curso no aparecerá aunque esté correctamente implementado.

**Qué verificar:**
1. **Área** — busca en `PREP_LEVELS[nivel].areas` que exista un objeto con `key` igual al área del curso. Si no existe, agrégalo antes de continuar.
2. **Editorial** — el filtro de editorial se construye dinámicamente desde las unidades del `PREP_CURRICULUM`, así que basta con poner `editorial:'xxx'` en las entradas del currículo para que aparezca automáticamente.

**Ejemplo:** si el curso es `primaria · 4° · algebra · intelectum`, comprueba que en `PREP_LEVELS.primaria.areas` exista `{key:'algebra', lbl:'Álgebra', ico:'α'}`. Si no está, agrégalo.

Si el área falta, agrégala al array antes de avanzar al Paso 1. No asumas que ya existe.

---

## Paso 1 – Validar estructura (antes de escribir código)

Te adjunto PDFs con los temas del libro. A partir de ellos necesito que:

1. Propongas la lista de unidades con su nombre y número de grupos
2. Para cada unidad: describas qué habilidades irían en cada grupo, indicando si cada una es visual o verbal y por qué, y cuántas habilidades tiene cada grupo
3. Confirmes la clave prefijo que usarás para cada unidad (ej. `xxx_ele`, `xxx_tri`…)

La propuesta tiene **dos partes obligatorias**. No escribas código hasta que yo apruebe ambas.

### Parte A — Tabla de orden por unidad

Incluye una tabla por unidad con el orden exacto de cada elemento:

| # | Clave | Tipo |
|---|-------|------|
| 1 | prefijo_b1 | 🖼 Habilidad |
| 2 | prefijo_b2 | 📐 Habilidad |
| 3 | prefijo_bq1 | ⚡ Cuestionario 1 |
| … | … | … |
| n | ★ Examen | automático |

### Parte B — Tabla de plantillas por habilidad

Inmediatamente después de la Parte A, incluye una tabla de plantillas para **cada habilidad** (B1, B2, … Bn), con exactamente 5 filas P1–P5 y una descripción precisa de qué tipo de ejercicio cubre cada plantilla, citando la imagen o sección del PDF de donde se extrae:

**Ejemplo de formato:**

**B1 🖼 Nombre de la habilidad** — [razón visual/verbal, referencia a imagen o sección del PDF]

| Plantilla | Descripción |
|-----------|-------------|
| P1 | Descripción exacta del tipo de ejercicio (ej: imagen 2, Nivel I) |
| P2 | … |
| P3 | … |
| P4 | … |
| P5 | … |

Repite este bloque para cada habilidad de la unidad antes de continuar con la siguiente.

**Regla:** la descripción de cada plantilla debe ser suficientemente específica para que, al implementar, sea imposible confundirla con otra. Si una plantilla dice "ejercicios numéricos", eso no es suficiente — debe decir qué se da, qué se pide, y de qué parte del PDF proviene.

**No escribas código todavía.** Primero valido ambas partes y apruebo o corrijo.

---

## Paso 2 – Implementación

Una vez aprobada la estructura, implementas todo en este orden:

1. **Generadores + `_SKILL_META` en `levelup.js`** — por cada función generadora, agrega inmediatamente después su entrada en `_SKILL_META`:
   ```js
   function _genXxx_YYY_B1(){ ... }
   _SKILL_META['xxx_yyy_b1'] = {ico:'🖼', lbl:'Nombre habilidad', qCount:3, gen:_genXxx_YYY_B1};

   function _genXxx_YYY_BQ1(){ ... }
   _SKILL_META['xxx_yyy_bq1'] = {ico:'⚡', lbl:'Cuestionario 1 – Tema', qCount:5, gen:_genXxx_YYY_BQ1, quiz:true};
   ```
   `student.html` absorbe estas entradas automáticamente al cargar — **no editar `student.html`**.

### Los ejercicios del PDF/imagen son plantillas — banco de 20 preguntas por habilidad

Los ejercicios que aparecen en el PDF o en las imágenes adjuntas son **plantillas de tipos de pregunta**, no ejercicios individuales a copiar. A partir de cada plantilla debes crear **variaciones** cambiando los datos numéricos, el contexto o la formulación, hasta completar un banco de exactamente **20 preguntas por habilidad**.

**Cómo identificar plantillas desde el PDF:**
- El criterio es el **procedimiento/razonamiento**, no el enunciado. Dos ejercicios con números distintos pero mismo procedimiento → misma plantilla.
- Si varios ejercicios del PDF son del mismo tipo, escoge los **4 más representativos** para esa plantilla y descarta el resto — no los fuerzas a otra plantilla ni a otra habilidad solo porque sobran.
- Una **habilidad nueva** solo nace cuando el procedimiento es genuinamente distinto, nunca como válvula de escape para ejercicios que no cupieron.
- El límite de 20 preguntas por habilidad es estricto. Si un ejercicio del PDF encaja conceptualmente en una habilidad ya completa, se descarta — no se crea una habilidad nueva para acomodarlo.
- Al terminar el curso, reporta qué ejercicios del PDF quedaron fuera y por qué (redundancia, plantilla ya completa, o sin valor pedagógico adicional).

**Estructura fija: siempre 5 plantillas × 4 preguntas = 20**
- Cada habilidad tiene **exactamente 5 plantillas** con **exactamente 4 preguntas** cada una.
- No "~4": son exactamente 4. No hay plantillas con 3 ni con 5.

**Formato del banco (`_i4gpick`):**
```js
function _genXxx_B1(){
  return _i4gpick([
    // Plantilla 1 — Nombre descriptivo (4 preguntas)
    {_id:1, q:'...', a:'...', opts:_i4gshuf([...]), mc:true, ste:'...'},
    {_id:2, q:'...', a:'...', opts:_i4gshuf([...]), mc:true, ste:'...'},
    {_id:3, q:'...', a:'...', opts:_i4gshuf([...]), mc:true, ste:'...'},
    {_id:4, q:'...', a:'...', opts:_i4gshuf([...]), mc:true, ste:'...'},
    // Plantilla 2 — Nombre descriptivo (4 preguntas)
    {_id:5, ...}, {_id:6, ...}, {_id:7, ...}, {_id:8, ...},
    // Plantilla 3 — Nombre descriptivo (4 preguntas)
    {_id:9, ...}, {_id:10,...}, {_id:11,...}, {_id:12,...},
    // Plantilla 4 — Nombre descriptivo (4 preguntas)
    {_id:13,...}, {_id:14,...}, {_id:15,...}, {_id:16,...},
    // Plantilla 5 — Nombre descriptivo (4 preguntas)
    {_id:17,...}, {_id:18,...}, {_id:19,...}, {_id:20,...},
  ]);
}
_SKILL_META['xxx_b1'] = {
  ico:'📐', lbl:'Nombre habilidad', qCount:4, gen:_genXxx_B1,
  plantillas:['Nombre plantilla 1','Nombre plantilla 2','Nombre plantilla 3','Nombre plantilla 4','Nombre plantilla 5']
};
```

Cada pregunta lleva `_id` del 1 al 20 (permite identificarla unívocamente en el banco). El campo `ste` es la pista/solución paso a paso que se muestra al alumno.

**`qCount` por tipo:**
- Habilidad: siempre `qCount:4`
- Cuestionario BQ: `qCount` = número de habilidades del grupo × 5 (porque `_bqSrcPick` extrae 1 pregunta por plantilla por habilidad). Ejemplo: BQ que cubre 3 habilidades → `qCount:15`.

---

### Regla obligatoria: generación procedural (sin pools fijos) — solo para generadores dinámicos

> **Nota:** El formato de banco fijo con `_i4gpick` (descrito arriba) es el estándar para habilidades creadas desde PDF. El formato procedural a continuación aplica solo cuando el contenido es puramente algorítmico (ej. cálculo con variables aleatorias sin contexto de libro).

Cada generador procedural debe:
- Elegir un **tipo de pregunta** aleatoriamente con `var t = _i4grnd(0, N)`
- Generar los **datos numéricos** con `_i4grnd` en cada llamada

```js
// ✅ CORRECTO — procedural
function _genXxx_B2(){
  var r=_i4grnd, sh=_i4gshuf, t=r(0,4);
  var a,b,ans;
  if(t===0){ a=r(1,4); b=r(2,9); ans=a*a+'x²+'+(2*a*b)+'x+'+b*b; return {q:'Desarrolla: ('+a+'x+'+b+')²', a:ans, opts:sh([ans,...]), mc:true, ste:'...'}; }
  if(t===1){ ... }
  // etc.
}
```

**Cantidad mínima de tipos por generador procedural:** al menos 6 tipos distintos. Cada tipo debe poder generar múltiples variantes por parámetros aleatorios.

2. **Entrada en `PREP_CURRICULUM` en `levelup.js`**

3. **Verificar sintaxis** con `node --check levelup.js`

---

## Paso 3 – Verificación final (OBLIGATORIO antes de declarar el curso listo)

Una vez implementado todo el código y verificada la sintaxis, realiza esta auditoría comparando el código contra la Parte B aprobada en Paso 1. El curso **no está terminado** hasta que pases esta verificación.

### 3a — Verificar nombres de plantillas en `_SKILL_META`

Para cada habilidad, extrae el array `plantillas:[...]` del `_SKILL_META` implementado y compáralo línea a línea con la tabla aprobada en Paso 1 Parte B. Muestra la comparación en este formato:

| Habilidad | Plantilla | Aprobado en Paso 1 | Implementado en código | ¿Coincide? |
|-----------|-----------|-------------------|----------------------|-----------|
| B1 | P1 | "Descripción aprobada" | "Nombre en plantillas:[]" | ✅ / ❌ |
| B1 | P2 | … | … | … |
| … | … | … | … | … |

Si alguna celda tiene ❌, **corrige el código antes de continuar**. No se acepta un nombre diferente aunque el ejercicio sea "parecido".

### 3b — Verificar que las preguntas (_id 1–20) corresponden a su plantilla

Para cada habilidad, revisa que los grupos de preguntas estén en el lugar correcto:
- `_id` 1–4 → P1
- `_id` 5–8 → P2
- `_id` 9–12 → P3
- `_id` 13–16 → P4
- `_id` 17–20 → P5

Para cada plantilla, cita el enunciado de una pregunta representativa y confirma que corresponde a la descripción aprobada. Si alguna pregunta está en el grupo equivocado o no corresponde a la descripción, corrígela.

### 3c — Verificar trazabilidad con el PDF/imágenes

Para cada habilidad, indica de qué imagen o sección del PDF proviene el contenido de cada plantilla. Si una plantilla no tiene respaldo en el material enviado (fue inventada sin referencia al PDF), reemplázala por contenido basado en el material real.

### Formato del reporte de verificación

Al terminar los pasos 3a, 3b y 3c, emite un resumen con este formato:

```
✅ B1 – [Nombre]: todas las plantillas coinciden y tienen respaldo en PDF
✅ B2 – [Nombre]: todas las plantillas coinciden y tienen respaldo en PDF
❌ B3 – [Nombre]: P2 no coincide ("X" implementado vs "Y" aprobado) — CORREGIDO
…
```

Solo cuando todas las habilidades muestran ✅ el curso está terminado.

---

## Datos del nuevo curso

- **Nivel:** `[primaria / secundaria]`
- **Grado:** `[número]`
- **Área:** `[matematica / geometria / algebra / aritmetica / …]`
- **Editorial (clave):** `[asis / belen / intelectum / trinidad / oliveros / recalde / andersen / agustin / norberto / …]`
- **URL del curso:** `/levelup/[código]-[editorial]`  *(ej: `p4ge-intelectum`)*
- **Clave prefijo global de habilidades:** `[ej: int4g, sa2g, bel1…]`

---

*[Adjunta aquí los PDFs de cada unidad]*
