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

Cada unidad sigue el patrón repetible: `B1 · B2 · BQ1 · B3 · B4 · BQ2 · B5 · B6 · BQ3 · …`

- **B(impar): Visual** → `ico:'🖼'`, preguntas con SVG o diagramas, 100% visual, sin texto explicativo, `qCount:3` ó `4`
- **B(par): Verbal** → `ico:'📐'`, definiciones, propiedades, clasificación por texto, sin SVG, `qCount:3` ó `4`
- **BQ por nivel** → `ico:'⚡'`, `quiz:true`, `qCount:5`, mezcla el par Visual+Verbal del mismo nivel usando `_bqSrcPick([claves],[gens])`
- El **examen de unidad** (estrella ★) lo maneja `_prepUnitExam` automáticamente — **no va** en el array `skills[]`

### Número de niveles por unidad (flexible)

Depende de cuántas variantes distintas de ejercicio se pueden extraer del PDF para ese tema:

| Niveles | Skills | BQs | Cuándo usarlo |
|---------|--------|-----|---------------|
| 2 | B1–B4 | BQ1, BQ2 | Temas simples, pocas variantes |
| 3 | B1–B6 | BQ1–BQ3 | Variedad moderada |
| 4 | B1–B8 | BQ1–BQ4 | Temas ricos |
| 5+ | B1–B10+ | BQ1–BQ5+ | Si el PDF justifica aún más variedad |

Regla: si el tema da para N tipos de ejercicio visual distintos, tiene N niveles. Cada nivel = 1 Visual + 1 Verbal + 1 BQ.

### Orden en `skills[]` del currículo

```
B1, B2, BQ1, B3, B4, BQ2, B5, B6, BQ3, …
```

### Registro en `BINGO_TOPICS` (student.html)

```js
clave_b1:  { ico:'🖼', lbl:'Visual I – Nombre del tema',   qCount:3, gen:()=>_genXxx_B1() },
clave_b2:  { ico:'📐', lbl:'Verbal I – Nombre del tema',   qCount:3, gen:()=>_genXxx_B2() },
clave_bq1: { ico:'⚡', lbl:'Cuestionario 1 – Tema',        qCount:5, gen:()=>_genXxx_BQ1(), quiz:true },
clave_b3:  { ico:'🖼', lbl:'Visual II – Nombre del tema',  qCount:4, gen:()=>_genXxx_B3() },
clave_b4:  { ico:'📐', lbl:'Verbal II – Nombre del tema',  qCount:4, gen:()=>_genXxx_B4() },
clave_bq2: { ico:'⚡', lbl:'Cuestionario 2 – Tema',        qCount:5, gen:()=>_genXxx_BQ2(), quiz:true },
// … continúa según el número de niveles
```

### Helpers de cuestionario en `levelup.js`

```js
function _genXxx_BQ1(){ return _bqSrcPick(['clave_b1','clave_b2'],[_genXxx_B1,_genXxx_B2]); }
function _genXxx_BQ2(){ return _bqSrcPick(['clave_b3','clave_b4'],[_genXxx_B3,_genXxx_B4]); }
function _genXxx_BPU(){ return _bqSrcPick(['clave_b1','clave_b2','clave_b3','clave_b4',...],[_genXxx_B1,_genXxx_B2,...]); }
```

### Registro en `PREP_CURRICULUM` (levelup.js)

```js
{ lbl:'Nombre Unidad', area:'AREA', editorial:'EDITORIAL', skills:['clave_b1','clave_b2','clave_bq1','clave_b3','clave_b4','clave_bq2'] },
```

### Nota sobre etiquetas

La función `_cleanLbl` elimina automáticamente los prefijos `"Visual I –"` / `"Verbal I –"` en la UI. El alumno ve solo el nombre del tema.

---

## Paso 1 – Validar estructura (antes de escribir código)

Te adjunto PDFs con los temas del libro. A partir de ellos necesito que:

1. Propongas la lista de unidades con su nombre y número de niveles
2. Para cada unidad: describas qué tipo de ejercicios irían en cada B-skill (qué hace el visual, qué hace el verbal en cada nivel)
3. Confirmes la clave prefijo que usarás para cada unidad (ej. `xxx_ele`, `xxx_tri`…)

**No escribas código todavía.** Primero validamos la estructura juntos y yo apruebo o corrijo.

---

## Paso 2 – Implementación

Una vez aprobada la estructura, implementas todo en este orden:
1. Generadores en `levelup.js`, verificando sintaxis con `node --check` al terminar
2. `BINGO_TOPICS` + `BINGO_TOPIC_ORDER` en `student.html`
3. Entrada en `PREP_CURRICULUM` en `levelup.js`

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
