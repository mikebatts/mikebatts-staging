/* Scene DOM/state checks. Ray uses its real page fragment; the retired non-Ray layout uses a synthetic controller fixture;
   there is no page navigation, gate submission or resource loading. Geometry
   and WAAPI are deliberately mocked to exercise lifecycle/cancellation, not
   to claim rendered layout or animation quality. */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
let jsdom;
for (const candidate of [process.env.JSDOM_PATH, 'jsdom', '/tmp/daylight-ray-qa-20260905/node_modules/jsdom'].filter(Boolean)) {
  try { jsdom = require(candidate); break; } catch (e) { /* try the next installed location */ }
}
const skip = jsdom ? false : 'jsdom not found (set JSDOM_PATH); scene DOM checks skipped';

function fragment(type) {
  // The Daylight page retired this abstract scene. Keep the generic controller's
  // cancellation/lifecycle contract covered without asserting obsolete page UI.
  if (type === 'daylight') return `<figure data-product-scene="daylight" data-state="0"><div data-scene-controls hidden><button data-scene-choice="0" aria-pressed="true">Separate</button><button data-scene-choice="1" aria-pressed="false">Shared</button></div><div data-scene-stage><article data-scene-object>Orchard House: Agreement and documents</article><article data-scene-object>Uploaded to the project</article><article class="project-requirement" data-scene-object><span class="project-open">Needs review</span> Owner Operations Next step</article></div><p data-scene-status role="status"></p><figcaption>Reconstructed sample controller fixture</figcaption></figure>`;
  // The combined Daylight page carries the Ray scene; select it by type, not
  // by position, so no other figure can stand in for it.
  const dom = new jsdom.JSDOM(read('daylight.html'));
  const markup = dom.window.document.querySelector('[data-product-scene="ray"]').outerHTML;
  dom.window.close();
  return markup;
}

async function fixture(type, options = {}) {
  const dom = new jsdom.JSDOM('<!doctype html><html><body>' + fragment(type) + '</body></html>', { runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window, d = w.document;
  await new Promise((resolve) => w.addEventListener('load', resolve, { once: true }));
  if (options.locked) { d.documentElement.classList.add('dl-locked'); }
  let hidden = !!options.hidden, far = false, extraTextHeight = 0;
  Object.defineProperty(d, 'hidden', { get: () => hidden });
  w.innerWidth = options.phone ? 390 : 1200;
  w.innerHeight = 900;
  const queries = new Map(), observers = [], resizers = [], animations = [], frames = new Map();
  let frameId = 0;
  w.setTimeout = () => { throw new Error('Scenes should not create a timer'); };
  w.requestAnimationFrame = (callback) => { const id = ++frameId; frames.set(id, callback); return id; };
  w.cancelAnimationFrame = (id) => frames.delete(id);
  w.fetch = w.open = () => { throw new Error('Scenes must not fetch or open a window'); };
  w.matchMedia = (query) => {
    if (!queries.has(query)) {
      const listeners = [];
      queries.set(query, { media: query, matches: /max-width/.test(query) ? !!options.phone : !!options.reduced, addEventListener: (_, cb) => listeners.push(cb), listeners });
    }
    return queries.get(query);
  };
  w.IntersectionObserver = class {
    constructor(callback) { this.callback = callback; this.targets = []; observers.push(this); }
    observe(target) { this.targets.push(target); }
    disconnect() {}
    unobserve() {}
  };
  w.ResizeObserver = class {
    constructor(callback) { this.callback = callback; this.targets = []; resizers.push(this); }
    observe(target) { this.targets.push(target); }
    disconnect() {}
  };
  const scene = d.querySelector('[data-product-scene]');
  const stage = scene.querySelector('[data-scene-stage]');
  const objects = [...scene.querySelectorAll('[data-scene-object]')];
  const index = () => Number(scene.getAttribute('data-state'));
  const isPhone = () => w.innerWidth < 760;
  const rect = (left, top, width, height) => ({ left, top, width, height, right: left + width, bottom: top + height, x: left, y: top });

  // Synthetic layouts cover meaningful displacement and different widths.
  // No result derived from these coordinates is presented as browser QA.
  function layout(node) {
    const state = index();
    const top = far ? 1600 : 160;
    if (node === stage) {
      const base = isPhone() ? 650 : [520, 570, 540][state];
      return rect(40, top, isPhone() ? 310 : 1040, Math.max(base + extraTextHeight, parseFloat(stage.style.minHeight) || 0));
    }
    const objectIndex = objects.indexOf(node);
    if (isPhone()) {
      const contextHeight = type === 'ray' ? Math.max([76, 68, 90][state], parseFloat(objects[0].style.minHeight) || 0) : 140;
      return rect(40, top + 65 + (objectIndex ? contextHeight + 160 * (objectIndex - 1) : 0), 310, (objectIndex ? 330 : contextHeight) + extraTextHeight);
    }
    const positions = type === 'ray'
      ? [[[70, 240, 240, 100], [540, 240, 500, 370]], [[70, 240, 950, 45], [140, 310, 850, 380]], [[70, 240, 220, 100], [400, 270, 540, 390]]]
      : [[[70, 240, 430, 170], [650, 270, 390, 140], [390, 440, 650, 190]], [[70, 270, 410, 320], [510, 270, 530, 150], [510, 420, 530, 190]]];
    const p = positions[state][objectIndex];
    return rect(p[0], p[1] + (far ? 1440 : 0), p[2], p[3] + extraTextHeight);
  }
  for (const node of [stage, ...objects]) {
    node.getBoundingClientRect = () => {
      const r = layout(node);
      const animation = node.__animation;
      if (animation && !animation.cancelled && !animation.finished) {
        const transform = animation.keyframes[0].transform || '';
        const match = transform.match(/translate\(([-.\d]+)px,([-.\d]+)px\)/);
        if (match) { return rect(r.left + Number(match[1]) / 2, r.top + Number(match[2]) / 2, r.width, r.height); }
      }
      return r;
    };
    Object.defineProperty(node, 'offsetWidth', { get: () => layout(node).width });
    Object.defineProperty(node, 'offsetHeight', { get: () => layout(node).height });
    node.animate = (keyframes, settings) => {
      const animation = { node, keyframes, settings, cancelled: false, finished: false, onfinish: null,
        cancel() { this.cancelled = true; },
        finish() { this.finished = true; if (this.onfinish) { this.onfinish(); } }
      };
      node.__animation = animation;
      animations.push(animation);
      return animation;
    };
  }
  if (options.noAnimation) { objects.forEach((node) => { node.animate = undefined; }); }
  if (options.noObserver) { delete w.IntersectionObserver; }
  // Use the actual read-only motion and unlock integration, not a fake API.
  w.eval(read('js/dl-shared.js'));
  w.eval(read('js/product-scenes.js'));
  const flush = () => {
    let limit = 20;
    while (frames.size) {
      assert.ok(limit-- > 0, 'layout correction must terminate');
      const pending = [...frames.values()]; frames.clear(); pending.forEach((callback) => callback());
    }
  };
  const media = (pattern, value) => {
    for (const q of queries.values()) { if (pattern.test(q.media)) { q.matches = value; q.listeners.forEach((cb) => cb({ matches: value })); } }
  };
  return {
    w, d, scene, stage, objects, animations, frames, flush,
    buttons: [...scene.querySelectorAll('[data-scene-choice]')],
    status: scene.querySelector('[data-scene-status]'),
    state: index,
    live: () => animations.filter((animation) => !animation.cancelled && !animation.finished),
    exposure(on = true) {
      far = !on;
      for (const observer of observers) {
        if (observer.targets.includes(stage)) { observer.callback([{ target: stage, isIntersecting: on, intersectionRatio: on ? 0.75 : 0, boundingClientRect: stage.getBoundingClientRect() }]); }
      }
    },
    reduced(value) { media(/prefers-reduced-motion/, value); },
    phone(value) { w.innerWidth = value ? 390 : 1200; media(/max-width/, value); },
    hidden(value) { hidden = value; d.dispatchEvent(new w.Event('visibilitychange')); },
    resizeText() { extraTextHeight += 30; resizers.forEach((observer) => observer.callback([])); },
    async unlock() { d.documentElement.classList.remove('dl-locked'); await Promise.resolve(); },
    close() { dom.window.close(); }
  };
}

test('Daylight: the combined page carries only the Ray scene; the obsolete abstract Daylight scene stays retired', { skip }, () => {
  const dom = new jsdom.JSDOM(read('daylight.html'));
  try {
    const d = dom.window.document;
    assert.deepEqual([...d.querySelectorAll('[data-product-scene]')].map((el) => el.getAttribute('data-product-scene')), ['ray']);
    assert.equal(d.querySelectorAll('[data-scene-controls]').length, 1);
    assert.equal(d.querySelectorAll('[data-scene-choice]').length, 3);
    assert.ok(d.querySelector('#continuity [data-product-scene="ray"]'), 'the scene lives in the Ray workspace chapter');
  }
  finally { dom.window.close(); }
});

for (const type of ['ray', 'daylight']) {
  test((type === 'daylight' ? 'Synthetic non-Ray controller fixture' : 'Ray scene') + ': no-JS record is complete and controls start hidden', { skip }, () => {
    const dom = new jsdom.JSDOM(fragment(type));
    try {
      const scene = dom.window.document.querySelector('[data-product-scene]');
      assert.equal(scene.getAttribute('data-state'), '0');
      assert.equal(scene.querySelector('[data-scene-controls]').hidden, true);
      assert.equal(scene.querySelector('[data-scene-status]').textContent, '');
      assert.match(scene.textContent, /Orchard House/);
      assert.match(scene.querySelector('figcaption').textContent, /Reconstructed sample/);
      assert.equal(scene.querySelectorAll('input, textarea, select, [role="tab"]').length, 0);
      if (type === 'ray') {
        assert.equal(scene.querySelectorAll('.ray-convo').length, 1);
        assert.match(scene.querySelector('.ray-convo-a').textContent, /Title verification still needs review/);
        assert.match(scene.querySelector('.ray-convo-source').textContent, /Origination guidance/);
        assert.match(scene.querySelector('.ray-convo-draft').textContent, /Saved draft/);
        assert.equal(scene.querySelectorAll('.ray-convo button').length, 3, 'only the three real window controls are interactive');
        assert.equal(scene.querySelectorAll('.ray-convo [data-scene-controls] button').length, 3);
        assert.equal(scene.querySelectorAll('.ray-convo a, .ray-convo [tabindex]').length, 0);
      } else {
        assert.equal(scene.querySelectorAll('[data-scene-object]').length, 3);
        assert.match(scene.textContent, /Agreement and documents/);
        assert.match(scene.textContent, /Uploaded to the project/);
        assert.match(scene.querySelector('.project-requirement').textContent, /Needs review.*Owner.*Operations.*Next step/s);
      }
    } finally { dom.window.close(); }
  });

  test((type === 'daylight' ? 'Synthetic non-Ray controller fixture' : 'Ray scene') + ': every native control changes only the intended layout, preserves objects and focus', { skip }, async () => {
    const f = await fixture(type);
    try {
      const originalObjects = [...f.objects];
      const originalText = type === 'ray' ? f.scene.querySelector('.ray-convo').textContent : f.objects.map((object) => object.textContent).join('|');
      assert.equal(f.state(), 0);
      assert.equal(f.scene.querySelector('[data-scene-controls]').hidden, false);
      assert.equal(f.animations.length, 0, 'no motion on initialization alone');
      assert.equal(f.status.textContent, '');
      for (const index of [...f.buttons.keys()].reverse()) {
        const button = f.buttons[index];
        button.focus(); button.click();
        assert.equal(f.state(), index);
        assert.equal(f.d.activeElement, button);
        assert.deepEqual(f.buttons.map((b) => b.getAttribute('aria-pressed')), f.buttons.map((_, i) => String(i === index)));
        assert.deepEqual([...f.scene.querySelectorAll('[data-scene-object]')], originalObjects);
        assert.equal(type === 'ray' ? f.scene.querySelector('.ray-convo').textContent : f.objects.map((object) => object.textContent).join('|'), originalText);
        if (type === 'daylight') { assert.match(f.scene.querySelector('.project-open').textContent, /Needs review/); }
        else { assert.equal(f.scene.querySelector('[data-ray-context]').textContent, 'Project', 'changing desktop view does not navigate the portal'); }
        const before = f.animations.length, liveText = f.status.textContent;
        button.click(); button.click();
        assert.equal(f.animations.length, before, 'repeated selection is idempotent');
        assert.equal(f.status.textContent, liveText, 'no repeated live-region mutation');
      }
      assert.match(f.status.textContent, type === 'ray' ? /Same answer, source and saved draft/ : /Title review is still open/);
    } finally { f.close(); }
  });

  test((type === 'daylight' ? 'Synthetic non-Ray controller fixture' : 'Ray scene') + ': rapid changes cancel superseded effects and settle on the last selection', { skip }, async () => {
    const f = await fixture(type);
    try {
      f.buttons[1].click();
      const first = [...f.live()];
      assert.ok(first.length, 'a real layout displacement creates a bounded animation');
      f.buttons[0].dispatchEvent(new f.w.Event('pointerdown', { bubbles: true }));
      assert.ok(first.every((animation) => !animation.cancelled), 'a rapid direct tap keeps the visual position available for retargeting');
      f.buttons[0].click();
      assert.ok(first.every((animation) => animation.cancelled));
      for (let i = 0; i < 12; i++) { f.buttons[i % f.buttons.length].click(); }
      assert.equal(f.state(), 11 % f.buttons.length);
      assert.ok(f.live().length <= f.objects.length, 'one animation per existing object at most');
      for (const animation of f.animations) {
        assert.ok(animation.settings.duration <= 480);
        assert.ok(animation.keyframes.every((frame) => !/scale/.test(frame.transform || '')));
      }
      f.live().forEach((animation) => animation.finish());
      assert.equal(f.live().length, 0);
      assert.equal(f.frames.size, 0, 'no timer or continuous animation loop');
    } finally { f.close(); }
  });

  test((type === 'daylight' ? 'Synthetic non-Ray controller fixture' : 'Ray scene') + ': a short introduction happens once on exposure and never announces', { skip }, async () => {
    const f = await fixture(type);
    try {
      assert.equal(f.state(), 0);
      f.exposure();
      assert.equal(f.state(), 1);
      assert.equal(f.status.textContent, '', 'automatic movement must not announce');
      assert.ok(f.live().length);
      f.exposure(false);
      assert.equal(f.live().length, 0, 'offscreen cancels motion');
      const count = f.animations.length;
      f.exposure();
      assert.equal(f.animations.length, count, 'scrolling back never replays');
    } finally { f.close(); }
  });

  test((type === 'daylight' ? 'Synthetic non-Ray controller fixture' : 'Ray scene') + ': live reduced motion cancels immediately and direct controls still work', { skip }, async () => {
    const f = await fixture(type);
    try {
      f.buttons[1].click();
      assert.ok(f.live().length);
      f.reduced(true);
      assert.equal(f.live().length, 0);
      const count = f.animations.length;
      f.buttons[0].click();
      assert.equal(f.state(), 0);
      assert.equal(f.animations.length, count);
      f.reduced(false);
      f.exposure();
      assert.equal(f.state(), 0, 'returning to normal motion does not restart the introduction');
      f.buttons[1].click();
      assert.ok(f.live().length, 'later direct actions may animate again');
    } finally { f.close(); }
  });
}

test('Ray: phone controls are portal pages, state maps both ways, and the same source and draft survive', { skip }, async () => {
  const f = await fixture('ray', { phone: true });
  try {
    const answer = f.scene.querySelector('.ray-convo');
    const source = f.scene.querySelector('.ray-convo-source');
    const draft = f.scene.querySelector('.ray-convo-draft');
    const labels = ['Project', 'Documents', 'Activity'];
    assert.deepEqual(f.buttons.map((button) => button.textContent), labels);
    assert.match(f.scene.querySelector('[data-scene-controls]').getAttribute('aria-label'), /Portal page/);
    assert.equal(f.stage.style.minHeight, '', 'the phone stage is intrinsically sized');
    for (let i = 0; i < 3; i++) {
      f.buttons[i].focus(); f.buttons[i].click();
      assert.equal(f.scene.querySelector('[data-ray-context]').textContent, labels[i]);
      assert.equal(f.scene.querySelector('.ray-convo'), answer);
      assert.equal(f.scene.querySelector('.ray-convo-source'), source);
      assert.equal(f.scene.querySelector('.ray-convo-draft'), draft);
      if (i) { assert.match(f.status.textContent, new RegExp(labels[i])); }
    }
    assert.match(f.scene.querySelector('[data-ray-context-detail]').textContent, /Title review requested.*Operations/);
    f.phone(false);
    assert.equal(f.state(), 2);
    assert.deepEqual(f.buttons.map((button) => button.textContent), ['Drawer', 'Full page', 'Separate window']);
    assert.equal(f.buttons[2].getAttribute('aria-pressed'), 'true');
    assert.equal(f.d.activeElement, f.buttons[2]);
    assert.equal(f.status.textContent, '', 'a breakpoint does not retain a stale announcement with the wrong view semantics');
    assert.equal(f.live().length, 0, 'breakpoint changes settle pending effects');
    f.phone(true);
    assert.equal(f.state(), 2);
    assert.equal(f.buttons[2].textContent, 'Activity');
    assert.equal(f.stage.style.minHeight, '');
    assert.equal(f.scene.querySelector('.ray-convo'), answer);
  } finally { f.close(); }
});

for (const guard of ['locked', 'hidden', 'reduced', 'pointer', 'focus', 'manual']) {
  test('Scene introduction respects ' + guard + ' before viewport exposure', { skip }, async () => {
    const f = await fixture('ray', { [guard]: true });
    try {
      if (guard === 'pointer') { f.scene.dispatchEvent(new f.w.Event('pointerenter')); }
      if (guard === 'focus') { f.buttons[0].focus(); }
      if (guard === 'manual') { f.buttons[0].click(); }
      f.exposure();
      assert.equal(f.state(), 0);
      assert.equal(f.animations.length, 0);
      assert.equal(f.status.textContent, '');
      if (guard === 'locked') {
        assert.ok(f.d.documentElement.classList.contains('dl-locked'), 'scene code does not unlock anything');
        await f.unlock();
        assert.equal(f.state(), 1, 'the actual shared unlock callback may introduce an already visible scene');
      }
    } finally { f.close(); }
  });
}

test('Scenes cancel on hidden tab, pagehide and local text resize without a stale transform', { skip }, async () => {
  const f = await fixture('daylight');
  try {
    f.buttons[1].click(); f.hidden(true);
    assert.equal(f.live().length, 0);
    f.hidden(false); f.buttons[0].click();
    f.w.dispatchEvent(new f.w.Event('pagehide'));
    assert.equal(f.live().length, 0);
    f.w.dispatchEvent(new f.w.Event('pageshow'));
    f.buttons[1].click();
    assert.ok(f.live().length);
    f.resizeText();
    assert.ok(f.frames.size > 0);
    f.flush();
    assert.equal(f.live().length, 0);
    assert.equal(f.state(), 1);
    assert.equal(f.frames.size, 0);
    f.phone(true);
    assert.equal(f.stage.style.minHeight, '', 'phone project records retain natural height');
  } finally { f.close(); }
});

test('A focused reader interrupts the automatic move, and offscreen correction catches up on return', { skip }, async () => {
  const f = await fixture('ray');
  try {
    f.exposure();
    assert.ok(f.live().length);
    f.buttons[1].focus();
    assert.equal(f.live().length, 0);
    const height = parseFloat(f.stage.style.minHeight);
    f.exposure(false);
    f.resizeText();
    assert.ok(f.frames.size);
    f.exposure(false);
    assert.equal(f.frames.size, 0, 'offscreen discards pending layout work');
    f.exposure();
    assert.ok(parseFloat(f.stage.style.minHeight) > height, 'returning to view remeasures changed text');
    assert.equal(f.live().length, 0, 'an engaged reader never gets an automatic replay');
  } finally { f.close(); }
});

test('Without WAAPI or IntersectionObserver, controls still expose complete static states', { skip }, async () => {
  const f = await fixture('ray', { noAnimation: true, noObserver: true });
  try {
    assert.equal(f.state(), 0);
    f.buttons[2].click();
    assert.equal(f.state(), 2);
    assert.match(f.status.textContent, /Separate window/);
    assert.equal(f.animations.length, 0);
    assert.match(f.scene.querySelector('.ray-convo').textContent, /Title verification still needs review/);
  } finally { f.close(); }
});
