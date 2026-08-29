/* ==========================================================================
   Daylight case study — page behavior
   One story, one object. A single scroll-progress engine drives the two pinned
   cinematic acts (the shared project, and the phone) plus the reading current.
   Everything degrades to a fully visible, settled page: content is never hidden
   behind a reveal that might not fire, and reduced motion shows the end state.
   No network calls. Nothing here touches a backend.
   ========================================================================== */
(function () {
  'use strict';

  var reduceMotion = false;
  try {
    reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) { reduceMotion = false; }

  function clamp01(x) { return x < 0 ? 0 : (x > 1 ? 1 : x); }

  /* the shared project object, as reusable SVG inner markup ------------- */
  var HOME_SVG =
    '<line class="hm-ground" x1="24" y1="184" x2="236" y2="184"/>' +
    '<g class="hm-doc"><rect x="34" y="120" width="40" height="52" rx="3"/>' +
    '<line x1="42" y1="134" x2="66" y2="134"/><line x1="42" y1="144" x2="66" y2="144"/><line x1="42" y1="154" x2="58" y2="154"/></g>' +
    '<g class="hm-house"><polyline class="hm-walls" points="74,184 74,114 130,74 186,114 186,184"/>' +
    '<polyline class="hm-roof" points="58,122 130,74 202,122"/>' +
    '<rect class="hm-door" x="118" y="146" width="26" height="38"/>' +
    '<rect class="hm-win" x="150" y="130" width="22" height="22"/></g>' +
    '<g class="hm-panels"><polygon points="104,98 134,98 130,114 100,114"/>' +
    '<polygon points="138,98 168,98 166,114 134,114"/>' +
    '<polygon points="98,118 128,118 124,134 94,134"/>' +
    '<polygon points="132,118 162,118 160,134 128,134"/></g>' +
    '<g class="hm-sun"><circle cx="212" cy="52" r="15"/><g class="hm-rays">' +
    '<line x1="212" y1="24" x2="212" y2="31"/><line x1="212" y1="73" x2="212" y2="80"/>' +
    '<line x1="184" y1="52" x2="191" y2="52"/><line x1="233" y1="52" x2="240" y2="52"/>' +
    '<line x1="192" y1="32" x2="197" y2="37"/><line x1="227" y1="67" x2="232" y2="72"/>' +
    '<line x1="232" y1="32" x2="227" y2="37"/><line x1="197" y1="67" x2="192" y2="72"/></g></g>';

  /* -------------------------------------------------------------- */
  /* Scroll reveals — visible by default; motion only enhances       */
  /* -------------------------------------------------------------- */
  function setupReveals() {
    var reveals = Array.prototype.slice.call(document.querySelectorAll('.dl-reveal'));
    if (!reveals.length) { return; }

    if (reduceMotion || !('IntersectionObserver' in window)) {
      reveals.forEach(function (b) { b.classList.add('in'); });
      return;
    }

    var vh = window.innerHeight || 800;
    // anything already on (or near) screen at load is shown immediately
    reveals.forEach(function (b) {
      var r = b.getBoundingClientRect();
      if (r.top < vh * 0.95) { b.classList.add('in'); }
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); }
      });
    }, { threshold: 0.06, rootMargin: '0px 0px -6% 0px' });
    reveals.forEach(function (b) { if (!b.classList.contains('in')) { io.observe(b); } });

    // safety net: never leave content hidden
    setTimeout(function () { reveals.forEach(function (b) { b.classList.add('in'); }); }, 3200);
  }

  /* -------------------------------------------------------------- */
  /* Looping video: static under reduced motion, paused offscreen   */
  /* -------------------------------------------------------------- */
  function setupVideo(id) {
    var video = document.getElementById(id);
    if (!video) { return; }
    if (reduceMotion) { try { video.removeAttribute('autoplay'); video.pause(); } catch (e) {} return; }
    var tryPlay = function () { var p = video.play(); if (p && typeof p.catch === 'function') { p.catch(function () {}); } };
    tryPlay();
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { tryPlay(); } else { try { video.pause(); } catch (e) {} }
        });
      }, { threshold: 0.15 });
      io.observe(video);
    }
  }

  /* -------------------------------------------------------------- */
  /* Reading current — one calm top progress bar                    */
  /* -------------------------------------------------------------- */
  function setupChapters() {
    var bar = document.getElementById('dl-progress-bar');
    if (!bar) { return null; }
    return function update() {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var pct = max > 0 ? clamp01(window.scrollY / max) : 0;
      bar.style.width = (pct * 100).toFixed(2) + '%';
    };
  }

  /* -------------------------------------------------------------- */
  /* Scroll-progress engine — one rAF drives every pinned act        */
  /* -------------------------------------------------------------- */
  function makeEngine() {
    var items = [];
    var extra = [];
    var ticking = false;

    function progressFor(el, mode) {
      var rect = el.getBoundingClientRect();
      var vh = window.innerHeight || 1;
      if (mode === 'sticky') {
        var span = rect.height - vh;
        if (span <= 0) { return rect.top <= 0 ? 1 : 0; }
        return clamp01(-rect.top / span);
      }
      // 'enter': 0 as it appears, 1 once well into view
      return clamp01((vh - rect.top) / (vh + rect.height * 0.5));
    }

    function run() {
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        var p = progressFor(it.el, it.mode);
        it.el.style.setProperty('--p', p.toFixed(4));
        if (it.apply) { it.apply(p); }
      }
      for (var j = 0; j < extra.length; j++) { extra[j](); }
      ticking = false;
    }
    function onScroll() { if (!ticking) { ticking = true; window.requestAnimationFrame(run); } }

    return {
      add: function (el, mode, apply) { if (el) { items.push({ el: el, mode: mode || 'enter', apply: apply }); } },
      addUpdate: function (cb) { if (cb) { extra.push(cb); } },
      start: function () {
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll, { passive: true });
        run();
      },
      settleFinal: function () {
        items.forEach(function (it) { it.el.style.setProperty('--p', '1'); if (it.apply) { it.apply(1); } });
        extra.forEach(function (cb) { cb(); });
      }
    };
  }

  /* -------------------------------------------------------------- */
  /* ACT 2 — the shared project: hands arrive, the object evolves     */
  /* -------------------------------------------------------------- */
  var PROJECT = [
    { phase: 'Agreement', names: '<b>Homeowner</b> and Sales', copy: 'They agree on a system and sign. One project file, shared by everyone.' },
    { phase: 'Review &amp; design', names: '<b>Reviewer</b>, Designer, Financing', copy: 'Reviewers, designers, and financing turn the file into a buildable system.' },
    { phase: 'Build', names: '<b>Installer</b>, Town, Utility', copy: 'The installer permits it, the town approves, the utility clears it to connect.' },
    { phase: 'Live', names: '<b>Activation</b> and Operations', copy: 'The system switches on and runs, its whole history intact.' }
  ];

  function setupBuild(engine) {
    var track = document.querySelector('.dl-build-track');
    var rail = document.getElementById('dl-build-rail');
    var stage = document.getElementById('dl-build-stage');
    var fill = document.getElementById('dl-core-fill');
    var count = document.getElementById('dl-core-n');
    if (!rail || !stage) { return; }
    var steps = Array.prototype.slice.call(rail.querySelectorAll('.dl-build-step'));
    var n = steps.length;
    if (!n) { return; }

    var current = -1;
    function setActive(i) {
      i = Math.max(0, Math.min(n - 1, i));
      if (i === current) { return; }
      current = i;
      steps.forEach(function (s, k) {
        s.classList.toggle('is-on', k === i);
        s.classList.toggle('done', k < i);
      });
      stage.setAttribute('data-step', String(i));
      if (fill) { fill.style.width = (((i + 1) / n) * 100).toFixed(1) + '%'; }
      if (count) { count.textContent = String(i + 1); }
    }

    steps.forEach(function (s, i) {
      s.addEventListener('click', function () { setActive(i); });
      s.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown' && steps[i + 1]) { e.preventDefault(); steps[i + 1].focus(); setActive(i + 1); }
        else if (e.key === 'ArrowUp' && steps[i - 1]) { e.preventDefault(); steps[i - 1].focus(); setActive(i - 1); }
      });
    });

    // reduced motion shows the settled, finished project; motion starts at step 0
    setActive(reduceMotion ? n - 1 : 0);

    if (track && !reduceMotion) {
      engine.add(track, 'sticky', function (p) {
        var i = Math.min(n - 1, Math.floor(p * n + 0.0001));
        if (p >= 0.985) { i = n - 1; }
        setActive(i);
        // the shared-state current fills continuously, ending exactly full
        if (fill) { fill.style.width = (clamp01(p) * 100).toFixed(1) + '%'; }
      });
    }
  }

  function buildProjectMobile() {
    var host = document.getElementById('dl-proj-mobile');
    if (!host) { return; }
    var html = '';
    for (var i = 0; i < PROJECT.length; i++) {
      var s = PROJECT[i];
      html += '<div class="dl-pm" data-step="' + i + '">' +
        '<div class="dl-pm-head"><span class="dl-pm-n">0' + (i + 1) + '</span><span class="dl-pm-phase">' + s.phase + '</span></div>' +
        '<svg class="dl-home dl-home--build" viewBox="0 0 260 210" role="img" aria-label="The project at the ' + s.phase.replace('&amp;', 'and') + ' stage">' + HOME_SVG + '</svg>' +
        '<p class="dl-pm-names">' + s.names + '</p>' +
        '<p class="dl-pm-copy">' + s.copy + '</p>' +
        '</div>';
    }
    host.innerHTML = html;
  }

  /* -------------------------------------------------------------- */
  /* ACT 3 — the app: authentic iOS states                           */
  /* -------------------------------------------------------------- */
  var TAB_ICONS = {
    home: '<path d="M4 11 12 4l8 7"/><path d="M6 10v9h5v-6h2v6h5v-9"/>',
    energy: '<path d="M13 3 5 13h5l-1 8 8-11h-5z"/>',
    docs: '<path d="M7 3h7l4 4v14H7z"/><path d="M13 3v4h4"/>',
    support: '<path d="M20 5H4v11h4v3l4-3h8z"/>'
  };
  function statusBar() {
    return '<div class="dl-ios-status"><span class="dl-ios-time">9:41</span>' +
      '<span class="dl-ios-icons" aria-hidden="true"><i class="sig"></i><i class="wifi"></i><i class="bat"></i></span></div>';
  }
  function navBar(eyebrow, title) {
    return '<div class="dl-ios-nav"><div class="dl-ios-eyebrow">' + eyebrow + '</div><div class="dl-ios-title">' + title + '</div></div>';
  }
  function tabs(active) {
    var defs = [['home', 'Home'], ['energy', 'Energy'], ['docs', 'Docs'], ['support', 'Support']];
    var out = '<div class="dl-ios-tabs" aria-hidden="true">';
    for (var i = 0; i < defs.length; i++) {
      out += '<span class="dl-ios-tab' + (defs[i][0] === active ? ' on' : '') + '">' +
        '<svg viewBox="0 0 24 24">' + TAB_ICONS[defs[i][0]] + '</svg><span>' + defs[i][1] + '</span></span>';
    }
    return out + '</div>';
  }
  function group(label, rowsHtml) {
    return (label ? '<div class="dl-ios-glabel">' + label + '</div>' : '') + '<div class="dl-ios-group">' + rowsHtml + '</div>';
  }
  function row(k, v, cls) { return '<div class="dl-jrow">' + k + '<span class="v' + (cls ? ' ' + cls : '') + '">' + v + '</span></div>'; }
  function chev() { return '<span class="chev"></span>'; }
  function tick() { return '<span class="tick">&#10003;</span> '; }
  function iosBody(inner) { return '<div class="dl-ios-body">' + inner + '</div>'; }

  var APP = [
    { t: 'Signing', d: 'A guided flow reads the city disclosures, verifies identity, and takes the signature. No fine print they never saw.',
      screen: statusBar() + navBar('Welcome home', 'Your agreement') +
        iosBody(group('Before you sign',
          row('City disclosures', 'Read ' + chev()) +
          row('Identity', tick() + 'Verified', 'ok') +
          row('Your rate', '$0.152 / kWh')) +
          '<div class="dl-ios-btn">Review &amp; sign</div>') + tabs('home') },
    { t: 'Installation', d: 'The build shows up as clear progress: survey, design, permit, install date. They always know where things stand.',
      screen: statusBar() + navBar('In progress', 'Your install') +
        iosBody(group('Build status',
          row('Site survey', tick() + 'Done', 'ok') +
          row('Design', tick() + 'Approved', 'ok') +
          row('Permit', 'Filed ' + chev()) +
          row('Install day', 'Sep 3'))) + tabs('home') },
    { t: 'Power on', d: 'Permission to operate lands, the system goes live, and production and battery flow show up in real time.',
      screen: statusBar() + navBar('Live now', 'Your energy') +
        iosBody('<div class="dl-ios-hero"><div class="dl-jbig">Live</div><div class="dl-jsub">Solar and battery, in real time.</div>' +
          '<div class="dl-jbars"><i style="height:52%"></i><i style="height:70%"></i><i style="height:88%"></i><i style="height:96%"></i><i style="height:80%"></i><i style="height:62%"></i><i style="height:44%"></i></div></div>' +
          group('Today', row('Produced', '18.4 kWh') + row('Used', '11.2 kWh') + row('Sent to grid', '7.2 kWh', 'ok'))) + tabs('energy') },
    { t: 'Everyday', d: 'Every document in one place, and help that goes to Ray or a real person. Never a dead end.',
      screen: statusBar() + navBar('All set', 'Documents &amp; help') +
        iosBody(group('Your documents',
          row('Agreement', 'PDF ' + chev()) +
          row('Permit', 'PDF ' + chev()) +
          row('Warranty', 'PDF ' + chev())) +
          group('Get help',
          row('Ask Ray', 'Grounded answer ' + chev(), 'ok') +
          row('Message support', 'A real person ' + chev()))) + tabs('support') }
  ];

  function setupApp(engine) {
    var track = document.querySelector('.dl-app-track');
    var screenA = document.getElementById('dl-appscreen-a');
    var screenB = document.getElementById('dl-appscreen-b');
    var titleEl = document.getElementById('dl-app-t');
    var descEl = document.getElementById('dl-app-d');
    var numEl = document.getElementById('dl-app-n');
    var segHost = document.getElementById('dl-app-seg');
    if (!screenA || !screenB || !segHost) { return; }
    var n = APP.length;
    if (!n) { return; }

    // build the segmented progress current
    var segs = [];
    for (var s = 0; s < n; s++) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'dl-seg';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', 'Moment ' + (s + 1) + ': ' + APP[s].t.replace('&amp;', 'and'));
      b.innerHTML = '<span class="dl-seg-fill" aria-hidden="true"></span>';
      (function (idx) { b.addEventListener('click', function () { jumpTo(idx); }); })(s);
      segHost.appendChild(b);
      segs.push(b);
    }

    var curCaption = -1;
    function renderCaption(i) {
      if (i === curCaption) { return; }
      curCaption = i;
      if (numEl) { numEl.textContent = '0' + (i + 1); }
      if (titleEl) { titleEl.innerHTML = APP[i].t; }
      if (descEl) { descEl.innerHTML = APP[i].d; }
      segs.forEach(function (seg, k) { seg.setAttribute('aria-selected', k === i ? 'true' : 'false'); });
    }

    var lastA = -1, lastB = -1;
    function apply(f) {
      var base = Math.floor(f + 0.0001);
      if (base < 0) { base = 0; } else if (base > n - 1) { base = n - 1; }
      var frac = f - base; if (frac < 0) { frac = 0; } else if (frac > 1) { frac = 1; }
      var nb = Math.min(n - 1, base + 1);
      if (lastA !== base) { screenA.innerHTML = APP[base].screen; lastA = base; }
      if (lastB !== nb) { screenB.innerHTML = APP[nb].screen; lastB = nb; }
      // the next screen is fully opaque and revealed top-to-bottom over the
      // current one with a soft feathered wipe — continuous, and never a ghost.
      if (base === nb) {
        screenB.style.opacity = '0';
      } else {
        var e = frac * frac * (3 - 2 * frac);
        var pct = e * 114 - 7;
        var mask = 'linear-gradient(180deg,#000 ' + (pct - 9).toFixed(1) + '%, transparent ' + pct.toFixed(1) + '%)';
        screenB.style.opacity = '1';
        screenB.style.webkitMaskImage = mask;
        screenB.style.maskImage = mask;
      }
      var cap = frac >= 0.5 && base < n - 1 ? base + 1 : base;
      renderCaption(cap);
      // one continuous current across the four segments: fills smoothly and
      // ends exactly full, with the active moment's segment marked.
      var p = n > 1 ? f / (n - 1) : 0;
      for (var k = 0; k < n; k++) {
        var fill = segs[k].firstChild;
        var v = p * n - k; if (v < 0) { v = 0; } else if (v > 1) { v = 1; }
        if (fill) { fill.style.setProperty('--v', v.toFixed(3)); }
        segs[k].classList.toggle('is-active', k === cap);
      }
    }

    function jumpTo(i) {
      if (!track || reduceMotion) { apply(i); return; }
      var rect = track.getBoundingClientRect();
      var span = track.offsetHeight - (window.innerHeight || 1);
      if (span <= 0) { apply(i); return; }
      var pTarget = n > 1 ? i / (n - 1) : 0;
      var absTop = window.scrollY + rect.top;
      window.scrollTo({ top: Math.round(absTop + pTarget * span), behavior: 'smooth' });
    }

    apply(reduceMotion ? n - 1 : 0);

    if (track && !reduceMotion) {
      engine.add(track, 'sticky', function (p) { apply(p * (n - 1)); });
    }

    // mobile: four fully composed scenes, each phone shown at a comfortable size
    var mob = document.getElementById('dl-app-mobile');
    if (mob) {
      var html = '';
      for (var m = 0; m < APP.length; m++) {
        html += '<div class="dl-am">' +
          '<div class="dl-am-copy"><span class="dl-am-n">0' + (m + 1) + '</span><span class="as-t">' + APP[m].t + '</span><span class="as-d">' + APP[m].d + '</span></div>' +
          '<div class="dl-device dl-device--live"><span class="dl-device-island"></span>' +
          '<div class="dl-device-screen"><div class="dl-ios">' + APP[m].screen + '</div></div></div>' +
          '</div>';
      }
      mob.innerHTML = html;
    }
  }

  /* -------------------------------------------------------------- */
  /* Measured progress path — exact from first dot center to last    */
  /* -------------------------------------------------------------- */
  function measureSpine(listEl, dotSel) {
    var dots = listEl.querySelectorAll(dotSel);
    if (dots.length < 2) { return; }
    var listRect = listEl.getBoundingClientRect();
    var first = dots[0].getBoundingClientRect();
    var last = dots[dots.length - 1].getBoundingClientRect();
    var top = (first.top + first.height / 2) - listRect.top;
    var len = (last.top + last.height / 2) - (first.top + first.height / 2);
    if (len < 0) { len = 0; }
    listEl.style.setProperty('--sl-top', top.toFixed(1) + 'px');
    listEl.style.setProperty('--sl-len', len.toFixed(1) + 'px');
  }
  function wireSpines() {
    function run() {
      var appRail = document.getElementById('dl-app-rail');
      if (appRail && appRail.offsetParent !== null) { measureSpine(appRail, '.as-dot'); }
      var buildRail = document.getElementById('dl-build-rail');
      if (buildRail && buildRail.offsetParent !== null) { measureSpine(buildRail, '.bs-dot'); }
    }
    run();
    setTimeout(run, 350);
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(run).catch(function () {}); }
    if ('ResizeObserver' in window) {
      var ro = new ResizeObserver(run);
      ['dl-app-rail', 'dl-build-rail'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) { ro.observe(el); }
      });
    } else {
      window.addEventListener('resize', run, { passive: true });
    }
  }

  /* -------------------------------------------------------------- */
  /* ACT 5 — Ray mini-demo, plays once in view                       */
  /* -------------------------------------------------------------- */
  function setupRayflow(engine) {
    var flow = document.getElementById('dl-rayflow');
    if (!flow) { return; }
    if (reduceMotion) { flow.classList.add('show-ask', 'show-ans'); return; }
    var askShown = false, ansShown = false;
    engine.addUpdate(function () {
      var r = flow.getBoundingClientRect();
      var vh = window.innerHeight || 1;
      var p = clamp01((vh * 0.88 - r.top) / (vh * 0.42));
      if (!askShown && p > 0.12) { askShown = true; flow.classList.add('show-ask'); }
      if (!ansShown && p > 0.42) { ansShown = true; flow.classList.add('show-ans'); }
    });
  }

  /* -------------------------------------------------------------- */
  /* ACT 4 — sunlight to settlement: one current fills, stages light  */
  /* -------------------------------------------------------------- */
  function setupSettle(engine) {
    var scene = document.querySelector('.dl-settle');
    var flow = document.getElementById('dl-settle-flow');
    if (!scene || !flow) { return; }
    var stages = Array.prototype.slice.call(scene.querySelectorAll('.dl-stage'));
    var n = stages.length;
    if (!n) { return; }

    function light(p) {
      flow.style.setProperty('--p', p.toFixed(4));
      for (var i = 0; i < n; i++) {
        var thr = n > 1 ? (i / (n - 1)) : 0;
        stages[i].classList.toggle('is-lit', p >= thr - 0.0001);
      }
    }

    if (reduceMotion) { light(1); return; }

    light(0);
    engine.addUpdate(function () {
      var r = scene.getBoundingClientRect();
      var vh = window.innerHeight || 1;
      // fill as the scene travels the middle band of the viewport
      var p = clamp01((vh * 0.92 - r.top) / (vh * 0.62));
      light(p);
    });
  }

  /* -------------------------------------------------------------- */
  function init() {
    var docEl = document.documentElement;
    try {
      setupReveals();
      docEl.classList.add('dl-js');

      buildProjectMobile();

      var engine = makeEngine();

      setupBuild(engine);
      setupApp(engine);
      setupSettle(engine);

      setupRayflow(engine);

      var chapterUpdate = setupChapters();
      if (chapterUpdate) { engine.addUpdate(chapterUpdate); }

      if (reduceMotion) { engine.settleFinal(); } else { engine.start(); }

      wireSpines();
      setupVideo('dl-ray-video');
    } catch (e) {
      docEl.classList.remove('dl-js');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
