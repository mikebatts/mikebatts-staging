/* ==========================================================================
   Shared page behavior for the Daylight and Ray case studies (v7).
   Motion preferences (live), Save-Data, viewport reveals, the site nav
   (scrolled state, chapter menu, current chapter, page-position line),
   film playback (visible only, tab active, gate lifted, honest control),
   timer groups and live-region helpers. No network. Exposes window.DLShared.
   Everything the reader needs is in the HTML; this file only adds motion
   and the one interactive figure's plumbing (see ray-case-study.js).
   ========================================================================== */
(function () {
  'use strict';
  var root = document.documentElement;
  var slice = function (list) { return Array.prototype.slice.call(list || []); };

  /* ---------------- motion and data preferences ---------------- */
  var motionQuery = null;
  try { motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)'); } catch (e) {}
  var saveData = false;
  try { saveData = !!(navigator.connection && navigator.connection.saveData); } catch (e) {}
  var motionListeners = [];
  function reduced() { return !!(motionQuery && motionQuery.matches); }
  function syncMotionClass() { root.classList.toggle('reduce-motion', reduced()); }
  if (motionQuery) {
    var onMotion = function () { syncMotionClass(); motionListeners.forEach(function (cb) { try { cb(reduced()); } catch (e) {} }); };
    if (motionQuery.addEventListener) { motionQuery.addEventListener('change', onMotion); }
    else if (motionQuery.addListener) { motionQuery.addListener(onMotion); }
  }
  syncMotionClass();

  /* ---------------- gate awareness ----------------
     The gate script removes html.dl-locked when the reader gets through.
     Geometry-dependent behavior starts or re-measures at that moment.
     Nothing here reads or writes the unlock flag. */
  var unlockListeners = [];
  function locked() { return root.classList.contains('dl-locked'); }
  function onUnlock(cb) { unlockListeners.push(cb); }
  if ('MutationObserver' in window) {
    var wasLocked = locked();
    new MutationObserver(function () {
      var now = locked();
      if (wasLocked && !now) { unlockListeners.forEach(function (cb) { try { cb(); } catch (e) {} }); }
      wasLocked = now;
    }).observe(root, { attributes: true, attributeFilter: ['class'] });
  }

  /* ---------------- timer group: an owner clears its own timers ---------------- */
  function timers() {
    var ids = [], frames = [];
    return {
      after: function (ms, fn) {
        var id = window.setTimeout(function () { ids = ids.filter(function (x) { return x !== id; }); fn(); }, reduced() ? 0 : ms);
        ids.push(id); return id;
      },
      frame: function (fn) {
        var id = window.requestAnimationFrame(function () { frames = frames.filter(function (x) { return x !== id; }); fn(); });
        frames.push(id); return id;
      },
      clear: function () {
        ids.forEach(function (id) { window.clearTimeout(id); });
        frames.forEach(function (id) { window.cancelAnimationFrame(id); });
        ids = []; frames = [];
      },
      pending: function () { return ids.length + frames.length; }
    };
  }

  /* ---------------- reveals: one soft entrance per target, when reached ----------------
     Targets already above or inside the viewport at start show on the next
     frame. Fail open: no IntersectionObserver, reduced motion at load, or a
     mid-session reduced-motion change settles everything. Focus inside an
     unrevealed region reveals it. No blanket timer. */
  function setupReveals() {
    var items = slice(document.querySelectorAll('.cs-reveal'));
    if (!items.length) { return null; }
    var io = null, settled = false, started = false;
    function show(el) {
      el.classList.add('in');
      if (io) { try { io.unobserve(el); } catch (e) {} }
    }
    function settleAll() {
      settled = true;
      items.forEach(function (el) { el.classList.add('in'); });
      if (io) { try { io.disconnect(); } catch (e) {} io = null; }
    }
    document.addEventListener('focusin', function (event) {
      var node = event.target && event.target.closest ? event.target.closest('.cs-reveal') : null;
      while (node) { if (!node.classList.contains('in')) { show(node); } node = node.parentElement ? node.parentElement.closest('.cs-reveal') : null; }
    });
    function assess() {
      if (settled) { return; }
      var vh = window.innerHeight || 800;
      var soon = [];
      items.forEach(function (el) {
        if (el.classList.contains('in')) { return; }
        var r = el.getBoundingClientRect();
        if (r.bottom <= 0) { show(el); }
        else if (r.top < vh * 0.92) { soon.push(el); }
      });
      if (soon.length) { window.requestAnimationFrame(function () { soon.forEach(function (el) { if (!el.classList.contains('in')) { show(el); } }); }); }
    }
    if (reduced() || !('IntersectionObserver' in window)) { settleAll(); return { settle: settleAll, assess: assess }; }
    function start() {
      if (started || settled) { return; }
      started = true;
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting || entry.boundingClientRect.bottom <= 0) { show(entry.target); }
        });
      }, { threshold: 0.06, rootMargin: '0px 0px -6% 0px' });
      assess();
      items.forEach(function (el) { if (!el.classList.contains('in') && io) { io.observe(el); } });
    }
    if (locked() && 'MutationObserver' in window) { onUnlock(start); } else { start(); }
    window.addEventListener('pageshow', function (event) { if (event && event.persisted) { assess(); } });
    motionListeners.push(function (isReduced) { if (isReduced) { settleAll(); } });
    return { settle: settleAll, assess: assess };
  }

  /* ---------------- chapter nav: page-position line and current chapter ----------------
     One passive scroll listener through requestAnimationFrame, plus a body
     ResizeObserver for layout changes without a scroll. The line shows page
     position. The chapter menu marks the current section with
     aria-current="location". Optional label slots ([data-cs-chapter-n],
     [data-cs-chapter-t]) mirror it when present. Nothing here moves focus,
     rewrites the URL, or announces to assistive technology. */
  function setupChapterNav() {
    var nav = document.querySelector('.cs-nav');
    if (!nav) { return null; }
    var labelNum = nav.querySelector('[data-cs-chapter-n]');
    var labelText = nav.querySelector('[data-cs-chapter-t]');
    var line = nav.querySelector('.cs-nav-progress i');
    var links = slice(nav.querySelectorAll('.cs-nav-menu a[href^="#"]'));
    var sections = [];
    links.forEach(function (a) {
      var id = '';
      try { id = decodeURIComponent(a.getAttribute('href').slice(1)); } catch (e) { id = a.getAttribute('href').slice(1); }
      var el = id ? document.getElementById(id) : null;
      if (!el) { return; }
      var numEl = a.querySelector('span');
      var num = numEl ? numEl.textContent.trim() : '';
      var title = a.textContent.replace(num, '').replace(/\s+/g, ' ').trim();
      sections.push({ el: el, link: a, num: num, title: title });
    });
    if (!line && !labelText && !sections.length) { return null; }
    var baseNum = labelNum ? labelNum.textContent : '';
    var baseText = labelText ? labelText.textContent : '';
    var current = null, currentSet = false;
    function paintLabel(active) {
      if (labelNum) { labelNum.textContent = active ? active.num : baseNum; }
      if (labelText) { labelText.textContent = active ? active.title : baseText; }
      var holder = labelText ? labelText.parentElement : null;
      if (holder && holder.classList) { holder.classList.toggle('is-chapter', !!active); }
    }
    function measure() {
      var y = window.pageYOffset || root.scrollTop || 0;
      var vh = window.innerHeight || 0;
      var height = Math.max(root.scrollHeight || 0, document.body ? document.body.scrollHeight || 0 : 0);
      var max = Math.max(1, height - vh);
      var progress = Math.min(1, Math.max(0, y / max));
      if (line) { line.style.transform = 'scaleX(' + progress.toFixed(4) + ')'; }
      var marker = (nav.offsetHeight || 60) + Math.min(160, vh * 0.25);
      var active = null;
      for (var i = 0; i < sections.length; i++) {
        if (sections[i].el.getBoundingClientRect().top <= marker) { active = sections[i]; } else { break; }
      }
      if (currentSet && active === current) { return; }
      current = active; currentSet = true;
      links.forEach(function (a) { if (active && a === active.link) { a.setAttribute('aria-current', 'location'); } else { a.removeAttribute('aria-current'); } });
      paintLabel(active);
    }
    var pending = false;
    function schedule() {
      if (pending) { return; }
      pending = true;
      window.requestAnimationFrame(function () { pending = false; measure(); });
    }
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    window.addEventListener('load', schedule);
    window.addEventListener('pageshow', schedule);
    window.addEventListener('hashchange', schedule);
    document.addEventListener('toggle', schedule, true);
    onUnlock(schedule);
    if ('ResizeObserver' in window && document.body) {
      try { new ResizeObserver(schedule).observe(document.body); } catch (e) {}
    }
    measure();
    return { measure: measure, schedule: schedule };
  }

  /* ---------------- nav surface and the chapter menu ---------------- */
  function setupNav() {
    var nav = document.querySelector('.cs-nav');
    if (!nav) { return; }
    if (!('IntersectionObserver' in window)) { nav.classList.add('is-scrolled'); }
    else {
      var sentinel = document.createElement('div');
      sentinel.setAttribute('aria-hidden', 'true');
      sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:10px;pointer-events:none';
      document.body.appendChild(sentinel);
      new IntersectionObserver(function (entries) { nav.classList.toggle('is-scrolled', !entries[0].isIntersecting); }, { threshold: 0 }).observe(sentinel);
    }
    var menu = nav.querySelector('.cs-nav-chapters');
    if (menu) {
      menu.addEventListener('click', function (event) { if (event.target.closest('a')) { menu.removeAttribute('open'); } });
      document.addEventListener('click', function (event) { if (menu.open && !menu.contains(event.target)) { menu.removeAttribute('open'); } });
      menu.addEventListener('keydown', function (event) { if (event.key === 'Escape' && menu.open) { menu.removeAttribute('open'); menu.querySelector('summary').focus(); } });
    }
  }

  /* ---------------- films: play only when visible, tab active, not gated ----------------
     Two separate intents: the reader's (userPaused, set only by the visible
     control) and the page's (offscreen, hidden tab, gate, motion and data
     preferences). The control is painted from the element's real playback
     state after every play() settles or rejects and on the element's own
     events, so blocked playback shows an honest Play control. */
  function setupVideos() {
    var videos = slice(document.querySelectorAll('video[data-cs-video]'));
    if (!videos.length) { return; }
    var state = new Map();
    function toggleFor(video) { return video.id ? document.querySelector('[data-video-toggle="' + video.id + '"]') : null; }
    function paint(video) {
      var toggle = toggleFor(video);
      if (!toggle) { return; }
      var paused = !!video.paused;
      toggle.setAttribute('data-paused', paused ? 'true' : 'false');
      toggle.setAttribute('aria-label', paused ? 'Play animation' : 'Pause animation');
    }
    videos.forEach(function (video) {
      state.set(video, { visible: false, userPaused: reduced() || saveData, userPlayed: false });
      try { video.removeAttribute('autoplay'); } catch (e) {}
      ['play', 'playing', 'pause', 'ended', 'emptied'].forEach(function (name) { video.addEventListener(name, function () { paint(video); }); });
    });
    function sync(video) {
      var s = state.get(video);
      var allowedByPreference = s.userPlayed || !(reduced() || saveData);
      var shouldPlay = s.visible && !document.hidden && !locked() && !s.userPaused && allowedByPreference;
      if (shouldPlay) {
        var p = null;
        try { p = video.play(); } catch (e) { p = null; }
        if (p && typeof p.then === 'function') {
          var settle = function () { try { paint(video); } catch (e) {} };
          p.then(settle, settle);
        }
      } else { try { video.pause(); } catch (e) {} }
      paint(video);
    }
    function syncAll() { videos.forEach(sync); }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) { state.get(entry.target).visible = entry.isIntersecting; sync(entry.target); });
      }, { threshold: .12 });
      videos.forEach(function (v) { io.observe(v); });
    } else { videos.forEach(function (v) { state.get(v).visible = true; }); syncAll(); }
    document.addEventListener('visibilitychange', syncAll);
    motionListeners.push(function (isReduced) {
      videos.forEach(function (v) { var s = state.get(v); if (isReduced && !s.userPlayed) { s.userPaused = true; } });
      syncAll();
    });
    if ('MutationObserver' in window) {
      new MutationObserver(syncAll).observe(root, { attributes: true, attributeFilter: ['class'] });
    }
    slice(document.querySelectorAll('[data-video-toggle]')).forEach(function (toggle) {
      var video = document.getElementById(toggle.getAttribute('data-video-toggle'));
      if (!video) { return; }
      toggle.addEventListener('click', function () {
        var s = state.get(video);
        if (video.paused) { s.userPaused = false; s.userPlayed = true; }
        else { s.userPaused = true; }
        sync(video);
      });
    });
    syncAll();
  }

  /* ---------------- live announcements: text only, never HTML ----------------
     One pending announcement per live region. A newer call cancels the
     older one, so a fast reset after a reopen leaves only the reset
     message. The short clear-then-set lets assistive technology notice a
     repeated message. */
  var pendingAnnouncements = [];
  function announce(el, message) {
    if (!el) { return; }
    pendingAnnouncements = pendingAnnouncements.filter(function (p) {
      if (p.el !== el) { return true; }
      window.clearTimeout(p.id); return false;
    });
    el.textContent = '';
    var entry = { el: el, id: 0 };
    entry.id = window.setTimeout(function () {
      pendingAnnouncements = pendingAnnouncements.filter(function (p) { return p !== entry; });
      el.textContent = message;
    }, 30);
    pendingAnnouncements.push(entry);
  }
  function text(el, value) { if (el) { el.textContent = value == null ? '' : String(value); } }
  function show(el, on) { if (el) { el.hidden = !on; } }

  var reveals = null, chapterNav = null;
  function init() {
    root.classList.add('js-on');
    setupNav();
    chapterNav = setupChapterNav();
    reveals = setupReveals();
    setupVideos();
  }

  window.DLShared = {
    reduced: reduced, saveData: saveData, onMotionChange: function (cb) { motionListeners.push(cb); }, onUnlock: onUnlock,
    timers: timers, announce: announce, text: text, show: show, init: init,
    reveals: function () { return reveals; }, chapterNav: function () { return chapterNav; }
  };
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();
