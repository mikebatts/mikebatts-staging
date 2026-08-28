/* ==========================================================================
   Ray 2A case study — page behavior
   - scroll reveals (progressive, degrades to visible)
   - offscreen video pause (IntersectionObserver, optional)
   - illustrative demo: prompt -> narrate tool step -> settle on grounded answer
   - honors prefers-reduced-motion: no timers, results shown immediately, video static
   No network calls. Nothing here touches a backend.
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
    var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
    if (!reveals.length) { return; }

    // assign stagger indices within each reveal
    reveals.forEach(function (block) {
      var kids = block.querySelectorAll('.stagger');
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

    // safety: never leave content hidden
    setTimeout(function () {
      reveals.forEach(function (b) { b.classList.add('in'); });
    }, 4000);
  }

  /* -------------------------------------------------------------- */
  /* Video: pause offscreen, respect reduced motion                */
  /* -------------------------------------------------------------- */
  function setupHeroVideo() {
    var video = document.getElementById('ray-hero-video');
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
  /* Interactive demo                                               */
  /* -------------------------------------------------------------- */
  function setupDemo() {
    var demo = document.getElementById('ray-demo');
    if (!demo) { return; }

    var prompts = Array.prototype.slice.call(demo.querySelectorAll('.ray-prompt'));
    var answers = Array.prototype.slice.call(demo.querySelectorAll('.ray-answer'));
    var question = document.getElementById('ray-question');
    var working = document.getElementById('ray-working');
    var workingText = document.getElementById('ray-working-text');
    var presence = document.getElementById('ray-presence');
    var demoVideo = document.getElementById('ray-demo-video');
    var pending = null; // active timer id

    function showAnswer(id) {
      answers.forEach(function (a) {
        a.hidden = (a.getAttribute('data-answer') !== String(id));
      });
    }

    function freezeAvatar() {
      if (demoVideo) { try { demoVideo.pause(); } catch (e) {} }
      if (presence) { presence.textContent = ' · at rest'; }
    }

    function moveAvatar() {
      if (reduceMotion || !demoVideo) { return; }
      try {
        demoVideo.currentTime = 0;
        var p = demoVideo.play();
        if (p && typeof p.catch === 'function') { p.catch(function () {}); }
      } catch (e) {}
      if (presence) { presence.textContent = ' · working'; }
    }

    function select(btn) {
      var id = btn.getAttribute('data-prompt');
      var qText = btn.getAttribute('data-q');
      var workText = btn.getAttribute('data-work');

      if (pending) { clearTimeout(pending); pending = null; }

      // pressed state
      prompts.forEach(function (p) { p.setAttribute('aria-pressed', p === btn ? 'true' : 'false'); });

      // show the asked question
      if (question) { question.textContent = qText; question.hidden = false; }

      if (reduceMotion) {
        // no timed animation: settle immediately
        if (working) { working.hidden = true; }
        freezeAvatar();
        showAnswer(id);
        return;
      }

      // narrate the tool step, then settle
      answers.forEach(function (a) { a.hidden = true; });
      if (workingText) { workingText.textContent = workText; }
      if (working) { working.hidden = false; }
      moveAvatar();

      pending = setTimeout(function () {
        if (working) { working.hidden = true; }
        freezeAvatar();
        showAnswer(id);
        pending = null;
      }, 1150);
    }

    prompts.forEach(function (btn) {
      btn.addEventListener('click', function () { select(btn); });
    });

    // proposed-action confirm -> local "ready for human review" (no network)
    var confirmBtn = document.getElementById('ray-confirm');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', function () {
        var body = document.getElementById('ray-proposal-body');
        if (!body) { return; }
        body.innerHTML =
          '<div class="p-confirmed">' +
            '<span class="ok" aria-hidden="true">✓</span>' +
            '<span class="txt">' +
              '<strong>Ready for human review</strong>' +
              '<span>Recorded in this demo. Nothing was sent.</span>' +
            '</span>' +
          '</div>';
      });
    }

    // Under reduced motion, ensure the demo video is paused/static from the start.
    if (reduceMotion && demoVideo) {
      try { demoVideo.removeAttribute('autoplay'); demoVideo.pause(); } catch (e) {}
    }
  }

  /* -------------------------------------------------------------- */
  function init() {
    setupReveals();
    setupHeroVideo();
    setupDemo();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
