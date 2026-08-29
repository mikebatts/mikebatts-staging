/* ==========================================================================
   Daylight case study — page behavior
   Signature: one energy path taught through scroll-progressive state.
   - scroll reveals (progressive, degrade to fully visible)
   - a single scroll-progress engine drives --p on [data-progress] elements plus
     stepped state for the dossier, construction build, billing trace, payout
     packet, and the homeowner journey. One rAF, batched reads, no layout thrash.
   - Ray avatar loop pauses offscreen; the Ray mini-demo plays once in view.
   - honors prefers-reduced-motion: no scrubbing, final states shown, no loops.
   No network calls. Nothing here touches a backend. Content works with JS off.
   ========================================================================== */
(function () {
  'use strict';

  var reduceMotion = false;
  try {
    reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) { reduceMotion = false; }

  function clamp01(x) { return x < 0 ? 0 : (x > 1 ? 1 : x); }

  /* -------------------------------------------------------------- */
  /* Scroll reveals                                                 */
  /* -------------------------------------------------------------- */
  function setupReveals() {
    var reveals = Array.prototype.slice.call(document.querySelectorAll('.dl-reveal'));
    if (!reveals.length) { return; }

    reveals.forEach(function (block) {
      var kids = block.querySelectorAll('.dl-stagger');
      for (var i = 0; i < kids.length; i++) { kids[i].style.setProperty('--i', i); }
    });

    if (reduceMotion || !('IntersectionObserver' in window)) {
      reveals.forEach(function (b) { b.classList.add('in'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (b) { io.observe(b); });

    // safety net: never leave content hidden
    setTimeout(function () { reveals.forEach(function (b) { b.classList.add('in'); }); }, 4500);
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
  /* Reading current + chapter progress                             */
  /* -------------------------------------------------------------- */
  function setupChapters() {
    var bar = document.getElementById('dl-progress-bar');
    var fill = document.getElementById('dl-chapters-fill');
    var nav = document.getElementById('dl-chapters');
    var links = nav ? Array.prototype.slice.call(nav.querySelectorAll('[data-chapter]')) : [];
    var targets = links.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });
    if (!bar && !links.length) { return null; }

    function update() {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var pct = max > 0 ? clamp01(window.scrollY / max) : 0;
      if (bar) { bar.style.width = (pct * 100).toFixed(2) + '%'; }
      if (fill) { fill.style.height = (pct * 100).toFixed(2) + '%'; }
      var mid = window.scrollY + window.innerHeight * 0.35;
      var activeIdx = 0;
      for (var i = 0; i < targets.length; i++) {
        if (targets[i] && targets[i].offsetTop <= mid) { activeIdx = i; }
      }
      links.forEach(function (a, i) {
        a.classList.toggle('active', i === activeIdx);
        a.classList.toggle('done', i < activeIdx);
        if (i === activeIdx) { a.setAttribute('aria-current', 'true'); } else { a.removeAttribute('aria-current'); }
      });
    }
    return update;
  }

  /* -------------------------------------------------------------- */
  /* Scroll-progress engine — one rAF drives every scrubbed diagram */
  /* -------------------------------------------------------------- */
  function makeEngine() {
    var items = []; // { el, mode, apply }
    var extra = []; // plain update callbacks (chapters)
    var ticking = false;

    function progressFor(el, mode) {
      var rect = el.getBoundingClientRect();
      var vh = window.innerHeight || 1;
      if (mode === 'sticky') {
        var span = rect.height - vh;
        if (span <= 0) { return rect.top <= 0 ? 1 : 0; }
        return clamp01(-rect.top / span);
      }
      if (mode === 'through') {
        // element traverses the viewport middle: 0 when its top reaches mid,
        // 1 when its bottom reaches mid. Good for natural-height content.
        if (rect.height <= 0) { return 0; }
        return clamp01((vh * 0.5 - rect.top) / rect.height);
      }
      // 'enter': 0 as it appears from the bottom, 1 once it is well into view
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
        // reduced motion: paint the finished state once, attach no scroll work
        items.forEach(function (it) { it.el.style.setProperty('--p', '1'); if (it.apply) { it.apply(1); } });
        extra.forEach(function (cb) { cb(); });
      }
    };
  }

  /* -------------------------------------------------------------- */
  /* Origination dossier — parties activate; the project earns state */
  /* -------------------------------------------------------------- */
  function dossierApply(root) {
    var parties = Array.prototype.slice.call(root.querySelectorAll('.dp'));
    var needs = Array.prototype.slice.call(root.querySelectorAll('.dc-state li'));
    var fill = root.querySelector('#dc-trust-fill');
    var n = parties.length || 6;
    return function (p) {
      var step = Math.min(n - 1, Math.floor(p * n));
      if (p >= 0.999) { step = n - 1; }
      parties.forEach(function (el, i) {
        el.classList.toggle('is-on', i <= step);
        el.classList.toggle('is-active', i === step);
      });
      needs.forEach(function (el, i) { el.classList.toggle('done', i <= step); });
      if (fill) { fill.style.width = (((step + 1) / n) * 100).toFixed(1) + '%'; }
    };
  }

  /* -------------------------------------------------------------- */
  /* Construction story — a home built stage by stage                */
  /* -------------------------------------------------------------- */
  function buildApply(root) {
    var phases = Array.prototype.slice.call(root.querySelectorAll('.bp'));
    var n = phases.length || 6;
    return function (p) {
      var stage = Math.min(n - 1, Math.floor(p * n));
      if (p >= 0.999) { stage = n - 1; }
      root.setAttribute('data-stage', String(stage));
      phases.forEach(function (el, i) { el.classList.toggle('is-on', i <= stage); });
    };
  }

  /* -------------------------------------------------------------- */
  /* Partner payments — a packet moves through the gates             */
  /* -------------------------------------------------------------- */
  function payoutApply(root) {
    var gates = Array.prototype.slice.call(root.querySelectorAll('.pg'));
    var n = gates.length || 5;
    return function (p) {
      var gate = Math.min(n - 1, Math.floor(p * n + 0.0001));
      if (p >= 0.999) { gate = n - 1; }
      gates.forEach(function (el, i) { el.classList.toggle('is-on', i <= gate); });
    };
  }

  /* -------------------------------------------------------------- */
  /* Billing — a pulse scrubs the trace, nodes light as it passes    */
  /* -------------------------------------------------------------- */
  function billApply(root) {
    var nodes = Array.prototype.slice.call(root.querySelectorAll('.tr-node'));
    var pulse = root.querySelector('#tr-pulse');
    var x0 = 30, x1 = 430, y = 58;
    var fracs = [0, 0.333, 0.667, 1];
    return function (p) {
      if (pulse) { pulse.setAttribute('cx', (x0 + p * (x1 - x0)).toFixed(1)); pulse.setAttribute('cy', String(y)); }
      nodes.forEach(function (el, i) {
        var f = fracs[i] != null ? fracs[i] : (i / (nodes.length - 1));
        el.classList.toggle('is-on', p >= f - 0.02);
      });
    };
  }

  /* -------------------------------------------------------------- */
  /* Homeowner journey — an authored phone that advances by step     */
  /* -------------------------------------------------------------- */
  function setupJourney(engine) {
    var wrap = document.querySelector('.dl-journey');
    var stepsWrap = document.getElementById('dl-journey-steps');
    var screen = document.getElementById('dl-jscreen');
    if (!wrap || !stepsWrap || !screen) { return; }
    var steps = Array.prototype.slice.call(stepsWrap.querySelectorAll('.dl-jstep'));
    if (!steps.length) { return; }
    var n = steps.length;

    function nav(active) {
      var dots = '';
      for (var i = 0; i < n; i++) { dots += '<i class="' + (i === active ? 'on' : '') + '"></i>'; }
      return '<div class="dl-jscreen-nav">' + dots + '</div>';
    }
    function top(eyebrow, title) {
      return '<div class="dl-jscreen-top"><div class="dl-jscreen-eyebrow">' + eyebrow + '</div><div class="dl-jscreen-title">' + title + '</div></div>';
    }
    function row(k, v) { return '<div class="dl-jrow">' + k + '<span class="v">' + v + '</span></div>'; }

    var SCREENS = [
      top('Your agreement', 'Sign once, and know what you are agreeing to.') +
        '<div class="dl-jscreen-body"><span class="dl-jchip">Step 1 of 6</span>' +
        row('City disclosures', 'Read') + row('Identity', 'Verified') + row('Signature', 'Tap to sign') +
        '</div>' + nav(0),

      top('Your install', 'Your system, getting built.') +
        '<div class="dl-jscreen-body"><span class="dl-jchip">Step 2 of 6</span>' +
        row('Site survey', 'Done') + row('Design', 'Approved') + row('Permit', 'Filed') + row('Install', 'Scheduled') +
        '</div>' + nav(1),

      top('Live', 'Powered on. Your system is live.') +
        '<div class="dl-jscreen-body"><span class="dl-jchip">Producing now</span>' +
        '<div class="dl-jbig">Live</div><div class="dl-jsub">Solar and battery, in real time.</div>' +
        '<div class="dl-jbars"><i style="height:52%"></i><i style="height:70%"></i><i style="height:88%"></i><i style="height:96%"></i><i style="height:80%"></i><i style="height:62%"></i><i style="height:44%"></i></div>' +
        '</div>' + nav(2),

      top('This month', 'One bill. Autopay has it.') +
        '<div class="dl-jscreen-body"><span class="dl-jchip">Step 4 of 6</span>' +
        '<div class="dl-jbig">Autopay on</div><div class="dl-jsub">Due in 12 days. Nothing for you to do.</div>' +
        row('This month', 'Your amount') + row('Status', 'Scheduled') +
        '</div>' + nav(3),

      top('Rewards', 'Earn Sun Points for helping the grid.') +
        '<div class="dl-jscreen-body"><span class="dl-jchip">Step 5 of 6</span>' +
        '<div class="dl-jbig">1,240</div><div class="dl-jsub">Sun Points earned</div>' +
        row('Grid events joined', '8') + row('Rewards ready', '2') +
        '</div>' + nav(4),

      top('Support', 'Ask Ray. Reach a person.') +
        '<div class="dl-jscreen-body"><span class="dl-jchip">Step 6 of 6</span>' +
        row('Ask Ray', 'Grounded answer') + row('Talk to support', 'A real person') + row('Your rep', 'One tap away') +
        '</div>' + nav(5)
    ];

    var current = -1;
    function setActive(i) {
      i = Math.max(0, Math.min(n - 1, i));
      if (i === current) { return; }
      current = i;
      steps.forEach(function (s, k) {
        s.classList.toggle('on', k === i);
        s.classList.toggle('done', k < i);
      });
      screen.innerHTML = SCREENS[i];
    }

    steps.forEach(function (s, i) {
      s.addEventListener('click', function () { setActive(i); });
      s.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown' && steps[i + 1]) { e.preventDefault(); steps[i + 1].focus(); setActive(i + 1); }
        else if (e.key === 'ArrowUp' && steps[i - 1]) { e.preventDefault(); steps[i - 1].focus(); setActive(i - 1); }
      });
    });

    setActive(0);

    if (reduceMotion) { return; } // interactive only; no scroll scrubbing

    // Scroll drives the active step and the fill line via the shared engine.
    engine.add(wrap, 'through', function (p) {
      setActive(Math.round(p * (n - 1)));
    });
  }

  /* -------------------------------------------------------------- */
  /* Ray mini-demo — plays once when it scrolls into view            */
  /* -------------------------------------------------------------- */
  function setupRayflow() {
    var flow = document.getElementById('dl-rayflow');
    if (!flow) { return; }
    if (reduceMotion || !('IntersectionObserver' in window)) { flow.classList.add('play'); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { flow.classList.add('play'); io.disconnect(); }
      });
    }, { threshold: 0.4 });
    io.observe(flow);
  }

  /* -------------------------------------------------------------- */
  function init() {
    var docEl = document.documentElement;
    try {
      setupReveals();
      docEl.classList.add('dl-js');

      var engine = makeEngine();

      var dossier = document.querySelector('.dl-dossier');
      if (dossier) { engine.add(dossier, 'sticky', dossierApply(dossier)); }
      var build = document.querySelector('.dl-build');
      if (build) { engine.add(build, 'enter', buildApply(build)); }
      var payout = document.querySelector('.dl-payout');
      if (payout) { engine.add(payout, 'enter', payoutApply(payout)); }
      var bill = document.querySelector('.dl-bill');
      if (bill) { engine.add(bill, 'enter', billApply(bill)); }
      var two = document.querySelector('.dl-two');
      if (two) { engine.add(two, 'sticky', null); }

      setupJourney(engine);

      var chapterUpdate = setupChapters();
      if (chapterUpdate) { engine.addUpdate(chapterUpdate); }

      if (reduceMotion) { engine.settleFinal(); } else { engine.start(); }

      setupRayflow();
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
