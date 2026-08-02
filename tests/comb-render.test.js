// Regression test for the "Operaciones Combinadas" (Op.Combinada) renderer inside levelup.js.
//
// WHY THIS EXISTS
// ----------------
// The combined-operations exercise (roots, exponents, brackets, multi-select) has its own column-layout
// engine inside _combRender(). It has no real dependency on a live browser DOM beyond a handful of
// stubbable calls, so it can run headless under plain Node by extracting the relevant functions out of
// levelup.js and eval'ing them against small stand-in objects (document/_prep/_snd/etc). That's what this
// file does — no build step, no browser, just `node tests/comb-render.test.js`.
//
// WHAT IT CHECKS
// --------------
// Renders a battery of expressions (plain arithmetic, brackets, roots, exponents, signed chains) across
// three kinds of state — fresh (row 0 only), "operator X selected" (active row), and a full natural-order
// solve sequence (done rows + the next active row selected on top) — and compares the exact rendered HTML
// against comb-render.golden.json. ANY difference fails the test, on purpose: this exercise's column math
// is dense enough that "looks about right" isn't good enough. If you change layout-related code and this
// test reports diffs, each one needs to be understood before deciding whether to accept it.
//
// USAGE
// -----
//   node tests/comb-render.test.js             # compare current levelup.js against the committed golden file
//   node tests/comb-render.test.js --update     # regenerate the golden file from the current levelup.js
//                                                  (only do this after visually/logically confirming every
//                                                  reported diff was an intentional improvement — this
//                                                  file's whole job is to catch the ones that weren't)
//
// If you add a new special-cased operator behavior (a new operator type, a new width/alignment rule, a new
// multi-select interaction), add a scenario for it to SCENARIOS below and run with --update once you've
// manually confirmed the new golden output is correct.

const fs = require('fs');
const path = require('path');

const LEVELUP_PATH = path.join(__dirname, '..', 'levelup.js');
const GOLDEN_PATH = path.join(__dirname, 'comb-render.golden.json');
const UPDATE = process.argv.includes('--update');

// Any function _combRender transitively calls that isn't itself defined inside _combRender's own closure
// must be listed here so it gets extracted alongside it. If you add a new top-level _comb* helper that
// _combRender (or anything it calls) depends on, add its name here too, or this script throws
// "X is not defined" the moment it hits a scenario that exercises it.
const FN_NAMES = [
  '_combCalc','_combIsPM','_combIsNeg','_combConnAbsorbsSign','_combFoldedExpected','_combOpsIndependent',
  '_combOpSelectable','_combReplayToks','_combToggleSelect','_combCaptureActiveValues',
  '_combRestoreActiveValues','_combReopenLastIfJoinable','_combClickOp','_combClickCol',
  '_combMergeN','_combSubmitStep','_combActiveInputCheck','_combGroupBoxId','_combFirstFocusId',
  '_combIsRTLOp','_combAutoFocusForSelection','_combOpenSignPicker','_combPickChainSign',
  '_combSignPicker','_combSignChoiceBox','_combSignConfirmedBox','_combNCols','_combSignBox',
  '_combNegBox','_combSpecialOpWidth','_combExpBaseCols','_combOpTier','_combRender','_combSyncPlusSignVisibility',
  '_combOpPrecedenceOK','_combWrongOrderFeedback','_combPrecTier'
];

// A representative slice of the shapes combinadas questions actually take: plain arithmetic, a plain
// bracket, roots/exponents alone with 1/2/3-digit results (the width/alignment rules change at those
// boundaries), roots+exponents together inside a bracket (the case most prone to cross-group drift), and
// a signed +/- chain (exercises the sign-picker path, which has its own width rules).
const SCENARIOS = [
  ['plain_4op', [12,'+',34,'-',5,'×',6,'÷',2]],
  ['bracket_plain', ['(',10,'+',5,')','×',3,'-',7,'+',20]],
  ['sqrt_1digit_result', [1,'√',64,'+',3,'×',5]],
  ['sqrt_2digit_result', [1,'√',144,'+',3,'×',5]],
  ['pow_1digit_result', [3,'^',2,'+',3,'×',5]],
  ['pow_2digit_result', [11,'^',2,'+',3,'×',5]],
  ['pow_3digit_result', [12,'^',2,'+',3,'×',5]],
  ['bracket_sqrt_pow', ['[',1,'√',36,'-',1,'^',2,']','÷',5,'+',10,'×',7,'×',2,'-',12]],
  ['brace_sqrt_pow2', ['{',1,'√',144,'+',10,'^',2,'}','÷',2,'-',34,'×',6,'+',45,'+',39]],
  ['paren_sqrt_pow_small', ['(',1,'√',81,'+',5,'^',2,')','÷',2,'×',3,'-',20,'-',16,'-',4]],
  ['sqrt_then_unrelated_x', ['[',1,'√',36,'+',6,'^',2,']','÷',3,'-',13,'×',7,'×',4,'+',28]],
  // Exact scenario Michel reported: solve root first (11, 2 digits — matches its own reservation exactly,
  // no gap), THEN select the exponent (2^2=4, 1 digit) — its narrower-than-reserved result must close the
  // gap on BOTH sides (pinned under the base's column, not hugging an edge) instead of leaving a dangling
  // empty cell before the closing brace.
  ['brace_sqrt_then_pow_gap', ['{',1,'√',121,'-',2,'^',2,'}','÷',7,'+',45,'×',8,'×',3,'-',41]],
  ['chain_pm', [16,'-',49,'+',42,'-',7,'+',9]],
  ['nested_signs', [5,'-',3,'+',8,'-',2]],
  // Coverage for the isImplicitBefore sign-pick path when lt is already negative from an earlier step
  // (independent ÷ fold leaves "38-145" as the first still-open operator; solving it produces -107 as lt
  // for the next "+"). Michel initially asked for this to auto-resolve to a plain "−" with no pick — then
  // asked to revert that: the interactive "+/−" picker (blank box → two choice buttons) must always show
  // here, same as any other isImplicitBefore case, regardless of whether lt is negative.
  ['neg_implicit_before', [38,'-',435,'÷',3,'+',5,'×',49]],
  // Michel-reported case: the root is the LAST group in the expression (nothing follows it), so hasRight is
  // false and hasLeft is true — before the fix, _combSlotAnchor's generic fallback hugged the result to lt
  // (the operator before it) instead of keeping it right-hugged under the root's own row-0 glyph position.
  // A root's fixed position must always win over the generic hasLeft/hasRight neighbor-hugging rule.
  ['sqrt_is_last_group', [19,'+',1,'√',81]],
  // Michel-reported case: a "^" result that needs exactly 2 digits (5^2=25) must pin its two digit boxes
  // under row 0's base/exponent columns, same as the pre-existing 1-digit-result special case — not the
  // generic hasRight/hasLeft neighbor-hugging rule, which used to drag it toward whatever operator (here
  // "+") happened to sit to its left. See _combSpecialOpWidth's widened "<=2" digit-length condition.
  ['pow_2digit_result_pinned', [16,'+',5,'^',2]],
];

function extractFn(src, name) {
  const re = new RegExp('function ' + name + '\\s*\\([^)]*\\)\\s*{');
  const m = re.exec(src);
  if (!m) throw new Error('Could not find function ' + name + ' in levelup.js — update FN_NAMES in this test.');
  let i = m.index + m[0].length, depth = 1;
  const start = m.index;
  while (depth > 0) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') depth--;
    i++;
  }
  return src.slice(start, i);
}

// Builds one fresh, isolated headless instance of the renderer + a small driver API around it. Each call
// gets its own closure (own container/_combSt/etc), so scenarios never leak state into each other.
function makeHarness(levelupPath) {
  const src = fs.readFileSync(levelupPath, 'utf8');
  let code = '';
  for (const n of FN_NAMES) code += extractFn(src, n) + '\n';

  const boxes = {};
  const container = { innerHTML: '' };
  const document = {
    getElementById(id) {
      if (id === '_comb_container') return container;
      if (!boxes[id]) boxes[id] = { value: '', focus(){}, select(){} };
      return boxes[id];
    },
    querySelector(){ return null; },
    querySelectorAll(){ return []; }
  };
  let _combNoAutoFocus = false;
  let _combAutoFocusTimer = null;
  function _combAutoFocus(){}
  function _combCancelAutoFocus(){}
  const _prep = { answered:false, retryLock:false, answers:[], lives:3, streak:0 };
  const _snd = { wrong(){}, correct(){} };
  function _prepUpdateHud(){}
  function _prepFinish(){}
  function _prepNextQ(){}
  function _algoMarkPerBox(){}
  function setBoxesRaw(K, valStr) {
    for (let k = 0; k < valStr.length; k++) document.getElementById('_comb_inp'+K+'_'+k).value = valStr[k];
  }
  let _combSt = null;

  // eslint-disable-next-line no-eval
  eval(code);

  const fresh = (tokens) => {
    const q = { algo:'comb', tokens, a:'?', q:'g' };
    _combSt = { q, N:tokens.length, toks:tokens.map((v,i)=>({v,cs:i+1,ce:i+1})), sel:[], chainPicks:{}, chainPickSide:{}, signOpen:{}, done:[] };
  };
  const solveIdx = (idx) => {
    const isPM = _combIsPM(_combSt.toks[idx].v);
    _combSt.sel = [];
    _combToggleSelect(idx);
    if (!_combSt.sel.includes(idx)) return false;
    let expected;
    if (isPM) {
      expected = _combFoldedExpected(_combSt.toks, idx).expected;
      _combOpenSignPicker(idx);
      _combPickChainSign(idx, expected < 0 ? '-' : '+', 'own');
    } else {
      const lt = _combSt.toks[idx-1], op = _combSt.toks[idx], rt = _combSt.toks[idx+1];
      expected = _combCalc(lt.v, op.v, rt.v);
    }
    setBoxesRaw(0, String(Math.abs(expected)));
    _combSubmitStep();
    _prep.retryLock = false;
    return true;
  };

  return {
    fresh, solveIdx,
    render: () => _combRender(),
    html: () => container.innerHTML.replace(/\s+/g, ' ').trim(),
    select: (idx) => { _combSt.sel = []; _combToggleSelect(idx); return _combSt.sel.includes(idx); },
    toggle: (idx) => { _combToggleSelect(idx); return _combSt.sel.includes(idx); },
    clickCol: (col, fromDIdx) => _combClickCol(col, fromDIdx),
    clearSel: () => { _combSt.sel = []; },
    isSelectable: (idx) => _combOpSelectable(idx),
    isPM: (v) => _combIsPM(v),
    openSignPicker: (idx) => _combOpenSignPicker(idx),
    pickChainSign: (idx, sign) => _combPickChainSign(idx, sign, 'own'),
    setBoxesRaw,
    submitStep: () => _combSubmitStep(),
    get toks() { return _combSt.toks; },
    get done() { return _combSt.done; },
    get sel() { return _combSt.sel; },
  };
}

// Michel-reported case: clicking a still-pending operator (e.g. '+' in 31+22-4×29÷4) that's echoed in an
// OLDER done row should still reopen+join the latest done step (existing behavior, confirmed correct) — but
// clicking that SAME pending operator's copy drawn in the LATEST done row itself must NOT reopen/join
// anything; it should cleanly select just that operator so a fresh new row appears below. Behavioral check
// (not just a render snapshot) since the thing under test is a STATE transition (done.length, sel), not html.
function checkClickRowAwareness(levelupPath) {
  const tokens = [31, '+', 22, '-', 4, '×', 29, '÷', 4];
  const plusCol = tokens.indexOf('+') + 1; // raw column of '+'

  const older = makeHarness(levelupPath);
  older.fresh(tokens);
  older.solveIdx(older.toks.findIndex(t => t.v === '×'));
  older.solveIdx(older.toks.findIndex(t => t.v === '÷'));
  const doneBefore = older.done.length; // 2
  older.clickCol(plusCol, 0); // clicked from row dIdx=0 — the OLDER (×) row, not the latest
  const olderOk = older.done.length === doneBefore - 1 && older.sel.length === 2; // reopened ÷ and joined with +

  const latest = makeHarness(levelupPath);
  latest.fresh(tokens);
  latest.solveIdx(latest.toks.findIndex(t => t.v === '×'));
  latest.solveIdx(latest.toks.findIndex(t => t.v === '÷'));
  latest.clickCol(plusCol, latest.done.length - 1); // clicked from the LATEST (÷) row
  const latestOk = latest.done.length === doneBefore && latest.sel.length === 1 && latest.sel[0] === latest.toks.findIndex(t => t.v === '+');

  if (!olderOk) console.error('FAIL: clicking a pending operator from an OLDER row should still reopen+join the latest done step.');
  if (!latestOk) console.error('FAIL: clicking a pending operator from the LATEST row must NOT reopen/join — it should start a clean new step.');
  return olderOk && latestOk;
}

// Michel-reported case: the decorative "implicit +" badge (shown floating to the left of toks[0] while its
// operator's sign-pick is open) must only appear when toks[0] genuinely HAS no sign of its own yet — a plain
// never-folded number like the 90 in "90-50". Once toks[0] is itself a through-value already showing its own
// explicit NEGATIVE sign (e.g. "-107" from an earlier "38-145"), the badge must NOT appear — there's nothing
// implicit left to compare against, the sign is already on screen. Checked directly via html() since the
// thing under test is a specific decorative element (identified by its "left:-44px" absolute-position style),
// not something the golden snapshot diff would usefully call out on its own.
function checkImplicitPlusBadge(levelupPath) {
  const hasBadge = html => html.includes('left:-44px');

  const negLt = makeHarness(levelupPath);
  negLt.fresh([38, '-', 435, '÷', 3, '+', 5, '×', 49]);
  negLt.solveIdx(negLt.toks.findIndex(t => t.v === '÷'));
  negLt.solveIdx(negLt.toks.findIndex(t => t.v === '×'));
  negLt.solveIdx(negLt.toks.findIndex(t => t.v === '-')); // toks now [-107, '+', 245]
  negLt.select(negLt.toks.findIndex(t => t.v === '+'));
  negLt.openSignPicker(negLt.toks.findIndex(t => t.v === '+'));
  negLt.render();
  const negLtOk = !hasBadge(negLt.html());

  const plainLt = makeHarness(levelupPath);
  plainLt.fresh([90, '-', 50]);
  plainLt.select(1);
  plainLt.openSignPicker(1);
  plainLt.render();
  const plainLtOk = hasBadge(plainLt.html());

  if (!negLtOk) console.error('FAIL: implicit "+" badge must NOT show when toks[0] is already negative (e.g. -107+245).');
  if (!plainLtOk) console.error('FAIL: implicit "+" badge SHOULD show for a plain, never-folded lt (e.g. 90-50).');
  return negLtOk && plainLtOk;
}

// Michel-reported case: when 2+ independent operators are solved TOGETHER in one step (e.g. √, ^ and × all
// at once in "(√100+9^2)÷7×9-4×9-18"), finishing the last digit and submitting must NOT move anything —
// the confirmed done row must land in EXACTLY the same columns the active row already showed while the
// digits were still being typed. The underlying bug: an already-positioned sibling (e.g. √, a completely
// independent group elsewhere in the same bracket) was getting dragged sideways by ANOTHER sibling's
// shrinkage (e.g. ^, or the outer ×) purely because both happened to be solved in the same step — unrelated
// to whether they actually neighbor each other. Checked by rendering the SAME scenario twice: once as the
// still-active row (all 3 selected, digits filled, before submit) and once submitted (now a done row), then
// asserting every leaf element in that row lands on the identical column in both.
function checkAnchorPriorityDoneRowMatchesActive(levelupPath) {
  const tokens = ['(', 1, '√', 100, '+', 9, '^', 2, ')', '÷', 7, '×', 9, '-', 4, '×', 9, '-', 18];
  const leafCols = (html, row) => {
    const re = new RegExp('<div style="grid-column:(\\d+)/(\\d+);grid-row:' + row + ';', 'g');
    const out = []; let m;
    while ((m = re.exec(html))) out.push(+m[1]);
    return out;
  };

  const hA = makeHarness(levelupPath);
  hA.fresh(tokens);
  const sqrtIdx = hA.toks.findIndex(t => t.v === '√');
  const powIdx = hA.toks.findIndex(t => t.v === '^');
  const secondX = hA.toks.map((t, i) => (t.v === '×' ? i : -1)).filter(i => i >= 0)[1];
  hA.select(sqrtIdx);
  hA.toggle(powIdx);
  hA.toggle(secondX);
  hA.setBoxesRaw(0, '10');
  hA.setBoxesRaw(1, '81');
  hA.setBoxesRaw(2, '36');
  hA.render();
  const activeCols = leafCols(hA.html(), 3); // row0=1, spacer=2, active=3 (done.length===0 here)

  const hB = makeHarness(levelupPath);
  hB.fresh(tokens);
  hB.select(hB.toks.findIndex(t => t.v === '√'));
  hB.toggle(hB.toks.findIndex(t => t.v === '^'));
  hB.toggle(hB.toks.map((t, i) => (t.v === '×' ? i : -1)).filter(i => i >= 0)[1]);
  hB.setBoxesRaw(0, '10');
  hB.setBoxesRaw(1, '81');
  hB.setBoxesRaw(2, '36');
  hB.render();
  hB.submitStep();
  hB.render();
  const doneCols = leafCols(hB.html(), 3); // row0=1, spacer=2, done step0's own row=3

  const ok = activeCols.length > 0 && JSON.stringify(activeCols) === JSON.stringify(doneCols);
  if (!ok) console.error('FAIL: done row must match the active row exactly after submit. active=' + JSON.stringify(activeCols) + ' done=' + JSON.stringify(doneCols));
  return ok;
}

// Michel-reported case: the active row's divider line for a "base^exponent" whose result needs FEWER than
// 3 digits must start (left edge) exactly under the BASE's own row-0 glyph — not one column further left.
// Row 0 itself draws a small-result pow's base at the OPERATOR's own raw column instead of the base's own
// raw column (freeing the base's true raw column as reserved/empty space — see the isExpBase branch in row
// 0's rendering and _combExpBaseCols), so the divider must track that same repositioning or it starts one
// whole column too far left, hanging over the empty reserved gap instead of the base's visible digit. A
// 3+-digit result (base widens across its own two raw columns instead) was already correct and must stay
// untouched. The RIGHT edge (exponent side) is unaffected in every case — only the left edge moves.
function checkPowDividerBaseAligned(levelupPath) {
  const dividerCols = html => {
    const m = /<div class="algo-line" style="grid-column:(\d+)\/(\d+)/.exec(html);
    return m ? [+m[1], +m[2]] : null;
  };
  // Row-0 raw columns for [1,'+',base,'^',2]: 1='1', 2='+', 3=base, 4='^', 5=exponent.
  // 1-digit result (2^2=4): base drawn at opCol (raw col 4, the '^' token's own column) → divider must start
  // there (col 4), not at the base's own raw col 3.
  const h1 = makeHarness(levelupPath);
  h1.fresh([1, '+', 2, '^', 2]);
  h1.select(h1.toks.findIndex(t => t.v === '^'));
  h1.render();
  const d1 = dividerCols(h1.html());
  const ok1digit = d1 && d1[0] === 4;

  // 2-digit result (4^2=16): same repositioning as the 1-digit case — base still fits inside "^"'s own
  // column, so the divider must also start at col 4, not col 3.
  const h2 = makeHarness(levelupPath);
  h2.fresh([1, '+', 4, '^', 2]);
  h2.select(h2.toks.findIndex(t => t.v === '^'));
  h2.render();
  const d2 = dividerCols(h2.html());
  const ok2digit = d2 && d2[0] === 4;

  // 3-digit result (12^2=144): base widens across its own two raw columns (col 3 AND col 4) instead — the
  // divider correctly starts at the base's own raw col 3 here, and this case must NOT change.
  const h3 = makeHarness(levelupPath);
  h3.fresh([1, '+', 12, '^', 2]);
  h3.select(h3.toks.findIndex(t => t.v === '^'));
  h3.render();
  const d3 = dividerCols(h3.html());
  const ok3digit = d3 && d3[0] === 3;

  if (!ok1digit) console.error('FAIL: pow divider (1-digit result) must start at col 4 (the base\'s row-0-repositioned column), got ' + JSON.stringify(d1));
  if (!ok2digit) console.error('FAIL: pow divider (2-digit result) must start at col 4 (the base\'s row-0-repositioned column), got ' + JSON.stringify(d2));
  if (!ok3digit) console.error('FAIL: pow divider (3-digit result) must stay at col 3 (the base\'s own raw column) — this case must not change, got ' + JSON.stringify(d3));
  return ok1digit && ok2digit && ok3digit;
}

// Michel-reported case: the pow divider fix above covered the ACTIVE row, but submitting that same step
// (pressing the last digit, auto-advancing past Verificar) re-renders it as a DONE row through a completely
// separate code path (the done-row divider loop, which only special-cased √ and had never gotten the same
// "base repositioned at opCol" treatment for ^) — so the divider silently jumped one column left again the
// instant the row was confirmed, even though it was already correct while still active. Checked end-to-end:
// solve "√4" first, then select+fill "6^2" (36, 2 digits — the row-0-repositioning case), and assert the
// divider's left edge is identical before AND after _combSubmitStep().
function checkPowDividerSurvivesSubmit(levelupPath) {
  const dividerCols = html => {
    const m = /<div class="algo-line" style="grid-column:(\d+)\/(\d+)/.exec(html);
    return m ? [+m[1], +m[2]] : null;
  };
  const h = makeHarness(levelupPath);
  h.fresh(['[', 1, '√', 4, '+', 6, '^', 2, ']', '÷', 2, '×', 8, '-', 1, '+', 29, '×', 5]);
  h.solveIdx(h.toks.findIndex(t => t.v === '√'));
  h.select(h.toks.findIndex(t => t.v === '^'));
  h.setBoxesRaw(0, '36');
  h.render();
  const before = dividerCols(h.html());
  h.submitStep();
  h.render();
  const after = dividerCols(h.html());
  const ok = before && after && before[0] === after[0] && before[1] === after[1];
  if (!ok) console.error('FAIL: pow divider must not move when the step is submitted. before=' + JSON.stringify(before) + ' after=' + JSON.stringify(after));
  return ok;
}

// Michel-reported case: when two INDEPENDENT operators are solved simultaneously in one step and their
// results need different digit counts, the one needing the MOST digits (by operator-tier priority, then
// digit count, then centeredness) must become a fixed anchor that nothing drags — everything else (the
// other operator's digit boxes, and any untouched operators/operands between them) must hug/shift toward
// that anchor instead, so no gap ever opens on the side facing it. Case: [8,'×',76,'-',396,'÷',9,'+',44]
// with × (result 608, 3 digits) and ÷ (result 44, 2 digits) selected together — × outranks ÷ by tier
// (multiplication/division tier, but × has more digits: 3 vs 2), so × stays pinned under its own row-0
// columns (1-4) and ÷'s narrower 2-digit result hugs LEFT toward it, closing the gap against '-' at col4-5;
// the untouched trailing '+' then shifts left too, closing the gap freed by ÷'s narrower width.
function checkAnchorPriority(levelupPath) {
  const gridColOf = (html, marker) => {
    const mi = html.indexOf(marker);
    if (mi === -1) return null;
    const gcIdx = html.lastIndexOf('grid-column:', mi);
    if (gcIdx === -1) return null;
    const m = /grid-column:(\d+)\/(\d+)/.exec(html.slice(gcIdx, gcIdx + 30));
    return m ? [+m[1], +m[2]] : null;
  };
  const eq = (a, b) => a && b && a[0] === b[0] && a[1] === b[1];

  const h = makeHarness(levelupPath);
  h.fresh([8, '×', 76, '-', 396, '÷', 9, '+', 44]);
  h.select(h.toks.findIndex(t => t.v === '×'));
  h.toggle(h.toks.findIndex(t => t.v === '÷'));
  h.render();
  const html = h.html();

  const checks = [
    ['×-digit0 pinned at row0 col1-2', gridColOf(html, 'id="_comb_inp0_0"'), [1, 2]],
    ['×-digit1 pinned at row0 col2-3', gridColOf(html, 'id="_comb_inp0_1"'), [2, 3]],
    ['×-digit2 pinned at row0 col3-4', gridColOf(html, 'id="_comb_inp0_2"'), [3, 4]],
    ["'-' stays put at col4-5", gridColOf(html, '_combClickOp(3,'), [4, 5]],
    ['÷-digit0 hugs left to col5-6', gridColOf(html, 'id="_comb_inp1_0"'), [5, 6]],
    ['÷-digit1 hugs left to col6-7', gridColOf(html, 'id="_comb_inp1_1"'), [6, 7]],
    ["'+' shifts left to close the freed gap, col7-8", gridColOf(html, '_combClickOp(7,'), [7, 8]],
  ];

  let ok = true;
  for (const [label, actual, expected] of checks) {
    if (!eq(actual, expected)) {
      console.error('FAIL: anchor-priority — ' + label + '. Expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual));
      ok = false;
    }
  }
  return ok;
}

// Michel-reported case: selecting a chain-fold +/- operator (op_before is also +/-, e.g. the "+4" in
// "...-6+4+41") used to under-count the freed space by exactly the one column op_before occupies — it only
// measured the operator's own lt/op/rt span, not op_before's column too — so the sign-pick box overlapped
// whatever followed (e.g. "+41"). Checked at every stage of picking a chain-fold sign (blank box open,
// confirmed sign, confirmed sign + typed digit) by asserting adjacency: the token right before the group,
// the sign box itself, and the token right after the group must all sit in strictly consecutive columns —
// never overlapping, never leaving an unexplained gap.
function checkChainFoldNoOverlap(levelupPath) {
  // Several rows (row 0, earlier done rows, and the active row) all echo the same untouched tokens (e.g.
  // "8"), so the FIRST match in the whole HTML is usually an earlier, irrelevant row — the active row is
  // always rendered LAST, so the LAST match is the one that matters here.
  const gridColOf = (html, marker) => {
    const mi = html.lastIndexOf(marker);
    if (mi === -1) return null;
    const gcIdx = html.lastIndexOf('grid-column:', mi);
    if (gcIdx === -1) return null;
    const m = /grid-column:(\d+)\/(\d+)/.exec(html.slice(gcIdx, gcIdx + 30));
    return m ? [+m[1], +m[2]] : null;
  };
  const h = makeHarness(levelupPath);
  h.fresh(['[', 1, '√', 144, '+', 3, '^', 2, ']', '÷', 7, '×', 8, '-', 6, '+', 4, '+', 41]);
  h.solveIdx(h.toks.findIndex(t => t.v === '√'));
  h.solveIdx(h.toks.findIndex(t => t.v === '^'));
  // The chain-fold operator: op_before (two positions back) must itself be +/- for this to be chainable.
  const foldIdx = h.toks.findIndex((t, i) => t.v === '+' && i >= 2 &&
    (h.toks[i - 2].v === '-' || h.toks[i - 2].v === '+') && typeof h.toks[i - 2].v === 'string');
  h.select(foldIdx);
  h.render();

  let ok = true;
  const checkAdjacent = (label, beforeMarker, boxStartMarker, boxEndMarker, afterMarker) => {
    const before = gridColOf(h.html(), beforeMarker);
    const boxStart = gridColOf(h.html(), boxStartMarker);
    const boxEnd = gridColOf(h.html(), boxEndMarker);
    const after = gridColOf(h.html(), afterMarker);
    if (!before || !boxStart || !boxEnd || !after || before[1] !== boxStart[0] || boxEnd[1] !== after[0]) {
      console.error('FAIL: chain-fold overlap — ' + label + '. before=' + JSON.stringify(before) + ' boxStart=' + JSON.stringify(boxStart) + ' boxEnd=' + JSON.stringify(boxEnd) + ' after=' + JSON.stringify(after));
      ok = false;
    }
  };

  const signId = 'id="_comb_sign_' + foldIdx + '"';
  const afterOp = '_combClickOp(' + (foldIdx + 2) + ',';
  // Stage 1: blank box, not yet opened — the blank box is the whole group (start and end coincide).
  checkAdjacent('blank box (not opened)', '>8<', signId, signId, afterOp);
  h.openSignPicker(foldIdx);
  h.render();
  // Stage 2: opened (blank + two choice buttons) — the group's true right edge is now the LAST choice
  // button (own sign, rendered after the "before" choice), not the blank box's own div.
  checkAdjacent('picker open (blank + 2 choices)', '>8<', signId, 'id="_comb_signopt_' + foldIdx + '_own_', afterOp);

  return ok;
}

// Michel-reported case: a chain-fold operator's divider (e.g. selecting "+47" in "...×3+20+47", where
// op_before is the "+" right before 20) must NOT stretch its left edge to cover op_before's own hidden
// column — that widening is correct for the sign BOX (a separate element that visually reclaims the
// absorbed glyph's space) but the divider line itself must stay anchored to lt's own row-0 column, same as
// any non-chained operator, landing at the center of lt's column (e.g. "20"), never one column further left
// at op_before's own column (e.g. the hidden "+").
function checkChainFoldDividerLeftEdge(levelupPath) {
  const dividerCols = html => {
    const m = /<div class="algo-line" style="grid-column:(\d+)\/(\d+)/.exec(html);
    return m ? [+m[1], +m[2]] : null;
  };
  const h = makeHarness(levelupPath);
  const tokens = [1, '×', 3, '+', 20, '+', 47];
  h.fresh(tokens);
  const foldIdx = tokens.indexOf(47) - 1; // the second '+', chain-folding with the first '+' before 20
  const expectedLeft = h.toks[foldIdx - 1].cs; // lt's (20's) own row-0 column
  h.select(foldIdx);
  h.render();
  const cols = dividerCols(h.html());
  const ok = !!cols && cols[0] === expectedLeft;
  if (!ok) console.error('FAIL: chain-fold divider left edge — expected to start at col ' + expectedLeft + ' (lt\'s own column), got ' + JSON.stringify(cols));
  return ok;
}

// Michel-reported case: selecting THREE independent operators together — two inside a bracket (√ and ^,
// e.g. in "[√121-1^2]") plus a chain-fold OUTSIDE that bracket (e.g. "+41-35" before a trailing "+26") —
// used to land the chain-fold's own sign box one column short of where the trailing "+26" already sits,
// producing a same-column collision (the fold's digit input and the "+" button before "26" both landing on
// the identical grid column). Root cause: excludeSrc/excludeOpCols (used to keep a bracket-separated
// sibling from dragging an operator's own box around — see checkAnchorPriorityDoneRowMatchesActive above)
// was symmetric, blocking shrinkage in BOTH directions across a bracket boundary. It must only block a
// LATER sibling's shrinkage from reaching backward into an EARLIER, still-bracketed operator (the original
// bug) — an EARLIER sibling's shrinkage (from inside a bracket) must keep propagating OUT to a LATER
// operator's own box, exactly like it already does for any plain through-content in between. Checked in
// both the active row (every stage: not-yet-opened, open, confirmed) and the resulting done row.
function checkCrossBracketChainFoldNoOverlap(levelupPath) {
  const gridColOf = (html, marker) => {
    const mi = html.lastIndexOf(marker);
    if (mi === -1) return null;
    const gcIdx = html.lastIndexOf('grid-column:', mi);
    if (gcIdx === -1) return null;
    const m = /grid-column:(\d+)\/(\d+)/.exec(html.slice(gcIdx, gcIdx + 30));
    return m ? [+m[1], +m[2]] : null;
  };
  const h = makeHarness(levelupPath);
  const tokens = ['[', 1, '√', 121, '-', 1, '^', 2, ']', '÷', 2, '×', 8, '+', 41, '-', 35, '+', 26];
  h.fresh(tokens);
  const sqrtIdx = h.toks.findIndex(t => t.v === '√');
  const powIdx = h.toks.findIndex(t => t.v === '^');
  const foldIdx = h.toks.findIndex((t, i) => t.v === '-' && h.toks[i + 1] && h.toks[i + 1].v === 35);
  h.select(sqrtIdx);
  h.toggle(powIdx);
  h.toggle(foldIdx);
  if (h.sel.length !== 3) { console.error('FAIL: cross-bracket chain-fold — could not multi-select all 3 operators (sel=' + JSON.stringify(h.sel) + ')'); return false; }

  let ok = true;
  const checkAdjacent = (label, boxEndMarker, afterMarker) => {
    const boxEnd = gridColOf(h.html(), boxEndMarker);
    const after = gridColOf(h.html(), afterMarker);
    if (!boxEnd || !after || boxEnd[1] !== after[0]) {
      console.error('FAIL: cross-bracket chain-fold overlap — ' + label + '. boxEnd=' + JSON.stringify(boxEnd) + ' after=' + JSON.stringify(after));
      ok = false;
    }
  };
  const afterOp = '_combClickOp(' + (foldIdx + 2) + ',';
  const signId = 'id="_comb_sign_' + foldIdx + '"';

  h.render();
  checkAdjacent('blank box not opened', signId, afterOp);
  h.openSignPicker(foldIdx);
  h.render();
  checkAdjacent('picker open', 'id="_comb_signopt_' + foldIdx + '_own_', afterOp);
  h.pickChainSign(foldIdx, '+');
  h.setBoxesRaw(2, '6');
  h.render();
  checkAdjacent('sign confirmed + digit typed', 'id="_comb_inp2_0"', afterOp);

  // Same check again, but on the resulting DONE row after submitting — the done-row equivalent
  // (_combBracketBetween/excludeOpCols in the resultAnchor pass) had the identical symmetric-exclusion bug.
  h.setBoxesRaw(0, '11');
  h.setBoxesRaw(1, '1');
  h.render();
  h.submitStep();
  h.render();
  // Done-row indices are relative to that row's own (pre-merge) snapshot, not the original token array, so
  // find the "+" before "26" by content instead of recomputing its index — its column just needs to be
  // immediately after the fold's own digit box, wherever the onclick index for it ends up landing.
  const doneHtml = h.html();
  const digitEndCol = gridColOf(doneHtml, 'id="_comb_done_0_2_0"');
  const twentySixCol = gridColOf(doneHtml, '>26<');
  if (!digitEndCol || !twentySixCol || twentySixCol[0] !== digitEndCol[1] + 1) {
    console.error('FAIL: cross-bracket chain-fold overlap — done row after submit. digitEnd=' + JSON.stringify(digitEndCol) + ' twentySixCol=' + JSON.stringify(twentySixCol) + ' (expected exactly 1 column gap for the "+" operator between them)');
    ok = false;
  }

  return ok;
}

// Michel-reported case: once a chain-fold's own step is submitted, its connector (op_before — the glyph
// that now shows the fold's final sign) is rendered as ordinary through-content, translated via the row's
// generic effColFor(dIdx, tok.cs) — completely independent from where the result's own digit(s) actually
// land (resultAnchor). Root cause was two-fold: (1) _combSlotAnchor's freed-space measurement for a
// chainable operator used lt (the fold's own left operand) as the shrink boundary instead of op_before,
// under-counting the freed width by exactly the connector's own column and dragging whatever precedes it
// (op_before included) one column too far right; (2) even after fixing that boundary, the connector's own
// rendering had no positional relationship to the digit(s) at all, so it could still land with a gap before
// them (or, for a chainable fold whose result needs 2+ digits, land on the exact same column as whatever the
// now-correctly-adjusted freed-space pull dragged into its "natural" column). Checked for both a negative
// chain-fold result (connector must flip glyph, single digit) and a positive one (2-digit result, no flip).
function checkChainFoldDoneRowConnectorAdjacency(levelupPath) {
  const gridColOf = (html, marker) => {
    const mi = html.lastIndexOf(marker);
    if (mi === -1) return null;
    const gcIdx = html.lastIndexOf('grid-column:', mi);
    if (gcIdx === -1) return null;
    const m = /grid-column:(\d+)\/(\d+)/.exec(html.slice(gcIdx, gcIdx + 30));
    return m ? [+m[1], +m[2]] : null;
  };
  let ok = true;

  // Case A: negative chain-fold result (-16+15 = -1), single digit, connector glyph flips "-"→"+".
  {
    const h = makeHarness(levelupPath);
    const tokens = ['(', 1, '√', 144, '+', 3, '^', 2, ')', '÷', 3, '×', 9, '-', 16, '+', 15, '-', 11];
    h.fresh(tokens);
    h.solveIdx(h.toks.findIndex(t => t.v === '√'));
    h.solveIdx(h.toks.findIndex(t => t.v === '^'));
    const foldIdx = h.toks.findIndex((t, i) => t.v === '+' && h.toks[i + 1] && h.toks[i + 1].v === 15);
    h.solveIdx(foldIdx);
    h.render();
    const html = h.html();
    const connectorCol = gridColOf(html, '_combClickOp(9,2)');
    const digitCol = gridColOf(html, 'id="_comb_done_2_0_0"');
    if (!connectorCol || !digitCol || connectorCol[1] !== digitCol[0]) {
      console.error('FAIL: chain-fold done-row connector adjacency (negative case) — connector=' + JSON.stringify(connectorCol) + ' digit=' + JSON.stringify(digitCol));
      ok = false;
    }
  }

  // Case B: positive chain-fold result (-10+42 = +32), 2-digit result, connector glyph stays "+".
  {
    const h = makeHarness(levelupPath);
    const tokens = ['[', 1, '√', 16, '+', 2, '^', 2, ']', '÷', 8, '×', 3, '-', 10, '+', 42, '-', 7];
    h.fresh(tokens);
    h.solveIdx(h.toks.findIndex(t => t.v === '√'));
    h.solveIdx(h.toks.findIndex(t => t.v === '^'));
    const foldIdx = h.toks.findIndex((t, i) => t.v === '+' && h.toks[i + 1] && h.toks[i + 1].v === 42);
    h.solveIdx(foldIdx);
    h.render();
    const html = h.html();
    const connectorCol = gridColOf(html, '_combClickOp(9,2)');
    const firstDigitCol = gridColOf(html, 'id="_comb_done_2_0_0"');
    const secondDigitCol = gridColOf(html, 'id="_comb_done_2_0_1"');
    if (!connectorCol || !firstDigitCol || !secondDigitCol || connectorCol[1] !== firstDigitCol[0] || firstDigitCol[1] !== secondDigitCol[0]) {
      console.error('FAIL: chain-fold done-row connector adjacency (positive case) — connector=' + JSON.stringify(connectorCol) + ' d0=' + JSON.stringify(firstDigitCol) + ' d1=' + JSON.stringify(secondDigitCol));
      ok = false;
    }
  }

  return ok;
}

// Michel-reported case: a chain-fold that ends up being the very LAST operation in the row (nothing raw-
// wise follows it) hits _combSlotAnchor's plain "hasLeft" branch, which computes no shrink event at all —
// so the digits stay hugged to lt's own column, exactly as wide as their own digit count, while the
// divider's right edge kept independently recomputing rt's own row-0 position (via thruSpanFor), which for
// this branch no longer matches where the digits actually end. Confirmed by Michel: the divider must end
// flush with the last real digit here, not float past it into empty space.
function checkChainFoldDoneRowDividerFlushAtEnd(levelupPath) {
  const gridColOf = (html, marker) => {
    const mi = html.lastIndexOf(marker);
    if (mi === -1) return null;
    const gcIdx = html.lastIndexOf('grid-column:', mi);
    if (gcIdx === -1) return null;
    const m = /grid-column:(\d+)\/(\d+)/.exec(html.slice(gcIdx, gcIdx + 30));
    return m ? [+m[1], +m[2]] : null;
  };
  const dividerCols = (html, row) => {
    const re = new RegExp('<div class="algo-line" style="grid-column:(\\d+)/(\\d+);(?:grid-row:' + row + ';)');
    const m = re.exec(html);
    return m ? [+m[1], +m[2]] : null;
  };
  const h = makeHarness(levelupPath);
  const tokens = ['(', 1, '√', 144, '-', 2, '^', 2, ')', '÷', 4, '+', 4, '×', 5, '-', 10, '+', 44];
  h.fresh(tokens);
  h.solveIdx(h.toks.findIndex(t => t.v === '√'));
  h.solveIdx(h.toks.findIndex(t => t.v === '^'));
  const foldIdx = h.toks.findIndex((t, i) => t.v === '+' && h.toks[i + 1] && h.toks[i + 1].v === 44);
  h.solveIdx(foldIdx);
  h.render();
  const html = h.html();
  const lastDigitCol = gridColOf(html, 'id="_comb_done_2_0_1"');
  const div = dividerCols(html, 6);
  if (!lastDigitCol || !div || div[1] !== lastDigitCol[1]) {
    console.error('FAIL: chain-fold done-row divider not flush at end-of-row — lastDigit=' + JSON.stringify(lastDigitCol) + ' divider=' + JSON.stringify(div));
    return false;
  }
  return true;
}

function captureSnapshots(levelupPath) {
  const h = makeHarness(levelupPath);
  const snapshots = {};
  const record = (key) => { h.render(); snapshots[key] = h.html(); };

  for (const [label, tokens] of SCENARIOS) {
    h.fresh(tokens);
    record(label + '::row0');

    for (let idx = 0; idx < tokens.length; idx++) {
      if (typeof tokens[idx] !== 'string') continue;
      h.fresh(tokens);
      h.render();
      if (!h.isSelectable(idx)) continue;
      if (!h.select(idx)) continue;
      record(label + '::select_idx' + idx);
      if (h.isPM(h.toks[idx].v)) {
        h.openSignPicker(idx);
        record(label + '::select_idx' + idx + '::signOpen');
      }
    }

    h.fresh(tokens);
    let safety = 0, step = 0;
    while (h.toks.length > 1 && safety < 15) {
      safety++;
      const pending = () => h.toks.map((t,i)=>({t,i})).filter(({t,i})=>typeof t.v==='string'&&h.isSelectable(i)).map(({i})=>i);
      const first = pending();
      if (!first.length) break;
      if (!h.solveIdx(first[0])) break;
      record(label + '::natural_after_step' + step);
      step++;
      const remaining = pending();
      if (remaining.length) {
        const idx2 = remaining[remaining.length - 1]; // prefer a DIFFERENT op to exercise done-row/active-row interplay
        if (h.select(idx2)) {
          record(label + '::natural_after_step' + step + '_then_select_idx' + idx2);
          h.clearSel();
        }
      }
    }
  }
  return snapshots;
}

function main() {
  const snapshots = captureSnapshots(LEVELUP_PATH);

  if (UPDATE) {
    fs.writeFileSync(GOLDEN_PATH, JSON.stringify(snapshots, null, 1));
    console.log('Golden file updated:', GOLDEN_PATH, '(' + Object.keys(snapshots).length + ' snapshots)');
    return;
  }

  if (!fs.existsSync(GOLDEN_PATH)) {
    console.error('No golden file yet at', GOLDEN_PATH, '- run with --update first.');
    process.exit(1);
  }
  const golden = JSON.parse(fs.readFileSync(GOLDEN_PATH, 'utf8'));
  let diffs = 0;
  for (const k of Object.keys(golden)) {
    if (!(k in snapshots)) { console.log('MISSING:', k); diffs++; continue; }
    if (golden[k] !== snapshots[k]) { console.log('DIFF:', k); diffs++; }
  }
  for (const k of Object.keys(snapshots)) if (!(k in golden)) { console.log('NEW (not in golden):', k); diffs++; }

  if (diffs > 0) {
    console.error('\n' + diffs + ' rendering difference(s) found vs. golden master.');
    console.error('If every diff above was an intentional, reviewed change, run with --update to accept them.');
    process.exit(1);
  }

  if (!checkClickRowAwareness(LEVELUP_PATH)) {
    console.error('\nclick row-awareness behavioral check FAILED.');
    process.exit(1);
  }

  if (!checkImplicitPlusBadge(LEVELUP_PATH)) {
    console.error('\nimplicit "+" badge behavioral check FAILED.');
    process.exit(1);
  }

  if (!checkAnchorPriority(LEVELUP_PATH)) {
    console.error('\nanchor-priority (simultaneous multi-operator selection) behavioral check FAILED.');
    process.exit(1);
  }

  if (!checkPowDividerBaseAligned(LEVELUP_PATH)) {
    console.error('\npow divider base-alignment behavioral check FAILED.');
    process.exit(1);
  }

  if (!checkPowDividerSurvivesSubmit(LEVELUP_PATH)) {
    console.error('\npow divider survives-submit behavioral check FAILED.');
    process.exit(1);
  }

  if (!checkAnchorPriorityDoneRowMatchesActive(LEVELUP_PATH)) {
    console.error('\ndone-row-matches-active-row (multi-operator submit) behavioral check FAILED.');
    process.exit(1);
  }

  if (!checkChainFoldNoOverlap(LEVELUP_PATH)) {
    console.error('\nchain-fold sign-box overlap behavioral check FAILED.');
    process.exit(1);
  }

  if (!checkChainFoldDividerLeftEdge(LEVELUP_PATH)) {
    console.error('\nchain-fold divider left-edge behavioral check FAILED.');
    process.exit(1);
  }

  if (!checkCrossBracketChainFoldNoOverlap(LEVELUP_PATH)) {
    console.error('\ncross-bracket chain-fold overlap behavioral check FAILED.');
    process.exit(1);
  }

  if (!checkChainFoldDoneRowConnectorAdjacency(LEVELUP_PATH)) {
    console.error('\nchain-fold done-row connector adjacency behavioral check FAILED.');
    process.exit(1);
  }

  if (!checkChainFoldDoneRowDividerFlushAtEnd(LEVELUP_PATH)) {
    console.error('\nchain-fold done-row divider flush-at-end behavioral check FAILED.');
    process.exit(1);
  }

  console.log('OK: ' + Object.keys(snapshots).length + ' snapshots match the golden master exactly, and behavioral checks passed.');
}

main();
