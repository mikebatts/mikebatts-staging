(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = false;
  var saveData = false;
  try { reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  try { saveData = !!(navigator.connection && navigator.connection.saveData); } catch (e) {}

  function setupViewport() {
    if (!window.visualViewport) { return; }
    function update() { root.style.setProperty('--dl-vvh', window.visualViewport.height + 'px'); }
    window.visualViewport.addEventListener('resize', update, { passive: true });
    update();
  }

  function setupNavigation() {
    var nav = document.getElementById('dl-nav');
    var progress = document.querySelector('.dl-progress span');
    function update() {
      if (nav) { nav.classList.toggle('is-scrolled', window.scrollY > 18); }
      if (progress) {
        var available = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.transform = 'scaleX(' + (available > 0 ? Math.min(1, window.scrollY / available) : 0) + ')';
      }
    }
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
  }

  function setupReveals() {
    var items = Array.prototype.slice.call(document.querySelectorAll('.dl-reveal'));
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
    }, { threshold: .08, rootMargin: '0px 0px -7% 0px' });
    items.forEach(function (item) { observer.observe(item); });
    window.setTimeout(function () { items.forEach(function (item) { item.classList.add('in'); }); }, 3200);
  }

  function setupHero() {
    var hero = document.querySelector('.dl-hero');
    var object = document.getElementById('dl-hero-object');
    if (!hero) { return; }
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () { hero.classList.add('is-in'); });
    });
    if (reduceMotion || !object || !window.gsap || !window.ScrollTrigger) { return; }
    try { window.gsap.registerPlugin(window.ScrollTrigger); } catch (e) { return; }
    if (window.innerWidth > 760) {
      window.gsap.fromTo(object.querySelector('.dl-project-window'),
        { scale: .965, rotateX: 1.4 },
        { scale: 1.015, rotateX: 0, ease: 'none', scrollTrigger: { trigger: object, start: 'top 92%', end: 'bottom 22%', scrub: .8 } }
      );
      window.gsap.to(object.querySelector('.dpw-orbit'), {
        rotate: 24, ease: 'none', scrollTrigger: { trigger: object, start: 'top bottom', end: 'bottom top', scrub: 1 }
      });
    }
  }

  function setupRay() {
    var stage = document.querySelector('.dl-ray-stage');
    var video = stage ? stage.querySelector('video') : null;
    if (video && (reduceMotion || saveData)) {
      try { video.removeAttribute('autoplay'); video.pause(); } catch (e) {}
    }
    if (reduceMotion || !stage || !window.gsap || !window.ScrollTrigger) { return; }
    try { window.gsap.registerPlugin(window.ScrollTrigger); } catch (e) { return; }
    window.gsap.to(stage.querySelector('.dl-ray-sun'), {
      y: -42, rotate: 8, ease: 'none', scrollTrigger: { trigger: stage, start: 'top bottom', end: 'bottom top', scrub: .9 }
    });
    window.gsap.fromTo(stage.querySelector('.dl-ray-chat'), { y: 38 }, {
      y: -18, ease: 'none', scrollTrigger: { trigger: stage, start: 'top 88%', end: 'bottom 18%', scrub: .7 }
    });
  }

  function setupOrigination() {
    var accordion = document.getElementById('dl-origin-accordion');
    if (!accordion) { return; }
    var items = Array.prototype.slice.call(accordion.children);
    function activate(item) {
      items.forEach(function (candidate) {
        var active = candidate === item;
        candidate.classList.toggle('is-active', active);
        var button = candidate.querySelector('button');
        if (button) { button.setAttribute('aria-expanded', active ? 'true' : 'false'); }
      });
    }
    items.forEach(function (item) {
      var button = item.querySelector('button');
      if (button) { button.addEventListener('click', function () { activate(item); }); }
      if (window.matchMedia('(min-width:1025px) and (hover:hover)').matches) {
        item.addEventListener('mouseenter', function () { activate(item); });
      }
    });

    if (reduceMotion || !window.gsap || !window.ScrollTrigger || window.innerWidth <= 1024) { return; }
    try { window.gsap.registerPlugin(window.ScrollTrigger); } catch (e) { return; }
    window.ScrollTrigger.create({
      trigger: accordion,
      start: 'top 42%',
      end: 'bottom 42%',
      onUpdate: function (self) {
        var index = Math.min(items.length - 1, Math.floor(self.progress * items.length));
        if (!items[index].classList.contains('is-active')) { activate(items[index]); }
      }
    });
  }

  function setupHome() {
    var buttons = Array.prototype.slice.call(document.querySelectorAll('[data-home-tab]'));
    var panels = Array.prototype.slice.call(document.querySelectorAll('[data-home-panel]'));
    var note = document.getElementById('dl-home-note');
    var copy = {
      overview: ['Overview', 'Live production, storage, and home use in one readable picture.'],
      energy: ['Energy', 'A clear breakdown of how the home produced, stored, and used energy.'],
      payments: ['Payments', 'Statements, autopay, and payment history without leaving the Daylight relationship.']
    };
    function activate(key) {
      buttons.forEach(function (button) {
        var active = button.getAttribute('data-home-tab') === key;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      panels.forEach(function (panel) { panel.classList.toggle('is-active', panel.getAttribute('data-home-panel') === key); });
      if (note && copy[key]) {
        note.querySelector('span').textContent = copy[key][0];
        note.querySelector('p').textContent = copy[key][1];
      }
    }
    buttons.forEach(function (button) { button.addEventListener('click', function () { activate(button.getAttribute('data-home-tab')); }); });
    if (reduceMotion || !window.gsap || !window.ScrollTrigger) { return; }
    try { window.gsap.registerPlugin(window.ScrollTrigger); } catch (e) { return; }
    var phone = document.querySelector('.dl-home-phone');
    var orbit = document.querySelector('.dl-home-orbit');
    if (phone) {
      window.gsap.fromTo(phone, { y: 42, scale: .97 }, { y: -18, scale: 1, ease: 'none', scrollTrigger: { trigger: phone, start: 'top bottom', end: 'bottom 20%', scrub: .8 } });
    }
    if (orbit) {
      window.gsap.to(orbit, { rotate: -28, ease: 'none', scrollTrigger: { trigger: orbit, start: 'top bottom', end: 'bottom top', scrub: 1 } });
    }
  }

  function init() {
    root.classList.add('js-on');
    setupViewport();
    setupNavigation();
    setupReveals();
    setupHero();
    setupRay();
    setupOrigination();
    setupHome();
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); }
  else { init(); }
})();
