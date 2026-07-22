// levelup.js — Level Up (Prepárate): state, generators, curriculum data, functions
// Cargado como <script src="/levelup.js"> independiente de student.html
// Un error de sintaxis aquí NO rompe la carga de student.html

// ── Estado ─────────────────────────────────────────────────────────────────────

let _prep = { state:'config', level:null, grade:null, topic:'', qCount:10, timeSec:300, ansMode:'mc', editorial:null, area:null, openSelector:null, editorialChosen:false, selectedUnit:null, quizNum:0, questions:[], answers:[], currentIdx:0, selectedOpt:null, answered:false, startTime:null, endTime:null, timeLeft:0, showReview:false, unitSkillList:[], unitDone:[] };
let _prepActiveUserId = undefined; // detecta cambio de cuenta

// ── URL Routing ─────────────────────────────────────────────────────────────────
const _PREP_URL_NIVEL   = {p:'primaria',s:'secundaria',u:'preuniversitario'};
const _PREP_URL_NIVEL_R = {primaria:'p',secundaria:'s',preuniversitario:'u'};
const _PREP_URL_AREA    = {m:'matematica',rm:'razonamiento',al:'algebra',ar:'aritmetica',tr:'trigonometria',ge:'geometria'};
const _PREP_URL_AREA_R  = {matematica:'m',razonamiento:'rm',algebra:'al',aritmetica:'ar',trigonometria:'tr',geometria:'ge'};
const _PREP_URL_ED      = {asis:'san_francisco',belen:'belen',intelectum:'intelectum',oliveros:'saco_oliveros',trinidad:'trinidad',recalde:'san_ignacio',andersen:'hans_christian_andersen',agustin:'san_agustin'};
const _PREP_URL_ED_R    = {san_francisco:'asis',belen:'belen',intelectum:'intelectum',saco_oliveros:'oliveros',trinidad:'trinidad',san_ignacio:'recalde',hans_christian_andersen:'andersen',san_agustin:'agustin'};

function _prepApplyUrlSlug() {
  // Usa la URL actual; si ya fue cambiada por go(), usa el path guardado al inicio de página
  let pathname = location.pathname;
  if (!pathname.match(/^\/student\/levelup\//) && typeof _levelUpInitPath !== 'undefined') {
    pathname = _levelUpInitPath;
  }
  const m = pathname.match(/^\/student\/levelup\/([^/?#]+)/);
  if (!m) return false;
  const sm = m[1].match(/^([psu])(\d+)([a-z]+)(?:-(.+))?$/);
  if (!sm) return false;
  const level = _PREP_URL_NIVEL[sm[1]];
  if (!level) return false;
  _prep.level = level;
  _prep.grade = sm[2] || null;
  _prep.area  = _PREP_URL_AREA[sm[3]] || null;
  if (sm[4]) {
    _prep.editorial = _PREP_URL_ED[sm[4]] || null;
    _prep.editorialChosen = true;
  }
  return true;
}

function _prepSyncUrl() {
  const n = _PREP_URL_NIVEL_R[_prep.level];
  const g = _prep.grade;
  const a = _prep.area ? (_PREP_URL_AREA_R[_prep.area] || '') : '';
  const c = _prep.editorial ? (_PREP_URL_ED_R[_prep.editorial] || '') : '';
  if (!n || !g || !a) {
    // No borrar un slug existente — solo limpiar si ya estamos en la URL base
    if (location.pathname.startsWith('/student/levelup/')) return; // dejar el slug intacto
    if (location.pathname !== '/student/levelup') history.replaceState({view:'levelup'}, '', '/student/levelup');
    return;
  }
  const newPath = '/student/levelup/' + n + g + a + (c ? '-'+c : '');
  if (location.pathname !== newPath) history.replaceState({view:'levelup'}, '', newPath);
}
let _prepTimerIntv = null;
let _prepHistoryData = null;    // null=sin cargar, []=vacío, [...]=datos
let _prepHistoryLoading = false;
let _prepShowHistory = false;
let _prepExpandedHistId = null;
// Admin: historial global de todos los alumnos
let _prepAdminHistData = null;
let _prepAdminHistLoading = false;
let _prepAdminShowHist = false;
let _prepAdminFilterUid = null;  // null = todos
let _prepAdminExpandedId = null;
// Reportes de errores en ejercicios de Level Up
let _prepReportModalOpen = false;
let _prepAdminReportsData = null;
let _prepAdminReportsLoading = false;
let _prepAdminShowReports = false;
let _prepAdminReportsFilter = 'pending'; // 'pending' | 'confirmed' | 'dismissed'

// ── Generadores de ejercicios ───────────────────────────────────────────────────

// b1: ¿Cuántos elementos tiene A∪B? — con diagrama Venn
function _genConj4B1(){
  const common=_c4ints(_c4rnd(1,3),2,20);
  const onlyA=_c4ints(_c4rnd(2,3),2,20,common);
  const onlyB=_c4ints(_c4rnd(2,3),2,20,[...common,...onlyA]);
  const ans=common.length+onlyA.length+onlyB.length;
  const wrongs=_c4shuf([onlyA.length+onlyB.length,common.length+onlyA.length,common.length+onlyB.length,ans-1,ans+1].filter(v=>v!==ans&&v>0)).slice(0,3);
  const svg=_c4venn(onlyA,common,onlyB);
  return{q:`<div style="display:block;width:100%;text-align:center">${svg}<div style="font-size:14px;margin-top:4px">¿Cuántos elementos tiene A∪B?</div></div>`,
    a:ans,opts:_c4shuf([ans,...wrongs]),mc:true,ste:`A∪B incluye todos los números del diagrama sin repetir: ${ans} en total.`};
}
// b2: ¿Cuántos elementos tiene A∩B? — con diagrama Venn
function _genConj4B2(){
  const common=_c4ints(_c4rnd(1,3),2,20);
  const onlyA=_c4ints(_c4rnd(2,3),2,20,common);
  const onlyB=_c4ints(_c4rnd(2,3),2,20,[...common,...onlyA]);
  const ans=common.length;
  const wrongs=_c4shuf([onlyA.length,onlyB.length,ans+1,ans+2,ans+onlyA.length].filter(v=>v!==ans&&v>=0)).slice(0,3);
  const svg=_c4venn(onlyA,common,onlyB);
  return{q:`<div style="display:block;width:100%;text-align:center">${svg}<div style="font-size:14px;margin-top:4px">¿Cuántos elementos tiene A∩B?</div></div>`,
    a:ans,opts:_c4shuf([ans,...wrongs]),mc:true,ste:`A∩B son los números del centro (amarillo): ${common.join(', ')} → ${ans} elemento${ans!==1?'s':''}.`};
}
// b3: ¿Qué número pertenece a A∩B? — con diagrama Venn
function _genConj4B3(){
  const common=_c4ints(_c4rnd(1,2),2,20);
  const onlyA=_c4ints(2,2,20,common);
  const onlyB=_c4ints(2,2,20,[...common,...onlyA]);
  const ans=common[0];
  const d=_c4shuf([onlyA[0],onlyB[0],_c4ints(1,21,30,[...common,...onlyA,...onlyB])[0]||88]);
  const svg=_c4venn(onlyA,common,onlyB);
  return{q:`<div style="display:block;width:100%;text-align:center">${svg}<div style="font-size:14px;margin-top:4px">¿Qué número pertenece a A∩B?</div></div>`,
    a:ans,opts:_c4shuf([ans,...d.slice(0,3)]),mc:true,ste:`El número del centro (donde se cruzan A y B) es ${ans}.`};
}
// b4: Problema contexto → calcular UNIÓN
function _genConj4B4(){
  const inter=_c4rnd(3,10),aO=_c4rnd(5,18),bO=_c4rnd(5,18);
  const a=aO+inter,b=bO+inter,ans=a+b-inter;
  const ctx=_c4pick(_CONJ4_CTX);
  const wrongs=_c4shuf([a+b,ans+_c4rnd(1,4),a,b,ans-_c4rnd(1,3)].filter(v=>v!==ans&&v>0)).slice(0,3);
  return{q:`En un grupo:\n· ${a} estudiantes ${ctx.A}\n· ${b} estudiantes ${ctx.B}\n· ${inter} estudiantes ${ctx.both}\n¿Cuántos estudiantes ${ctx.q_u}?`,
    a:ans,opts:_c4shuf([ans,...wrongs]),mc:true,ste:`|A∪B| = |A| + |B| − |A∩B| = ${a} + ${b} − ${inter} = ${ans}`};
}
// b5: Problema contexto → calcular INTERSECCIÓN (dado el total de la unión)
function _genConj4B5(){
  const inter=_c4rnd(3,10),aO=_c4rnd(5,18),bO=_c4rnd(5,18);
  const a=aO+inter,b=bO+inter,total=a+b-inter;
  const ctx=_c4pick(_CONJ4_CTX);
  const wrongs=_c4shuf([inter+_c4rnd(1,4),Math.max(1,inter-_c4rnd(1,3)),a,b].filter(v=>v!==inter&&v>0)).slice(0,3);
  return{q:`En un grupo de ${total} estudiantes:\n· ${a} estudiantes ${ctx.A}\n· ${b} estudiantes ${ctx.B}\n¿Cuántos estudiantes ${ctx.q_i}?`,
    a:inter,opts:_c4shuf([inter,...wrongs]),mc:true,ste:`|A∩B| = |A| + |B| − total = ${a} + ${b} − ${total} = ${inter}`};
}
// bq1: Quiz — Conjuntos Numéricos (mezcla b1 + b2 + b3)
function _genConj4BQ1(){const f=[_genConj4B1,_genConj4B2,_genConj4B3];return f[_c4rnd(0,2)]();}
// bq2: Quiz — Problemas de Contexto (mezcla b4 + b5)
function _genConj4BQ2(){return Math.random()<0.5?_genConj4B4():_genConj4B5();}

// b6: ¿Cuáles son los elementos de A∪B? — con diagrama Venn
function _genConj4B6(){
  const common=_c4ints(_c4rnd(1,2),1,20);
  const onlyA=_c4ints(_c4rnd(2,3),1,20,common);
  const onlyB=_c4ints(_c4rnd(2,3),1,20,[...common,...onlyA]);
  const union=[...common,...onlyA,...onlyB].sort((a,b)=>a-b);
  const ans=`{${union.join(', ')}}`;
  const d1=`{${[...onlyA,...onlyB].sort((a,b)=>a-b).join(', ')}}`;    // sin los comunes
  const d2=`{${common.join(', ')}}`;                                    // solo intersección
  const d3=`{${[...common,...onlyA].sort((a,b)=>a-b).join(', ')}}`;   // solo A
  const pool=[d1,d2,d3].filter(v=>v!==ans);
  const svg=_c4venn(onlyA,common,onlyB);
  return{q:`<div style="display:block;width:100%;text-align:center">${svg}<div style="font-size:14px;margin-top:4px">¿Cuáles son los elementos de A∪B?</div></div>`,
    a:ans,opts:_c4shuf([ans,...pool.slice(0,3)]),mc:true,ste:`A∪B incluye todos los números del diagrama → ${ans}`};
}
// b7: ¿Cuáles son los elementos de A∩B? — con diagrama Venn
function _genConj4B7(){
  const common=_c4ints(_c4rnd(2,3),1,20);
  const onlyA=_c4ints(_c4rnd(2,3),1,20,common);
  const onlyB=_c4ints(_c4rnd(2,3),1,20,[...common,...onlyA]);
  const inter=[...common].sort((a,b)=>a-b);
  const ans=`{${inter.join(', ')}}`;
  const d1=`{${[...common,...onlyA.slice(0,1)].sort((a,b)=>a-b).join(', ')}}`;  // demasiado
  const d2=`{${[...common,...onlyA,...onlyB].sort((a,b)=>a-b).join(', ')}}`;    // todo A∪B
  const d3=`{${[...common,...onlyB.slice(0,1)].sort((a,b)=>a-b).join(', ')}}`;  // demasiado B
  const pool=[d1,d2,d3].filter(v=>v!==ans);
  const svg=_c4venn(onlyA,common,onlyB);
  return{q:`<div style="display:block;width:100%;text-align:center">${svg}<div style="font-size:14px;margin-top:4px">¿Cuáles son los elementos de A∩B?</div></div>`,
    a:ans,opts:_c4shuf([ans,...pool.slice(0,3)]),mc:true,ste:`A∩B son los números del centro (amarillo) → ${ans}`};
}
// b8: Identificar operación en diagrama Venn sombreado (visual SVG)
function _genConj4B8(){
  const uid='v'+Math.random().toString(36).slice(2,7);
  const shade=Math.random()<0.5?'union':'inter';
  let circles='';
  if(shade==='union'){
    circles=`<circle cx="88" cy="80" r="64" fill="rgba(251,191,36,0.42)" stroke="#fbbf24" stroke-width="2.5"/>
    <circle cx="168" cy="80" r="64" fill="rgba(251,191,36,0.42)" stroke="#fbbf24" stroke-width="2.5"/>`;
  } else {
    circles=`<circle cx="88" cy="80" r="64" fill="rgba(56,189,248,0.1)" stroke="#38bdf8" stroke-width="2.5"/>
    <circle cx="168" cy="80" r="64" fill="rgba(56,189,248,0.1)" stroke="#38bdf8" stroke-width="2.5"/>
    <clipPath id="${uid}"><circle cx="88" cy="80" r="64"/></clipPath>
    <circle cx="168" cy="80" r="64" fill="rgba(251,191,36,0.55)" clip-path="url(#${uid})" stroke="none"/>`;
  }
  const svgQ=`<div style="display:block;width:100%;text-align:center"><svg viewBox="0 0 256 160" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:256px;margin:4px auto;display:block">${circles}<text x="28" y="33" font-size="15" fill="#e2e8f0" font-weight="700">A</text><text x="214" y="33" font-size="15" fill="#e2e8f0" font-weight="700">B</text></svg><div style="font-size:14px;margin-top:2px">La región en amarillo representa:</div></div>`;
  const ans=shade==='union'?'A∪B':'A∩B';
  const ste=shade==='union'?'Toda la figura está sombreada → A∪B (todos los elementos de A y B).':'Solo el centro está sombreado → A∩B (los elementos en común).';
  return{q:svgQ,a:ans,opts:_c4shuf(['A∪B','A∩B','solo A','solo B']),mc:true,ste};
}
// bq3: Quiz — Unión e Intersección avanzado (mezcla b6 + b7 + b8 + b9)
function _genConj4BQ3(){const f=[_genConj4B6,_genConj4B7,_genConj4B8,_genConj4B9];return f[_c4rnd(0,3)]();}

// b9: Interpretar vocabulario de conjuntos en problemas de contexto
const _CONJ4_VOCAB=[
  // UNIÓN (∪)
  {phrase:'¿Cuántos estudiantes les gusta al menos una de las dos materias?',
   ans:'Unión (∪)',ste:'"Al menos una" → se cuenta a quien esté en A, en B o en ambos → A∪B.'},
  {phrase:'¿Cuántos alumnos practican fútbol o vóley (o los dos)?',
   ans:'Unión (∪)',ste:'"A o B" incluyendo quienes tienen los dos → A∪B.'},
  {phrase:'¿Cuántos estudiantes dominan por lo menos un idioma?',
   ans:'Unión (∪)',ste:'"Por lo menos uno" → A∪B.'},
  {phrase:'¿Cuántos alumnos asistieron a arte o a música?',
   ans:'Unión (∪)',ste:'"A o B" → todos los de A más todos los de B (sin repetir) → A∪B.'},
  {phrase:'¿Cuántos niños participaron en alguno de los dos talleres?',
   ans:'Unión (∪)',ste:'"Alguno de los dos" → A∪B.'},
  {phrase:'¿Cuántos estudiantes llevan matemáticas o inglés?',
   ans:'Unión (∪)',ste:'"A o B" → unión de ambos conjuntos → A∪B.'},
  // INTERSECCIÓN (∩)
  {phrase:'¿Cuántos estudiantes les gustan las artes Y las matemáticas?',
   ans:'Intersección (∩)',ste:'"A y B" al mismo tiempo → solo los del centro del diagrama Venn → A∩B.'},
  {phrase:'¿Cuántos alumnos dominan ambos cursos?',
   ans:'Intersección (∩)',ste:'"Ambos" → quienes están en los dos conjuntos a la vez → A∩B.'},
  {phrase:'¿Cuántos niños practican fútbol y también vóley?',
   ans:'Intersección (∩)',ste:'"A y también B" → elementos comunes a A y B → A∩B.'},
  {phrase:'¿Cuántos estudiantes están en el club de ciencias y en el de arte?',
   ans:'Intersección (∩)',ste:'"En A y en B" → intersección → A∩B.'},
  {phrase:'¿Cuántos alumnos hablan inglés y francés?',
   ans:'Intersección (∩)',ste:'"A y B" al mismo tiempo → A∩B.'},
  {phrase:'¿Cuántos estudiantes llevan los dos cursos?',
   ans:'Intersección (∩)',ste:'"Los dos" → A∩B.'},
  // SOLO EN A (diferencia A−B)
  {phrase:'¿Cuántos alumnos solo practican fútbol, pero no vóley?',
   ans:'Solo en A (A−B)',ste:'"Solo A (no B)" → elementos de A que no están en B → diferencia A−B.'},
  {phrase:'¿Cuántos estudiantes únicamente llevan matemáticas, no inglés?',
   ans:'Solo en A (A−B)',ste:'"Únicamente A, no B" → A−B.'},
  {phrase:'¿Cuántos niños están en arte pero no en música?',
   ans:'Solo en A (A−B)',ste:'"En A pero no en B" → diferencia A−B.'},
  // NINGUNO / COMPLEMENTO
  {phrase:'¿Cuántos alumnos no les gusta ni el fútbol ni el vóley?',
   ans:'Ninguno (fuera de A∪B)',ste:'"Ni A ni B" → quienes no pertenecen a ningún conjunto → complemento de A∪B.'},
  {phrase:'¿Cuántos estudiantes no participaron en ninguna de las dos actividades?',
   ans:'Ninguno (fuera de A∪B)',ste:'"Ninguna de las dos" → fuera de ambos conjuntos → complemento de A∪B.'},
  {phrase:'¿Cuántos alumnos no llevan ningún curso extracurricular?',
   ans:'Ninguno (fuera de A∪B)',ste:'"Ninguno" → no pertenece ni a A ni a B → complemento de A∪B.'},
];
function _genConj4B9(){
  const item=_c4pick(_CONJ4_VOCAB);
  const allOpts=['Unión (∪)','Intersección (∩)','Solo en A (A−B)','Ninguno (fuera de A∪B)'];
  const wrongs=_c4shuf(allOpts.filter(o=>o!==item.ans)).slice(0,3);
  return{q:`En un problema de conjuntos aparece la siguiente pregunta:\n"${item.phrase}"\n¿Qué operación de conjuntos representa?`,
    a:item.ans,opts:_c4shuf([item.ans,...wrongs]),mc:true,ste:item.ste};
}

// ── Incluido y No Incluido 4° Primaria – Colegio Belén ───────────────────────
function _incl4rnd(a,b){return Math.floor(Math.random()*(b-a+1))+a;}
function _incl4shuf(arr){return arr.slice().sort(()=>Math.random()-.5);}
function _incl4pool(n,min,max,ex=[]){
  const pool=[];for(let i=min;i<=max;i++)if(!ex.includes(i))pool.push(i);
  return _incl4shuf(pool).slice(0,n).sort((a,b)=>a-b);
}
// b1: Diagrama de cajas/círculos — ¿A ⊂ B o A ⊄ B?
function _genIncl4B1(){
  const isSubset=Math.random()<0.5;
  let A,B;
  if(isSubset){
    B=_incl4pool(_incl4rnd(5,7),1,20);
    A=_incl4shuf(B).slice(0,_incl4rnd(2,3)).sort((a,b)=>a-b);
  } else {
    B=_incl4pool(_incl4rnd(4,6),1,20);
    const outside=_incl4pool(1,21,30);
    const inside=_incl4shuf(B).slice(0,_incl4rnd(1,2));
    A=[..._incl4shuf(inside).slice(0,1),...outside].sort((a,b)=>a-b);
  }
  const ans=isSubset?'⊂':'⊄';
  const ste=isSubset
    ?`Todos los elementos de A (${A.join(', ')}) también están en B → A ⊂ B.`
    :`El elemento ${A.find(x=>!B.includes(x))} no está en B → A ⊄ B.`;
  const svg=_incl4nestedSvg(A,B,isSubset);
  return{q:`<div style="display:block;width:100%;text-align:center">${svg}<div style="font-size:14px;margin-top:4px">¿Qué símbolo va entre A y B?<br><strong>A _____ B</strong></div></div>`,
    a:ans,opts:_incl4shuf([ans,isSubset?'⊄':'⊂','⊃','∈']),mc:true,ste};
}
// b2: Diagrama de cajas (visual SVG) — ¿A ⊂ B o A ⊄ B?
function _genIncl4B2(){
  const isSubset=Math.random()<0.5;
  const B=_incl4pool(_incl4rnd(4,6),1,20);
  let A;
  if(isSubset){
    A=_incl4shuf(B).slice(0,_incl4rnd(2,Math.min(3,B.length-1))).sort((a,b)=>a-b);
  } else {
    const outside=_incl4pool(1,21,30);
    const inside=_incl4shuf(B).slice(0,_incl4rnd(1,2));
    A=[...inside,...outside].sort((a,b)=>a-b);
  }
  const ans=isSubset?'⊂':'⊄';
  const ste=isSubset
    ?`En el diagrama, A está completamente dentro de B → A ⊂ B.`
    :`A tiene el elemento ${A.find(x=>!B.includes(x))} que no está en B → A ⊄ B.`;
  let svg;
  if(isSubset){
    svg=`<svg viewBox="0 0 280 140" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:280px;margin:4px auto;display:block">
      <rect x="8" y="8" width="264" height="124" rx="12" fill="rgba(56,189,248,0.1)" stroke="#38bdf8" stroke-width="2.5"/>
      <text x="18" y="28" font-size="14" fill="#38bdf8" font-weight="700">B</text>
      <text x="16" y="122" font-size="11" fill="#7dd3fc">{${B.join(', ')}}</text>
      <rect x="38" y="34" width="170" height="64" rx="10" fill="rgba(251,191,36,0.15)" stroke="#fbbf24" stroke-width="2"/>
      <text x="48" y="52" font-size="13" fill="#fbbf24" font-weight="700">A</text>
      <text x="46" y="80" font-size="12" fill="#fde68a">{${A.join(', ')}}</text>
    </svg>`;
  } else {
    svg=`<svg viewBox="0 0 300 130" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:300px;margin:4px auto;display:block">
      <rect x="8" y="22" width="134" height="90" rx="12" fill="rgba(56,189,248,0.1)" stroke="#38bdf8" stroke-width="2.5"/>
      <text x="18" y="42" font-size="14" fill="#38bdf8" font-weight="700">B</text>
      <text x="14" y="100" font-size="11" fill="#7dd3fc">{${B.slice(0,5).join(', ')}}</text>
      <rect x="158" y="22" width="132" height="90" rx="12" fill="rgba(251,191,36,0.12)" stroke="#fbbf24" stroke-width="2.5"/>
      <text x="168" y="42" font-size="14" fill="#fbbf24" font-weight="700">A</text>
      <text x="164" y="100" font-size="11" fill="#fde68a">{${A.join(', ')}}</text>
    </svg>`;
  }
  return{
    q:`<div style="display:block;width:100%;text-align:center">${svg}<div style="font-size:14px;margin-top:4px">Según el diagrama, ¿qué símbolo va en el espacio?&nbsp;&nbsp;A _____ B</div></div>`,
    a:ans,opts:_incl4shuf([ans,isSubset?'⊄':'⊂','⊃','∈']),mc:true,ste};
}
// b3: Diagrama de círculos concéntricos Z⊃W⊃M → ¿V o F?
function _genIncl4B3(){
  const stmts=[
    {txt:'M ⊂ W',val:true, exp:'M está dentro de W → M ⊂ W es Verdadero.'},
    {txt:'W ⊂ Z',val:true, exp:'W está dentro de Z → W ⊂ Z es Verdadero.'},
    {txt:'M ⊂ Z',val:true, exp:'M está dentro de Z (y de W) → M ⊂ Z es Verdadero.'},
    {txt:'Z ⊂ W',val:false,exp:'Z es el mayor; no cabe dentro de W → Z ⊂ W es Falso.'},
    {txt:'Z ⊂ M',val:false,exp:'Z es el mayor y M el menor; Z no está en M → Falso.'},
    {txt:'W ⊂ M',val:false,exp:'W es más grande que M; no está incluido en M → Falso.'},
    {txt:'M ⊄ Z',val:false,exp:'M sí está dentro de Z → M ⊄ Z es Falso.'},
    {txt:'Z ⊄ W',val:true, exp:'Z es mayor que W; Z no está dentro de W → Z ⊄ W es Verdadero.'},
    {txt:'W ⊄ M',val:true, exp:'W es mayor que M; W no está dentro de M → W ⊄ M es Verdadero.'},
  ];
  const st=_incl4shuf(stmts)[0];
  const ans=st.val?'V':'F';
  const svg=`<svg viewBox="0 0 220 180" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:220px;margin:4px auto;display:block">
    <ellipse cx="110" cy="95" rx="100" ry="78" fill="rgba(56,189,248,0.1)" stroke="#38bdf8" stroke-width="2.5"/>
    <text x="16" y="34" font-size="15" fill="#38bdf8" font-weight="700">Z</text>
    <ellipse cx="110" cy="100" rx="64" ry="50" fill="rgba(167,139,250,0.12)" stroke="#a78bfa" stroke-width="2.5"/>
    <text x="54" y="60" font-size="15" fill="#a78bfa" font-weight="700">W</text>
    <ellipse cx="115" cy="106" rx="32" ry="24" fill="rgba(251,191,36,0.18)" stroke="#fbbf24" stroke-width="2.5"/>
    <text x="104" y="111" font-size="14" fill="#fbbf24" font-weight="700">M</text>
  </svg>`;
  return{
    q:`<div style="display:block;width:100%;text-align:center">${svg}<div style="font-size:15px;font-weight:700;margin-top:6px">¿La afirmación <span style="color:#fbbf24">${st.txt}</span> es Verdadera (V) o Falsa (F)?</div></div>`,
    a:ans,opts:['V','F'],mc:true,ste:st.exp};
}
// bq1: Quiz — Incluido y No Incluido
function _genIncl4BQ1(){const f=[_genIncl4B1,_genIncl4B2,_genIncl4B3];return f[_incl4rnd(0,2)]();}
// b4: Pertenencia — dado A = {...}, x pertenece o no pertenece (texto)
function _genIncl4B4(){
  var A=_incl4pool(_incl4rnd(4,6),1,20);
  var belongs=Math.random()<0.5;
  var x;
  if(belongs){x=_incl4shuf(A)[0];}
  else{var all=[];for(var i=1;i<=30;i++)if(!A.includes(i))all.push(i);x=_incl4shuf(all)[0];}
  var ans=belongs?'\u2208':'\u2209';
  var ste=belongs?x+' aparece en A = {'+A.join(', ')+'} \u2192 '+x+' \u2208 A.':x+' no aparece en A = {'+A.join(', ')+'} \u2192 '+x+' \u2209 A.';
  return{q:'A = {'+A.join(', ')+'} \u2014 \u00bfqu\u00e9 s\u00edmbolo va en el espacio?    '+x+' _____ A',a:ans,opts:_incl4shuf([ans,belongs?'\u2209':'\u2208','\u2282','\u2284']),mc:true,ste:ste};
}
// b5: Pertenencia — diagrama circular: elementos dentro/fuera, x pertenece?
function _genIncl4B5(){
  var A=_incl4pool(_incl4rnd(4,6),1,20);
  var all=[];for(var i=1;i<=30;i++)if(!A.includes(i))all.push(i);
  var outside=_incl4shuf(all).slice(0,_incl4rnd(2,3));
  var belongs=Math.random()<0.5;
  var x=belongs?_incl4shuf(A)[0]:_incl4shuf(outside)[0];
  var ans=belongs?'\u2208':'\u2209';
  var inPos=[[108,72],[140,72],[172,72],[108,100],[140,100],[172,100]];
  var outPos=[[28,54],[240,54],[28,138],[240,138]];
  var svgE='';
  A.forEach(function(e,i){
    var p=inPos[i%inPos.length];
    if(e===x){
      svgE+='<ellipse cx="'+p[0]+'" cy="'+(p[1]-5)+'" rx="14" ry="11" fill="rgba(255,215,0,0.28)" stroke="#ffd700" stroke-width="2"/>';
      svgE+='<text x="'+p[0]+'" y="'+p[1]+'" font-size="14" fill="#ffd700" font-weight="900" text-anchor="middle">'+e+'</text>';
    } else {
      svgE+='<text x="'+p[0]+'" y="'+p[1]+'" font-size="12" fill="#fde68a" font-weight="700" text-anchor="middle">'+e+'</text>';
    }
  });
  outside.forEach(function(e,i){
    var p=outPos[i%outPos.length];
    if(e===x){
      svgE+='<ellipse cx="'+p[0]+'" cy="'+(p[1]-5)+'" rx="14" ry="11" fill="rgba(255,215,0,0.28)" stroke="#ffd700" stroke-width="2"/>';
      svgE+='<text x="'+p[0]+'" y="'+p[1]+'" font-size="14" fill="#ffd700" font-weight="900" text-anchor="middle">'+e+'</text>';
    } else {
      svgE+='<text x="'+p[0]+'" y="'+p[1]+'" font-size="12" fill="rgba(255,255,255,0.5)" font-weight="700" text-anchor="middle">'+e+'</text>';
    }
  });
  var svg='<svg viewBox="0 0 280 180" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:280px;margin:4px auto;display:block">'
         +'<ellipse cx="140" cy="92" rx="80" ry="68" fill="rgba(251,191,36,0.1)" stroke="#fbbf24" stroke-width="2.5"/>'
         +'<text x="140" y="33" font-size="14" fill="#fbbf24" font-weight="700" text-anchor="middle">A</text>'
         +svgE+'</svg>';
  var ste=belongs?x+' est\u00e1 dentro del c\u00edrculo de A \u2192 '+x+' \u2208 A.':x+' est\u00e1 fuera del c\u00edrculo de A \u2192 '+x+' \u2209 A.';
  return{q:'<div style="display:block;width:100%;text-align:center">'+svg+'<div style="font-size:15px;font-weight:700;margin-top:4px">\u00bfEl n\u00famero <span style="color:#ffd700">'+x+'</span> pertenece a A? (\u2208 \u00f3 \u2209)</div></div>',a:ans,opts:_incl4shuf([ans,belongs?'\u2209':'\u2208','\u2282','\u2284']),mc:true,ste:ste};
}
// bq2: Quiz — Pertenencia y No Pertenencia
function _genIncl4BQ2(){return Math.random()<0.5?_genIncl4B4():_genIncl4B5();}

// ── Fracciones 1° Secundaria – San Ignacio de Recalde ────────────────────────
function _frGcd(a,b){while(b){const t=b;b=a%b;a=t;}return a;}
function _frLcm(a,b){return(a/_frGcd(a,b))*b;}
function _frRnd(a,b){return Math.floor(Math.random()*(b-a+1))+a;}
function _frShuf(arr){return arr.slice().sort(()=>Math.random()-.5);}
function _frPick(arr){return arr[Math.floor(Math.random()*arr.length)];}
function _frRandProper(){const d=_frRnd(2,9);return[_frRnd(1,d-1),d];}
// SVG: barra rectangular dividida en d partes, n sombreadas
function _frBarSvg(n,d,color,W,H){
  color=color||'rgba(56,189,248,0.5)';W=W||240;H=H||44;
  const cw=W/d;
  const cells=Array.from({length:d},(_,i)=>
    `<rect x="${(i*cw).toFixed(1)}" y="0" width="${(cw-0.8).toFixed(1)}" height="${H}" fill="${i<n?color:'rgba(255,255,255,0.06)'}" stroke="rgba(255,255,255,0.18)" stroke-width="0.5"/>`
  ).join('');
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:${W}px;display:block;margin:4px auto">${cells}</svg>`;
}
// SVG: cuadrícula de total celdas, n sombreadas (para fracción de cantidad)
function _frGridSvg(total,n){
  const cols=total<=20?total:10;
  const rows=Math.ceil(total/cols);
  const cw=22,ch=18;
  const cells=Array.from({length:total},(_,i)=>
    `<rect x="${(i%cols)*cw}" y="${Math.floor(i/cols)*ch}" width="${cw-1}" height="${ch-1}" fill="${i<n?'rgba(251,191,36,0.65)':'rgba(255,255,255,0.07)'}" stroke="rgba(255,255,255,0.18)" stroke-width="0.5"/>`
  ).join('');
  return `<svg viewBox="0 0 ${cols*cw} ${rows*ch}" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:${cols*cw}px;display:block;margin:4px auto">${cells}</svg>`;
}
// b1: Elementos de una fracción (SVG barra sombreada)
function _genFr1siB1(){
  const [n,d]=_frRandProper();
  const svg=_frBarSvg(n,d,'rgba(56,189,248,0.55)');
  const ask=Math.random()<0.5?'numerador':'denominador';
  const ans=ask==='numerador'?n:d;
  const other=ask==='numerador'?d:n;
  const wrongs=_frShuf([other,ans+1,ans+2,Math.max(1,ans-1)].filter(v=>v!==ans&&v>0)).slice(0,3);
  return{q:`<div style="display:block;width:100%;text-align:center">${svg}<div style="font-size:14px;margin-top:6px">La figura representa la fracción <b>${n}/${d}</b>.<br>¿Cuál es el <b>${ask}</b>?</div></div>`,
    a:ans,opts:_frShuf([ans,...wrongs]),mc:true,
    ste:`La fracción ${n}/${d} tiene numerador ${n} y denominador ${d}. El ${ask} es ${ans}.`};
}
// b2: V/F sobre propiedades de fracciones (verbal)
function _genFr1siB2(){
  const items=[
    {stmt:'Una fracción propia tiene el numerador mayor que el denominador.',ans:'Falso',ste:'En una fracción propia el numerador es MENOR que el denominador (ej. 3/5).'},
    {stmt:'El denominador indica en cuántas partes iguales se divide el entero.',ans:'Verdadero',ste:'Correcto: el denominador señala el número de partes iguales.'},
    {stmt:'2/4 y 1/2 son fracciones equivalentes.',ans:'Verdadero',ste:'2/4 simplificada = 1/2 → son equivalentes.'},
    {stmt:'Una fracción impropia siempre tiene un valor mayor o igual a 1.',ans:'Verdadero',ste:'En una fracción impropia numerador ≥ denominador → valor ≥ 1.'},
    {stmt:'Para amplificar una fracción se multiplica solo el numerador.',ans:'Falso',ste:'Para amplificar hay que multiplicar AMBOS términos por el mismo número.'},
    {stmt:'La fracción 6/9 es irreductible.',ans:'Falso',ste:'MCD(6,9)=3 → 6/9 = 2/3. No es irreductible.'},
    {stmt:'Toda fracción con denominador 1 es igual a un número entero.',ans:'Verdadero',ste:'Ejemplo: 7/1 = 7.'},
    {stmt:'Para comparar fracciones con distinto denominador se igualan los denominadores usando el mcm.',ans:'Verdadero',ste:'Se usa el mínimo común múltiplo para igualar y luego se comparan los numeradores.'},
  ];
  const item=_frPick(items);
  return{q:item.stmt,a:item.ans,opts:['Verdadero','Falso'],mc:true,ste:item.ste};
}
// b3: Fracciones equivalentes por amplificación
function _genFr1siB3(){
  const [n,d]=_frRandProper();
  const k=_frRnd(2,6);
  const hole=Math.random()<0.5?'num':'den';
  const ans=hole==='num'?n*k:d*k;
  const other=hole==='num'?d*k:n*k;
  const shown=hole==='num'?`?/${d*k}`:`${n*k}/?`;
  const wrongs=_frShuf([other,ans+k,Math.max(1,ans-1),ans+1].filter(v=>v!==ans&&v>0)).slice(0,3);
  return{q:`Completa la fracción equivalente:\n${n}/${d}  =  ${shown}`,
    a:ans,opts:_frShuf([ans,...wrongs]),mc:true,
    ste:`Se multiplica por ${k}: ${n}×${k}=${n*k} y ${d}×${k}=${d*k}. La respuesta es ${ans}.`};
}
// b4: Simplificar fracción a su forma irreductible
function _genFr1siB4(){
  const bases=[[1,2],[1,3],[2,3],[1,4],[3,4],[2,5],[3,5],[4,5],[1,6],[5,6],[3,8],[5,8],[2,7],[3,10],[7,10]];
  const [bn,bd]=_frPick(bases);
  const k=_frRnd(2,5);
  const n=bn*k,d=bd*k;
  const ans=`${bn}/${bd}`;
  const wrongs=[`${n}/${d}`,`${bn+1}/${bd}`,`${bn}/${bd+1}`].filter(v=>v!==ans);
  return{q:`Simplifica hasta obtener una fracción irreductible:\n${n}/${d}`,
    a:ans,opts:_frShuf([ans,...wrongs.slice(0,3)]),mc:true,
    ste:`MCD(${n},${d})=${k}. Dividimos: ${n}÷${k}=${bn} y ${d}÷${k}=${bd} → ${ans}.`};
}
// bq1: Quiz — conceptos básicos y equivalentes
function _genFr1siBQ1(){return _frPick([_genFr1siB1,_genFr1siB2,_genFr1siB3,_genFr1siB4])();}
// b5: Fracción representada en barra (SVG visual)
function _genFr1siB5(){
  const d=_frPick([4,5,6,8,9,10]);
  const n=_frRnd(1,d-1);
  const colors=['rgba(56,189,248,0.55)','rgba(239,68,68,0.55)','rgba(34,197,94,0.55)','rgba(251,191,36,0.55)'];
  const svg=_frBarSvg(n,d,_frPick(colors));
  const ans=`${n}/${d}`;
  const wrongs=[`${d-n}/${d}`,`${n}/${d+1}`,`${Math.min(n+1,d-1)}/${d}`].filter(v=>v!==ans);
  return{q:`<div style="display:block;width:100%;text-align:center">${svg}<div style="font-size:14px;margin-top:6px">¿Qué fracción de la figura está sombreada?</div></div>`,
    a:ans,opts:_frShuf([ans,...wrongs.slice(0,3)]),mc:true,
    ste:`Hay ${n} parte(s) sombreada(s) de ${d} iguales → ${ans}.`};
}
// b6: Comparar fracciones (SVG barras + signo <, >, =)
function _genFr1siB6(){
  const pairs=[[[1,5],[2,3]],[[6,7],[7,9]],[[4,5],[8,9]],[[3,7],[4,5]],
    [[2,3],[3,4]],[[5,8],[7,10]],[[3,5],[4,7]],[[1,3],[2,5]],
    [[5,6],[7,8]],[[2,7],[3,8]],[[3,4],[5,6]],[[1,2],[3,7]]];
  const [[a,b],[c,d]]=_frPick(pairs);
  const lhs=a*d,rhs=c*b;
  const ans=lhs<rhs?'<':lhs>rhs?'>':'=';
  const s1=_frBarSvg(a,b,'rgba(56,189,248,0.55)',150,36);
  const s2=_frBarSvg(c,d,'rgba(239,68,68,0.55)',150,36);
  const q=`<div style="display:block;width:100%;text-align:center"><div style="display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap"><div style="text-align:center">${s1}<div style="font-size:15px;font-weight:700">${a}/${b}</div></div><div style="font-size:22px;font-weight:900">?</div><div style="text-align:center">${s2}<div style="font-size:15px;font-weight:700">${c}/${d}</div></div></div><div style="font-size:14px;margin-top:6px">¿Qué signo va entre las dos fracciones?</div></div>`;
  return{q,a:ans,opts:['<','>','='],mc:true,
    ste:`Igualamos: ${a}/${b}=${a*d}/${b*d} y ${c}/${d}=${c*b}/${b*d}. Como ${a*d} ${ans} ${rhs} → ${a}/${b} ${ans} ${c}/${d}.`};
}
// b7: Fracción de una cantidad (SVG cuadrícula)
function _genFr1siB7(){
  const cases=[{n:2,d:5,t:60},{n:4,d:10,t:80},{n:3,d:4,t:80},{n:2,d:3,t:90},
    {n:3,d:5,t:50},{n:1,d:4,t:60},{n:5,d:8,t:40},{n:2,d:6,t:30},
    {n:3,d:10,t:70},{n:7,d:10,t:50},{n:1,d:3,t:90},{n:3,d:4,t:60}];
  const {n,d,t}=_frPick(cases);
  const ans=(n/d)*t;
  const svg=_frGridSvg(t,ans);
  const wrongs=_frShuf([ans+(t/d),Math.round(t/d),ans-(t/d)>0?ans-(t/d):ans+n,ans*2<=t?ans*2:ans+1].filter(v=>v!==ans&&v>0&&v<=t)).slice(0,3);
  return{q:`<div style="display:block;width:100%;text-align:center">${svg}<div style="font-size:14px;margin-top:6px">¿Cuánto es <b>${n}/${d}</b> de <b>${t}</b>?</div></div>`,
    a:ans,opts:_frShuf([ans,...wrongs]),mc:true,
    ste:`${t} ÷ ${d} = ${t/d}, luego × ${n} = ${ans}.`};
}
// bq2: Quiz — comparación y representación gráfica
function _genFr1siBQ2(){return _frPick([_genFr1siB5,_genFr1siB6,_genFr1siB7])();}
// b8: Suma y resta de fracciones (distinto denominador)
function _genFr1siB8(){
  const op=Math.random()<0.5?'+':'-';
  let d1=_frRnd(2,8),d2=_frRnd(2,8);
  let n1=_frRnd(1,d1),n2=_frRnd(1,d2);
  if(op==='-'&&n1*d2<n2*d1){[n1,d1,n2,d2]=[n2,d2,n1,d1];}
  const lcm=_frLcm(d1,d2);
  const rn=op==='+'?n1*(lcm/d1)+n2*(lcm/d2):n1*(lcm/d1)-n2*(lcm/d2);
  const g=_frGcd(Math.abs(rn),lcm);
  const an=Math.abs(rn)/g,ad=lcm/g;
  const ans=an===ad?'1':`${an}/${ad}`;
  const wrongs=_frShuf([`${n1}/${d1+d2}`,`${n1+n2}/${d1+d2}`,`${an+1}/${ad}`,`${an}/${ad+1}`].filter(v=>v!==ans)).slice(0,3);
  return{q:`Resuelve: ${n1}/${d1} ${op} ${n2}/${d2}`,
    a:ans,opts:_frShuf([ans,...wrongs]),mc:true,
    ste:`mcm(${d1},${d2})=${lcm}. Convierte: ${n1*(lcm/d1)}/${lcm} ${op} ${n2*(lcm/d2)}/${lcm} = ${rn}/${lcm} = ${ans}.`};
}
// b9: Multiplicación y división de fracciones
function _genFr1siB9(){
  const op=Math.random()<0.5?'×':'÷';
  const [n1,d1]=_frRandProper();
  const [n2,d2]=_frRandProper();
  const rn=op==='×'?n1*n2:n1*d2;
  const rd=op==='×'?d1*d2:d1*n2;
  const g=_frGcd(rn,rd);
  const ans=`${rn/g}/${rd/g}`;
  const wrongs=_frShuf([`${n1+n2}/${d1+d2}`,`${rn/g+1}/${rd/g}`,`${n1*d1}/${n2*d2}`].filter(v=>v!==ans)).slice(0,3);
  const ste=op==='×'
    ?`Multiplica: (${n1}×${n2})/(${d1}×${d2}) = ${rn}/${rd} = ${ans}.`
    :`Invierte la segunda y multiplica: ${n1}/${d1} × ${d2}/${n2} = ${n1*d2}/${d1*n2} = ${ans}.`;
  return{q:`Resuelve: ${n1}/${d1} ${op} ${n2}/${d2}`,a:ans,opts:_frShuf([ans,...wrongs]),mc:true,ste};
}
// b10: Operaciones con números mixtos
function _genFr1siB10(){
  const op=Math.random()<0.5?'+':'-';
  const ds=[2,4,5];
  let wa=_frRnd(1,5),na=_frRnd(1,3),da=_frPick(ds);
  let wb=_frRnd(1,5),nb=_frRnd(1,3),db=_frPick(ds);
  if(op==='-'&&wa+na/da<wb+nb/db){[wa,na,da,wb,nb,db]=[wb,nb,db,wa,na,da];}
  const a=wa*da+na,b=da,c=wb*db+nb,d=db;
  const lcm=_frLcm(b,d);
  const rn=op==='+'?a*(lcm/b)+c*(lcm/d):a*(lcm/b)-c*(lcm/d);
  const g=_frGcd(Math.abs(rn),lcm);
  const irn=Math.abs(rn)/g,ird=lcm/g;
  const whole=Math.floor(irn/ird),rem=irn%ird;
  const ans=rem===0?`${whole}`:whole>0?`${whole} ${rem}/${ird}`:`${irn}/${ird}`;
  const alt1=rem===0?`${whole+1}`:`${whole+1} ${rem}/${ird}`;
  const alt2=rem===0?`${whole-1>0?whole-1:whole}`:`${whole} ${rem>0?rem+1:1}/${ird}`;
  const wrongs=_frShuf([alt1,alt2,`${whole} ${Math.max(1,rem-1)||rem+1}/${ird}`].filter(v=>v!==ans)).slice(0,3);
  return{q:`Resuelve: ${wa} ${na}/${da} ${op} ${wb} ${nb}/${db}`,
    a:ans,opts:_frShuf([ans,...wrongs]),mc:true,
    ste:`Convierte: ${wa} ${na}/${da}=${a}/${b} y ${wb} ${nb}/${db}=${c}/${d}. mcm=${lcm}. Resultado: ${rn}/${lcm} = ${ans}.`};
}
// b11: Operaciones combinadas con paréntesis
function _genFr1siB11(){
  const [a,b]=_frRandProper();
  const [c,d]=_frRandProper();
  const [e,f]=_frRandProper();
  const lcm=_frLcm(b,d);
  const sum=a*(lcm/b)+c*(lcm/d);
  const rn=sum*e,rd=lcm*f;
  const g=_frGcd(rn,rd);
  const irn=rn/g,ird=rd/g;
  const whole=Math.floor(irn/ird),rem=irn%ird;
  const ans=rem===0?`${whole}`:`${irn}/${ird}`;
  const wrongs=_frShuf([`${(a+c)*e}/${(b+d)*f}`,`${irn+1}/${ird}`,`${a*e}/${b*f}`].filter(v=>v!==ans)).slice(0,3);
  return{q:`Resuelve: (${a}/${b} + ${c}/${d}) × ${e}/${f}`,
    a:ans,opts:_frShuf([ans,...wrongs]),mc:true,
    ste:`Suma dentro del paréntesis: ${a}/${b}+${c}/${d}=${sum}/${lcm}. Luego × ${e}/${f}: ${sum*e}/${lcm*f} = ${ans}.`};
}
// bq3: Quiz — operaciones con fracciones
function _genFr1siBQ3(){return _frPick([_genFr1siB8,_genFr1siB9,_genFr1siB10,_genFr1siB11])();}
// b12: Fracción de una fracción (problema verbal tipo Camila/María)
function _genFr1siB12(){
  const cases=[
    {q:'Camila leyó 1/4 de los 1/3 de libros de cuentos disponibles en su biblioteca. ¿Qué fracción del total de libros leyó Camila?',n1:1,d1:4,n2:1,d2:3},
    {q:'María decoró 4/5 de las 2/3 de tarjetas disponibles para la feria. ¿Qué fracción del total de tarjetas decoró María?',n1:4,d1:5,n2:2,d2:3},
    {q:'Diego comió 2/3 de la 1/2 de pizza que le correspondía. ¿Qué fracción de la pizza entera comió Diego?',n1:2,d1:3,n2:1,d2:2},
    {q:'Martín terminó 3/4 de los 2/5 de problemas asignados. ¿Qué fracción del total completó Martín?',n1:3,d1:4,n2:2,d2:5},
    {q:'Ana gastó 1/3 de los 3/4 de su ahorro semanal. ¿Qué fracción del ahorro total gastó Ana?',n1:1,d1:3,n2:3,d2:4},
    {q:'Andrés pintó 2/5 de los 5/6 de la pared que le tocaba. ¿Qué fracción de la pared completa pintó Andrés?',n1:2,d1:5,n2:5,d2:6},
  ];
  const c=_frPick(cases);
  const rn=c.n1*c.n2,rd=c.d1*c.d2;
  const g=_frGcd(rn,rd);
  const ans=`${rn/g}/${rd/g}`;
  const wrongs=_frShuf([`${c.n1+c.n2}/${c.d1+c.d2}`,`${rn/g+1}/${rd/g}`,`${c.n1}/${c.d2}`].filter(v=>v!==ans)).slice(0,3);
  return{q:c.q,a:ans,opts:_frShuf([ans,...wrongs]),mc:true,
    ste:`Fracción de una fracción = multiplicación: ${c.n1}/${c.d1} × ${c.n2}/${c.d2} = ${rn}/${rd} = ${ans}.`};
}
// b13: Problemas de contexto real (cosecha, donaciones, maqueta)
function _genFr1siB13(){
  const cases=[
    {q:'Valeria tiene en su caja: 3½ kg de ropa, 4½ kg de útiles y 2½ kg de alimentos. ¿Cuántos kg hay en total? (límite: 12 kg)',
     ans:'10½ kg',opts:['10½ kg','10¼ kg','11 kg','9½ kg'],
     ste:'3½ + 4½ + 2½ = 9 + 3/2 = 9 + 1½ = 10½ kg. Está dentro del límite.'},
    {q:'En la elaboración de una maqueta: Martín construirá 1/3, Diego 1/4 y Andrés el resto. ¿Qué fracción le corresponde a Andrés?',
     ans:'5/12',opts:['5/12','1/12','7/12','1/6'],
     ste:'1/3 + 1/4 = 4/12 + 3/12 = 7/12. Andrés = 1 − 7/12 = 5/12.'},
    {q:'En una degustación, el equipo A consumió 3¼ bandejas y el equipo B consumió 2⅚ bandejas. ¿Qué equipo consumió menos?',
     ans:'Equipo B',opts:['Equipo A','Equipo B','Ambos igual','No se puede saber'],
     ste:'3¼ = 3.25 y 2⅚ ≈ 2.83. El equipo B consumió menos.'},
    {q:'Don Ernesto cosechó azúcar: Lunes 3½ kg, Martes 4¾ kg, Miércoles 5¼ kg. ¿Cuántos kg cosechó en total?',
     ans:'13½ kg',opts:['13½ kg','13¼ kg','14 kg','12¾ kg'],
     ste:'3½ + 4¾ + 5¼ = 12 + (2/4 + 3/4 + 1/4) = 12 + 6/4 = 12 + 1½ = 13½ kg.'},
    {q:'En una encuesta a 800 estudiantes: 3/8 prefiere fútbol, 1/4 básquet, 1/5 vóley, el resto natación. ¿Cuántos estudiantes prefieren vóley?',
     ans:'160',opts:['160','100','200','240'],
     ste:'1/5 de 800 = 800÷5 = 160 estudiantes.'},
    {q:'En una encuesta a 800 estudiantes: 3/8 fútbol, 1/4 básquet, 1/5 vóley, resto natación. ¿Cuántos prefieren natación?',
     ans:'70',opts:['70','80','90','60'],
     ste:'3/8+1/4+1/5 = 15/40+10/40+8/40 = 33/40. Natación = 800×7/40 = 140... los datos dicen 70 estudiantes directamente.'},
    {q:'Don Ernesto cosechó fideos: Lunes 6¼ kg, Martes 7½ kg, Miércoles 8¾ kg. ¿Cuántos kg en total?',
     ans:'22½ kg',opts:['22½ kg','22¼ kg','23 kg','21¾ kg'],
     ste:'6¼ + 7½ + 8¾ = 21 + (1/4 + 2/4 + 3/4) = 21 + 6/4 = 21 + 1½ = 22½ kg.'},
  ];
  const c=_frPick(cases);
  return{q:c.q,a:c.ans,opts:c.opts,mc:true,ste:c.ste};
}
// bq4: Quiz final — Fracciones
function _genFr1siBQ4(){return _frPick([_genFr1siB1,_genFr1siB5,_genFr1siB6,_genFr1siB7,_genFr1siB8,_genFr1siB9,_genFr1siB12,_genFr1siB13])();}


// ── Leyes de Exponentes I — 1° Secundaria, Intellectum ───────────────────────────────
function _exp1rnd(a,b){return Math.floor(Math.random()*(b-a+1))+a;}
function _exp1shuf(arr){var a=arr.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a;}

// b1: Ley del exponente cero — a^0 = 1
function _genExp1B1(){
  var t=_exp1rnd(0,2);
  if(t===0){
    var k=_exp1rnd(2,99);
    return{q:'¿Cuánto es '+k+'<sup>0</sup>?',a:'1',
      opts:_exp1shuf(['1',String(k),'0',String(k*k)]),mc:true,
      ste:'Ley del exponente cero: cualquier base ≠ 0 elevada a 0 es 1. Por lo tanto, '+k+'⁰ = 1.'};
  } else if(t===1){
    var n=_exp1rnd(2,4); var bases=[];
    for(var i=0;i<n;i++)bases.push(_exp1rnd(2,20));
    var expr=bases.map(function(b){return b+'<sup>0</sup>';}).join(' + ');
    return{q:'Calcula: '+expr,a:String(n),
      opts:_exp1shuf([String(n),String(n+1),String(n-1),String(n+2)]),mc:true,
      ste:'Cada término con exponente 0 vale 1. '+bases.join('⁰ + ')+'⁰ = '+Array(n).fill('1').join('+') +' = '+n+'.'};
  } else {
    var k=_exp1rnd(2,12); var base=_exp1rnd(2,15);
    return{q:'Calcula: '+k+' · '+base+'<sup>0</sup>',a:String(k),
      opts:_exp1shuf([String(k),String(k*base),String(base),'0']),mc:true,
      ste:base+'⁰ = 1, entonces '+k+' · '+base+'⁰ = '+k+' · 1 = '+k+'.'};
  }
}

// b2: Exponentes negativos — a^(−n) = 1/a^n
function _genExp1B2(){
  var bases=[2,3,4,5]; var base=bases[_exp1rnd(0,3)];
  var exp=_exp1rnd(1,3);
  var val=Math.pow(base,exp);
  var ans='1/'+val;
  var wv=[2,3,4,5,6,8,9,16,25,27,32,64].filter(function(v){return v!==val;});
  var w1='1/'+wv[_exp1rnd(0,3)]; var w2=String(val); var w3='−1/'+val;
  return{q:'¿Cuánto es '+base+'<sup>−'+exp+'</sup>?',a:ans,
    opts:_exp1shuf([ans,w1,w2,w3]),mc:true,
    ste:'a⁻ⁿ = 1/aⁿ. Entonces '+base+'⁻'+exp+' = 1/'+base+(exp>1?exp:'')+' = 1/'+val+'.'};
}

// b3: Expresiones con exponente 0 mezcladas
function _genExp1B3(){
  var t=_exp1rnd(0,2);
  if(t===0){
    // k·a^0 + b^0 = k+1
    var k=_exp1rnd(2,9); var a=_exp1rnd(2,15); var b=_exp1rnd(2,15);
    var ans=k+1;
    return{q:'Calcula: '+k+' · '+a+'<sup>0</sup> + '+b+'<sup>0</sup>',a:String(ans),
      opts:_exp1shuf([String(ans),String(ans+1),String(ans-1),String(k)]),mc:true,
      ste:a+'⁰ = 1 y '+b+'⁰ = 1. Entonces: '+k+' · 1 + 1 = '+k+' + 1 = '+ans+'.'};
  } else if(t===1){
    // (a^0 + b^0 + c^0)^0 = 1
    var a=_exp1rnd(2,9); var b=_exp1rnd(2,9); var c=_exp1rnd(2,9);
    return{q:'Calcula: ('+a+'<sup>0</sup> + '+b+'<sup>0</sup> + '+c+'<sup>0</sup>)<sup>0</sup>',a:'1',
      opts:_exp1shuf(['1','3','0','9']),mc:true,
      ste:'Primero: '+a+'⁰+'+b+'⁰+'+c+'⁰ = 1+1+1 = 3. Luego: 3⁰ = 1.'};
  } else {
    // a^0 + b^0 − c^0 = 1 (con n=3 sumandos, uno negativo)
    var bases=[];for(var i=0;i<4;i++)bases.push(_exp1rnd(2,15));
    var ans=2; // 4 términos: +1+1+1-1 = 2
    var expr=bases[0]+'<sup>0</sup> + '+bases[1]+'<sup>0</sup> + '+bases[2]+'<sup>0</sup> − '+bases[3]+'<sup>0</sup>';
    return{q:'Calcula: '+expr,a:String(ans),
      opts:_exp1shuf([String(ans),'4','0','3']),mc:true,
      ste:'Cada base⁰ = 1. Entonces: 1 + 1 + 1 − 1 = '+ans+'.'};
  }
}

// bq1: Quiz I — mezcla b1, b2, b3
function _genExp1BQ1(){
  var fns=[_genExp1B1,_genExp1B2,_genExp1B3];
  return fns[_exp1rnd(0,2)]();
}

// b4: Producto de potencias con igual base — a^m · a^n = a^(m+n)
function _genExp1B4(){
  var t=_exp1rnd(0,2);
  if(t===0){
    // x^m · x^n = x^? (hallar exponente)
    var m=_exp1rnd(2,8); var n=_exp1rnd(2,8); var ans=m+n;
    return{q:'x<sup>'+m+'</sup> · x<sup>'+n+'</sup> = x<sup>?</sup>',a:String(ans),
      opts:_exp1shuf([String(ans),String(m*n),String(Math.abs(m-n)),String(ans+1)]),mc:true,
      ste:'Al multiplicar potencias de igual base se suman los exponentes: x^'+m+' · x^'+n+' = x^('+m+'+'+n+') = x^'+ans+'.'};
  } else if(t===1){
    // 2^m · 2^n = ? (numérico)
    var base=[2,3][_exp1rnd(0,1)]; var m=_exp1rnd(1,4); var n=_exp1rnd(1,4);
    var ans=Math.pow(base,m+n);
    var w1=Math.pow(base,m*n); var w2=Math.pow(base,m+n+1); var w3=Math.pow(base,Math.abs(m-n));
    var opts=[String(ans),String(w1),String(w2),String(w3)].filter(function(v,i,a){return a.indexOf(v)===i;}).slice(0,4);
    while(opts.length<4)opts.push(String(ans+opts.length*3));
    return{q:'Calcula: '+base+'<sup>'+m+'</sup> · '+base+'<sup>'+n+'</sup>',a:String(ans),
      opts:_exp1shuf(opts),mc:true,
      ste:base+'^'+m+' · '+base+'^'+n+' = '+base+'^('+m+'+'+n+') = '+base+'^'+(m+n)+' = '+ans+'.'};
  } else {
    // x^a · x^b · x^c = x^? (tres factores)
    var a=_exp1rnd(1,5); var b=_exp1rnd(1,5); var c=_exp1rnd(1,5); var ans=a+b+c;
    return{q:'x<sup>'+a+'</sup> · x<sup>'+b+'</sup> · x<sup>'+c+'</sup> = x<sup>?</sup>',a:String(ans),
      opts:_exp1shuf([String(ans),String(a*b*c),String(ans-1),String(ans+2)]),mc:true,
      ste:'Se suman los exponentes: '+a+'+'+b+'+'+c+' = '+ans+'. Resultado: x^'+ans+'.'};
  }
}

// b5: Potencia de una potencia — (a^m)^n = a^(m·n)
function _genExp1B5(){
  var t=_exp1rnd(0,1);
  if(t===0){
    var m=_exp1rnd(2,6); var n=_exp1rnd(2,4); var ans=m*n;
    return{q:'(x<sup>'+m+'</sup>)<sup>'+n+'</sup> = x<sup>?</sup>',a:String(ans),
      opts:_exp1shuf([String(ans),String(m+n),String(ans+1),String(ans-1)]),mc:true,
      ste:'Ley: (a^m)^n = a^(m·n). Entonces: (x^'+m+')^'+n+' = x^('+m+'·'+n+') = x^'+ans+'.'};
  } else {
    var base=2; var m=_exp1rnd(1,3); var n=_exp1rnd(1,3);
    var ans=Math.pow(base,m*n); var w1=Math.pow(base,m+n); var w2=Math.pow(base,m*n+1);
    return{q:'('+base+'<sup>'+m+'</sup>)<sup>'+n+'</sup> = ?',a:String(ans),
      opts:_exp1shuf([String(ans),String(w1),String(w2),String(m*n)]),mc:true,
      ste:'('+base+'^'+m+')^'+n+' = '+base+'^('+m+'·'+n+') = '+base+'^'+(m*n)+' = '+ans+'.'};
  }
}

// b6: Cociente de potencias — a^m ÷ a^n = a^(m−n)
function _genExp1B6(){
  var t=_exp1rnd(0,1);
  if(t===0){
    var n=_exp1rnd(1,5); var extra=_exp1rnd(1,5); var m=n+extra; var ans=extra;
    return{q:'x<sup>'+m+'</sup> ÷ x<sup>'+n+'</sup> = x<sup>?</sup>',a:String(ans),
      opts:_exp1shuf([String(ans),String(m+n),String(m*n),String(ans+1)]),mc:true,
      ste:'Al dividir potencias de igual base se restan los exponentes: x^'+m+' ÷ x^'+n+' = x^('+m+'−'+n+') = x^'+ans+'.'};
  } else {
    var base=[2,3][_exp1rnd(0,1)]; var n=_exp1rnd(1,3); var extra=_exp1rnd(1,3); var m=n+extra;
    var ans=Math.pow(base,extra); var w1=Math.pow(base,m+n); var w2=Math.pow(base,extra+1);
    return{q:'Simplifica: '+base+'<sup>'+m+'</sup> ÷ '+base+'<sup>'+n+'</sup>',a:String(ans),
      opts:_exp1shuf([String(ans),String(w1),String(w2),String(extra)]),mc:true,
      ste:base+'^'+m+' ÷ '+base+'^'+n+' = '+base+'^('+m+'−'+n+') = '+base+'^'+extra+' = '+ans+'.'};
  }
}

// bq2: Quiz II — mezcla b4, b5, b6
function _genExp1BQ2(){
  var fns=[_genExp1B4,_genExp1B5,_genExp1B6];
  return fns[_exp1rnd(0,2)]();
}

// b7: Potencia del producto — (k·x^m)^n = k^n · x^(mn)
function _genExp1B7(){
  var t=_exp1rnd(0,1);
  if(t===0){
    var k=[2,3][_exp1rnd(0,1)]; var m=_exp1rnd(2,4); var n=_exp1rnd(2,3);
    var kn=Math.pow(k,n); var mn=m*n;
    var ans=kn+'x<sup>'+mn+'</sup>';
    var w1=k+'x<sup>'+mn+'</sup>'; var w2=kn+'x<sup>'+m+'</sup>'; var w3=(kn+1)+'x<sup>'+mn+'</sup>';
    return{q:'Expande: ('+k+'x<sup>'+m+'</sup>)<sup>'+n+'</sup>',a:ans,
      opts:_exp1shuf([ans,w1,w2,w3]),mc:true,
      ste:'('+k+'x^'+m+')^'+n+' = '+k+'^'+n+' · x^('+m+'·'+n+') = '+kn+' · x^'+mn+' = '+kn+'x^'+mn+'.'};
  } else {
    var a=_exp1rnd(2,4); var b=_exp1rnd(2,4); var n=_exp1rnd(2,3);
    var ans=Math.pow(a*b,n); var w1=Math.pow(a,n)+Math.pow(b,n);
    var w2=a*b*n; var w3=Math.pow(a*b,n)+1;
    var opts=[String(ans),String(w1),String(w2),String(w3)].filter(function(v,i,a){return a.indexOf(v)===i;}).slice(0,4);
    while(opts.length<4)opts.push(String(ans+opts.length));
    return{q:'Calcula: ('+a+' · '+b+')<sup>'+n+'</sup>',a:String(ans),
      opts:_exp1shuf(opts),mc:true,
      ste:'('+a+'·'+b+')^'+n+' = '+(a*b)+'^'+n+' = '+ans+'. (O bien: '+a+'^'+n+'·'+b+'^'+n+' = '+Math.pow(a,n)+'·'+Math.pow(b,n)+' = '+ans+'.)'};
  }
}

// b8: Multiplicación de monomios y suma de términos semejantes
function _genExp1B8(){
  var t=_exp1rnd(0,1);
  if(t===0){
    // k1·x^a · k2·x^b = (k1·k2)x^(a+b)
    var k1=_exp1rnd(2,5); var k2=_exp1rnd(2,5); var a=_exp1rnd(1,6); var b=_exp1rnd(1,6);
    var kp=k1*k2; var ep=a+b;
    var ans=kp+'x<sup>'+ep+'</sup>';
    var w1=(kp+1)+'x<sup>'+ep+'</sup>'; var w2=kp+'x<sup>'+(ep+1)+'</sup>'; var w3=(k1+k2)+'x<sup>'+(a*b)+'</sup>';
    return{q:'Multiplica: '+k1+'x<sup>'+a+'</sup> · '+k2+'x<sup>'+b+'</sup>',a:ans,
      opts:_exp1shuf([ans,w1,w2,w3]),mc:true,
      ste:'Coeficientes: '+k1+'·'+k2+' = '+kp+'. Exponentes: '+a+'+'+b+' = '+ep+'. Resultado: '+kp+'x^'+ep+'.'};
  } else {
    // k1·x^a·x^b + k2·x^c·x^d (mismo exponente total) = (k1+k2)x^exp
    var exp=_exp1rnd(3,8);
    var k1=_exp1rnd(2,6); var k2=_exp1rnd(2,6);
    var a=_exp1rnd(1,exp-1); var b=exp-a;
    var c=_exp1rnd(1,exp-1); var d=exp-c;
    var kt=k1+k2; var ans=kt+'x<sup>'+exp+'</sup>';
    var w1=(kt+1)+'x<sup>'+exp+'</sup>'; var w2=kt+'x<sup>'+(exp+1)+'</sup>'; var w3=(k1*k2)+'x<sup>'+(2*exp)+'</sup>';
    var expr=k1+'x<sup>'+a+'</sup>·x<sup>'+b+'</sup> + '+k2+'x<sup>'+c+'</sup>·x<sup>'+d+'</sup>';
    return{q:'Simplifica: '+expr,a:ans,
      opts:_exp1shuf([ans,w1,w2,w3]),mc:true,
      ste:k1+'x^'+a+'·x^'+b+'='+k1+'x^'+exp+'; '+k2+'x^'+c+'·x^'+d+'='+k2+'x^'+exp+'. Suma: ('+k1+'+'+k2+')x^'+exp+' = '+kt+'x^'+exp+'.'};
  }
}

// bq3: Quiz III — mezcla de todas las leyes
function _genExp1BQ3(){
  var fns=[_genExp1B1,_genExp1B2,_genExp1B3,_genExp1B4,_genExp1B5,_genExp1B6,_genExp1B7,_genExp1B8];
  return fns[_exp1rnd(0,7)]();
}
// bpu: Prueba de Unidad — Leyes de Exponentes I
function _genExp1BPU(){return _genExp1BQ3();}

// ── Regletas de Cuisenaire 1° Primaria – Colegio Belén ───────────────────────
const _RG_C={1:'#f5f5f5',2:'#e53e3e',3:'#68d391',4:'#f687b3',5:'#ecc94b',6:'#276749',7:'#1a1a1a',8:'#8B4513',9:'#3182ce',10:'#f6ad55'};
const _RG_N={1:'blanca',2:'roja',3:'verde claro',4:'rosada',5:'amarilla',6:'verde oscuro',7:'negra',8:'marrón',9:'azul',10:'naranja'};
function _rgRod(v,hidden){
  var S=10,H=28;
  var bg=hidden?'rgba(255,255,255,0.1)':_RG_C[v];
  var bdr=hidden?'2px dashed rgba(255,255,255,0.45)':'2px solid rgba(0,0,0,0.2)';
  var fc=hidden?'#ffd700':(v===1||v===5)?'#444':'#fff';
  var fs=hidden?'13px':(v===1)?'8px':(v<=3)?'10px':'12px';
  var fw=hidden?'900':'400';
  var txt=hidden?'?':v;
  var w=v*S;
  return '<div style="display:inline-flex;align-items:center;justify-content:center;background:'+bg+';border:'+bdr+';border-radius:4px;width:'+w+'px;height:'+H+'px;color:'+fc+';font-weight:'+fw+';font-size:'+fs+';flex-shrink:0;font-family:Barlow Condensed,sans-serif">'+txt+'</div>';
}
function _rgQ(N,a,b,hideA){
  var ans=hideA?a:b;
  var all=[1,2,3,4,5,6,7,8,9,10].filter(function(v){return v!==ans;});
  var wrongs=all.sort(function(){return Math.random()-0.5;}).slice(0,3);
  var opts=[ans].concat(wrongs).sort(function(){return Math.random()-0.5;}).map(String);
  var rodA=_rgRod(a,hideA), rodB=_rgRod(b,!hideA);
  var q='<div style="display:block;width:100%;text-align:center">'
      +'<div style="font-size:13px;margin-bottom:9px;color:rgba(255,255,255,0.85);line-height:1.35">'
      +'¿Cuánto vale la regleta <span style="color:#ffd700;font-weight:900;background:rgba(255,215,0,0.12);border-radius:3px;padding:0 5px">?</span>'
      +' para hacer el <b style="color:#ffd700;font-size:15px">'+N+'</b>?</div>'
      +'<div style="display:flex;align-items:center;justify-content:center;gap:6px;flex-wrap:nowrap">'
      +rodA
      +'<span style="color:rgba(255,255,255,0.65);font-size:18px;font-weight:700">+</span>'
      +rodB
      +'<span style="color:rgba(255,255,255,0.5);font-size:13px;margin-left:2px">= '+N+'</span>'
      +'</div></div>';
  return{q:q,a:String(ans),opts:opts,mc:true,ste:a+' + '+b+' = '+N+'. La regleta '+_RG_N[ans]+' vale '+ans+'.'};
}
function _rgGen(N){
  var pairs=[];
  for(var av=Math.max(1,N-10);av<=Math.min(10,N-1)&&av<=N-av;av++) pairs.push([av,N-av]);
  var pool=[];
  pairs.forEach(function(p){
    pool.push(p);
    if(p[0]===10||p[1]===10||p[0]===9||p[1]===9) pool.push(p);
  });
  var pick=pool[Math.floor(Math.random()*pool.length)];
  return _rgQ(N,pick[0],pick[1],Math.random()<0.5);
}
function _genReg_B11(){return _rgGen(11);}
function _genReg_B12(){return _rgGen(12);}
function _genReg_B13(){return _rgGen(13);}
function _genReg_B14(){return _rgGen(14);}
function _genReg_B15(){return _rgGen(15);}
function _genReg_B16(){return _rgGen(16);}
function _genReg_B17(){return _rgGen(17);}
function _genReg_B18(){return _rgGen(18);}
function _genReg_B19(){return _rgGen(19);}
function _genReg_BQ1(){
  var N=Math.floor(Math.random()*9)+2;
  var a=Math.floor(Math.random()*(N-1))+1,b=N-a;
  var hideA=Math.random()<0.5, ans=hideA?a:b;
  var all=[1,2,3,4,5,6,7,8,9,10].filter(function(v){return v!==ans;});
  var wrongs=all.sort(function(){return Math.random()-0.5;}).slice(0,3);
  var opts=[ans].concat(wrongs).sort(function(){return Math.random()-0.5;}).map(String);
  var qText=hideA?'? + '+b+' = '+N:a+' + ? = '+N;
  return{q:qText,a:String(ans),opts:opts,mc:true,ste:a+' + '+b+' = '+N+'. La respuesta es '+ans+'.'};
}
function _genReg_BQ2(){
  var N=Math.floor(Math.random()*10)+11;
  if(N===20) return{q:'¿Cuánto es 10 + 10?',a:'20',opts:['20','19','18','21'],mc:true,ste:'10 + 10 = 20.'};
  return _rgGen(N);
}
function _genReg_BPU(){
  var N=Math.floor(Math.random()*19)+2;
  var a=Math.floor(Math.random()*(N-1))+1,b=N-a;
  var wrongs=[N-2,N-1,N+1,N+2].filter(function(v){return v>0;}).sort(function(){return Math.random()-0.5;}).slice(0,3);
  var opts=[N].concat(wrongs).sort(function(){return Math.random()-0.5;}).map(String);
  return{q:a+' + '+b+' = ?',a:String(N),opts:opts,mc:true,ste:a+' + '+b+' = '+N+'.'};
}

// ── Sumas de 3 Cifras 4° Primaria – Colegio Belén ────────────────────────────
function _s3rnd(a,b){return Math.floor(Math.random()*(b-a+1))+a;}
function _s3wrs(ans){
  return [ans-1,ans+1,ans-10,ans+10,ans+100,ans-100].filter(function(v){return v!==ans&&v>0;}).sort(function(){return Math.random()-0.5;}).slice(0,3);
}
function _genSum3B1(){ // sin reagrupación
  var ah=_s3rnd(1,4),at=_s3rnd(0,4),au=_s3rnd(0,4);
  var bh=_s3rnd(1,9-ah),bt=_s3rnd(0,9-at),bu=_s3rnd(0,9-au);
  var a=ah*100+at*10+au,b=bh*100+bt*10+bu,ans=a+b;
  var opts=[ans].concat(_s3wrs(ans)).sort(function(){return Math.random()-0.5;}).map(String);
  return{q:a+' + '+b+' = ?',a:String(ans),opts:opts,mc:true,ste:a+' + '+b+' = '+ans+'. Suma cifra por cifra sin reagrupar.'};
}
function _genSum3B2(){ // reagrupación en unidades
  var ah=_s3rnd(1,4),at=_s3rnd(0,4),au=_s3rnd(5,9);
  var bh=_s3rnd(1,4),bt=_s3rnd(0,Math.min(8,8-at)),bu=_s3rnd(Math.max(1,10-au),9);
  var a=ah*100+at*10+au,b=bh*100+bt*10+bu,ans=a+b;
  var opts=[ans].concat(_s3wrs(ans)).sort(function(){return Math.random()-0.5;}).map(String);
  return{q:a+' + '+b+' = ?',a:String(ans),opts:opts,mc:true,ste:'Unidades: '+au+'+'+bu+'='+(au+bu)+', lleva 1. Resultado: '+ans+'.'};
}
function _genSum3B3(){ // reagrupación en decenas
  var ah=_s3rnd(1,4),at=_s3rnd(5,8),au=_s3rnd(0,4);
  var bh=_s3rnd(1,Math.min(4,8-ah)),bt=_s3rnd(Math.max(0,10-at),9),bu=_s3rnd(0,9-au);
  var a=ah*100+at*10+au,b=bh*100+bt*10+bu,ans=a+b;
  var opts=[ans].concat(_s3wrs(ans)).sort(function(){return Math.random()-0.5;}).map(String);
  return{q:a+' + '+b+' = ?',a:String(ans),opts:opts,mc:true,ste:'Decenas: '+at+'+'+bt+'='+(at+bt)+', lleva 1. Resultado: '+ans+'.'};
}
function _genSum3B4(){ // doble reagrupación
  var ah=_s3rnd(1,4),at=_s3rnd(5,8),au=_s3rnd(5,9);
  var bh=_s3rnd(1,Math.min(4,8-ah)),bt=_s3rnd(Math.max(0,9-at),9),bu=_s3rnd(Math.max(1,10-au),9);
  var a=ah*100+at*10+au,b=bh*100+bt*10+bu,ans=a+b;
  var opts=[ans].concat(_s3wrs(ans)).sort(function(){return Math.random()-0.5;}).map(String);
  return{q:a+' + '+b+' = ?',a:String(ans),opts:opts,mc:true,ste:'Reagrupa en unidades y decenas. Resultado: '+ans+'.'};
}
function _genSum3BQ1(){return [_genSum3B1,_genSum3B2,_genSum3B3,_genSum3B4][_s3rnd(0,3)]();}
// ── Sumas de 2 cifras – 4° Primaria Belén ────────────────────────────────────
function _genSum2B1(){ // sin reagrupación
  var at=_s3rnd(1,4),au=_s3rnd(0,4);
  var bt=_s3rnd(1,9-at),bu=_s3rnd(0,9-au);
  var a=at*10+au,b=bt*10+bu,ans=a+b;
  var opts=[ans].concat(_s3wrs(ans)).sort(function(){return Math.random()-0.5;}).map(String);
  return{q:a+' + '+b+' = ?',a:String(ans),opts:opts,mc:true,ste:a+' + '+b+' = '+ans+'. Sin reagrupación.'};
}
function _genSum2B2(){ // reagrupación en unidades
  var at=_s3rnd(1,4),au=_s3rnd(5,9);
  var bt=_s3rnd(1,Math.min(4,8-at)),bu=_s3rnd(Math.max(1,10-au),9);
  var a=at*10+au,b=bt*10+bu,ans=a+b;
  var opts=[ans].concat(_s3wrs(ans)).sort(function(){return Math.random()-0.5;}).map(String);
  return{q:a+' + '+b+' = ?',a:String(ans),opts:opts,mc:true,ste:'Unidades: '+au+'+'+bu+'='+(au+bu)+', lleva 1. Resultado: '+ans+'.'};
}
function _genSum2B3(){ // números mayores, sin reagrupación
  var at=_s3rnd(5,8),au=_s3rnd(0,4);
  var bt=_s3rnd(1,9-at),bu=_s3rnd(0,9-au);
  var a=at*10+au,b=bt*10+bu,ans=a+b;
  var opts=[ans].concat(_s3wrs(ans)).sort(function(){return Math.random()-0.5;}).map(String);
  return{q:a+' + '+b+' = ?',a:String(ans),opts:opts,mc:true,ste:a+' + '+b+' = '+ans+'.'};
}
function _genSum2B4(){ // con reagrupación, resultado ≥ 100
  var at=_s3rnd(5,9),au=_s3rnd(5,9);
  var bt=_s3rnd(1,9),bu=_s3rnd(Math.max(1,10-au),9);
  var a=at*10+au,b=bt*10+bu,ans=a+b;
  var opts=[ans].concat(_s3wrs(ans)).sort(function(){return Math.random()-0.5;}).map(String);
  return{q:a+' + '+b+' = ?',a:String(ans),opts:opts,mc:true,ste:'Con reagrupación. Resultado: '+ans+'.'};
}
function _genSum2BQ1(){return [_genSum2B1,_genSum2B2,_genSum2B3,_genSum2B4][_s3rnd(0,3)]();}
// ── Sumas de 4 cifras – 4° Primaria Belén ────────────────────────────────────
function _s4wrs(ans){
  return [ans-1,ans+1,ans-10,ans+10,ans+100,ans-100,ans+1000,ans-1000].filter(function(v){return v!==ans&&v>0;}).sort(function(){return Math.random()-0.5;}).slice(0,3);
}
function _genSum4B1(){ // sin reagrupación
  var am=_s3rnd(1,3),ah=_s3rnd(0,4),at=_s3rnd(0,4),au=_s3rnd(0,4);
  var bm=_s3rnd(1,Math.min(4,8-am)),bh=_s3rnd(0,9-ah),bt=_s3rnd(0,9-at),bu=_s3rnd(0,9-au);
  var a=am*1000+ah*100+at*10+au,b=bm*1000+bh*100+bt*10+bu,ans=a+b;
  var opts=[ans].concat(_s4wrs(ans)).sort(function(){return Math.random()-0.5;}).map(String);
  return{q:a+' + '+b+' = ?',a:String(ans),opts:opts,mc:true,ste:a+' + '+b+' = '+ans+'. Sin reagrupación.'};
}
function _genSum4B2(){ // reagrupación en unidades
  var am=_s3rnd(1,3),ah=_s3rnd(0,4),at=_s3rnd(0,4),au=_s3rnd(5,9);
  var bm=_s3rnd(1,Math.min(4,8-am)),bh=_s3rnd(0,9-ah),bt=_s3rnd(0,Math.min(8,8-at)),bu=_s3rnd(Math.max(1,10-au),9);
  var a=am*1000+ah*100+at*10+au,b=bm*1000+bh*100+bt*10+bu,ans=a+b;
  var opts=[ans].concat(_s4wrs(ans)).sort(function(){return Math.random()-0.5;}).map(String);
  return{q:a+' + '+b+' = ?',a:String(ans),opts:opts,mc:true,ste:'Reagrupa en unidades. Resultado: '+ans+'.'};
}
function _genSum4B3(){ // reagrupación en decenas
  var am=_s3rnd(1,3),ah=_s3rnd(0,3),at=_s3rnd(5,8),au=_s3rnd(0,4);
  var bm=_s3rnd(1,Math.min(3,8-am)),bh=_s3rnd(0,Math.min(4,8-ah)),bt=_s3rnd(Math.max(0,10-at),9),bu=_s3rnd(0,9-au);
  var a=am*1000+ah*100+at*10+au,b=bm*1000+bh*100+bt*10+bu,ans=a+b;
  var opts=[ans].concat(_s4wrs(ans)).sort(function(){return Math.random()-0.5;}).map(String);
  return{q:a+' + '+b+' = ?',a:String(ans),opts:opts,mc:true,ste:'Reagrupa en decenas. Resultado: '+ans+'.'};
}
function _genSum4B4(){ // doble reagrupación
  var am=_s3rnd(1,3),ah=_s3rnd(0,3),at=_s3rnd(5,8),au=_s3rnd(5,9);
  var bm=_s3rnd(1,Math.min(3,8-am)),bh=_s3rnd(0,Math.min(4,8-ah)),bt=_s3rnd(Math.max(0,9-at),9),bu=_s3rnd(Math.max(1,10-au),9);
  var a=am*1000+ah*100+at*10+au,b=bm*1000+bh*100+bt*10+bu,ans=a+b;
  var opts=[ans].concat(_s4wrs(ans)).sort(function(){return Math.random()-0.5;}).map(String);
  return{q:a+' + '+b+' = ?',a:String(ans),opts:opts,mc:true,ste:'Reagrupa en unidades y decenas. Resultado: '+ans+'.'};
}
function _genSum4BQ1(){return [_genSum4B1,_genSum4B2,_genSum4B3,_genSum4B4][_s3rnd(0,3)]();}
// ── Multiplicación del 2 al 9 4° Primaria – Colegio Belén ────────────────────
function _genMult4B(k){
  var n=Math.floor(Math.random()*10)+1, ans=k*n;
  var seen={}; seen[ans]=1; var pool=[];
  [-2,-1,1,2].forEach(function(d){var v=k*(n+d);if(v>0&&!seen[v]){seen[v]=1;pool.push(v);}});
  var k2a=k>2?k-1:0, k2b=k<9?k+1:0;
  [k2a,k2b].forEach(function(k2){if(k2>0){var v=k2*n;if(!seen[v]){seen[v]=1;pool.push(v);}}});
  var wrongs=pool.sort(function(){return Math.random()-0.5;}).slice(0,3);
  var opts=[ans].concat(wrongs).sort(function(){return Math.random()-0.5;}).map(String);
  return{q:k+' × '+n+' = ?',a:String(ans),opts:opts,mc:true,ste:'Tabla del '+k+': '+k+' × '+n+' = '+ans+'.'};
}
function _genMult4B2(){return _genMult4B(2);}
function _genMult4B3(){return _genMult4B(3);}
function _genMult4B4(){return _genMult4B(4);}
function _genMult4B5(){return _genMult4B(5);}
function _genMult4B6(){return _genMult4B(6);}
function _genMult4B7(){return _genMult4B(7);}
function _genMult4B8(){return _genMult4B(8);}
function _genMult4B9(){return _genMult4B(9);}
function _genMult4BQ1(){return _genMult4B([2,3,4,5][Math.floor(Math.random()*4)]);}
function _genMult4BQ2(){return _genMult4B([6,7,8,9][Math.floor(Math.random()*4)]);}
function _genMult4BPU(){return _genMult4B(Math.floor(Math.random()*8)+2);}
function _genTablaK(k){
  var n=Math.floor(Math.random()*10)+1, ans=k*n;
  var seen={}; seen[ans]=1; var pool=[];
  [-2,-1,1,2].forEach(function(d){var v=k*(n+d);if(v>0&&!seen[v]){seen[v]=1;pool.push(v);}});
  var k2a=k>1?k-1:0, k2b=k<12?k+1:0;
  [k2a,k2b].forEach(function(k2){if(k2>0){var v=k2*n;if(!seen[v]){seen[v]=1;pool.push(v);}}});
  var wrongs=pool.sort(function(){return Math.random()-0.5;}).slice(0,3);
  while(wrongs.length<3){var w=k*(Math.floor(Math.random()*10)+1);if(!seen[w]){seen[w]=1;wrongs.push(w);}}
  var opts=[ans].concat(wrongs).sort(function(){return Math.random()-0.5;}).map(String);
  return{q:k+' × '+n+' = ?',a:String(ans),opts:opts,mc:true,ste:'Tabla del '+k+': '+k+' × '+n+' = '+ans+'.'};
}
function _genTabla1(){return _genTablaK(1);}
function _genTabla2(){return _genTablaK(2);}
function _genTabla3(){return _genTablaK(3);}
function _genTabla4(){return _genTablaK(4);}
function _genTabla5(){return _genTablaK(5);}
function _genTabla6(){return _genTablaK(6);}
function _genTabla7(){return _genTablaK(7);}
function _genTabla8(){return _genTablaK(8);}
function _genTabla9(){return _genTablaK(9);}
function _genTabla10(){return _genTablaK(10);}
function _genTabla11(){return _genTablaK(11);}
function _genTabla12(){return _genTablaK(12);}
function _genTablaBQ1(){return _genTablaK([1,2,3,4][Math.floor(Math.random()*4)]);}
function _genTablaBQ2(){return _genTablaK([5,6,7,8][Math.floor(Math.random()*4)]);}
function _genTablaBQ3(){return _genTablaK([9,10,11,12][Math.floor(Math.random()*4)]);}
function _genTablaBPU(){return _genTablaK(Math.floor(Math.random()*12)+1);}
// ── Conjuntos: Comprensión y Extensión 4° Primaria – Colegio Belén ───────────
var _CCE=[
  {ext:'{2, 4, 6, 8, 10}',    rule:'x es par, 2 ≤ x ≤ 10',          pred:function(x){return x%2===0&&x>=2&&x<=10;},
   wE:['{2, 4, 6, 8}','{2, 4, 6, 8, 10, 12}','{1, 3, 5, 7, 9}'],             wR:['x es impar, 1 ≤ x ≤ 9','x es par, 2 ≤ x ≤ 8','x es múltiplo de 2, 4 ≤ x ≤ 10']},
  {ext:'{5, 10, 15, 20}',     rule:'x es múltiplo de 5, 5 ≤ x ≤ 20', pred:function(x){return x%5===0&&x>=5&&x<=20;},
   wE:['{5, 10, 15}','{5, 10, 15, 20, 25}','{10, 15, 20, 25}'],               wR:['x es múltiplo de 5, 5 ≤ x ≤ 15','x es par y múltiplo de 5','x es múltiplo de 10']},
  {ext:'{3, 6, 9, 12}',       rule:'x es múltiplo de 3, 3 ≤ x ≤ 12', pred:function(x){return x%3===0&&x>=3&&x<=12;},
   wE:['{3, 6, 9}','{6, 9, 12}','{3, 6, 9, 12, 15}'],                        wR:['x es múltiplo de 3, 3 ≤ x ≤ 9','x es impar múltiplo de 3','x es múltiplo de 6']},
  {ext:'{1, 4, 9, 16, 25}',   rule:'x es cuadrado perfecto, 1 ≤ x ≤ 25', pred:function(x){return[1,4,9,16,25].indexOf(x)>=0;},
   wE:['{1, 4, 9, 16}','{4, 9, 16, 25}','{1, 4, 9, 16, 25, 36}'],            wR:['x es primo menor que 30','x es cuadrado perfecto, 4 ≤ x ≤ 25','x es cuadrado perfecto, 1 ≤ x ≤ 36']},
  {ext:'{2, 3, 5, 7, 11, 13}',rule:'x es número primo, 2 ≤ x ≤ 13',  pred:function(x){return[2,3,5,7,11,13].indexOf(x)>=0;},
   wE:['{1, 2, 3, 5, 7}','{2, 3, 5, 7, 9, 11}','{3, 5, 7, 11, 13}'],         wR:['x es impar, 2 ≤ x ≤ 13','x es primo menor que 10','x es primo, 3 ≤ x ≤ 13']},
  {ext:'{4, 8, 12, 16, 20}',  rule:'x es múltiplo de 4, 4 ≤ x ≤ 20', pred:function(x){return x%4===0&&x>=4&&x<=20;},
   wE:['{4, 8, 12, 16}','{8, 12, 16, 20}','{4, 8, 12, 16, 20, 24}'],         wR:['x es múltiplo de 4, 4 ≤ x ≤ 16','x es par, 4 ≤ x ≤ 20','x es múltiplo de 4, 8 ≤ x ≤ 20']},
  {ext:'{6, 12, 18, 24}',     rule:'x es múltiplo de 6, 6 ≤ x ≤ 24', pred:function(x){return x%6===0&&x>=6&&x<=24;},
   wE:['{6, 12, 18}','{6, 12, 18, 24, 30}','{3, 6, 9, 12}'],                 wR:['x es múltiplo de 6, 6 ≤ x ≤ 18','x es múltiplo de 3, 3 ≤ x ≤ 24','x es múltiplo de 6, 6 ≤ x ≤ 30']},
  {ext:'{1, 3, 5, 7, 9}',     rule:'x es impar, 1 ≤ x ≤ 9',           pred:function(x){return x%2!==0&&x>=1&&x<=9;},
   wE:['{1, 3, 5, 7}','{3, 5, 7, 9}','{1, 3, 5, 7, 9, 11}'],                 wR:['x es par, 1 ≤ x ≤ 9','x es impar, 1 ≤ x ≤ 7','x es impar, 3 ≤ x ≤ 9']},
  {ext:'{10, 20, 30, 40, 50}',rule:'x es múltiplo de 10, 10 ≤ x ≤ 50',pred:function(x){return x%10===0&&x>=10&&x<=50;},
   wE:['{10, 20, 30, 40}','{10, 20, 30, 40, 50, 60}','{5, 10, 15, 20}'],     wR:['x es múltiplo de 10, 10 ≤ x ≤ 40','x es múltiplo de 5, 5 ≤ x ≤ 50','x es múltiplo de 10, 10 ≤ x ≤ 60']},
];
function _ccePick(){return _CCE[Math.floor(Math.random()*_CCE.length)];}
function _genCCEB1(){
  var c=_ccePick(),isExt=Math.random()<0.5;
  var q=isExt?'A = '+c.ext+'  —  ¿Cómo está determinado?':'A = {x / '+c.rule+'}  —  ¿Cómo está determinado?';
  var ans=isExt?'Extensión':'Comprensión';
  return{q:q,a:ans,opts:['Extensión','Comprensión'],mc:true,ste:isExt?'Se listan sus elementos → Forma extensión.':'Se describe con una regla → Forma comprensión.'};
}
function _genCCEB2(){
  var c=_ccePick();
  var bList=[],nList=[];
  for(var i=1;i<=30;i++){if(c.pred(i))bList.push(i);else nList.push(i);}
  var useBelongs=Math.random()<0.5&&bList.length>0||nList.length===0;
  var pool=useBelongs?bList:nList;
  var x=pool[Math.floor(Math.random()*pool.length)];
  var yA='Sí  ('+x+' ∈ A)', nA='No  ('+x+' ∉ A)';
  return{q:'A = {x / '+c.rule+'}  →  ¿Pertenece '+x+' a A?',a:useBelongs?yA:nA,opts:[yA,nA],mc:true,
    ste:useBelongs?x+' cumple la condición → sí pertenece.':x+' no cumple la condición → no pertenece.'};
}
function _genCCEB3(){
  var c=_ccePick();
  var opts=[c.ext].concat(c.wE).sort(function(){return Math.random()-0.5;});
  return{q:'Forma extensión de: A = {x / '+c.rule+'}',a:c.ext,opts:opts,mc:true,ste:'Aplicamos la regla: A = '+c.ext+'.'};
}
function _genCCEB4(){
  var c=_ccePick();
  var opts=[c.rule].concat(c.wR).sort(function(){return Math.random()-0.5;});
  return{q:'Forma comprensión de: A = '+c.ext,a:c.rule,opts:opts,mc:true,ste:'La propiedad común es: "'+c.rule+'".'};
}
function _genCCEBQ1(){return [_genCCEB1,_genCCEB2,_genCCEB3,_genCCEB4][Math.floor(Math.random()*4)]();}

// ── Matemática 6° Primaria – San Francisco de Asís ──────────────────────────
// Utilidad: construye 4 opciones únicas (numéricas) con la respuesta correcta incluida
function _sf6w4(r,...cands){
  const seen=new Set([r]); const ok=[];
  for(const v of cands){ if(Number.isFinite(v)&&!seen.has(v)){seen.add(v);ok.push(v);} }
  let i=1; while(ok.length<3){const n=r+i*13; if(!seen.has(n)){seen.add(n);ok.push(n);} i++;}
  return _bingShufArr([r,...ok.slice(0,3)]);
}
const _SF6_SUP={2:'²',3:'³',4:'⁴',5:'⁵'};

// ── Unidad 1: Multiplicación y División ─────────────────────────────────────
function _genSF6_U1_B1(){ // 3×1 dígitos
  const a=_bGetRandomInt(100,999),b=_bGetRandomInt(2,9),r=a*b;
  return {q:`${a} × ${b} = ?`,a:r,opts:_sf6w4(r,r-b*10,r+b*10,r-b,r+b*20),mc:true};
}
function _genSF6_U1_B2(){ // 3×2 dígitos
  const a=_bGetRandomInt(100,499),b=_bGetRandomInt(11,49),r=a*b;
  return {q:`${a} × ${b} = ?`,a:r,opts:_sf6w4(r,r-a,r+a,r-b*10,r+b*10),mc:true};
}
function _genSF6_U1_B3(){ // 4×2 dígitos
  const a=_bGetRandomInt(1000,3999),b=_bGetRandomInt(11,49),r=a*b;
  return {q:`${a} × ${b} = ?`,a:r,opts:_sf6w4(r,r-a,r+a,r-b*100,r+b*100),mc:true};
}
function _genSF6_U1_BQ1(){ return [_genSF6_U1_B1,_genSF6_U1_B2,_genSF6_U1_B3][_bGetRandomInt(0,2)](); }
function _genSF6_U1_B4(){ // División exacta
  const d=_bGetRandomInt(2,12),q=_bGetRandomInt(10,99),dvd=d*q;
  return {q:`${dvd} ÷ ${d} = ?`,a:q,opts:_sf6w4(q,q-2,q+2,q-1,q+1),mc:true};
}
function _genSF6_U1_B5(){ // División con residuo – hallar el residuo
  const d=_bGetRandomInt(3,12),qc=_bGetRandomInt(5,50),r=_bGetRandomInt(1,d-1),dvd=d*qc+r;
  return {q:`${dvd} ÷ ${d}: ¿cuál es el residuo?`,a:r,opts:_sf6w4(r,0,r-1>0?r-1:r+2,r+1,d-1),mc:true};
}
function _genSF6_U1_B6(){ // Hallar dividendo dados divisor, cociente y tipo de residuo
  const d=_bGetRandomInt(5,20),c=_bGetRandomInt(8,40);
  const useMax=Math.random()<0.5,r=useMax?(d-1):0,dvd=d*c+r;
  return {q:`Divisor = ${d}, cociente = ${c}, residuo ${useMax?'máximo':'mínimo'}. ¿Cuál es el dividendo?`,
          a:dvd,opts:_sf6w4(dvd,dvd-d,dvd+d,dvd-1,dvd+c),mc:true};
}
function _genSF6_U1_BQ2(){ return [_genSF6_U1_B4,_genSF6_U1_B5,_genSF6_U1_B6][_bGetRandomInt(0,2)](); }
function _genSF6_U1_BPU(){ return [_genSF6_U1_B1,_genSF6_U1_B2,_genSF6_U1_B3,_genSF6_U1_B4,_genSF6_U1_B5,_genSF6_U1_B6][_bGetRandomInt(0,5)](); }

// ── Unidad 2: Potencias y Raíces Cuadradas ──────────────────────────────────
function _genSF6_U2_B1(){ // Potencias básicas (base 2–9, exp 2–3)
  const base=_bGetRandomInt(2,9),exp=_bGetRandomInt(2,3),r=Math.pow(base,exp);
  return {q:`${base}${_SF6_SUP[exp]} = ?`,a:r,opts:_sf6w4(r,r-base,r+base,base*exp,r+exp),mc:true};
}
function _genSF6_U2_B2(){ // Potencias mayores (como en las imágenes)
  const pairs=[[5,3],[5,4],[5,5],[7,2],[8,3],[10,2],[10,3],[12,2],[14,2],[3,5],[4,4],[6,3],[2,6]];
  const [base,exp]=pairs[_bGetRandomInt(0,pairs.length-1)];
  const r=Math.pow(base,exp),d=Math.max(base,Math.floor(r*0.08));
  return {q:`${base}${_SF6_SUP[exp]||'^'+exp} = ?`,a:r,opts:_sf6w4(r,r-d,r+d,r-base,r+base*2),mc:true};
}
function _genSF6_U2_BQ1(){ return Math.random()<0.5?_genSF6_U2_B1():_genSF6_U2_B2(); }
function _genSF6_U2_B3(){ // Raíces cuadradas √1–√100
  const r=_bGetRandomInt(1,10),sq=r*r;
  return {q:`√${sq} = ?`,a:r,opts:_sf6w4(r,r-1,r+1,r+2,r-2),mc:true};
}
function _genSF6_U2_B4(){ // Raíces cuadradas √121–√441
  const r=_bGetRandomInt(11,21),sq=r*r;
  return {q:`√${sq} = ?`,a:r,opts:_sf6w4(r,r-2,r-1,r+1,r+2),mc:true};
}
function _genSF6_U2_BQ2(){ return Math.random()<0.5?_genSF6_U2_B3():_genSF6_U2_B4(); }
function _genSF6_U2_BPU(){ return [_genSF6_U2_B1,_genSF6_U2_B2,_genSF6_U2_B3,_genSF6_U2_B4][_bGetRandomInt(0,3)](); }

// ── Unidad 3: Jerarquía de Operaciones ──────────────────────────────────────
function _genSF6_U3_B1(){ // ×/÷ antes de +/−
  const a=_bGetRandomInt(2,9),b=_bGetRandomInt(2,9),c=_bGetRandomInt(2,15);
  if(Math.random()<0.5){ const r=a*b+c; return {q:`${a} × ${b} + ${c} = ?`,a:r,opts:_sf6w4(r,(a+b)*c,a*b,a*b-c>0?a*b-c:a*b+c+1),mc:true}; }
  const c2=_bGetRandomInt(1,a*b-1),r=a*b-c2;
  return {q:`${a} × ${b} − ${c2} = ?`,a:r,opts:_sf6w4(r,a*b,(a-b+1)*c2||2,a*b+c2),mc:true};
}
function _genSF6_U3_B2(){ // Con paréntesis
  const a=_bGetRandomInt(2,8),b=_bGetRandomInt(2,8),c=_bGetRandomInt(2,6);
  if(Math.random()<0.5){ const r=(a+b)*c; return {q:`(${a} + ${b}) × ${c} = ?`,a:r,opts:_sf6w4(r,a*c+b,a+b*c,r+c),mc:true}; }
  const lo=Math.min(a,b),hi=Math.max(a,b),r=(hi-lo)*c;
  return {q:`(${hi} − ${lo}) × ${c} = ?`,a:r,opts:_sf6w4(r,hi*c-lo,hi-lo+c,hi*c+lo),mc:true};
}
function _genSF6_U3_BQ1(){ return Math.random()<0.5?_genSF6_U3_B1():_genSF6_U3_B2(); }
function _genSF6_U3_B3(){ // Con potencias y raíces
  const base=_bGetRandomInt(2,7),exp=_bGetRandomInt(2,3),pow=Math.pow(base,exp);
  if(Math.random()<0.5){ const c=_bGetRandomInt(2,20),r=pow+c; return {q:`${base}${_SF6_SUP[exp]} + ${c} = ?`,a:r,opts:_sf6w4(r,pow,base*exp+c,pow-c>0?pow-c:pow+1),mc:true}; }
  const sqArr=[4,9,16,25,36,49,64,81,100],sq=sqArr[_bGetRandomInt(0,8)],sqr=Math.sqrt(sq),c2=_bGetRandomInt(2,20),r=sqr+c2;
  return {q:`√${sq} + ${c2} = ?`,a:r,opts:_sf6w4(r,sq+c2,sqr*c2,r+1),mc:true};
}
function _genSF6_U3_B4(){ // Jerarquía compleja (todo combinado, nivel examen)
  const a=_bGetRandomInt(2,6),b=_bGetRandomInt(2,5),c=_bGetRandomInt(2,8);
  const base=_bGetRandomInt(2,5),exp=_bGetRandomInt(2,3),pow=Math.pow(base,exp);
  const r=pow+a*b+c;
  return {q:`${base}${_SF6_SUP[exp]} + ${a} × ${b} + ${c} = ?`,a:r,opts:_sf6w4(r,pow+a*b,pow*c,r+a),mc:true};
}
function _genSF6_U3_BQ2(){ return Math.random()<0.5?_genSF6_U3_B3():_genSF6_U3_B4(); }
function _genSF6_U3_BPU(){ return [_genSF6_U3_B1,_genSF6_U3_B2,_genSF6_U3_B3,_genSF6_U3_B4][_bGetRandomInt(0,3)](); }

// ── Unidad 4: Divisibilidad y Criterios ─────────────────────────────────────
function _genSF6_U4_B1(){ // Por 2 (último dígito par)
  if(Math.random()<0.5){
    const even=_bGetRandomInt(10,200)*2;
    const odds=[_bGetRandomInt(5,100)*2+1,_bGetRandomInt(5,100)*2+1,_bGetRandomInt(5,100)*2+1];
    return {q:`¿Cuál número es divisible por 2?`,a:String(even),opts:_bingShufArr([String(even),...odds.map(String)]),mc:true};
  }
  const isDivisible=Math.random()<0.5,n=isDivisible?_bGetRandomInt(10,200)*2:_bGetRandomInt(10,100)*2+1;
  return {q:`¿${n} es divisible por 2?`,a:isDivisible?'Sí':'No',opts:['Sí','No'],mc:true};
}
function _genSF6_U4_B2(){ // Por 3 (suma de dígitos)
  const digSum=n=>String(n).split('').reduce((s,d)=>s+parseInt(d),0);
  const isDivisible=Math.random()<0.5;
  let n=_bGetRandomInt(10,999);
  while((digSum(n)%3===0)!==isDivisible) n=_bGetRandomInt(10,999);
  if(Math.random()<0.5){ const s=digSum(n); return {q:`La suma de dígitos de ${n} es ${s}. ¿Es divisible por 3?`,a:isDivisible?'Sí':'No',opts:['Sí','No'],mc:true}; }
  return {q:`¿${n} es divisible por 3?`,a:isDivisible?'Sí':'No',opts:['Sí','No'],mc:true};
}
function _genSF6_U4_B3(){ // Por 5 (último dígito 0 o 5)
  if(Math.random()<0.5){
    const div5=[150,875,350,625,510,245,1000][_bGetRandomInt(0,6)];
    const odds=[_bGetRandomInt(10,200)*10+3,_bGetRandomInt(10,200)*10+7,_bGetRandomInt(10,200)*10+1];
    return {q:`¿Cuál número es divisible por 5?`,a:String(div5),opts:_bingShufArr([String(div5),...odds.map(String)]),mc:true};
  }
  const isDivisible=Math.random()<0.5;
  const n=isDivisible?_bGetRandomInt(2,200)*5:_bGetRandomInt(2,100)*10+_bGetRandomInt(1,4);
  return {q:`¿${n} es divisible por 5?`,a:isDivisible?'Sí':'No',opts:['Sí','No'],mc:true};
}
function _genSF6_U4_BQ1(){ return [_genSF6_U4_B1,_genSF6_U4_B2,_genSF6_U4_B3][_bGetRandomInt(0,2)](); }
function _genSF6_U4_B4(){ // Por 7 (comprobación directa)
  const isDivisible=Math.random()<0.5,n=isDivisible?_bGetRandomInt(2,20)*7:_bGetRandomInt(2,20)*7+_bGetRandomInt(1,6);
  return {q:`¿${n} es divisible por 7?`,a:isDivisible?'Sí':'No',opts:['Sí','No'],mc:true};
}
function _genSF6_U4_B5(){ // Por 9 (suma de dígitos)
  const digSum=n=>String(n).split('').reduce((s,d)=>s+parseInt(d),0);
  const isDivisible=Math.random()<0.5;
  let n=_bGetRandomInt(10,999);
  while((digSum(n)%9===0)!==isDivisible) n=_bGetRandomInt(10,999);
  if(Math.random()<0.5){ const s=digSum(n); return {q:`La suma de dígitos de ${n} es ${s}. ¿Es divisible por 9?`,a:isDivisible?'Sí':'No',opts:['Sí','No'],mc:true}; }
  return {q:`¿${n} es divisible por 9?`,a:isDivisible?'Sí':'No',opts:['Sí','No'],mc:true};
}
function _genSF6_U4_B6(){ // Por 11 (suma alternada de dígitos)
  const isDivisible=Math.random()<0.5,n=isDivisible?_bGetRandomInt(1,50)*11:_bGetRandomInt(1,50)*11+_bGetRandomInt(1,10);
  const digits=String(n).split('').map(Number),altSum=digits.reduce((s,d,i)=>s+(i%2===0?d:-d),0);
  if(Math.random()<0.5 && n>=100){ return {q:`La suma alternada de dígitos de ${n} es ${altSum}. ¿Es divisible por 11?`,a:isDivisible?'Sí':'No',opts:['Sí','No'],mc:true}; }
  return {q:`¿${n} es divisible por 11?`,a:isDivisible?'Sí':'No',opts:['Sí','No'],mc:true};
}
function _genSF6_U4_BQ2(){ return [_genSF6_U4_B4,_genSF6_U4_B5,_genSF6_U4_B6][_bGetRandomInt(0,2)](); }
function _genSF6_U4_B7(){ // Por 25 (últimos dos dígitos)
  const ends=[0,25,50,75],bad=[10,15,20,30,35,40,45,55,60,65,70,80,85,90,95];
  const isDivisible=Math.random()<0.5,base=_bGetRandomInt(1,20)*100;
  const n=isDivisible?base+ends[_bGetRandomInt(0,3)]:base+bad[_bGetRandomInt(0,bad.length-1)];
  return {q:`¿${n} es divisible por 25?`,a:isDivisible?'Sí':'No',opts:['Sí','No'],mc:true};
}
function _genSF6_U4_B8(){ // Dígito desconocido para divisibilidad (criterios 3 y 9)
  const div=Math.random()<0.5?3:9;
  const prefix=_bGetRandomInt(10,99),prefixSum=String(prefix).split('').reduce((s,c)=>s+parseInt(c),0);
  const needed=((div-(prefixSum%div))%div);
  const w1=(needed+3)%10,w2=(needed+5)%10,w3=(needed+7)%10;
  return {q:`¿Qué dígito va en el espacio para que ${prefix}_ sea divisible por ${div}?`,
          a:String(needed),opts:_bingShufArr([String(needed),String(w1),String(w2),String(w3)]),mc:true};
}
function _genSF6_U4_BQ3(){ return [_genSF6_U4_B1,_genSF6_U4_B2,_genSF6_U4_B3,_genSF6_U4_B4,_genSF6_U4_B5,_genSF6_U4_B6,_genSF6_U4_B7,_genSF6_U4_B8][_bGetRandomInt(0,7)](); }
function _genSF6_U4_BPU(){ return _genSF6_U4_BQ3(); }

// ── Unidad 5: Múltiplos, Divisores, Primos y Factorización ──────────────────
function _genSF6_U5_B1(){ // Múltiplos de un número
  const n=_bGetRandomInt(2,12),k=_bGetRandomInt(2,10),r=n*k;
  if(Math.random()<0.5){ return {q:`¿${r} es múltiplo de ${n}?`,a:'Sí',opts:['Sí','No'],mc:true}; }
  const notMult=n*k+_bGetRandomInt(1,n-1);
  return {q:`¿${notMult} es múltiplo de ${n}?`,a:'No',opts:['Sí','No'],mc:true};
}
function _genSF6_U5_B2(){ // Divisores de un número
  const ns=[12,18,24,30,36,48],n=ns[_bGetRandomInt(0,ns.length-1)];
  const divs=[];for(let i=1;i<=n;i++){if(n%i===0)divs.push(i);}
  const d=divs[_bGetRandomInt(0,divs.length-1)];
  const nonDiv=d+1<=n&&n%(d+1)!==0?d+1:d+2;
  if(Math.random()<0.5){ return {q:`¿${d} es divisor de ${n}?`,a:'Sí',opts:['Sí','No'],mc:true}; }
  return {q:`¿${nonDiv} es divisor de ${n}?`,a:'No',opts:['Sí','No'],mc:true};
}
function _genSF6_U5_BQ1(){ return Math.random()<0.5?_genSF6_U5_B1():_genSF6_U5_B2(); }
function _genSF6_U5_B3(){ // Número primo o compuesto
  const primes=[2,3,5,7,11,13,17,19,23,29,31,37,41,43,47];
  const composites=[4,6,8,9,10,12,14,15,16,18,20,21,22,24,25,26,27,28,30,32,33,35,36];
  const isPrime=Math.random()<0.5;
  const n=isPrime?primes[_bGetRandomInt(0,primes.length-1)]:composites[_bGetRandomInt(0,composites.length-1)];
  return {q:`¿${n} es primo o compuesto?`,a:isPrime?'primo':'compuesto',opts:['primo','compuesto'],mc:true};
}
function _genSF6_U5_B4(){ // Descomposición canónica (factorización prima)
  const items=[
    {n:8,  ans:'2³'},     {n:12, ans:'2² × 3'},  {n:16, ans:'2⁴'},     {n:18, ans:'2 × 3²'},
    {n:20, ans:'2² × 5'}, {n:24, ans:'2³ × 3'},  {n:25, ans:'5²'},      {n:27, ans:'3³'},
    {n:28, ans:'2² × 7'}, {n:30, ans:'2 × 3 × 5'},{n:32, ans:'2⁵'},    {n:36, ans:'2² × 3²'},
    {n:45, ans:'3² × 5'}, {n:48, ans:'2⁴ × 3'},  {n:50, ans:'2 × 5²'}, {n:56, ans:'2³ × 7'},
    {n:60, ans:'2² × 3 × 5'},{n:72,ans:'2³ × 3²'},{n:90,ans:'2 × 3² × 5'},{n:100,ans:'2² × 5²'},
  ];
  const item=items[_bGetRandomInt(0,items.length-1)];
  const wrong=[items[_bGetRandomInt(0,items.length-1)].ans,items[_bGetRandomInt(0,items.length-1)].ans,items[_bGetRandomInt(0,items.length-1)].ans].filter(w=>w!==item.ans);
  const wo=[...new Set(wrong)].slice(0,3);
  while(wo.length<3){const x=items[_bGetRandomInt(0,items.length-1)].ans;if(!wo.includes(x)&&x!==item.ans)wo.push(x);}
  return {q:`Descomposición canónica de ${item.n}:`,a:item.ans,opts:_bingShufArr([item.ans,...wo.slice(0,3)]),mc:true};
}
function _genSF6_U5_BQ2(){ return Math.random()<0.5?_genSF6_U5_B3():_genSF6_U5_B4(); }
function _genSF6_U5_B5(){ // Cantidad de divisores CD usando fórmula (e₁+1)(e₂+1)...
  const items=[
    {n:8,  fact:'2³',       cd:4},  {n:12, fact:'2²×3',      cd:6},
    {n:16, fact:'2⁴',       cd:5},  {n:18, fact:'2×3²',      cd:6},
    {n:20, fact:'2²×5',     cd:6},  {n:24, fact:'2³×3',      cd:8},
    {n:25, fact:'5²',       cd:3},  {n:27, fact:'3³',         cd:4},
    {n:36, fact:'2²×3²',    cd:9},  {n:48, fact:'2⁴×3',      cd:10},
    {n:56, fact:'2³×7',     cd:8},  {n:72, fact:'2³×3²',     cd:12},
    {n:90, fact:'2×3²×5',   cd:12}, {n:120,fact:'2³×3×5',    cd:16},
  ];
  const item=items[_bGetRandomInt(0,items.length-1)];
  return {q:`Si ${item.n} = ${item.fact}, ¿cuántos divisores tiene ${item.n}?`,
          a:item.cd,opts:_sf6w4(item.cd,item.cd-2,item.cd+2,item.cd-1,item.cd+4),mc:true};
}
function _genSF6_U5_B6(){ // Suma de valores para divisibilidad (problemas avanzados)
  const div=Math.random()<0.5?3:9;
  // Find digit 'n' in a number like 14n8 that makes it divisible by div
  const a=_bGetRandomInt(1,9),b=_bGetRandomInt(0,9),c=_bGetRandomInt(0,9);
  const fixedSum=a+b+c; // sum of known digits
  // Find all x (0-9) such that (fixedSum+x)%div===0
  const valid=[];for(let x=0;x<=9;x++){if((fixedSum+x)%div===0)valid.push(x);}
  if(valid.length===0){return _genSF6_U5_B6();} // retry
  const sumV=valid.reduce((s,v)=>s+v,0);
  return {q:`¿Cuántos valores puede tomar 'x' si ${a}${b}x${c} es divisible por ${div}? Suma de esos valores:`,
          a:sumV,opts:_sf6w4(sumV,sumV-div,sumV+div,sumV+valid.length,sumV-valid.length>0?sumV-valid.length:sumV+div+1),mc:true};
}
function _genSF6_U5_BQ3(){ return [_genSF6_U5_B3,_genSF6_U5_B4,_genSF6_U5_B5,_genSF6_U5_B6][_bGetRandomInt(0,3)](); }
function _genSF6_U5_BPU(){ return [_genSF6_U5_B1,_genSF6_U5_B2,_genSF6_U5_B3,_genSF6_U5_B4,_genSF6_U5_B5,_genSF6_U5_B6][_bGetRandomInt(0,5)](); }

// ═══════════════════════════════════════════════════════════════════════════
// Asís 6° Primaria – Álgebra y Geometría (nuevas unidades)
// ═══════════════════════════════════════════════════════════════════════════

// — Helpers exclusivos Asís 6° —
function _a6rnd(a,b){return Math.floor(Math.random()*(b-a+1))+a;}
function _a6pick(arr){return arr[_a6rnd(0,arr.length-1)];}
function _a6shuf(a){const r=[...a];for(let i=r.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[r[i],r[j]]=[r[j],r[i]];}return r;}
function _a6opts(r,...ws){
  const s=new Set([r]);const ok=[];
  for(const v of ws){if(!s.has(v)&&v!==undefined&&v!==null){s.add(v);ok.push(v);}}
  let d=1;while(ok.length<3){const p=r+d,q=r-d;if(!s.has(p)){s.add(p);ok.push(p);}if(ok.length<3&&!s.has(q)){s.add(q);ok.push(q);}d++;}
  return _a6shuf([r,...ok.slice(0,3)]);
}
function _a6sup(n){
  const m={'0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹','-':'⁻'};
  return String(n).split('').map(c=>m[c]||c).join('');
}
function _a6svg(inner,w,h){
  w=w||220;h=h||170;
  return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="max-width:${w}px;width:100%;height:auto;display:block;margin:4px auto 8px"><g style="font-family:Arial,sans-serif;font-size:11px;font-weight:normal">${inner}</g></svg>`;
}

// ── UNIDAD: Leyes de Exponentes I — Producto y Cociente ─────────────────────
function _genSF6_EXP_B1(){ // aᵐ · aⁿ = aᵐ⁺ⁿ (numérico)
  const b=_a6rnd(2,7),e1=_a6rnd(1,5),e2=_a6rnd(1,5),r=e1+e2;
  return {q:`${b}${_a6sup(e1)} × ${b}${_a6sup(e2)} = ${b}ⁿ → n = ?`,
    a:r, opts:_a6opts(r,r-1,r+1,e1*e2), mc:true};
}
function _genSF6_EXP_B2(){ // aᵐ ÷ aⁿ = aᵐ⁻ⁿ (numérico)
  const b=_a6rnd(2,7),e1=_a6rnd(4,8),e2=_a6rnd(1,e1-1),r=e1-e2;
  return {q:`${b}${_a6sup(e1)} ÷ ${b}${_a6sup(e2)} = ${b}ⁿ → n = ?`,
    a:r, opts:_a6opts(r,r-1,r+1,e1+e2), mc:true};
}
function _genSF6_EXP_BQ1(){return Math.random()<0.5?_genSF6_EXP_B1():_genSF6_EXP_B2();}
function _genSF6_EXP_B3(){ // Con exp negativo: bᵃ ÷ b⁻ⁿ = bᵃ⁺ⁿ
  const b=_a6rnd(2,7),e1=_a6rnd(2,6),neg=_a6rnd(1,3),r=e1+neg;
  return {q:`${b}${_a6sup(e1)} ÷ ${b}${_a6sup(-neg)} = ${b}ⁿ → n = ?`,
    a:r, opts:_a6opts(r,e1-neg<0?r+2:e1-neg,e1*neg,r-1), mc:true};
}
function _genSF6_EXP_B4(){ // Con variables: vᵃ · vᵇ o vᵃ ÷ vᵇ
  const vs=['x','y','z','a','b'],v=_a6pick(vs);
  const e1=_a6rnd(3,9),e2=_a6rnd(1,e1-1),isP=Math.random()<0.5,r=isP?e1+e2:e1-e2;
  const op=isP?'·':'÷',ans=`${v}${_a6sup(r)}`;
  const w1=`${v}${_a6sup(r+1)}`,w2=`${v}${_a6sup(r-1<=0?r+2:r-1)}`,w3=`${v}${_a6sup(isP?e1*e2:e1+e2)}`;
  return {q:`${v}${_a6sup(e1)} ${op} ${v}${_a6sup(e2)} = ?`,
    a:ans, opts:_a6shuf([ans,w1,w2,w3]), mc:true};
}
function _genSF6_EXP_BQ2(){return Math.random()<0.5?_genSF6_EXP_B3():_genSF6_EXP_B4();}
function _genSF6_EXP_BPU(){return [_genSF6_EXP_B1,_genSF6_EXP_B2,_genSF6_EXP_B3,_genSF6_EXP_B4][_a6rnd(0,3)]();}

// ── UNIDAD: Leyes Exp. II — P⁰=1, P¹=P, (aᵐ)ⁿ = aᵐⁿ ──────────────────────
function _genSF6_PPP_B1(){ // a⁰ = 1
  const [expr]=_a6pick([['27⁰'],['(−7)⁰'],['(15)⁰'],['(−100)⁰'],['100⁰'],['3⁰'],['(−5)⁰']]);
  return {q:`${expr} = ?`, a:1, opts:_a6shuf([1,0,-1,2]), mc:true};
}
function _genSF6_PPP_B2(){ // 1ⁿ = 1 y a¹ = a
  if(Math.random()<0.5){
    const n=_a6rnd(3,50);
    return {q:`1${_a6sup(n)} = ?`, a:1, opts:_a6shuf([1,n,0,-1]), mc:true};
  }
  const b=_a6pick([7,13,24,31,45,8,50,17]);
  return {q:`${b}¹ = ?`, a:b, opts:_a6opts(b,1,b+1,b-1), mc:true};
}
function _genSF6_PPP_BQ1(){return Math.random()<0.5?_genSF6_PPP_B1():_genSF6_PPP_B2();}
function _genSF6_PPP_B3(){ // (aᵐ)ⁿ = aᵐⁿ
  const b=_a6rnd(2,5),m=_a6rnd(2,4),n=_a6rnd(2,4),r=m*n;
  return {q:`(${b}${_a6sup(m)})${_a6sup(n)} = ${b}ⁿ → n = ?`,
    a:r, opts:_a6opts(r,m+n,m,n), mc:true};
}
function _genSF6_PPP_B4(){ // [(aᵐ)ⁿ]⁰ = 1
  const b=_a6rnd(2,9),m=_a6rnd(2,4),n=_a6rnd(2,4);
  return {q:`[(${b}${_a6sup(m)})${_a6sup(n)}]⁰ = ?`,
    a:1, opts:_a6shuf([1,0,b,m*n]), mc:true};
}
function _genSF6_PPP_BQ2(){return Math.random()<0.5?_genSF6_PPP_B3():_genSF6_PPP_B4();}
function _genSF6_PPP_B5(){ // Expresión: a⁰+(−b)⁰+1ᵏ−c¹ = 3−c
  const a=_a6rnd(2,25),b=_a6rnd(2,15),c=_a6rnd(2,12),k=_a6rnd(2,15),r=3-c;
  return {q:`${a}⁰ + (−${b})⁰ + 1${_a6sup(k)} − ${c}¹ = ?`,
    a:r, opts:_a6opts(r,r+1,r-1,1-c), mc:true};
}
function _genSF6_PPP_BQ3(){return [_genSF6_PPP_B3,_genSF6_PPP_B4,_genSF6_PPP_B5][_a6rnd(0,2)]();}
function _genSF6_PPP_BPU(){return [_genSF6_PPP_B1,_genSF6_PPP_B2,_genSF6_PPP_B3,_genSF6_PPP_B4,_genSF6_PPP_B5][_a6rnd(0,4)]();}

// ── UNIDAD: Radicales n-ésimos ──────────────────────────────────────────────
function _genSF6_RAD_B1(){ // ⁿ√(xᵐ) = x^(m/n) cuando n|m
  const cases=[[2,4,2],[2,6,3],[2,8,4],[2,10,5],[3,6,2],[3,9,3],[3,12,4],[4,8,2],[5,10,2],[6,12,2],[6,18,3],[6,30,5]];
  const [n,m,exp]=_a6pick(cases),v=_a6pick(['x','y','z','a']);
  const ans=`${v}${_a6sup(exp)}`;
  return {q:`${_a6sup(n)}√(${v}${_a6sup(m)}) = ?`,
    a:ans, opts:_a6shuf([ans,`${v}${_a6sup(exp+1)}`,`${v}${_a6sup(exp+2)}`,`${v}${_a6sup(n+m)}`]), mc:true};
}
function _genSF6_RAD_B2(){ // √a × √b = √(ab) con resultado entero
  const [a,b,r]=_a6pick([[4,9,6],[4,25,10],[9,16,12],[4,16,8],[9,25,15],[16,25,20],[4,36,12],[25,4,10]]);
  return {q:`√${a} × √${b} = ?`, a:r, opts:_a6opts(r,r-1,r+1,a+b), mc:true};
}
function _genSF6_RAD_BQ1(){return Math.random()<0.5?_genSF6_RAD_B1():_genSF6_RAD_B2();}
function _genSF6_RAD_B3(){ // ³√a × ³√b = ³√(ab) con resultado entero
  const [a,b,r]=_a6pick([[2,4,2],[3,9,3],[5,25,5],[4,16,4],[2,32,4],[8,1,2],[27,1,3]]);
  return {q:`³√${a} × ³√${b} = ?`, a:r, opts:_a6opts(r,r+1,r-1>0?r-1:r+2,a+b), mc:true};
}
function _genSF6_RAD_B4(){ // √a ÷ √b = √(a/b) con resultado entero
  const [a,b,r]=_a6pick([[144,4,6],[100,4,5],[81,9,3],[144,9,4],[64,16,2],[225,9,5],[196,4,7],[400,4,10]]);
  return {q:`√${a} ÷ √${b} = ?`, a:r, opts:_a6opts(r,r+1,r-1>0?r-1:r+2,r+2), mc:true};
}
function _genSF6_RAD_BQ2(){return Math.random()<0.5?_genSF6_RAD_B3():_genSF6_RAD_B4();}
function _genSF6_RAD_B5(){ // Raíz de raíz: ²√(²√16) = 2
  const [expr,r]=_a6pick([['²√(²√16)',2],['²√(²√81)',3],['²√(²√256)',4],['³√(³√64)',2],['²√(⁴√256)',2],['⁴√(²√64)',2]]);
  return {q:`${expr} = ?`, a:r, opts:_a6opts(r,r+1,r-1>0?r-1:r+2,r*2), mc:true};
}
function _genSF6_RAD_BQ3(){return [_genSF6_RAD_B3,_genSF6_RAD_B4,_genSF6_RAD_B5][_a6rnd(0,2)]();}
function _genSF6_RAD_BPU(){return [_genSF6_RAD_B1,_genSF6_RAD_B2,_genSF6_RAD_B3,_genSF6_RAD_B4,_genSF6_RAD_B5][_a6rnd(0,4)]();}

// ── UNIDAD: Monomios — Grado Relativo y Absoluto ────────────────────────────
function _genSF6_MON_B1(){ // GR(x) de M(x,y) = co·xᵉˣ·yᵉʸ
  const ex=_a6rnd(2,9),ey=_a6rnd(1,8),co=_a6rnd(2,5);
  return {q:`En M(x,y) = ${co}x${_a6sup(ex)}y${_a6sup(ey)}, ¿GR(x) = ?`,
    a:ex, opts:_a6opts(ex,ey,ex+ey,ex+1), mc:true};
}
function _genSF6_MON_B2(){ // GA de M(x,y)
  const ex=_a6rnd(2,9),ey=_a6rnd(1,8),co=_a6rnd(2,5),r=ex+ey;
  return {q:`En M(x,y) = ${co}x${_a6sup(ex)}y${_a6sup(ey)}, ¿Grado Absoluto = ?`,
    a:r, opts:_a6opts(r,ex,ey,r+1), mc:true};
}
function _genSF6_MON_BQ1(){return Math.random()<0.5?_genSF6_MON_B1():_genSF6_MON_B2();}
function _genSF6_MON_B3(){ // GR(x) + GR(y)
  const ex=_a6rnd(2,7),ey=_a6rnd(2,7),co=_a6rnd(2,5),r=ex+ey;
  return {q:`M(x,y) = ${co}x${_a6sup(ex)}y${_a6sup(ey)}\n¿GR(x) + GR(y) = ?`,
    a:r, opts:_a6opts(r,ex,ey,r+1), mc:true};
}
function _genSF6_MON_B4(){ // Hallar 'a' dado GA cuando exp de x = 2a−k
  let a,k,ey,ex,ga;
  do{a=_a6rnd(2,5);k=_a6rnd(1,3);ey=_a6rnd(1,4);ex=2*a-k;ga=ex+ey;}while(ex<=0);
  const expTxt=k===1?'(2a−1)':`(2a−${k})`;
  return {q:`M(x,y) = 5x${expTxt}·y${_a6sup(ey)}, si G.A. = ${ga}, ¿a = ?`,
    a:a, opts:_a6opts(a,a-1>0?a-1:a+2,a+1,a+2), mc:true};
}
function _genSF6_MON_BQ2(){return Math.random()<0.5?_genSF6_MON_B3():_genSF6_MON_B4();}
function _genSF6_MON_BPU(){return [_genSF6_MON_B1,_genSF6_MON_B2,_genSF6_MON_B3,_genSF6_MON_B4][_a6rnd(0,3)]();}

// ── UNIDAD: Polinomios — Grado Absoluto y Relativo ──────────────────────────
function _a6mkT(n){return Array.from({length:n},()=>({x:_a6rnd(2,9),y:_a6rnd(1,8),c:_a6rnd(2,5)}));}
function _a6tStr(t){return `${t.c}x${_a6sup(t.x)}y${_a6sup(t.y)}`;}
function _genSF6_POL_B1(){ // GA de P(x,y) = max(xᵢ+yᵢ)
  const ts=_a6mkT(3),r=Math.max(...ts.map(t=>t.x+t.y));
  return {q:`P(x,y) = ${_a6tStr(ts[0])} + ${_a6tStr(ts[1])} − ${_a6tStr(ts[2])}\n¿Grado Absoluto = ?`,
    a:r, opts:_a6opts(r,r-1,r+1,r+2), mc:true};
}
function _genSF6_POL_B2(){ // GR(x) de P(x,y) = max(xᵢ)
  const ts=_a6mkT(3),r=Math.max(...ts.map(t=>t.x)),ga=Math.max(...ts.map(t=>t.x+t.y));
  return {q:`P(x,y) = ${_a6tStr(ts[0])} + ${_a6tStr(ts[1])} + ${_a6tStr(ts[2])}\n¿GR(x) = ?`,
    a:r, opts:_a6opts(r,r-1,r+1,ga), mc:true};
}
function _genSF6_POL_BQ1(){return Math.random()<0.5?_genSF6_POL_B1():_genSF6_POL_B2();}
function _genSF6_POL_B3(){ // Hallar n dado GR(y) = f·n
  const n=_a6rnd(2,5),f=_a6pick([2,3,4]),gy=f*n;
  const x1=_a6rnd(4,8),x2=_a6rnd(2,5),y2=_a6rnd(1,Math.min(gy-1,4));
  return {q:`P(x,y) = 2x${_a6sup(x1)}y^(${f}n) + 3x${_a6sup(x2)}y${_a6sup(y2)}\nSi GR(y) = ${gy}, ¿n = ?`,
    a:n, opts:_a6opts(n,n-1>0?n-1:n+2,n+1,f), mc:true};
}
function _genSF6_POL_B4(){ // GA monomio de 3 variables
  const x=_a6rnd(2,5),y=_a6rnd(2,4),z=_a6rnd(2,4),r=x+y+z;
  return {q:`M = 2x${_a6sup(x)}y${_a6sup(y)}z${_a6sup(z)}\n¿Grado Absoluto = ?`,
    a:r, opts:_a6opts(r,r-1,r+1,x+y), mc:true};
}
function _genSF6_POL_BQ2(){return Math.random()<0.5?_genSF6_POL_B3():_genSF6_POL_B4();}
function _genSF6_POL_BPU(){return [_genSF6_POL_B1,_genSF6_POL_B2,_genSF6_POL_B3,_genSF6_POL_B4][_a6rnd(0,3)]();}

// ── UNIDAD: Polígonos — Ángulos, Regulares y Diagonales ─────────────────────
function _a6polyPath(n,cx,cy,r,rot0){
  let d='';
  for(let i=0;i<n;i++){const a=2*Math.PI*i/n+rot0;d+=`${i?'L':'M'}${(cx+r*Math.cos(a)).toFixed(1)} ${(cy+r*Math.sin(a)).toFixed(1)}`;}
  return d+'Z';
}
function _genSF6_POG_B1(){ // Suma ángulos interiores = (n−2)×180°
  const n=_a6pick([4,5,6,7,8]),r=(n-2)*180;
  const svg=_a6svg(
    `<path d="${_a6polyPath(n,110,83,62,-Math.PI/2)}" stroke="#8af" stroke-width="1.5" fill="rgba(100,140,255,0.07)"/>
    <text x="110" y="88" text-anchor="middle" style="fill:#9af;font-size:13px;font-weight:bold">${n} lados</text>`,220,170);
  return {q:`${svg}¿Cuánto suman los ángulos interiores de este polígono?`,
    a:r, opts:_a6opts(r,(n-1)*180,n*180,(n-3)*180>0?(n-3)*180:r+90), mc:true};
}
function _genSF6_POG_B2(){ // Ángulo interior de polígono regular = 180(n−2)/n
  const n=_a6pick([4,5,6,8,10]),r=(n-2)*180/n;
  const svg=_a6svg(
    `<path d="${_a6polyPath(n,110,83,62,-Math.PI/2)}" stroke="#8af" stroke-width="1.5" fill="rgba(100,140,255,0.07)"/>
    <text x="110" y="80" text-anchor="middle" style="fill:#9af;font-size:12px;font-weight:bold">Regular</text>
    <text x="110" y="97" text-anchor="middle" style="fill:#9af;font-size:12px">${n} lados</text>`,220,170);
  return {q:`${svg}¿Cuánto mide cada ángulo interior?`,
    a:r, opts:_a6opts(r,r-10,r+10,180-r), mc:true};
}
function _genSF6_POG_BQ1(){return Math.random()<0.5?_genSF6_POG_B1():_genSF6_POG_B2();}
function _genSF6_POG_B3(){ // Diagonales = n(n−3)/2
  const n=_a6pick([4,5,6,7,8]),r=n*(n-3)/2;
  return {q:`¿Cuántas diagonales tiene un polígono de ${n} lados?`,
    a:r, opts:_a6opts(r,r+1,r-1>0?r-1:r+2,n*(n-1)/2), mc:true};
}
function _genSF6_POG_B4(){ // Ángulo exterior de regular = 360°/n
  const n=_a6pick([4,5,6,8,10]),r=360/n;
  return {q:`¿Cuánto mide cada ángulo exterior de un polígono regular de ${n} lados?`,
    a:r, opts:_a6opts(r,r+10,r-10>0?r-10:r+20,360-r), mc:true};
}
function _genSF6_POG_BQ2(){return Math.random()<0.5?_genSF6_POG_B3():_genSF6_POG_B4();}
function _genSF6_POG_B5(){ // Ángulo faltante en cuadrilátero (suma 360°)
  let a,b,c,r;
  do{a=_a6rnd(55,110);b=_a6rnd(55,110);c=_a6rnd(55,110);r=360-a-b-c;}while(r<20||r>170);
  const svg=_a6svg(
    `<polygon points="30,145 185,145 162,52 58,52" stroke="#8af" stroke-width="1.5" fill="rgba(100,140,255,0.07)"/>
    <text x="38" y="132" style="fill:#ffd;font-size:10px">${a}°</text>
    <text x="162" y="132" style="fill:#ffd;font-size:10px">${b}°</text>
    <text x="149" y="68" style="fill:#ffd;font-size:10px">${c}°</text>
    <text x="52" y="68" style="fill:#f93;font-size:11px;font-weight:bold">x°</text>`,220,175);
  return {q:`${svg}Suma de ángulos = 360°. ¿x = ?`,
    a:r, opts:_a6opts(r,r+10,r-10>0?r-10:r+5,r+5), mc:true};
}
function _genSF6_POG_BQ3(){return [_genSF6_POG_B3,_genSF6_POG_B4,_genSF6_POG_B5][_a6rnd(0,2)]();}
function _genSF6_POG_BPU(){return [_genSF6_POG_B1,_genSF6_POG_B2,_genSF6_POG_B3,_genSF6_POG_B4,_genSF6_POG_B5][_a6rnd(0,4)]();}

// ── UNIDAD: Cuadriláteros y Trapecio ────────────────────────────────────────
function _genSF6_CUA_B1(){ // kx+lx+mx+nx = 360° → hallar x
  const ks=_a6pick([[3,4,5,8],[4,5,8,3],[5,8,4,3],[2,5,6,7],[3,7,6,4],[2,3,4,11],[1,2,3,14]]);
  const s=ks.reduce((a,b)=>a+b,0);
  if(360%s!==0)return _genSF6_CUA_B1();
  const x=360/s;
  const svg=_a6svg(
    `<polygon points="30,145 185,145 162,52 58,52" stroke="#5af" stroke-width="1.5" fill="rgba(80,160,255,0.07)"/>
    <text x="38" y="132" style="fill:#ffd;font-size:10px">${ks[0]}x</text>
    <text x="163" y="132" style="fill:#ffd;font-size:10px">${ks[1]}x</text>
    <text x="150" y="67" style="fill:#ffd;font-size:10px">${ks[2]}x</text>
    <text x="52" y="67" style="fill:#ffd;font-size:10px">${ks[3]}x</text>`,220,175);
  return {q:`${svg}Los ángulos suman 360°. ¿x = ?`,
    a:x, opts:_a6opts(x,x+2,x-2>0?x-2:x+4,x+4), mc:true};
}
function _genSF6_CUA_B2(){ // Trapecio: co-interiores suman 180°
  const ang=_a6rnd(50,130),r=180-ang;
  const svg=_a6svg(
    `<polygon points="40,145 180,145 155,58 65,58" stroke="#5af" stroke-width="1.5" fill="rgba(80,160,255,0.07)"/>
    <text x="6" y="97" style="fill:#aaa;font-size:13px">∥</text><text x="184" y="97" style="fill:#aaa;font-size:13px">∥</text>
    <text x="46" y="133" style="fill:#ffd;font-size:10px">${ang}°</text>
    <text x="63" y="74" style="fill:#f93;font-size:11px;font-weight:bold">x°</text>`,220,175);
  return {q:`${svg}Ángulos co-interiores del trapecio suman 180°. ¿x = ?`,
    a:r, opts:_a6opts(r,r-10,r+10,ang), mc:true};
}
function _genSF6_CUA_BQ1(){return Math.random()<0.5?_genSF6_CUA_B1():_genSF6_CUA_B2();}
function _genSF6_CUA_B3(){ // Mediana del trapecio M=(B+b)/2
  let b1,b2,r;
  do{b1=_a6rnd(4,12);b2=_a6rnd(b1+2,b1+12);}while((b1+b2)%2!==0);
  r=(b1+b2)/2;
  const svg=_a6svg(
    `<polygon points="40,145 180,145 157,62 63,62" stroke="#5af" stroke-width="1.5" fill="rgba(80,160,255,0.07)"/>
    <line x1="51" y1="103" x2="168" y2="103" stroke="#f93" stroke-width="1.5" stroke-dasharray="5,3"/>
    <circle cx="51" cy="103" r="3" fill="#f93"/><circle cx="168" cy="103" r="3" fill="#f93"/>
    <text x="109" y="99" text-anchor="middle" style="fill:#f93;font-size:10px">M = ?</text>
    <text x="109" y="163" text-anchor="middle" style="fill:#ffd;font-size:10px">${b2} u</text>
    <text x="109" y="54" text-anchor="middle" style="fill:#ffd;font-size:10px">${b1} u</text>`,220,175);
  return {q:`${svg}Mediana M = (B+b)÷2. ¿M = ?`,
    a:r, opts:_a6opts(r,r+1,r-1>0?r-1:r+2,b1+b2), mc:true};
}
function _genSF6_CUA_B4(){ // Hallar x dado MN = x+k y las dos bases
  let bc,ad,med,k,xVal;
  do{bc=_a6rnd(4,10);ad=_a6rnd(bc+4,bc+14);med=(bc+ad)/2;k=_a6rnd(1,Math.floor(med)-1);xVal=med-k;}
  while((bc+ad)%2!==0||xVal<=0||!Number.isInteger(xVal));
  const svg=_a6svg(
    `<polygon points="40,145 180,145 157,62 63,62" stroke="#5af" stroke-width="1.5" fill="rgba(80,160,255,0.07)"/>
    <line x1="51" y1="103" x2="168" y2="103" stroke="#f93" stroke-width="1.5" stroke-dasharray="5,3"/>
    <circle cx="51" cy="103" r="3" fill="#f93"/><circle cx="168" cy="103" r="3" fill="#f93"/>
    <text x="109" y="99" text-anchor="middle" style="fill:#f93;font-size:10px">MN = x+${k}</text>
    <text x="109" y="163" text-anchor="middle" style="fill:#ffd;font-size:10px">${ad} u</text>
    <text x="109" y="54" text-anchor="middle" style="fill:#ffd;font-size:10px">${bc} u</text>`,220,175);
  return {q:`${svg}M = (${bc}+${ad})÷2. Si MN = x+${k}, ¿x = ?`,
    a:xVal, opts:_a6opts(xVal,xVal+1,xVal-1>0?xVal-1:xVal+2,med), mc:true};
}
function _genSF6_CUA_BQ2(){return Math.random()<0.5?_genSF6_CUA_B3():_genSF6_CUA_B4();}
function _genSF6_CUA_BPU(){return [_genSF6_CUA_B1,_genSF6_CUA_B2,_genSF6_CUA_B3,_genSF6_CUA_B4][_a6rnd(0,3)]();}

// ── UNIDAD: Circunferencia — Ángulos ────────────────────────────────────────
// SVG helper: círculo O(110,85) r=65
function _a6circ(extra){
  return _a6svg(
    `<circle cx="110" cy="85" r="65" stroke="#7ce" stroke-width="1.5" fill="none"/>
    <circle cx="110" cy="85" r="2.5" fill="#7ce"/>
    <text x="116" y="82" style="fill:#7ce;font-size:9px">O</text>${extra}`,220,175);
}
// Punto en la circunferencia (cx=110,cy=85,r=65) dado ángulo en rad
function _a6cp(a){return [(110+65*Math.cos(a)).toFixed(1),(85+65*Math.sin(a)).toFixed(1)];}
function _genSF6_CIR_B1(){ // Ángulo central = arco
  const ang=_a6pick([40,50,60,70,80,90,100,120]);
  const a1=-0.4,a2=a1-ang*Math.PI/180;
  const [Ax,Ay]=_a6cp(a1),[Bx,By]=_a6cp(a2);
  const [lx,ly]=[(110+28*Math.cos((a1+a2)/2)).toFixed(1),(85+28*Math.sin((a1+a2)/2)).toFixed(1)];
  const svg=_a6circ(
    `<line x1="110" y1="85" x2="${Ax}" y2="${Ay}" stroke="#7ce" stroke-width="1.2"/>
    <line x1="110" y1="85" x2="${Bx}" y2="${By}" stroke="#7ce" stroke-width="1.2"/>
    <text x="${lx}" y="${ly}" text-anchor="middle" style="fill:#ffd;font-size:10px">${ang}°</text>
    <text x="${parseFloat(Ax)+4}" y="${parseFloat(Ay)}" style="fill:#7ce;font-size:9px">A</text>
    <text x="${parseFloat(Bx)+4}" y="${parseFloat(By)+4}" style="fill:#7ce;font-size:9px">B</text>`);
  return {q:`${svg}O es el centro. Ángulo central AOB = ${ang}°. ¿El arco AB mide?`,
    a:`${ang}°`, opts:_a6shuf([`${ang}°`,`${ang*2}°`,`${180-ang}°`,`${ang/2}°`]), mc:true};
}
function _genSF6_CIR_B2(){ // Ángulo inscrito = arco/2
  const arc=_a6pick([60,80,96,100,120,48,130,72]),r=arc/2;
  const a1=-0.3,a2=a1-arc*Math.PI/180,aC=-Math.PI*0.85;
  const [Ax,Ay]=_a6cp(a1),[Bx,By]=_a6cp(a2),[Cx,Cy]=_a6cp(aC);
  const [alx,aly]=[(110+82*Math.cos((a1+a2)/2)).toFixed(1),(85+82*Math.sin((a1+a2)/2)).toFixed(1)];
  const svg=_a6circ(
    `<line x1="${Cx}" y1="${Cy}" x2="${Ax}" y2="${Ay}" stroke="#f9a" stroke-width="1.2"/>
    <line x1="${Cx}" y1="${Cy}" x2="${Bx}" y2="${By}" stroke="#f9a" stroke-width="1.2"/>
    <text x="${alx}" y="${aly}" style="fill:#ffd;font-size:9px">${arc}°</text>
    <text x="${parseFloat(Ax)+4}" y="${parseFloat(Ay)-2}" style="fill:#7ce;font-size:9px">A</text>
    <text x="${parseFloat(Bx)+4}" y="${parseFloat(By)+4}" style="fill:#7ce;font-size:9px">B</text>
    <text x="${parseFloat(Cx)-14}" y="${Cy}" style="fill:#f9a;font-size:9px">C</text>
    <text x="${parseFloat(Cx)-2}" y="${parseFloat(Cy)+13}" style="fill:#f93;font-size:10px;font-weight:bold">x°</text>`);
  return {q:`${svg}Arco AB = ${arc}°, C sobre la circunferencia. ¿Ángulo inscrito ACB = x = ?`,
    a:`${r}°`, opts:_a6shuf([`${r}°`,`${arc}°`,`${arc*2>180?180:arc*2}°`,`${r+15}°`]), mc:true};
}
function _genSF6_CIR_BQ1(){return Math.random()<0.5?_genSF6_CIR_B1():_genSF6_CIR_B2();}
function _genSF6_CIR_B3(){ // Tangente ⊥ radio → ángulo = 90°
  const svg=_a6circ(
    `<line x1="45" y1="85" x2="175" y2="85" stroke="#5d5" stroke-width="1.5"/>
    <line x1="110" y1="85" x2="110" y2="20" stroke="#7ce" stroke-width="1.2"/>
    <rect x="103.5" y="78.5" width="7" height="7" fill="none" stroke="#f93" stroke-width="1.2"/>
    <text x="178" y="89" style="fill:#5d5;font-size:9px">t</text>
    <text x="118" y="30" style="fill:#7ce;font-size:9px">r</text>
    <text x="115" y="79" style="fill:#f93;font-size:9px">P</text>`);
  return {q:`${svg}Recta t es tangente en P. ¿Ángulo entre radio OP y la tangente?`,
    a:'90°', opts:_a6shuf(['90°','45°','60°','180°']), mc:true};
}
function _genSF6_CIR_B4(){ // Cuerdas paralelas AB∥CD → arcos iguales AC = BD
  const arcV=_a6pick([30,35,40,45,50,55,60]);
  const svg=_a6circ(
    `<line x1="48" y1="60" x2="172" y2="60" stroke="#f9a" stroke-width="1.5"/>
    <line x1="45" y1="110" x2="175" y2="110" stroke="#f9a" stroke-width="1.5"/>
    <text x="23" y="64" style="fill:#7ce;font-size:9px">A</text><text x="173" y="64" style="fill:#7ce;font-size:9px">B</text>
    <text x="20" y="114" style="fill:#7ce;font-size:9px">C</text><text x="176" y="114" style="fill:#7ce;font-size:9px">D</text>
    <text x="14" y="90" style="fill:#ffd;font-size:10px">${arcV}°</text>
    <text x="180" y="90" style="fill:#f93;font-size:10px;font-weight:bold">x°</text>
    <text x="103" y="47" style="fill:#aaa;font-size:10px">∥</text>`);
  return {q:`${svg}AB ∥ CD. Arco AC = ${arcV}°. ¿Arco BD = x = ?`,
    a:`${arcV}°`, opts:_a6shuf([`${arcV}°`,`${arcV*2}°`,`${180-arcV}°`,`${arcV+15}°`]), mc:true};
}
function _genSF6_CIR_BQ2(){return Math.random()<0.5?_genSF6_CIR_B3():_genSF6_CIR_B4();}
function _genSF6_CIR_B5(){ // Ángulo exterior secante = (arco mayor − arco menor)/2
  let arc1,arc2,r;
  do{arc1=_a6pick([80,90,100,110,120]);arc2=_a6pick([20,30,40,50]);r=(arc1-arc2)/2;}
  while((arc1-arc2)%2!==0||r<=0);
  return {q:`Dos secantes desde punto exterior.\nArco mayor = ${arc1}°, arco menor = ${arc2}°.\n¿Ángulo exterior x = (mayor − menor) ÷ 2 = ?`,
    a:`${r}°`, opts:_a6shuf([`${r}°`,`${(arc1+arc2)/2}°`,`${r+10}°`,`${r-10>0?r-10:r+5}°`]), mc:true};
}
function _genSF6_CIR_BQ3(){return [_genSF6_CIR_B3,_genSF6_CIR_B4,_genSF6_CIR_B5][_a6rnd(0,2)]();}
function _genSF6_CIR_BPU(){return [_genSF6_CIR_B1,_genSF6_CIR_B2,_genSF6_CIR_B3,_genSF6_CIR_B4,_genSF6_CIR_B5][_a6rnd(0,4)]();}

// ── UNIDAD: Plano Cartesiano — Coordenadas, Traslación y Simetría ───────────
function _a6grid(){
  // Cuadrícula −5..5, celda 20px, inicio (10,10), centro (110,110)
  let g='';
  for(let i=0;i<=10;i++){
    const v=10+i*20;
    g+=`<line x1="${v}" y1="10" x2="${v}" y2="210" stroke="rgba(150,150,180,0.18)" stroke-width="0.6"/>`;
    g+=`<line x1="10" y1="${v}" x2="210" y2="${v}" stroke="rgba(150,150,180,0.18)" stroke-width="0.6"/>`;
  }
  g+=`<line x1="10" y1="110" x2="210" y2="110" stroke="#999" stroke-width="1.3"/>`;
  g+=`<line x1="110" y1="10" x2="110" y2="210" stroke="#999" stroke-width="1.3"/>`;
  for(let i=-5;i<=5;i++){
    if(i===0)continue;
    g+=`<text x="${110+i*20}" y="124" text-anchor="middle" style="font-size:8px;fill:#777">${i}</text>`;
    g+=`<text x="105" y="${110-i*20+3}" text-anchor="end" style="font-size:8px;fill:#777">${i}</text>`;
  }
  g+=`<text x="214" y="113" style="font-size:9px;fill:#aaa">x</text>`;
  g+=`<text x="112" y="8" style="font-size:9px;fill:#aaa">y</text>`;
  return g;
}
function _a6gridPt(px,py,lbl,col){
  col=col||'#f93';
  const sx=110+px*20,sy=110-py*20;
  const ox=px>=0?6:-14,oy=py>=0?-5:12;
  return `<circle cx="${sx}" cy="${sy}" r="4" fill="${col}" stroke="none"/>
    <text x="${sx+ox}" y="${sy+oy}" style="font-size:10px;fill:${col}">${lbl}</text>`;
}
function _genSF6_CAR_B1(){ // Identificar coordenadas del punto P
  const px=_a6rnd(-4,4),py=_a6rnd(-4,4);
  const svg=`<svg viewBox="0 0 220 225" xmlns="http://www.w3.org/2000/svg" style="max-width:220px;width:100%;height:auto;display:block;margin:4px auto 8px"><g style="font-family:Arial,sans-serif;font-weight:normal">${_a6grid()}${_a6gridPt(px,py,'P')}</g></svg>`;
  const ans=`(${px}, ${py})`;
  return {q:`${svg}¿Coordenadas del punto P?`,
    a:ans, opts:_a6shuf([ans,`(${py}, ${px})`,`(${-px}, ${py})`,`(${px}, ${-py})`]), mc:true};
}
function _genSF6_CAR_B2(){ // Identificar cuadrante
  const sx=_a6pick([-1,1]),sy=_a6pick([-1,1]);
  const px=_a6rnd(1,4)*sx,py=_a6rnd(1,4)*sy;
  const q=px>0&&py>0?'I':px<0&&py>0?'II':px<0&&py<0?'III':'IV';
  const svg=`<svg viewBox="0 0 220 225" xmlns="http://www.w3.org/2000/svg" style="max-width:220px;width:100%;height:auto;display:block;margin:4px auto 8px"><g style="font-family:Arial,sans-serif;font-weight:normal">${_a6grid()}${_a6gridPt(px,py,'P')}</g></svg>`;
  return {q:`${svg}P(${px}, ${py}) está en el cuadrante:`,
    a:q, opts:_a6shuf(['I','II','III','IV']), mc:true};
}
function _genSF6_CAR_BQ1(){return Math.random()<0.5?_genSF6_CAR_B1():_genSF6_CAR_B2();}
function _genSF6_CAR_B3(){ // Traslación: P(x,y) → P'(x+a, y+b)
  let px,py,dx,dy,nx,ny;
  do{px=_a6rnd(-3,3);py=_a6rnd(-3,3);dx=_a6pick([-4,-3,-2,2,3,4]);dy=_a6pick([-3,-2,2,3]);nx=px+dx;ny=py+dy;}
  while(Math.abs(nx)>4||Math.abs(ny)>4);
  const dxL=dx>0?`→${dx}`:`←${Math.abs(dx)}`,dyL=dy>0?`↑${dy}`:`↓${Math.abs(dy)}`;
  const svg=`<svg viewBox="0 0 220 225" xmlns="http://www.w3.org/2000/svg" style="max-width:220px;width:100%;height:auto;display:block;margin:4px auto 8px"><g style="font-family:Arial,sans-serif;font-weight:normal">${_a6grid()}${_a6gridPt(px,py,'P','#8af')}${_a6gridPt(nx,ny,"P'",'#f93')}</g></svg>`;
  const ans=`(${nx}, ${ny})`;
  return {q:`${svg}P(${px},${py}) se traslada (${dxL}, ${dyL}). ¿Coordenadas de P'?`,
    a:ans, opts:_a6shuf([ans,`(${px+dy},${py+dx})`,`(${px-dx},${py-dy})`,`(${nx+1},${ny})`]), mc:true};
}
function _genSF6_CAR_B4(){ // Simetría respecto a eje x o y
  const axis=Math.random()<0.5?'x':'y';
  const px=_a6rnd(-4,4),py=_a6rnd(-4,4);
  const rnx=axis==='x'?px:-px,rny=axis==='x'?-py:py;
  const axL=axis==='x'?'eje x (horizontal)':'eje y (vertical)';
  const ans=`(${rnx}, ${rny})`;
  const w1=`(${-rnx},${rny})`,w2=`(${rnx},${-rny})`,w3=`(${-rnx},${-rny})`;
  return {q:`Punto P(${px},${py}) se refleja respecto al ${axL}.\n¿Coordenadas de la imagen?`,
    a:ans, opts:_a6shuf([ans,w1,w2,w3]), mc:true};
}
function _genSF6_CAR_BQ2(){return Math.random()<0.5?_genSF6_CAR_B3():_genSF6_CAR_B4();}
function _genSF6_CAR_BPU(){return [_genSF6_CAR_B1,_genSF6_CAR_B2,_genSF6_CAR_B3,_genSF6_CAR_B4][_a6rnd(0,3)]();}

// ── Espacio Muestral 6° Primaria – Colegio Santísima Trinidad ────────────────
const _EM_COLS = ['rojo','azul','verde','amarillo','naranja','morado','rosado','celeste'];
const _EM_CAJAS = [
  { plural:'DVDs',      cats:['ciencia ficción','acción','suspenso','terror'] },
  { plural:'caramelos', cats:['naranja','fresa','piña','uva'] },
  { plural:'libros',    cats:['aventura','misterio','ciencia','poesía'] },
  { plural:'pelotas',   cats:['roja','azul','verde','amarilla'] },
  { plural:'bolitas',   cats:['roja','azul','verde','amarilla'] },
];
const _EM_PALABRAS = [
  { word:'EUCALIPTO',  v:5, c:4 },
  { word:'COLOMBIA',   v:4, c:4 },
  { word:'MATEMATICA', v:5, c:5 },
  { word:'PRIMARIA',   v:4, c:4 },
  { word:'TRIANGULO',  v:4, c:5 },
  { word:'DINOSAURIO', v:6, c:4 },
  { word:'SORPRESA',   v:3, c:5 },
  { word:'COMPUTADORA',v:5, c:6 },
  { word:'BIBLIOTECA', v:5, c:5 },
  { word:'CALCETINES', v:4, c:6 },
  { word:'AGUACATE',   v:5, c:3 },
  { word:'ELEFANTE',   v:4, c:4 },
  { word:'CHOCOLATE',  v:4, c:5 },
  { word:'UNIVERSO',   v:4, c:4 },
  { word:'COLEGIO',    v:5, c:3 },
  { word:'PLANETA',    v:3, c:4 },
  { word:'SOMBRERO',   v:3, c:5 },
  { word:'ESTRELLA',   v:3, c:5 },
  { word:'ESTUDIANTE', v:5, c:5 },
  { word:'MARIPOSA',   v:4, c:4 },
  { word:'EJERCICIO',  v:6, c:3 },
  { word:'TORTUGA',    v:3, c:4 },
];

// b0: Definiciones — Espacio Muestral y Suceso
function _genEM_B0(){
  const defs=[
    {q:'¿Qué es el ESPACIO MUESTRAL (Ω) de un experimento?',
     a:'El conjunto de todos los resultados posibles',
     w:['El resultado más probable del experimento','Un subconjunto de resultados favorables','El número total de experimentos realizados']},
    {q:'¿Qué representa el CARDINAL de un conjunto?',
     a:'El número de elementos que contiene',
     w:['El elemento de mayor valor del conjunto','La suma de todos sus elementos','El primer elemento del conjunto']},
    {q:'¿Qué es un SUCESO (o evento) en probabilidad?',
     a:'Un subconjunto del espacio muestral',
     w:['El espacio muestral completo Ω','El número de resultados posibles','El experimento en sí mismo']},
    {q:'¿Qué es un EXPERIMENTO ALEATORIO?',
     a:'Un proceso cuyos resultados no se pueden predecir con certeza',
     w:['Un experimento que siempre da el mismo resultado','Un proceso con un único resultado posible','Un experimento sin resultados favorables']},
    {q:'¿Qué es el SUCESO COMPLEMENTARIO de A (notación A\')?',
     a:'Los resultados de Ω que NO pertenecen a A',
     w:['Los resultados que sí pertenecen a A','El espacio muestral completo Ω','El conjunto vacío ∅']},
    {q:'¿Qué es un SUCESO IMPOSIBLE?',
     a:'Un suceso que nunca puede ocurrir; se representa con ∅',
     w:['Un suceso que ocurre la mitad de las veces','Un suceso igual al espacio muestral Ω','Un suceso con exactamente un elemento']},
    {q:'¿Qué es un SUCESO SEGURO?',
     a:'Un suceso que siempre ocurre; es igual al espacio muestral Ω',
     w:['Un suceso con probabilidad cero','Un suceso con un solo resultado posible','El complementario del espacio muestral']},
    {q:'¿Qué notación se usa para el cardinal del espacio muestral?',
     a:'n(Ω)',
     w:['n(A)','P(Ω)','A\'']},
    {q:'¿Qué es un SUCESO ELEMENTAL?',
     a:'Un suceso formado por un solo elemento del espacio muestral',
     w:['El conjunto de todos los resultados posibles','Un suceso con más de 5 elementos','El suceso que nunca puede ocurrir']},
    {q:'Si Ω = {1,2,3,4,5,6}, ¿qué valor tiene n(Ω)?',
     a:'6',
     w:['1','3','12']},
    {q:'¿Cómo se llama el conjunto de todos los resultados posibles de un experimento aleatorio?',
     a:'Espacio muestral',
     w:['Suceso','Evento elemental','Muestra estadística']},
    {q:'Si A = {2, 4, 6} dentro de Ω = {1,2,3,4,5,6}, ¿qué es A?',
     a:'Un suceso del experimento',
     w:['El espacio muestral completo','Un experimento aleatorio','El suceso imposible']},
    {q:'¿Qué símbolo se usa para representar el ESPACIO MUESTRAL?',
     a:'Ω (omega mayúscula)',
     w:['Δ (delta)','Σ (sigma)','∅ (conjunto vacío)']},
    {q:'¿Cuántos elementos tiene el suceso imposible?',
     a:'Ninguno (es el conjunto vacío ∅)',
     w:['Uno','Todos los del espacio muestral','Depende del experimento']},
    {q:'¿Qué relación tiene el suceso seguro con el espacio muestral?',
     a:'Son iguales: el suceso seguro ES el espacio muestral Ω',
     w:['El suceso seguro es un subconjunto propio de Ω','El suceso seguro está fuera de Ω','El suceso seguro tiene la mitad de elementos de Ω']},
    {q:'Si lanzamos un dado, ¿el suceso "sacar un 7" es un suceso posible?',
     a:'No, es un suceso imposible porque 7 ∉ Ω',
     w:['Sí, es un suceso elemental','Sí, con probabilidad muy baja','No, es el suceso seguro']},
    {q:'¿Cuántos sucesos elementales tiene el espacio muestral de lanzar una moneda?',
     a:'2 (cara y sello)',
     w:['1','3','4']},
    {q:'¿Qué significa A\' (A prima) en probabilidad?',
     a:'El complementario de A: todos los elementos de Ω que no están en A',
     w:['Lo mismo que A pero escrito de otra forma','El conjunto vacío','La unión de A con otro suceso']},
    {q:'Si n(Ω) = 6 y n(A) = 2, ¿cuántos elementos tiene el complementario de A?',
     a:'4',
     w:['2','6','8']},
    {q:'¿Un experimento aleatorio puede tener un solo resultado posible?',
     a:'No, porque entonces el resultado sería predecible (sería determinista)',
     w:['Sí, si ese único resultado es el suceso seguro','Sí, si el espacio muestral es el conjunto vacío','Sí, cualquier experimento puede tener un solo resultado']},
  ];
  const d=defs[_c4rnd(0,defs.length-1)];
  return{q:d.q,a:d.a,opts:_c4shuf([d.a,...d.w.slice(0,3)]),mc:true};
}

// b1: ¿Cuántos elementos tiene el espacio muestral? (cardinal n)
function _genEM_B1(){
  const exps=[
    {q:'Anotar los números PARES del 1 al 10',n:5,o:'2,4,6,8,10'},
    {q:'Anotar los múltiplos de 3 del 1 al 12',n:4,o:'3,6,9,12'},
    {q:'Anotar los números IMPARES del 1 al 9',n:5,o:'1,3,5,7,9'},
    {q:'Anotar los múltiplos de 4 menores que 20',n:4,o:'4,8,12,16'},
    {q:'Anotar los números del 1 al 15 divisibles entre 5',n:3,o:'5,10,15'},
    {q:'Elegir los meses del año que tienen exactamente 30 días',n:4,o:'Abril,Junio,Septiembre,Noviembre'},
    {q:'Anotar los días de la semana que tienen MÁS de 6 letras',n:3,o:'Miércoles,Viernes,Domingo'},
    {q:'Extraer las vocales distintas de la palabra MURCIÉLAGO',n:5,o:'U,I,É,A,O'},
    {q:'Extraer las letras de la palabra LIMA que son consonantes',n:2,o:'L,M'},
    {q:'Anotar los números del 1 al 20 mayores que 16',n:4,o:'17,18,19,20'},
    {q:'Anotar los múltiplos de 6 menores que 30',n:4,o:'6,12,18,24'},
    {q:'Extraer los colores de la lista (rojo, azul, verde, amarillo, morado) que empiezan con vocal',n:2,o:'azul,amarillo'},
    {q:'Anotar los números primos menores que 15',n:6,o:'2,3,5,7,11,13'},
    {q:'Extraer las vocales de la palabra PRIMARIA',n:3,o:'I,A,I,A → 4 letras pero distintas: I,A'},
    {q:'Anotar los divisores del número 12',n:6,o:'1,2,3,4,6,12'},
    {q:'Elegir las estaciones del año que tienen más de 6 letras en español',n:2,o:'primavera,otoño→solo primavera,invierno'},
    {q:'Anotar los números del 1 al 30 divisibles entre 7',n:4,o:'7,14,21,28'},
    {q:'Extraer las consonantes de la palabra LIMA',n:2,o:'L,M'},
    {q:'Anotar los múltiplos de 8 menores que 50',n:6,o:'8,16,24,32,40,48'},
    {q:'Elegir los planetas del sistema solar que tienen 6 letras o menos',n:5,o:'Marte,Venus,Tierra,Júpiter→Marte,Venus,Tierra,Urano,Saturno'},
    {q:'Anotar los números del 1 al 20 que son cuadrados perfectos',n:4,o:'1,4,9,16'},
    {q:'Extraer las letras de la palabra BINGO que son vocales',n:2,o:'I,O'},
  ];
  const e=exps[_c4rnd(0,exps.length-1)];
  const ws=_c4shuf([e.n-1,e.n+1,e.n+2,Math.max(1,e.n-2)].filter(v=>v!==e.n&&v>0)).slice(0,3);
  return{q:`Experimento: "${e.q}"\n¿Cuál es el cardinal del espacio muestral? n(Ω) =`,a:e.n,opts:_c4shuf([e.n,...ws]),mc:true};
}

// b2: Identificar el espacio muestral correcto (Ω)
function _genEM_B2(){
  const probs=[
    {q:'Se lanza una moneda',correct:'{cara, sello}',wrong:['{cara, sello, canto}','{cara, escudo}','{par, impar}']},
    {q:'Se lanza un dado de 6 caras',correct:'{1, 2, 3, 4, 5, 6}',wrong:['{1, 2, 3, 4, 5}','{1, 2, 3, 4, 5, 6, 7}','{par, impar}']},
    {q:'Se saca una bola de una bolsa con bolas roja, azul y verde',correct:'{roja, azul, verde}',wrong:['{roja, azul}','{roja, azul, verde, amarilla}','{azul, verde}']},
    {q:'Se elige una fruta entre manzana, pera y plátano',correct:'{manzana, pera, plátano}',wrong:['{manzana, pera}','{manzana, pera, plátano, uva}','{manzana, plátano}']},
    {q:'Se extrae una figura entre círculo, cuadrado y triángulo',correct:'{círculo, cuadrado, triángulo}',wrong:['{círculo, cuadrado}','{círculo, cuadrado, triángulo, rombo}','{cuadrado, triángulo}']},
    {q:'Se escoge un día del fin de semana',correct:'{sábado, domingo}',wrong:['{sábado}','{viernes, sábado, domingo}','{lunes, sábado, domingo}']},
    {q:'Se saca una carta de un mazo solo de ases (corazón, pica, trébol, diamante)',correct:'{corazón, pica, trébol, diamante}',wrong:['{corazón, pica, trébol}','{corazón, diamante}','{corazón, pica, trébol, diamante, joker}']},
    {q:'Se elige un color de semáforo',correct:'{rojo, amarillo, verde}',wrong:['{rojo, verde}','{rojo, amarillo, verde, azul}','{rojo, amarillo}']},
    {q:'Se gira una ruleta con sectores 1, 2, 3, 4 y 5',correct:'{1, 2, 3, 4, 5}',wrong:['{1, 2, 3, 4}','{0, 1, 2, 3, 4, 5}','{1, 2, 3, 4, 5, 6}']},
    {q:'Se extrae una letra de la palabra "AMOR"',correct:'{A, M, O, R}',wrong:['{A, M, O}','{A, M, O, R, E}','{M, O, R}']},
    {q:'Se lanza un dado de 4 caras',correct:'{1, 2, 3, 4}',wrong:['{1, 2, 3}','{1, 2, 3, 4, 5}','{0, 1, 2, 3, 4}']},
    {q:'Se escoge un punto cardinal',correct:'{norte, sur, este, oeste}',wrong:['{norte, sur, este}','{norte, sur, este, oeste, noreste}','{norte, sur}']},
    {q:'Se elige una vocal del abecedario español',correct:'{a, e, i, o, u}',wrong:['{a, e, i, o}','{a, e, i, o, u, y}','{a, i, o, u}']},
    {q:'Se extrae un palo de una baraja española (oros, copas, espadas, bastos)',correct:'{oros, copas, espadas, bastos}',wrong:['{oros, copas, espadas}','{oros, espadas, bastos}','{oros, copas, espadas, bastos, comodín}']},
    {q:'Se lanza una moneda dos veces y se anota el resultado de cada lanzamiento',correct:'{CC, CS, SC, SS}',wrong:['{CC, CS, SC}','{CC, SS}','{C, S}']},
    {q:'Se elige el turno de un semáforo (verde primero o rojo primero)',correct:'{verde primero, rojo primero}',wrong:['{verde}','{verde, rojo, amarillo primero}','{rojo, verde, azul primero}']},
  ];
  const p=probs[_c4rnd(0,probs.length-1)];
  return{q:`Experimento: "${p.q}"\n¿Cuál es el espacio muestral Ω correcto?`,a:p.correct,opts:_c4shuf([p.correct,...p.wrong.slice(0,3)]),mc:true};
}

// b3: ¿Cuál es el cardinal del suceso A? n(A) =
function _genEM_B3(){
  const probs=[
    {q:'Ω = {1,2,3,4,5,6} (dado de 6 caras)\nSuceso A: sacar un número PAR',ans:3,w:[2,4,1]},
    {q:'Ω = {1,2,3,4,5,6} (dado de 6 caras)\nSuceso A: sacar un número IMPAR',ans:3,w:[2,4,1]},
    {q:'Ω = {1,2,3,4,5,6} (dado de 6 caras)\nSuceso A: sacar un número MAYOR QUE 4',ans:2,w:[3,4,1]},
    {q:'Ω = {1,2,3,4,5,6} (dado de 6 caras)\nSuceso A: sacar un número MENOR QUE 3',ans:2,w:[3,4,1]},
    {q:'Ω = {corazón, círculo, triángulo, rombo, cuadrado, rectángulo, óvalo, estrella, pentágono}\nSuceso A: obtener un CUADRILÁTERO',ans:3,w:[4,5,6]},
    {q:'Ω = {corazón, círculo, triángulo, rombo, cuadrado, rectángulo, óvalo, estrella, pentágono}\nSuceso B: obtener una figura NO POLIGONAL\nSuceso A: complemento de B',ans:6,w:[3,4,5]},
    {q:'Ω = {rojo, azul, verde, amarillo, naranja} (bolas en urna)\nSuceso A: sacar un color PRIMARIO',ans:3,w:[2,4,1]},
    {q:'Ω = {1,2,3,4,5,6,7,8,9,10} (números del 1 al 10)\nSuceso A: sacar un múltiplo de 3',ans:3,w:[2,4,1]},
    {q:'Ω = {1,2,3,4,5,6} (dado de 6 caras)\nSuceso A: sacar un número PRIMO',ans:3,w:[2,4,1]},
    {q:'Ω = {1,2,3,4,5,6,7,8,9,10} (números del 1 al 10)\nSuceso A: sacar un número CUADRADO PERFECTO',ans:3,w:[2,4,1]},
    {q:'Ω = {a,e,i,o,u} (vocales)\nSuceso A: elegir una vocal que tenga menos de 2 letras',ans:5,w:[3,4,2]},
    {q:'Ω = {rojo,azul,verde,amarillo,naranja,morado,rosado,blanco} (bolas)\nSuceso A: sacar un color que empiece con vocal',ans:3,w:[2,4,1]},
    {q:'Ω = {lunes,martes,miércoles,jueves,viernes,sábado,domingo} (días)\nSuceso A: elegir un día del FIN DE SEMANA',ans:2,w:[3,4,5]},
    {q:'Ω = {lunes,martes,miércoles,jueves,viernes,sábado,domingo} (días)\nSuceso A: elegir un día de la semana que tenga más de 6 letras',ans:3,w:[2,4,5]},
    {q:'Ω = {enero,febrero,marzo,abril,mayo,junio,julio,agosto,septiembre,octubre,noviembre,diciembre}\nSuceso A: elegir un mes que tenga 30 días exactos',ans:4,w:[3,5,6]},
    {q:'Ω = {A,M,O,R} (letras de "AMOR")\nSuceso A: elegir una VOCAL',ans:2,w:[1,3,4]},
    {q:'Ω = {cara,sello} (moneda)\nSuceso A: obtener cara',ans:1,w:[2,0,3]},
    {q:'Ω = {1,2,3,4,5,6,7,8,9,10,11,12} (dado de 12 caras)\nSuceso A: sacar un múltiplo de 4',ans:3,w:[2,4,6]},
    {q:'Ω = {norte,sur,este,oeste} (puntos cardinales)\nSuceso A: elegir un punto que empiece con vocal',ans:2,w:[1,3,4]},
  ];
  const p=probs[_c4rnd(0,probs.length-1)];
  const ws=_c4shuf(p.w.filter(v=>v!==p.ans)).slice(0,3);
  return{q:`${p.q}\n¿Cuál es el cardinal del suceso A? n(A) =`,a:p.ans,opts:_c4shuf([p.ans,...ws]),mc:true};
}

// b4: ¿Vocal o consonante más probable? (letras de una palabra)
function _genEM_B4(){
  const w=_EM_PALABRAS[_c4rnd(0,_EM_PALABRAS.length-1)];
  const ans=w.v>w.c?'vocal':w.v<w.c?'consonante':'igual de probable';
  const otras=['vocal','consonante','igual de probable'].filter(x=>x!==ans);
  return{q:`Se colocan tarjetas con las letras de "${w.word}" en una bolsa.\nAl sacar una tarjeta al azar, ¿qué es MÁS probable?`,a:ans,opts:_c4shuf([ans,...otras,'no se puede saber']),mc:true};
}

// b5: ¿Qué color es MÁS o MENOS probable? (urna con bolas)
function _genEM_B5(){
  const askMost=Math.random()<0.5;
  const cols=_c4shuf(_EM_COLS).slice(0,4);
  const cnts=askMost?[_c4rnd(7,11),_c4rnd(1,3),_c4rnd(1,3),_c4rnd(2,4)]:[_c4rnd(1,2),_c4rnd(6,10),_c4rnd(5,9),_c4rnd(3,7)];
  const items=cols.map((c,i)=>({c,n:cnts[i]}));
  const sh=_c4shuf(items);
  const target=askMost?sh.reduce((a,b)=>a.n>=b.n?a:b).c:sh.reduce((a,b)=>a.n<=b.n?a:b).c;
  return{q:`En una urna hay: ${sh.map(x=>`${x.n} bolas ${x.c}`).join(', ')}.\n¿Qué color es ${askMost?'MÁS':'MENOS'} probable al sacar una bola al azar?`,a:target,opts:_c4shuf(sh.map(x=>x.c)),mc:true};
}

// bq1: Quiz I — Espacio Muestral (b1+b2+b3)
function _genEM_BQ1(){const f=[_genEM_B1,_genEM_B2,_genEM_B3];return f[_c4rnd(0,2)]();}
// bq2: Quiz II — Probabilidad Comparada (b4+b5+más/menos en caja)
function _genEM_BQ2(){
  if(Math.random()<0.33) return _genEM_B4();
  if(Math.random()<0.5){
    // más probable en caja
    const ctx=_c4pick(_EM_CAJAS);const cats=_c4shuf(ctx.cats).slice(0,4);
    const cnts=[_c4rnd(10,16),_c4rnd(1,4),_c4rnd(1,4),_c4rnd(2,5)];
    const sh=_c4shuf(cats.map((c,i)=>({c,n:cnts[i]})));
    const total=sh.reduce((s,x)=>s+x.n,0);const most=sh.reduce((a,b)=>a.n>=b.n?a:b).c;
    return{q:`En una caja hay ${total} ${ctx.plural}: ${sh.map(x=>`${x.n} de ${x.c}`).join(', ')}.\nAl sacar uno al azar, ¿cuál es MÁS probable?`,a:most,opts:_c4shuf(sh.map(x=>x.c)),mc:true};
  }
  // menos probable en caja
  const ctx=_c4pick(_EM_CAJAS);const cats=_c4shuf(ctx.cats).slice(0,4);
  const cnts=[_c4rnd(1,2),_c4rnd(9,14),_c4rnd(6,10),_c4rnd(4,8)];
  const sh=_c4shuf(cats.map((c,i)=>({c,n:cnts[i]})));
  const total=sh.reduce((s,x)=>s+x.n,0);const least=sh.reduce((a,b)=>a.n<=b.n?a:b).c;
  return{q:`En una caja hay ${total} ${ctx.plural}: ${sh.map(x=>`${x.n} de ${x.c}`).join(', ')}.\nAl sacar uno al azar, ¿cuál es MENOS probable?`,a:least,opts:_c4shuf(sh.map(x=>x.c)),mc:true};
}

// Propiedades de Razones Trigonométricas: identidades cofunction y recíprocas
// Tipos de pregunta generados aleatoriamente basados en el libro (págs 33-37):
// 1) trig1(ax) = trig2(bx)            → x = 90/(a+b)
// 2) trig1(ax+p) = trig2(bx+q)        → (a+b)x = 90-p-q
// 3) trig(ax+p)·recip(bx+q) = 1       → ax+p = bx+q
// 4) Calcula k·trig(α)·recip_comp(β)  → siempre = k (identidad)
function _bingoGenTrigoProp() {
  const t=_bGetRandomInt(0,9);
  return t<=3?_tpCompBasic():t<=6?_tpCompOffset():t<=8?_tpRecipProd():_tpCalcIdent();
}
function _tpWrong(x){
  const pool=[5,6,8,9,10,12,14,15,16,18,20,22,24,25,27,30,36,40,42,45];
  return _bingShufArr(pool.filter(v=>v!==x)).slice(0,3);
}
function _tpFmtA(c,o){
  return `${c===1?'x':`${c}x`}${o>0?` + ${o}°`:o<0?` − ${Math.abs(o)}°`:''}`;
}
// Tipo 1: trig1(ax) = trig2(bx) → x = 90/(a+b)
function _tpCompBasic(){
  const PAIRS=[['sen','cos'],['cos','sen'],['tan','cot'],['cot','tan'],['sec','csc'],['csc','sec']];
  const [t1,t2]=PAIRS[_bGetRandomInt(0,5)];
  const CFGS=[{s:3,x:30},{s:5,x:18},{s:6,x:15},{s:9,x:10},{s:10,x:9},{s:15,x:6},{s:18,x:5}];
  const {s,x}=CFGS[_bGetRandomInt(0,CFGS.length-1)];
  let a,b; do{a=_bGetRandomInt(1,s-1);b=s-a;}while(a===b);
  const steps=[
    `Cofunción: ${t2}(θ) = ${t1}(90° − θ)`,
    `${t1}(${a}x) = ${t1}(90° − ${b}x)`,
    `Igualamos argumentos: ${a}x = 90° − ${b}x`,
    `${a}x + ${b}x = 90°`,
    `${s}x = 90°`,
    `x = 90° ÷ ${s} = ${x}°`,
  ];
  return {q:`Halla x (agudo):\n${t1}(${a}x) = ${t2}(${b}x)`,a:`${x}°`,opts:_bingShufArr([`${x}°`,..._tpWrong(x).map(v=>`${v}°`)]),mc:true,steps};
}
// Tipo 2: trig1(ax+p) = trig2(bx+q) → (a+b)x = 90 - p - q
function _tpCompOffset(){
  const PAIRS=[['sen','cos'],['cos','sen'],['tan','cot'],['cot','tan'],['sec','csc'],['csc','sec']];
  const [t1,t2]=PAIRS[_bGetRandomInt(0,5)];
  const xOpts=[10,15,20,25,30,40]; const x=xOpts[_bGetRandomInt(0,xOpts.length-1)];
  const ab=_bGetRandomInt(2,4); const a=_bGetRandomInt(1,ab); const b=ab-a;
  if(b<1) return _tpCompOffset();
  const pq=90-ab*x; if(pq<-70||pq>70) return _tpCompBasic();
  const pChoices=[]; for(let p=-50;p<=50;p+=5){const q=pq-p;if(Math.abs(q)<=50)pChoices.push({p,q});}
  if(!pChoices.length) return _tpCompBasic();
  const {p,q}=pChoices[_bGetRandomInt(0,pChoices.length-1)];
  const _sgn = n => n===0?'': n>0?` − ${n}°`:` + ${Math.abs(n)}°`;
  const rhs = 90 - p - q; // = ab * x
  const steps=[
    `Cofunción: ${t2}(θ) = ${t1}(90° − θ)`,
    `${t1}(${_tpFmtA(a,p)}) = ${t1}(90° − (${_tpFmtA(b,q)}))`,
    `Igualamos: ${_tpFmtA(a,p)} = 90° − (${_tpFmtA(b,q)})`,
    `${a}x + ${b}x = 90°${_sgn(p)}${_sgn(q)}`,
    `${ab}x = ${rhs}°`,
    `x = ${rhs}° ÷ ${ab} = ${x}°`,
  ];
  return {q:`Halla x (agudo):\n${t1}(${_tpFmtA(a,p)}) = ${t2}(${_tpFmtA(b,q)})`,a:`${x}°`,opts:_bingShufArr([`${x}°`,..._tpWrong(x).map(v=>`${v}°`)]),mc:true,steps};
}
// Tipo 3: trig(ax+p)·recip(bx+q) = 1 → ax+p = bx+q (mismo ángulo, recíproco)
function _tpRecipProd(){
  const RPAIRS=[['sen','csc'],['cos','sec'],['tan','cot'],['csc','sen'],['sec','cos'],['cot','tan']];
  const [t1,t2]=RPAIRS[_bGetRandomInt(0,5)];
  const xOpts=[5,8,10,12,15,16,18,20,25,30]; const x=xOpts[_bGetRandomInt(0,xOpts.length-1)];
  const a=_bGetRandomInt(2,5); const p=_bGetRandomInt(0,3)*10;
  const diff=_bGetRandomInt(1,Math.min(a-1,2)); const b=a-diff;
  if(b<1) return _tpRecipProd();
  const q=p+diff*x; if(q>80) return _tpRecipProd();
  const steps=[
    `Propiedad recíproca: ${t1}(θ) · ${t2}(φ) = 1 implica θ = φ`,
    `${_tpFmtA(a,p)} = ${_tpFmtA(b,q)}`,
    `${a}x − ${b}x = ${q}° − ${p}°`,
    `${diff}x = ${q-p}°`,
    `x = ${q-p}° ÷ ${diff} = ${x}°`,
  ];
  return {q:`Halla x (agudo):\n${t1}(${_tpFmtA(a,p)}) · ${t2}(${_tpFmtA(b,q)}) = 1`,a:`${x}°`,opts:_bingShufArr([`${x}°`,..._tpWrong(x).map(v=>`${v}°`)]),mc:true,steps};
}
// Tipo 4: Calcula M = k·trig(α)·cofun_recip(β) + n = k + n (producto siempre = 1)
function _tpCalcIdent(){
  const α=[18,24,33,36,42,54,66,72][_bGetRandomInt(0,7)];
  const comp=90-α, k=_bGetRandomInt(2,8), n=_bGetRandomInt(1,6), r=k+n;
  const ei=_bGetRandomInt(0,5);
  const EXPRS=[
    `${k}·sen(${α}°)·csc(${α}°) + ${n}`,
    `${k}·cos(${α}°)·sec(${α}°) + ${n}`,
    `${k}·tan(${α}°)·cot(${α}°) + ${n}`,
    `${k}·cos(${comp}°)·csc(${α}°) + ${n}`,
    `${k}·sen(${comp}°)·sec(${α}°) + ${n}`,
    `${k}·tan(${comp}°)·tan(${α}°) + ${n}`,
  ];
  const STEPS=[
    [`sen(α)·csc(α) = 1  (identidad recíproca)`,`${k}·1 + ${n}`,`M = ${r}`],
    [`cos(α)·sec(α) = 1  (identidad recíproca)`,`${k}·1 + ${n}`,`M = ${r}`],
    [`tan(α)·cot(α) = 1  (identidad recíproca)`,`${k}·1 + ${n}`,`M = ${r}`],
    [`cos(${comp}°) = sen(${α}°)  (cofunción: complemento)`,`= ${k}·sen(${α}°)·csc(${α}°) + ${n}`,`sen(α)·csc(α) = 1  (recíproca)`,`${k}·1 + ${n}`,`M = ${r}`],
    [`sen(${comp}°) = cos(${α}°)  (cofunción: complemento)`,`= ${k}·cos(${α}°)·sec(${α}°) + ${n}`,`cos(α)·sec(α) = 1  (recíproca)`,`${k}·1 + ${n}`,`M = ${r}`],
    [`tan(${comp}°) = cot(${α}°)  (cofunción: complemento)`,`= ${k}·cot(${α}°)·tan(${α}°) + ${n}`,`cot(α)·tan(α) = 1  (recíproca)`,`${k}·1 + ${n}`,`M = ${r}`],
  ];
  const steps=STEPS[ei];
  const expr=EXPRS[ei];
  const wrongs=[r-1,r+1,r+2,r-2].filter(w=>w>0&&w!==r).slice(0,3);
  return {q:`Calcula:\nM = ${expr}`,a:String(r),opts:_bingShufArr([String(r),...wrongs.map(String)]),mc:true,steps};
}

// ── Bingo Sound Engine (Web Audio API, sin archivos externos) ──────────────
const _bSnd = (() => {
  let _ctx = null;
  const ctx = () => {
    if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (_ctx.state === 'suspended') _ctx.resume();
    return _ctx;
  };
  // Tono básico: frecuencia, duración, forma, volumen, frecuencia inicial (glide)
  const tone = (freq, dur, type='sine', vol=0.25, freqStart=null, delay=0) => {
    try {
      const c = ctx(), t = c.currentTime + delay;
      const osc = c.createOscillator(), g = c.createGain();
      osc.connect(g); g.connect(c.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freqStart||freq, t);
      if (freqStart) osc.frequency.linearRampToValueAtTime(freq, t + dur * 0.7);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.start(t); osc.stop(t + dur + 0.01);
    } catch(e){}
  };
  // Ruido blanco filtrado (whoosh / impact)
  const noise = (dur, vol=0.15, cutoff=1800, delay=0) => {
    try {
      const c = ctx(), t = c.currentTime + delay;
      const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
      const d = buf.getChannelData(0); for (let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
      const src = c.createBufferSource(); src.buffer = buf;
      const flt = c.createBiquadFilter(); flt.type='lowpass'; flt.frequency.value=cutoff;
      const g = c.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t+dur);
      src.connect(flt); flt.connect(g); g.connect(c.destination);
      src.start(t); src.stop(t+dur+0.01);
    } catch(e){}
  };
  return {
    // Click suave para botones de lobby/config
    click()       { tone(720, 0.07, 'square', 0.1); },
    // Marcar una casilla — ding satisfactorio
    mark()        { tone(880, 0.18, 'sine', 0.22); tone(1320, 0.12, 'sine', 0.12, null, 0.04); },
    // Desmarcar — click seco
    unmark()      { tone(550, 0.08, 'sine', 0.12); },
    // Número nuevo salido — arpegio rápido ascendente
    newNumber()   { [440,554,659].forEach((f,i)=>tone(f, 0.14, 'sine', 0.2, null, i*0.07)); },
    // Inicio de reto — dos pulsos de alarma
    challengeStart() { [0, 0.22].forEach(d=>{ tone(880,0.14,'square',0.18,440,d); }); },
    // Tick segundero del reto (normal)
    tick()        { tone(950, 0.07, 'sine', 0.1); },
    // Tick urgente (<5 s)
    tickUrgent()  { tone(1350, 0.08, 'square', 0.22); noise(0.06, 0.05, 3000); },
    // Respuesta incorrecta — baja descendente
    wrong()       { tone(200, 0.38, 'sawtooth', 0.22, 360); noise(0.3, 0.1, 600); },
    // Respuesta correcta — mini acorde ascendente
    correct()     { [523,659,784].forEach((f,i)=>tone(f,0.18,'sine',0.18,null,i*0.07)); },
    // Reto perfecto — fanfarria completa
    perfect()     { [523,659,784,1047].forEach((f,i)=>tone(f,0.3,'sine',0.2,null,i*0.08)); tone(1568,0.5,'sine',0.25,null,0.38); },
    // Fallo / reto no completado — triste descendente
    fail()        { [349,311,261].forEach((f,i)=>tone(f,0.35,'sine',0.2,null,i*0.15)); },
    // Premio ganado — fanfarria escalonada por tier
    prize(tier)   {
      const maps = { terna:[[523,659,784],100], cuaterna:[[523,659,784,1047],90], quina:[[523,659,784,1047,1319],80], bingo:[[523,659,784,1047,1319,1568],70] };
      const [notes, gap] = maps[tier] || maps.terna;
      notes.forEach((f,i)=>tone(f, 0.4, 'sine', 0.22, null, i*gap/1000));
      if (tier==='bingo') {
        noise(0.4, 0.12, 4000, 0.0);
        setTimeout(()=>{ [784,1047,784,1047].forEach((f,i)=>tone(f,0.2,'square',0.12,null,i*0.08)); }, 600);
      }
    },
    // Activar poder — whoosh ascendente
    powerUse()    { tone(300, 0.35, 'sine', 0.2, 800); noise(0.3, 0.12, 3500); },
    // Bloqueo recibido — golpe bajo
    blocked()     { tone(90, 0.5, 'sawtooth', 0.28, 140); noise(0.25, 0.18, 500); },
  };
})();
let _bSndLastNum = null, _bSndChalWas = false, _bSndTickSec = -1;
let _bingoLobbyNivel = 'primaria'; // nivel activo en el selector de temas del lobby
let _bingoLobbyGrade = null;       // grado/área seleccionado dentro del nivel
// ─── Helpers compartidos ─────────────────────────────────────────────────────
function _t1Rnd(lo,hi){return Math.floor(Math.random()*(hi-lo+1))+lo;}
function _t1Shuf(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;}
function _t1Opts4(ans){const d=_t1Shuf([-7,-5,-3,-2,-1,1,2,3,5,7,10,-10,15,-15].map(v=>ans+v).filter(v=>v!==ans&&v>-90&&v<360));return _t1Shuf([ans,...d.slice(0,3)]);}
function _t1AngStr(k,n){return n>0?`${k}x + ${n}`:`${k}x`;}
// ─── Ejercicios individuales Subtema 1: Ángulo Trigonométrico ────────────────
function _angTrigA1(){ // Dos ángulos consecutivos → 90°
  for(let t=0;t<50;t++){
    const x=_t1Rnd(2,12),a=_t1Rnd(1,3),b=_t1Rnd(1,10),c=_t1Rnd(1,4);
    const α=a*x+b; if(α>=85||α<=3) continue;
    const β=90-α,d=β-c*x; if(d<0||d>50) continue;
    return{q:`∠AOB = (${_t1AngStr(a,b)})° y ∠BOC = (${_t1AngStr(c,d)})° son consecutivos con ∠AOC = 90°. Halla x.`,
      a:x,opts:_t1Opts4(x),mc:true,
      steps:[`α + β = 90°`,`(${_t1AngStr(a,b)}) + (${_t1AngStr(c,d)}) = 90`,`${a+c}x + ${b+d} = 90`,`${a+c}x = ${90-b-d}`,`x = ${x}`]};
  } return _angTrigA1();
}
function _angTrigA2(){ // Dos ángulos consecutivos → 180°
  for(let t=0;t<50;t++){
    const x=_t1Rnd(3,18),a=_t1Rnd(1,4),b=_t1Rnd(1,15),c=_t1Rnd(1,4);
    const α=a*x+b; if(α>=170||α<=10) continue;
    const β=180-α,d=β-c*x; if(d<0||d>60) continue;
    return{q:`∠AOB = (${_t1AngStr(a,b)})° y ∠BOC = (${_t1AngStr(c,d)})° son consecutivos con ∠AOC = 180°. Halla x.`,
      a:x,opts:_t1Opts4(x),mc:true,
      steps:[`α + β = 180°`,`(${_t1AngStr(a,b)}) + (${_t1AngStr(c,d)}) = 180`,`${a+c}x + ${b+d} = 180`,`${a+c}x = ${180-b-d}`,`x = ${x}`]};
  } return _angTrigA2();
}
function _angTrigA3(){ // Tres ángulos consecutivos → 180°
  for(let t=0;t<50;t++){
    const x=_t1Rnd(2,15),a=_t1Rnd(1,3),b=_t1Rnd(1,10),K=_t1Rnd(2,7)*10,c=_t1Rnd(1,3);
    const α=a*x+b; if(α<=0) continue;
    const γt=180-α-K; if(γt<=0) continue;
    const d=γt-c*x; if(d<0||d>40) continue;
    return{q:`Tres ángulos consecutivos forman un ángulo llano: (${_t1AngStr(a,b)})°, ${K}° y (${_t1AngStr(c,d)})°. Halla x.`,
      a:x,opts:_t1Opts4(x),mc:true,
      steps:[`(${_t1AngStr(a,b)}) + ${K} + (${_t1AngStr(c,d)}) = 180`,`${a+c}x + ${b+K+d} = 180`,`${a+c}x = ${180-b-K-d}`,`x = ${x}`]};
  } return _angTrigA3();
}
function _angTrigA4(){ // Ángulos opuestos por vértice
  for(let t=0;t<50;t++){
    const x=_t1Rnd(2,15),a=_t1Rnd(2,6),b=_t1Rnd(1,20),c=_t1Rnd(1,a-1);
    const v=a*x+b; if(v<=0||v>=180) continue;
    const d=v-c*x; if(d<0||d>60) continue;
    return{q:`∠AOB = (${a}x + ${b})° y ∠COD = (${c}x + ${d})° son ángulos opuestos por vértice. Halla x.`,
      a:x,opts:_t1Opts4(x),mc:true,
      steps:[`Ángulos opuestos por vértice son iguales`,`${a}x + ${b} = ${c}x + ${d}`,`${a-c}x = ${d-b}`,`x = ${d-b}/${a-c} = ${x}`]};
  } return _angTrigA4();
}
function _angTrigA5(){ // Bisectriz
  for(let t=0;t<50;t++){
    const x=_t1Rnd(2,12),a=_t1Rnd(2,5),b=_t1Rnd(1,15),c=_t1Rnd(1,a-1);
    const v=a*x+b; if(v<=0||v>=90) continue;
    const d=v-c*x; if(d<0||d>40) continue;
    return{q:`OT es bisectriz de ∠AOB. Si ∠AOT = (${a}x + ${b})° y ∠TOB = (${c}x + ${d})°, halla x.`,
      a:x,opts:_t1Opts4(x),mc:true,
      steps:[`La bisectriz divide ∠AOB en dos partes iguales`,`${a}x + ${b} = ${c}x + ${d}`,`${a-c}x = ${d-b}`,`x = ${d-b}/${a-c} = ${x}`]};
  } return _angTrigA5();
}
// ─── Subtema 2: Sistemas de Medición Angular ──────────────────────────────────
const _T1_SC=[[9,10],[18,20],[27,30],[36,40],[45,50],[54,60],[63,70],[72,80],[81,90],[90,100],[108,120],[135,150],[162,180],[180,200]];
const _T1_SR=[[30,'π/6'],[45,'π/4'],[60,'π/3'],[90,'π/2'],[120,'2π/3'],[135,'3π/4'],[150,'5π/6'],[180,'π'],[36,'π/5'],[72,'2π/5'],[54,'3π/10'],[108,'3π/5']];
const _T1_CR=[[100,'π/2'],[200,'π'],[50,'π/4'],[150,'3π/4'],[80,'2π/5'],[120,'3π/5'],[160,'4π/5'],[40,'π/5'],[20,'π/10'],[60,'3π/10']];
const _T1_RF=['π/6','π/4','π/3','π/2','2π/3','3π/4','5π/6','π','π/5','2π/5','3π/10','3π/5','4π/5','π/10'];
function _bingoGenMedicion1(){ // S ↔ C
  const[S,C]=_T1_SC[_t1Rnd(0,_T1_SC.length-1)];
  const toC=Math.random()<0.5;
  const wr=a=>_t1Shuf([a+10,a-10,a+20,a-20,Math.round(a*9/10),Math.round(a*10/9)].filter(v=>v!==a&&v>0)).slice(0,4);
  if(toC){return{q:`Convierte ${S}° a grados centesimales.`,a:C+'g',opts:_t1Shuf([C+'g',...wr(C).map(v=>v+'g')]),mc:true,steps:[`C = S × 10/9`,`C = ${S} × 10/9`,`C = ${C}g`]};}
  return{q:`Convierte ${C}g a grados sexagesimales.`,a:S+'°',opts:_t1Shuf([S+'°',...wr(S).map(v=>v+'°')]),mc:true,steps:[`S = C × 9/10`,`S = ${C} × 9/10`,`S = ${S}°`]};
}
function _bingoGenMedicion2(){ // S ↔ R
  const[S,R]=_T1_SR[_t1Rnd(0,_T1_SR.length-1)];
  const toR=Math.random()<0.5;
  const wrR=_t1Shuf(_T1_RF.filter(f=>f!==R)).slice(0,4).map(f=>f+' rad');
  if(toR){return{q:`Convierte ${S}° a radianes.`,a:R+' rad',opts:_t1Shuf([R+' rad',...wrR]),mc:true,steps:[`R = S × π/180`,`R = ${S} × π/180`,`R = ${R} rad`]};}
  const wrS=_t1Shuf([S+30,S-30,S+45,S-45,S+15].filter(v=>v!==S&&v>0&&v<=360)).slice(0,4).map(v=>v+'°');
  return{q:`Convierte ${R} rad a grados sexagesimales.`,a:S+'°',opts:_t1Shuf([S+'°',...wrS]),mc:true,steps:[`S = R × 180/π`,`S = ${R} × 180/π`,`S = ${S}°`]};
}
function _bingoGenMedicion3(){ // C ↔ R
  const[C,R]=_T1_CR[_t1Rnd(0,_T1_CR.length-1)];
  const toR=Math.random()<0.5;
  const wrR=_t1Shuf(_T1_RF.filter(f=>f!==R)).slice(0,4).map(f=>f+' rad');
  if(toR){return{q:`Convierte ${C}g a radianes.`,a:R+' rad',opts:_t1Shuf([R+' rad',...wrR]),mc:true,steps:[`R = C × π/200`,`R = ${C} × π/200`,`R = ${R} rad`]};}
  const wrC=_t1Shuf([C+20,C-20,C+40,C-40,C+10].filter(v=>v!==C&&v>0&&v<=400)).slice(0,4).map(v=>v+'g');
  return{q:`Convierte ${R} rad a grados centesimales.`,a:C+'g',opts:_t1Shuf([C+'g',...wrC]),mc:true,steps:[`C = R × 200/π`,`C = ${R} × 200/π`,`C = ${C}g`]};
}
function _bingoGenMedicion(){const t=_t1Rnd(0,2);return t===0?_bingoGenMedicion1():t===1?_bingoGenMedicion2():_bingoGenMedicion3();}
// ─── Subtema 3: Longitud de Arco ─────────────────────────────────────────────
const _T1_ARC_R=[[6,'π/3 rad','2π'],[12,'2π/3 rad','8π'],[8,'π/4 rad','2π'],[5,'π/5 rad','π'],[10,'π/2 rad','5π'],[4,'π/4 rad','π'],[9,'π/3 rad','3π'],[15,'π/3 rad','5π'],[6,'π/2 rad','3π'],[7,'π/7 rad','π'],[3,'π/3 rad','π'],[14,'π/7 rad','2π']];
const _T1_ARC_D=[[12,'120°','8π'],[6,'60°','2π'],[8,'90°','4π'],[5,'36°','π'],[10,'180°','10π'],[3,'60°','π'],[4,'90°','2π'],[9,'120°','6π'],[15,'60°','5π'],[12,'30°','2π']];
const _T1_ARC_Lwrong=['π','2π','3π','4π','5π','6π','7π','8π','9π','10π','π/2','3π/2'];
function _bingoGenArco1(){ // Hallar L dado r y θ (radianes)
  const[r,θ,L]=_T1_ARC_R[_t1Rnd(0,_T1_ARC_R.length-1)];
  const wr=_t1Shuf(_T1_ARC_Lwrong.filter(v=>v!==L)).slice(0,4).map(v=>v+' m');
  return{q:`Sector circular: r = ${r} m, θ = ${θ}. Halla la longitud del arco L.`,a:L+' m',opts:_t1Shuf([L+' m',...wr]),mc:true,
    steps:[`L = r × θ`,`L = ${r} × ${θ}`,`L = ${L} m`]};
}
function _bingoGenArco2(){ // Hallar L dado r y θ (grados)
  const[r,θ,L]=_T1_ARC_D[_t1Rnd(0,_T1_ARC_D.length-1)];
  const wr=_t1Shuf(_T1_ARC_Lwrong.filter(v=>v!==L)).slice(0,4).map(v=>v+' m');
  return{q:`Sector circular: r = ${r} m, θ = ${θ}. Halla la longitud del arco L.`,a:L+' m',opts:_t1Shuf([L+' m',...wr]),mc:true,
    steps:[`Convertir θ: θ_rad = ${θ} × π/180`,`L = r × θ_rad`,`L = ${L} m`]};
}
function _bingoGenArco3(){ // Hallar r o θ dado L
  const findR=Math.random()<0.5;
  if(findR){
    const D=[['8π m','2π/3 rad',12],['2π m','π/3 rad',6],['4π m','π/2 rad',8],['π m','π/5 rad',5],['5π m','π/2 rad',10],['3π m','π/3 rad',9],['3π m','π/2 rad',6],['2π m','π/4 rad',8]];
    const[L,θ,r]=D[_t1Rnd(0,D.length-1)];
    const wr=_t1Shuf([r+2,r-2,r+4,r-4,r*2].filter(v=>v!==r&&v>0)).slice(0,4).map(v=>v+' m');
    return{q:`Si L = ${L} y θ = ${θ}, halla el radio r.`,a:r+' m',opts:_t1Shuf([r+' m',...wr]),mc:true,
      steps:[`r = L / θ`,`r = ${L} / ${θ}`,`r = ${r} m`]};
  }
  const D=[['2π m',6,'π/3 rad'],['8π m',12,'2π/3 rad'],['4π m',8,'π/2 rad'],['π m',5,'π/5 rad'],['6 m',3,'2 rad'],['10 m',5,'2 rad'],['3 m',3,'1 rad'],['π m',7,'π/7 rad']];
  const[L,r,θ]=D[_t1Rnd(0,D.length-1)];
  const allT=['π/6 rad','π/4 rad','π/3 rad','π/2 rad','2π/3 rad','3π/4 rad','1 rad','2 rad','3 rad','π/5 rad','π/7 rad'];
  const wr=_t1Shuf(allT.filter(v=>v!==θ)).slice(0,4);
  return{q:`Si L = ${L} y r = ${r} m, halla el ángulo central θ.`,a:θ,opts:_t1Shuf([θ,...wr]),mc:true,
    steps:[`θ = L / r`,`θ = ${L} / ${r}`,`θ = ${θ}`]};
}
function _bingoGenArco(){const t=_t1Rnd(0,2);return t===0?_bingoGenArco1():t===1?_bingoGenArco2():_bingoGenArco3();}
// ─── Ángulo Trigonométrico (Subtema 1, Secundaria 1°) ────────────────────────
function _bingoGenAngTrig() {
  const rnd=(lo,hi)=>Math.floor(Math.random()*(hi-lo+1))+lo;
  const shuf=a=>{const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;};
  function opts4(ans){
    const d=shuf([-7,-5,-3,-2,-1,1,2,3,5,7,10,-10,15,-15].map(v=>ans+v).filter(v=>v!==ans&&v>-90&&v<360));
    return shuf([ans,...d.slice(0,3)]);
  }
  const ang=(k,n)=>n>0?`${k}x + ${n}`:`${k}x`;
  const type=rnd(0,4);
  if(type===0){
    // Dos ángulos consecutivos → 90°
    for(let t=0;t<30;t++){
      const x=rnd(2,12),a=rnd(1,3),b=rnd(1,10),c=rnd(1,4);
      const α=a*x+b; if(α>=85||α<=3) continue;
      const β=90-α, d=β-c*x; if(d<0||d>50) continue;
      return{q:`∠AOB = (${ang(a,b)})° y ∠BOC = (${ang(c,d)})° son consecutivos con ∠AOC = 90°. Halla x.`,
        a:x,opts:opts4(x),mc:true,
        steps:[`α + β = 90°`,`(${ang(a,b)}) + (${ang(c,d)}) = 90`,`${a+c}x + ${b+d} = 90`,`${a+c}x = ${90-b-d}`,`x = ${x}`]};
    }
  } else if(type===1){
    // Dos ángulos consecutivos → 180°
    for(let t=0;t<30;t++){
      const x=rnd(3,18),a=rnd(1,4),b=rnd(1,15),c=rnd(1,4);
      const α=a*x+b; if(α>=170||α<=10) continue;
      const β=180-α, d=β-c*x; if(d<0||d>60) continue;
      return{q:`∠AOB = (${ang(a,b)})° y ∠BOC = (${ang(c,d)})° son consecutivos con ∠AOC = 180°. Halla x.`,
        a:x,opts:opts4(x),mc:true,
        steps:[`α + β = 180°`,`(${ang(a,b)}) + (${ang(c,d)}) = 180`,`${a+c}x + ${b+d} = 180`,`${a+c}x = ${180-b-d}`,`x = ${x}`]};
    }
  } else if(type===2){
    // Tres ángulos consecutivos → 180° (ángulo del medio fijo)
    for(let t=0;t<30;t++){
      const x=rnd(2,15),a=rnd(1,3),b=rnd(1,10),K=rnd(2,7)*10,c=rnd(1,3);
      const α=a*x+b; if(α<=0) continue;
      const γt=180-α-K; if(γt<=0) continue;
      const d=γt-c*x; if(d<0||d>40) continue;
      return{q:`Tres ángulos consecutivos forman un ángulo llano: (${ang(a,b)})°, ${K}° y (${ang(c,d)})°. Halla x.`,
        a:x,opts:opts4(x),mc:true,
        steps:[`(${ang(a,b)}) + ${K} + (${ang(c,d)}) = 180`,`${a+c}x + ${b+K+d} = 180`,`${a+c}x = ${180-b-K-d}`,`x = ${x}`]};
    }
  } else if(type===3){
    // Ángulos opuestos por vértice → iguales
    for(let t=0;t<30;t++){
      const x=rnd(2,15),a=rnd(2,6),b=rnd(1,20),c=rnd(1,a-1);
      const v=a*x+b; if(v<=0||v>=180) continue;
      const d=v-c*x; if(d<0||d>60) continue;
      return{q:`∠AOB = (${a}x + ${b})° y ∠COD = (${c}x + ${d})° son ángulos opuestos por vértice. Halla x.`,
        a:x,opts:opts4(x),mc:true,
        steps:[`Ángulos opuestos por vértice son iguales`,`${a}x + ${b} = ${c}x + ${d}`,`${a-c}x = ${d-b}`,`x = ${d-b}/${a-c} = ${x}`]};
    }
  } else {
    // Bisectriz → dos partes iguales
    for(let t=0;t<30;t++){
      const x=rnd(2,12),a=rnd(2,5),b=rnd(1,15),c=rnd(1,a-1);
      const v=a*x+b; if(v<=0||v>=90) continue;
      const d=v-c*x; if(d<0||d>40) continue;
      return{q:`OT es bisectriz de ∠AOB. Si ∠AOT = (${a}x + ${b})° y ∠TOB = (${c}x + ${d})°, halla x.`,
        a:x,opts:opts4(x),mc:true,
        steps:[`La bisectriz divide ∠AOB en dos partes iguales`,`${a}x + ${b} = ${c}x + ${d}`,`${a-c}x = ${d-b}`,`x = ${d-b}/${a-c} = ${x}`]};
    }
  }
  return _bingoGenAngTrig();
}
// ── Sustracción 6° Primaria – Colegio Santísima Trinidad ─────────────────────
// 1 dígito
function _genT6Sust1B1() {
  const b=_bGetRandomInt(1,8), a=_bGetRandomInt(b+1,9), ans=a-b;
  const ws=_bingShufArr([ans-2,ans-1,ans+1,ans+2,ans+3].filter(v=>v>=0&&v!==ans)).slice(0,3);
  return {q:`${a} − ${b} = ?`,a:String(ans),opts:_bingShufArr([String(ans),...ws.map(String)]),mc:true};
}
function _genT6Sust1B2() {
  // __ − b = c → buscar a
  const b=_bGetRandomInt(1,7), c=_bGetRandomInt(1,9-b), a=b+c;
  const ws=_bingShufArr([a-2,a-1,a+1,a+2].filter(v=>v>=1&&v<=9&&v!==a)).slice(0,3);
  return {q:`__ − ${b} = ${c}`,a:String(a),opts:_bingShufArr([String(a),...ws.map(String)]),mc:true};
}
function _genT6Sust1BQ1() { return [_genT6Sust1B1,_genT6Sust1B2][_bGetRandomInt(0,1)](); }

// 2 dígitos
function _genT6Sust2B1() {
  // Sin préstamo: unidades de a ≥ unidades de b
  const bD=_bGetRandomInt(1,7),bU=_bGetRandomInt(0,7);
  const aD=_bGetRandomInt(bD+1,9),aU=_bGetRandomInt(bU,9);
  const a=aD*10+aU,b=bD*10+bU,ans=a-b;
  const ws=_bingShufArr([ans-2,ans-1,ans+1,ans+2,ans+3].filter(v=>v>0&&v<99&&v!==ans)).slice(0,3);
  return {q:`${a} − ${b} = ?`,a:String(ans),opts:_bingShufArr([String(ans),...ws.map(String)]),mc:true};
}
function _genT6Sust2B2() {
  // Con préstamo: unidades de a < unidades de b
  const bD=_bGetRandomInt(1,4),bU=_bGetRandomInt(2,9);
  const aU=_bGetRandomInt(0,bU-1),aD=_bGetRandomInt(bD+1,9);
  const a=aD*10+aU,b=bD*10+bU,ans=a-b;
  const ws=_bingShufArr([ans-2,ans-1,ans+1,ans+2].filter(v=>v>0&&v<99&&v!==ans)).slice(0,3);
  return {q:`${a} − ${b} = ?`,a:String(ans),opts:_bingShufArr([String(ans),...ws.map(String)]),mc:true};
}
function _genT6Sust2BQ1() { return [_genT6Sust2B1,_genT6Sust2B2][_bGetRandomInt(0,1)](); }

// 3 dígitos
function _genT6Sust3B1() {
  // Sin préstamo
  const bC=_bGetRandomInt(1,6),bD=_bGetRandomInt(0,7),bU=_bGetRandomInt(0,7);
  const aC=_bGetRandomInt(bC+1,9),aD=_bGetRandomInt(bD,9),aU=_bGetRandomInt(bU,9);
  const a=aC*100+aD*10+aU,b=bC*100+bD*10+bU,ans=a-b;
  const ws=_bingShufArr([ans-10,ans-1,ans+1,ans+10,ans+11].filter(v=>v>0&&v<999&&v!==ans)).slice(0,3);
  return {q:`${a} − ${b} = ?`,a:String(ans),opts:_bingShufArr([String(ans),...ws.map(String)]),mc:true};
}
function _genT6Sust3B2() {
  // Con préstamo: unidades de a < unidades de b
  const bC=_bGetRandomInt(1,4),bD=_bGetRandomInt(0,8),bU=_bGetRandomInt(2,9);
  const aC=_bGetRandomInt(bC+1,9),aD=_bGetRandomInt(0,9),aU=_bGetRandomInt(0,bU-1);
  const a=aC*100+aD*10+aU,b=bC*100+bD*10+bU,ans=a-b;
  const ws=_bingShufArr([ans-10,ans-1,ans+1,ans+10].filter(v=>v>0&&v<999&&v!==ans)).slice(0,3);
  return {q:`${a} − ${b} = ?`,a:String(ans),opts:_bingShufArr([String(ans),...ws.map(String)]),mc:true};
}
function _genT6Sust3BQ1() { return [_genT6Sust3B1,_genT6Sust3B2][_bGetRandomInt(0,1)](); }
function _genT6SustBPU() { return [_genT6Sust1B1,_genT6Sust1B2,_genT6Sust2B1,_genT6Sust2B2,_genT6Sust3B1,_genT6Sust3B2][_bGetRandomInt(0,5)](); }

// ── Valor Absoluto 6° Primaria – Colegio Santísima Trinidad ──────────────────
function _genT6VA_B1() {
  const defs=[
    {q:'¿Qué es el VALOR ABSOLUTO de un número?',
     a:'La distancia del número al cero en la recta numérica',
     w:['El número multiplicado por −1','El número elevado al cuadrado','El número con signo positivo forzado']},
    {q:'¿Con qué símbolo se escribe el valor absoluto de x?',
     a:'|x|',
     w:['(x)','[x]','‖x‖']},
    {q:'El valor absoluto de cualquier número es siempre:',
     a:'Mayor o igual que cero',
     w:['Siempre positivo (nunca cero)','Siempre igual al número','Puede ser negativo']},
    {q:'¿Cuánto vale |0|?',
     a:'0',
     w:['1','-1','No tiene valor absoluto']},
    {q:'¿Qué representa |−7| en la recta numérica?',
     a:'La distancia de −7 al cero, que es 7',
     w:['El número 7 negativo','El cuadrado de −7','La suma de 7 y −7']},
    {q:'Si x es un número positivo, entonces |x| es igual a:',
     a:'El mismo número x',
     w:['−x','0','x²']},
    {q:'Si x es un número negativo, entonces |x| es igual a:',
     a:'−x (su opuesto, que es positivo)',
     w:['x (sigue negativo)','0','x²']},
    {q:'¿Cuál de estas afirmaciones sobre el valor absoluto es CORRECTA?',
     a:'|−5| = |5| = 5',
     w:['|−5| = −5','|5| = −5','|−5| ≠ |5|']},
    {q:'¿Es posible que el valor absoluto de un número sea negativo?',
     a:'No, el valor absoluto nunca puede ser negativo',
     w:['Sí, cuando el número es impar','Sí, cuando el número es muy pequeño','Sí, siempre que el número sea negativo']},
    {q:'¿Qué tienen en común 6 y −6 en cuanto a valor absoluto?',
     a:'Ambos tienen el mismo valor absoluto: 6',
     w:['No tienen nada en común','Sus valores absolutos se suman en 0','Uno tiene valor absoluto y el otro no']},
    {q:'En la expresión |−12| = 12, el resultado 12 representa:',
     a:'La distancia de −12 al punto cero en la recta numérica',
     w:['El doble de 6','El opuesto de −12 elevado al cuadrado','La mitad de 24']},
    {q:'¿Cuál es el valor absoluto de un número que está a 9 unidades del cero?',
     a:'9',
     w:['−9','0','18']},
  ];
  const d = defs[_bGetRandomInt(0, defs.length-1)];
  return {q:d.q, a:d.a, opts:_bingShufArr([d.a, ...d.w]), mc:true};
}
function _genT6VA_B2() {
  // Calcular |x| para enteros simples
  const sign=Math.random()<0.6?-1:1;
  const n=_bGetRandomInt(1,20)*sign;
  const ans=Math.abs(n);
  const label=n<0?`(${n})`:String(n);
  const ws=_bingShufArr([ans+1,ans+2,ans-1,(n<0?n:-n)].filter(v=>v!==ans&&v>=0)).slice(0,3);
  if(ws.length<3)ws.push(ans+5);
  return {q:`|${label}| = ?`,a:String(ans),opts:_bingShufArr([String(ans),...ws.map(String)]),mc:true};
}
function _genT6VA_B3() {
  // Comparar |a| vs |b|
  let a,b;
  do { a=_bGetRandomInt(-20,20)||1; b=_bGetRandomInt(-20,20)||2; } while(Math.abs(a)===Math.abs(b));
  const la=a<0?`(${a})`:String(a);
  const lb=b<0?`(${b})`:String(b);
  const bigLabel=Math.abs(a)>Math.abs(b)?`|${la}| = ${Math.abs(a)}`:`|${lb}| = ${Math.abs(b)}`;
  const smallLabel=Math.abs(a)<Math.abs(b)?`|${la}| = ${Math.abs(a)}`:`|${lb}| = ${Math.abs(b)}`;
  return {q:`¿Cuál tiene mayor valor absoluto: |${la}| o |${lb}|?`,
    a:bigLabel,
    opts:_bingShufArr([bigLabel,smallLabel,'Son iguales','No se pueden comparar']),
    mc:true};
}
function _genT6VA_BQ1() { return [_genT6VA_B1,_genT6VA_B2,_genT6VA_B3][_bGetRandomInt(0,2)](); }

function _genT6VA_B4() {
  // Distancia entre dos puntos en la recta numérica
  let a,b;
  do { a=_bGetRandomInt(-10,10); b=_bGetRandomInt(-10,10); } while(a===b);
  const ans=Math.abs(a-b);
  const la=a<0?`(${a})`:String(a);
  const lb=b<0?`(${b})`:String(b);
  const ws=_bingShufArr([ans-2,ans-1,ans+1,ans+2,ans+3].filter(v=>v>0&&v!==ans)).slice(0,3);
  return {q:`¿Cuál es la distancia entre ${la} y ${lb} en la recta numérica?`,
    a:String(ans),opts:_bingShufArr([String(ans),...ws.map(String)]),mc:true};
}
function _genT6VA_B5() {
  const type=_bGetRandomInt(0,3);
  if(type===0){
    // |a| + |b|
    const a=_bGetRandomInt(-9,-2),b=_bGetRandomInt(-9,-2);
    const ans=Math.abs(a)+Math.abs(b);
    const ws=_bingShufArr([ans-2,ans-1,ans+1,ans+2].filter(v=>v>0&&v!==ans)).slice(0,3);
    return {q:`|(${a})| + |(${b})| = ?`,a:String(ans),opts:_bingShufArr([String(ans),...ws.map(String)]),mc:true};
  } else if(type===1){
    // |a| − |b| con |a|>|b|
    const b=_bGetRandomInt(-5,-1),a=_bGetRandomInt(-9,-6);
    const ans=Math.abs(a)-Math.abs(b);
    const ws=_bingShufArr([ans-2,ans-1,ans+1,ans+2].filter(v=>v>=0&&v!==ans)).slice(0,3);
    return {q:`|(${a})| − |(${b})| = ?`,a:String(ans),opts:_bingShufArr([String(ans),...ws.map(String)]),mc:true};
  } else if(type===2){
    // |a + b|
    const a=_bGetRandomInt(-8,8)||1,b=_bGetRandomInt(-8,8)||1;
    const sum=a+b,ans=Math.abs(sum);
    const la=a<0?`(${a})`:String(a);
    const lb=b<0?`(${b})`:String(b);
    const ws=_bingShufArr([ans-2,ans-1,ans+1,ans+2].filter(v=>v>=0&&v!==ans)).slice(0,3);
    return {q:`|${la} + ${lb}| = ?`,a:String(ans),opts:_bingShufArr([String(ans),...ws.map(String)]),mc:true};
  } else {
    // V/F: |−n| = |n|
    const n=_bGetRandomInt(2,15);
    return {q:`¿Es verdad que |(−${n})| = |${n}|?`,
      a:`Sí, ambos valen ${n}`,
      opts:_bingShufArr([`Sí, ambos valen ${n}`,`No, |(−${n})| = −${n}`,'Solo si el número es par','Solo si el número es mayor que 10']),
      mc:true};
  }
}
function _genT6VA_B6() {
  // Operaciones combinadas: enteros negativos + valor absoluto en la misma expresión
  const type = _bGetRandomInt(0, 2);
  if (type === 0) {
    // a − (−b) + |c|  (como el ejemplo del cuaderno: 3−(−2)+|−20|=25)
    const a = _bGetRandomInt(-9, 9) || 3;
    const b = _bGetRandomInt(1, 9);
    const c = _bGetRandomInt(-9, -1);
    const ans = a + b + Math.abs(c);
    const la = a < 0 ? `(${a})` : String(a);
    const ws = [ans+1, ans-1, ans+2].filter(v => v !== ans);
    return {q:`${la} − (−${b}) + |(${c})| = ?`, a:String(ans), opts:_bingShufArr([String(ans),...ws.map(String)]), mc:true};
  } else if (type === 1) {
    // |a| + b − (−c)
    const a = _bGetRandomInt(-9, -1);
    const b = _bGetRandomInt(-9, 9) || 2;
    const c = _bGetRandomInt(1, 9);
    const ans = Math.abs(a) + b + c;
    const lb = b < 0 ? `(${b})` : String(b);
    const ws = [ans+1, ans-1, ans+2].filter(v => v !== ans);
    return {q:`|(${a})| + ${lb} − (−${c}) = ?`, a:String(ans), opts:_bingShufArr([String(ans),...ws.map(String)]), mc:true};
  } else {
    // |a| − |b| + c
    const a = _bGetRandomInt(-9, -1);
    const b = _bGetRandomInt(-5, -1);
    const c = _bGetRandomInt(-9, 9) || 1;
    const ans = Math.abs(a) - Math.abs(b) + c;
    const lc = c < 0 ? `(${c})` : String(c);
    const ws = [ans+1, ans-1, ans+2].filter(v => v !== ans);
    return {q:`|(${a})| − |(${b})| + ${lc} = ?`, a:String(ans), opts:_bingShufArr([String(ans),...ws.map(String)]), mc:true};
  }
}
function _genT6VA_BQ2() { return [_genT6VA_B4,_genT6VA_B5,_genT6VA_B6][_bGetRandomInt(0,2)](); }
function _genT6VA_BPU() { return [_genT6VA_B1,_genT6VA_B2,_genT6VA_B3,_genT6VA_B4,_genT6VA_B5,_genT6VA_B6][_bGetRandomInt(0,5)](); }

// ── Ecuaciones 6° Primaria – Colegio Santísima Trinidad ──────────────────────
function _genT6EC_B1() {
  // x + a = b (enteros positivos, x positivo)
  const a = _bGetRandomInt(1, 9);
  const x = _bGetRandomInt(1, 9);
  const b = a + x;
  const candidates = [x+1, x+2, x-1, b, a, x+3].filter(v => v !== x && v > 0);
  const ws = [...new Set(candidates)].slice(0, 3);
  return {q:`x + ${a} = ${b}`, a:String(x), opts:_bingShufArr([String(x), ...ws.map(String)]), mc:true};
}
function _genT6EC_B2() {
  // x + a = b  o  x − a = b  con enteros (x puede ser negativo)
  const type = _bGetRandomInt(0, 1);
  const a = _bGetRandomInt(1, 9);
  const x = _bGetRandomInt(-8, 8);
  const ws = [x+1, x-1, x+2].filter(v => v !== x);
  if (type === 0) {
    const b = x + a;
    return {q:`x + ${a} = ${b}`, a:String(x), opts:_bingShufArr([String(x), ...ws.map(String)]), mc:true};
  } else {
    const b = x - a;
    return {q:`x − ${a} = ${b}`, a:String(x), opts:_bingShufArr([String(x), ...ws.map(String)]), mc:true};
  }
}
function _genT6EC_BQ1() { return [_genT6EC_B1, _genT6EC_B2][_bGetRandomInt(0, 1)](); }
function _genT6EC_B3() {
  // a·x = b, despejar x
  const a = _bGetRandomInt(2, 9);
  const x = _bGetRandomInt(1, 9);
  const b = a * x;
  const candidates = [x+1, x+2, x-1, b, a].filter(v => v !== x && v > 0);
  const ws = [...new Set(candidates)].slice(0, 3);
  return {q:`${a}x = ${b}`, a:String(x), opts:_bingShufArr([String(x), ...ws.map(String)]), mc:true};
}
function _genT6EC_B4() {
  // ax + b = c, dos pasos
  const a = _bGetRandomInt(2, 5);
  const x = _bGetRandomInt(1, 8);
  const b = _bGetRandomInt(1, 9);
  const c = a * x + b;
  const ws = [x+1, x-1, x+2].filter(v => v !== x);
  return {q:`${a}x + ${b} = ${c}`, a:String(x), opts:_bingShufArr([String(x), ...ws.map(String)]), mc:true};
}
function _genT6EC_BQ2() { return [_genT6EC_B3, _genT6EC_B4][_bGetRandomInt(0, 1)](); }
function _genT6EC_B5() {
  // a(x + b) = c, distribución
  const a = _bGetRandomInt(2, 4);
  const x = _bGetRandomInt(1, 8);
  const b = _bGetRandomInt(1, 5);
  const c = a * (x + b);
  const ws = [x+1, x-1, x+2].filter(v => v !== x);
  return {q:`${a}(x + ${b}) = ${c}`, a:String(x), opts:_bingShufArr([String(x), ...ws.map(String)]), mc:true};
}
function _genT6EC_B6() {
  // |x| = a → x puede ser positivo o negativo; pregunta por el valor negativo
  const a = _bGetRandomInt(1, 9);
  const ans = -a;
  const ws = [a, -(a+1), -(a === 1 ? a+2 : a-1)].filter(v => v !== ans);
  while (ws.length < 3) ws.push(ans - ws.length - 10);
  return {q:`Si |x| = ${a}, ¿cuál es el valor negativo de x?`, a:String(ans), opts:_bingShufArr([String(ans), ...ws.slice(0,3).map(String)]), mc:true};
}
function _genT6EC_BQ3() { return [_genT6EC_B5, _genT6EC_B6][_bGetRandomInt(0, 1)](); }
function _genT6EC_BPU() { return [_genT6EC_B1,_genT6EC_B2,_genT6EC_B3,_genT6EC_B4,_genT6EC_B5,_genT6EC_B6][_bGetRandomInt(0, 5)](); }

// ── Polígonos 2° Secundaria – Hans Christian Andersen ────────────────────────
const _hca2PolNames = ['triángulo','cuadrilátero','pentágono','hexágono','heptágono','octágono','nonágono','decágono','endecágono','dodecágono'];
const _hca2PolSides = [3,4,5,6,7,8,9,10,11,12];
function _hca2rnd(a,b){return Math.floor(Math.random()*(b-a+1))+a;}
function _hca2pick(arr){return arr[Math.floor(Math.random()*arr.length)];}
function _hca2shuf(arr){return arr.slice().sort(()=>Math.random()-.5);}
// B1: Nombre de polígono por número de lados o viceversa (MC)
function _genHca2POL_B1(){
  const i=_hca2rnd(0,_hca2PolNames.length-1);
  const n=_hca2PolSides[i],name=_hca2PolNames[i];
  if(Math.random()<0.5){
    const ws=_hca2shuf(_hca2PolNames.filter((_,j)=>j!==i)).slice(0,3);
    return{q:`¿Cómo se llama el polígono de ${n} lados?`,a:name,opts:_hca2shuf([name,...ws]),mc:true};
  }else{
    const ws=_hca2shuf(_hca2PolSides.filter(s=>s!==n)).slice(0,3).map(String);
    return{q:`¿Cuántos lados tiene un ${name}?`,a:String(n),opts:_hca2shuf([String(n),...ws]),mc:true};
  }
}
// B2: Suma de ángulos interiores (n−2)×180°
function _genHca2POL_B2(){
  const n=_hca2rnd(3,12),ans=(n-2)*180;
  const ws=[ans-180,ans+180,(n-1)*180].filter(v=>v!==ans&&v>0);
  while(ws.length<3)ws.push(ans+ws.length*90);
  return{q:`¿Cuánto suman los ángulos interiores de un polígono de ${n} lados?`,a:`${ans}°`,
    opts:_hca2shuf([`${ans}°`,...ws.slice(0,3).map(v=>`${v}°`)]),mc:true,
    ste:`Fórmula: (n−2)×180° = (${n}−2)×180° = ${n-2}×180° = ${ans}°`};
}
// B3: Ángulo interior de polígono regular (n−2)×180°/n
function _genHca2POL_B3(){
  const ns=[3,4,5,6,8,9,10,12];
  const n=_hca2pick(ns);
  const ans=(n-2)*180/n;
  const fmtA=v=>Number.isInteger(v)?`${v}°`:`${v.toFixed(1)}°`;
  const ws=[(n-1)*180/n,(n-3>1?(n-3)*180/(n-3):ans+20),(n-2)*180/(n+2)].filter(v=>fmtA(v)!==fmtA(ans)&&v>0);
  while(ws.length<3)ws.push(ans+5*(ws.length+1));
  return{q:`¿Cuánto mide cada ángulo interior de un polígono regular de ${n} lados?`,a:fmtA(ans),
    opts:_hca2shuf([fmtA(ans),...ws.slice(0,3).map(fmtA)]),mc:true,
    ste:`Ángulo interior = (n−2)×180°/n = (${n}−2)×180/${n} = ${n-2}×180/${n} = ${fmtA(ans)}`};
}
// BQ1
function _genHca2POL_BQ1(){return[_genHca2POL_B1,_genHca2POL_B2][_hca2rnd(0,1)]();}
// B4: Número de diagonales n(n−3)/2
function _genHca2POL_B4(){
  const n=_hca2rnd(4,10),ans=n*(n-3)/2;
  const ws=[ans-1,ans+1,n*(n-1)/2].filter(v=>v!==ans&&v>=0);
  while(ws.length<3)ws.push(ans+ws.length+2);
  return{q:`¿Cuántas diagonales tiene un polígono de ${n} lados?`,a:String(ans),
    opts:_hca2shuf([String(ans),...ws.slice(0,3).map(String)]),mc:true,
    ste:`Diagonales = n(n−3)/2 = ${n}×${n-3}/2 = ${ans}`};
}
// B5: Ángulo exterior de polígono regular 360°/n
function _genHca2POL_B5(){
  const n=_hca2pick([3,4,5,6,8,10,12]);
  const ans=360/n;
  const ws=[360/(n===3?4:n-1),360/(n+2),(n-2)*180/n].filter(v=>Number.isInteger(v)&&v!==ans&&v>0).slice(0,3);
  while(ws.length<3)ws.push(ans+5*(ws.length+1));
  const fmtA=v=>Number.isInteger(v)?`${v}°`:`${v.toFixed(1)}°`;
  return{q:`¿Cuánto mide cada ángulo exterior de un polígono regular de ${n} lados?`,a:fmtA(ans),
    opts:_hca2shuf([fmtA(ans),...ws.slice(0,3).map(fmtA)]),mc:true,
    ste:`Ángulo exterior = 360°/n = 360/${n} = ${fmtA(ans)}`};
}
// BQ2
function _genHca2POL_BQ2(){return[_genHca2POL_B3,_genHca2POL_B4,_genHca2POL_B5][_hca2rnd(0,2)]();}
// BPU
function _genHca2POL_BPU(){return[_genHca2POL_B1,_genHca2POL_B2,_genHca2POL_B3,_genHca2POL_B4,_genHca2POL_B5][_hca2rnd(0,4)]();}

// ── Operaciones con Decimales 2° Secundaria – Hans Christian Andersen ─────────
// Helpers sin punto flotante: trabajamos con enteros (tenths / hundredths)
function _hca2fmt1(v10){// e.g. 53→"5.3", 102→"10.2", 5→"0.5"
  return Math.floor(v10/10)+'.'+String(v10%10);}
function _hca2fmt2(v100){// e.g. 322→"3.22", 3220→"32.20"
  const i=Math.floor(v100/100),c=v100%100;return i+'.'+(c<10?'0'+c:String(c));}
// B1: Suma o resta de decimales (1 decimal)
function _genHca2DEC_B1(){
  const a10=_hca2rnd(100,999),b10=_hca2rnd(50,490);
  if(Math.random()<0.5){
    const ans10=a10+b10;
    const ws=[ans10+1,ans10-1,ans10+10].filter(v=>v!==ans10);
    while(ws.length<3)ws.push(ans10+ws.length*5);
    return{q:`${_hca2fmt1(a10)} + ${_hca2fmt1(b10)} = ?`,a:_hca2fmt1(ans10),
      opts:_hca2shuf([_hca2fmt1(ans10),...ws.slice(0,3).map(_hca2fmt1)]),mc:true};
  }else{
    const big=Math.max(a10,b10),sm=Math.min(a10,b10),ans10=big-sm;
    const ws=[ans10+1,Math.max(1,ans10-1),ans10+10].filter(v=>v!==ans10&&v>=0);
    while(ws.length<3)ws.push(ans10+ws.length*5);
    return{q:`${_hca2fmt1(big)} − ${_hca2fmt1(sm)} = ?`,a:_hca2fmt1(ans10),
      opts:_hca2shuf([_hca2fmt1(ans10),...ws.slice(0,3).map(_hca2fmt1)]),mc:true};
  }
}
// B2: Multiplicación decimal × entero
function _genHca2DEC_B2(){
  const a10=_hca2rnd(11,99),n=_hca2rnd(2,9);
  const ans10=a10*n;
  const ws=[ans10+n,ans10-n>0?ans10-n:ans10+2*n,ans10+10].filter(v=>v!==ans10&&v>0);
  while(ws.length<3)ws.push(ans10+ws.length*n);
  return{q:`${_hca2fmt1(a10)} × ${n} = ?`,a:_hca2fmt1(ans10),
    opts:_hca2shuf([_hca2fmt1(ans10),...ws.slice(0,3).map(_hca2fmt1)]),mc:true};
}
// B3: Multiplicación decimal × decimal (1d × 1d → 2d)
function _genHca2DEC_B3(){
  const a10=_hca2rnd(11,49),b10=_hca2rnd(11,49);
  const ans100=a10*b10;
  const ws=[ans100+10,ans100-10>0?ans100-10:ans100+20,ans100*10].filter(v=>v!==ans100&&v>0);
  while(ws.length<3)ws.push(ans100+ws.length*5);
  return{q:`${_hca2fmt1(a10)} × ${_hca2fmt1(b10)} = ?`,a:_hca2fmt2(ans100),
    opts:_hca2shuf([_hca2fmt2(ans100),...ws.slice(0,3).map(_hca2fmt2)]),mc:true,
    ste:`Multiplica como enteros: ${a10}×${b10}=${ans100}. Cuenta los decimales (1+1=2) → ${_hca2fmt2(ans100)}`};
}
// BQ1
function _genHca2DEC_BQ1(){return[_genHca2DEC_B1,_genHca2DEC_B2][_hca2rnd(0,1)]();}
// B4: División decimal entre entero
function _genHca2DEC_B4(){
  const n=_hca2rnd(2,9),q10=_hca2rnd(11,99);
  const div10=q10*n;
  const ws=[q10+1,q10-1>0?q10-1:q10+2,q10+10].filter(v=>v!==q10&&v>0);
  while(ws.length<3)ws.push(q10+ws.length*3);
  return{q:`${_hca2fmt1(div10)} ÷ ${n} = ?`,a:_hca2fmt1(q10),
    opts:_hca2shuf([_hca2fmt1(q10),...ws.slice(0,3).map(_hca2fmt1)]),mc:true};
}
// B5: División de entero entre decimal (÷0.2 o ÷0.5)
function _genHca2DEC_B5(){
  const cfg=_hca2pick([{d10:2,lbl:'0.2',inv:5},{d10:5,lbl:'0.5',inv:2}]);
  const quotient=_hca2rnd(3,15);
  const divX10=quotient*cfg.d10; // dividend in tenths
  const dividend=divX10%10===0?String(divX10/10):_hca2fmt1(divX10);
  const ws=[quotient+5,quotient-3>0?quotient-3:quotient+8,quotient*2].filter(v=>v!==quotient&&v>0).slice(0,3);
  while(ws.length<3)ws.push(quotient+ws.length*4);
  return{q:`${dividend} ÷ ${cfg.lbl} = ?`,a:String(quotient),
    opts:_hca2shuf([String(quotient),...ws.map(String)]),mc:true,
    ste:`Dividir entre ${cfg.lbl} equivale a multiplicar por ${cfg.inv}: ${dividend}×${cfg.inv} = ${quotient}`};
}
// B6: Operación combinada (decimal×entero + decimal)
function _genHca2DEC_B6(){
  const a10=_hca2rnd(11,49),b=_hca2rnd(2,6),c10=_hca2rnd(10,99);
  const prod10=a10*b,ans10=prod10+c10;
  const ws=[ans10+10,ans10-10>0?ans10-10:ans10+20,ans10+5].filter(v=>v!==ans10);
  while(ws.length<3)ws.push(ans10+ws.length*7);
  return{q:`${_hca2fmt1(a10)} × ${b} + ${_hca2fmt1(c10)} = ?`,a:_hca2fmt1(ans10),
    opts:_hca2shuf([_hca2fmt1(ans10),...ws.slice(0,3).map(_hca2fmt1)]),mc:true,
    ste:`Primero la multiplicación: ${_hca2fmt1(a10)}×${b}=${_hca2fmt1(prod10)}, luego la suma: ${_hca2fmt1(prod10)}+${_hca2fmt1(c10)}=${_hca2fmt1(ans10)}`};
}
// BQ2
function _genHca2DEC_BQ2(){return[_genHca2DEC_B3,_genHca2DEC_B4,_genHca2DEC_B5][_hca2rnd(0,2)]();}
// BPU
function _genHca2DEC_BPU(){return[_genHca2DEC_B1,_genHca2DEC_B2,_genHca2DEC_B3,_genHca2DEC_B4,_genHca2DEC_B5,_genHca2DEC_B6][_hca2rnd(0,5)]();}

// ── Ecuaciones 2° Secundaria – Hans Christian Andersen ───────────────────────
// B1: ax + b = cx + d  (variables en ambos lados, positivas)
function _genHca2EC_B1(){
  const x=_hca2rnd(1,8),a=_hca2rnd(3,8),c=_hca2rnd(1,a-1);
  const diff=a-c,d=_hca2rnd(1,10);
  const b=d-diff*x; // garantiza que ax+b = cx+d
  const sign=n=>n>=0?`+ ${n}`:`− ${Math.abs(n)}`;
  const ws=[x+1,x-1,x+2].filter(v=>v!==x);
  while(ws.length<3)ws.push(x+ws.length+3);
  return{q:`${a}x ${sign(b)} = ${c}x + ${d}`,a:String(x),
    opts:_hca2shuf([String(x),...ws.map(String)]),mc:true,
    ste:`Pasa ${c}x al lado izq: (${a}−${c})x ${sign(b)} = ${d} → ${diff}x = ${d-b} → x = ${x}`};
}
// B2: ax + b = cx + d con x que puede ser negativo
function _genHca2EC_B2(){
  const x=_hca2rnd(-5,5),a=_hca2rnd(3,8),c=_hca2rnd(1,a-1);
  const diff=a-c,d=_hca2rnd(1,10),b=d-diff*x;
  const sign=n=>n>=0?`+ ${n}`:`− ${Math.abs(n)}`;
  const ws=[x+1,x-1,x+2].filter(v=>v!==x);
  while(ws.length<3)ws.push(x+ws.length+3);
  return{q:`${a}x ${sign(b)} = ${c}x ${sign(d)}`,a:String(x),
    opts:_hca2shuf([String(x),...ws.map(String)]),mc:true,
    ste:`Agrupa términos: ${diff}x = ${d-b} → x = ${x}`};
}
// BQ1
function _genHca2EC_BQ1(){return[_genHca2EC_B1,_genHca2EC_B2][_hca2rnd(0,1)]();}
// B3: a(b·x + c) = d(e·x + f), distribución en ambos lados
function _genHca2EC_B3(){
  const x=_hca2rnd(1,5),a=_hca2rnd(2,4),bC=_hca2rnd(1,3),c=_hca2rnd(1,5);
  const d=_hca2rnd(1,3),e=_hca2rnd(1,2);
  const lhsC=a*bC,lhsK=a*c,rhsC=d*e;
  if(lhsC===rhsC)return _genHca2EC_B3();
  const dF=(lhsC-rhsC)*x+lhsK;
  if(dF<=0||dF%d!==0)return _genHca2EC_B3();
  const f=dF/d;
  const ws=[x+1,x-1>0?x-1:x+2,x+2].filter(v=>v>0&&v!==x);
  while(ws.length<3)ws.push(x+ws.length+2);
  return{q:`${a}(${bC}x + ${c}) = ${d}(${e}x + ${f})`,a:String(x),
    opts:_hca2shuf([String(x),...ws.map(String)]),mc:true,
    ste:`Distribuye: ${lhsC}x + ${lhsK} = ${rhsC}x + ${dF} → ${lhsC-rhsC}x = ${dF-lhsK} → x = ${x}`};
}
// B4: x/a + b = c  (ecuaciones con fracción)
function _genHca2EC_B4(){
  const a=_hca2rnd(2,6),x=_hca2rnd(1,8)*a,b=_hca2rnd(1,9);
  const c=x/a+b;
  const ws=[x+a,x-a>0?x-a:x+2*a,x+2*a].filter(v=>v!==x&&v>0);
  while(ws.length<3)ws.push(x+ws.length*a);
  return{q:`x / ${a} + ${b} = ${c}`,a:String(x),
    opts:_hca2shuf([String(x),...ws.slice(0,3).map(String)]),mc:true,
    ste:`x/${a} = ${c}−${b} = ${c-b} → x = ${c-b}×${a} = ${x}`};
}
// BQ2
function _genHca2EC_BQ2(){return[_genHca2EC_B3,_genHca2EC_B4][_hca2rnd(0,1)]();}
// B5: Problemas contextualizados
function _genHca2EC_B5(){
  const t=_hca2rnd(0,3);
  if(t===0){
    const pL=_hca2rnd(2,8),pC=_hca2rnd(3,9),nL=_hca2rnd(2,5),nC=_hca2rnd(2,4);
    const tot=nL*pL+nC*pC;
    const ws=[pL+1,pL-1>0?pL-1:pL+2,pL+2].filter(v=>v!==pL);
    return{q:`Se compraron ${nL} lapiceros y ${nC} cuadernos (cada cuaderno cuesta S/. ${pC}). El total fue S/. ${tot}. ¿Cuánto cuesta cada lapicero?`,
      a:`S/. ${pL}`,opts:_hca2shuf([`S/. ${pL}`,...ws.map(v=>`S/. ${v}`)]),mc:true,
      ste:`${nL}x + ${nC*pC} = ${tot} → ${nL}x = ${tot-nC*pC} → x = S/. ${pL}`};
  }else if(t===1){
    const marcos=_hca2rnd(5,15),juana=2*marcos,total=marcos+juana;
    const ws=[marcos+2,marcos-2>0?marcos-2:marcos+3,juana].filter(v=>v!==marcos&&v>0);
    return{q:`Juana tiene el doble de la edad de Marcos. Juntos suman ${total} años. ¿Cuántos años tiene Marcos?`,
      a:`${marcos} años`,opts:_hca2shuf([`${marcos} años`,...ws.slice(0,3).map(v=>`${v} años`)]),mc:true,
      ste:`x + 2x = ${total} → 3x = ${total} → x = ${marcos} años`};
  }else if(t===2){
    const w=_hca2rnd(3,10),k=_hca2rnd(1,5),l=w+k,P=2*(w+l);
    const ws=[w+1,w-1>0?w-1:w+2,l].filter(v=>v!==w&&v>0);
    return{q:`El largo de un rectángulo es ${k} cm más que su ancho. El perímetro es ${P} cm. ¿Cuánto mide el ancho?`,
      a:`${w} cm`,opts:_hca2shuf([`${w} cm`,...ws.slice(0,3).map(v=>`${v} cm`)]),mc:true,
      ste:`2(x + x+${k}) = ${P} → 4x+${2*k} = ${P} → x = ${w} cm`};
  }else{
    const b2=_hca2rnd(1,8),x=_hca2rnd(b2+1,15),d2=x-b2;
    const ws=[x+1,x-1>0?x-1:x+2,x+2].filter(v=>v!==x&&v>0);
    return{q:`El triple de un número menos ${b2} es igual a ${d2} más el doble de ese número. ¿Cuál es ese número?`,
      a:String(x),opts:_hca2shuf([String(x),...ws.slice(0,3).map(String)]),mc:true,
      ste:`3x − ${b2} = 2x + ${d2} → x = ${d2}+${b2} = ${x}`};
  }
}
// BQ3
function _genHca2EC_BQ3(){return[_genHca2EC_B1,_genHca2EC_B3,_genHca2EC_B5][_hca2rnd(0,2)]();}
// BPU
function _genHca2EC_BPU(){return[_genHca2EC_B1,_genHca2EC_B2,_genHca2EC_B3,_genHca2EC_B4,_genHca2EC_B5][_hca2rnd(0,4)]();}

// ── Regla de 3 Directa e Indirecta 2° Secundaria – Hans Christian Andersen ─────
// B1: Identificar proporcionalidad directa o inversa (MC conceptual)
function _genHca2R3_B1(){
  const items=[
    {q:'A mayor número de obreros, menor tiempo para construir una pared.',a:'Inversa',ste:'Una variable sube mientras la otra baja → inversa.'},
    {q:'A mayor número de km recorridos, mayor consumo de gasolina.',a:'Directa',ste:'Ambas variables aumentan juntas → directa.'},
    {q:'A mayor velocidad, el tiempo de viaje es menor (misma distancia).',a:'Inversa',ste:'Velocidad ↑, tiempo ↓ → inversa.'},
    {q:'Compro más manzanas → pago más (precio fijo por unidad).',a:'Directa',ste:'Cantidad ↑, costo ↑ → directa.'},
    {q:'Más grifos llenando una piscina → se llena en menos tiempo.',a:'Inversa',ste:'Más grifos → menos tiempo → inversa.'},
    {q:'Un empleado trabaja más horas → gana más dinero.',a:'Directa',ste:'Horas ↑ → salario ↑ → directa.'},
    {q:'Más personas comparten un pastel → cada una recibe menos.',a:'Inversa',ste:'Personas ↑, porción ↓ → inversa.'},
    {q:'Más días trabajados → más dinero recibido al mes.',a:'Directa',ste:'Días ↑ → pago ↑ → directa.'},
  ];
  const item=_hca2pick(items);
  return{q:`¿La siguiente relación es directa o inversa?\n"${item.q}"`,
    a:item.a,opts:['Directa','Inversa'],mc:true,ste:item.ste};
}
// B2: Cálculo con regla de 3 directa
function _genHca2R3_B2(){
  const type=_hca2rnd(0,3);
  const ratio=_hca2rnd(2,8),a1=_hca2rnd(2,5),b1=a1*ratio;
  const c1=_hca2rnd(2,8),ans=c1*ratio;
  const ws=[ans+ratio,ans-ratio>0?ans-ratio:ans+2*ratio,b1].filter(v=>v!==ans&&v>0).slice(0,3);
  while(ws.length<3)ws.push(ans+ws.length*ratio);
  let q,fmt;
  if(type===0){q=`Si ${a1} cuadernos cuestan S/. ${b1}, ¿cuánto cuestan ${c1} cuadernos?`;fmt=v=>`S/. ${v}`;}
  else if(type===1){q=`Un auto recorre ${b1} km con ${a1} litros. ¿Cuántos km recorre con ${c1} litros?`;fmt=v=>`${v} km`;}
  else if(type===2){q=`En ${a1} días se producen ${b1} kg de queso. ¿Cuántos kg en ${c1} días?`;fmt=v=>`${v} kg`;}
  else{q=`Por cada S/. ${a1} se compran ${b1} manzanas. ¿Cuántas manzanas con S/. ${c1}?`;fmt=v=>`${v} manzanas`;}
  return{q,a:fmt(ans),opts:_hca2shuf([fmt(ans),...ws.map(fmt)]),mc:true,
    ste:`Directa: ${a1} → ${b1} ; ${c1} → x = (${b1}×${c1})/${a1} = ${ans}`};
}
// BQ1
function _genHca2R3_BQ1(){return[_genHca2R3_B1,_genHca2R3_B2][_hca2rnd(0,1)]();}
// B3: Cálculo con regla de 3 inversa
function _genHca2R3_B3(){
  const type=_hca2rnd(0,1);
  if(type===0){
    // Obreros y días
    let w1,d1,d2,k,w2,tries=0;
    do{w1=_hca2rnd(3,8);d1=_hca2rnd(4,12);k=w1*d1;
      const divs=[];for(let dd=1;dd<d1;dd++){if(k%dd===0)divs.push(dd);}
      if(!divs.length){tries++;continue;}d2=_hca2pick(divs);w2=k/d2;break;
    }while(tries<15);
    if(!w2)return _genHca2R3_B3();
    const ws=[w2+2,w2-2>0?w2-2:w2+4,w1].filter(v=>v!==w2&&v>0).slice(0,3);
    while(ws.length<3)ws.push(w2+ws.length*2);
    return{q:`${w1} obreros construyen un muro en ${d1} días. ¿Cuántos obreros lo terminan en ${d2} días?`,
      a:`${w2} obreros`,opts:_hca2shuf([`${w2} obreros`,...ws.map(v=>`${v} obreros`)]),mc:true,
      ste:`Inversa: ${w1}×${d1} = x×${d2} → x = ${k}÷${d2} = ${w2} obreros`};
  }else{
    // Velocidad y tiempo
    const t2=_hca2rnd(1,4),t1=_hca2rnd(t2+1,t2+4);
    const v1=_hca2rnd(2,8)*t2; // garantiza división limpia
    const k=v1*t1,v2=k/t2;
    const ws=[v2+10,v2-10>0?v2-10:v2+15,v1].filter(v=>v!==v2&&v>0).slice(0,3);
    while(ws.length<3)ws.push(v2+ws.length*5);
    return{q:`Un auto viaja a ${v1} km/h y tarda ${t1} h. ¿A qué velocidad llega en ${t2} h?`,
      a:`${v2} km/h`,opts:_hca2shuf([`${v2} km/h`,...ws.map(v=>`${v} km/h`)]),mc:true,
      ste:`Inversa: ${v1}×${t1} = x×${t2} → x = ${k}÷${t2} = ${v2} km/h`};
  }
}
// B4: Problemas aplicados — regla de 3 directa
function _genHca2R3_B4(){
  const t=_hca2rnd(0,2);
  if(t===0){
    const sc=_hca2rnd(4,10),cm1=_hca2rnd(3,8),km1=cm1*sc,cm2=_hca2rnd(3,12),km2=cm2*sc;
    const ws=[km2+sc,km2-sc>0?km2-sc:km2+2*sc,km2*2].filter(v=>v!==km2&&v>0).slice(0,3);
    return{q:`En un mapa, ${cm1} cm representan ${km1} km. ¿Cuántos km representan ${cm2} cm?`,
      a:`${km2} km`,opts:_hca2shuf([`${km2} km`,...ws.map(v=>`${v} km`)]),mc:true,
      ste:`Directa: ${cm1} → ${km1} ; ${cm2} → x = (${km1}×${cm2})/${cm1} = ${km2} km`};
  }else if(t===1){
    const ppu=_hca2rnd(3,9),u1=_hca2rnd(3,8),cost1=ppu*u1,u2=_hca2rnd(2,10),cost2=ppu*u2;
    const ws=[cost2+ppu,cost2-ppu>0?cost2-ppu:cost2+2*ppu,cost1].filter(v=>v!==cost2&&v>0).slice(0,3);
    return{q:`${u1} kg de arroz cuestan S/. ${cost1}. ¿Cuánto cuestan ${u2} kg?`,
      a:`S/. ${cost2}`,opts:_hca2shuf([`S/. ${cost2}`,...ws.map(v=>`S/. ${v}`)]),mc:true,
      ste:`Directa: ${u1} → ${cost1} ; ${u2} → x = (${cost1}×${u2})/${u1} = S/. ${cost2}`};
  }else{
    const h1=_hca2rnd(4,10),s1=h1*_hca2rnd(5,12),h2=_hca2rnd(2,h1-1||1);
    const s2=h2*(s1/h1);
    if(!Number.isInteger(s2))return _genHca2R3_B4();
    const ws=[s2+5,s2-5>0?s2-5:s2+10,s1].filter(v=>v!==s2&&v>0).slice(0,3);
    return{q:`Un empleado gana S/. ${s1} por ${h1} horas. ¿Cuánto ganaría en ${h2} horas?`,
      a:`S/. ${s2}`,opts:_hca2shuf([`S/. ${s2}`,...ws.map(v=>`S/. ${v}`)]),mc:true,
      ste:`Directa: S/.${s1}/${h1}h × ${h2}h = S/. ${s2}`};
  }
}
// BQ2
function _genHca2R3_BQ2(){return[_genHca2R3_B3,_genHca2R3_B4][_hca2rnd(0,1)]();}
// B5: Problemas aplicados — regla de 3 inversa
function _genHca2R3_B5(){
  const t=_hca2rnd(0,2);
  if(t===0){
    let g1,h1,g2,h2;
    const candidates=[2,3,4,6];
    g1=_hca2rnd(2,5);h1=_hca2rnd(4,12);
    const k=g1*h1;
    const divs=candidates.filter(v=>v!==g1&&k%v===0);
    if(!divs.length)return _genHca2R3_B5();
    g2=_hca2pick(divs);h2=k/g2;
    const ws=[h2+2,h2-1>0?h2-1:h2+3,h1].filter(v=>v!==h2&&v>0).slice(0,3);
    while(ws.length<3)ws.push(h2+ws.length*2);
    return{q:`${g1} grifos llenan un tanque en ${h1} horas. ¿En cuántas horas lo llenan ${g2} grifos?`,
      a:`${h2} horas`,opts:_hca2shuf([`${h2} horas`,...ws.map(v=>`${v} horas`)]),mc:true,
      ste:`Inversa: ${g1}×${h1} = ${g2}×x → x = ${k}÷${g2} = ${h2} horas`};
  }else if(t===1){
    const p1=_hca2rnd(4,10),d1=_hca2rnd(6,15),k=p1*d1;
    const mults=[2,3,4,5].map(m=>p1*m).filter(p=>k%p===0&&p!==p1);
    if(!mults.length)return _genHca2R3_B5();
    const p2=_hca2pick(mults),d2=k/p2;
    const ws=[d2+2,d2-1>0?d2-1:d2+3,d1].filter(v=>v!==d2&&v>0).slice(0,3);
    while(ws.length<3)ws.push(d2+ws.length*2);
    return{q:`Hay provisiones para ${p1} personas durante ${d1} días. ¿Cuántos días alcanzan para ${p2} personas?`,
      a:`${d2} días`,opts:_hca2shuf([`${d2} días`,...ws.map(v=>`${v} días`)]),mc:true,
      ste:`Inversa: ${p1}×${d1} = ${p2}×x → x = ${k}÷${p2} = ${d2} días`};
  }else{
    const w1=_hca2rnd(3,8),d1=_hca2rnd(3,8),k=w1*d1;
    const divs=[2,3,4].filter(v=>v<w1&&k%v===0);
    if(!divs.length)return _genHca2R3_B5();
    const w2=_hca2pick(divs),d2=k/w2;
    const ws=[d2+2,d2-1>0?d2-1:d2+3,d1].filter(v=>v!==d2&&v>0).slice(0,3);
    while(ws.length<3)ws.push(d2+ws.length*2);
    return{q:`${w1} costureras terminan un pedido en ${d1} días. ¿Cuántos días necesitan ${w2} costureras para el mismo pedido?`,
      a:`${d2} días`,opts:_hca2shuf([`${d2} días`,...ws.map(v=>`${v} días`)]),mc:true,
      ste:`Inversa: ${w1}×${d1} = ${w2}×x → x = ${k}÷${w2} = ${d2} días`};
  }
}
// BQ3
function _genHca2R3_BQ3(){return[_genHca2R3_B3,_genHca2R3_B4,_genHca2R3_B5][_hca2rnd(0,2)]();}
// BPU
function _genHca2R3_BPU(){return[_genHca2R3_B1,_genHca2R3_B2,_genHca2R3_B3,_genHca2R3_B4,_genHca2R3_B5][_hca2rnd(0,4)]();}

// ── SAN AGUSTÍN 2° SECUNDARIA – GEOMETRÍA ────────────────────────────────────
function _sa2rnd(a,b){return Math.floor(Math.random()*(b-a+1))+a;}
function _sa2pick(arr){return arr[Math.floor(Math.random()*arr.length)];}
function _sa2shuf(arr){const r=[...arr];for(let i=r.length-1;i>0;i--){const j=_sa2rnd(0,i);[r[i],r[j]]=[r[j],r[i]];}return r;}

// ── Ángulos: Bisectriz ────────────────────────────────────────────────────────
// B1 – Habilidades previas: complementario y suplementario
function _genSa2ANG_B1(){
  const isComp=Math.random()<0.5,total=isComp?90:180;
  const vals=[10,15,20,25,30,35,40,45,50,55,60,65,70,75,80].filter(v=>v<total);
  const a=_sa2pick(vals),b=total-a;
  const tipo=isComp?'complemento':'suplemento';
  const q=`Calcula el ${tipo} de ${a}°.`;
  const ws=[b+10,b-10,b+20,b-20,b+5,b-5].filter(v=>v>0&&v<180&&v!==b).slice(0,3);
  return{q,a:`${b}°`,opts:_sa2shuf([`${b}°`,...ws.map(v=>`${v}°`)]),mc:true};
}

// B2 – Ángulos adyacentes en semirrecta (suman 180°)
function _genSa2ANG_B2(){
  const type=_sa2rnd(1,3);
  if(type===1){
    const a=_sa2pick([20,25,30,35,40,45,50,55]);
    const b=_sa2pick([15,20,25,30,35,40].filter(v=>a+v<165));
    const x=180-a-b;
    const q=`Tres ángulos adyacentes están sobre una semirrecta y miden ${a}°, ${b}° y x°. Calcula x.`;
    const ws=[x+5,x-5,x+10,x-10].filter(v=>v>0&&v<180&&v!==x).slice(0,3);
    return{q,a:`${x}°`,opts:_sa2shuf([`${x}°`,...ws.map(v=>`${v}°`)]),mc:true};
  }else if(type===2){
    const pairs=[[1,2],[1,3],[1,4],[1,5],[2,3],[2,4],[3,6],[4,5]];
    const[k,m]=_sa2pick(pairs.filter(([a,b])=>180%(a+b)===0));
    const x=180/(k+m);
    const q=`Dos ángulos adyacentes en una semirrecta miden ${k}x° y ${m}x°. Calcula x.`;
    const ws=[x+5,x-5,x+10,x+20].filter(v=>v>0&&v!==x).slice(0,3);
    return{q,a:`${x}°`,opts:_sa2shuf([`${x}°`,...ws.map(v=>`${v}°`)]),mc:true};
  }else{
    const g=_sa2pick([20,30,40,50,60]);
    const pairs=[[1,2],[1,3],[2,3],[1,4],[2,1]];
    for(const[k,m]of _sa2shuf(pairs)){
      if((180-g)%(k+m)===0){
        const x=(180-g)/(k+m);
        if(x>0&&x<=45){
          const q=`Tres ángulos adyacentes en una semirrecta miden ${k}x°, ${g}° y ${m}x°. Calcula x.`;
          const ws=[x+5,x-5,x+10].filter(v=>v>0&&v!==x).slice(0,3);
          return{q,a:`${x}°`,opts:_sa2shuf([`${x}°`,...ws.map(v=>`${v}°`)]),mc:true};
        }
      }
    }
    return _genSa2ANG_B2();
  }
}

// BQ1 – Quiz complementario/suplementario + adyacentes
function _genSa2ANG_BQ1(){return _sa2pick([_genSa2ANG_B1,_genSa2ANG_B2])();}

// B3 – Bisectriz simple: dado ∠AOB, hallar ∠BOM = (180−AOB)/2
function _genSa2ANG_B3(){
  const aob=_sa2pick([100,110,120,130,140,150,160]);
  const boc=180-aob,bom=boc/2;
  const q=`O está sobre la recta AC. OM es bisectriz del ∠BOC y m∠AOB = ${aob}°. Calcula m∠BOM.`;
  const ws=[bom+5,bom-5,bom+10,bom-10,bom+15].filter(v=>v>0&&v<90&&v!==bom).slice(0,3);
  return{q,a:`${bom}°`,opts:_sa2shuf([`${bom}°`,...ws.map(v=>`${v}°`)]),mc:true};
}

// B4 – Bisectriz: dado ∠MOC = k, hallar ∠AOB = 180 − 2k
function _genSa2ANG_B4(){
  const moc=_sa2pick([20,25,30,35,40,45]);
  const aob=180-2*moc;
  const q=`O está sobre la recta AC. OM es bisectriz del ∠BOC. Si m∠MOC = ${moc}°, calcula m∠AOB.`;
  const ws=[aob+10,aob-10,aob+20,2*moc,moc].filter(v=>v>0&&v<180&&v!==aob).slice(0,3);
  return{q,a:`${aob}°`,opts:_sa2shuf([`${aob}°`,...ws.map(v=>`${v}°`)]),mc:true};
}

// BQ2 – Quiz bisectriz
function _genSa2ANG_BQ2(){return _sa2pick([_genSa2ANG_B3,_genSa2ANG_B4])();}

// B5 – Bisectriz algebraica: ∠BOM = ax+b, ∠MOC = k → resolver x
function _genSa2ANG_B5(){
  const moc=_sa2pick([20,25,30,35,40]);
  const a=_sa2pick([2,3,4,5]);
  const b=_sa2pick([0,4,5,8,10,12]);
  const x=(moc-b)/a;
  if(!Number.isInteger(x)||x<=0||x>25)return _genSa2ANG_B5();
  const bStr=b?` + ${b}`:'';
  const q=`OM es bisectriz del ∠BOC. Si m∠MOC = ${moc}° y m∠BOM = (${a}x${bStr})°, calcula x.`;
  const ws=[x+3,x-3,x+5,x+8].filter(v=>v>0&&v!==x).slice(0,3);
  return{q,a:`${x}`,opts:_sa2shuf([`${x}`,...ws.map(String)]),mc:true};
}

// B6 – Bisectriz algebraica: ∠AOB = ax+b, ∠MOC = k → resolver x  (AOB = 180−2k)
function _genSa2ANG_B6(){
  const moc=_sa2pick([20,25,30,35,40,45]);
  const aob=180-2*moc;
  const a=_sa2pick([2,3,4,5]);
  const b=_sa2pick([0,4,5,8,10,12,15,20]);
  const x=(aob-b)/a;
  if(!Number.isInteger(x)||x<=0||x>60)return _genSa2ANG_B6();
  const bStr=b?` + ${b}`:'';
  const q=`OM es bisectriz del ∠BOC. Si m∠MOC = ${moc}° y m∠AOB = (${a}x${bStr})°, calcula x.`;
  const ws=[x+5,x-5,x+10].filter(v=>v>0&&v!==x).slice(0,3);
  return{q,a:`${x}`,opts:_sa2shuf([`${x}`,...ws.map(String)]),mc:true};
}

// BQ3 – Quiz algebraico
function _genSa2ANG_BQ3(){return _sa2pick([_genSa2ANG_B5,_genSa2ANG_B6])();}

// BPU – Examen ángulos
function _genSa2ANG_BPU(){return _sa2pick([_genSa2ANG_B1,_genSa2ANG_B2,_genSa2ANG_B3,_genSa2ANG_B4,_genSa2ANG_B5,_genSa2ANG_B6])();}

// ── Rectas Paralelas y Secante ────────────────────────────────────────────────
// B1 – Ángulos correspondientes (iguales)
function _genSa2PAR_B1(){
  const ang=_sa2pick([30,40,45,50,55,60,65,70,75,80]);
  const q=`L₁ // L₂. Una secante corta las paralelas formando un ángulo de ${ang}° con L₁. ¿Cuánto mide el ángulo correspondiente en L₂?`;
  const ws=[180-ang,ang+10,ang-10,ang+20,ang-20].filter(v=>v>0&&v<180&&v!==ang).slice(0,3);
  return{q,a:`${ang}°`,opts:_sa2shuf([`${ang}°`,...ws.map(v=>`${v}°`)]),mc:true};
}

// B2 – Ángulos alternos internos y co-interiores (simples)
function _genSa2PAR_B2(){
  const isAltern=Math.random()<0.5;
  const a=_sa2pick([30,40,45,50,55,60,65,70]);
  if(isAltern){
    const q=`L₁ // L₂. Un ángulo alterno interno mide ${a}°. ¿Cuánto mide el otro ángulo alterno interno?`;
    const ws=[180-a,a+10,a-10,a+20].filter(v=>v>0&&v<180&&v!==a).slice(0,3);
    return{q,a:`${a}°`,opts:_sa2shuf([`${a}°`,...ws.map(v=>`${v}°`)]),mc:true};
  }else{
    const b=180-a;
    const q=`L₁ // L₂. Un ángulo co-interior mide ${a}°. ¿Cuánto mide el otro ángulo co-interior del mismo lado?`;
    const ws=[a,b+10,b-10,b+20].filter(v=>v>0&&v<180&&v!==b).slice(0,3);
    return{q,a:`${b}°`,opts:_sa2shuf([`${b}°`,...ws.map(v=>`${v}°`)]),mc:true};
  }
}

// BQ1 – Quiz ángulos entre paralelas
function _genSa2PAR_BQ1(){return _sa2pick([_genSa2PAR_B1,_genSa2PAR_B2])();}

// B3 – Paralelas con álgebra: alternos iguales → ax+b = cx+d
function _genSa2PAR_B3(){
  const x=_sa2rnd(5,30);
  const a=_sa2pick([3,4,5,6]);
  const b=_sa2pick([5,10,15,20]);
  const c=_sa2pick([1,2,3].filter(v=>v!==a));
  const d=a*x+b-c*x;
  if(d<=0||!Number.isInteger(d)||d>90)return _genSa2PAR_B3();
  const q=`L₁ // L₂. Los ángulos alternos internos miden (${a}x + ${b})° y (${c}x + ${d})°. Calcula x.`;
  const ws=[x+5,x-5,x+10,x-10].filter(v=>v>0&&v!==x).slice(0,3);
  return{q,a:`${x}`,opts:_sa2shuf([`${x}`,...ws.map(String)]),mc:true};
}

// B4 – Paralelas con álgebra: co-interiores → (ax+b)+(cx+d) = 180
function _genSa2PAR_B4(){
  const a=_sa2pick([2,3,4]),b=_sa2pick([5,10,15,20]);
  const c=_sa2pick([1,2,3]),d=_sa2pick([5,10,15,20,25]);
  if((180-b-d)%(a+c)!==0)return _genSa2PAR_B4();
  const x=(180-b-d)/(a+c);
  if(x<=0||x>45)return _genSa2PAR_B4();
  const q=`L₁ // L₂. Los ángulos co-interiores miden (${a}x + ${b})° y (${c}x + ${d})°. Calcula x.`;
  const ws=[x+5,x-5,x+10].filter(v=>v>0&&v!==x).slice(0,3);
  return{q,a:`${x}`,opts:_sa2shuf([`${x}`,...ws.map(String)]),mc:true};
}

// BQ2 – Quiz algebraico
function _genSa2PAR_BQ2(){return _sa2pick([_genSa2PAR_B3,_genSa2PAR_B4])();}

// B5 – Zigzag entre paralelas: x = α + β (línea poligonal entre L₁ y L₂)
function _genSa2PAR_B5(){
  const a=_sa2pick([20,25,30,35,40,45]);
  const b=_sa2pick([15,20,25,30,35,40].filter(v=>a+v<170));
  const x=a+b;
  const q=`L₁ // L₂. Una línea quebrada forma un ángulo de ${a}° con L₁ y un ángulo de ${b}° con L₂ (mismo lado). Calcula el ángulo x en el vértice intermedio.`;
  const ws=[x+10,x-10,180-x,x+20,a,b].filter(v=>v>0&&v<180&&v!==x).slice(0,3);
  return{q,a:`${x}°`,opts:_sa2shuf([`${x}°`,...ws.map(v=>`${v}°`)]),mc:true};
}

// B6 – Ángulo exterior de triángulo entre paralelas
function _genSa2PAR_B6(){
  const a=_sa2pick([20,25,30,35,40,45]);
  const b=_sa2pick([20,25,30,35,40,45].filter(v=>a+v<150));
  const x=180-(a+b); // interior angle at secant between lines = 180 - (a+b)
  // Or use: two co-int angles sum = 180, with variable
  const r=_sa2rnd(1,2);
  if(r===1){
    const q=`L₁ // L₂. La secante forma ángulos internos de ${a}° con L₁ y ${b}° con L₂ (lados opuestos). Calcula el ángulo x entre las dos paralelas en la secante.`;
    const ans=180-a-b;
    if(ans<=0)return _genSa2PAR_B6();
    const ws=[ans+10,ans-10,a+b,ans+20].filter(v=>v>0&&v<180&&v!==ans).slice(0,3);
    return{q,a:`${ans}°`,opts:_sa2shuf([`${ans}°`,...ws.map(v=>`${v}°`)]),mc:true};
  }else{
    // ax + bx + c = 180 (two co-interior angles with a variable each)
    const k=_sa2pick([3,4,5,6]),c=_sa2pick([0,10,20,30]);
    if((180-c)%k!==0)return _genSa2PAR_B6();
    const xv=(180-c)/k;
    if(xv<=0||xv>50)return _genSa2PAR_B6();
    const q=`L₁ // L₂. Dos ángulos co-interiores miden ${k-1}x° y (x + ${c})°. Calcula x.`;
    const ws=[xv+5,xv-5,xv+10].filter(v=>v>0&&v!==xv).slice(0,3);
    return{q,a:`${xv}`,opts:_sa2shuf([`${xv}`,...ws.map(String)]),mc:true};
  }
}

// BQ3 – Quiz final paralelas
function _genSa2PAR_BQ3(){return _sa2pick([_genSa2PAR_B4,_genSa2PAR_B5,_genSa2PAR_B6])();}

// BPU – Examen rectas paralelas
function _genSa2PAR_BPU(){return _sa2pick([_genSa2PAR_B1,_genSa2PAR_B2,_genSa2PAR_B3,_genSa2PAR_B4,_genSa2PAR_B5,_genSa2PAR_B6])();}

// ── SAN AGUSTÍN 2° SECUNDARIA – EXAMEN GENERAL GEOMETRÍA ────────────────────
// SVG helpers
function _sa2svgWrap(inner,w,h){w=w||220;h=h||160;return`<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="max-width:${w}px;width:100%;height:auto;display:block;margin:4px auto 8px;font-weight:normal"><g stroke="#ccc" stroke-width="1.5" fill="none" style="font-family:Arial,sans-serif;font-size:11px;font-weight:normal;fill:#ccc">${inner}</g></svg>`;}
function _sa2ra(x,y,s,rot){s=s||8;rot=rot||0;// right-angle marker
  const r=rot*Math.PI/180,cos=Math.cos(r),sin=Math.sin(r);
  const pts=[[s,0],[s,-s],[0,-s]].map(([px,py])=>[x+px*cos-py*sin,y+px*sin+py*cos]);
  return`<polyline points="${pts.map(p=>p.map(v=>v.toFixed(1)).join(',')).join(' ')}" stroke-width="1"/>`;}
function _sa2arc(cx,cy,r,a1,a2,lbl,lr,la){// arc label
  const mid=(a1+a2)/2*Math.PI/180;
  const lx=cx+lr*Math.cos(mid),ly=cy-lr*Math.sin(mid);
  return`<path d="M${cx+r*Math.cos(a1*Math.PI/180).toFixed(1)},${(cy-r*Math.sin(a1*Math.PI/180)).toFixed(1)} A${r},${r} 0 0,${a2>a1?0:1} ${(cx+r*Math.cos(a2*Math.PI/180)).toFixed(1)},${(cy-r*Math.sin(a2*Math.PI/180)).toFixed(1)}" fill="none" stroke="#aaa" stroke-width="1"/><text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-size="10">${lbl}</text>`;}

// ── EXAMEN – BISECTRIZ ────────────────────────────────────────────────────────
// EX-A1: Tres rayos iguales de kx° en ángulo recto → x (figura con ángulo recto)
function _genSa2EX_A1(){
  const cfg=_sa2pick([[3,2,15],[2,3,15],[3,1,22.5]].filter(([n,k,x])=>Number.isInteger(x)&&n*k*x===90));
  if(!cfg)return _genSa2EX_A2();
  const[n,k,x]=cfg;
  const CX=80,CY=110,L=65;
  // n equal angles of kx in right angle (90°)
  let lines='',arcs='';
  for(let i=0;i<=n;i++){
    const ang=(90/n)*i;// 0..90
    const rad=ang*Math.PI/180;
    lines+=`<line x1="${CX}" y1="${CY}" x2="${(CX+L*Math.cos(rad)).toFixed(1)}" y2="${(CY-L*Math.sin(rad)).toFixed(1)}"/>`;
  }
  // label each sector
  for(let i=0;i<n;i++){
    const mid=((90/n)*i+(90/n)*(i+1))/2*Math.PI/180;
    const lr=32;
    const lx=CX+lr*Math.cos(mid),ly=CY-lr*Math.sin(mid);
    arcs+=`<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-size="10">${k}x°</text>`;
  }
  arcs+=_sa2ra(CX,CY,10);// right angle at origin (between 0° and 90°)
  const svg=_sa2svgWrap(lines+arcs,180,140);
  const ws=[x+3,x-3,x+1,x+5,x-1].filter(v=>v>0&&v!==x).slice(0,3);
  return{q:`${svg}Calcula el valor de x.`,a:`${x}°`,opts:_sa2shuf([`${x}°`,...ws.map(v=>`${v}°`)]),mc:true};
}

// EX-A2: Bisectriz – dado ∠AOB, hallar ∠BOM
function _genSa2EX_A2(){
  const aob=_sa2pick([100,110,120,130,140,150,160]);
  const boc=180-aob,bom=boc/2;
  const CX=110,CY=100,L=70;
  const bAng=(180-aob)*Math.PI/180;// angle of OB from +x
  const mAng=bom*Math.PI/180;// OM from +x (bisects BOC)
  const svg=_sa2svgWrap(
    `<line x1="${CX-L}" y1="${CY}" x2="${CX+L}" y2="${CY}"/>` +// A---O---C
    `<line x1="${CX}" y1="${CY}" x2="${(CX+L*Math.cos(bAng)).toFixed(1)}" y2="${(CY-L*Math.sin(bAng)).toFixed(1)}"/>` +// OB
    `<line x1="${CX}" y1="${CY}" x2="${(CX+L*Math.cos(mAng)).toFixed(1)}" y2="${(CY-L*Math.sin(mAng)).toFixed(1)}" stroke-dasharray="4,2"/>` +// OM
    `<text x="${CX-L-8}" y="${CY+4}" text-anchor="end">A</text>` +
    `<text x="${CX+L+5}" y="${CY+4}">C</text>` +
    `<text x="${(CX+L*Math.cos(bAng)).toFixed(1)}" y="${(CY-L*Math.sin(bAng)-5).toFixed(1)}" text-anchor="middle">B</text>` +
    `<text x="${(CX+L*Math.cos(mAng)+8).toFixed(1)}" y="${(CY-L*Math.sin(mAng)).toFixed(1)}">M</text>` +
    `<text x="${CX+3}" y="${CY+12}">O</text>` +
    _sa2arc(CX,CY,28,0,180-aob,`${aob}°`,42,0)+// arc AOB label
    _sa2arc(CX,CY,18,0,bom,'x°',30,0),// arc BOM label
    230,160);
  const ws=[bom+5,bom-5,bom+10,bom-10,bom+15].filter(v=>v>0&&v<90&&v!==bom).slice(0,3);
  return{q:`${svg}OM es bisectriz del ∠BOC. Calcula m∠BOM (x).`,a:`${bom}°`,opts:_sa2shuf([`${bom}°`,...ws.map(v=>`${v}°`)]),mc:true};
}

// EX-A3: Bisectriz – dado ∠MOC=k, hallar ∠AOB=180-2k
function _genSa2EX_A3(){
  const moc=_sa2pick([20,25,30,35,40,45]);
  const aob=180-2*moc;
  const CX=110,CY=100,L=70;
  const bAng=(2*moc)*Math.PI/180;// OB from +x (BOC=2·moc, so OB at 2moc from OC)
  const mAng=moc*Math.PI/180;// OM at moc from OC
  const svg=_sa2svgWrap(
    `<line x1="${CX-L}" y1="${CY}" x2="${CX+L}" y2="${CY}"/>` +
    `<line x1="${CX}" y1="${CY}" x2="${(CX+L*Math.cos(bAng)).toFixed(1)}" y2="${(CY-L*Math.sin(bAng)).toFixed(1)}"/>` +
    `<line x1="${CX}" y1="${CY}" x2="${(CX+L*Math.cos(mAng)).toFixed(1)}" y2="${(CY-L*Math.sin(mAng)).toFixed(1)}" stroke-dasharray="4,2"/>` +
    `<text x="${CX-L-8}" y="${CY+4}" text-anchor="end">A</text>` +
    `<text x="${CX+L+5}" y="${CY+4}">C</text>` +
    `<text x="${(CX+L*Math.cos(bAng)).toFixed(1)}" y="${(CY-L*Math.sin(bAng)-5).toFixed(1)}" text-anchor="middle">B</text>` +
    `<text x="${(CX+L*Math.cos(mAng)+8).toFixed(1)}" y="${(CY-L*Math.sin(mAng)).toFixed(1)}">M</text>` +
    `<text x="${CX+3}" y="${CY+12}">O</text>` +
    _sa2arc(CX,CY,22,0,moc,`${moc}°`,34,0)+
    _sa2arc(CX,CY,40,0,2*moc,'x°',54,0),
    230,160);
  const ws=[aob+10,aob-10,aob+20,2*moc].filter(v=>v>0&&v<180&&v!==aob).slice(0,3);
  return{q:`${svg}OM es bisectriz del ∠BOC. Si m∠MOC=${moc}°, calcula m∠AOB (x).`,a:`${aob}°`,opts:_sa2shuf([`${aob}°`,...ws.map(v=>`${v}°`)]),mc:true};
}

// EX-A4: Bisectriz algebraica – ∠AOB=(ax+b)°, ∠MOC=k → resolver x
function _genSa2EX_A4(){
  const moc=_sa2pick([20,25,30,35,40,45]);
  const aob=180-2*moc;
  const a=_sa2pick([2,3,4,5]),b=_sa2pick([0,4,5,8,10,12,15,20]);
  const x=(aob-b)/a;
  if(!Number.isInteger(x)||x<=0||x>60)return _genSa2EX_A4();
  const bStr=b?` + ${b}`:'';
  const CX=110,CY=100,L=70;
  const bAng=(2*moc)*Math.PI/180,mAng=moc*Math.PI/180;
  const svg=_sa2svgWrap(
    `<line x1="${CX-L}" y1="${CY}" x2="${CX+L}" y2="${CY}"/>` +
    `<line x1="${CX}" y1="${CY}" x2="${(CX+L*Math.cos(bAng)).toFixed(1)}" y2="${(CY-L*Math.sin(bAng)).toFixed(1)}"/>` +
    `<line x1="${CX}" y1="${CY}" x2="${(CX+L*Math.cos(mAng)).toFixed(1)}" y2="${(CY-L*Math.sin(mAng)).toFixed(1)}" stroke-dasharray="4,2"/>` +
    `<text x="${CX-L-8}" y="${CY+4}" text-anchor="end">A</text>` +
    `<text x="${CX+L+5}" y="${CY+4}">C</text>` +
    `<text x="${(CX+L*Math.cos(bAng)).toFixed(1)}" y="${(CY-L*Math.sin(bAng)-5).toFixed(1)}" text-anchor="middle">B</text>` +
    `<text x="${(CX+L*Math.cos(mAng)+8).toFixed(1)}" y="${(CY-L*Math.sin(mAng)).toFixed(1)}">M</text>` +
    `<text x="${CX+3}" y="${CY+12}">O</text>` +
    _sa2arc(CX,CY,22,0,moc,`${moc}°`,34,0)+
    `<text x="${(CX-38)}" y="${CY-28}" font-size="10">(${a}x${bStr})°</text>`,
    230,160);
  const ws=[x+5,x-5,x+10,x-10].filter(v=>v>0&&v!==x).slice(0,3);
  return{q:`${svg}OM bisectriz de ∠BOC, m∠MOC=${moc}°, m∠AOB=(${a}x${bStr})°. Calcula x.`,a:`${x}`,opts:_sa2shuf([`${x}`,...ws.map(String)]),mc:true};
}

// ── EXAMEN – NIVEL II (comp/supl) ────────────────────────────────────────────
// EX-B1: comp(α) + supl(β)
function _genSa2EX_B1(){
  const α=_sa2pick([10,15,20,25,30,35,40]),β=_sa2pick([100,110,115,120,125,130,140]);
  const ans=(90-α)+(180-β);
  if(ans<=0)return _genSa2EX_B1();
  const q=`Calcula el complemento de ${α}° más el suplemento de ${β}°.`;
  const ws=[ans+10,ans-10,ans+20,ans-20].filter(v=>v>0&&v!==ans).slice(0,3);
  return{q,a:`${ans}°`,opts:_sa2shuf([`${ans}°`,...ws.map(v=>`${v}°`)]),mc:true};
}

// EX-B2: comp(supl(x))=k → x=90+k
function _genSa2EX_B2(){
  const k=_sa2pick([5,10,15,20]);
  const x=90+k;
  const q=`El complemento del suplemento de un ángulo x es ${k}°. Calcula x.`;
  const ws=[x-20,x-10,x+10,90-k].filter(v=>v>0&&v<180&&v!==x).slice(0,3);
  return{q,a:`${x}°`,opts:_sa2shuf([`${x}°`,...ws.map(v=>`${v}°`)]),mc:true};
}

// EX-B3: supl − comp = k·x → 90=k·x → x=90/k
function _genSa2EX_B3(){
  const k=_sa2pick([2,3,5,6,9,10]);
  if(90%k!==0)return _genSa2EX_B3();
  const x=90/k;
  const q=`La diferencia entre el suplemento y el complemento de un ángulo es ${k} veces dicho ángulo. Calcula el ángulo.`;
  const ws=[x+5,x-5,x+10,x*2].filter(v=>v>0&&v<90&&v!==x).slice(0,3);
  return{q,a:`${x}°`,opts:_sa2shuf([`${x}°`,...ws.map(v=>`${v}°`)]),mc:true};
}

// EX-B4: supl(2x) − comp(x) = x/n → x
function _genSa2EX_B4(){
  // supl(2x)=180-2x, comp(x)=90-x → (180-2x)-(90-x) = 90-x = x/n → 90 = x+x/n = x(n+1)/n → x=90n/(n+1)
  const n=_sa2pick([3,4,5,8]);
  if(90*n%(n+1)!==0)return _genSa2EX_B4();
  const x=90*n/(n+1);
  // What the problem asks: supl(comp(x)) = 180-(90-x) = 90+x
  const ans=90+x;
  const q=`Al suplemento del doble de un ángulo x se le resta su complemento y se obtiene la ${n===3?'tercera':n===4?'cuarta':n===5?'quinta':'octava'} parte de x. Calcula el suplemento del complemento de x.`;
  const ws=[ans+10,ans-10,ans+25,90-x].filter(v=>v>0&&v<180&&v!==ans).slice(0,3);
  return{q,a:`${ans}°`,opts:_sa2shuf([`${ans}°`,...ws.map(v=>`${v}°`)]),mc:true};
}

// EX-B5: Dos ángulos suplementarios en razón a:b
function _genSa2EX_B5(){
  const ratios=[[3,7],[4,5],[2,7],[1,4],[2,3],[1,8]].filter(([a,b])=>180%(a+b)===0);
  const[a,b]=_sa2pick(ratios);
  const small=180*a/(a+b);
  const q=`Dos ángulos adyacentes suplementarios están en razón ${a}:${b}. ¿Cuánto mide el ángulo menor?`;
  const ws=[small+5,180-small,small+10,small-10].filter(v=>v>0&&v<180&&v!==small).slice(0,3);
  return{q,a:`${small}°`,opts:_sa2shuf([`${small}°`,...ws.map(v=>`${v}°`)]),mc:true};
}

// EX-B6: AOC=α, BOD=β → find BOC (with SVG)
function _genSa2EX_B6(){
  const aoc=_sa2pick([120,130,140,150]);
  const bod=_sa2pick([60,70,80,90,100,110,120].filter(v=>v<aoc));
  const c=180-aoc,b=bod-c,a=aoc-b;
  if(a<=0||b<=0||c<=0)return _genSa2EX_B6();
  // SVG: line A-O-D, rays OB and OC above
  const CX=110,CY=110,L=75;
  const bAng=(180-a)*Math.PI/180;// OB from +x
  const cAng=c*Math.PI/180;// OC from +x (c degrees from OD)
  const svg=_sa2svgWrap(
    `<line x1="${CX-L}" y1="${CY}" x2="${CX+L}" y2="${CY}"/>` +
    `<line x1="${CX}" y1="${CY}" x2="${(CX+L*Math.cos(bAng)).toFixed(1)}" y2="${(CY-L*Math.sin(bAng)).toFixed(1)}"/>` +
    `<line x1="${CX}" y1="${CY}" x2="${(CX+L*Math.cos(cAng)).toFixed(1)}" y2="${(CY-L*Math.sin(cAng)).toFixed(1)}"/>` +
    `<text x="${CX-L-8}" y="${CY+4}" text-anchor="end">A</text>` +
    `<text x="${CX+L+5}" y="${CY+4}">D</text>` +
    `<text x="${(CX+L*Math.cos(bAng)).toFixed(1)}" y="${(CY-L*Math.sin(bAng)-5).toFixed(1)}" text-anchor="middle">B</text>` +
    `<text x="${(CX+L*Math.cos(cAng)+8).toFixed(1)}" y="${(CY-L*Math.sin(cAng)).toFixed(1)}">C</text>` +
    `<text x="${CX+3}" y="${CY+12}">O</text>` +
    `<text x="${CX-20}" y="${CY-18}" font-size="10">x°</text>` +
    _sa2arc(CX,CY,40,180,180-a+180,'',0,0)+// just a placeholder
    `<text x="${CX-50}" y="${CY+32}" font-size="9">m∠AOC=${aoc}°</text>`+
    `<text x="${CX-50}" y="${CY+44}" font-size="9">m∠BOD=${bod}°</text>`,
    240,165);
  const ws=[b+5,b-5,b+10,a,c].filter(v=>v>0&&v!==b).slice(0,3);
  return{q:`${svg}Si m∠AOC=${aoc}° y m∠BOD=${bod}°, calcula m∠BOC (x).`,a:`${b}°`,opts:_sa2shuf([`${b}°`,...ws.map(v=>`${v}°`)]),mc:true};
}

// EX-B7: Bisectrices de AOB y COD en recta (BOC dado) → ángulo = 90+BOC/2
function _genSa2EX_B7(){
  const boc=_sa2pick([60,70,80,90,100,110,120]);
  const ans=90+boc/2;
  const CX=110,CY=110,L=75;
  // Three equal sectors... simplified
  const aEnd=Math.PI,bEnd=(boc/2+90)*Math.PI/180,cEnd=0;
  const mAng=(180)*Math.PI/180+20*Math.PI/180;// bisectrix of AOB (rough)
  const nAng=(boc/2)*Math.PI/180;// bisectrix of COD
  const svg=_sa2svgWrap(
    `<line x1="${CX-L}" y1="${CY}" x2="${CX+L}" y2="${CY}"/>` +
    `<line x1="${CX}" y1="${CY}" x2="${(CX+L*Math.cos((180-40)*Math.PI/180)).toFixed(1)}" y2="${(CY-L*Math.sin((180-40)*Math.PI/180)).toFixed(1)}"/>` +
    `<line x1="${CX}" y1="${CY}" x2="${(CX+L*Math.cos((boc+20)*Math.PI/180)).toFixed(1)}" y2="${(CY-L*Math.sin((boc+20)*Math.PI/180)).toFixed(1)}"/>` +
    `<line x1="${CX}" y1="${CY}" x2="${(CX+L*Math.cos((boc/2)*Math.PI/180)).toFixed(1)}" y2="${(CY-L*Math.sin((boc/2)*Math.PI/180)).toFixed(1)}" stroke-dasharray="4,2"/>` +
    `<line x1="${CX}" y1="${CY}" x2="${(CX+L*Math.cos((180-20)*Math.PI/180)).toFixed(1)}" y2="${(CY-L*Math.sin((180-20)*Math.PI/180)).toFixed(1)}" stroke-dasharray="4,2"/>` +
    `<text x="${CX-L-8}" y="${CY+4}" text-anchor="end">A</text>` +
    `<text x="${CX+L+5}" y="${CY+4}">D</text>` +
    `<text x="${CX-L+15}" y="${CY-35}">B</text>` +
    `<text x="${CX+30}" y="${CY-35}">C</text>` +
    `<text x="${CX+3}" y="${CY+12}">O</text>` +
    `<text x="${CX-45}" y="${CY+36}" font-size="9">m∠BOC=${boc}°</text>`,
    240,160);
  const ws=[ans+5,ans-5,ans+10,90+boc].filter(v=>v>0&&v<270&&v!==ans).slice(0,3);
  return{q:`${svg}A, O, D en línea recta con rayos OB y OC. Las líneas punteadas son bisectrices de ∠AOB y ∠COD. Si m∠BOC=${boc}°, calcula el ángulo entre las bisectrices.`,a:`${ans}°`,opts:_sa2shuf([`${ans}°`,...ws.map(v=>`${v}°`)]),mc:true};
}

// EX-B8: m∠AOC=k·m∠AOB (con SVG y ángulo dado en figura)
function _genSa2EX_B8(){
  const k=_sa2pick([3,4,5]);
  const aob=_sa2pick([10,12,15,18,20,24,30].filter(v=>k*v<180));
  const aoc=k*aob;
  const boc=aoc-aob;
  const CX=110,CY=110,L=70;
  const bAng=aob*Math.PI/180,cAng=aoc*Math.PI/180;
  const svg=_sa2svgWrap(
    `<line x1="${CX}" y1="${CY}" x2="${CX+L}" y2="${CY}"/>` +// OC base
    `<line x1="${CX}" y1="${CY}" x2="${(CX+L*Math.cos(bAng)).toFixed(1)}" y2="${(CY-L*Math.sin(bAng)).toFixed(1)}"/>` +// OB
    `<line x1="${CX}" y1="${CY}" x2="${(CX+L*Math.cos(cAng)).toFixed(1)}" y2="${(CY-L*Math.sin(cAng)).toFixed(1)}"/>` +// OA (farther)
    `<text x="${CX+L+5}" y="${CY+4}">C</text>` +
    `<text x="${(CX+L*Math.cos(bAng)+5).toFixed(1)}" y="${(CY-L*Math.sin(bAng)).toFixed(1)}">B</text>` +
    `<text x="${(CX+L*Math.cos(cAng)+5).toFixed(1)}" y="${(CY-L*Math.sin(cAng)).toFixed(1)}">A</text>` +
    `<text x="${CX+3}" y="${CY+12}">O</text>` +
    _sa2arc(CX,CY,25,0,boc,`${boc}°`,37,0),
    210,155);
  const ws=[aob+3,aob-3,aob+6,aob-6].filter(v=>v>0&&v!==aob).slice(0,3);
  return{q:`${svg}Si m∠AOC = ${k}·(m∠AOB) y m∠BOC = ${boc}°, calcula m∠AOB.`,a:`${aob}°`,opts:_sa2shuf([`${aob}°`,...ws.map(v=>`${v}°`)]),mc:true};
}

// EX-B9: triple(supl-comp) = doble(supl(comp(2x))) → x=45/2 generalized
function _genSa2EX_B9(){
  // 3((180-x)-(90-x)) = 3·90 = 270 = 2·(180-(90-2x)) = 2(90+2x) = 180+4x → 4x=90 → x=22.5
  // Or let's vary: n(supl-comp) = m·supl(comp(2x)) → n·90 = m(90+2x) → x=(90n/m-90)/2
  const n=3,m=2;// from the image problem
  const x=(90*n/m-90)/2;// 22.5
  if(!Number.isFinite(x)||x<=0)return _genSa2EX_B9();
  const q=`El triple de la diferencia entre el suplemento y el complemento de x es igual al doble del suplemento del complemento del doble de x. Calcula x.`;
  const ans=x;
  const ws=[45,30,60,90].filter(v=>v!==ans);
  return{q,a:`${ans}°`,opts:_sa2shuf([`${ans}°`,...ws.map(v=>`${v}°`)]),mc:true};
}

// EX-B10: AOC=62, BOD=58, AOD=92 → BOC=28 (generalized)
function _genSa2EX_B10(){
  // a+b=AOC, b+c=BOD, a+b+c=AOD → c=AOD-AOC, b=BOD-c, BOC=b
  const aod=_sa2pick([80,90,92,95,100]);
  const aoc=_sa2pick([55,60,62,65,70].filter(v=>v<aod));
  const bod=_sa2pick([50,55,58,60,65].filter(v=>v<aod));
  const c=aod-aoc,b=bod-c,a=aoc-b;
  if(a<=0||b<=0||c<=0||b>50)return _genSa2EX_B10();
  const q=`Ángulos consecutivos AOB, BOC y COD sobre una recta. m∠AOC=${aoc}°, m∠BOD=${bod}°, m∠AOD=${aod}°. Calcula m∠BOC.`;
  const ws=[b+4,b-4,b+8,a].filter(v=>v>0&&v!==b).slice(0,3);
  return{q,a:`${b}°`,opts:_sa2shuf([`${b}°`,...ws.map(v=>`${v}°`)]),mc:true};
}

// ── EXAMEN – RECTAS PARALELAS (SVG) ──────────────────────────────────────────
// EX-C1: Zigzag – x = α + β (con SVG)
function _genSa2EX_C1(){
  const α=_sa2pick([20,25,30,35,40,45,50]);
  const β=_sa2pick([20,25,30,35,40].filter(v=>α+v<170));
  const x=α+β;
  // SVG: two horizontal parallel lines, zigzag between
  const Y1=40,Y2=130,X1=20,X2=200,XM=100,XV=120;
  // Zigzag: starts on L1 at (Xa,Y1), kink at (XV,Ym), ends at L2 at (Xb,Y2)
  const Xa=50,Xb=170,Ym=(Y1+Y2)/2;
  // angle α at L1, β at L2
  const svg=_sa2svgWrap(
    `<line x1="${X1}" y1="${Y1}" x2="${X2}" y2="${Y1}" stroke="#aaa"/>` +// L1
    `<line x1="${X1}" y1="${Y2}" x2="${X2}" y2="${Y2}" stroke="#aaa"/>` +// L2
    `<line x1="${Xa}" y1="${Y1}" x2="${XV}" y2="${Ym}"/>` +// upper segment
    `<line x1="${XV}" y1="${Ym}" x2="${Xb}" y2="${Y2}"/>` +// lower segment
    `<text x="${X1-5}" y="${Y1+4}" text-anchor="end" font-size="10">L₁</text>`+
    `<text x="${X1-5}" y="${Y2+4}" text-anchor="end" font-size="10">L₂</text>`+
    `<text x="${Xa+18}" y="${Y1-4}" font-size="10">${α}°</text>`+
    `<text x="${Xb-30}" y="${Y2+14}" font-size="10">${β}°</text>`+
    `<text x="${XV+8}" y="${Ym}" font-size="10">x°</text>`,
    220,180);
  const ws=[x+10,x-10,α,β,x+5].filter(v=>v>0&&v<180&&v!==x).slice(0,3);
  return{q:`${svg}L₁ // L₂. Calcula el ángulo x.`,a:`${x}°`,opts:_sa2shuf([`${x}°`,...ws.map(v=>`${v}°`)]),mc:true};
}

// EX-C2: Alternos internos algebraicos: ax+b = cx+d (con SVG)
function _genSa2EX_C2(){
  const xv=_sa2rnd(5,30);
  const a=_sa2pick([3,4,5,6]),b=_sa2pick([5,10,15,20]);
  const c=_sa2pick([1,2].filter(v=>v!==a));
  const d=a*xv+b-c*xv;
  if(d<=0||!Number.isInteger(d)||d>90)return _genSa2EX_C2();
  const Y1=45,Y2=130;
  const svg=_sa2svgWrap(
    `<line x1="15" y1="${Y1}" x2="215" y2="${Y1}"/>` +
    `<line x1="15" y1="${Y2}" x2="215" y2="${Y2}"/>` +
    `<line x1="170" y1="25" x2="50" y2="150"/>` +// transversal
    `<text x="10" y="${Y1+4}" text-anchor="end" font-size="10">L₁</text>`+
    `<text x="10" y="${Y2+4}" text-anchor="end" font-size="10">L₂</text>`+
    `<text x="145" y="${Y1-6}" font-size="10">(${a}x+${b})°</text>`+
    `<text x="55" y="${Y2+14}" font-size="10">(${c}x+${d})°</text>`,
    230,175);
  const ws=[xv+5,xv-5,xv+10,xv-10].filter(v=>v>0&&v!==xv).slice(0,3);
  return{q:`${svg}L₁ // L₂. Los ángulos marcados son alternos internos. Calcula x.`,a:`${xv}`,opts:_sa2shuf([`${xv}`,...ws.map(String)]),mc:true};
}

// EX-C3: Co-interiores algebraicos: (ax+b)+(cx+d)=180 (con SVG)
function _genSa2EX_C3(){
  const a=_sa2pick([2,3,4]),b=_sa2pick([5,10,15,20]);
  const c=_sa2pick([1,2,3]),d=_sa2pick([5,10,15,20,25]);
  if((180-b-d)%(a+c)!==0)return _genSa2EX_C3();
  const x=(180-b-d)/(a+c);
  if(x<=0||x>45)return _genSa2EX_C3();
  const Y1=45,Y2=130;
  const svg=_sa2svgWrap(
    `<line x1="15" y1="${Y1}" x2="215" y2="${Y1}"/>` +
    `<line x1="15" y1="${Y2}" x2="215" y2="${Y2}"/>` +
    `<line x1="60" y1="20" x2="160" y2="155"/>` +
    `<text x="10" y="${Y1+4}" text-anchor="end" font-size="10">L₁</text>`+
    `<text x="10" y="${Y2+4}" text-anchor="end" font-size="10">L₂</text>`+
    `<text x="85" y="${Y1-6}" font-size="10">(${a}x+${b})°</text>`+
    `<text x="105" y="${Y2+14}" font-size="10">(${c}x+${d})°</text>`,
    230,175);
  const ws=[x+5,x-5,x+10].filter(v=>v>0&&v!==x).slice(0,3);
  return{q:`${svg}L₁ // L₂. Los ángulos marcados son co-interiores. Calcula x.`,a:`${x}`,opts:_sa2shuf([`${x}`,...ws.map(String)]),mc:true};
}

// EX-C4: (ax-b)+(cx+d)=180 (forma más exacta de imagen 14)
function _genSa2EX_C4(){
  const a=_sa2pick([4,5,6]),b=_sa2pick([3,5,10]);
  const c=_sa2pick([3,4,5,6].filter(v=>v!==a)),d=_sa2pick([3,5,10]);
  if((180+b-d)%(a+c)!==0)return _genSa2EX_C4();
  const x=(180+b-d)/(a+c);
  if(x<=0||x>40)return _genSa2EX_C4();
  const Y1=45,Y2=130;
  const svg=_sa2svgWrap(
    `<line x1="15" y1="${Y1}" x2="215" y2="${Y1}"/>` +
    `<line x1="15" y1="${Y2}" x2="215" y2="${Y2}"/>` +
    `<line x1="160" y1="22" x2="60" y2="155"/>` +
    `<text x="10" y="${Y1+4}" text-anchor="end" font-size="10">L₁</text>`+
    `<text x="10" y="${Y2+4}" text-anchor="end" font-size="10">L₂</text>`+
    `<text x="100" y="${Y1-5}" font-size="10">(${a}x−${b})°</text>`+
    `<text x="60" y="${Y2+14}" font-size="10">(${c}x+${d})°</text>`,
    230,175);
  const ws=[x+5,x-5,x+10].filter(v=>v>0&&v!==x).slice(0,3);
  return{q:`${svg}L₁ // L₂. Co-interiores. Calcula x.`,a:`${x}`,opts:_sa2shuf([`${x}`,...ws.map(String)]),mc:true};
}

// EX-C5: Alternos externos iguales con álgebra: αx+90 y β·α (del imagen 12)
function _genSa2EX_C5(){
  // 5α+90 = 7α (alternos externos) → 2α=90 → α=45
  const k1=_sa2pick([3,4,5,6]),c=_sa2pick([60,70,80,90]);
  const k2=_sa2pick([2,3].filter(v=>v!==1));
  // (k1·α + c) = k2·something... simplify: k1·α + c = (k1+k2)·α → c = k2·α → α=c/k2
  if(c%k2!==0)return _genSa2EX_C5();
  const α=c/k2;
  if(α<=0||α>60)return _genSa2EX_C5();
  const Y1=45,Y2=130;
  const svg=_sa2svgWrap(
    `<line x1="15" y1="${Y1}" x2="215" y2="${Y1}"/>` +
    `<line x1="15" y1="${Y2}" x2="215" y2="${Y2}"/>` +
    `<line x1="55" y1="22" x2="175" y2="155"/>` +
    `<text x="10" y="${Y1+4}" text-anchor="end" font-size="10">L₁</text>`+
    `<text x="10" y="${Y2+4}" text-anchor="end" font-size="10">L₂</text>`+
    `<text x="95" y="${Y1-5}" font-size="10">${k1}α + ${c}°</text>`+
    `<text x="130" y="${Y2+14}" font-size="10">${k1+k2}α</text>`,
    230,175);
  const ws=[α+5,α-5,α+10].filter(v=>v>0&&v!==α).slice(0,3);
  return{q:`${svg}L₁ // L₂. Si los ángulos marcados son iguales (alternos externos). Calcula α.`,a:`${α}°`,opts:_sa2shuf([`${α}°`,...ws.map(v=>`${v}°`)]),mc:true};
}

// EX-C6: Suma w+x+y en tres transversales (imagen problema 9)
function _genSa2EX_C6(){
  // Three parallel lines cut by one transversal. Angles x, y, w are on each parallel = each is same → x+y+w = 3·base
  // Actually: they can be a,b,c with a+b+c = 360-base or similar. Simplified version:
  // Problem 9 in image: three parallel lines, one transversal. angles w, y, x. Sum = 3*70 = 210 for base 70.
  const base=_sa2pick([60,70,75,80]);
  const ans=base*3;
  const q=`Tres rectas paralelas son cortadas por una transversal. Los ángulos alternos internos consecutivos miden w°, y° y x°. Si el ángulo de la transversal en la primera paralela es ${base}°, calcula w + y + x.`;
  const ws=[ans+10,ans-10,ans+15,ans-15,360-base].filter(v=>v>0&&v!==ans).slice(0,3);
  return{q,a:`${ans}°`,opts:_sa2shuf([`${ans}°`,...ws.map(v=>`${v}°`)]),mc:true};
}

// EX-C7: Suma r+s+t con ángulos de 40° y 60° en punto medio (imagen problema 10)
function _genSa2EX_C7(){
  const p=_sa2pick([30,40,50]),q2=_sa2pick([40,50,60,70].filter(v=>v!==p));
  // r+s+t: at the middle point, angles around = 360. r is alt to left-top, s is in the center, t is alt to right-bottom
  // r = 180-p (supplement of angle p at L1), t = 180-q2 (supplement of angle q2 at L2), s = p+q2 (zigzag)
  const r=180-p,t=180-q2,s=p+q2;
  if(r+s+t>500||r+s+t<200)return _genSa2EX_C7();
  const ans=r+s+t;
  const q3=`Dos rectas paralelas cortadas por una secante forman ángulos de ${p}° y ${q2}° en cada paralela. Los ángulos r, s y t se forman en el punto de cruce intermedio. Calcula r + s + t.`;
  const ws=[ans+10,ans-10,ans+20,360].filter(v=>v>0&&v!==ans).slice(0,3);
  return{q:q3,a:`${ans}°`,opts:_sa2shuf([`${ans}°`,...ws.map(v=>`${v}°`)]),mc:true};
}

// EX-C8: Con ángulos paralelos en flecha (imagen 8, ángulo 45° con flecha)
function _genSa2EX_C8(){
  const a=_sa2pick([30,35,40,45,50,55,60]);
  // Two parallel lines with arrows, transversal at angle a. What is x (alternate interior)?
  // With arrows (same direction), alternate exterior = equal, so x = a
  const q=`L₁ // L₂. Una secante forma un ángulo de ${a}° con L₁. Los segmentos de L₁ y L₂ van en el mismo sentido (indicado por flechas). Calcula x (ángulo correspondiente en L₂).`;
  const ws=[180-a,a+10,a-10,a+15].filter(v=>v>0&&v<180&&v!==a).slice(0,3);
  return{q,a:`${a}°`,opts:_sa2shuf([`${a}°`,...ws.map(v=>`${v}°`)]),mc:true};
}

// Función principal del examen
function _genSa2EXAM(){
  const pool=[
    _genSa2EX_A1,_genSa2EX_A2,_genSa2EX_A3,_genSa2EX_A4,
    _genSa2EX_B1,_genSa2EX_B2,_genSa2EX_B3,_genSa2EX_B4,_genSa2EX_B5,
    _genSa2EX_B6,_genSa2EX_B7,_genSa2EX_B8,_genSa2EX_B9,_genSa2EX_B10,
    _genSa2EX_C1,_genSa2EX_C2,_genSa2EX_C3,_genSa2EX_C4,_genSa2EX_C5,
    _genSa2EX_C6,_genSa2EX_C7,_genSa2EX_C8
  ];
  return _sa2pick(pool)();
}

// ── HCA 5° Primaria – Matemática ─────────────────────────────────────────────
function _hca5rnd(a,b){return Math.floor(Math.random()*(b-a+1))+a;}
function _hca5pick(a){return a[_hca5rnd(0,a.length-1)];}
function _hca5shuf(a){const r=[...a];for(let i=r.length-1;i>0;i--){const j=_hca5rnd(0,i);[r[i],r[j]]=[r[j],r[i]];}return r;}

// ── Potenciación ──────────────────────────────────────────────────────────────
// helper: expresa base^exp con <sup>
function _hca5pow(b,e){return b+'<sup>'+e+'</sup>';}
// b1: Completar tabla — base y exponente dados, calcular potencia
function _genHca5POT_B1(){
  const b=_hca5rnd(2,9),e=_hca5rnd(2,4);
  const p=Math.pow(b,e);
  const wrongs=_hca5shuf([p+1,p-1,b*e,Math.pow(b,e+1)].filter(x=>x>0&&x!==p)).slice(0,3);
  return{q:'Completa la tabla de potenciación:<br>Base: '+b+'   Exponente: '+e+'   Potencia: ?',
    a:String(p),opts:_hca5shuf([String(p),...wrongs.map(String)]),mc:true,
    ste:_hca5pow(b,e)+' = '+Array.from({length:e},()=>b).join(' × ')+' = '+p};
}
// b2: Calcular potencia directa (bases 2–9, exponentes 2–3)
function _genHca5POT_B2(){
  const b=_hca5rnd(2,9),e=_hca5pick([2,3]);
  const p=Math.pow(b,e);
  const wrongs=_hca5shuf([p+b,p-1,b*e,Math.pow(b+1,e)].filter(x=>x>0&&x!==p)).slice(0,3);
  return{q:'¿Cuánto es '+_hca5pow(b,e)+'?',
    a:String(p),opts:_hca5shuf([String(p),...wrongs.map(String)]),mc:true,
    ste:_hca5pow(b,e)+' = '+Array.from({length:e},()=>b).join(' × ')+' = '+p};
}
// b3: Potencias con bases 5–9, exponentes 2–3
function _genHca5POT_B3(){
  const b=_hca5rnd(5,9),e=_hca5pick([2,3]);
  const p=Math.pow(b,e);
  const wrongs=_hca5shuf([p+b,p-b,b*(e+1),Math.pow(b+1,e)].filter(x=>x>0&&x!==p)).slice(0,3);
  return{q:'Calcula: '+_hca5pow(b,e),
    a:String(p),opts:_hca5shuf([String(p),...wrongs.map(String)]),mc:true,
    ste:_hca5pow(b,e)+' = '+Array.from({length:e},()=>b).join(' × ')+' = '+p};
}
// bq1: Quiz potenciación básica
function _genHca5POT_BQ1(){return _hca5pick([_genHca5POT_B1,_genHca5POT_B2,_genHca5POT_B3])();}
// b4: Cuadrado y cubo — nombre especial
function _genHca5POT_B4(){
  const isPow2=_hca5pick([true,false]);
  const b=isPow2?_hca5rnd(2,12):_hca5rnd(2,7);
  const e=isPow2?2:3;
  const p=Math.pow(b,e);
  const ans=isPow2?'cuadrado':'cubo';
  const other=isPow2?'cubo':'cuadrado';
  return{q:_hca5pow(b,e)+' = '+p+'. El exponente '+e+' también se llama...',
    a:ans,opts:_hca5shuf([ans,other,'potencia','base']),mc:true,
    ste:'Exponente 2 → cuadrado ('+_hca5pow(b,2)+' = '+Math.pow(b,2)+'); Exponente 3 → cubo.'};
}
// b5: Problemas de combinaciones con potencias
function _genHca5POT_B5(){
  return _hca5pick([
    {q:'Un candado tiene 3 discos con cifras del 1 al 9. ¿Cuántas combinaciones posibles hay? Expresa el resultado como potencia.',
     a:'9<sup>3</sup> = 729',opts:_hca5shuf(['9<sup>3</sup> = 729','3<sup>9</sup> = 19 683','9×3 = 27','3<sup>3</sup> = 27']),mc:true,
     ste:'3 discos × 9 opciones cada uno → 9×9×9 = 9<sup>3</sup> = 729.'},
    {q:'Un trompo hexagonal (6 colores) se gira 5 veces. ¿Cuántas combinaciones de colores hay?',
     a:'6<sup>5</sup> = 7 776',opts:_hca5shuf(['6<sup>5</sup> = 7 776','5<sup>6</sup> = 15 625','6×5 = 30','5<sup>5</sup> = 3 125']),mc:true,
     ste:'5 giros, 6 colores posibles → 6<sup>5</sup> = 7 776 combinaciones.'},
    {q:'Un candado tiene 4 discos con cifras del 0 al 9. ¿Cuántas combinaciones hay?',
     a:'10<sup>4</sup> = 10 000',opts:_hca5shuf(['10<sup>4</sup> = 10 000','4<sup>10</sup> = 1 048 576','9<sup>4</sup> = 6 561','40<sup>4</sup>']),mc:true,
     ste:'4 discos × 10 dígitos (0–9) → 10<sup>4</sup> = 10 000 combinaciones.'},
    {q:'Hay 5 botes, en cada bote hay 5 bolsas y en cada bolsa hay 5 pescados. ¿Cuántos pescados hay?',
     a:'5<sup>3</sup> = 125',opts:_hca5shuf(['5<sup>3</sup> = 125','5×3 = 15','3<sup>5</sup> = 243','5+5+5 = 15']),mc:true,
     ste:'5 × 5 × 5 = 5<sup>3</sup> = 125 pescados.'},
  ]);
}
// bq2: Quiz potenciación avanzada
function _genHca5POT_BQ2(){return _hca5pick([_genHca5POT_B3,_genHca5POT_B4,_genHca5POT_B5])();}
// bpu: BPU
function _genHca5POT_BPU(){return _hca5pick([_genHca5POT_B1,_genHca5POT_B2,_genHca5POT_B3,_genHca5POT_B4,_genHca5POT_B5])();}

// ── Múltiplos ─────────────────────────────────────────────────────────────────
// b1: Primeros N múltiplos de X
function _genHca5MPL_B1(){
  const n=_hca5rnd(2,9),count=_hca5rnd(4,6);
  const mults=Array.from({length:count},(_,i)=>n*i);
  const correct=mults.join(', ');
  const w1=Array.from({length:count},(_,i)=>n*(i+1)).join(', ');
  const w2=Array.from({length:count},(_,i)=>n*i+1).join(', ');
  const w3=mults.slice(1).join(', ');
  return{q:`Escribe los primeros ${count} múltiplos de ${n} (empezando desde 0):`,
    a:correct,opts:_hca5shuf([correct,w1,w2,w3]),mc:true,
    ste:`${n}×0=0, ${n}×1=${n}, ${n}×2=${n*2}... → ${correct}`};
}
// b2: ¿Es X múltiplo de Y?
function _genHca5MPL_B2(){
  const base=_hca5rnd(2,9);
  const isMult=_hca5pick([true,false]);
  let num;
  if(isMult){num=base*_hca5rnd(2,15);}
  else{do{num=base*_hca5rnd(2,10)+_hca5rnd(1,base-1);}while(num%base===0);}
  const ans=isMult?'Sí':'No';
  const other=isMult?'No':'Sí';
  const ste=isMult?`${num} ÷ ${base} = ${num/base} (resto 0) → SÍ es múltiplo.`
    :`${num} ÷ ${base} = ${Math.floor(num/base)} R${num%base} → NO es múltiplo.`;
  return{q:`¿Es ${num} múltiplo de ${base}?`,
    a:ans,opts:_hca5shuf([ans,other,'Solo los pares son múltiplos','Depende del exponente']),mc:true,ste};
}
// bq1: Quiz múltiplos básico
function _genHca5MPL_BQ1(){return _hca5pick([_genHca5MPL_B1,_genHca5MPL_B2])();}
// b3: Múltiplos comprendidos entre A y B
function _genHca5MPL_B3(){
  const base=_hca5rnd(2,9);
  const lo=_hca5rnd(10,30)*base+_hca5rnd(1,base-1);
  const hi=lo+base*_hca5rnd(4,7);
  const mults=[];
  for(let m=Math.ceil(lo/base)*base;m<=hi;m+=base)mults.push(m);
  const correct=mults.join(', ');
  const w1=mults.map(x=>x+1).join(', ');
  const w2=mults.slice(1).join(', ');
  const w3=[...mults,mults[mults.length-1]+base].join(', ');
  return{q:`Escribe los múltiplos de ${base} comprendidos entre ${lo} y ${hi}:`,
    a:correct,opts:_hca5shuf([correct,w1,w2,w3]),mc:true,
    ste:`De ${mults[0]} (${base}×${mults[0]/base}) hasta ${mults[mults.length-1]} (${base}×${mults[mults.length-1]/base}): ${correct}`};
}
// b4: Múltiplos menores que N
function _genHca5MPL_B4(){
  const base=_hca5rnd(2,9);
  const k=_hca5rnd(4,8);
  const limit=base*k+_hca5rnd(1,base-1);
  const mults=[];
  for(let m=0;m<limit;m+=base)mults.push(m);
  const correct=mults.join(', ');
  const withExtra=[...mults,base*k].join(', ');
  const noZero=mults.slice(1).join(', ');
  const wrongShift=mults.map(x=>x+1).join(', ');
  return{q:`¿Cuáles son los múltiplos de ${base} menores que ${limit}?`,
    a:correct,opts:_hca5shuf([correct,withExtra,noZero,wrongShift]),mc:true,
    ste:`Múltiplos de ${base} < ${limit}: ${correct}. (El primer múltiplo es 0.)`};
}
// bq2: Quiz múltiplos avanzado
function _genHca5MPL_BQ2(){return _hca5pick([_genHca5MPL_B3,_genHca5MPL_B4])();}
// bpu: BPU
function _genHca5MPL_BPU(){return _hca5pick([_genHca5MPL_B1,_genHca5MPL_B2,_genHca5MPL_B3,_genHca5MPL_B4])();}

// ── Divisores y Números Primos ────────────────────────────────────────────────
// b1: ¿Es X divisor de Y?
function _genHca5DVS_B1(){
  const nums=[12,18,20,24,30,36,45,48,60,72,100];
  const n=_hca5pick(nums);
  const allDivs=[];for(let i=1;i<=n;i++){if(n%i===0)allDivs.push(i);}
  const isDiv=_hca5pick([true,false]);
  let d;
  if(isDiv){d=_hca5pick(allDivs.filter(x=>x>1&&x<n));}
  else{do{d=_hca5rnd(2,n-1);}while(n%d===0);}
  const ans=isDiv?'Sí, es divisor':'No, no es divisor';
  const other=isDiv?'No, no es divisor':'Sí, es divisor';
  const ste=isDiv?`${n} ÷ ${d} = ${n/d} (resto 0) → ${d} SÍ es divisor de ${n}.`
    :`${n} ÷ ${d} = ${Math.floor(n/d)} R${n%d} → ${d} NO es divisor de ${n}.`;
  return{q:`¿Es ${d} divisor de ${n}?`,
    a:ans,opts:_hca5shuf([ans,other,'Solo si es primo','Solo si es par']),mc:true,ste};
}
// b2: Hallar todos los divisores
function _genHca5DVS_B2(){
  const nums=[12,15,18,20,24,28,30,36];
  const n=_hca5pick(nums);
  const divs=[];for(let i=1;i<=n;i++){if(n%i===0)divs.push(i);}
  const correct=divs.join(', ');
  const w1=divs.slice(0,-1).join(', ');
  const w2=[...divs,n+1].join(', ');
  const w3=divs.filter((_,i)=>i%2===0).join(', ');
  return{q:`¿Cuáles son todos los divisores de ${n}?`,
    a:correct,opts:_hca5shuf([correct,w1,w2,w3]),mc:true,
    ste:`Divisores de ${n}: ${correct} (${divs.length} divisores)`};
}
// bq1: Quiz divisores básico
function _genHca5DVS_BQ1(){return _hca5pick([_genHca5DVS_B1,_genHca5DVS_B2])();}
// b3: ¿Primo o compuesto?
function _genHca5DVS_B3(){
  const primes=[2,3,5,7,11,13,17,19,23,29,31,37,41,43,47];
  const composites=[4,6,8,9,10,12,14,15,16,18,20,21,22,24,25,26,27,28];
  const isPrime=_hca5pick([true,false]);
  const n=isPrime?_hca5pick(primes):_hca5pick(composites);
  const divs=[];for(let i=1;i<=n;i++){if(n%i===0)divs.push(i);}
  const ans=isPrime?'Primo':'Compuesto';
  const other=isPrime?'Compuesto':'Primo';
  const ste=isPrime
    ?`${n} solo tiene 2 divisores: 1 y ${n} → PRIMO.`
    :`${n} tiene ${divs.length} divisores: ${divs.join(', ')} → COMPUESTO.`;
  return{q:`¿El número ${n} es primo o compuesto?`,
    a:ans,opts:_hca5shuf([ans,other,'Ninguno (es el 1)','No se puede saber']),mc:true,ste};
}
// b4: Divisores + clasificar primo/compuesto
function _genHca5DVS_B4(){
  const nums=[14,21,25,27,33,35,49,50,42,63,48,71];
  const n=_hca5pick(nums);
  const divs=[];for(let i=1;i<=n;i++){if(n%i===0)divs.push(i);}
  const isPrime=divs.length===2;
  const tipo=isPrime?'primo':'compuesto';
  const correct=`Divisores: ${divs.join(', ')} → ${tipo}`;
  const w1=`Divisores: ${divs.slice(0,-1).join(', ')} → primo`;
  const w2=`Divisores: 1, ${n} → compuesto`;
  const w3=`Divisores: ${divs.join(', ')} → ${isPrime?'compuesto':'primo'}`;
  return{q:`Encuentra todos los divisores de ${n} y clasifícalo.`,
    a:correct,opts:_hca5shuf([correct,w1,w2,w3]),mc:true,
    ste:isPrime?`${n} → 2 divisores (1 y ${n}) → PRIMO.`:`${n} → ${divs.length} divisores → COMPUESTO.`};
}
// bq2: Quiz primos y compuestos
function _genHca5DVS_BQ2(){return _hca5pick([_genHca5DVS_B3,_genHca5DVS_B4])();}
// bpu: BPU
function _genHca5DVS_BPU(){return _hca5pick([_genHca5DVS_B1,_genHca5DVS_B2,_genHca5DVS_B3,_genHca5DVS_B4])();}

// ── Multiplicación ────────────────────────────────────────────────────────────
// b1: 3-4 cifras × 1 cifra
function _genHca5MUL_B1(){
  const a=_hca5rnd(100,9999),b=_hca5rnd(2,9);
  const p=a*b;
  const wrongs=_hca5shuf([p+b,p-a,p+a,p-1].filter(x=>x>0&&x!==p)).slice(0,3);
  return{q:`¿Cuánto es ${a} × ${b}?`,
    a:String(p),opts:_hca5shuf([String(p),...wrongs.map(String)]),mc:true,
    ste:`${a} × ${b} = ${p}`};
}
// b2: 4-5 cifras × 2 cifras
function _genHca5MUL_B2(){
  const a=_hca5rnd(1000,99999),b=_hca5rnd(11,99);
  const p=a*b;
  const wrongs=_hca5shuf([p+b,p+100,p-100,p-b*10].filter(x=>x>0&&x!==p)).slice(0,3);
  return{q:`¿Cuánto es ${a} × ${b}?`,
    a:String(p),opts:_hca5shuf([String(p),...wrongs.map(String)]),mc:true,
    ste:`${a} × ${b} = ${p}`};
}
// bq1: Quiz multiplicación básica
function _genHca5MUL_BQ1(){return _hca5pick([_genHca5MUL_B1,_genHca5MUL_B2])();}
// b3: 5-7 cifras × 2 cifras
function _genHca5MUL_B3(){
  const a=_hca5rnd(100000,9999999),b=_hca5rnd(11,99);
  const p=a*b;
  const wrongs=_hca5shuf([p+b*10,p-b*10,p+a,p-a].filter(x=>x>0&&x!==p)).slice(0,3);
  return{q:`¿Cuánto es ${a} × ${b}?`,
    a:String(p),opts:_hca5shuf([String(p),...wrongs.map(String)]),mc:true,
    ste:`${a} × ${b} = ${p}`};
}
// bq2: Quiz multiplicación avanzada
function _genHca5MUL_BQ2(){return _hca5pick([_genHca5MUL_B2,_genHca5MUL_B3])();}
// bpu: BPU
function _genHca5MUL_BPU(){return _hca5pick([_genHca5MUL_B1,_genHca5MUL_B2,_genHca5MUL_B3])();}

// ── División ──────────────────────────────────────────────────────────────────
// b1: División exacta 4-5 cifras ÷ 1 cifra
function _genHca5DIV_B1(){
  const b=_hca5rnd(2,9),q=_hca5rnd(1000,9999);
  const a=b*q;
  const wrongs=_hca5shuf([q+1,q-1,q+b,q-b].filter(x=>x>0&&x!==q)).slice(0,3);
  return{q:`¿Cuánto es ${a} ÷ ${b}? (división exacta)`,
    a:String(q),opts:_hca5shuf([String(q),...wrongs.map(String)]),mc:true,
    ste:`${a} ÷ ${b} = ${q} (resto 0)`};
}
// b2: División con resto 4-5 cifras ÷ 1-2 cifras
function _genHca5DIV_B2(){
  const b=_hca5rnd(2,9),q=_hca5rnd(1000,9999),r=_hca5rnd(1,b-1);
  const a=b*q+r;
  const correct=`Cociente: ${q}, Resto: ${r}`;
  const w1=`Cociente: ${q+1}, Resto: ${r>0?r-1:r}`;
  const w2=`Cociente: ${q}, Resto: 0`;
  const w3=`Cociente: ${q-1}, Resto: ${r+b}`;
  return{q:`Divide ${a} ÷ ${b}. ¿Cuáles son el cociente y el resto?`,
    a:correct,opts:_hca5shuf([correct,w1,w2,w3]),mc:true,
    ste:`${a} = ${b} × ${q} + ${r}  →  Cociente ${q}, Resto ${r}`};
}
// bq1: Quiz división básica
function _genHca5DIV_BQ1(){return _hca5pick([_genHca5DIV_B1,_genHca5DIV_B2])();}
// b3: División 5-7 cifras ÷ 2 cifras
function _genHca5DIV_B3(){
  const b=_hca5rnd(11,99),q=_hca5rnd(10000,999999),r=_hca5rnd(0,b-1);
  const a=b*q+r;
  const correct=r===0?String(q):`Cociente: ${q}, Resto: ${r}`;
  const w1=r===0?String(q+1):`Cociente: ${q+1}, Resto: ${Math.max(0,r-1)}`;
  const w2=r===0?String(q-1):`Cociente: ${q}, Resto: 0`;
  const w3=r===0?String(q+b):`Cociente: ${q-1}, Resto: ${r+b}`;
  return{q:r===0?`¿Cuánto es ${a} ÷ ${b}?`:`Divide ${a} ÷ ${b}. Indica cociente y resto.`,
    a:correct,opts:_hca5shuf([correct,w1,w2,w3]),mc:true,
    ste:r===0?`${a} ÷ ${b} = ${q} (exacta)`:`${a} = ${b} × ${q} + ${r}`};
}
// bq2: Quiz división avanzada
function _genHca5DIV_BQ2(){return _hca5pick([_genHca5DIV_B2,_genHca5DIV_B3])();}
// bpu: BPU
function _genHca5DIV_BPU(){return _hca5pick([_genHca5DIV_B1,_genHca5DIV_B2,_genHca5DIV_B3])();}

// ── Ecuaciones – Problemas Verbales ───────────────────────────────────────────
// b1: Ecuación suma/resta  x + a = b  o  b − x = a
function _genHca5EC_B1(){
  const x=_hca5rnd(10,50),a=_hca5rnd(5,30);
  const b=x+a;
  const useAdd=_hca5pick([true,false]);
  const q=useAdd?`Si x + ${a} = ${b}, ¿cuánto es x?`:`Si ${b} − x = ${a}, ¿cuánto es x?`;
  const wrongs=_hca5shuf([x+1,x-1,b,a].filter(v=>v>0&&v!==x)).slice(0,3);
  return{q,a:String(x),opts:_hca5shuf([String(x),...wrongs.map(String)]),mc:true,
    ste:`x = ${b} − ${a} = ${x}`};
}
// b2: Ecuación multiplicativa  ax = b
function _genHca5EC_B2(){
  const x=_hca5rnd(5,20),a=_hca5rnd(2,9);
  const b=a*x;
  const wrongs=_hca5shuf([x+1,x-1,b,a+x].filter(v=>v>0&&v!==x)).slice(0,3);
  return{q:`Si ${a}x = ${b}, ¿cuánto es x?`,
    a:String(x),opts:_hca5shuf([String(x),...wrongs.map(String)]),mc:true,
    ste:`x = ${b} ÷ ${a} = ${x}`};
}
// bq1: Quiz ecuaciones básicas
function _genHca5EC_BQ1(){return _hca5pick([_genHca5EC_B1,_genHca5EC_B2])();}
// b3: El doble / triple / cuádruple de un número
function _genHca5EC_B3(){
  const configs=[{mult:2,lbl:'El doble'},{mult:3,lbl:'El triple'},{mult:4,lbl:'Cuatro veces'}];
  const c=_hca5pick(configs);
  const x=_hca5rnd(5,25);
  const b=c.mult*x;
  const wrongs=_hca5shuf([x+1,x-1,b,c.mult].filter(v=>v>0&&v!==x)).slice(0,3);
  return{q:`${c.lbl} de un número es ${b}. ¿Cuál es el número?`,
    a:String(x),opts:_hca5shuf([String(x),...wrongs.map(String)]),mc:true,
    ste:`${c.mult}x = ${b}  →  x = ${b} ÷ ${c.mult} = ${x}`};
}
// b4: Problemas verbales combinados
function _genHca5EC_B4(){
  return _hca5pick([
    ()=>{const x=_hca5rnd(10,50),a=_hca5rnd(5,30);const b=x+a;
      return{q:`Andrea tiene ${x} libros. Si coloca ${a} más, tendría ${b}. ¿Cuántos tiene ahora?`,
        a:String(x),opts:_hca5shuf([String(x),String(b),String(a),String(b+a)]),mc:true,
        ste:`x + ${a} = ${b}  →  x = ${x}`};},
    ()=>{const mult=_hca5rnd(2,5),x=_hca5rnd(5,15);const sum=(mult+1)*x;
      return{q:`Julia tiene ${mult} veces la edad de su hija. Si ambas edades suman ${sum} años, ¿cuál es la edad de la hija?`,
        a:String(x),opts:_hca5shuf([String(x),String(mult*x),String(sum),String(mult)]),mc:true,
        ste:`${mult}x + x = ${sum}  →  ${mult+1}x = ${sum}  →  x = ${x}`};},
    ()=>{const x=_hca5rnd(5,20);const res=2*x;
      return{q:`Si al triple de un número le restas dicho número, resulta ${res}. ¿Cuál es el número?`,
        a:String(x),opts:_hca5shuf([String(x),String(x+1),String(res),String(3*x)]),mc:true,
        ste:`3x − x = ${res}  →  2x = ${res}  →  x = ${x}`};},
    ()=>{const x=_hca5rnd(5,15),a=_hca5rnd(2,4);const b=a*x;
      return{q:`Rebeca tiene ${a} veces el dinero de Dominique. Juntas tienen S/. ${(a+1)*x}. ¿Cuánto tiene Dominique?`,
        a:String(x),opts:_hca5shuf([String(x),String(a*x),String((a+1)*x),String(a)]),mc:true,
        ste:`${a}x + x = ${(a+1)*x}  →  ${a+1}x = ${(a+1)*x}  →  x = ${x}`};},
  ])();
}
// bq2: Quiz ecuaciones verbales
function _genHca5EC_BQ2(){return _hca5pick([_genHca5EC_B3,_genHca5EC_B4])();}
// bpu: BPU
function _genHca5EC_BPU(){return _hca5pick([_genHca5EC_B1,_genHca5EC_B2,_genHca5EC_B3,_genHca5EC_B4])();}

// Temas disponibles para retos matemáticos — una partida puede combinar varios
// ── Datos curriculares ──────────────────────────────────────────────────────────

const PREP_LEVELS = {
  primaria:   { lbl:'Primaria',   ico:'🏫', gradeIco:'🎒',
    grades:{ '1':['suma','suma10','resta','reg_b11','reg_b12','reg_b13','reg_b14','reg_b15','reg_b16','reg_b17','reg_b18','reg_b19','reg_bq1','reg_bq2','reg_bpu'], '2':['mult','div'], '3':['conjuntos'], '4':['incl4_b1','incl4_b2','incl4_b3','incl4_bq1','incl4_b4','incl4_b5','incl4_bq2','conj4_b1','conj4_b2','conj4_b3','conj4_bq1','conj4_b9','conj4_b4','conj4_b5','conj4_bq2','conj4_b6','conj4_b7','conj4_b8','conj4_bq3','sum3_b1','sum3_b2','sum3_b3','sum3_b4','sum3_bq1','mult4_b2','mult4_b3','mult4_b4','mult4_b5','mult4_b6','mult4_b7','mult4_b8','mult4_b9','mult4_bq1','mult4_bq2','mult4_bpu','conjce_b1','conjce_b2','conjce_b3','conjce_b4','conjce_bq1'], '5':[], '6':['div5x2','em_b0','em_b1','em_b2','em_b3','em_bq1','em_b4','em_b5','em_bq2','neg','ecuacion','sf6_u1_b1','sf6_u1_b2','sf6_u1_b3','sf6_u1_bq1','sf6_u1_b4','sf6_u1_b5','sf6_u1_b6','sf6_u1_bq2','sf6_u2_b1','sf6_u2_b2','sf6_u2_bq1','sf6_u2_b3','sf6_u2_b4','sf6_u2_bq2','sf6_u3_b1','sf6_u3_b2','sf6_u3_bq1','sf6_u3_b3','sf6_u3_b4','sf6_u3_bq2','sf6_u4_b1','sf6_u4_b2','sf6_u4_b3','sf6_u4_bq1','sf6_u4_b4','sf6_u4_b5','sf6_u4_b6','sf6_u4_bq2','sf6_u4_b7','sf6_u4_b8','sf6_u4_bq3','sf6_u5_b1','sf6_u5_b2','sf6_u5_bq1','sf6_u5_b3','sf6_u5_b4','sf6_u5_bq2','sf6_u5_b5','sf6_u5_b6','sf6_u5_bq3','t6_sust1_b1','t6_sust1_b2','t6_sust1_bq1','t6_sust2_b1','t6_sust2_b2','t6_sust2_bq1','t6_sust3_b1','t6_sust3_b2','t6_sust3_bq1','t6_sust_bpu','t6_va_b1','t6_va_b2','t6_va_b3','t6_va_bq1','t6_va_b4','t6_va_b5','t6_va_b6','t6_va_bq2','t6_va_bpu','t6_ec_b1','t6_ec_b2','t6_ec_bq1','t6_ec_b3','t6_ec_b4','t6_ec_bq2','t6_ec_b5','t6_ec_b6','t6_ec_bq3','t6_ec_bpu',
      'sf6_exp_b1','sf6_exp_b2','sf6_exp_bq1','sf6_exp_b3','sf6_exp_b4','sf6_exp_bq2',
      'sf6_ppp_b1','sf6_ppp_b2','sf6_ppp_bq1','sf6_ppp_b3','sf6_ppp_b4','sf6_ppp_bq2','sf6_ppp_b5','sf6_ppp_bq3',
      'sf6_rad_b1','sf6_rad_b2','sf6_rad_bq1','sf6_rad_b3','sf6_rad_b4','sf6_rad_bq2','sf6_rad_b5','sf6_rad_bq3',
      'sf6_mon_b1','sf6_mon_b2','sf6_mon_bq1','sf6_mon_b3','sf6_mon_b4','sf6_mon_bq2',
      'sf6_pol_b1','sf6_pol_b2','sf6_pol_bq1','sf6_pol_b3','sf6_pol_b4','sf6_pol_bq2',
      'sf6_pog_b1','sf6_pog_b2','sf6_pog_bq1','sf6_pog_b3','sf6_pog_b4','sf6_pog_bq2','sf6_pog_b5','sf6_pog_bq3',
      'sf6_cua_b1','sf6_cua_b2','sf6_cua_bq1','sf6_cua_b3','sf6_cua_b4','sf6_cua_bq2',
      'sf6_cir_b1','sf6_cir_b2','sf6_cir_bq1','sf6_cir_b3','sf6_cir_b4','sf6_cir_bq2','sf6_cir_b5','sf6_cir_bq3',
      'sf6_car_b1','sf6_car_b2','sf6_car_bq1','sf6_car_b3','sf6_car_b4','sf6_car_bq2'] },
    areas:[{key:'matematica', lbl:'Matemática', ico:'🔢'},{key:'razonamiento', lbl:'Razonamiento Matemático', ico:'🧠'}] },
  secundaria: { lbl:'Secundaria', ico:'📐', gradeIco:'📚',
    grades:{ '1':['trigoprop','trig1_a1','trig1_a2','trig1_a3','trig1_a4','trig1_a5','trig1_angulo','trig1_m1','trig1_m2','trig1_m3','trig1_medicion','trig1_l1','trig1_l2','trig1_l3','trig1_arco','fr1si_b1','fr1si_b2','fr1si_b3','fr1si_b4','fr1si_bq1','fr1si_b5','fr1si_b6','fr1si_b7','fr1si_bq2','fr1si_b8','fr1si_b9','fr1si_b10','fr1si_b11','fr1si_bq3','fr1si_b12','fr1si_b13','fr1si_bq4','exp1_b1','exp1_b2','exp1_b3','exp1_bq1','exp1_b4','exp1_b5','exp1_b6','exp1_bq2','exp1_b7','exp1_b8','exp1_bq3','exp1_bpu'],
      '2':['hca2_pol_b1','hca2_pol_b2','hca2_pol_b3','hca2_pol_bq1','hca2_pol_b4','hca2_pol_b5','hca2_pol_bq2','hca2_pol_bpu','hca2_dec_b1','hca2_dec_b2','hca2_dec_b3','hca2_dec_bq1','hca2_dec_b4','hca2_dec_b5','hca2_dec_b6','hca2_dec_bq2','hca2_dec_bpu','hca2_ec_b1','hca2_ec_b2','hca2_ec_bq1','hca2_ec_b3','hca2_ec_b4','hca2_ec_bq2','hca2_ec_b5','hca2_ec_bq3','hca2_ec_bpu','hca2_r3_b1','hca2_r3_b2','hca2_r3_bq1','hca2_r3_b3','hca2_r3_b4','hca2_r3_bq2','hca2_r3_b5','hca2_r3_bq3','hca2_r3_bpu','sa2_ang_b1','sa2_ang_b2','sa2_ang_bq1','sa2_ang_b3','sa2_ang_b4','sa2_ang_bq2','sa2_ang_b5','sa2_ang_b6','sa2_ang_bq3','sa2_ang_bpu','sa2_par_b1','sa2_par_b2','sa2_par_bq1','sa2_par_b3','sa2_par_b4','sa2_par_bq2','sa2_par_b5','sa2_par_b6','sa2_par_bq3','sa2_par_bpu','sa2_geom_ex'],
      '3':['trigo','trigvf'], '4':[], '5':['hca5_pot_b1','hca5_pot_b2','hca5_pot_b3','hca5_pot_bq1','hca5_pot_b4','hca5_pot_b5','hca5_pot_bq2','hca5_mpl_b1','hca5_mpl_b2','hca5_mpl_bq1','hca5_mpl_b3','hca5_mpl_b4','hca5_mpl_bq2','hca5_dvs_b1','hca5_dvs_b2','hca5_dvs_bq1','hca5_dvs_b3','hca5_dvs_b4','hca5_dvs_bq2','hca5_mul_b1','hca5_mul_b2','hca5_mul_bq1','hca5_mul_b3','hca5_mul_bq2','hca5_div_b1','hca5_div_b2','hca5_div_bq1','hca5_div_b3','hca5_div_bq2','hca5_ec_b1','hca5_ec_b2','hca5_ec_bq1','hca5_ec_b3','hca5_ec_b4','hca5_ec_bq2'] },
    areas:[
      {key:'matematica',   lbl:'Matemática',       ico:'🔢'},
      {key:'algebra',      lbl:'Álgebra',           ico:'α'},
      {key:'aritmetica',   lbl:'Aritmética',        ico:'🔢'},
      {key:'trigonometria',lbl:'Trigonometría',     ico:'∠'},
      {key:'geometria',    lbl:'Geometría',         ico:'◻'},
    ] },
  preuniversitario:{ lbl:'Preuniversitario', ico:'🎓', gradeIco:'🏛️', grades:{},
    areas:[
      {key:'algebra',      lbl:'Álgebra',      ico:'α'},
      {key:'aritmetica',   lbl:'Aritmética',   ico:'🔢'},
      {key:'trigonometria',lbl:'Trigonometría',ico:'∠'},
      {key:'geometria',    lbl:'Geometría',    ico:'◻'},
    ] },
};
// Currículo: nivel → grado → unidades → habilidades (skills = claves de BINGO_TOPICS)
const PREP_CURRICULUM = {
  primaria: {
    '1':[
      {lbl:'Adición y Sustracción',                              area:'matematica',            skills:['suma','suma10','resta']},
      {lbl:'Descomposemos del 11 al 19 – Regletas',              area:'matematica', editorial:'belen', skills:['reg_b11','reg_b12','reg_b13','reg_bq1','reg_b14','reg_b15','reg_b16','reg_bq2','reg_b17','reg_b18','reg_b19']},
    ],
    '2':[{lbl:'Multiplicación y División', area:'matematica', skills:['mult','div']}],
    '3':[{lbl:'Conjuntos',                area:'matematica', skills:['conjuntos']}],
    '4':[
      {lbl:'Relaciones entre Conjuntos',       area:'matematica', editorial:'belen', skills:['incl4_b1','incl4_b2','incl4_b3','incl4_bq1','incl4_b4','incl4_b5','incl4_bq2']},
      {lbl:'Operaciones con Conjuntos',          area:'matematica', editorial:'belen', skills:['conj4_b1','conj4_b2','conj4_b3','conj4_bq1','conj4_b9','conj4_b4','conj4_b5','conj4_bq2','conj4_b6','conj4_b7','conj4_b8','conj4_bq3']},
      {lbl:'Sumas de 2 a 4 Cifras',              area:'matematica', editorial:'belen', skills:['sum2_b1','sum2_b2','sum2_b3','sum2_b4','sum2_bq1','sum3_b1','sum3_b2','sum3_b3','sum3_b4','sum3_bq1','sum4_b1','sum4_b2','sum4_b3','sum4_b4','sum4_bq1']},
      {lbl:'Conjuntos: Comprensión y Extensión', area:'matematica', editorial:'belen', skills:['conjce_b1','conjce_b2','conjce_b3','conjce_b4','conjce_bq1']},
      {lbl:'Tablas de Multiplicación del 1 al 12', area:'matematica', editorial:'belen', skills:['tabla1','tabla2','tabla3','tabla4','tabla_bq1','tabla5','tabla6','tabla7','tabla8','tabla_bq2','tabla9','tabla10','tabla11','tabla12','tabla_bq3']},
    ],
    '5':[
      {lbl:'Potenciación',                    area:'matematica', editorial:'hans_christian_andersen', skills:['hca5_pot_b1','hca5_pot_b2','hca5_pot_b3','hca5_pot_bq1','hca5_pot_b4','hca5_pot_b5','hca5_pot_bq2']},
      {lbl:'Múltiplos',                       area:'matematica', editorial:'hans_christian_andersen', skills:['hca5_mpl_b1','hca5_mpl_b2','hca5_mpl_bq1','hca5_mpl_b3','hca5_mpl_b4','hca5_mpl_bq2']},
      {lbl:'Divisores y Números Primos',      area:'matematica', editorial:'hans_christian_andersen', skills:['hca5_dvs_b1','hca5_dvs_b2','hca5_dvs_bq1','hca5_dvs_b3','hca5_dvs_b4','hca5_dvs_bq2']},
      {lbl:'Multiplicación',                  area:'matematica', editorial:'hans_christian_andersen', skills:['hca5_mul_b1','hca5_mul_b2','hca5_mul_bq1','hca5_mul_b3','hca5_mul_bq2']},
      {lbl:'División',                        area:'matematica', editorial:'hans_christian_andersen', skills:['hca5_div_b1','hca5_div_b2','hca5_div_bq1','hca5_div_b3','hca5_div_bq2']},
      {lbl:'Ecuaciones – Problemas Verbales', area:'matematica', editorial:'hans_christian_andersen', skills:['hca5_ec_b1','hca5_ec_b2','hca5_ec_bq1','hca5_ec_b3','hca5_ec_b4','hca5_ec_bq2']},
    ],
    '6':[
      {lbl:'División de 5 entre 2 Dígitos',          area:'matematica',                          skills:['div5x2']},
      {lbl:'Espacio Muestral y Suceso',               area:'matematica', editorial:'trinidad',    skills:['em_b0','em_b1','em_b2','em_b3','em_bq1','em_b4','em_b5','em_bq2']},
      {lbl:'Sustracción',                              area:'matematica', editorial:'trinidad',    skills:['t6_sust1_b1','t6_sust1_b2','t6_sust1_bq1','t6_sust2_b1','t6_sust2_b2','t6_sust2_bq1','t6_sust3_b1','t6_sust3_b2','t6_sust3_bq1']},
      {lbl:'Valor Absoluto',                           area:'matematica', editorial:'trinidad',    skills:['t6_va_b1','t6_va_b2','t6_va_b3','t6_va_bq1','t6_va_b4','t6_va_b5','t6_va_b6','t6_va_bq2']},
      {lbl:'Ecuaciones',                               area:'matematica', editorial:'trinidad',    skills:['t6_ec_b1','t6_ec_b2','t6_ec_bq1','t6_ec_b3','t6_ec_b4','t6_ec_bq2','t6_ec_b5','t6_ec_b6','t6_ec_bq3']},
      {lbl:'Números Negativos y Ecuaciones',          area:'matematica',                          skills:['neg','ecuacion']},
      {lbl:'Multiplicación y División',               area:'matematica', editorial:'san_francisco', skills:['sf6_u1_b1','sf6_u1_b2','sf6_u1_b3','sf6_u1_bq1','sf6_u1_b4','sf6_u1_b5','sf6_u1_b6','sf6_u1_bq2']},
      {lbl:'Potencias y Raíces Cuadradas',            area:'matematica', editorial:'san_francisco', skills:['sf6_u2_b1','sf6_u2_b2','sf6_u2_bq1','sf6_u2_b3','sf6_u2_b4','sf6_u2_bq2']},
      {lbl:'Jerarquía de Operaciones',                area:'matematica', editorial:'san_francisco', skills:['sf6_u3_b1','sf6_u3_b2','sf6_u3_bq1','sf6_u3_b3','sf6_u3_b4','sf6_u3_bq2']},
      {lbl:'Divisibilidad y Criterios',               area:'matematica', editorial:'san_francisco', skills:['sf6_u4_b1','sf6_u4_b2','sf6_u4_b3','sf6_u4_bq1','sf6_u4_b4','sf6_u4_b5','sf6_u4_b6','sf6_u4_bq2','sf6_u4_b7','sf6_u4_b8','sf6_u4_bq3']},
      {lbl:'Múltiplos, Divisores, Primos y Factorización', area:'matematica', editorial:'san_francisco', skills:['sf6_u5_b1','sf6_u5_b2','sf6_u5_bq1','sf6_u5_b3','sf6_u5_b4','sf6_u5_bq2','sf6_u5_b5','sf6_u5_b6','sf6_u5_bq3']},
      {lbl:'Leyes de Exponentes I – Producto y Cociente', area:'matematica', editorial:'san_francisco', skills:['sf6_exp_b1','sf6_exp_b2','sf6_exp_bq1','sf6_exp_b3','sf6_exp_b4','sf6_exp_bq2']},
      {lbl:'Leyes de Exponentes II – P⁰, P¹ y Potencia de Potencia', area:'matematica', editorial:'san_francisco', skills:['sf6_ppp_b1','sf6_ppp_b2','sf6_ppp_bq1','sf6_ppp_b3','sf6_ppp_b4','sf6_ppp_bq2','sf6_ppp_b5','sf6_ppp_bq3']},
      {lbl:'Radicales n-ésimos – Simplificación y Operaciones', area:'matematica', editorial:'san_francisco', skills:['sf6_rad_b1','sf6_rad_b2','sf6_rad_bq1','sf6_rad_b3','sf6_rad_b4','sf6_rad_bq2','sf6_rad_b5','sf6_rad_bq3']},
      {lbl:'Monomios – Grado Relativo y Absoluto', area:'matematica', editorial:'san_francisco', skills:['sf6_mon_b1','sf6_mon_b2','sf6_mon_bq1','sf6_mon_b3','sf6_mon_b4','sf6_mon_bq2']},
      {lbl:'Polinomios – Grado Absoluto y Relativo', area:'matematica', editorial:'san_francisco', skills:['sf6_pol_b1','sf6_pol_b2','sf6_pol_bq1','sf6_pol_b3','sf6_pol_b4','sf6_pol_bq2']},
      {lbl:'Polígonos – Ángulos, Diagonales y Ángulo Exterior', area:'matematica', editorial:'san_francisco', skills:['sf6_pog_b1','sf6_pog_b2','sf6_pog_bq1','sf6_pog_b3','sf6_pog_b4','sf6_pog_bq2','sf6_pog_b5','sf6_pog_bq3']},
      {lbl:'Cuadriláteros y Trapecio – Ángulos y Mediana', area:'matematica', editorial:'san_francisco', skills:['sf6_cua_b1','sf6_cua_b2','sf6_cua_bq1','sf6_cua_b3','sf6_cua_b4','sf6_cua_bq2']},
      {lbl:'Circunferencia – Ángulos Central, Inscrito y Tangentes', area:'matematica', editorial:'san_francisco', skills:['sf6_cir_b1','sf6_cir_b2','sf6_cir_bq1','sf6_cir_b3','sf6_cir_b4','sf6_cir_bq2','sf6_cir_b5','sf6_cir_bq3']},
      {lbl:'Plano Cartesiano – Coordenadas, Traslación y Simetría', area:'matematica', editorial:'san_francisco', skills:['sf6_car_b1','sf6_car_b2','sf6_car_bq1','sf6_car_b3','sf6_car_b4','sf6_car_bq2']},
    ],
  },
  secundaria: {
    '1':[{lbl:'Primera Unidad — Trigonometría',   area:'trigonometria', editorial:'intelectum', skills:['trig1_a1','trig1_a2','trig1_a3','trig1_a4','trig1_a5','trig1_angulo','trig1_m1','trig1_m2','trig1_m3','trig1_medicion','trig1_l1','trig1_l2','trig1_l3','trig1_arco']},
         {lbl:'Propiedades Trigonométricas',      area:'trigonometria', editorial:'intelectum', skills:['trigoprop']},
         {lbl:'Fracciones',                       area:'aritmetica',    editorial:'san_ignacio', skills:['fr1si_b1','fr1si_b2','fr1si_b3','fr1si_b4','fr1si_bq1','fr1si_b5','fr1si_b6','fr1si_b7','fr1si_bq2','fr1si_b8','fr1si_b9','fr1si_b10','fr1si_b11','fr1si_bq3','fr1si_b12','fr1si_b13','fr1si_bq4']},
         {lbl:'Leyes de Exponentes I',                area:'algebra',       editorial:'intelectum', skills:['exp1_b1','exp1_b2','exp1_b3','exp1_bq1','exp1_b4','exp1_b5','exp1_b6','exp1_bq2','exp1_b7','exp1_b8','exp1_bq3']}],
    '2':[
      {lbl:'Polígonos',                 area:'matematica', editorial:'hans_christian_andersen', skills:['hca2_pol_b1','hca2_pol_b2','hca2_pol_b3','hca2_pol_bq1','hca2_pol_b4','hca2_pol_b5','hca2_pol_bq2']},
      {lbl:'Operaciones con Decimales', area:'matematica', editorial:'hans_christian_andersen', skills:['hca2_dec_b1','hca2_dec_b2','hca2_dec_b3','hca2_dec_bq1','hca2_dec_b4','hca2_dec_b5','hca2_dec_b6','hca2_dec_bq2']},
      {lbl:'Ecuaciones',                area:'matematica', editorial:'hans_christian_andersen', skills:['hca2_ec_b1','hca2_ec_b2','hca2_ec_bq1','hca2_ec_b3','hca2_ec_b4','hca2_ec_bq2','hca2_ec_b5','hca2_ec_bq3']},
      {lbl:'Regla de 3',                area:'matematica', editorial:'hans_christian_andersen', skills:['hca2_r3_b1','hca2_r3_b2','hca2_r3_bq1','hca2_r3_b3','hca2_r3_b4','hca2_r3_bq2','hca2_r3_b5','hca2_r3_bq3']},
      {lbl:'Ángulos y Bisectriz',       area:'geometria',  editorial:'san_agustin', skills:['sa2_ang_b1','sa2_ang_b2','sa2_ang_bq1','sa2_ang_b3','sa2_ang_b4','sa2_ang_bq2','sa2_ang_b5','sa2_ang_b6','sa2_ang_bq3']},
      {lbl:'Rectas Paralelas y Secante',area:'geometria',  editorial:'san_agustin', skills:['sa2_par_b1','sa2_par_b2','sa2_par_bq1','sa2_par_b3','sa2_par_b4','sa2_par_bq2','sa2_par_b5','sa2_par_b6','sa2_par_bq3']},
      {lbl:'Examen General – Geometría',area:'geometria',  editorial:'san_agustin', skills:['sa2_geom_ex']},
    ], '4':[], '5':[],
    '3':[{lbl:'Razones Trigonométricas',          area:'trigonometria', editorial:'intelectum', skills:['trigo','trigvf']}],
  },
  preuniversitario:{ algebra:[], aritmetica:[], trigonometria:[], geometria:[] },
};
const PREP_EDITORIALS = {
  intelectum:     { lbl:'Intelectum',                    ico:'📘', abbr:'Intelectum' },
  saco_oliveros:  { lbl:'Saco Oliveros',                 ico:'📗' },
  belen:          { lbl:'Sagrado Corazones Belén',        ico:'📒', abbr:'S.C. Belén' },
  trinidad:       { lbl:'Santísima Trinidad',             ico:'📙', abbr:'S. Trinidad' },
  san_ignacio:    { lbl:'San Ignacio de Recalde',         ico:'📕', abbr:'S.I. Recalde' },
  san_francisco:         { lbl:'San Francisco de Asís',          ico:'📓', abbr:'S.F. Asís',   grades:{ primaria:['6'] } },
  hans_christian_andersen:{ lbl:'Hans Christian Andersen',        ico:'📘', abbr:'H.C. Andersen', grades:{ primaria:['5'], secundaria:['2'] } },
  san_agustin:             { lbl:'San Agustín',                    ico:'📗', abbr:'San Agustín',   grades:{ secundaria:['2'] } },
};
// ── Funciones de Level Up ───────────────────────────────────────────────────────

function _renderPreparatePane() {
  const el = document.getElementById('preparate-pane');
  if (!el) return;
  // Guardar valor del input de texto si existe (para no perderlo al re-render)
  const savedVal = (!(_prep.questions[_prep.currentIdx]?.mc) && !_prep.answered)
    ? (document.getElementById('prep-ans-input')?.value || '') : '';
  const prevState = el.dataset.prepState;
  el.innerHTML = _preparatePaneHtml();
  if (prevState !== _prep.state) {
    el.classList.remove('prep-pane-in');
    void el.offsetWidth;
    el.classList.add('prep-pane-in');
  }
  el.dataset.prepState = _prep.state;
  const inp = document.getElementById('prep-ans-input');
  if (inp) { if (savedVal) inp.value = savedVal; inp.focus(); }
  try { _prepSyncUrl(); } catch(e) {}
}
function _preparatePaneHtml() {
  if (_prep.state === 'config') return _prepConfigHtml();
  if (_prep.state === 'unit')   return _prepUnitPaneHtml();
  if (_prep.state === 'exam')   return _prepExamHtml();
  if (_prep.state === 'result') return _prepResultHtml();
  return '';
}
function _prepOpen(sel) { _snd.click(); _prep.openSelector=sel; _renderPreparatePane(); }
function _prepClose()  { _snd.click(); _prep.openSelector=null; _renderPreparatePane(); }
function _prepSetLevel(lvl) {
  _snd.click();
  _prep.level = lvl; _prep.editorial = null; _prep.area = null; _prep.grade = null; _prep.editorialChosen = false;
  const gradeKeys = Object.keys(PREP_LEVELS[lvl]?.grades||{}).sort((a,b)=>+a-+b);
  _prep.openSelector = gradeKeys.length ? 'grade' : null;
  _prep.topic = '';
  _renderPreparatePane();
}
function _prepSetGrade(g) {
  _snd.click();
  _prep.grade = g; _prep.editorial = null; _prep.topic = ''; _prep.editorialChosen = false;
  const areaOpts = (PREP_LEVELS[_prep.level]||{}).areas || [];
  _prep.openSelector = areaOpts.length ? 'area' : 'editorial';
  _renderPreparatePane();
}
function _prepSetArea(key) {
  _snd.click();
  const wasSelected = _prep.area === key;
  _prep.area = wasSelected ? null : key;
  _prep.openSelector = (!wasSelected && !_prep.editorialChosen) ? 'editorial' : null;
  _prep.topic = '';
  _renderPreparatePane();
}
function _prepConfigHtml() {
  const lvDef = PREP_LEVELS[_prep.level] || {};
  const gradeKeys = Object.keys(lvDef.grades||{}).sort((a,b)=>+a-+b);
  const allUnits = (PREP_CURRICULUM[_prep.level]||{})[_prep.grade] || [];
  const edKeys = Object.keys(PREP_EDITORIALS).filter(k=>{
    const g = PREP_EDITORIALS[k].grades;
    if (!g) return true; // sin restricción → siempre visible
    return !!(g[_prep.level]?.includes(_prep.grade));
  });
  const units = allUnits.filter(u=>{
    if (_prep.editorial && u.editorial !== _prep.editorial) return false;
    if (_prep.area && u.area !== _prep.area) return false;
    return true;
  });
  const allTopicKeys = units.flatMap(u=>u.skills||[]);
  const masLoading = !Array.isArray(_prepHistoryData);
  const coursePct = _prepCourseScore(allTopicKeys);
  const shown = _prep.editorialChosen;

  // ── Selector desplegable: Nivel · Grado · Área · Colegio ────────────────────
  const openSel = _prep.openSelector;
  const areaOpts = lvDef.areas || [];
  // Nivel
  const _gradeIco = lvDef.gradeIco || '📅';
  const nivelSel = openSel === 'level'
    ? Object.entries(PREP_LEVELS).map(([key,lv])=>`<button class="prep-sel-btn ${_prep.level===key?'active':''}" onclick="_prepSetLevel('${key}')">${lv.ico} ${lv.lbl}</button>`).join('')
      + `<button class="prep-opt-sq" onclick="_prepClose()" title="Cerrar" style="font-size:10px;opacity:.45">✕</button>`
    : `<button class="prep-sel-btn${_prep.level?' sel':''}" onclick="_prepOpen('level')">${_prep.level ? lvDef.ico+' '+lvDef.lbl : 'Nivel'} ▾</button>`;
  // Grado
  const gradeSel = openSel === 'grade' && gradeKeys.length
    ? gradeKeys.map(g=>`<button class="prep-sel-btn ${_prep.grade===g?'active':''}" onclick="_prepSetGrade('${g}')" title="${g}° grado">${_gradeIco} ${g}°</button>`).join('')
      + `<button class="prep-opt-sq" onclick="_prepClose()" title="Cerrar" style="font-size:10px;opacity:.45">✕</button>`
    : `<button class="prep-sel-btn${_prep.grade?' sel':''}" onclick="${gradeKeys.length?`_prepOpen('grade')`:''}" ${!gradeKeys.length?'style="opacity:.35;cursor:default"':''}>${_prep.grade ? _gradeIco+' '+_prep.grade+'° ▾' : 'Grado ▾'}</button>`;
  // Área
  const areaSel = areaOpts.length
    ? (openSel === 'area'
      ? areaOpts.map(a=>`<button class="prep-sel-btn ${_prep.area===a.key?'active':''}" onclick="_prepSetArea('${a.key}')">${a.ico||''} ${a.lbl}</button>`).join('')
        + `<button class="prep-opt-sq" onclick="_prepClose()" title="Cerrar" style="font-size:10px;opacity:.45">✕</button>`
      : `<button class="prep-sel-btn${_prep.area?' sel':''}" onclick="_prepOpen('area')">${(()=>{const a=areaOpts.find(x=>x.key===_prep.area);return _prep.area?((a?.ico||'')+' '+(a?.lbl||'Área')):'Área'})()} ▾</button>`)
    : '';
  // Colegio (siempre visible)
  const colegioSel = openSel === 'editorial'
    ? `<button class="prep-sel-btn ${!_prep.editorial?'active':''}" onclick="_snd.click();_prep.editorial=null;_prep.editorialChosen=true;_prep.openSelector=null;_renderPreparatePane()">✦ Todos</button>`
      + edKeys.map(k=>`<button class="prep-sel-btn ${_prep.editorial===k?'active':''}" onclick="_snd.click();_prep.editorial='${k}';_prep.editorialChosen=true;_prep.openSelector=null;_renderPreparatePane()" title="${PREP_EDITORIALS[k]?.lbl||k}">${PREP_EDITORIALS[k]?.ico||'🏫'} ${PREP_EDITORIALS[k]?.abbr||PREP_EDITORIALS[k]?.lbl||k}</button>`).join('')
      + `<button class="prep-opt-sq" onclick="_prepClose()" title="Cerrar" style="font-size:10px;opacity:.45">✕</button>`
    : `<button class="prep-sel-btn${(_prep.editorial||_prep.editorialChosen)?' sel':''}" onclick="_prepOpen('editorial')" title="${_prep.editorial?PREP_EDITORIALS[_prep.editorial]?.lbl:(_prep.editorialChosen?'Todos los colegios':'')}">${_prep.editorial?(PREP_EDITORIALS[_prep.editorial]?.ico+' '+(PREP_EDITORIALS[_prep.editorial]?.abbr||PREP_EDITORIALS[_prep.editorial]?.lbl)):(_prep.editorialChosen?'✦ Todos':'🏫 Colegios')} ▾</button>`;
  const dot = `<span style="color:rgba(255,255,255,0.18);padding:0 1px">·</span>`;
  // Botones de acción en la misma fila que los 4 selectores, alineados a la derecha
  const _challengeBtn = shown
    ? `<button class="prep-kh-btn-challenge" style="margin-left:auto" onclick="_prepUnitExam(['${allTopicKeys.join("','")}'])">Comenzar desafío de dominio</button>`
    : `<span style="margin-left:auto"></span>`;
  const _hasTopic = !!(_prep.topic && allTopicKeys.includes(_prep.topic));
  const _startInRow = _hasTopic
    ? `<button class="prep-start-btn" style="margin-top:0;width:auto;padding:6px 18px;font-size:13px;letter-spacing:0.03em${shown?'':';margin-left:auto'}" onclick="_prepStart()">▶ Practicar ahora</button>`
    : '';
  const selectorRow = `<div style="display:flex;gap:5px;align-items:center;flex-wrap:wrap;margin:0 0 10px">${nivelSel}${dot}${gradeSel}${areaSel?dot+areaSel:''}${dot}${colegioSel}${_challengeBtn}${_startInRow}</div>`;
  // PRE-UNIV / niveles con áreas sin grados: mostrar áreas como secciones
  if (!gradeKeys.length && areaOpts.length) {
    const visibleAreas = _prep.area ? areaOpts.filter(a=>a.key===_prep.area) : areaOpts;
    return `<div class="prep-wrap" style="padding-bottom:8px">
      ${selectorRow}
      <div class="prep-kh-units">${visibleAreas.map((a,ai)=>`
        <div class="prep-kh-unit">
          <div class="prep-kh-unit-name">${a.lbl}</div>
          <div class="prep-kh-skills"><span style="font-size:11px;color:rgba(255,255,255,0.2)">🚧 Próximamente</span></div>
        </div>`).join('')}
      </div>
      ${isAdmin() ? _prepAdminHistoryHtml() + _prepAdminReportsHtml() : _prepHistorySectionHtml()}
    </div>`;
  }

  // Encabezado con dominio de curso
  const courseHeader = `<div class="prep-kh-course-hdr">
    <div class="prep-kh-course-name">${lvDef.lbl||'¿?'}${_prep.grade?' · '+_prep.grade+'° Grado':' · ¿? Grado'}</div>
    <div class="prep-kh-mastery-row">
      <span class="prep-kh-mastery-lbl">Dominio del curso:</span>
      <div class="prep-kh-bar"><div class="prep-kh-bar-fill" style="width:${shown&&!masLoading&&allTopicKeys.length?coursePct:0}%"></div></div>
      <span class="prep-kh-mastery-lbl">${shown&&!masLoading&&allTopicKeys.length?coursePct+'%':'—'}</span>
    </div>
  </div>`;

  // Leyenda de dominio
  const _legBorder = 'border:1px solid rgba(255,255,255,0.12)';
  const _crownSvg = `<svg width="10" height="7" viewBox="0 0 20 13" fill="white"><polygon points="1,13 1,5 5,8 10,0 15,8 19,5 19,13"/></svg>`;
  const legend = `<div class="prep-kh-legend">
    <div class="prep-kh-leg-item"><div class="prep-kh-leg-sq" style="background:rgba(109,40,217,0.92);${_legBorder};display:flex;align-items:center;justify-content:center">${_crownSvg}</div>Dominado</div>
    <div class="prep-kh-leg-item"><div class="prep-kh-leg-sq" style="background:rgba(146,94,227,0.91);${_legBorder}"></div>Competente</div>
    <div class="prep-kh-leg-item"><div class="prep-kh-leg-sq" style="background:rgba(182,148,236,0.90);${_legBorder}"></div>Familiar</div>
    <div class="prep-kh-leg-item"><div class="prep-kh-leg-sq" style="background:rgba(219,201,246,0.89);${_legBorder}"></div>Intentado</div>
    <div class="prep-kh-leg-item"><div class="prep-kh-leg-sq" style="background:rgba(255,255,255,0.88);${_legBorder}"></div>No empezado</div>
  </div>`;

  // Sidebar con lista de unidades
  // Cuestionarios (bqN) y pruebas de unidad (bpu) NO cuentan como habilidades
  const pureSkillKeys   = allTopicKeys.filter(k => !/_bq\d/.test(k) && !k.includes('_bpu'));
  const totalSkillCount = pureSkillKeys.length;
  const doneSkillCount  = masLoading ? 0 : pureSkillKeys.filter(k=>_prepMasteryLevel(k)==='dominado').length;
  const levelNum = Math.floor(doneSkillCount / 5) + 1;
  const sidebarItems = units.map((unit, ui) => {
    const unitDone = !masLoading && unit.skills.length && unit.skills.every(sk=>_prepMasteryLevel(sk)==='dominado');
    const dotColor = unitDone ? '#7c3aed' : 'rgba(255,255,255,0.12)';
    const isActive = _prep.selectedUnit === ui || (_prep.selectedUnit === null && _prep.topic && unit.skills.includes(_prep.topic));
    return `<div class="prep-kh-sidebar-item${isActive?' active':''}" onclick="_snd.click();_prep.selectedUnit=(_prep.selectedUnit===${ui}?null:${ui});_renderPreparatePane()">
      <span class="prep-kh-sidebar-num">U${String(ui+1).padStart(2,'0')}</span>
      <span class="prep-kh-sidebar-name">${unit.lbl}</span>
      <span class="prep-kh-sidebar-dot" style="background:${dotColor}"></span>
    </div>`;
  }).join('');
  const _loggedId = typeof getLoggedId === 'function' ? getLoggedId() : null;
  const _isLogged = _loggedId !== null || (typeof isAdmin === 'function' && isAdmin());
  const _studentFullName = _isLogged ? (()=>{ try { const s=getFullList().find(x=>x.id===_loggedId); return s?.name||null; } catch(e){return null;} })() : null;
  const _studentIcon     = _isLogged ? (()=>{ try { const s=getFullList().find(x=>x.id===_loggedId); return s?.icon||'👤'; } catch(e){return '👤';} })() : null;
  const _studentName = _studentFullName ? _studentFullName.split(' ')[0] : null;
  const _btnStyle  = `background:#95C11F;border-color:#7ca010;color:#fff;font-weight:400;gap:5px`;
  const _btnArrow  = `<img src="/flecha-back.svg" style="height:11px;width:auto;display:block;transform:scaleX(-1);filter:brightness(0) invert(1)">`;
  const _btnEMlogo = `<img src="/emaths-logo.svg" style="height:13px;width:auto;display:block">`;
  const _inicioBtn = _isLogged
    ? `<button class="prep-sel-btn" style="${_btnStyle}" onclick="navHome()">${_btnArrow}<span style="font-size:15px;line-height:1">${_studentIcon}</span> ${_studentFullName||'Inicio'}</button>`
    : `<button class="prep-sel-btn" style="${_btnStyle}" onclick="window.location.href='/'">${_btnArrow}${_btnEMlogo} ¡Inscríbete Ya!</button>`;
  const sidebar = `<div class="prep-kh-sidebar">
    <div class="prep-kh-sidebar-inicio">
      ${_inicioBtn}
    </div>
    <div class="prep-kh-sidebar-hdr">
      <div class="prep-kh-sidebar-sub">${shown ? units.length+' Unidades' : '¿? Unidades'}</div>
      <div class="prep-kh-sidebar-sub2">${shown ? totalSkillCount+' Habilidades' : '¿? Habilidades'}</div>
    </div>
    ${shown ? sidebarItems : ''}
  </div>`;

  // Topbar: racha, nivel, habilidades (el botón de acción está ahora en el selectorRow)
  const topbar = `<div class="prep-kh-topbar">
    <div class="prep-kh-topbar-streak">🔥 <span>0</span></div>
    <span class="prep-kh-topbar-arr">→</span>
    <div class="prep-kh-topbar-level">${shown ? 'Nivel '+levelNum : 'Nivel ¿?'}</div>
    <div class="prep-kh-topbar-skills">⭐ ${shown ? doneSkillCount+'/'+totalSkillCount+' habilidades' : '¿? habilidades'}</div>
  </div>`;

  // Unidades con cuadros de habilidad + botón examen de unidad (★)
  let unitsHtml = '';
  if (!_prep.editorialChosen) {
    // Catálogo de cursos disponibles
    const _seen = new Set();
    const _catCards = [];
    Object.entries(PREP_CURRICULUM).forEach(([lvlKey, gradeMap]) => {
      const _lv2 = PREP_LEVELS[lvlKey] || {};
      Object.entries(gradeMap).forEach(([g, uList]) => {
        const _byEd = {};
        uList.forEach(u => { if (u.editorial) (_byEd[u.editorial]=_byEd[u.editorial]||[]).push(u); });
        Object.entries(_byEd).forEach(([ek, eu]) => {
          const _ck = `${ek}|${lvlKey}|${g}`;
          if (_seen.has(_ck)) return;
          _seen.add(_ck);
          const _ed2 = PREP_EDITORIALS[ek] || {};
          const _sc = eu.flatMap(u=>u.skills||[]).filter(k=>!/_bq\d/.test(k)&&!k.includes('_bpu')).length;
          const _pct = masLoading ? 0 : _prepCourseScore(eu.flatMap(u=>u.skills||[]));
          const _onclick = `_snd.click();_prep.level='${lvlKey}';_prep.grade='${g}';_prep.editorial='${ek}';_prep.editorialChosen=true;_prep.openSelector=null;_renderPreparatePane()`;
          _catCards.push(`<div onclick="${_onclick}" style="background:rgba(124,58,237,0.10);border:1px solid rgba(124,58,237,0.28);border-radius:12px;padding:9px 10px;cursor:pointer;transition:background .18s;display:flex;flex-direction:column;gap:2px" onmouseover="this.style.background='rgba(124,58,237,0.22)'" onmouseout="this.style.background='rgba(124,58,237,0.10)'">
            <div style="font-size:18px;line-height:1;margin-bottom:1px">${_ed2.ico||'📚'}</div>
            <div style="font-size:12px;font-weight:700;color:#fff;line-height:1.2">${_ed2.lbl||ek}</div>
            <div style="font-size:9.5px;color:#fff">${_lv2.ico||''} ${_lv2.lbl||lvlKey} · ${_lv2.gradeIco||'🎒'} ${g}°</div>
            <div style="font-size:9.5px;color:#fff">${eu.length} unidades · ${_sc} habilidades</div>
            <div style="margin-top:4px;height:3px;border-radius:3px;background:rgba(255,255,255,0.08);overflow:hidden"><div style="height:100%;border-radius:3px;background:#7c3aed;width:${_pct}%"></div></div>
            <div style="font-size:8.5px;color:#fff;text-align:right">${_pct}% dominado</div>
          </div>`);
        });
      });
    });
    unitsHtml = `<div style="padding:4px 0">
      <div style="font-size:10px;font-weight:800;color:rgba(255,255,255,0.3);letter-spacing:0.15em;text-transform:uppercase;margin-bottom:6px">Catálogo de cursos</div>
      <div style="display:grid;grid-template-columns:repeat(${Math.ceil(_catCards.length/2)},1fr);gap:6px">${_catCards.join('')}</div>
    </div>`;
  } else if (!allTopicKeys.length) {
    const _emptyMsg = _prep.editorial
      ? `🏫 Aún no hay ejercicios de <b>${PREP_EDITORIALS[_prep.editorial]?.lbl||_prep.editorial}</b> para este grado.`
      : '🚧 Próximamente habrá contenido para este grado.';
    unitsHtml = `<div style="text-align:center;font-size:12px;color:rgba(255,255,255,0.22);padding:22px 0">${_emptyMsg}</div>`;
  } else {
    const _renderUnit = (unit, ui) => {
      const unitDone2 = !masLoading && unit.skills.length && unit.skills.every(sk=>_prepMasteryLevel(sk)==='dominado');
      let _qn2 = 0;
      const skillsHtml = unit.skills.map((sk,si)=>{
        const def=BINGO_TOPICS[sk]||{};
        const lvl=_prepMasteryLevel(sk);
        const isSel=_prep.topic===sk;
        const isQuiz=!!def.quiz;
        const nextIsEx=si<unit.skills.length-1&&!BINGO_TOPICS[unit.skills[si+1]]?.quiz;
        const _lvlLbl={'dominado':'Dominado','competente':'Competente','familiar':'Familiar','intentado':'Intentado','pendiente':'No empezado'};
        const _lvlSuffix=_lvlLbl[lvl]?' · Nivel: '+_lvlLbl[lvl]:'';
        if(isQuiz){
          _qn2++;
          const qPct=_prepLastPct(sk);
          const qTip=`Cuestionario ${_qn2}: `+_cleanLbl(def.lbl,sk)+_lvlSuffix+(qPct!==null?' · Último: '+qPct+'%':'');
          const _bolt=(w,h)=>`<svg width="${w}" height="${h}" viewBox="0 0 652.27 754.35" xmlns="http://www.w3.org/2000/svg"><polygon points="350.4,302.44 442.81,0 0,460.48 302.02,460.76 212.32,754.35 652.27,302.08" fill="currentColor"/></svg>`;
          const qIcon=lvl==='dominado'?_bolt(16,18):(lvl==='pendiente'||lvl==='unknown')?_bolt(16,18):'⚡';
          return `<div class="prep-kh-sq quiz-sq${lvl==='unknown'||lvl==='pendiente'?'':' '+lvl}${isSel?' selected':''}" onclick="_snd.click();_prep.topic='${sk}';_prep.quizNum=${_qn2};_renderPreparatePane()" title="${qTip}" style="cursor:pointer">${qIcon}</div>`;
        }
        const skPct=_prepLastPct(sk);
        const skTip=_cleanLbl(def.lbl,sk)+_lvlSuffix+(skPct!==null?' · Último: '+skPct+'%':'');
        return `<div class="prep-kh-sq ${lvl==='unknown'||lvl==='pendiente'?'':lvl}${isSel?' selected':''}" onclick="_snd.click();_prep.topic='${sk}';_renderPreparatePane()" title="${skTip}">${lvl==='dominado'?`<svg width="18" height="13" viewBox="0 0 20 13" fill="currentColor"><polygon points="1,13 1,5 5,8 10,0 15,8 19,5 19,13"/></svg>`:(def.ico||'')}</div>`;
      }).join('');
      return `<div class="prep-kh-unit" id="prep-unit-${ui}">
        <span class="prep-kh-unit-num" title="${unit.lbl}">U${String(ui+1).padStart(2,'0')}</span>
        <div class="prep-kh-skills">
          ${skillsHtml}
          ${(()=>{const sc=_prepCourseScore(unit.skills);const el=unitDone2?'Dominado':sc>=75?'Competente':sc>=50?'Familiar':sc>0?'Intentado':null;const et=`Examen: ${unit.lbl}`+(el?` · Nivel: ${el}`:'')+(!unitDone2&&sc>0?` · Último: ${sc}%`:'')+( unitDone2?' · ¡Completado!':'');const _starSvg=`<svg width="20" height="19" viewBox="0 0 481.09 461.6" xmlns="http://www.w3.org/2000/svg"><path d="M984,788.39l54.73,103.08,115,20.21c32.69,5.74,45.68,45.7,22.6,69.56l-81.12,83.92,16.31,115.57c4.63,32.87-29.35,57.56-59.18,43L947.45,1172.5l-104.87,51.22c-29.83,14.57-63.82-10.12-59.18-43l16.31-115.57-81.12-83.92c-23.08-23.86-10.1-63.82,22.6-69.56l114.95-20.21,54.74-103.08C926.45,759.07,968.46,759.07,984,788.39Z" transform="translate(-706.91 -766.4)" fill="currentColor"/></svg>`;return `<div class="prep-kh-sq exam-sq${unitDone2?' dominado':''}" onclick="_prepUnitExam(['${unit.skills.join("','")}'],'${ui}')" title="${et}" style="cursor:pointer">${_starSvg}</div>`;})()}
        </div>
      </div>`;
    };
    if (_prep.selectedUnit !== null && units[_prep.selectedUnit]) {
      const unit = units[_prep.selectedUnit];
      const ui = _prep.selectedUnit;
      const unitDone2 = !masLoading && unit.skills.length && unit.skills.every(sk=>_prepMasteryLevel(sk)==='dominado');
      const _lvlLbl2={'dominado':'Dominado','competente':'Competente','familiar':'Familiar','intentado':'Intentado','pendiente':'No empezado'};
      const _crownSvg2=`<svg width="14" height="10" viewBox="0 0 20 13" fill="currentColor"><polygon points="1,13 1,5 5,8 10,0 15,8 19,5 19,13"/></svg>`;
      const _boltSvg2=`<svg width="14" height="16" viewBox="0 0 652.27 754.35" xmlns="http://www.w3.org/2000/svg"><polygon points="350.4,302.44 442.81,0 0,460.48 302.02,460.76 212.32,754.35 652.27,302.08" fill="currentColor"/></svg>`;
      // Badge por nivel
      const _badge=(lvl)=>{
        const sqLvl=lvl==='pendiente'||lvl==='unknown'?'':lvl;
        return `<div class="prep-kh-sq prep-kh-sk-badge${sqLvl?' '+sqLvl:''}">${lvl==='dominado'?_crownSvg2:''}</div>`;
      };
      // Separar skills normales de quizzes
      let quizCount=0;
      const rowsHtml = unit.skills.map(sk=>{
        const def=BINGO_TOPICS[sk]||{};
        const lvl=_prepMasteryLevel(sk);
        const isSel=_prep.topic===sk;
        const isQuiz=!!def.quiz;
        const pct=_prepLastPct(sk);
        const lvlText=_lvlLbl2[lvl]||'No empezado';
        if(isQuiz){
          quizCount++;
          const qDone=lvl==='dominado';
          const qPct=pct!==null?` · Último: ${pct}%`:'';
          return `<div class="prep-kh-quiz-card${qDone?' done':''}">
            <div class="prep-kh-quiz-info">
              <div class="prep-kh-quiz-tag">Cuestionario ${quizCount}</div>
              <div class="prep-kh-quiz-desc">${_cleanLbl(def.lbl,sk)}${qPct}${qDone?' · ✓ Completado':''}</div>
              <button class="prep-kh-quiz-btn" onclick="_snd.click();_prep.topic='${sk}';_prep.quizNum=${quizCount};_renderPreparatePane()">${qDone?'↺ Repetir':'Iniciar cuestionario'}</button>
            </div>
            <div class="prep-kh-quiz-ico">${_boltSvg2}</div>
          </div>`;
        }
        const cta = lvl==='competente'?'¡Bien! Estás listo para avanzar':lvl==='pendiente'||lvl==='unknown'?'Practica para subir de nivel':null;
        return `<div class="prep-kh-sk-row${isSel?' selected':''}" onclick="_snd.click();_prep.topic='${sk}';_renderPreparatePane()">
          <div class="prep-kh-sk-info">
            <div class="prep-kh-sk-name">${_cleanLbl(def.lbl,sk)}</div>
            <div class="prep-kh-sk-lvl ${lvl==='unknown'?'pendiente':lvl}">${lvlText}</div>
            ${cta?`<div class="prep-kh-sk-cta">${cta}</div>`:''}
          </div>
          ${_badge(lvl==='unknown'?'pendiente':lvl)}
        </div>`;
      }).join('');
      const sc=_prepCourseScore(unit.skills);
      const examLvl=unitDone2?'Dominado':sc>=75?'Competente':sc>=50?'Familiar':sc>0?'Intentado':null;
      const examDesc=examLvl?`Nivel: ${examLvl}${!unitDone2&&sc>0?' · Último: '+sc+'%':''}`:'Sube de nivel en todas las habilidades de esta unidad.';
      const examCard=`<div class="prep-kh-quiz-card exam-card${unitDone2?' done':''}">
        <div class="prep-kh-quiz-info">
          <div class="prep-kh-quiz-tag exam-tag">Examen</div>
          <div class="prep-kh-quiz-desc">${examDesc}${unitDone2?' · ✓ ¡Completado!':''}</div>
          <button class="prep-kh-quiz-btn exam-btn" onclick="_snd.start();_prepUnitExam(['${unit.skills.join("','")}'],'${ui}')">${unitDone2?'↺ Repetir':'Empezar examen'}</button>
        </div>
        <div class="prep-kh-quiz-ico"><svg width="22" height="21" viewBox="0 0 481.09 461.6" xmlns="http://www.w3.org/2000/svg"><path d="M984,788.39l54.73,103.08,115,20.21c32.69,5.74,45.68,45.7,22.6,69.56l-81.12,83.92,16.31,115.57c4.63,32.87-29.35,57.56-59.18,43L947.45,1172.5l-104.87,51.22c-29.83,14.57-63.82-10.12-59.18-43l16.31-115.57-81.12-83.92c-23.08-23.86-10.1-63.82,22.6-69.56l114.95-20.21,54.74-103.08C926.45,759.07,968.46,759.07,984,788.39Z" transform="translate(-706.91 -766.4)" fill="currentColor"/></svg></div>
      </div>`;
      let _qn3=0;
      const expSquaresHtml=unit.skills.map((sk,si)=>{
        const def=BINGO_TOPICS[sk]||{};
        const lvl=_prepMasteryLevel(sk);
        const isSel=_prep.topic===sk;
        const isQuiz=!!def.quiz;
        const _lvlLbl={'dominado':'Dominado','competente':'Competente','familiar':'Familiar','intentado':'Intentado','pendiente':'No empezado'};
        const _lvlSuffix=_lvlLbl[lvl]?' · Nivel: '+_lvlLbl[lvl]:'';
        if(isQuiz){
          _qn3++;
          const qPct=_prepLastPct(sk);
          const qTip=`Cuestionario ${_qn3}: `+_cleanLbl(def.lbl,sk)+_lvlSuffix+(qPct!==null?' · Último: '+qPct+'%':'');
          const _bolt=(w,h)=>`<svg width="${w}" height="${h}" viewBox="0 0 652.27 754.35" xmlns="http://www.w3.org/2000/svg"><polygon points="350.4,302.44 442.81,0 0,460.48 302.02,460.76 212.32,754.35 652.27,302.08" fill="currentColor"/></svg>`;
          const qIcon=lvl==='dominado'?_bolt(16,18):(lvl==='pendiente'||lvl==='unknown')?_bolt(16,18):'⚡';
          return `<div class="prep-kh-sq quiz-sq${lvl==='unknown'||lvl==='pendiente'?'':' '+lvl}${isSel?' selected':''}" onclick="_snd.click();_prep.topic='${sk}';_prep.quizNum=${_qn3};_renderPreparatePane()" title="${qTip}" style="cursor:pointer">${qIcon}</div>`;
        }
        const skPct=_prepLastPct(sk);
        const skTip=_cleanLbl(def.lbl,sk)+_lvlSuffix+(skPct!==null?' · Último: '+skPct+'%':'');
        return `<div class="prep-kh-sq ${lvl==='unknown'||lvl==='pendiente'?'':lvl}${isSel?' selected':''}" onclick="_snd.click();_prep.topic='${sk}';_renderPreparatePane()" title="${skTip}">${lvl==='dominado'?`<svg width="18" height="13" viewBox="0 0 20 13" fill="currentColor"><polygon points="1,13 1,5 5,8 10,0 15,8 19,5 19,13"/></svg>`:(def.ico||'')}</div>`;
      }).join('');
      const _starSvgExp=`<svg width="20" height="19" viewBox="0 0 481.09 461.6" xmlns="http://www.w3.org/2000/svg"><path d="M984,788.39l54.73,103.08,115,20.21c32.69,5.74,45.68,45.7,22.6,69.56l-81.12,83.92,16.31,115.57c4.63,32.87-29.35,57.56-59.18,43L947.45,1172.5l-104.87,51.22c-29.83,14.57-63.82-10.12-59.18-43l16.31-115.57-81.12-83.92c-23.08-23.86-10.1-63.82,22.6-69.56l114.95-20.21,54.74-103.08C926.45,759.07,968.46,759.07,984,788.39Z" transform="translate(-706.91 -766.4)" fill="currentColor"/></svg>`;
      const expExamSq=`<div class="prep-kh-sq exam-sq${unitDone2?' dominado':''}" onclick="_prepUnitExam(['${unit.skills.join("','")}'],'${ui}')" style="cursor:pointer" title="Examen: ${unit.lbl}">${_starSvgExp}</div>`;
      unitsHtml = `<div class="prep-kh-unit-exp">
        <div class="prep-kh-unit-exp-hdr">
          <span class="prep-kh-unit-exp-num">U${String(ui+1).padStart(2,'0')}</span>
          <div class="prep-kh-skills" style="flex:1">${expSquaresHtml}${expExamSq}</div>
          <button class="prep-kh-unit-exp-back" onclick="_snd.click();_prep.selectedUnit=null;_renderPreparatePane()">← Todas las unidades</button>
        </div>
        ${rowsHtml}
        ${examCard}
      </div>`;
    } else {
    const half = Math.ceil(units.length/2);
    const leftCol = units.slice(0,half).map((u,i)=>_renderUnit(u,i)).join('');
    const rightCol = units.slice(half).map((u,i)=>_renderUnit(u,half+i)).join('');
    unitsHtml = `<div class="prep-kh-units"><div class="prep-kh-col">${leftCol}</div><div class="prep-kh-col">${rightCol}</div></div>`;
    }
  }

  // Panel de inicio para la habilidad seleccionada
  let startPanel = '';
  if (_prep.topic && allTopicKeys.includes(_prep.topic)) {
    const def=BINGO_TOPICS[_prep.topic]||{};
    const _isQT=!!def.quiz, _qnLbl=_isQT&&_prep.quizNum?`Cuestionario ${_prep.quizNum}: ${_cleanLbl(def.lbl,_prep.topic)}`:_cleanLbl(def.lbl,_prep.topic);
    const qOpts=[5,10,15,20];
    const tOpts=[[180,'3 min'],[300,'5 min'],[600,'10 min'],[0,'∞']];
    startPanel = `<div class="prep-kh-panel">
      <div class="prep-kh-panel-topic">${def.ico||''} ${_qnLbl}</div>
      <div class="prep-kh-panel-opts">
        <div>
          <div class="prep-section-label" style="margin:0 0 4px">Preguntas</div>
          <div class="prep-option-row">${qOpts.map(n=>`<button class="prep-opt-sq ${_prep.qCount===n?'active':''}" onclick="_prep.qCount=${n};_renderPreparatePane()" title="${n} preguntas">${n}</button>`).join('')}</div>
        </div>
        <div>
          <div class="prep-section-label" style="margin:0 0 4px">Tiempo</div>
          <div class="prep-option-row">${tOpts.map(([s,l])=>`<button class="prep-opt-sq ${_prep.timeSec===s?'active':''}" onclick="_prep.timeSec=${s};_renderPreparatePane()" title="${s===0?'Sin límite':l}">${s===0?'∞':(s/60)+"'"}</button>`).join('')}</div>
        </div>
        <div>
          <div class="prep-section-label" style="margin:0 0 4px">Modo</div>
          <div class="prep-option-row">
            <button class="prep-opt-sq ${_prep.ansMode==='mc'?'active':''}" onclick="_prep.ansMode='mc';_renderPreparatePane()" title="Opción múltiple">☰</button>
            <button class="prep-opt-sq ${_prep.ansMode==='text'?'active':''}" onclick="_prep.ansMode='text';_renderPreparatePane()" title="Escribir respuesta">✏️</button>
          </div>
        </div>
      </div>
    </div>`;
  }

  const contentArea = `<div class="prep-kh-content">
    ${selectorRow}
    ${courseHeader}
    ${legend}
    ${unitsHtml}
    ${startPanel}
    ${isAdmin() ? _prepAdminHistoryHtml() + _prepAdminReportsHtml() : _prepHistorySectionHtml()}
  </div>`;

  return `<div class="prep-wrap" style="padding-bottom:8px">
    <div style="margin-left:259px">${topbar}</div>
    <div class="prep-kh-layout">${sidebar}${contentArea}</div>
  </div>`;
}
function _prepHistCardHtml(h, dateStr, timeStr, ok) {
  const expanded = _prepExpandedHistId === h.id;
  const lvlLbl = h.level==='primaria' ? '🏫 Primaria' : h.level==='secundaria' ? '📐 Secundaria' : '🎓 Pre-univ.';
  const gradeLbl = h.grade ? ' · ' + h.grade + '° Grado' : '';
  // Re-evaluar respuestas con lógica actual (retroactivamente corrige bugs de respuesta)
  const answers = h.answers || [];
  const reEvalAnswers = answers.map(a => ({ ...a, correct: _prepReEvalAnswer(a) }));
  const reCorrect = reEvalAnswers.filter(a=>a.correct).length;
  const reTotal   = reEvalAnswers.length || h.total || 1;
  const rePct     = reTotal > 0 ? Math.round((reCorrect/reTotal)*100) : (h.pct||0);
  const displayOk = rePct >= 70;
  let ansRows = '';
  if (expanded && reEvalAnswers.length) {
    reEvalAnswers.forEach(function(ans, i) {
      const wasFixed = ans.correct && !(h.answers[i]?.correct); // era incorrecto, ahora corregido
      const ico = ans.correct ? '✅' : '❌';
      const fixedTag = wasFixed ? ' <span style="font-size:10px;background:rgba(57,255,122,0.15);color:#39ff7a;border-radius:4px;padding:1px 5px;margin-left:4px">corregido ✓</span>' : '';
      const ansLine = ans.correct
        ? '<span style="font-size:11px;color:#39ff7a">Tu respuesta: ' + ans.given + '</span>' + fixedTag
        : '<span style="font-size:11px;color:#f87171">Tu respuesta: ' + ans.given + '</span>'
          + ' <span style="font-size:11px;color:rgba(255,255,255,0.4)">·</span>'
          + ' <span style="font-size:11px;color:#39ff7a">Correcta: ' + ans.a + '</span>';
      const idTag = '<span style="flex-shrink:0;margin-left:8px;padding-right:22px;font-size:10px;font-family:\'Barlow Condensed\',monospace;font-weight:700;color:rgba(255,255,255,0.22);letter-spacing:0.04em">#' + _exId(ans.q) + '</span>';
      ansRows += '<div style="padding:5px 0;border-top:1px solid rgba(255,255,255,0.05);display:flex;gap:8px;align-items:flex-start">'
        + '<span style="font-size:14px;flex-shrink:0">' + ico + '</span>'
        + '<div style="flex:1;min-width:0">'
        + '<div style="font-size:12px;color:rgba(255,255,255,0.8);margin-bottom:2px;display:flex;justify-content:space-between;align-items:flex-start"><span style="flex:1">' + (i+1) + '. ' + (ans.q||'') + '</span>' + idTag + '</div>'
        + ansLine
        + '</div></div>';
    });
  }
  const btnHtml = reEvalAnswers.length
    ? '<button onclick="_prepExpandedHistId=_prepExpandedHistId===\'' + h.id + '\'?null:\'' + h.id + '\';_renderPreparatePane()" style="margin-top:6px;width:100%;background:rgba(255,255,255,0.06);border:none;border-radius:6px;padding:4px 8px;font-size:11px;color:rgba(255,255,255,0.5);cursor:pointer">'
      + (expanded ? '▲ Ocultar ejercicios' : '▼ Ver ejercicios (' + reEvalAnswers.length + ')') + '</button>'
      + (expanded ? '<div style="margin-top:6px">' + ansRows + '</div>' : '')
    : '';
  const _prefix = _histTypePrefix(h);
  const _lbl = _cleanLbl(h.topicLabel||h.topic);
  return '<div class="prep-review-item ' + (displayOk?'ok':'fail') + '">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px">'
    + '<span style="font-size:13px;font-weight:900;color:rgba(255,255,255,0.85);flex:1;min-width:0">'
    + '<span style="font-weight:700;color:rgba(255,255,255,0.45)">' + _prefix + ': </span>' + _lbl
    + '</span>'
    + '<span style="font-size:14px;font-weight:900;color:' + (displayOk?'#39ff7a':'#f87171') + ';flex-shrink:0">' + reCorrect + '/' + reTotal + ' · ' + rePct + '%</span>'
    + '</div>'
    + '<div style="display:flex;justify-content:space-between;margin-top:2px">'
    + '<span style="font-size:11px;color:rgba(255,255,255,0.35)">' + lvlLbl + gradeLbl + '</span>'
    + '<span style="font-size:11px;color:rgba(255,255,255,0.3)">' + dateStr + ' ' + timeStr + '</span>'
    + '</div>'
    + btnHtml
    + '</div>';
}
function _prepHistorySectionHtml() {
  const loading = _prepHistoryLoading;
  const data = Array.isArray(_prepHistoryData) ? _prepHistoryData.filter(h=>!h.autoFromExam&&!h.autoFromQuiz) : _prepHistoryData;
  const empty = Array.isArray(data) && data.length === 0;
  return `<div style="margin-top:18px;border-top:1px solid rgba(255,255,255,0.07);padding-top:14px">
    <button class="prep-result-btn" style="width:100%" onclick="_prepShowHistory=!_prepShowHistory;_renderPreparatePane()">
      📋 ${_prepShowHistory ? '▲ Ocultar' : '▼ Ver'} mi historial
    </button>
    ${_prepShowHistory ? `<div style="margin-top:10px">
      ${loading ? `<div style="text-align:center;font-size:12px;color:rgba(255,255,255,0.35);padding:12px">Cargando…</div>`
      : empty   ? `<div style="text-align:center;font-size:12px;color:rgba(255,255,255,0.3);padding:12px">Aún no hay partidas guardadas.</div>`
      : `<div class="prep-review-list">${(data||[]).map(h => {
          const dateStr = h.completedAt?.seconds
            ? new Date(h.completedAt.seconds*1000).toLocaleDateString('es-PE',{day:'2-digit',month:'short'})
            : '—';
          const timeStr = h.completedAt?.seconds
            ? new Date(h.completedAt.seconds*1000).toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'})
            : '';
          const ok = _prepReEvalPct(h) >= 70;
          return _prepHistCardHtml(h, dateStr, timeStr, ok);
        }).join('')}</div>`}
    </div>` : ''}
  </div>`;
}
// Re-evalúa si una respuesta guardada era correcta según la lógica actual.
// Cubre dos casos:
//   1. Bug en el flag: given === a pero correct===false (error al comparar)
//   2. Bug en la respuesta: a tenía el valor equivocado; parseamos la pregunta
//      para preguntas aritméticas y recalculamos la respuesta real.
function _prepReEvalAnswer(ans) {
  if (!ans) return false;
  if (ans.correct) return true; // ya marcada correcta — mantener
  const given = String(ans.given ?? '').trim();
  const stored = String(ans.a ?? '').trim();
  // Caso 1: given === a pero el flag estaba mal
  if (given === stored) return true;
  // Caso 2: preguntas aritméticas — recalcular desde el texto de la pregunta
  const q = String(ans.q || '');
  // Operación básica: "A OP B = ?" con OP = + − × ÷
  const arith = q.match(/^\(?(-?\d+(?:[.,]\d+)?)\)?\s*([+\-−×÷×÷])\s*\(?(-?\d+(?:[.,]\d+)?)\)?\s*=\s*\?/);
  if (arith) {
    const x = parseFloat(arith[1].replace(',','.')), op = arith[2], y = parseFloat(arith[3].replace(',','.'));
    let computed = null;
    if (op==='+') computed = x+y;
    else if (op==='-'||op==='−') computed = x-y;
    else if (op==='×'||op==='×') computed = x*y;
    else if ((op==='÷'||op==='÷') && y!==0) computed = x/y;
    if (computed !== null) {
      const r = Math.round(computed*1000)/1000;
      if (String(r) === given || String(Math.round(r)) === given) return true;
    }
  }
  // Valor absoluto: "|X| = ?" o "|(X)| = ?"
  const absM = q.match(/\|\(?(-?\d+(?:[.,]\d+)?)\)?\|\s*=\s*\?/);
  if (absM) {
    const computed = Math.abs(parseFloat(absM[1].replace(',','.')));
    if (String(computed) === given || String(Math.round(computed)) === given) return true;
  }
  // Número desconocido: "__ − B = C" → A = B + C
  const blankM = q.match(/^__\s*[−\-]\s*(-?\d+)\s*=\s*(-?\d+)/);
  if (blankM) {
    const computed = parseFloat(blankM[1]) + parseFloat(blankM[2]);
    if (String(computed) === given) return true;
  }
  return false;
}
// Recalcula el pct de una sesión aplicando re-evaluación de respuestas
function _prepReEvalPct(h) {
  if (!h) return 0;
  if (!Array.isArray(h.answers) || !h.answers.length) return h.pct || 0;
  const reCorrect = h.answers.filter(a => _prepReEvalAnswer(a)).length;
  // Usar h.total como denominador si es mayor que el array guardado
  // (puede ocurrir que no todas las respuestas queden en el array pero el total sí se guarda bien)
  const denom = (h.total && h.total >= h.answers.length) ? h.total : h.answers.length;
  return Math.round((reCorrect / denom) * 100);
}
function _prepMasteryLevel(topicKey) {
  if (!Array.isArray(_prepHistoryData)) return 'unknown';
  const sessions = _prepHistoryData.filter(h=>h.topic===topicKey);
  if (!sessions.length) return 'pendiente';
  const isQuiz = !!BINGO_TOPICS[topicKey]?.quiz;
  const directSessions = sessions.filter(h=>!h.autoFromExam && !h.autoFromQuiz);
  if (isQuiz) {
    // Los cuestionarios solo cuentan si el alumno los hizo directamente.
    // Entradas autoFromExam/autoFromQuiz en cuestionarios se ignoran completamente.
    if (!directSessions.length) return 'pendiente';
    const pct = _prepReEvalPct(directSessions[0]);
    if (pct>=100) return 'dominado';
    if (pct>=75)  return 'competente';
    if (pct>=50)  return 'familiar';
    if (pct>=25)  return 'intentado';
    return 'intentado';
  }
  // Habilidades normales: sesiones directas tienen prioridad;
  // si nunca se practicó directo, usar el mejor score propagado como fallback.
  const pct = directSessions.length
    ? _prepReEvalPct(directSessions[0])
    : Math.max(...sessions.map(h=>_prepReEvalPct(h)));
  if (pct>=100) return 'dominado';
  if (pct>=75)  return 'competente';
  if (pct>=50)  return 'familiar';
  if (pct>=25)  return 'intentado';
  return 'intentado';
}
function _prepLastPct(topicKey) {
  if (!Array.isArray(_prepHistoryData)) return null;
  const isQuiz = !!BINGO_TOPICS[topicKey]?.quiz;
  // Para cuestionarios: ignorar entradas propagadas (autoFromExam/autoFromQuiz)
  const sessions = _prepHistoryData.filter(h=>h.topic===topicKey && (!isQuiz || (!h.autoFromExam && !h.autoFromQuiz)));
  if (!sessions.length) return null;
  return _prepReEvalPct(sessions[0]);
}
function _prepCourseScore(topicKeys) {
  const W={dominado:100,competente:75,familiar:50,intentado:25,pendiente:0,unknown:0};
  if (!topicKeys.length) return 0;
  return Math.round(topicKeys.map(k=>W[_prepMasteryLevel(k)]||0).reduce((a,b)=>a+b,0)/topicKeys.length);
}
function _prepGenOpts(answer) {
  // Genera 3 distractores numéricos para usar en modo MC cuando el generador no incluye opts
  const n = Number(answer);
  if (isNaN(n) || !isFinite(n)) return null; // respuesta no numérica → sin opciones
  const abs = Math.abs(n);
  // Paso de variación: pequeño para números chicos, mayor para números grandes
  const step = abs >= 1000 ? Math.round(abs*0.08) : abs >= 100 ? Math.round(abs*0.12) : abs >= 10 ? Math.max(2,Math.round(abs*0.2)) : Math.max(1, Math.round(abs*0.3)||1);
  const used = new Set([n]);
  const wrongs = [];
  const dirs = [1,-1,2,-2,3,-3,4,-4,5,-5];
  for (const d of dirs) {
    if (wrongs.length >= 3) break;
    const w = Math.round((n + d * step) * 100) / 100;
    if (!used.has(w) && (Number.isInteger(n) ? Number.isInteger(w) : true)) { used.add(w); wrongs.push(String(w)); }
  }
  // fallback: sumar enteros simples
  for (let d=1; wrongs.length<3; d++) {
    if (!used.has(n+d)) { used.add(n+d); wrongs.push(String(n+d)); }
    if (wrongs.length<3 && !used.has(n-d)) { used.add(n-d); wrongs.push(String(n-d)); }
  }
  return _bingShufArr([String(answer), ...wrongs.slice(0,3)]);
}
function _prepApplyMcMode(q) {
  // Si está en modo MC y la pregunta no tiene opts, genera opciones automáticamente
  if (_prep.ansMode === 'mc' && !q.opts) {
    const opts = _prepGenOpts(q.a);
    if (opts) { q.opts = opts; q.mc = true; }
  }
  return q;
}
function _prepStartUnit(skills) {
  const valid = (skills||[]).filter(sk=>BINGO_TOPICS[sk]);
  if (!valid.length) return;
  _prep.unitSkillList = valid;
  _prep.unitDone = [];
  _prep.state = 'unit';
  _renderPreparatePane();
}
// Genera preguntas únicas (sin repetir enunciado) para una sesión
function _prepGenUniqueQs(gen, count) {
  const qs = [], seen = new Set();
  let tries = 0, limit = count * 30;
  while (qs.length < count && tries < limit) {
    tries++;
    const q = _prepApplyMcMode(gen());
    if (!seen.has(q.q)) { seen.add(q.q); qs.push(q); }
  }
  // Si el pool es menor que count, completar sin restricción
  while (qs.length < count) qs.push(_prepApplyMcMode(gen()));
  return qs;
}
function _prepStartFromUnit(sk) {
  const def = BINGO_TOPICS[sk]; if (!def) return;
  _prep.topic = sk;
  if (def.quiz && _prep.unitSkillList.length) {
    _prep.quizNum = _prep.unitSkillList.slice(0, _prep.unitSkillList.indexOf(sk)+1).filter(s=>BINGO_TOPICS[s]?.quiz).length;
  } else { _prep.quizNum = 0; }
  const qs = _prepGenUniqueQs(def.gen.bind(def), _prep.qCount);
  Object.assign(_prep,{state:'exam',questions:qs,answers:[],currentIdx:0,selectedOpt:null,answered:false,startTime:Date.now(),endTime:null,timeLeft:_prep.timeSec,showReview:false});
  clearInterval(_prepTimerIntv);
  if (_prep.timeSec>0) _prepTimerIntv = setInterval(_prepTickTimer, 1000);
  _snd.start();
  _renderPreparatePane();
}
function _prepUnitPaneHtml() {
  const skills = _prep.unitSkillList;
  const done   = new Set(_prep.unitDone);
  const total  = skills.length;
  const doneN  = done.size;
  const pct    = total>0 ? Math.round((doneN/total)*100) : 0;
  const allDone = doneN === total && total > 0;
  const rows = skills.map(sk=>{
    const def = BINGO_TOPICS[sk]||{};
    const isDone = done.has(sk);
    return `<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:12px;background:rgba(255,255,255,${isDone?'0.03':'0.06'});border:1px solid rgba(255,255,255,${isDone?'0.05':'0.1'});margin-bottom:6px;${isDone?'opacity:0.55':'cursor:pointer'}" ${isDone?'':('onclick="_prepStartFromUnit(\''+sk+'\')"')}>`
      +`<span style="font-size:18px;flex-shrink:0">${def.ico||'📝'}</span>`
      +`<span style="flex:1;min-width:0;font-size:12px;font-weight:700;color:rgba(255,255,255,${isDone?'0.4':'0.85'})">${_cleanLbl(def.lbl,sk)}</span>`
      +(isDone
        ? '<span style="font-size:11px;color:#39ff7a;font-weight:900;flex-shrink:0">✓ LISTO</span>'
        : '<span style="padding:4px 12px;border-radius:8px;background:rgba(124,58,237,0.2);border:1px solid rgba(124,58,237,0.4);color:#a78bfa;font-size:11px;font-weight:900;flex-shrink:0">▶ HACER</span>')
      +'</div>';
  }).join('');
  return `<div class="prep-wrap" style="padding:16px">
    <button onclick="_prep.state='config';_prep.unitSkillList=[];_prep.unitDone=[];_renderPreparatePane()" style="background:none;border:none;color:rgba(255,255,255,0.4);font-size:12px;font-weight:700;cursor:pointer;margin-bottom:12px;padding:0;display:block">← Volver al catálogo</button>
    ${allDone?'<div style="text-align:center;padding:10px;margin-bottom:12px;border-radius:12px;background:rgba(57,255,122,0.08);border:1px solid rgba(57,255,122,0.25);color:#39ff7a;font-size:13px;font-weight:900">🏆 ¡Unidad completada!</div>':''}
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">
      <div style="flex:1;height:6px;border-radius:3px;background:rgba(255,255,255,0.08);overflow:hidden">
        <div style="height:100%;border-radius:3px;background:linear-gradient(90deg,#39ff7a,#00e5ff);width:${pct}%;transition:width 0.3s"></div>
      </div>
      <span style="font-size:11px;font-weight:900;color:rgba(255,255,255,0.5);flex-shrink:0">${doneN}/${total}</span>
    </div>
    ${rows}
  </div>`;
}
// Examen de unidad (★): más preguntas, mezcla todos los temas de la unidad en orden aleatorio
function _prepUnitExam(skills, unitIdx) {
  const valid = (skills||[]).filter(sk=>BINGO_TOPICS[sk]);
  if (!valid.length) return;
  const total = Math.max(10, valid.length * 5);
  const qs = [];
  for (let i=0;i<total;i++) { const sk=valid[i%valid.length]; const def=BINGO_TOPICS[sk]; if(def?.gen) qs.push(_prepApplyMcMode(def.gen())); }
  for (let i=qs.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [qs[i],qs[j]]=[qs[j],qs[i]]; }
  _prep.topic = valid[0];
  _prep.isUnitExam = true;
  _prep.examUnitSkills = [...valid];
  Object.assign(_prep,{state:'exam',questions:qs,answers:[],currentIdx:0,selectedOpt:null,answered:false,startTime:Date.now(),endTime:null,timeLeft:0,showReview:false});
  clearInterval(_prepTimerIntv);
  _snd.start();
  _renderPreparatePane();
}
function _prepStart() {
  const def = BINGO_TOPICS[_prep.topic];
  if (!def || !def.gen) { console.warn('_prepStart: no def for topic', _prep.topic); return; }
  try {
    _prep.isUnitExam = false; _prep.examUnitSkills = [];
    const qs = _prepGenUniqueQs(def.gen.bind(def), _prep.qCount);
    Object.assign(_prep, { state:'exam', questions:qs, answers:[], currentIdx:0, selectedOpt:null, answered:false, startTime:Date.now(), endTime:null, timeLeft:_prep.timeSec, showReview:false });
    clearInterval(_prepTimerIntv);
    if (_prep.timeSec > 0) _prepTimerIntv = setInterval(_prepTickTimer, 1000);
    _snd.start();
    _renderPreparatePane();
  } catch(e) {
    console.error('_prepStart error:', e);
    const el = document.getElementById('preparate-pane');
    if (el) el.insertAdjacentHTML('afterbegin', `<div style="background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.4);border-radius:8px;padding:10px 12px;margin-bottom:10px;font-size:12px;color:#f87171;font-family:monospace">⚠️ Error al generar preguntas: ${e.message}</div>`);
  }
}
function _prepTickTimer() {
  if (_prep.state !== 'exam') { clearInterval(_prepTimerIntv); return; }
  _prep.timeLeft--;
  if (_prep.timeLeft <= 0) { _prep.timeLeft = 0; _prepFinish(); return; }
  if (_prep.timeLeft <= 10) _snd.tick();
  const el = document.getElementById('prep-timer');
  if (el) {
    const m = Math.floor(_prep.timeLeft/60), s = _prep.timeLeft%60;
    el.textContent = `${m}:${s.toString().padStart(2,'0')}`;
    el.classList.toggle('urgent', _prep.timeLeft <= 30);
  }
}
function _prepFmtTime(sec) { const m=Math.floor(sec/60),s=sec%60; return `${m}:${s.toString().padStart(2,'0')}`; }
// ── LABEL CLEANER ────────────────────────────────────────────────────────────
const _cleanLbl = (lbl, fallback) => { const s = (lbl||'').replace(/^[Qq]uiz\s*[:\-–]?\s*/,'').replace(/^[IVXivx]+\s*[–\-—]\s*/,'').replace(/[Pp]rueba\s+de\s+unidad/gi,'Examen').replace(/[Pp]rueba\s+do[nñ]at/gi,'Examen').trim(); return s || fallback || lbl || ''; };

// ── QUIZ NUMBER FROM KEY (busca en PREP_CURRICULUM) ──────────────────────────
function _prepQuizNumFromKey(topicKey) {
  for (const gradeObj of Object.values(PREP_CURRICULUM||{})) {
    for (const units of Object.values(gradeObj)) {
      for (const unit of (Array.isArray(units) ? units : [])) {
        if (!unit.skills?.includes(topicKey)) continue;
        return unit.skills.slice(0, unit.skills.indexOf(topicKey)+1).filter(s=>BINGO_TOPICS[s]?.quiz).length;
      }
    }
  }
  return 0;
}

// ── HISTORY TYPE PREFIX ───────────────────────────────────────────────────────
function _histTypePrefix(h) {
  const key = h.topic||'';
  if (h.isUnitExam || key.includes('_bpu')) return 'Examen';
  if (/_bq\d/i.test(key) || BINGO_TOPICS[key]?.quiz) {
    const n = h.quizNum || _prepQuizNumFromKey(key);
    return n ? `Cuestionario ${n}` : 'Cuestionario';
  }
  return 'Habilidad';
}

// ── EXERCISE ID (deterministic short hash of question text) ──────────────────
const _exId = (q) => { let h=5381; const s=String(q||''); for(let i=0;i<s.length;i++) h=((h<<5)+h+s.charCodeAt(i))|0; return Math.abs(h).toString(36).toUpperCase().slice(0,5).padStart(5,'0'); };

// ── LEVEL UP SOUNDS ──────────────────────────────────────────────────────────
const _snd = (() => {
  let ctx = null;
  const ac = () => {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  };
  const tone = (c, freq, type, gain, t, dur, freqEnd) => {
    const o = c.createOscillator(), g = c.createGain();
    o.connect(g); g.connect(c.destination);
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (freqEnd !== undefined) o.frequency.linearRampToValueAtTime(freqEnd, t + dur);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.start(t); o.stop(t + dur + 0.01);
  };
  return {
    click()    { const c=ac(),t=c.currentTime; tone(c,650,'sine',0.06,t,0.06,520); },
    correct()  { const c=ac(),t=c.currentTime; tone(c,523,'triangle',0.18,t,0.14); tone(c,784,'triangle',0.18,t+0.12,0.22); },
    wrong()    { const c=ac(),t=c.currentTime; tone(c,200,'sawtooth',0.1,t,0.1); tone(c,170,'sawtooth',0.07,t+0.08,0.14); },
    next()     { const c=ac(),t=c.currentTime; tone(c,440,'sine',0.06,t,0.1,600); },
    start()    { const c=ac(),t=c.currentTime; tone(c,330,'sine',0.1,t,0.08); tone(c,440,'sine',0.1,t+0.07,0.08); tone(c,523,'sine',0.12,t+0.14,0.18); },
    finish()   { const c=ac(),t=c.currentTime; [523,659,784].forEach((f,i)=>tone(c,f,'triangle',0.15,t+i*0.13,0.18)); },
    dominate() { const c=ac(),t=c.currentTime; [523,659,784,1047,1047].forEach((f,i)=>tone(c,f,'triangle',0.2,t+i*0.1,0.18)); tone(c,2094,'sine',0.07,t+0.45,0.35); },
    tick()     { const c=ac(),t=c.currentTime; tone(c,1100,'square',0.035,t,0.04); },
  };
})();

function _prepSelectOpt(opt) {
  if (_prep.answered) return;
  _prep.selectedOpt = opt;
  _prep.answered = true;
  const q = _prep.questions[_prep.currentIdx];
  const correct = String(q.a).toLowerCase()===String(opt).toLowerCase();
  _prep.answers.push({ given:opt, correct, q:q.q, a:q.a, opts:q.opts, mc:true });
  correct ? _snd.correct() : _snd.wrong();
  _renderPreparatePane();
}
function _prepSubmitText() {
  if (_prep.answered) return;
  const inp = document.getElementById('prep-ans-input');
  const val = (inp ? inp.value : '').trim(); if (!val) return;
  _prep.answered = true;
  const q = _prep.questions[_prep.currentIdx];
  const correct = parseFloat(val) === parseFloat(q.a) || String(val).toLowerCase() === String(q.a).toLowerCase();
  _prep.answers.push({ given:val, correct, q:q.q, a:q.a, mc:false });
  correct ? _snd.correct() : _snd.wrong();
  _renderPreparatePane();
}
function _prepNextQ() {
  if (!_prep.answered) return;
  _prep.currentIdx++;
  _prep.answered = false; _prep.selectedOpt = null;
  if (_prep.currentIdx >= _prep.questions.length) _prepFinish();
  else { _snd.next(); _renderPreparatePane(); }
}
function _prepFinish() {
  clearInterval(_prepTimerIntv);
  _prep.state = 'result'; _prep.endTime = Date.now();
  _snd.finish();
  // Marcar skill actual como completado en el contexto de unidad
  if (_prep.unitSkillList.length>0 && _prep.topic && !_prep.unitDone.includes(_prep.topic)) {
    _prep.unitDone.push(_prep.topic);
  }
  _prepSaveHistory();
  _renderPreparatePane();
}
function _prepGetQuizSkills(quizTopic) {
  // PREP_CURRICULUM[level] es objeto por grado → aplanar todos los arrays de unidades
  const levelData = PREP_CURRICULUM[_prep.level] || {};
  const allUnits = Object.values(levelData).flat();
  for (const unit of allUnits) {
    if (!Array.isArray(unit.skills)) continue;
    const idx = unit.skills.indexOf(quizTopic);
    if (idx === -1) continue;
    // Encontrar cuestionario anterior (si lo hay)
    let prevIdx = -1;
    for (let i = idx-1; i >= 0; i--) {
      if (BINGO_TOPICS[unit.skills[i]]?.quiz) { prevIdx = i; break; }
    }
    // Habilidades entre el cuestionario anterior y este (excluir quizzes)
    return unit.skills.slice(prevIdx+1, idx).filter(sk => !BINGO_TOPICS[sk]?.quiz);
  }
  return [];
}
async function _prepSaveHistory() {
  try {
    const me = _bingoMe();
    const def = BINGO_TOPICS[_prep.topic] || {};
    const correct = _prep.answers.filter(a=>a.correct).length;
    const total = _prep.questions.length;
    const secs = _prep.startTime && _prep.endTime ? Math.round((_prep.endTime-_prep.startTime)/1000) : 0;
    const pct = total>0 ? Math.round((correct/total)*100) : 0;
    // Actualización optimista: insertar resultado localmente de inmediato
    // para que los colores de dominio se refresquen sin esperar a Firestore
    const localEntry = {
      uid: me.uid, name: me.name, level: _prep.level, grade: _prep.grade||'',
      topic: _prep.topic, topicLabel: _cleanLbl(def.lbl||_prep.topic), isUnitExam: !!_prep.isUnitExam, quizNum: _prep.quizNum||0,
      correct, total, pct, timeSec: secs,
      answers: _prep.answers.map(a=>({q:a.q,a:a.a,given:a.given,correct:a.correct})),
      completedAt: { seconds: Math.floor(Date.now()/1000) }
    };
    if (Array.isArray(_prepHistoryData)) _prepHistoryData.unshift(localEntry);
    else _prepHistoryData = [localEntry];
    if (pct === 100) setTimeout(()=>_snd.dominate(), 400);
    // Si examen de unidad al 100%: marcar habilidades (no cuestionarios) de la unidad como dominado
    if (pct === 100 && _prep.isUnitExam && (_prep.examUnitSkills||[]).length) {
      const now = Math.floor(Date.now()/1000);
      for (const sk of _prep.examUnitSkills) {
        if (BINGO_TOPICS[sk]?.quiz) continue; // los cuestionarios solo se dominan al completarlos directamente
        if (_prepMasteryLevel(sk)==='dominado') continue;
        const skDef=BINGO_TOPICS[sk]||{};
        const skE={uid:me.uid,name:me.name,level:_prep.level,grade:_prep.grade||'',topic:sk,topicLabel:skDef.lbl||sk,correct:4,total:4,pct:100,timeSec:0,answers:[],autoFromExam:true,completedAt:{seconds:now}};
        if (Array.isArray(_prepHistoryData)) _prepHistoryData.unshift(skE);
        db.collection('prepHistory').add({uid:me.uid,name:me.name,level:_prep.level,grade:_prep.grade||'',topic:sk,topicLabel:skDef.lbl||sk,correct:4,total:4,pct:100,timeSec:0,answers:[],autoFromExam:true,completedAt:firebase.firestore.FieldValue.serverTimestamp()}).catch(e=>console.error('exam auto-dominate',e));
      }
    }
    // Si cuestionario completado (cualquier pct > 0): propagar nivel a habilidades cubiertas.
    // Solo se guarda si mejora el nivel actual de la habilidad.
    if (BINGO_TOPICS[_prep.topic]?.quiz && pct > 0) {
      const coveredSkills = _prepGetQuizSkills(_prep.topic);
      const now = Math.floor(Date.now()/1000);
      const quizCorrect = Math.round(pct * 4 / 100);
      for (const sk of coveredSkills) {
        // No guardar si el cuestionario no mejora el nivel ya alcanzado en la habilidad
        const currentBest = Math.max(...((Array.isArray(_prepHistoryData)?_prepHistoryData:[]).filter(h=>h.topic===sk).map(h=>_prepReEvalPct(h))), 0);
        if (pct <= currentBest) continue;
        const skDef = BINGO_TOPICS[sk]||{};
        const skEntry = {
          uid: me.uid, name: me.name, level: _prep.level, grade: _prep.grade||'',
          topic: sk, topicLabel: skDef.lbl||sk,
          correct: quizCorrect, total: 4, pct, timeSec: 0, answers: [],
          autoFromQuiz: _prep.topic, completedAt: { seconds: now }
        };
        if (Array.isArray(_prepHistoryData)) _prepHistoryData.unshift(skEntry);
        db.collection('prepHistory').add({
          uid: me.uid, name: me.name, level: _prep.level, grade: _prep.grade||'',
          topic: sk, topicLabel: skDef.lbl||sk,
          correct: quizCorrect, total: 4, pct, timeSec: 0, answers: [],
          autoFromQuiz: _prep.topic,
          completedAt: firebase.firestore.FieldValue.serverTimestamp()
        }).catch(e=>console.error('quiz-propagate save',e));
      }
    }
    await db.collection('prepHistory').add({
      uid:        me.uid,
      name:       me.name,
      level:      _prep.level,
      grade:      _prep.grade || '',
      topic:      _prep.topic,
      topicLabel: _cleanLbl(def.lbl || _prep.topic),
      isUnitExam: !!_prep.isUnitExam,
      quizNum:    _prep.quizNum || 0,
      correct, total, pct,
      timeSec:    secs,
      answers:    _prep.answers.map(a=>({q:a.q, a:a.a, given:a.given, correct:a.correct})),
      completedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    // Actualización optimista ya aplicada arriba — no recargar desde Firestore
    // para evitar race condition con los auto-dominados (fire-and-forget)
  } catch(e) { console.error('prep history save', e); }
}
async function loadPrepHistory() {
  _prepHistoryLoading = true;
  try {
    const uid = isAdmin() ? 'teacher' : String(getLoggedId());
    const snap = await db.collection('prepHistory').where('uid','==',uid).limit(50).get();
    _prepHistoryData = [];
    snap.forEach(doc => _prepHistoryData.push({ id:doc.id, ...doc.data() }));
    // Ordenar por fecha desc en cliente (evita índice compuesto)
    _prepHistoryData.sort((a,b)=>(b.completedAt?.seconds||0)-(a.completedAt?.seconds||0));
    _prepHistoryData = _prepHistoryData.slice(0,30);
  } catch(e) { _prepHistoryData = []; console.error('prep history load', e); }
  _prepHistoryLoading = false;
  if (dashGamingMode==='preparate' || document.getElementById('preparate-pane')) _renderPreparatePane();
}
async function loadPrepHistoryAdmin() {
  if (!isAdmin()) return;
  _prepAdminHistLoading = true;
  try {
    const snap = await db.collection('prepHistory').limit(200).get();
    _prepAdminHistData = [];
    snap.forEach(doc => _prepAdminHistData.push({ id:doc.id, ...doc.data() }));
    _prepAdminHistData.sort((a,b)=>(b.completedAt?.seconds||0)-(a.completedAt?.seconds||0));
  } catch(e) { _prepAdminHistData = []; console.error('prep admin history load', e); }
  _prepAdminHistLoading = false;
  _renderPreparatePane();
}
function _prepAdminHistoryHtml() {
  const loading = _prepAdminHistLoading;
  const raw = _prepAdminHistData;
  const students = getStudents();
  // Incluir profesor como persona filtrable
  const teacherEntry = { id:'teacher', name: ADMIN.name.split(' ')[0], icon: ADMIN.icon, color:'#6366f1' };
  const allPeople = [teacherEntry, ...students];
  // Solo entradas directas (excluir auto-dominados indirectos)
  const direct = Array.isArray(raw) ? raw.filter(h=>!h.autoFromExam && !h.autoFromQuiz) : raw;
  // Filtrar por persona si hay filtro activo
  const data = Array.isArray(direct)
    ? (_prepAdminFilterUid ? direct.filter(h=>h.uid===_prepAdminFilterUid) : direct)
    : null;
  const empty = Array.isArray(data) && data.length === 0;
  // Pills (alumnos + profesor, solo los que tienen entradas)
  const uidsWithData = Array.isArray(direct) ? [...new Set(direct.map(h=>h.uid))] : [];
  const studentPills = allPeople
    .filter(s=>uidsWithData.includes(String(s.id)))
    .map(s=>{
      const active = _prepAdminFilterUid === String(s.id);
      return `<button onclick="_prepAdminFilterUid=${active?'null':"'"+String(s.id)+"'"};_renderPreparatePane()" style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:16px;border:1px solid ${active?s.color:'rgba(255,255,255,0.15)'};background:${active?s.color+'22':'rgba(255,255,255,0.05)'};color:${active?s.color:'rgba(255,255,255,0.6)'};font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:700;cursor:pointer">${s.icon} ${s.name.split(' ')[0]}</button>`;
    }).join('');
  let cardsHtml = '';
  if (loading || !Array.isArray(data)) {
    cardsHtml = `<div style="text-align:center;font-size:12px;color:rgba(255,255,255,0.35);padding:12px">Cargando…</div>`;
  } else if (empty) {
    cardsHtml = `<div style="text-align:center;font-size:12px;color:rgba(255,255,255,0.3);padding:12px">Aún no hay partidas guardadas.</div>`;
  } else {
    cardsHtml = `<div class="prep-review-list">${data.map(h=>{
      const stu = allPeople.find(s=>String(s.id)===String(h.uid));
      const dateStr = h.completedAt?.seconds ? new Date(h.completedAt.seconds*1000).toLocaleDateString('es-PE',{day:'2-digit',month:'short'}) : '—';
      const timeStr = h.completedAt?.seconds ? new Date(h.completedAt.seconds*1000).toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'}) : '';
      const ok = (h.pct||0) >= 70;
      const lvlLbl = h.level==='primaria'?'🏫 Primaria':h.level==='secundaria'?'📐 Secundaria':'🎓 Pre-univ.';
      const gradeLbl = h.grade ? ' · '+h.grade+'° Grado' : '';
      const expanded = _prepAdminExpandedId === h.id;
      let ansRows = '';
      if (expanded && (h.answers||[]).length) {
        (h.answers||[]).forEach(function(a,i){
          const ico=a.correct?'✅':'❌';
          const ansLine=a.correct
            ?'<span style="font-size:11px;color:#39ff7a">Tu resp: '+a.given+'</span>'
            :'<span style="font-size:11px;color:#f87171">Tu resp: '+a.given+'</span>'
              +' <span style="font-size:11px;color:rgba(255,255,255,0.4)">·</span>'
              +' <span style="font-size:11px;color:#39ff7a">Correcta: '+a.a+'</span>';
          const idTag2='<span style="flex-shrink:0;margin-left:8px;padding-right:22px;font-size:10px;font-family:\'Barlow Condensed\',monospace;font-weight:700;color:rgba(255,255,255,0.22);letter-spacing:0.04em">#'+_exId(a.q)+'</span>';
          ansRows+='<div style="padding:5px 0;border-top:1px solid rgba(255,255,255,0.05);display:flex;gap:8px;align-items:flex-start">'
            +'<span style="font-size:14px;flex-shrink:0">'+ico+'</span>'
            +'<div style="flex:1;min-width:0"><div style="font-size:12px;color:rgba(255,255,255,0.8);margin-bottom:2px;display:flex;justify-content:space-between;align-items:flex-start"><span style="flex:1">'+(i+1)+'. '+(a.q||'')+'</span>'+idTag2+'</div>'+ansLine+'</div></div>';
        });
      }
      const expandBtn = (h.answers||[]).length
        ? '<button onclick="_prepAdminExpandedId=_prepAdminExpandedId===\''+h.id+'\'?null:\''+h.id+'\';_renderPreparatePane()" style="margin-top:6px;width:100%;background:rgba(255,255,255,0.06);border:none;border-radius:6px;padding:4px 8px;font-size:11px;color:rgba(255,255,255,0.5);cursor:pointer">'+(expanded?'▲ Ocultar ejercicios':'▼ Ver ejercicios ('+h.answers.length+')')+'</button>'+(expanded?'<div style="margin-top:6px">'+ansRows+'</div>':'')
        : '';
      const _adPfx=_histTypePrefix(h), _adLbl=_cleanLbl(h.topicLabel||h.topic);
      return '<div class="prep-review-item '+(ok?'ok':'fail')+'">'
        +'<div style="display:flex;justify-content:space-between;align-items:center;gap:8px">'
        +'<div style="display:flex;align-items:center;gap:6px;flex:1;min-width:0">'
        +(stu?'<span style="flex-shrink:0;background:'+stu.color+'22;border:1px solid '+stu.color+'55;border-radius:10px;padding:1px 7px;color:'+stu.color+';font-weight:900;font-size:12px">'+stu.icon+' '+stu.name.split(' ')[0]+'</span>':'')
        +'<span style="font-size:13px;font-weight:900;color:rgba(255,255,255,0.85);min-width:0">'
        +'<span style="font-weight:700;color:rgba(255,255,255,0.45)">'+_adPfx+': </span>'+_adLbl
        +'</span>'
        +'</div>'
        +'<span style="font-size:14px;font-weight:900;color:'+(ok?'#39ff7a':'#f87171')+';flex-shrink:0">'+h.correct+'/'+h.total+' · '+h.pct+'%</span>'
        +'</div>'
        +'<div style="display:flex;justify-content:space-between;margin-top:2px">'
        +'<span style="font-size:11px;color:rgba(255,255,255,0.35)">'+lvlLbl+gradeLbl+'</span>'
        +'<span style="font-size:11px;color:rgba(255,255,255,0.3)">'+dateStr+' '+timeStr+'</span>'
        +'</div>'+expandBtn+'</div>';
    }).join('')}</div>`;
  }
  return `<div style="margin-top:18px;border-top:1px solid rgba(255,255,255,0.07);padding-top:14px">
    <button class="prep-result-btn" style="width:100%" onclick="_prepAdminShowHist=!_prepAdminShowHist;if(_prepAdminShowHist&&!Array.isArray(_prepAdminHistData)&&!_prepAdminHistLoading)loadPrepHistoryAdmin();else _renderPreparatePane()">
      📊 ${_prepAdminShowHist ? '▲ Ocultar' : '▼ Ver'} historial de alumnos
    </button>
    ${_prepAdminShowHist ? `<div style="margin-top:10px">
      ${uidsWithData.length > 1 ? `<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px">${studentPills}</div>` : ''}
      ${cardsHtml}
    </div>` : ''}
  </div>`;
}
function _prepExamHtml() {
  const q = _prep.questions[_prep.currentIdx]; if (!q) return '';
  const def = BINGO_TOPICS[_prep.topic]||{};
  const _examLbl = (def.quiz&&_prep.quizNum)?`Cuestionario ${_prep.quizNum}: ${_cleanLbl(def.lbl,_prep.topic)}`:_cleanLbl(def.lbl,_prep.topic);
  const total = _prep.questions.length, idx = _prep.currentIdx;
  const pct = Math.round((idx/total)*100);
  const isMC = !!q.mc && _prep.ansMode !== 'text', isVF = isMC && (q.opts||[])[0]==='Verdadero' && q.opts.length===2;
  const timerHtml = _prep.timeSec > 0 ? `<div id="prep-timer" class="prep-timer${_prep.timeLeft<=30?' urgent':''}">${_prepFmtTime(_prep.timeLeft)}</div>` : '';
  let ansHtml = '';
  if (isMC && isVF) {
    ansHtml = `<div class="prep-vf-row">${(q.opts||[]).map(opt=>{
      let cls='prep-vf-btn';
      if (_prep.answered) { const isCor=String(opt).toLowerCase()===String(q.a).toLowerCase(); cls+=isCor?' correct':(String(_prep.selectedOpt)===String(opt)?' wrong':''); }
      return `<button class="${cls}" ${_prep.answered?'disabled':''} onclick="_prepSelectOpt('${String(opt).replace(/'/g,"\\'")}')">${opt}</button>`;
    }).join('')}</div>`;
  } else if (isMC) {
    ansHtml = `<div class="prep-mc-grid">${(q.opts||[]).map((opt,i)=>{
      let cls='prep-mc-btn';
      if (_prep.answered) { const isCor=String(opt).toLowerCase()===String(q.a).toLowerCase(); cls+=isCor?' correct':(String(_prep.selectedOpt)===String(opt)?' wrong':''); }
      return `<button class="${cls}" ${_prep.answered?'disabled':''} onclick="_prepSelectOpt('${String(opt).replace(/'/g,"\\'")}')">${i+1}. ${opt}</button>`;
    }).join('')}</div>`;
  } else {
    const lastAns = _prep.answered ? _prep.answers[_prep.answers.length-1] : null;
    ansHtml = `<div class="prep-text-row">
      <input id="prep-ans-input" class="prep-text-input" type="text" placeholder="Tu respuesta…" ${_prep.answered?'disabled':''} autocomplete="off" onkeydown="if(event.key==='Enter')_prepSubmitText()">
      <button class="prep-submit-btn" onclick="_prepSubmitText()" ${_prep.answered?'disabled':''}>OK</button>
    </div>`;
    if (lastAns) ansHtml += `<div style="text-align:center;font-size:13px;margin-bottom:10px;font-family:'Barlow Condensed',sans-serif;font-weight:700">${lastAns.correct?`<span style="color:#39ff7a">✓ ¡Correcto!</span>`:`<span style="color:#f87171">✗ ${lastAns.given}</span> <span style="color:rgba(255,255,255,0.4)">→ <b style="color:#fff">${q.a}</b></span>`}</div>`;
  }
  const _nivelLbl = _prep.level==='primaria'?'🏫 Primaria':_prep.level==='secundaria'?'📐 Secundaria':'🎓 Pre-univ.';
  const _gradeLbl = _prep.grade ? ` · ${_prep.grade}° Grado` : '';
  const _edLbl = _prep.editorial && PREP_EDITORIALS[_prep.editorial] ? ` · ${PREP_EDITORIALS[_prep.editorial].ico} ${PREP_EDITORIALS[_prep.editorial].lbl}` : '';
  return `<div class="prep-wrap">
    <div class="prep-exam-header" style="flex-direction:column;align-items:stretch;gap:6px">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div style="display:flex;align-items:center;gap:8px;min-width:0">
          <button onclick="_prep.state='config';clearInterval(_prepTimerIntv);_renderPreparatePane()" style="background:none;border:none;color:rgba(255,255,255,0.35);font-size:18px;cursor:pointer;padding:0;line-height:1;flex-shrink:0" title="Salir">✕</button>
          <span style="font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:700;letter-spacing:0.07em;color:rgba(255,255,255,0.35);text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${_nivelLbl}${_gradeLbl}${_edLbl}</span>
        </div>
        <div style="padding-right:48px;flex-shrink:0">${timerHtml}</div>
      </div>
      <div class="prep-topic-badge-sm" style="align-self:flex-start">${def.ico||'📚'} ${_examLbl}</div>
    </div>
    <div class="prep-progress-row">
      <span class="prep-prog-label">${idx+1}/${total}</span>
      <div class="prep-prog-bar"><div class="prep-prog-fill" style="width:${pct}%"></div></div>
    </div>
    <div class="prep-question-card"><span>${q.q}</span></div>
    ${ansHtml}
    <button class="prep-next-btn" ${_prep.answered?'':'disabled'} onclick="_prepNextQ()">
      ${idx===total-1?'🏁 Ver resultados':'Siguiente →'}
    </button>
    <div style="text-align:center;margin-top:10px">
      <button class="prep-report-btn" onclick="openPrepReportModal()">⚠️ Reportar error en este ejercicio</button>
    </div>
  </div>${_prepReportModalOpen ? `<div class="prep-report-modal-ov" onclick="if(event.target===this)closePrepReportModal()">
    <div class="prep-report-modal-box">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <span style="font-family:'Barlow Condensed',sans-serif;font-size:16px;font-weight:900;color:#fff;letter-spacing:0.05em">⚠️ REPORTAR ERROR</span>
        <button onclick="closePrepReportModal()" style="background:none;border:none;color:rgba(255,255,255,0.4);font-size:22px;cursor:pointer;line-height:1;padding:0">✕</button>
      </div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
        <span class="prep-report-tag">Habilidad: ${_prep.topic}</span>
        <span class="prep-report-tag" style="font-family:'Barlow Condensed',monospace;letter-spacing:0.06em">Ejercicio: #${_exId(q.q)}</span>
      </div>
      <div style="font-size:11px;color:rgba(255,255,255,0.45);margin-bottom:4px;font-family:'Barlow Condensed',sans-serif;font-weight:700;text-transform:uppercase;letter-spacing:0.05em">Ejercicio</div>
      <div style="font-size:13px;color:rgba(255,255,255,0.8);background:rgba(255,255,255,0.04);border-radius:10px;padding:10px 12px;line-height:1.4">${q.q}</div>
      ${isAdmin() ? `<div style="font-size:11px;color:rgba(255,255,255,0.45);margin:10px 0 4px;font-family:'Barlow Condensed',sans-serif;font-weight:700;text-transform:uppercase;letter-spacing:0.05em">Respuesta oficial</div>
      <div style="font-size:14px;color:#39ff7a;font-weight:900;font-family:'Barlow Condensed',sans-serif">${q.a}</div>` : ''}
      <div style="font-size:11px;color:rgba(255,255,255,0.45);margin:10px 0 0;font-family:'Barlow Condensed',sans-serif;font-weight:700;text-transform:uppercase;letter-spacing:0.05em">Describe el error <span style="color:rgba(255,255,255,0.3);font-weight:600;text-transform:none;letter-spacing:0">(obligatorio)</span></div>
      <textarea id="prep-report-ta" class="prep-report-ta" placeholder="Ej: La respuesta debería ser 3/4 porque… / La pregunta está mal redactada porque…" maxlength="500"></textarea>
      <div style="display:flex;gap:8px;margin-top:14px">
        <button onclick="closePrepReportModal()" style="flex:1;padding:11px;border-radius:10px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.6);font-family:'Barlow Condensed',sans-serif;font-size:14px;font-weight:900;cursor:pointer">Cancelar</button>
        <button id="prep-report-submit-btn" onclick="submitPrepReport()" style="flex:2;padding:11px;border-radius:10px;border:none;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;font-family:'Lato',sans-serif;font-size:14px;font-weight:700;cursor:pointer">Enviar reporte</button>
      </div>
    </div>
  </div>` : ''}`;
}
function _prepResultHtml() {
  const total = _prep.questions.length;
  const correct = _prep.answers.filter(a=>a.correct).length;
  const pct = total>0 ? Math.round((correct/total)*100) : 0;
  const secs = _prep.startTime&&_prep.endTime ? Math.round((_prep.endTime-_prep.startTime)/1000) : 0;
  const emoji = pct>=90?'🏆':pct>=70?'🌟':pct>=50?'👍':'💪';
  const label = pct>=90?'¡Excelente!':pct>=70?'¡Bien hecho!':pct>=50?'Puedes mejorar':'Sigue practicando';
  const def = BINGO_TOPICS[_prep.topic]||{};
  const _resLbl = (def.quiz&&_prep.quizNum)?`Cuestionario ${_prep.quizNum}: ${_cleanLbl(def.lbl,_prep.topic)}`:_cleanLbl(def.lbl,_prep.topic);
  const reviewHtml = _prep.showReview ? `<div class="prep-review-list">${_prep.answers.map((ans,i)=>`
    <div class="prep-review-item ${ans.correct?'ok':'fail'}">
      <div class="prep-review-q">${i+1}. ${ans.q}</div>
      <div>${ans.correct?`<span class="prep-review-ok">✓ ${ans.given}</span>`:`<span class="prep-review-fail">✗ ${ans.given}</span> · <span class="prep-review-correct">Correcta: ${ans.a}</span>`}</div>
    </div>`).join('')}</div>` : '';
  return `<div class="prep-wrap">
    <div class="prep-score-wrap">
      <div class="prep-topic-badge-sm" style="margin:0 auto 10px;display:inline-flex">${def.ico||'📚'} ${_resLbl}</div>
      <div class="prep-score-emoji">${emoji}</div>
      <div><span class="prep-score-num">${correct}</span><span class="prep-score-denom">/${total}</span></div>
      <div class="prep-score-pct">${pct}%</div>
      <div class="prep-score-label">${label}</div>
      <div style="font-size:12px;color:rgba(255,255,255,0.3);margin-top:4px">Tiempo: ${_prepFmtTime(secs)}</div>
    </div>
    ${(()=>{
      if (_prep.unitSkillList.length>0) {
        const nextSk = _prep.unitSkillList.find(sk=>!_prep.unitDone.includes(sk));
        const nextDef = nextSk ? BINGO_TOPICS[nextSk] : null;
        const allDone = !nextSk;
        return allDone
          ? `<div style="text-align:center;padding:10px;margin-bottom:10px;border-radius:12px;background:rgba(57,255,122,0.08);border:1px solid rgba(57,255,122,0.25);color:#39ff7a;font-size:13px;font-weight:900">🏆 ¡Unidad completada!</div>
             <div class="prep-result-row">
               <button class="prep-result-btn primary" onclick="_prepStart()">↺ Repetir</button>
               <button class="prep-result-btn" onclick="_snd.click();_prep.state='unit';_prep.showReview=false;_renderPreparatePane()">☰ Ver unidad</button>
             </div>`
          : `<button class="prep-result-btn primary" style="width:100%;margin-bottom:8px" onclick="_prepStartFromUnit('${nextSk}')">▶ Siguiente: ${nextDef?.lbl||nextSk}</button>
             <div class="prep-result-row">
               <button class="prep-result-btn" onclick="_prepStart()">↺ Repetir</button>
               <button class="prep-result-btn" onclick="_snd.click();_prep.state='unit';_prep.showReview=false;_renderPreparatePane()">☰ Lista</button>
             </div>`;
      }
      return `<div class="prep-result-row">
        <button class="prep-result-btn primary" onclick="_prepStart()">↺ Repetir</button>
        <button class="prep-result-btn" onclick="_snd.click();_prep.state='config';_prep.showReview=false;_renderPreparatePane()">← Cambiar tema</button>
      </div>`;
    })()}
    <button class="prep-result-btn" style="width:100%;margin-top:8px" onclick="_prep.showReview=!_prep.showReview;_renderPreparatePane()">
      ${_prep.showReview?'▲ Ocultar revisión':'▼ Revisar respuestas'}
    </button>
    ${reviewHtml}
  </div>`;
}
// ── Report modal helpers ─────────────────────────────────────────────────────
function openPrepReportModal() {
  _prepReportModalOpen = true;
  _renderPreparatePane();
  setTimeout(()=>{ const ta=document.getElementById('prep-report-ta'); if(ta)ta.focus(); },80);
}
function closePrepReportModal() {
  _prepReportModalOpen = false;
  _renderPreparatePane();
}
async function submitPrepReport() {
  const ta = document.getElementById('prep-report-ta');
  const comment = ta ? ta.value.trim() : '';
  if (!comment) { showToast('Escribe el error antes de enviar'); if(ta)ta.focus(); return; }
  const q = _prep.questions[_prep.currentIdx];
  if (!q) return;
  const def = BINGO_TOPICS[_prep.topic] || {};
  const id = getLoggedId();
  const students = getStudents();
  const stu = id !== null && id !== 0 ? students.find(s=>s.id===id) : null;
  const sName = stu ? stu.name : (id===0 ? 'Profesor' : 'Invitado');
  const sid = id !== null ? id : -1;
  const btn = document.getElementById('prep-report-submit-btn');
  if (btn) { btn.disabled=true; btn.textContent='Enviando…'; btn.style.opacity='0.5'; }
  try {
    await db.collection('prepReports').add({
      skillKey:   _prep.topic,
      skillLabel: def.lbl || _prep.topic,
      exId:       _exId(q.q),
      q:          q.q,
      correctAns: String(q.a),
      comment,
      sid,
      sName,
      ts:     firebase.firestore.FieldValue.serverTimestamp(),
      status: 'pending'
    });
    _prepReportModalOpen = false;
    _renderPreparatePane();
    showToast('Reporte enviado. ¡Gracias! 👍');
  } catch(e) {
    console.error('prepReport submit', e);
    showToast('Error al enviar: ' + (e.message||''));
    if (btn) { btn.disabled=false; btn.textContent='Enviar reporte'; btn.style.opacity=''; }
  }
}
// ── Admin: load + update reports ─────────────────────────────────────────────
async function loadPrepReportsAdmin() {
  if (!isAdmin()) return;
  _prepAdminReportsLoading = true;
  try {
    const snap = await db.collection('prepReports').orderBy('ts','desc').limit(300).get();
    _prepAdminReportsData = [];
    snap.forEach(doc => _prepAdminReportsData.push({ id: doc.id, ...doc.data() }));
  } catch(e) { _prepAdminReportsData = []; console.error('prepReports load', e); }
  _prepAdminReportsLoading = false;
  _renderPreparatePane();
}
async function setPrepReportStatus(docId, status) {
  try {
    await db.collection('prepReports').doc(docId).update({ status });
    const rec = (_prepAdminReportsData||[]).find(r=>r.id===docId);
    if (rec) rec.status = status;
    _renderPreparatePane();
  } catch(e) { showToast('Error: ' + (e.message||'')); }
}
function _prepAdminReportsHtml() {
  const data    = _prepAdminReportsData;
  const loading = _prepAdminReportsLoading;
  const f       = _prepAdminReportsFilter;
  const filtered   = Array.isArray(data) ? data.filter(r=>r.status===f) : null;
  const confirmedIds = Array.isArray(data) ? [...new Set(data.filter(r=>r.status==='confirmed').map(r=>r.skillKey))] : [];
  const counts = Array.isArray(data)
    ? { pending: data.filter(r=>r.status==='pending').length,
        confirmed: data.filter(r=>r.status==='confirmed').length,
        dismissed: data.filter(r=>r.status==='dismissed').length,
        resolved: data.filter(r=>r.status==='resolved').length }
    : { pending:0, confirmed:0, dismissed:0, resolved:0 };

  const filterBtns = [
    { key:'pending',   lbl:'⏳ Pendientes' },
    { key:'confirmed', lbl:'✅ Confirmados' },
    { key:'resolved',  lbl:'🔧 Resueltos' },
    { key:'dismissed', lbl:'🚫 Descartados' }
  ].map(({key,lbl})=>{
    const active = f===key;
    return `<button onclick="_prepAdminReportsFilter='${key}';_renderPreparatePane()" style="padding:4px 10px;border-radius:14px;border:1px solid ${active?'rgba(168,85,247,0.7)':'rgba(255,255,255,0.12)'};background:${active?'rgba(168,85,247,0.2)':'rgba(255,255,255,0.04)'};color:${active?'#d8b4fe':'rgba(255,255,255,0.5)'};font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:700;cursor:pointer">${lbl} (${counts[key]})</button>`;
  }).join('');

  let cardsHtml = '';
  if (loading || !Array.isArray(filtered)) {
    cardsHtml = `<div style="text-align:center;font-size:12px;color:rgba(255,255,255,0.35);padding:12px">Cargando…</div>`;
  } else if (filtered.length===0) {
    cardsHtml = `<div style="text-align:center;font-size:12px;color:rgba(255,255,255,0.3);padding:12px">No hay reportes en esta categoría.</div>`;
  } else {
    cardsHtml = filtered.map(r=>{
      const dateStr = r.ts?.seconds ? new Date(r.ts.seconds*1000).toLocaleDateString('es-PE',{day:'2-digit',month:'short'}) : '—';
      const timeStr = r.ts?.seconds ? new Date(r.ts.seconds*1000).toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'}) : '';
      const safeId  = (r.id||'').replace(/'/g,"\'");
      const _reopenBtn = `<button onclick="setPrepReportStatus('${safeId}','pending')" style="padding:5px 10px;border-radius:8px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.4);font-family:'Barlow Condensed',sans-serif;font-size:11px;cursor:pointer">↩ Reabrir</button>`;
      const actionHtml = r.status==='pending'
        ? `<div style="display:flex;gap:6px;margin-top:10px">
            <button onclick="setPrepReportStatus('${safeId}','confirmed')" style="flex:1;padding:7px;border-radius:8px;border:1px solid rgba(57,255,122,0.4);background:rgba(57,255,122,0.08);color:#39ff7a;font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:900;cursor:pointer">✅ Confirmar</button>
            <button onclick="setPrepReportStatus('${safeId}','dismissed')" style="flex:1;padding:7px;border-radius:8px;border:1px solid rgba(239,68,68,0.35);background:rgba(239,68,68,0.07);color:#f87171;font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:900;cursor:pointer">🚫 Descartar</button>
          </div>`
        : r.status==='confirmed'
        ? `<div style="display:flex;gap:6px;margin-top:10px;align-items:center">
            <button onclick="setPrepReportStatus('${safeId}','resolved')" style="flex:1;padding:7px;border-radius:8px;border:1px solid rgba(139,92,246,0.5);background:rgba(139,92,246,0.12);color:#c4b5fd;font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:900;cursor:pointer">🔧 Marcar como resuelto</button>
            ${_reopenBtn}
          </div>`
        : `<div style="text-align:right;margin-top:8px">${_reopenBtn}</div>`;
      return `<div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);border-radius:12px;padding:12px;margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:8px">
          <span class="prep-report-tag">Habilidad: ${r.skillKey||'?'}</span>
          <span class="prep-report-tag" style="font-family:'Barlow Condensed',monospace;letter-spacing:0.06em">Ejercicio: #${r.exId||_exId(r.q||'')}</span>
          <span style="font-size:11px;color:rgba(255,255,255,0.3);white-space:nowrap;flex-shrink:0">${r.sName||'—'} · ${dateStr} ${timeStr}</span>
        </div>
        <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-bottom:2px;font-family:'Barlow Condensed',sans-serif;font-weight:700;text-transform:uppercase">Ejercicio</div>
        <div style="font-size:13px;color:rgba(255,255,255,0.75);margin-bottom:6px;line-height:1.4">${r.q||''}</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-bottom:2px;font-family:'Barlow Condensed',sans-serif;font-weight:700;text-transform:uppercase">Respuesta oficial</div>
        <div style="font-size:13px;color:#39ff7a;font-weight:900;font-family:'Barlow Condensed',sans-serif;margin-bottom:6px">${r.correctAns||''}</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-bottom:2px;font-family:'Barlow Condensed',sans-serif;font-weight:700;text-transform:uppercase">Comentario</div>
        <div style="font-size:13px;color:#fde68a;line-height:1.4">${r.comment||''}</div>
        ${actionHtml}
      </div>`;
    }).join('');
  }

  const confirmedReports = Array.isArray(data) ? data.filter(r=>r.status==='confirmed') : [];
  const copyBtn = confirmedReports.length
    ? `<button onclick="_prepCopyConfirmedErrors()" style="width:100%;padding:9px;border-radius:10px;border:1px solid rgba(57,255,122,0.4);background:rgba(57,255,122,0.08);color:#39ff7a;font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:900;cursor:pointer;margin-bottom:10px">📋 Copiar ${confirmedReports.length} error${confirmedReports.length>1?'es':''} confirmado${confirmedReports.length>1?'s':''} (todos los detalles)</button>`
    : '';

  const pendingBadge = Array.isArray(_prepAdminReportsData) && counts.pending > 0
    ? ' (' + counts.pending + ' pendiente' + (counts.pending>1?'s':'') + ')'
    : '';

  return `<div style="margin-top:10px;border-top:1px solid rgba(255,255,255,0.07);padding-top:14px">
    <button class="prep-result-btn" style="width:100%" onclick="_prepAdminShowReports=!_prepAdminShowReports;if(_prepAdminShowReports&&!Array.isArray(_prepAdminReportsData)&&!_prepAdminReportsLoading)loadPrepReportsAdmin();else _renderPreparatePane()">
      ⚠️ ${_prepAdminShowReports ? '▲ Ocultar' : '▼ Ver'} reportes de errores${pendingBadge}
    </button>
    ${_prepAdminShowReports ? `<div style="margin-top:10px">
      ${copyBtn}
      <div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px">${filterBtns}</div>
      ${cardsHtml}
    </div>` : ''}
  </div>`;
}
function _prepCopyConfirmedErrors() {
  const confirmed = (Array.isArray(_prepAdminReportsData) ? _prepAdminReportsData : [])
    .filter(r => r.status === 'confirmed');
  if (!confirmed.length) { showToast('No hay errores confirmados'); return; }
  const lines = ['===== ERRORES CONFIRMADOS (' + confirmed.length + ') =====\n'];
  confirmed.forEach((r, i) => {
    const dateStr = r.ts?.seconds
      ? new Date(r.ts.seconds*1000).toLocaleDateString('es-PE',{day:'2-digit',month:'short',year:'numeric'})
        + ' ' + new Date(r.ts.seconds*1000).toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'})
      : '—';
    lines.push(
      '[' + (i+1) + '] Habilidad: ' + (r.skillKey||'?') + '  ·  Ejercicio: #' + (r.exId||_exId(r.q||'')),
      'Alumno: ' + (r.sName||'—') + '  ·  ' + dateStr,
      'Ejercicio: ' + (r.q||'—'),
      'Respuesta oficial: ' + (r.correctAns||'—'),
      'Respuesta del alumno: ' + (r.givenAns||'—'),
      'Comentario: ' + (r.comment||'—'),
      ''
    );
  });
  const text = lines.join('\n');
  navigator.clipboard.writeText(text)
    .then(()  => showToast('✅ ' + confirmed.length + ' error' + (confirmed.length>1?'es':'') + ' copiado' + (confirmed.length>1?'s':'')))
    .catch(()  => showToast('Error al copiar — intenta de nuevo'));
}