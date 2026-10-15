/* Behavioral tests for the one case-study figure reducer. Run: node --test tests/*.test.js
   The Ray page keeps a single interactive figure: a saved sheet that reruns
   its query when reopened, beside an exported file that never changes. The
   reducers for the retired simulators (Notes stages, document concierge,
   portal continuity, support form, homeowner send) were removed with the
   simulators on September 6, 2026, and so were their tests. */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../js/cs-state.js');

const M = C.sheet;
function play(actions) { return actions.reduce((s, a) => M.reduce(s, { type: a }), M.init()); }

test('sheet: the initial state matches the file; the file never changes', () => {
  const s = M.init();
  assert.equal(s.opened, false);
  assert.deepEqual(M.rows(s), M.fileRows(), 'as saved, the sheet shows the same records as the file');
  assert.deepEqual(M.rows(s).map((r) => r.status), ['Rejected', 'Rejected']);
  assert.equal(M.rows(s).length, 2, 'two records in the file: enough to show a change and an addition on a phone');
  assert.equal(M.when(s), 'Saved Sep 2, 9:40 AM');
  assert.equal(M.summary(s), 'Same records as the exported file.');
  assert.deepEqual(M.changes(s), []);
  const after = play(['reopen', 'reopen']);
  assert.deepEqual(M.fileRows(), M.rows(M.init()), 'the file rows are the saved rows, before and after reopening');
  assert.notDeepEqual(M.rows(after), M.fileRows());
});

test('sheet: one reopen changes exactly one record and adds exactly one row, with a visible time and summary', () => {
  const s = play(['reopen']);
  assert.equal(s.opened, true);
  assert.equal(s.reopens, 1);
  const rows = M.rows(s);
  assert.equal(rows.length, 3);
  const changed = rows.filter((r) => r.change === 'changed');
  const added = rows.filter((r) => r.change === 'added');
  assert.equal(changed.length, 1);
  assert.equal(added.length, 1);
  assert.equal(changed[0].project, 'Juniper House');
  assert.equal(changed[0].status, 'Approved');
  assert.equal(added[0].project, 'Cedar House');
  const untouched = rows.filter((r) => !r.change).map((r) => r.project);
  assert.deepEqual(untouched, ['Orchard House'], 'the other record reads exactly as it did in the file');
  assert.equal(M.when(s), 'Reopened Sep 5, 4:12 PM');
  assert.equal(M.summary(s), '1 record changed, 1 added since the file was saved.');
  assert.deepEqual(M.changes(s), ['Juniper House changed to Approved', 'Cedar House added']);
  assert.match(M.message(s, 'reopen'), /^Reopened Sep 5, 4:12 PM\. Juniper House changed to Approved\. Cedar House added\. The exported file is unchanged\.$/);
});

test('sheet: repeated reopens are deterministic and find nothing new; refresh is never continuous', () => {
  const once = play(['reopen']);
  const thrice = play(['reopen', 'reopen', 'reopen']);
  assert.deepEqual(M.rows(thrice), M.rows(once), 'the rows are the same after one reopen and after three');
  assert.equal(M.when(thrice), M.when(once));
  assert.equal(M.summary(thrice), M.summary(once));
  assert.equal(thrice.reopens, 3);
  assert.match(M.message(thrice, 'reopen'), /Reopened again\. Nothing has changed since the last open\./);
  assert.equal(typeof M.reduce, 'function');
  assert.equal(M.reduce(once, { type: 'tick' }), once, 'no timer or unknown action changes the sheet');
});

test('sheet: reset restores the as-saved state and is a no-op when already there', () => {
  const s = play(['reopen', 'reopen', 'reset']);
  assert.deepEqual(s, M.init());
  assert.deepEqual(M.rows(s), M.fileRows());
  assert.match(M.message(s, 'reset'), /same as the file/);
  const init = M.init();
  assert.equal(M.reduce(init, { type: 'reset' }), init, 'reset on the initial state returns the same object, so nothing re-renders');
  assert.equal(M.message(init, null), '');
});

test('sheet: an action that changes nothing has its own message and never implies a new result', () => {
  assert.match(M.unchanged('reset'), /^Nothing to reset\./);
  assert.doesNotMatch(M.unchanged('reset'), /Reopened|changed to|added/);
  assert.equal(M.unchanged('reopen'), '', 'a reopen always reruns the query; it is never a silent no-op');
  assert.equal(M.unchanged('tick'), '');
});

test('sheet: rows are copies, so a renderer cannot corrupt the fixture', () => {
  const a = M.rows(play(['reopen']));
  a[1].status = 'Broken';
  const b = M.rows(play(['reopen']));
  assert.equal(b[1].status, 'Approved');
  assert.equal(M.fixture.current[1].status, 'Approved');
});

test('fixtures are fictional, labeled, and contain no em dashes', () => {
  const text = JSON.stringify(C, (k, v) => typeof v === 'function' ? undefined : v);
  assert.equal(text.includes('—'), false);
  for (const row of M.fixture.saved.concat(M.fixture.current)) {
    assert.match(row.project, /House$/, 'fictional project names only');
  }
  assert.equal(M.fixture.fileName, 'installation-reviews.csv');
});
