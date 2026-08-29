(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = false;
  try { reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  function setupViewport() {
    function update() {
      var h = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      root.style.setProperty('--vs-vh', h + 'px');
    }
    window.addEventListener('resize', update, { passive: true });
    if (window.visualViewport) { window.visualViewport.addEventListener('resize', update, { passive: true }); }
    update();
  }

  function setupProgress() {
    var bar = document.querySelector('.vs-progress span');
    if (!bar) { return; }
    var ticking = false;
    function update() {
      ticking = false;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var value = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      bar.style.transform = 'scaleX(' + value + ')';
    }
    function requestUpdate() {
      if (ticking) { return; }
      ticking = true;
      window.requestAnimationFrame(update);
    }
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate, { passive: true });
    update();
  }

  function setupProcess() {
    var wrap = document.querySelector('[data-process]');
    if (!wrap) { return; }
    var steps = Array.prototype.slice.call(wrap.querySelectorAll('[data-process-step]'));
    var visual = wrap.querySelector('[data-process-visual]');
    var index = wrap.querySelector('[data-process-index]');
    var name = wrap.querySelector('[data-process-name]');
    var labels = { scan: 'CT volume', unwrap: 'Digital surface', detect: 'Ink prediction', prove: 'Physical evidence' };

    function activate(key, position) {
      steps.forEach(function (step) { step.classList.toggle('is-active', step.getAttribute('data-process-step') === key); });
      if (visual) { visual.className = 'vs-stage-object is-' + key; }
      if (index) { index.textContent = String(position + 1).padStart(2, '0'); }
      if (name) { name.textContent = labels[key] || key; }
    }

    activate('scan', 0);
    if (window.innerWidth <= 760 || reduceMotion || !window.gsap || !window.ScrollTrigger) { return; }
    try { window.gsap.registerPlugin(window.ScrollTrigger); } catch (e) { return; }
    steps.forEach(function (step, i) {
      window.ScrollTrigger.create({
        trigger: step,
        start: 'top 52%',
        end: 'bottom 48%',
        onEnter: function () { activate(step.getAttribute('data-process-step'), i); },
        onEnterBack: function () { activate(step.getAttribute('data-process-step'), i); }
      });
    });
  }

  function setupAccordion() {
    var items = Array.prototype.slice.call(document.querySelectorAll('.vs-acc-item'));
    if (!items.length) { return; }
    function open(item) {
      items.forEach(function (candidate) {
        var active = candidate === item;
        candidate.classList.toggle('is-open', active);
        var button = candidate.querySelector('button');
        if (button) { button.setAttribute('aria-expanded', active ? 'true' : 'false'); }
      });
    }
    items.forEach(function (item) {
      var button = item.querySelector('button');
      if (button) { button.addEventListener('click', function () { open(item); }); }
      try {
        if (window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
          item.addEventListener('mouseenter', function () { open(item); });
        }
      } catch (e) {}
    });
  }

  function setupKnownToggle() {
    var wrap = document.querySelector('[data-known-toggle]');
    if (!wrap) { return; }
    var buttons = Array.prototype.slice.call(wrap.querySelectorAll('[data-known-view]'));
    var images = Array.prototype.slice.call(document.querySelectorAll('[data-known-image]'));
    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        var key = button.getAttribute('data-known-view');
        buttons.forEach(function (candidate) {
          var active = candidate === button;
          candidate.classList.toggle('is-active', active);
          candidate.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
        images.forEach(function (image) { image.classList.toggle('is-active', image.getAttribute('data-known-image') === key); });
      });
    });
  }

  function setupMotion() {
    if (reduceMotion || !window.gsap || !window.ScrollTrigger) { return; }
    var gsap = window.gsap;
    try { gsap.registerPlugin(window.ScrollTrigger); } catch (e) { return; }

    var hero = document.querySelector('.vs-hero');
    var art = document.querySelector('.vs-hero-art');
    if (hero && art) {
      gsap.to(art.querySelector('.vs-mountain-back'), { y: -70, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: .9 } });
      gsap.to(art.querySelector('.vs-mountain-front'), { y: -30, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: .75 } });
      gsap.to(art.querySelector('.vs-sun'), { y: 90, scale: 1.08, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 1 } });
      gsap.fromTo(art.querySelector('.vs-scan-line'), { y: -90 }, { y: 240, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: .55 } });
    }

    var maps = Array.prototype.slice.call(document.querySelectorAll('.vs-signal-map'));
    maps.forEach(function (map, i) {
      gsap.to(map, { y: (i + 1) * -42, rotate: i % 2 ? -2 : 2, ease: 'none', scrollTrigger: { trigger: '.vs-signal-field', start: 'top bottom', end: 'bottom top', scrub: .8 + i * .15 } });
    });

    var images = Array.prototype.slice.call(document.querySelectorAll('.vs-image-scale'));
    images.forEach(function (image) {
      gsap.fromTo(image, { scale: .88, opacity: .55 }, { scale: 1, opacity: 1, ease: 'none', scrollTrigger: { trigger: image, start: 'top 92%', end: 'center 58%', scrub: .7 } });
      gsap.to(image, { opacity: .32, ease: 'none', scrollTrigger: { trigger: image, start: 'bottom 32%', end: 'bottom top', scrub: .6 } });
    });

    var unread = document.querySelector('.vs-unread-field');
    var sweep = document.querySelector('.vs-unread-sweep');
    var points = Array.prototype.slice.call(document.querySelectorAll('.vs-unread-grid span'));
    if (unread && sweep) {
      gsap.fromTo(sweep, { y: -20 }, { y: function () { return unread.clientHeight + 20; }, ease: 'none', scrollTrigger: { trigger: unread, start: 'top 82%', end: 'bottom 20%', scrub: .65 } });
      points.forEach(function (point, i) {
        gsap.to(point, { opacity: .9, duration: .12, repeat: 1, yoyo: true, scrollTrigger: { trigger: unread, start: (18 + i * 8) + '% 70%', toggleActions: 'play none none reverse' } });
      });
    }

    var closeArt = document.querySelector('.vs-close-art');
    if (closeArt) {
      gsap.fromTo(closeArt, { scale: .82, opacity: .4 }, { scale: 1, opacity: 1, ease: 'none', scrollTrigger: { trigger: closeArt, start: 'top bottom', end: 'center 52%', scrub: .8 } });
    }
  }

  function setupReveals() {
    var selectors = ['.vs-intro>h2', '.vs-lede', '.vs-pivot-head', '.vs-closures-head', '.vs-cohort-intro', '.vs-known-head', '.vs-discovery-copy', '.vs-unread-copy', '.vs-now-item', '.vs-close-copy'];
    var items = Array.prototype.slice.call(document.querySelectorAll(selectors.join(',')));
    items.forEach(function (item) { item.classList.add('vs-reveal'); });
    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (item) { item.classList.add('in'); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .08, rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (item) { observer.observe(item); });
    window.setTimeout(function () { items.forEach(function (item) { item.classList.add('in'); }); }, 3500);
  }

  function init() {
    root.classList.add('js-on');
    setupViewport();
    setupProgress();
    setupProcess();
    setupAccordion();
    setupKnownToggle();
    setupReveals();
    setupMotion();
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();
