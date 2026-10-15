/* Tests for js/ray-return.js, the small return-position handler on the
   combined daylight.html (v2: also restores a fragment after the gate lifts).
   Run: node --test tests/*.test.js. Fixture markup only, jsdom, a mocked
   scrollTo; the gate is represented by the html class alone and its script
   never runs. Skips with a message when jsdom is unavailable. */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

function findJsdom() {
  const candidates = [process.env.JSDOM_PATH, 'jsdom', '/tmp/daylight-ray-qa-20260905/node_modules/jsdom'].filter(Boolean);
  for (const c of candidates) { try { return require(c); } catch (e) { /* next */ } }
  return null;
}
const jsdom = findJsdom();
const skip = jsdom ? false : 'jsdom not found (set JSDOM_PATH); return-script tests skipped';
const KEY = 'ray-demo-return-v2';
const OLD_KEY = 'ray-demo-return-v1';
const MARKUP = '<main><p style="height:3000px">Article</p><section id="sheets">Sheets</section><a id="try" class="cs-btn ray-try" href="ray-demo.html" data-ray-demo>Try Ray</a><a id="other" href="index.html">Elsewhere</a></main>';

async function boot(options) {
  options = options || {};
  const { JSDOM } = jsdom;
  const dom = new JSDOM('<!doctype html><html' + (options.locked ? ' class="dl-locked"' : '') + '><body>' + MARKUP + '</body></html>', Object.assign({ runScripts: 'outside-only', url: 'http://localhost/daylight.html' + (options.hash || '') }, options.referrer ? { referrer: options.referrer } : {}));
  const w = dom.window;
  await new Promise((resolve) => w.addEventListener('load', resolve, { once: true }));
  const scrolls = [];
  w.scrollTo = (x, y) => { scrolls.push([x, y]); };
  w.Element.prototype.scrollIntoView = function (opts) { scrolls.push(['into', this.id, opts && opts.block, w.document.documentElement.style.scrollBehavior]); };
  Object.defineProperty(w, 'pageYOffset', { get: () => options.y || 0, configurable: true });
  const timers = [];
  w.setTimeout = (fn) => { timers.push(fn); return timers.length; };
  if (options.marker !== undefined) { w.sessionStorage.setItem(KEY, options.marker); }
  if (options.prepare) { options.prepare(w); }
  w.eval(read('js/ray-return.js'));
  const runTimers = () => { while (timers.length) { timers.shift()(); } };
  return { w, d: w.document, scrolls, runTimers, close: () => setTimeout(() => w.close(), 10) };
}

test('following a marked Try Ray link stores the article position for this tab; other links do not', { skip }, async () => {
  const f = await boot({ y: 1440 });
  try {
    f.d.getElementById('other').dispatchEvent(new f.w.MouseEvent('click', { bubbles: true, cancelable: true }));
    assert.equal(f.w.sessionStorage.getItem(KEY), null, 'an unmarked link stores nothing');
    f.d.getElementById('try').dispatchEvent(new f.w.MouseEvent('click', { bubbles: true, cancelable: true }));
    const m = JSON.parse(f.w.sessionStorage.getItem(KEY));
    assert.equal(m.y, 1440);
    assert.ok(Math.abs(Date.now() - m.t) < 5000);
    assert.equal(f.w.sessionStorage.getItem('dl-unlocked'), null, 'the gate flag is never touched');
    assert.deepEqual(f.scrolls, [], 'nothing scrolls on the way out');
  } finally { f.close(); }
});

test('arriving from the demo restores the stored position once, without smooth scrolling, and removes the marker', { skip }, async () => {
  const marker = JSON.stringify({ y: 1440, t: Date.now() - 1000 });
  const f = await boot({ marker, referrer: 'http://localhost/ray-demo.html' });
  try {
    assert.deepEqual(f.scrolls, [[0, 1440]], 'restored to the stored position');
    assert.equal(f.w.sessionStorage.getItem(KEY), null, 'the marker is consumed');
    assert.equal(f.d.documentElement.style.scrollBehavior, '', 'the smooth-scroll override is put back');
  } finally { f.close(); }
});

test('a stale, foreign, malformed or zero marker restores nothing; a persisted cache restore drops the marker', { skip }, async () => {
  for (const [marker, referrer, why] of [
    [JSON.stringify({ y: 900, t: Date.now() - 31 * 60 * 1000 }), 'http://localhost/ray-demo.html', 'older than thirty minutes'],
    [JSON.stringify({ y: 900, t: Date.now() }), 'http://localhost/index.html', 'came from somewhere other than the demo'],
    ['{broken', 'http://localhost/ray-demo.html', 'malformed'],
    [JSON.stringify({ y: 'far', t: Date.now() }), 'http://localhost/ray-demo.html', 'wrong shape'],
    [JSON.stringify({ y: 0, t: Date.now() }), 'http://localhost/ray-demo.html', 'top of the page']
  ]) {
    const f = await boot({ marker, referrer });
    try {
      assert.deepEqual(f.scrolls, [], why);
      assert.equal(f.w.sessionStorage.getItem(KEY), null, 'the marker is always consumed: ' + why);
    } finally { f.close(); }
  }
  const g = await boot({ y: 200 });
  try {
    g.d.getElementById('try').dispatchEvent(new g.w.MouseEvent('click', { bubbles: true, cancelable: true }));
    assert.ok(g.w.sessionStorage.getItem(KEY));
    const ev = new g.w.Event('pageshow');
    Object.defineProperty(ev, 'persisted', { value: true });
    g.w.dispatchEvent(ev);
    assert.equal(g.w.sessionStorage.getItem(KEY), null, 'a back-forward cache restore keeps the browser position and drops the marker');
    assert.deepEqual(g.scrolls, []);
  } finally { g.close(); }
});

test('a v1 position left by the former Ray page is ignored; behind the gate a fragment still wins', { skip }, async () => {
  const old = JSON.stringify({ y: 1440, t: Date.now() - 1000 });
  const f = await boot({ referrer: 'http://localhost/ray-demo.html', prepare: (w) => { w.sessionStorage.setItem(OLD_KEY, old); } });
  try {
    assert.deepEqual(f.scrolls, [], 'an old-layout coordinate is never applied to the combined page');
    assert.equal(f.w.sessionStorage.getItem(KEY), null);
  } finally { f.close(); }
  const g = await boot({ referrer: 'http://localhost/ray-demo.html', hash: '#sheets', locked: true, prepare: (w) => { w.sessionStorage.setItem(OLD_KEY, old); } });
  try {
    g.d.documentElement.classList.remove('dl-locked');
    await new Promise((resolve) => setImmediate(resolve));
    g.runTimers();
    assert.deepEqual(g.scrolls, [['into', 'sheets', 'start', 'auto']], 'the fragment is honoured; the old coordinate is never used');
  } finally { g.close(); }
});

test('behind the gate the position is restored only after the gate lifts, after its own scroll to the top', { skip }, async () => {
  const marker = JSON.stringify({ y: 2100, t: Date.now() });
  const f = await boot({ marker, referrer: 'http://localhost/ray-demo.html', locked: true });
  try {
    assert.deepEqual(f.scrolls, [], 'nothing moves while the gate is up');
    assert.equal(f.w.sessionStorage.getItem(KEY), null, 'the marker is consumed at once so a later visit cannot replay it');
    f.d.documentElement.classList.remove('dl-locked');
    f.w.scrollTo(0, 0);
    await new Promise((resolve) => setImmediate(resolve));
    f.runTimers();
    assert.deepEqual(f.scrolls, [[0, 0], [0, 2100]], 'the gate scrolls to the top, then the article position is restored');
  } finally { f.close(); }
});

test('behind the gate, a deep link with no stored position lands on its fragment right after the gate lifts', { skip }, async () => {
  const f = await boot({ hash: '#sheets', locked: true });
  try {
    assert.deepEqual(f.scrolls, [], 'nothing moves while the gate is up');
    f.d.documentElement.classList.remove('dl-locked');
    f.w.scrollTo(0, 0);
    await new Promise((resolve) => setImmediate(resolve));
    f.runTimers();
    assert.deepEqual(f.scrolls, [[0, 0], ['into', 'sheets', 'start', 'auto']], 'the gate scrolls to the top, then the fragment target is brought into view instantly');
    assert.equal(f.d.documentElement.style.scrollBehavior, '', 'smooth scrolling is put back');
    assert.equal(f.w.location.hash, '#sheets', 'the URL is not rewritten');
  } finally { f.close(); }
  for (const [hash, why] of [['#missing', 'an unknown fragment'], ['', 'no fragment']]) {
    const g = await boot({ hash, locked: true });
    try {
      g.d.documentElement.classList.remove('dl-locked');
      await new Promise((resolve) => setImmediate(resolve));
      g.runTimers();
      assert.deepEqual(g.scrolls, [], why + ' moves nothing');
    } finally { g.close(); }
  }
  const open = await boot({ hash: '#sheets' });
  try { assert.deepEqual(open.scrolls, [], 'without the gate the browser handles the fragment itself'); } finally { open.close(); }
});

test('a stored demo position wins over the fragment, and is put back once on load if the browser applies the fragment later', { skip }, async () => {
  const marker = JSON.stringify({ y: 2100, t: Date.now() });
  const f = await boot({ marker, referrer: 'http://localhost/ray-demo.html', hash: '#ray', locked: true });
  try {
    f.d.documentElement.classList.remove('dl-locked');
    await new Promise((resolve) => setImmediate(resolve));
    f.runTimers();
    assert.deepEqual(f.scrolls, [[0, 2100]], 'behind the gate: the stored position, never the fragment');
  } finally { f.close(); }
  /* a page still loading: restore on DOMContentLoaded, then hold on load */
  const { JSDOM } = jsdom;
  const dom = new JSDOM('<!doctype html><html><body>' + MARKUP + '</body></html>', { runScripts: 'outside-only', url: 'http://localhost/daylight.html#ray', referrer: 'http://localhost/ray-demo.html' });
  const w = dom.window, scrolls = [];
  let y = 0;
  Object.defineProperty(w, 'pageYOffset', { get: () => y, configurable: true });
  w.scrollTo = (x, to) => { scrolls.push(to); y = to; };
  w.sessionStorage.setItem(KEY, JSON.stringify({ y: 1800, t: Date.now() }));
  Object.defineProperty(w.document, 'readyState', { get: () => 'loading', configurable: true });
  w.eval(read('js/ray-return.js'));
  w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
  assert.deepEqual(scrolls, [1800]);
  y = 640; /* the browser applies #ray afterwards */
  w.dispatchEvent(new w.Event('load'));
  assert.deepEqual(scrolls, [1800, 1800], 'the stored position is put back once on load');
  w.dispatchEvent(new w.Event('load'));
  assert.deepEqual(scrolls, [1800, 1800], 'only once');
  w.close();
  const dom2 = new JSDOM('<!doctype html><html><body>' + MARKUP + '</body></html>', { runScripts: 'outside-only', url: 'http://localhost/daylight.html#ray', referrer: 'http://localhost/ray-demo.html' });
  const w2 = dom2.window, scrolls2 = [];
  let y2 = 0;
  Object.defineProperty(w2, 'pageYOffset', { get: () => y2, configurable: true });
  w2.scrollTo = (x, to) => { scrolls2.push(to); y2 = to; };
  w2.sessionStorage.setItem(KEY, JSON.stringify({ y: 1800, t: Date.now() }));
  Object.defineProperty(w2.document, 'readyState', { get: () => 'loading', configurable: true });
  w2.eval(read('js/ray-return.js'));
  w2.document.dispatchEvent(new w2.Event('DOMContentLoaded'));
  w2.dispatchEvent(new w2.Event('wheel'));
  y2 = 400;
  w2.dispatchEvent(new w2.Event('load'));
  assert.deepEqual(scrolls2, [1800], 'a reader who has scrolled is never moved back');
  w2.close();
  /* Chrome animates the fragment from around load: a scroll away from the
     stored position after load is put back once */
  const dom3 = new JSDOM('<!doctype html><html><body>' + MARKUP + '</body></html>', { runScripts: 'outside-only', url: 'http://localhost/daylight.html#ray', referrer: 'http://localhost/ray-demo.html' });
  const w3 = dom3.window, scrolls3 = [];
  let y3 = 0;
  Object.defineProperty(w3, 'pageYOffset', { get: () => y3, configurable: true });
  w3.scrollTo = (x, to) => { scrolls3.push(to); y3 = to; };
  w3.sessionStorage.setItem(KEY, JSON.stringify({ y: 1800, t: Date.now() }));
  Object.defineProperty(w3.document, 'readyState', { get: () => 'loading', configurable: true });
  w3.eval(read('js/ray-return.js'));
  w3.document.dispatchEvent(new w3.Event('DOMContentLoaded'));
  y3 = 1798;
  w3.dispatchEvent(new w3.Event('load'));
  assert.deepEqual(scrolls3, [1800], 'still within a few pixels at load: nothing to do yet');
  y3 = 1790;
  w3.dispatchEvent(new w3.Event('scroll'));
  assert.deepEqual(scrolls3, [1800, 1800], 'the animated fragment scroll is cancelled and the position put back');
  y3 = 1500;
  w3.dispatchEvent(new w3.Event('scroll'));
  assert.deepEqual(scrolls3, [1800, 1800], 'only once');
  w3.close();
});

test('the script is harmless with storage blocked and is loaded only by daylight.html', { skip }, async () => {
  const f = await boot({ prepare: (w) => { Object.defineProperty(w, 'sessionStorage', { get() { throw new Error('blocked'); }, configurable: true }); } });
  try {
    f.d.getElementById('try').dispatchEvent(new f.w.MouseEvent('click', { bubbles: true, cancelable: true }));
    assert.deepEqual(f.scrolls, []);
  } finally { f.close(); }
  assert.match(read('daylight.html'), /js\/ray-return\.js\?v=3/);
  assert.doesNotMatch(read('ray.html'), /ray-return/);
  assert.doesNotMatch(read('ray-demo.html'), /ray-return/);
  assert.doesNotMatch(read('index.html'), /ray-return|ray-demo/);
});
