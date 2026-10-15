/* DOM tests for the case-study pages. Run: node --test tests/*.test.js
   These build small fixtures from the page markup only. No page is
   navigated, no resource is fetched, and the gate is never touched. jsdom
   is not a dependency of the site; the tests look for it at JSDOM_PATH, in
   node_modules, or in the local QA folder, and skip with a message if it is
   unavailable. jsdom does no layout, so nothing here claims a rendered
   result; the structural and behavioral contracts are what is asserted.

   Retired with the simulators on September 6, 2026: the Notes stage tabs,
   the two-layouts note form, the homeowner screen tabs, the live-sheet
   engine (scope, columns, CSV, empty state), the portal engine (FLIP move,
   streaming, disconnect, stale), the file-versus-sheet toggle, the
   continuity view selector, the sheet disclosure auto-open, the pulse
   helper, and the tabs helper. Shared behavior (chapter nav, reveals, film
   playback) keeps its coverage below.

   October 15, 2026: daylight.html is the one combined Daylight and Ray case
   study, and ray.html is a text-free alias that forwards to it. Every sheet,
   confirmation, film and structure fixture now reads the combined page; the
   alias has its own checks at the end. */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');

function findJsdom() {
  const candidates = [process.env.JSDOM_PATH, 'jsdom', '/tmp/daylight-ray-qa-20260905/node_modules/jsdom'].filter(Boolean);
  for (const c of candidates) { try { return require(c); } catch (e) { /* try the next one */ } }
  return null;
}
const jsdom = findJsdom();
const skip = jsdom ? false : 'jsdom not found (set JSDOM_PATH); DOM tests skipped';
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

async function boot(markup, scripts, prepare, htmlClass) {
  const { JSDOM } = jsdom;
  const dom = new JSDOM('<!doctype html><html' + (htmlClass ? ' class="' + htmlClass + '"' : '') + '><body>' + markup + '</body></html>', { runScripts: 'outside-only' });
  const w = dom.window;
  await new Promise((resolve) => w.addEventListener('load', resolve, { once: true }));
  let tick = 0; const queue = new Map();
  w.setTimeout = (fn, ms) => { const id = ++tick; queue.set(id, { fn, ms: ms || 0 }); return id; };
  w.clearTimeout = (id) => queue.delete(id);
  w.requestAnimationFrame = (fn) => w.setTimeout(fn, 16);
  w.cancelAnimationFrame = w.clearTimeout;
  w.__queries = [];
  w.__queue = queue;
  w.matchMedia = (query) => { const mq = { media: query, matches: false, listeners: [], addEventListener(_, cb) { this.listeners.push(cb); }, addListener(cb) { this.listeners.push(cb); } }; w.__queries.push(mq); return mq; };
  w.fetch = () => { throw new Error('Unexpected network call'); };
  if (prepare) { prepare(w); }
  for (const file of ['js/cs-state.js', 'js/dl-shared.js', ...scripts]) { w.eval(read(file)); }
  const flush = () => {
    let limit = 200;
    while (queue.size) {
      assert.ok(limit--, 'Timer loop did not settle');
      const [id, item] = [...queue].sort((a, b) => a[1].ms - b[1].ms)[0];
      queue.delete(id); item.fn();
    }
  };
  const setReduced = (on) => { const mq = w.__queries.find((q) => /prefers-reduced-motion/.test(q.media)); mq.matches = on; mq.listeners.forEach((cb) => cb({ matches: on })); };
  const close = () => { setTimeout(() => dom.window.close(), 10); };
  return { w, d: w.document, flush, setReduced, close };
}

/* an inert parse of a page: no scripts run, so this is what a reader
   without JavaScript gets */
function inert(page) {
  const { JSDOM } = jsdom;
  const dom = new JSDOM(read(page));
  return { d: dom.window.document, close: () => dom.window.close() };
}

async function fixture(page, selectors, scripts, prepare) {
  const page0 = inert(page);
  const markup = selectors.map((s) => { const el = page0.d.querySelector(s); return el ? el.outerHTML : ''; }).join('');
  page0.close();
  return boot(markup, scripts, prepare);
}

/* ======================================================================
   The one interactive figure: reopen the sheet, compare it with the file
   ====================================================================== */
const sheetRows = (d, sel) => [...d.querySelectorAll(sel + ' tr')].map((li) => [li.querySelector('b').textContent, li.querySelector('.cs-tag').textContent, li.querySelector('small').textContent]);

test('sheet, without scripting: both states are already on the page in reading order and no control is shown', { skip }, () => {
  const page = inert('daylight.html');
  try {
    const d = page.d;
    const file = sheetRows(d, '.sh-file .sh-rows');
    const live = sheetRows(d, '#sheet-rows');
    assert.equal(file.length, 2, 'two records in the file, enough to show a change and an addition on a phone');
    assert.equal(live.length, 3, 'the reopened sheet is what a reader without JavaScript sees');
    assert.deepEqual(file.map((r) => r[1]), ['Rejected', 'Rejected']);
    assert.deepEqual(live[1], ['Juniper House', 'Approved', 'Reviewed Sep 4']);
    assert.deepEqual(live[2], ['Cedar House', 'Rejected', 'Roof measurement is unclear']);
    assert.ok(d.querySelector('#sheet-rows tr[data-row="juniper"]').classList.contains('is-changed'));
    assert.ok(d.querySelector('#sheet-rows tr[data-row="cedar"]').classList.contains('is-added'));
    assert.equal(d.querySelector('#sheet-when').textContent, 'Reopened Sep 5, 4:12 PM');
    assert.match(d.querySelector('#sheet-summary').textContent, /1 record changed, 1 added/);
    assert.equal(d.querySelector('#sheet-actions').hidden, true, 'the buttons are hidden until scripting shows them');
    const fileNode = d.querySelector('.sh-file'), liveNode = d.querySelector('#sheet-live');
    assert.ok(fileNode.compareDocumentPosition(liveNode) & 4, 'the file comes before the sheet in reading order');
    assert.equal(d.querySelectorAll('#sheet-figure table').length, 2, 'file and live sheet use the source product’s tabular structure');
    assert.equal(d.querySelectorAll('#sheet-figure th[scope="col"]').length, 6, 'both tables have scoped column headers');
    assert.equal(d.querySelectorAll('#sheet-figure select, #sheet-figure input, #sheet-figure a[download]').length, 0, 'no scope selector, no column picker, no download');
  } finally { page.close(); }
});

test('sheet, with scripting: starts as saved; one reopen changes one record and adds one; the file never changes', { skip }, async () => {
  const f = await fixture('daylight.html', ['#sheet-figure'], ['js/ray-case-study.js']);
  try {
    const q = (s) => f.d.querySelector(s);
    assert.equal(q('#sheet-actions').hidden, false, 'scripting shows the controls');
    assert.equal(f.w.__queue.size, 0, 'no timer is pending after init; nothing refreshes on its own');
    assert.deepEqual(sheetRows(f.d, '#sheet-rows'), sheetRows(f.d, '.sh-file .sh-rows'), 'as saved, the sheet matches the file');
    assert.equal(q('#sheet-when').textContent, 'Saved Sep 2, 9:40 AM');
    assert.equal(q('#sheet-summary').textContent, 'Same records as the exported file.');
    assert.equal(q('#sheet-reset').disabled, false, 'reset is never disabled, so it can always take and keep focus');
    assert.equal(q('#sheet-live').getAttribute('data-state'), 'saved');
    const fileBefore = JSON.stringify(sheetRows(f.d, '.sh-file .sh-rows'));
    q('#sheet-reopen').click();
    const live = sheetRows(f.d, '#sheet-rows');
    assert.equal(live.length, 3);
    assert.deepEqual(live[1], ['Juniper House', 'Approved', 'Reviewed Sep 4'], 'exactly one record changed status');
    assert.deepEqual(live[2], ['Cedar House', 'Rejected', 'Roof measurement is unclear'], 'exactly one row was added');
    assert.deepEqual(live[0], ['Orchard House', 'Rejected', 'Photo is missing']);
    assert.equal(f.d.querySelectorAll('#sheet-rows tr.is-changed').length, 1);
    assert.equal(f.d.querySelectorAll('#sheet-rows tr.is-added').length, 1);
    assert.equal(q('#sheet-rows tr.is-changed .sh-mark').textContent, 'Changed on reopen');
    assert.equal(JSON.stringify(sheetRows(f.d, '.sh-file .sh-rows')), fileBefore, 'the exported file is untouched');
    assert.equal(q('#sheet-when').textContent, 'Reopened Sep 5, 4:12 PM', 'the visible time updates');
    assert.equal(q('#sheet-summary').textContent, '1 record changed, 1 added since the file was saved.');
    assert.equal(q('#sheet-live').getAttribute('data-state'), 'reopened');
    assert.equal(q('#sheet-reset').disabled, false);
    f.flush();
    assert.equal(q('#sheet-status').textContent, 'Reopened Sep 5, 4:12 PM. Juniper House changed to Approved. Cedar House added. The exported file is unchanged.');
    assert.equal(q('#sheet-status').getAttribute('aria-live'), 'polite');
    for (const tr of f.d.querySelectorAll('#sheet-rows tr')) { assert.equal(tr.querySelectorAll('td').length, 3); for (const node of tr.querySelectorAll('b, small, span, i')) { assert.equal(node.children.length, 0, 'cell values stay plain text'); } }
  } finally { f.close(); }
});

test('sheet: repeated and rapid reopens are deterministic; reset restores; nothing else on the page changes', { skip }, async () => {
  const f = await fixture('daylight.html', ['#sheet-figure'], ['js/ray-case-study.js']);
  try {
    const q = (s) => f.d.querySelector(s);
    const originalCaption = q('#sheet-figure figcaption').textContent;
    q('#sheet-reopen').click();
    const once = JSON.stringify(sheetRows(f.d, '#sheet-rows'));
    q('#sheet-reopen').click(); q('#sheet-reopen').click(); q('#sheet-reopen').click();
    assert.equal(JSON.stringify(sheetRows(f.d, '#sheet-rows')), once, 'three more taps change nothing');
    assert.equal(f.d.querySelectorAll('#sheet-rows tr').length, 3, 'rows are never duplicated');
    assert.equal(q('#sheet-when').textContent, 'Reopened Sep 5, 4:12 PM');
    f.flush();
    assert.equal(q('#sheet-status').textContent, 'Reopened again. Nothing has changed since the last open. The exported file is unchanged.');
    q('#sheet-reset').click(); f.flush();
    assert.deepEqual(sheetRows(f.d, '#sheet-rows'), sheetRows(f.d, '.sh-file .sh-rows'), 'reset restores the as-saved rows');
    assert.equal(q('#sheet-when').textContent, 'Saved Sep 2, 9:40 AM');
    assert.equal(f.d.querySelectorAll('#sheet-rows .sh-mark').length, 0, 'no change marks in the saved state');
    assert.equal(q('#sheet-reset').disabled, false, 'reset stays enabled after a reset');
    assert.match(q('#sheet-status').textContent, /^Reset\./);
    const savedRows = [...f.d.querySelectorAll('#sheet-rows tr')];
    q('#sheet-reset').click(); f.flush();
    assert.match(q('#sheet-status').textContent, /^Nothing to reset\./, 'a second reset says nothing changed instead of pretending a new result arrived');
    assert.deepEqual([...f.d.querySelectorAll('#sheet-rows tr')], savedRows, 'a second reset touches no row');
    assert.equal(q('#sheet-figure figcaption').textContent, originalCaption, 'the caption is untouched');
    assert.equal(f.d.querySelectorAll('#sheet-figure button').length, 2, 'exactly two controls, both native buttons');
    for (const b of f.d.querySelectorAll('#sheet-figure button')) { assert.equal(b.getAttribute('type'), 'button'); }
  } finally { f.close(); }
});

test('sheet: the tap target keeps focus and the page never scrolls; keyboard activation works; a live reduced-motion change is harmless', { skip }, async () => {
  const scrolls = [];
  const f = await fixture('daylight.html', ['#sheet-figure'], ['js/ray-case-study.js'], (w) => {
    w.scrollTo = (...a) => scrolls.push(['scrollTo', a]);
    w.Element.prototype.scrollIntoView = function () { scrolls.push(['scrollIntoView', this.id]); };
    w.HTMLElement.prototype.focus = (function (orig) { return function (opts) { return orig.call(this, opts); }; })(w.HTMLElement.prototype.focus);
  });
  try {
    const q = (s) => f.d.querySelector(s);
    const reopen = q('#sheet-reopen');
    reopen.focus();
    assert.equal(f.d.activeElement, reopen);
    reopen.click(); f.flush();
    assert.equal(f.d.activeElement, reopen, 'focus stays on the button after a change');
    assert.equal(reopen.disabled, false, 'the button is not disabled under the reader');
    reopen.dispatchEvent(new f.w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    reopen.click();
    assert.equal(f.d.querySelectorAll('#sheet-rows tr').length, 3);
    f.setReduced(true);
    assert.equal(f.d.documentElement.classList.contains('reduce-motion'), true);
    q('#sheet-reset').focus();
    q('#sheet-reset').click(); f.flush();
    assert.equal(f.d.querySelectorAll('#sheet-rows tr').length, 2, 'reset still works under reduced motion');
    assert.deepEqual(scrolls, [], 'nothing scrolled the page');
    assert.equal(f.d.activeElement, q('#sheet-reset'), 'focus stays where the reader put it; the script never moves it');
  } finally { f.close(); }
});

test('sheet: the controls and the live text come before the rows they change, so a new row never moves the tap target', { skip }, async () => {
  const f = await fixture('daylight.html', ['#sheet-figure'], ['js/ray-case-study.js']);
  try {
    const q = (s) => f.d.querySelector(s);
    const before = (a, b) => !!(a.compareDocumentPosition(b) & f.w.Node.DOCUMENT_POSITION_FOLLOWING);
    assert.ok(before(q('#sheet-actions'), q('#sheet-status')), 'controls, then the status line');
    assert.ok(before(q('#sheet-status'), q('#sheet-rows')), 'status, then the rows');
    assert.ok(before(q('#sheet-rows'), q('#sheet-summary')), 'rows, then the summary');
    assert.ok(before(q('.sh-file'), q('#sheet-live')), 'the file panel still reads first');
    const reset = q('#sheet-reset'), reopen = q('#sheet-reopen');
    assert.equal(reset.disabled, false, 'reset is enabled before anything happened');
    assert.equal(reset.hasAttribute('aria-disabled'), false);
    reset.focus(); reset.click(); f.flush();
    assert.equal(f.d.activeElement, reset, 'a reset that changes nothing keeps focus');
    assert.match(q('#sheet-status').textContent, /^Nothing to reset\./);
    assert.deepEqual(sheetRows(f.d, '#sheet-rows'), sheetRows(f.d, '.sh-file .sh-rows'), 'and changes no row');
    reopen.focus(); reopen.click(); f.flush();
    reset.focus(); reset.click(); f.flush();
    assert.equal(f.d.activeElement, reset, 'focus stays on the enabled reset after it restores the sheet');
    assert.equal(reset.disabled, false);
    assert.match(q('#sheet-status').textContent, /^Reset\./);
  } finally { f.close(); }
});

test('sheet: a repeat reopen keeps every unchanged row node and does not replay its arrival; reset keeps the surviving nodes too', { skip }, async () => {
  const f = await fixture('daylight.html', ['#sheet-figure'], ['js/ray-case-study.js']);
  try {
    const q = (s) => f.d.querySelector(s);
    const nodes = () => [...q('#sheet-rows').children];
    const saved = nodes();
    q('#sheet-reopen').click(); f.flush();
    const opened = nodes();
    assert.equal(opened.length, 3);
    assert.equal(opened[0], saved[0], 'the unchanged Orchard row is the same node after reopening');
    assert.equal(opened[1], saved[1], 'the changed Juniper row is repainted in place, not rebuilt');
    assert.equal(opened[0].classList.contains('cs-enter'), false, 'an unchanged row is not animated');
    assert.equal(opened[1].classList.contains('cs-enter'), true, 'a changed row gets the short fade');
    assert.equal(opened[2].classList.contains('cs-enter'), true, 'an added row gets the short fade');
    opened[1].classList.remove('cs-enter'); opened[2].classList.remove('cs-enter');
    for (let i = 0; i < 12; i++) { q('#sheet-reopen').click(); }
    f.flush();
    const again = nodes();
    assert.deepEqual(again, opened, 'twelve more reopens leave every row node in place');
    assert.ok(again.every((li) => !li.classList.contains('cs-enter')), 'and replay no arrival');
    assert.match(q('#sheet-status').textContent, /Nothing has changed since the last open/);
    assert.equal(q('#sheet-summary').textContent, '1 record changed, 1 added since the file was saved.', 'the summary never pretends a further result arrived');
    q('#sheet-reset').click(); f.flush();
    const back = nodes();
    assert.equal(back.length, 2);
    assert.equal(back[0], opened[0], 'reset keeps the Orchard node');
    assert.equal(back[1], opened[1], 'reset repaints the Juniper node in place');
    assert.equal(back[1].querySelector('.cs-tag').textContent, 'Rejected');
    assert.equal(back[1].querySelector('.sh-mark'), null, 'the change mark is gone');
    assert.equal(opened[2].isConnected, false, 'the added row is removed');
  } finally { f.close(); }
});

test('sheet: the latest announcement wins; a fast reset after a reopen leaves one pending message and no stale text', { skip }, async () => {
  const f = await fixture('daylight.html', ['#sheet-figure'], ['js/ray-case-study.js']);
  try {
    const q = (s) => f.d.querySelector(s);
    q('#sheet-reopen').click();
    q('#sheet-reset').click();
    assert.equal(f.w.__queue.size, 1, 'the reopen announcement was cancelled by the reset');
    f.flush();
    assert.match(q('#sheet-status').textContent, /^Reset\./);
    q('#sheet-reopen').click(); q('#sheet-reopen').click(); q('#sheet-reopen').click();
    assert.equal(f.w.__queue.size, 1, 'three quick reopens leave one pending announcement');
    f.flush();
    assert.match(q('#sheet-status').textContent, /^Reopened again\./, 'the last message is the one that lands');
    assert.equal(q('#sheet-status').getAttribute('role'), 'status');
  } finally { f.close(); }
});

test('shared announce: one pending message per live region, the newest replacing the older one; separate regions do not interfere', { skip }, async () => {
  const f = await boot('<p id="a" role="status"></p><p id="b" role="status"></p>', [], () => {});
  try {
    const S = f.w.DLShared, a = f.d.getElementById('a'), b = f.d.getElementById('b');
    S.announce(a, 'first'); S.announce(a, 'second'); S.announce(b, 'other');
    assert.equal(f.w.__queue.size, 2, 'one timer for a, one for b');
    f.flush();
    assert.equal(a.textContent, 'second');
    assert.equal(b.textContent, 'other');
    S.announce(a, 'third'); f.flush();
    assert.equal(a.textContent, 'third');
    assert.doesNotThrow(() => S.announce(null, 'nothing'));
  } finally { f.close(); }
});

/* ======================================================================
   Structure: everything essential reads without scripting or controls
   ====================================================================== */
const RETIRED_IDS = ['notes-demo', 'mobile-demo', 'dl-chain', 'ls', 'ls-explore', 'pc', 'pc-explore', 'rv', 'lb', 'home-tab-overview', 'nd-compose', 'mp-form'];

for (const page of ['daylight.html']) {
  test(page + ': one linear story, readable without scripting, no simulator or form outside the gate', { skip }, () => {
    const p = inert(page);
    try {
      const d = p.d;
      const main = d.querySelector('main');
      assert.ok(main);
      assert.equal(main.querySelectorAll('h1').length, 1);
      const menu = [...d.querySelectorAll('.cs-nav-menu a[href^="#"]')];
      assert.ok(menu.length >= 5, 'a chapter index of at least five chapters');
      const h2s = [...main.querySelectorAll('h2')];
      for (const a of menu) {
        const id = a.getAttribute('href').slice(1);
        const section = d.getElementById(id);
        assert.ok(section, 'chapter target exists: ' + id);
        assert.equal(section.tagName, 'SECTION');
        const h = d.getElementById(section.getAttribute('aria-labelledby'));
        assert.ok(h && h.tagName === 'H2', 'each chapter is a section labelled by its h2: ' + id);
        assert.ok(h2s.includes(h));
      }
      assert.equal(h2s.length, menu.length, 'every chapter of the one story is in the index, and nothing else in main is an h2');
      assert.ok(menu.length >= 12, 'portal, homeowners, Ray and the close are all chapters of one page');
      assert.equal(main.querySelectorAll('form, input, select, textarea').length, 0, 'no synthetic form outside the gate');
      assert.equal(main.querySelectorAll('[role="tab"], [role="tablist"], [role="tabpanel"]').length, 0, 'no tabs for basic reading');
      assert.equal(main.querySelectorAll('.cs-mask, .cs-stepper, .cs-tabs, .cs-demo, .cs-table-wrap').length, 0, 'no masked headline lines, steppers, demo frames or sideways tables');
      for (const id of RETIRED_IDS) { assert.equal(d.getElementById(id), null, 'retired simulator id is gone: ' + id); }
      for (const details of d.querySelectorAll('details')) {
        assert.equal(details.firstElementChild.tagName, 'SUMMARY', 'every disclosure is a native details with its summary first');
        assert.ok(details.querySelector('summary').textContent.trim().length > 3);
      }
      for (const img of main.querySelectorAll('img')) {
        assert.ok(img.hasAttribute('alt'), 'every image has an alt attribute');
        assert.ok(img.getAttribute('width') && img.getAttribute('height'), 'every image reserves its box');
      }
      for (const video of d.querySelectorAll('video')) {
        assert.equal(video.hasAttribute('autoplay'), false);
        assert.ok(video.getAttribute('poster'));
        assert.equal(video.getAttribute('preload'), 'metadata');
        assert.ok(d.querySelector('[data-video-toggle="' + video.id + '"]'), 'every film has a visible play control');
      }
      const gateButtons = d.querySelectorAll('#dl-gate button').length;
      const buttons = [...d.querySelectorAll('button')].length - gateButtons;
      assert.equal(buttons, 8, 'only the three view controls, two sheet controls, confirm and replay, and the film control');
      assert.equal(main.querySelectorAll('[data-feature-choice]').length, 2, 'one confirmation example: confirm and replay');
      assert.equal(main.querySelectorAll('[data-feature-next], [data-feature-reset]').length, 0, 'no next-button loops');
      for (const b of main.querySelectorAll('button')) { assert.ok(b.textContent.trim() || b.getAttribute('aria-label'), 'every control has a name'); }
      assert.equal(d.body.innerHTML.includes('—'), false, 'no em dashes');
      /* the emoji ranges are absent; icons are inline SVG */
      assert.equal(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(d.body.textContent), false, 'no emoji as iconography');
      assert.ok(main.querySelectorAll('svg').length >= 1);
    } finally { p.close(); }
  });

  test(page + ': the site nav is a back link, the project name, and one Chapters disclosure', { skip }, () => {
    const p = inert(page);
    try {
      const nav = p.d.querySelector('nav.cs-nav');
      assert.ok(nav);
      const back = nav.querySelector('a.cs-nav-back');
      assert.ok(back && back.getAttribute('href') && back.textContent.trim(), 'a visible back link');
      assert.ok(nav.querySelector('.cs-nav-title').textContent.trim());
      assert.equal(nav.querySelectorAll('details').length, 1);
      assert.equal(nav.querySelector('details > summary').textContent.trim(), 'Chapters');
      assert.equal(nav.querySelectorAll('[data-cs-chapter-n], [data-cs-chapter-t], .cs-nav-home').length, 0, 'no chapter-number or duplicate identity cluster');
      assert.ok(!nav.querySelector('button'), 'the menu is a native disclosure, not a scripted button');
      const links = [...nav.querySelectorAll('a')];
      assert.ok(links.length >= 6);
    } finally { p.close(); }
  });
}

test('daylight.html: project-scoped Notes preserve evidence, mentions, replies and the editable Ray boundary', { skip }, () => {
  const p = inert('daylight.html');
  try {
    const notes = p.d.getElementById('notes');
    const thread = notes.querySelector('.dp-note');
    const text = thread.textContent.replace(/\s+/g, ' ');
    const order = ['Jamie Park', '@Taylor Brooks', 'The bill is uploaded.', 'utility-bill.pdf', 'Taylor Brooks', 'Title verification is awaiting reviewer approval.', 'Reply', 'Ask Ray'];
    let at = 0;
    for (const part of order) { const next = text.indexOf(part, at); assert.ok(next >= at, 'in reading order: ' + part); at = next; }
    assert.equal(notes.querySelectorAll('button, form, textarea, input, [aria-busy], [role="progressbar"]').length, 0, 'no simulated send, upload, or waiting');
    assert.match(notes.querySelector('figcaption').textContent, /reconstruction.*Fictional/);
    const depth = notes.querySelector('.dl-depth').textContent;
    assert.match(depth, /editable draft before it is sent/);
    assert.match(depth, /Nothing sends automatically/);
    assert.match(depth, /does not file it as a project document or approve a requirement/);
    assert.match(depth, /uploaded to the project separately/);
    assert.match(depth, /Posting a reply does not complete a requirement/);
    assert.match(depth, /deep links.*focus the relevant thread/);
  } finally { p.close(); }
});

test('daylight.html: all three authentic homeowner screens are visible in reading order with native implementation credit', { skip }, () => {
  const p = inert('daylight.html');
  try {
    const d = p.d, reach = d.getElementById('reach');
    const shots = [...reach.querySelectorAll('img[src^="images/ios-"]')];
    assert.deepEqual(shots.map(img => img.getAttribute('src')), ['images/ios-overview.png', 'images/ios-breakdown.png', 'images/ios-payments.png']);
    assert.ok(shots.every(img => !img.closest('details, [hidden]')), 'essential app screens are not behind disclosures');
    assert.equal(reach.querySelectorAll('[role="tablist"], button, .carousel, [aria-roledescription="carousel"]').length, 0, 'no carousel controls');
    const credit = reach.querySelector('.ds-home-copy .ch-prose');
    assert.ok(credit && !credit.closest('details'));
    assert.match(credit.textContent, /iOS engineer, who implemented the native app/);
    assert.match(reach.querySelector('.cs-lead').textContent, /What did my panels make today\? What’s the battery doing\? What do I owe\?/);
    const language = reach.querySelector('.ds-language');
    assert.ok(language && !language.closest('details'), 'the design-language comparison is readable without interaction');
    assert.match(language.textContent, /worked with Marketing/);
    assert.match(language.querySelector('figcaption').textContent, /portal rows are reconstructed/);
  } finally { p.close(); }
});

test('daylight.html: six real stages and origination requirement cards replace the abstract four-step journey', { skip }, () => {
  const p = inert('daylight.html');
  try {
    const d = p.d, hero = d.querySelector('.ds-hero');
    assert.equal(d.querySelector('h1').textContent.replace(/\u00a0/g, ' ').trim(), 'My work at Daylight.');
    assert.equal(hero.querySelector('.dl-hero-lead').textContent.trim(), 'I lead product and design for our partner portal, homeowner app and Ray, our AI assistant.');
    const collage = hero.querySelector('.ds-collage');
    assert.deepEqual([...collage.querySelectorAll('img[src^="images/"]:not(.rp-avatar)')].map((i) => i.getAttribute('src')), ['images/ios-overview.png'], 'the opening joins the authentic homeowner app with the portal and Ray');
    assert.match(collage.querySelector('.ds-collage-portal').textContent, /Title Verification.*Pending Approval.*holding this project up/s);
    assert.equal(collage.querySelector('figcaption').textContent.trim(), 'Portal demo with sample data. Original homeowner app screen.');
    assert.deepEqual([...hero.querySelectorAll('.ds-parts a')].map((a) => a.getAttribute('href')), ['#handoffs', '#reach', '#questions'], 'the opening indexes the three parts');
    assert.match(hero.querySelector('.ds-hero-role').textContent, /2024 to present.*Senior PM & Product Engineer/s);
    assert.equal(d.querySelectorAll('.dl-rail, [data-product-scene="daylight"]').length, 0);
    const phases = [...d.querySelectorAll('.dp-phases .dp-phase h4')].map(h => h.textContent.replace('→', '').trim());
    assert.deepEqual(phases, ['Origination', 'Document Verification', 'CAD Design & True Up', 'Permitting & Interconnection', 'Installation', 'Permission to Operate']);
    const cards = [...d.querySelectorAll('.dp-requirements .dp-card h4')].map(h => h.textContent.trim());
    assert.deepEqual(cards, ['Credit & Underwriting', 'System Details', 'Upload Utility Bill', 'Title Verification', 'Energy Subscription Agreement & Underwriting']);
    assert.match(d.querySelector('.dp-title-message').textContent, /Awaiting reviewer approval/);
    assert.ok(d.querySelector('#ray video source[src="images/daylight-cover-loop.mp4"]'), 'the original gradient film introduces Ray');
    assert.ok(d.querySelector('#ray #signal'), 'the old #signal anchor still lands on the Ray introduction');
    assert.deepEqual([...d.querySelectorAll('#handoffs .ds-stage-line b')].map((b) => b.textContent), phases, 'the handoff chapter names the same six stages as the project page');
    assert.ok(d.querySelector('#ray a[href="ray-demo.html"][data-ray-demo]'), 'the Ray chapter offers the demo');
    assert.equal(d.querySelectorAll('a[href^="ray.html"]').length, 0, 'no link to the alias, no second story');
    assert.doesNotMatch(d.body.textContent, /belong to colleagues/);
  } finally { p.close(); }
});

test('daylight.html: saved views belong to the dashboard and mobile Notes precede applicant details and collapsible stages', { skip }, () => {
  const p = inert('daylight.html');
  try {
    const d = p.d;
    assert.ok(d.querySelector('#queues .dp-saved-views .is-selected'));
    assert.equal(d.querySelectorAll('#notes .dp-saved-views').length, 0);
    assert.equal(d.querySelectorAll('.dp-jobs th[scope="col"]').length, 4);
    assert.equal(d.querySelectorAll('.dp-jobs th[scope="row"]').length, 3);
    assert.match(d.querySelector('#queues .dl-depth').textContent, /only for users entitled to both roles/);
    const phone = d.querySelector('.dp-phone-content'), notes = phone.querySelector('.dp-notes-promo'), details = phone.querySelector('.dp-phone-details'), stages = phone.querySelector('details.dp-mobile-stages');
    assert.ok(notes.compareDocumentPosition(details) & 4);
    assert.ok(details.compareDocumentPosition(stages) & 4);
    assert.equal(stages.firstElementChild.tagName, 'SUMMARY');
    assert.equal(stages.open, false);
    assert.equal(stages.querySelectorAll('li').length, 6);
    assert.ok(!notes.closest('details'), 'essential Notes context is readable with no interaction');
    assert.equal(notes.querySelector('a').getAttribute('href'), '#notes', 'illustrated Notes entry links to the actual case-study thread');
  } finally { p.close(); }
});

test('daylight.html: the broader Daylight work leads, and Ray follows in order with honest evaluation and clear credit', { skip }, () => {
  const p = inert('daylight.html');
  try {
    const d = p.d;
    const order = [...d.querySelectorAll('main > section')].map((el) => el.id);
    assert.deepEqual(order, ['handoffs', 'journey', 'queues', 'notes', 'reach', 'questions', 'ray', 'continuity', 'sheets', 'people', 'answers', 'engineering', 'work'], 'portal, homeowners, then Ray, then the close');
    assert.ok(order.indexOf('reach') < order.indexOf('questions'), 'the homeowner product precedes the Ray chapters');
    assert.deepEqual([...d.querySelectorAll('.ds-part')].map((el) => el.closest('section').id), ['handoffs', 'reach', 'questions'], 'one quiet marker opens each part');
    for (const id of ['handoffs', 'journey', 'notes', 'questions', 'continuity', 'sheets', 'people', 'answers']) {
      const chapter = d.getElementById(id);
      assert.ok(chapter.querySelector('h2') && chapter.querySelector('.ch-prose p') && chapter.querySelector('figure'), id + ' has prose and its own figure');
    }
    /* the Notes discovery is told once, qualitatively, with labeled sample data */
    const notes = d.getElementById('questions');
    assert.doesNotMatch(d.querySelector('main').textContent, /\d+\s*%|3,000/, 'no discovery percentages or note totals');
    assert.match(notes.querySelector('figcaption').textContent, /Sample notes written for this page, not real projects or people/);
    assert.ok(notes.querySelectorAll('.na-mark.is-answerable').length >= 1 && notes.querySelectorAll('.na-mark.is-silent').length >= 1);
    assert.match(notes.textContent, /no reply recorded in the thread/);
    assert.match(notes.textContent, /doesn’t tell us whether someone answered elsewhere/, 'no reply in the thread is not proof of no reply');
    assert.doesNotMatch(notes.textContent, /waiting on each other|left waiting/, 'no inferred waiting from unrecorded replies');
    assert.equal(d.querySelectorAll('.notes-audit').length, 1, 'the audit appears once');
    /* Ray is introduced after the need, with the team foundation first */
    const ray = d.getElementById('ray');
    assert.match(ray.textContent, /Our team had already built its foundation/);
    assert.match(ray.textContent, /I led the product direction, interaction design and AI-assisted implementation/);
    assert.ok(order.indexOf('questions') < order.indexOf('ray'), 'what people needed comes before the assistant');
    assert.match(d.getElementById('continuity').textContent, /A full-page chat would have been simpler to build/, 'the view tradeoff is stated');
    assert.equal((d.body.textContent.match(/Ray adapts to you; you don’t adapt to Ray/g) || []).length, 1, 'his phrase appears once');
    const sheets = d.getElementById('sheets').textContent;
    assert.match(sheets, /saves the query behind the list and runs it again whenever you open it/);
    assert.match(sheets, /permissions of whoever is looking/);
    assert.match(sheets, /still download a CSV/);
    assert.doesNotMatch(sheets, /real[- ]time|live data|collaborative|editable/i, 'a sheet reruns on open; it is not a live collaborative spreadsheet');
    const people = d.getElementById('people');
    assert.equal(people.querySelectorAll('[data-ray-feature]').length, 1, 'one confirmation example is enough');
    assert.match(people.querySelector('[data-feature-panel="1"]').textContent, /Added, awaiting review.*Not approved yet/s, 'placing a document is not approving the requirement');
    assert.match(people.querySelector('.handoff').textContent, /Ray Triage.*Routing rules.*Intercom and Slack.*A person/s, 'classification, configured routing and the human handoff');
    assert.match(people.querySelector('.handoff').textContent, /SOPs and policies from Ops and Growth/);
    const home = d.getElementById('homeowners').textContent;
    assert.match(home, /Homeowner Ray predates my portal work/);
    assert.match(home, /iOS engineer built the native conversation and cards/);
    assert.match(home, /merged behind feature flags/);
    assert.match(home, /never handles bank credentials or authorizes a payment/);
    assert.match(home, /Reconstructed iOS conversation and document card/);
    const answers = d.getElementById('answers').textContent;
    assert.match(answers, /isn’t a model we trained on Daylight/);
    assert.match(answers, /didn’t show that hybrid search was better in general/, 'no claim that hybrid retrieval improved accuracy');
    assert.match(answers, /pull the right article and still misread it/);
    assert.equal(d.getElementById('answers').querySelectorAll('.rp-chat').length, 0, 'no repeated chat mockup in the evaluation');
    assert.ok(d.querySelectorAll('.rp-chat').length <= 3, 'chat mockups: the view scene and the two states of one confirmation, nothing repeated');
    /* credit sits next to the work; the recap is optional detail that keeps the #evidence anchor */
    const evidence = d.getElementById('evidence');
    assert.equal(evidence.tagName, 'DETAILS', 'the contribution recap is a native disclosure');
    assert.equal(d.querySelector('.cs-nav-menu a[href="#evidence"]'), null, 'the recap is not a main chapter');
    assert.match(evidence.textContent, /Ray existed before this work/);
    assert.match(evidence.textContent, /Our iOS engineer implemented the native app/);
    assert.match(d.getElementById('work').textContent, /None of it was solo/);
    assert.doesNotMatch(d.querySelector('main').textContent, /left out usage numbers|main case study|shorter tour|Daylight overview/, 'one story, no internal accounting');
    assert.match(d.getElementById('engineering').textContent, /Document uploads and support escalations are reviewed and confirmed/, 'confirmation is scoped to the two confirmed actions');
    assert.equal(d.querySelectorAll('.receipt-list, .research-findings').length, 0, 'no public PR timeline or statistic scoreboard');
    assert.doesNotMatch(d.querySelector('main').textContent, /\bPR\s*\d|seamless|transformative|unlock|elevate|reimagine|orchestrated/i);
    assert.ok(d.querySelector('#work a[href="index.html#work"]'));
    assert.ok(d.querySelector('#work a[href="ray-demo.html"][data-ray-demo]'));
    assert.equal(d.querySelector('.cs-nav-back').getAttribute('href'), 'index.html#work', 'the story returns to selected work');
    assert.ok(d.querySelector('#dl-gate[role="dialog"]'));
    assert.ok(d.querySelector('script[src^="js/daylight-gate.js"]'));
    assert.ok(d.querySelector('script[src^="js/ray-return.js"]'));
    assert.equal(d.querySelector('script[src^="js/ray-demo"]'), null, 'the demo remains a separate surface');
    const controls = d.querySelector('#continuity [data-scene-controls]');
    assert.equal(controls.hidden, true);
    assert.deepEqual([...controls.querySelectorAll('button')].map((el) => el.textContent), ['Drawer', 'Full page', 'Separate window']);
    assert.equal(d.querySelectorAll('#continuity .ray-convo').length, 1, 'one conversation survives each view');
    assert.equal(d.querySelectorAll('#continuity input, #continuity textarea').length, 0);
    for (const feature of d.querySelectorAll('[data-ray-feature]')) {
      assert.equal(feature.querySelector('[data-feature-controls]').hidden, true, 'no dead controls without scripting');
      assert.equal(feature.querySelector('[data-feature-status]').getAttribute('role'), 'status');
      assert.equal(feature.querySelector('[data-feature-status]').textContent, JSON.parse(feature.dataset.featureMessages)[0], 'the no-script status matches the first step');
      assert.match(feature.querySelector('figcaption').textContent, /Reconstructed, sample data/);
    }
  } finally { p.close(); }
});

test('ray.html: a text-free alias that forwards every old fragment to the combined page without a history entry', { skip }, () => {
  const { JSDOM } = jsdom;
  const html = read('ray.html');
  const dom = new JSDOM(html);
  try {
    const d = dom.window.document;
    assert.equal(d.body.textContent.replace(/\s+/g, ' ').trim(), 'Continue to the Daylight case study', 'no case-study text, so nothing leaks past the gate');
    assert.equal(d.querySelector('a').getAttribute('href'), 'daylight.html#questions');
    assert.equal(d.querySelectorAll('main, section, figure, #dl-gate').length, 0);
    const script = d.querySelector('head script').textContent;
    const dl = new JSDOM(read('daylight.html')).window.document;
    const go = (hash) => { const calls = []; new Function('location', script)({ hash, replace: (u) => calls.push(u) }); assert.equal(calls.length, 1); return calls[0]; };
    const expected = { '': 'questions', '#ray-hero': 'questions', '#daylight': 'handoffs', '#questions': 'questions', '#continuity': 'continuity', '#ray-continuity-scene': 'ray-continuity-scene', '#sheets': 'sheets', '#sheet-figure': 'sheet-figure', '#sheet-live': 'sheet-live', '#people': 'people', '#homeowners': 'homeowners', '#answers': 'answers', '#engineering': 'engineering', '#evidence': 'evidence', '#role': 'work', '#nonsense': 'questions', '#__proto__': 'questions', '#constructor': 'questions' };
    for (const [hash, id] of Object.entries(expected)) {
      assert.equal(go(hash), 'daylight.html#' + id, hash || '(no fragment)');
      assert.ok(dl.getElementById(id), 'the target exists on the combined page: ' + id);
    }
  } finally { dom.window.close(); }
});

/* Feature interaction tests use synthetic geometry only. They verify
   state, focus and cancellation, never claim to measure visual quality. */
function prepareFeatures(w) {
  Object.defineProperty(w.document, 'hidden', { configurable: true, value: false });
  w.__featureObservers = [];
  w.IntersectionObserver = class {
    constructor(cb) { this.cb = cb; this.targets = []; w.__featureObservers.push(this); }
    observe(target) { this.targets.push(target); }
    unobserve() {}
    disconnect() {}
  };
  w.__animations = [];
  w.HTMLElement.prototype.getBoundingClientRect = function () {
    const feature = this.closest('[data-ray-feature]');
    const x = this.hasAttribute('data-feature-object') ? Number(feature.dataset.step) * 40 : 0;
    return { x, y: 0, left: x, top: 0, right: x + 200, bottom: 100, width: 200, height: 100 };
  };
  w.HTMLElement.prototype.animate = function (frames) {
    const animation = { frames, cancelled: false, cancel() { this.cancelled = true; } };
    w.__animations.push(animation);
    return animation;
  };
}

test('Ray examples: confirmation precedes the result; replay preserves nodes and keyboard focus', { skip }, async () => {
  const f = await fixture('daylight.html', ['#people .feature-document'], ['js/ray-case-study.js'], prepareFeatures);
  try {
    for (const stage of f.d.querySelectorAll('[data-ray-feature]')) {
      const panels = [...stage.querySelectorAll('[data-feature-panel]')];
      const messages = JSON.parse(stage.dataset.featureMessages);
      assert.equal(stage.dataset.step, '0');
      assert.ok([...stage.querySelectorAll('[data-feature-controls]')].every(e => !e.hidden));
      for (const step of [1, 0, 1, 0]) {
        const action = stage.querySelector('[data-feature-choice="' + step + '"]');
        action.focus(); action.click();
        assert.equal(stage.dataset.step, String(step));
        assert.equal(stage.querySelector('[data-feature-status]').textContent, messages[step]);
        assert.deepEqual(panels.map(p => p.hidden), panels.map((_, i) => i !== step));
        assert.equal(f.d.activeElement, panels[step], 'focus moves out of the replaced card without getting lost');
        const count = f.w.__animations.length;
        action.click();
        assert.equal(f.w.__animations.length, count, 'duplicate activation cannot produce another action');
        assert.deepEqual([...stage.querySelectorAll('[data-feature-panel]')], panels);
      }
    }
  } finally { f.close(); }
});

test('Ray examples: scrolling never confirms; rapid actions cancel overlapping motion', { skip }, async () => {
  const f = await fixture('daylight.html', ['#people .feature-document'], ['js/ray-case-study.js'], prepareFeatures);
  try {
    const stage = f.d.querySelector('[data-ray-feature]');
    const observer = f.w.__featureObservers.find(o => o.targets.includes(stage));
    observer.cb([{ target: stage, isIntersecting: true }]);
    assert.equal(stage.dataset.step, '0');
    stage.querySelector('[data-feature-choice="1"]').click();
    const first = [...f.w.__animations];
    assert.ok(first.length);
    stage.querySelector('[data-feature-choice="0"]').click();
    assert.ok(first.every(a => a.cancelled));
    observer.cb([{ target: stage, isIntersecting: false }]);
    assert.ok(f.w.__animations.every(a => a.cancelled));
    assert.equal(stage.dataset.step, '0');
    for (let i = 0; i < 30; i++) stage.querySelector('[data-feature-choice="' + (i % 2) + '"]').click();
    f.w.dispatchEvent(new f.w.Event('pagehide'));
    assert.ok(f.w.__animations.every(a => a.cancelled));
    for (const a of f.w.__animations) for (const frame of a.frames) assert.doesNotMatch(frame.transform, /scale/);
  } finally { f.close(); }
});

test('Ray examples: reduced motion, hidden tabs and the gate stop animation without blocking the sample', { skip }, async () => {
  const f = await fixture('daylight.html', ['#people .feature-document'], ['js/ray-case-study.js'], prepareFeatures);
  try {
    const stage = f.d.querySelector('[data-ray-feature]');
    const action = n => stage.querySelector('[data-feature-choice="' + n + '"]').click();
    action(1); assert.ok(f.w.__animations.length);
    for (const q of f.w.__queries.filter(q => /prefers-reduced-motion/.test(q.media))) { q.matches = true; q.listeners.forEach(cb => cb({ matches: true })); }
    assert.ok(f.w.__animations.every(a => a.cancelled));
    const count = f.w.__animations.length;
    action(0); assert.equal(f.w.__animations.length, count);
    for (const q of f.w.__queries) q.matches = false;
    Object.defineProperty(f.d, 'hidden', { configurable: true, value: true });
    f.d.dispatchEvent(new f.w.Event('visibilitychange')); action(1);
    assert.equal(f.w.__animations.length, count);
    Object.defineProperty(f.d, 'hidden', { configurable: true, value: false });
    f.d.documentElement.classList.add('dl-locked'); action(0);
    assert.equal(stage.dataset.step, '0'); assert.equal(f.w.__animations.length, count);
  } finally { f.close(); }
});
/* ======================================================================
   Shared: chapter nav and reveals (fixture geometry, no real page)
   ====================================================================== */
const STORY = `
  <nav class="cs-nav" aria-label="Site">
    <div class="cs-nav-in">
      <a class="cs-nav-back" href="other.html">Back</a><span class="cs-nav-title">Fixture</span>
      <span class="cs-nav-crumb"><span class="n" data-cs-chapter-n></span><span class="t" data-cs-chapter-t>Fixture, a case study</span></span>
      <details class="cs-nav-chapters"><summary>Chapters</summary>
        <ul class="cs-nav-menu">
          <li><a href="#alpha"><span>01</span>Alpha chapter</a></li>
          <li><a href="#beta"><span>02</span>Beta chapter</a></li>
          <li><a href="#gamma"><span>03</span>Gamma chapter</a></li>
          <li><a href="other.html"><span>&rarr;</span>Elsewhere</a></li>
        </ul>
      </details>
    </div>
    <span class="cs-nav-progress" aria-hidden="true"><i></i></span>
  </nav>
  <main>
    <header class="cs-reveal" id="hero" data-top="80" data-h="600"><h1>Fixture</h1><button type="button" id="hero-btn">Hero control</button></header>
    <section id="alpha" data-top="1000" data-h="900"><div class="cs-reveal" id="r-alpha" data-top="1000" data-h="400"><button type="button" id="alpha-btn">Alpha control</button></div></section>
    <section id="beta" data-top="2000" data-h="900"><div class="cs-reveal" id="r-beta" data-top="2000" data-h="400"><p>One</p><p>Two</p></div><details id="beta-details"><summary>More</summary><div>Detail</div></details></section>
    <section id="gamma" data-top="3000" data-h="900"><div class="cs-reveal" id="r-gamma" data-top="3000" data-h="400"><button type="button" id="gamma-btn">Gamma control</button></div></section>
    <div class="cs-reveal" id="r-past" data-top="-700" data-h="300">Already scrolled past</div>
  </main>`;

function storyPrepare(options) {
  options = options || {};
  return (w) => {
    w.__scrollY = options.scrollY || 0;
    Object.defineProperty(w, 'pageYOffset', { get: () => w.__scrollY, configurable: true });
    Object.defineProperty(w, 'innerHeight', { get: () => 800, configurable: true });
    w.__scrollHeight = 4000;
    Object.defineProperty(w.document.documentElement, 'scrollHeight', { get: () => w.__scrollHeight, configurable: true });
    class FakeResizeObserver {
      constructor(cb) { this.cb = cb; this.targets = new Set(); FakeResizeObserver.instances.push(this); }
      observe(t) { this.targets.add(t); }
      unobserve(t) { this.targets.delete(t); }
      disconnect() { this.targets.clear(); }
      fire() { this.cb([...this.targets].map((target) => ({ target })), this); }
    }
    FakeResizeObserver.instances = [];
    w.ResizeObserver = FakeResizeObserver;
    w.__resizeObservers = FakeResizeObserver.instances;
    Object.defineProperty(w.HTMLElement.prototype, 'offsetHeight', { get() { return this.classList && this.classList.contains('cs-nav') ? 60 : 0; }, configurable: true });
    w.Element.prototype.getBoundingClientRect = function () {
      const top = Number(this.getAttribute('data-top') || 0) - w.__scrollY;
      const h = Number(this.getAttribute('data-h') || 0);
      return { top, bottom: top + h, left: 0, right: 100, width: 100, height: h };
    };
    if (options.observer !== false) {
      class FakeObserver {
        constructor(cb) { this.cb = cb; this.targets = new Set(); this.disconnected = false; FakeObserver.instances.push(this); }
        observe(t) { this.targets.add(t); }
        unobserve(t) { this.targets.delete(t); }
        disconnect() { this.targets.clear(); this.disconnected = true; }
        fire(entries) { this.cb(entries, this); }
      }
      FakeObserver.instances = [];
      w.IntersectionObserver = FakeObserver;
      w.__observers = FakeObserver.instances;
    } else { delete w.IntersectionObserver; }
  };
}
const revealObserver = (w) => (w.__observers || []).find((o) => [...o.targets].some((t) => t.classList.contains('cs-reveal')));
const scrollTo = (f, y) => { f.w.__scrollY = y; f.w.dispatchEvent(new f.w.Event('scroll')); f.flush(); };

test('chapter nav: aria-current and the optional label follow scrolling down, up, and deep-link loads without moving focus or the URL', { skip }, async () => {
  const f = await boot(STORY, [], storyPrepare({ scrollY: 2100 }));
  try {
    const q = (s) => f.d.querySelector(s);
    const label = () => q('[data-cs-chapter-n]').textContent + '|' + q('[data-cs-chapter-t]').textContent;
    const current = () => [...f.d.querySelectorAll('.cs-nav-menu a')].filter((a) => a.getAttribute('aria-current') === 'location').map((a) => a.getAttribute('href'));
    assert.equal(label(), '02|Beta chapter', 'a deep-link load starts on the chapter under the reading line');
    assert.deepEqual(current(), ['#beta']);
    q('#hero-btn').focus();
    scrollTo(f, 3100);
    assert.deepEqual(current(), ['#gamma'], 'exactly one index entry is current');
    scrollTo(f, 1100);
    assert.deepEqual(current(), ['#alpha']);
    scrollTo(f, 0);
    assert.equal(label(), '|Fixture, a case study', 'before the first chapter the label is the page identity');
    assert.deepEqual(current(), [], 'no entry is current before the first chapter');
    assert.equal(f.d.activeElement.id, 'hero-btn', 'scrolling never moves focus');
    assert.equal(f.w.location.hash, '', 'scrolling never rewrites the URL');
    assert.equal(q('.cs-nav-progress i').style.transform, 'scaleX(0.0000)');
    scrollTo(f, 1600);
    assert.equal(q('.cs-nav-progress i').style.transform, 'scaleX(0.5000)', 'the line is page position over scrollable height');
    scrollTo(f, 3200);
    assert.equal(q('.cs-nav-progress i').style.transform, 'scaleX(1.0000)');
    assert.equal(q('.cs-nav-progress').getAttribute('role'), null, 'the line is decorative, not a progressbar');
    q('#gamma').setAttribute('data-top', '3500');
    q('#beta-details').dispatchEvent(new f.w.Event('toggle', { bubbles: false }));
    f.flush();
    assert.deepEqual(current(), ['#beta'], 'a details toggle triggers a re-measure');
    q('#gamma').setAttribute('data-top', '3300');
    f.w.dispatchEvent(new f.w.Event('resize')); f.flush();
    assert.deepEqual(current(), ['#gamma'], 'a resize triggers a re-measure');
  } finally { f.close(); }
});

test('chapter nav: the Chapters disclosure closes on a link, on Escape (focus returns to the summary) and on an outside click', { skip }, async () => {
  const f = await boot(STORY, [], storyPrepare({ scrollY: 0 }));
  try {
    const menu = f.d.querySelector('.cs-nav-chapters');
    menu.open = true;
    menu.querySelector('a').click();
    assert.equal(menu.open, false, 'choosing a chapter closes the menu');
    menu.open = true;
    menu.dispatchEvent(new f.w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    assert.equal(menu.open, false);
    assert.equal(f.d.activeElement, menu.querySelector('summary'), 'Escape returns focus to the summary');
    menu.open = true;
    f.d.querySelector('#hero-btn').click();
    assert.equal(menu.open, false, 'a click outside closes it');
  } finally { f.close(); }
});

test('chapter nav: harmless on fixtures with no nav; works without ResizeObserver', { skip }, async () => {
  const f = await boot('<main><section id="x">Only content</section></main>', [], storyPrepare());
  try { assert.equal(f.w.DLShared.chapterNav(), null); scrollTo(f, 500); } finally { f.close(); }
  const g = await boot(STORY, [], (w) => { storyPrepare({ scrollY: 1600 })(w); delete w.ResizeObserver; });
  try {
    assert.equal(g.d.querySelector('.cs-nav-progress i').style.transform, 'scaleX(0.5000)');
    scrollTo(g, 3200);
    assert.equal(g.d.querySelector('.cs-nav-progress i').style.transform, 'scaleX(1.0000)');
  } finally { g.close(); }
});

test('chapter nav: a body resize without a scroll refreshes the line; one frame at a time; the line itself is never observed', { skip }, async () => {
  const f = await boot(STORY, [], storyPrepare({ scrollY: 1600 }));
  try {
    const q = (s) => f.d.querySelector(s);
    const line = q('.cs-nav-progress i');
    assert.equal(line.style.transform, 'scaleX(0.5000)');
    const ros = f.w.__resizeObservers;
    assert.equal(ros.length, 1, 'exactly one ResizeObserver');
    assert.deepEqual([...ros[0].targets], [f.d.body], 'only the body is observed');
    f.w.__scrollHeight = 7200;
    const queued = f.w.__queue.size;
    ros[0].fire(); ros[0].fire();
    assert.equal(f.w.__queue.size, queued + 1, 'two resize callbacks schedule exactly one frame');
    f.flush();
    assert.equal(line.style.transform, 'scaleX(0.2500)');
  } finally { f.close(); }
});

test('reveals: targets enter when reached; restored scroll shows what is above; focus reveals a region; above-fold settles on the next frame', { skip }, async () => {
  const f = await boot(STORY, [], storyPrepare({ scrollY: 0 }));
  try {
    const q = (s) => f.d.querySelector(s);
    const io = revealObserver(f.w);
    assert.ok(io, 'a viewport observer watches the unrevealed targets');
    assert.equal(q('#r-past').classList.contains('in'), true, 'a target already scrolled past shows at once');
    assert.equal(q('#hero').classList.contains('in'), false);
    f.flush();
    assert.equal(q('#hero').classList.contains('in'), true, 'above-fold content is visible after one frame');
    assert.equal(q('#r-alpha').classList.contains('in'), false, 'a target below the fold waits for the viewport');
    io.fire([{ target: q('#r-alpha'), isIntersecting: true, boundingClientRect: q('#r-alpha').getBoundingClientRect() }]);
    assert.equal(q('#r-alpha').classList.contains('in'), true);
    assert.equal(io.targets.has(q('#r-alpha')), false, 'a revealed target is unobserved');
    f.w.__scrollY = 5000;
    io.fire([{ target: q('#r-beta'), isIntersecting: false, boundingClientRect: q('#r-beta').getBoundingClientRect() }]);
    assert.equal(q('#r-beta').classList.contains('in'), true, 'a target that ends up above the viewport is shown, never left invisible');
    q('#gamma-btn').focus();
    assert.equal(q('#r-gamma').classList.contains('in'), true, 'keyboard focus inside an unrevealed region reveals it');
    assert.doesNotThrow(() => f.flush(), 'no blanket timer is pending');
  } finally { f.close(); }
});

test('reveals: without an observer everything is visible at once; reduced motion at load or on change settles every reveal', { skip }, async () => {
  const none = await boot(STORY, [], storyPrepare({ scrollY: 0, observer: false }));
  try { assert.ok([...none.d.querySelectorAll('.cs-reveal')].every((el) => el.classList.contains('in'))); } finally { none.close(); }
  const f = await boot(STORY, [], storyPrepare({ scrollY: 0 }));
  try {
    f.flush();
    const io = revealObserver(f.w);
    assert.equal(f.d.querySelector('#r-gamma').classList.contains('in'), false);
    f.setReduced(true);
    assert.ok([...f.d.querySelectorAll('.cs-reveal')].every((el) => el.classList.contains('in')));
    assert.equal(io.disconnected, true, 'the observer is released');
    assert.equal(f.d.documentElement.classList.contains('reduce-motion'), true);
  } finally { f.close(); }
  const r = await boot(STORY, [], (w) => { storyPrepare({ scrollY: 0 })(w); w.matchMedia = (query) => ({ media: query, matches: /prefers-reduced-motion/.test(query), addEventListener() {}, addListener() {} }); });
  try {
    assert.ok([...r.d.querySelectorAll('.cs-reveal')].every((el) => el.classList.contains('in')), 'reduced motion at load: all content visible, no observer');
    assert.equal(revealObserver(r.w), undefined);
  } finally { r.close(); }
});

test('reveals: nothing is assessed behind the gate; lifting dl-locked starts the viewport assessment', { skip }, async () => {
  const f = await boot(STORY, [], storyPrepare({ scrollY: 0 }), 'dl-locked');
  try {
    const q = (s) => f.d.querySelector(s);
    f.flush();
    assert.equal(revealObserver(f.w), undefined, 'no reveal observer while the gate is up');
    assert.ok([...f.d.querySelectorAll('.cs-reveal')].every((el) => !el.classList.contains('in')));
    f.d.documentElement.classList.remove('dl-locked');
    await new Promise((resolve) => setImmediate(resolve));
    f.flush();
    assert.equal(q('#hero').classList.contains('in'), true, 'above-fold content settles when the gate lifts');
    const io = revealObserver(f.w);
    assert.ok(io && io.targets.has(q('#r-gamma')), 'the rest now waits for the viewport');
  } finally { f.close(); }
});

/* ======================================================================
   Films: the Ray light study and the Daylight gradient pivot
   ====================================================================== */
function mediaPrepare(reducedAtLoad, rejectPlay) {
  return (w) => {
    class FakeObserver {
      constructor(cb) { this.cb = cb; this.targets = new Set(); FakeObserver.instances.push(this); }
      observe(t) { this.targets.add(t); }
      unobserve(t) { this.targets.delete(t); }
      disconnect() { this.targets.clear(); }
      fire(entries) { this.cb(entries, this); }
    }
    FakeObserver.instances = [];
    w.IntersectionObserver = FakeObserver;
    w.__observers = FakeObserver.instances;
    w.__media = [];
    Object.defineProperty(w.document, 'hidden', { get: () => false, configurable: true });
    w.HTMLMediaElement.prototype.play = function () {
      if (rejectPlay) { w.__media.push('blocked'); return Promise.reject(new Error('Autoplay prevented')); }
      this.__paused = false; w.__media.push('play'); this.dispatchEvent(new w.Event('play')); return Promise.resolve();
    };
    w.HTMLMediaElement.prototype.pause = function () { const was = this.__paused; this.__paused = true; w.__media.push('pause'); if (was === false) { this.dispatchEvent(new w.Event('pause')); } };
    Object.defineProperty(w.HTMLMediaElement.prototype, 'paused', { get() { return this.__paused !== false; }, configurable: true });
    if (reducedAtLoad) { w.matchMedia = (query) => ({ media: query, matches: /prefers-reduced-motion/.test(query), addEventListener() {}, addListener() {} }); }
  };
}
async function filmFixture(page, selector, reducedAtLoad, rejectPlay) {
  const p = inert(page);
  const markup = p.d.querySelector(selector).outerHTML;
  p.close();
  return boot(markup, [], mediaPrepare(reducedAtLoad, rejectPlay));
}
const FILMS = [
  { page: 'daylight.html', selector: '#ray', video: 'dl-wave-video', source: 'images/daylight-cover-loop.mp4', poster: 'images/daylight-cover-poster.jpg' }
];

for (const film of FILMS) {
  test(film.page + ' film: original brand media, poster first, no autoplay, plays only when visible, an honest control, pauses offscreen and on a hidden tab', { skip }, async () => {
    const f = await filmFixture(film.page, film.selector, false);
    try {
      const q = (s) => f.d.querySelector(s);
      const video = q('#' + film.video), toggle = q('[data-video-toggle="' + film.video + '"]');
      assert.equal(f.d.querySelectorAll('video').length, 1, 'one film in the block');
      assert.equal(video.hasAttribute('autoplay'), false);
      assert.equal(video.getAttribute('preload'), 'metadata');
      assert.equal(video.getAttribute('poster'), film.poster);
      assert.ok(video.hasAttribute('muted') && video.hasAttribute('playsinline'));
      assert.ok(video.querySelector('source[src="' + film.source + '"]'), 'the original brand film, not generated media');
      assert.ok(!f.d.body.innerHTML.includes('ray-information-'), 'rejected media is not referenced');
      assert.ok(toggle.textContent.trim().length > 0, 'the control has visible text as well as a label');
      const io = f.w.__observers.find((o) => o.targets.has(video));
      assert.ok(io, 'the film is observed for visibility');
      assert.equal(f.w.__media.includes('play'), false, 'offscreen at start: never played');
      assert.equal(toggle.getAttribute('data-paused'), 'true');
      assert.equal(toggle.getAttribute('aria-label'), 'Play animation');
      io.fire([{ target: video, isIntersecting: true }]);
      assert.equal(f.w.__media[f.w.__media.length - 1], 'play', 'visible: plays');
      assert.equal(toggle.getAttribute('aria-label'), 'Pause animation');
      toggle.click();
      assert.equal(f.w.__media[f.w.__media.length - 1], 'pause', 'the control pauses');
      assert.equal(toggle.getAttribute('aria-label'), 'Play animation');
      io.fire([{ target: video, isIntersecting: false }]);
      io.fire([{ target: video, isIntersecting: true }]);
      assert.equal(f.w.__media[f.w.__media.length - 1], 'pause', 'a user pause holds through visibility changes');
      toggle.click();
      assert.equal(f.w.__media[f.w.__media.length - 1], 'play', 'play resumes on request');
      io.fire([{ target: video, isIntersecting: false }]);
      assert.equal(f.w.__media[f.w.__media.length - 1], 'pause', 'leaving the viewport pauses the film');
      io.fire([{ target: video, isIntersecting: true }]);
      Object.defineProperty(f.d, 'hidden', { get: () => true, configurable: true });
      f.d.dispatchEvent(new f.w.Event('visibilitychange'));
      assert.equal(f.w.__media[f.w.__media.length - 1], 'pause', 'a hidden tab pauses the film');
      assert.equal(toggle.getAttribute('aria-label'), 'Play animation');
    } finally { f.close(); }
  });

  test(film.page + ' film: reduced motion at load keeps the poster; a live change pauses; blocked playback leaves an honest Play control', { skip }, async () => {
    const r = await filmFixture(film.page, film.selector, true);
    try {
      const video = r.d.querySelector('#' + film.video), toggle = r.d.querySelector('[data-video-toggle="' + film.video + '"]');
      const io = r.w.__observers.find((o) => o.targets.has(video));
      io.fire([{ target: video, isIntersecting: true }]);
      assert.equal(r.w.__media.includes('play'), false, 'reduced motion at load: the poster stays, even when visible');
      assert.equal(toggle.getAttribute('aria-label'), 'Play animation');
      toggle.click();
      assert.equal(r.w.__media[r.w.__media.length - 1], 'play', 'an explicit play is still honored');
    } finally { r.close(); }
    const f = await filmFixture(film.page, film.selector, false);
    try {
      const video = f.d.querySelector('#' + film.video);
      const io = f.w.__observers.find((o) => o.targets.has(video));
      io.fire([{ target: video, isIntersecting: true }]);
      assert.equal(f.w.__media[f.w.__media.length - 1], 'play');
      f.setReduced(true);
      assert.equal(f.w.__media[f.w.__media.length - 1], 'pause', 'a live reduced-motion change pauses the film');
    } finally { f.close(); }
    const b = await filmFixture(film.page, film.selector, false, true);
    try {
      const video = b.d.querySelector('#' + film.video), toggle = b.d.querySelector('[data-video-toggle="' + film.video + '"]');
      const io = b.w.__observers.find((o) => o.targets.has(video));
      io.fire([{ target: video, isIntersecting: true }]);
      await Promise.resolve(); await Promise.resolve();
      assert.equal(video.paused, true);
      assert.equal(toggle.getAttribute('data-paused'), 'true');
      assert.equal(toggle.getAttribute('aria-label'), 'Play animation', 'an honest Play control when the browser blocks playback');
      toggle.click();
      await Promise.resolve(); await Promise.resolve();
      assert.equal(b.w.__media[b.w.__media.length - 1], 'blocked', 'the click asks the element to play again');
      assert.equal(toggle.getAttribute('aria-label'), 'Play animation');
    } finally { b.close(); }
  });
}
