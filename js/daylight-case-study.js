/* ==========================================================================
   Daylight case study — page behavior
   A field guide, not a scroll experience. Content is fully present in the HTML;
   JavaScript only enhances: it choreographs the hero load, reveals sections and
   data groups as they enter, draws the orange "current" line through the
   lifecycle and the payout chain, and plays the hero and Ray loops in view. The
   top reading current is CSS-native (scroll-driven animation), so no scroll or
   resize listeners live here. Everything degrades to a fully visible, settled
   page, and reduced motion shows the end state.
   No network calls. Nothing here touches a backend. No scroll hijacking.
   ========================================================================== */
(function () {
  'use strict';

  var reduceMotion = false;
  try {
    reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) { reduceMotion = false; }

  var hasIO = 'IntersectionObserver' in window;

  // Data Saver: treat like reduced motion — hold the poster, never autoplay video.
  var saveData = false;
  try {
    saveData = !!(navigator.connection && navigator.connection.saveData);
  } catch (e) { saveData = false; }

  /* -------------------------------------------------------------- */
  /* Hero load choreography — masthead, headline by line, copy,      */
  /* media, device. Pure CSS transitions; JS just flips the switch.  */
  /* -------------------------------------------------------------- */
  function setupHero() {
    var hero = document.querySelector('.dl-hero');
    if (!hero) { return; }
    if (reduceMotion) { hero.classList.add('hero-in'); return; }
    // next frame so the initial (hidden) state is committed before animating
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () { hero.classList.add('hero-in'); });
    });
    // safety net: never leave the hero mid-transition
    setTimeout(function () { hero.classList.add('hero-in'); }, 2600);
  }

  /* -------------------------------------------------------------- */
  /* Reveals and staggered groups — visible by default; motion       */
  /* only enhances                                                   */
  /* -------------------------------------------------------------- */
  function setupReveals() {
    var reveals = Array.prototype.slice.call(document.querySelectorAll('.dl-reveal, .dl-stagger'));
    if (!reveals.length) { return; }

    if (reduceMotion || !hasIO) {
      reveals.forEach(function (b) { b.classList.add('in'); });
      return;
    }

    var vh = window.innerHeight || 800;
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
  /* Current line — the lifecycle rail and the payout chain draw     */
  /* their orange fill once, when they scroll into view              */
  /* -------------------------------------------------------------- */
  function setupCurrents() {
    var currents = Array.prototype.slice.call(document.querySelectorAll('[data-current]'));
    if (!currents.length) { return; }

    if (reduceMotion || !hasIO) {
      currents.forEach(function (c) { c.classList.add('drawn'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('drawn'); io.unobserve(entry.target); }
      });
    }, { threshold: 0.25, rootMargin: '0px 0px -12% 0px' });
    currents.forEach(function (c) { io.observe(c); });

    // safety net: never leave the current undrawn
    setTimeout(function () { currents.forEach(function (c) { c.classList.add('drawn'); }); }, 3600);
  }

  /* -------------------------------------------------------------- */
  /* Ray exchange — the grounded turn arrives, ask then answer       */
  /* -------------------------------------------------------------- */
  function setupRayflow() {
    var flow = document.getElementById('dl-rayflow');
    if (!flow) { return; }
    if (reduceMotion || !hasIO) { flow.classList.add('show-ask', 'show-ans'); return; }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          flow.classList.add('show-ask');
          window.setTimeout(function () { flow.classList.add('show-ans'); }, 480);
          io.unobserve(flow);
        }
      });
    }, { threshold: 0.35 });
    io.observe(flow);

    setTimeout(function () { flow.classList.add('show-ask', 'show-ans'); }, 3600);
  }

  /* -------------------------------------------------------------- */
  /* Looping video: static under reduced motion, paused offscreen    */
  /* -------------------------------------------------------------- */
  function setupVideo(id) {
    var video = document.getElementById(id);
    if (!video) { return; }
    if (reduceMotion || saveData) { try { video.removeAttribute('autoplay'); video.pause(); } catch (e) {} return; }
    var tryPlay = function () { var p = video.play(); if (p && typeof p.catch === 'function') { p.catch(function () {}); } };
    tryPlay();
    if (hasIO) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { tryPlay(); } else { try { video.pause(); } catch (e) {} }
        });
      }, { threshold: 0.15 });
      io.observe(video);
    }
  }

  /* -------------------------------------------------------------- */
  function init() {
    var docEl = document.documentElement;
    try {
      setupReveals();
      docEl.classList.add('dl-js');
      setupHero();
      setupCurrents();
      setupRayflow();
      setupVideo('dl-hero-video');
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
