/* The same product objects, two ways to inspect them. No network, storage,
   simulated chat or window opening. Text is complete before this runs. */
(function () {
  'use strict';
  var root = document.documentElement;
  var shared = window.DLShared;
  var slice = function (nodes) { return Array.prototype.slice.call(nodes || []); };
  var phoneQuery = window.matchMedia ? window.matchMedia('(max-width: 759px)') : null;
  var motionQuery = !shared && window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var scenes = [];
  var away = false;

  function phone() { return phoneQuery ? phoneQuery.matches : window.innerWidth < 760; }
  function reduced() { return shared ? shared.reduced() : !!(motionQuery && motionQuery.matches); }
  function locked() { return root.classList.contains('dl-locked'); }
  function listen(query, callback) {
    if (!query) { return; }
    if (query.addEventListener) { query.addEventListener('change', callback); }
    else if (query.addListener) { query.addListener(callback); }
  }
  function inViewport(node) {
    var r = node.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight;
  }

  function setup(scene) {
    if (scene.getAttribute('data-scene-ready') === 'true') { return null; }
    var stage = scene.querySelector('[data-scene-stage]');
    var controls = scene.querySelector('[data-scene-controls]');
    var buttons = slice(scene.querySelectorAll('[data-scene-choice]'));
    var objects = slice(scene.querySelectorAll('[data-scene-object]'));
    var status = scene.querySelector('[data-scene-status]');
    if (!stage || !controls || !buttons.length || !objects.length) { return null; }
    var isRay = scene.getAttribute('data-product-scene') === 'ray';
    var context = scene.querySelector('.ray-portal-context');
    var contextLabel = scene.querySelector('[data-ray-context]');
    var contextDetail = scene.querySelector('[data-ray-context-detail]');
    var detailText = contextDetail ? contextDetail.firstChild : null;
    var detailStatus = contextDetail ? contextDetail.querySelector('span') : null;
    var selected = 0;
    var active = [];
    var automatic = false;
    var layoutPhone = phone();
    var userEngaged = false;
    var pointerInside = false;
    var introUsed = reduced();
    var exposed = false;
    var correction = 0;
    var signature = '';
    var contextNames = ['Project', 'Documents', 'Activity'];
    var viewNames = ['Drawer', 'Full page', 'Separate window'];
    var contextDetails = [['Title verification ', 'Needs review'], ['utility-bill.pdf ', 'Uploaded'], ['Title review requested ', 'Operations']];

    function cancel() {
      active.forEach(function (animation) { animation.onfinish = null; animation.cancel(); });
      active = [];
      automatic = false;
      if (correction) { window.cancelAnimationFrame(correction); correction = 0; }
    }
    function syncContext(index) {
      if (!isRay) { return; }
      var contextIndex = phone() ? index : 0;
      contextLabel.textContent = contextNames[contextIndex];
      detailText.nodeValue = contextDetails[contextIndex][0];
      detailStatus.textContent = contextDetails[contextIndex][1];
    }
    function sync() {
      scene.setAttribute('data-state', String(selected));
      if (isRay) {
        controls.setAttribute('aria-label', phone() ? 'Portal page; the Ray conversation stays with you' : 'Desktop Ray view');
        buttons.forEach(function (button, index) {
          var label = (phone() ? contextNames : viewNames)[index];
          var iconLabel = button.querySelector('.ray-visually-hidden');
          if (iconLabel) {
            iconLabel.textContent = label;
            button.setAttribute('aria-label', label);
            button.setAttribute('title', label);
            var icon = button.querySelector('svg');
            var paths = phone() ? [
              'M6 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM8 8h8M8 12h8M8 16h5',
              'm3 7 2 2 4-4m3 2h9M3 16l2 2 4-4m3 2h9',
              'M4 4h16v13H9l-5 4V4zM8 8h8M8 12h5'
            ] : [
              'M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM15 4v16',
              'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5',
              'M14 3h7v7M21 3l-9 9M10 3H5v18h16V14'
            ];
            if (icon) {
              var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
              path.setAttribute('d', paths[index]);
              while (icon.firstChild) { icon.removeChild(icon.firstChild); }
              icon.appendChild(path);
            }
          } else { button.textContent = label; }
        });
      }
      buttons.forEach(function (button, index) { button.setAttribute('aria-pressed', String(index === selected)); });
      syncContext(selected);
    }
    function layoutSignature() {
      return [stage.offsetWidth, stage.offsetHeight].concat(objects.map(function (node) {
        return node.offsetWidth + ':' + node.offsetHeight;
      })).join('|');
    }

    /* Reserve only the natural maximum of the desktop layouts so a control
       cannot move under a rapid second tap. On phones the cards keep identical
       spacing; only the small Ray context header needs a shared measure.
       Synchronous attribute probes never clone or hide the reading objects. */
    function measure() {
      stage.style.minHeight = '';
      if (context) { context.style.minHeight = ''; }
      var target = phone() ? context : stage;
      if (target && !locked()) {
        var tallest = 0;
        buttons.forEach(function (_, index) {
          scene.setAttribute('data-state', String(index));
          syncContext(index);
          tallest = Math.max(tallest, target.getBoundingClientRect().height);
        });
        if (tallest > 0) { target.style.minHeight = Math.ceil(tallest) + 'px'; }
      }
      scene.setAttribute('data-state', String(selected));
      syncContext(selected);
      signature = layoutSignature();
    }
    function correct() {
      cancel();
      if (layoutPhone !== phone() && status) { status.textContent = ''; }
      layoutPhone = phone();
      sync();
      measure();
    }
    function scheduleCorrection() {
      if (correction) { return; }
      correction = window.requestAnimationFrame(function () { correction = 0; correct(); });
    }
    function canMove() { return !reduced() && !locked() && !document.hidden && !away && inViewport(stage); }

    function choose(index, direct) {
      if (direct) { userEngaged = true; introUsed = true; }
      if (index === selected || index < 0 || index >= buttons.length) { return; }
      var before = objects.map(function (node) { return node.getBoundingClientRect(); });
      cancel();
      selected = index;
      sync();
      automatic = !direct;
      var bounds = stage.getBoundingClientRect();
      if (canMove()) {
        objects.forEach(function (node, i) {
          if (!node.animate) { return; }
          var after = node.getBoundingClientRect();
          /* Final-width text never travels beyond the stage when a narrow
             drawer becomes a wide page. Translation only; no text scaling. */
          var dx = Math.max(bounds.left - after.left, Math.min(before[i].left - after.left, bounds.right - after.right));
          var dy = Math.max(bounds.top - after.top, Math.min(before[i].top - after.top, bounds.bottom - after.bottom));
          var contextChange = isRay && phone() && node === context;
          if (Math.abs(dx) < 1 && Math.abs(dy) < 1 && !contextChange) { return; }
          try {
            var animation = node.animate(contextChange ? [{ opacity: 0.65 }, { opacity: 1 }] : [
              { transform: 'translate(' + dx + 'px,' + dy + 'px)' },
              { transform: 'translate(0px,0px)' }
            ], { duration: contextChange ? 220 : 480, easing: 'cubic-bezier(.2,.8,.2,1)' });
            active.push(animation);
            animation.onfinish = function () {
              active = active.filter(function (item) { return item !== animation; });
              if (!active.length) { automatic = false; }
            };
          } catch (e) { /* Unsupported animation leaves the complete settled state. */ }
        });
      }
      signature = layoutSignature();
      if (direct && status) {
        status.textContent = isRay
          ? buttons[selected].textContent + '. Same answer, source and saved draft.'
          : (selected ? 'Shared project. ' : 'Separate updates. ') + 'Title review is still open.';
      }
    }

    function introduce() {
      if (introUsed || userEngaged || pointerInside || scene.contains(document.activeElement) || !exposed || !canMove()) { return; }
      introUsed = true;
      choose(1, false);
    }
    buttons.forEach(function (button, index) {
      button.addEventListener('click', function () { choose(index, true); });
    });
    scene.addEventListener('pointerenter', function () { pointerInside = true; if (automatic) { cancel(); } });
    scene.addEventListener('pointerleave', function () { pointerInside = false; });
    scene.addEventListener('pointerdown', function () { userEngaged = true; introUsed = true; if (automatic) { cancel(); } });
    scene.addEventListener('focusin', function () { userEngaged = true; introUsed = true; if (automatic) { cancel(); } });

    sync();
    measure();
    controls.hidden = false;
    scene.setAttribute('data-scene-ready', 'true');
    if (window.IntersectionObserver) {
      new window.IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          exposed = entry.isIntersecting && entry.intersectionRatio >= 0.25;
          if (!entry.isIntersecting) { cancel(); }
          if (exposed) {
            if (layoutSignature() !== signature) { correct(); }
            introduce();
          }
        });
      }, { threshold: [0, 0.25] }).observe(stage);
    }
    if (window.ResizeObserver) {
      var resizeObserver = new window.ResizeObserver(function () {
        if (layoutSignature() !== signature) { scheduleCorrection(); }
      });
      resizeObserver.observe(stage);
      objects.forEach(function (node) { resizeObserver.observe(node); });
    }
    return {
      cancel: cancel,
      correct: correct,
      resize: scheduleCorrection,
      unlock: function () { correct(); introduce(); },
      motion: function (on) { if (on) { introUsed = true; cancel(); } },
      hide: function () { cancel(); },
      show: function () { correct(); }
    };
  }

  function init() {
    slice(document.querySelectorAll('[data-product-scene]')).forEach(function (scene) {
      var controller = setup(scene);
      if (controller) { scenes.push(controller); }
    });
    if (!scenes.length) { return; }
    listen(phoneQuery, function () { scenes.forEach(function (scene) { scene.correct(); }); });
    var motionChanged = function (on) { scenes.forEach(function (scene) { scene.motion(on); }); };
    if (shared) {
      shared.onMotionChange(motionChanged);
      shared.onUnlock(function () { scenes.forEach(function (scene) { scene.unlock(); }); });
    } else { listen(motionQuery, function () { motionChanged(reduced()); }); }
    window.addEventListener('resize', function () { scenes.forEach(function (scene) { scene.resize(); }); }, { passive: true });
    window.addEventListener('pagehide', function () { away = true; scenes.forEach(function (scene) { scene.hide(); }); });
    window.addEventListener('pageshow', function () { away = false; scenes.forEach(function (scene) { scene.show(); }); });
    document.addEventListener('visibilitychange', function () {
      scenes.forEach(function (scene) { if (document.hidden) { scene.hide(); } else { scene.show(); } });
    });
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { if (!away) { scenes.forEach(function (scene) { scene.correct(); }); } });
    }
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init, { once: true }); }
  else { init(); }
})();
