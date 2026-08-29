/* ==========================================================================
   Daylight collection case study — page behavior
   - scroll reveals (progressive, degrades to fully visible)
   - hero cover video + Ray avatar loop: pause offscreen, static under reduced motion
   - honors prefers-reduced-motion: no timed reveals, videos held on their posters
   No network calls. Nothing here touches a backend. Page content works with JS off.
   ========================================================================== */
(function () {
  'use strict';

  var reduceMotion = false;
  try {
    reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) { reduceMotion = false; }

  /* -------------------------------------------------------------- */
  /* Scroll reveals                                                 */
  /* -------------------------------------------------------------- */
  function setupReveals() {
    var reveals = Array.prototype.slice.call(document.querySelectorAll('.dl-reveal'));
    if (!reveals.length) { return; }

    reveals.forEach(function (block) {
      var kids = block.querySelectorAll('.dl-stagger');
      for (var i = 0; i < kids.length; i++) {
        kids[i].style.setProperty('--i', i);
      }
    });

    if (reduceMotion || !('IntersectionObserver' in window)) {
      reveals.forEach(function (b) { b.classList.add('in'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -8% 0px' });

    reveals.forEach(function (b) { io.observe(b); });

    // safety net: never leave content hidden
    setTimeout(function () {
      reveals.forEach(function (b) { b.classList.add('in'); });
    }, 4500);
  }

  /* -------------------------------------------------------------- */
  /* Looping videos: static under reduced motion, paused offscreen  */
  /* -------------------------------------------------------------- */
  function setupVideo(id) {
    var video = document.getElementById(id);
    if (!video) { return; }

    if (reduceMotion) {
      try { video.removeAttribute('autoplay'); video.pause(); } catch (e) {}
      return; // poster stays; static identity
    }

    var tryPlay = function () {
      var p = video.play();
      if (p && typeof p.catch === 'function') { p.catch(function () {}); }
    };
    tryPlay();

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { tryPlay(); }
          else { try { video.pause(); } catch (e) {} }
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
    var targets = links.map(function (a) {
      var id = a.getAttribute('href').slice(1);
      return document.getElementById(id);
    });
    if (!bar && !links.length) { return; }

    var ticking = false;
    function update() {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var pct = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
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
      ticking = false;
    }
    function onScroll() {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
  }

  /* -------------------------------------------------------------- */
  /* Homeowner journey — an authored phone that advances by step    */
  /* -------------------------------------------------------------- */
  function setupJourney() {
    var stepsWrap = document.getElementById('dl-journey-steps');
    var screen = document.getElementById('dl-jscreen');
    if (!stepsWrap || !screen) { return; }
    var steps = Array.prototype.slice.call(stepsWrap.querySelectorAll('.dl-jstep'));
    if (!steps.length) { return; }

    function nav(active) {
      var dots = '';
      for (var i = 0; i < 6; i++) { dots += '<i class="' + (i === active ? 'on' : '') + '"></i>'; }
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
        '<div class="dl-jbig">$142</div><div class="dl-jsub">Due in 12 days · Autopay on</div>' +
        row('This month', '$142') + row('Status', 'Scheduled') +
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

    var current = 0;
    function setActive(i, scrollIntoView) {
      if (i < 0 || i >= SCREENS.length || i === current) {
        // still update pressed state even if same
      }
      current = i;
      steps.forEach(function (s, k) { s.classList.toggle('on', k === i); });
      screen.innerHTML = SCREENS[i];
    }

    steps.forEach(function (s, i) {
      // Native <button> gives us click on Enter/Space for free; add roving arrows.
      s.addEventListener('click', function () { setActive(i); });
      s.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown' && steps[i + 1]) { e.preventDefault(); steps[i + 1].focus(); setActive(i + 1); }
        else if (e.key === 'ArrowUp' && steps[i - 1]) { e.preventDefault(); steps[i - 1].focus(); setActive(i - 1); }
      });
    });

    // scroll-driven advance: activate the step crossing the viewport centre
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var idx = steps.indexOf(entry.target);
            if (idx > -1) { setActive(idx); }
          }
        });
      }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
      steps.forEach(function (s) { io.observe(s); });
    }
  }

  /* -------------------------------------------------------------- */
  function init() {
    var docEl = document.documentElement;
    try {
      // Configure the reveal observer and all its observations BEFORE enabling
      // the JS-only CSS. The runtime class is what tells the stylesheet to hide
      // .dl-reveal content until it scrolls in, so it must go on only once the
      // observer that will reveal that content is fully wired. If setupReveals
      // throws, the class is never added and content stays fully visible.
      setupReveals();

      // Reveals are armed — enable reveal motion + JS-only chrome.
      // Added at runtime (not in the head) so that if this script fails to load,
      // the CSS never hides .dl-reveal content and the page stays fully visible.
      docEl.classList.add('dl-js');

      setupChapters();
      setupJourney();
      setupVideo('dl-cover-video');
      setupVideo('dl-ray-video');
    } catch (e) {
      // Fail open: any init exception must never leave content stranded hidden.
      // Removing the runtime class restores the default fully-visible styling.
      docEl.classList.remove('dl-js');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
