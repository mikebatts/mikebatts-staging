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
  function init() {
    setupReveals();
    setupVideo('dl-cover-video');
    setupVideo('dl-ray-video');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
