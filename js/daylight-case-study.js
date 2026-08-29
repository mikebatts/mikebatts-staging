(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = false;
  var saveData = false;
  try { reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  try { saveData = !!(navigator.connection && navigator.connection.saveData); } catch (e) {}

  function setupViewport() {
    if (!window.visualViewport) { return; }
    var update = function () {
      root.style.setProperty('--dl-vvh', window.visualViewport.height + 'px');
    };
    window.visualViewport.addEventListener('resize', update, { passive: true });
    update();
  }

  function setupNav() {
    var nav = document.getElementById('dl-nav');
    if (!nav) { return; }
    var update = function () { nav.classList.toggle('is-scrolled', window.scrollY > 18); };
    window.addEventListener('scroll', update, { passive: true });
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
    window.setTimeout(function () {
      items.forEach(function (item) { item.classList.add('in'); });
    }, 3600);
  }

  function setupHero() {
    var hero = document.querySelector('.dl-hero');
    if (!hero) { return; }
    if (reduceMotion) { hero.classList.add('hero-in'); return; }
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () { hero.classList.add('hero-in'); });
    });

    var gsap = window.gsap;
    var ScrollTrigger = window.ScrollTrigger;
    var stage = document.getElementById('dl-hero-stage');
    if (!gsap || !ScrollTrigger || !stage || window.innerWidth < 760) { return; }
    try { gsap.registerPlugin(ScrollTrigger); } catch (e) { return; }
    gsap.fromTo(stage.querySelector('.dl-hero-media'),
      { scale: 1 },
      { scale: 1.08, ease: 'none', scrollTrigger: { trigger: stage, start: 'top bottom', end: 'bottom top', scrub: .8 } }
    );
    gsap.to(stage.querySelector('.dl-energy-window'), {
      y: -34, ease: 'none', scrollTrigger: { trigger: stage, start: 'top 85%', end: 'bottom 15%', scrub: .7 }
    });
    gsap.to(stage.querySelector('.dl-hero-phone'), {
      y: -72, ease: 'none', scrollTrigger: { trigger: stage, start: 'top 85%', end: 'bottom 15%', scrub: .7 }
    });
  }

  function setupVideo(id) {
    var video = document.getElementById(id);
    if (!video) { return; }
    if (reduceMotion || saveData) {
      try { video.removeAttribute('autoplay'); video.pause(); } catch (e) {}
      return;
    }
    var play = function () {
      var promise;
      try { promise = video.play(); } catch (e) { return; }
      if (promise && promise.catch) { promise.catch(function () {}); }
    };
    play();
    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { play(); } else { try { video.pause(); } catch (e) {} }
        });
      }, { threshold: .12 });
      observer.observe(video);
    }
  }

  function setupRay() {
    var flow = document.getElementById('dl-rayflow');
    if (!flow) { return; }
    var answer = flow.querySelector('.drs-answer');
    if (reduceMotion || !answer || !('IntersectionObserver' in window)) { return; }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          if (window.gsap) {
            window.gsap.fromTo(answer, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: .72, delay: .25, ease: 'power3.out', clearProps: 'all' });
          }
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .12 });
    observer.observe(document.querySelector('.dl-ray-product') || flow);
  }

  function setupLifecycle() {
    var life = document.getElementById('dl-life');
    if (!life) { return; }
    var items = Array.prototype.slice.call(life.querySelectorAll('li'));
    var current = document.querySelector('.dl-life-current span');
    var activate = function (item) {
      items.forEach(function (candidate, index) {
        var active = candidate === item;
        candidate.classList.toggle('is-active', active);
        candidate.querySelector('button').setAttribute('aria-expanded', active ? 'true' : 'false');
        if (active && current) { current.style.transform = 'translateX(' + (index * 100) + '%)'; }
      });
    };
    items.forEach(function (item) {
      var button = item.querySelector('button');
      button.setAttribute('aria-expanded', item.classList.contains('is-active') ? 'true' : 'false');
      button.addEventListener('click', function () { activate(item); });
      if (window.matchMedia('(hover:hover)').matches) {
        item.addEventListener('mouseenter', function () { activate(item); });
      }
    });
  }

  function setupPhones() {
    var buttons = Array.prototype.slice.call(document.querySelectorAll('[data-phone]'));
    var phones = Array.prototype.slice.call(document.querySelectorAll('[data-phone-panel]'));
    if (!buttons.length) { return; }
    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        var index = button.getAttribute('data-phone');
        buttons.forEach(function (candidate) { candidate.classList.toggle('is-active', candidate === button); });
        phones.forEach(function (phone) { phone.classList.toggle('is-active', phone.getAttribute('data-phone-panel') === index); });
      });
    });
  }

  function setupWorkbench() {
    var scroller = document.getElementById('dl-workbench-scroll');
    var workbench = document.getElementById('dl-workbench');
    if (!scroller || !workbench) { return; }
    var buttons = Array.prototype.slice.call(workbench.querySelectorAll('[data-scene]'));
    var panels = Array.prototype.slice.call(workbench.querySelectorAll('[data-scene-panel]'));
    var current = 0;

    function show(index, animate) {
      index = Math.max(0, Math.min(panels.length - 1, index));
      if (index === current && panels[index].classList.contains('is-active')) { return; }
      current = index;
      buttons.forEach(function (button, buttonIndex) {
        var active = buttonIndex === index;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      panels.forEach(function (panel, panelIndex) {
        panel.classList.toggle('is-active', panelIndex === index);
      });
      if (animate && window.gsap && !reduceMotion) {
        window.gsap.fromTo(panels[index], { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: .7, ease: 'power3.out', clearProps: 'all' });
      }
    }

    buttons.forEach(function (button, index) {
      button.addEventListener('click', function () { show(index, true); });
    });
    show(0, false);

    var gsap = window.gsap;
    var ScrollTrigger = window.ScrollTrigger;
    if (!gsap || !ScrollTrigger || reduceMotion || window.innerWidth < 1025) { return; }
    try { gsap.registerPlugin(ScrollTrigger); } catch (e) { return; }
    scroller.classList.add('is-scroll-story');
    ScrollTrigger.create({
      trigger: scroller,
      start: 'top top+=84',
      end: 'bottom bottom',
      pin: workbench,
      pinSpacing: false,
      anticipatePin: 1,
      onUpdate: function (self) {
        var index = Math.min(panels.length - 1, Math.floor(self.progress * panels.length));
        show(index, index !== current);
      }
    });
    ScrollTrigger.refresh();
  }

  function init() {
    try {
      setupViewport();
      setupReveals();
      root.classList.add('dl-js');
      setupNav();
      setupHero();
      setupVideo('dl-hero-video');
      setupVideo('dl-ray-video');
      setupRay();
      setupLifecycle();
      setupPhones();
      setupWorkbench();
    } catch (e) {
      root.classList.remove('dl-js');
      document.querySelectorAll('.dl-reveal').forEach(function (item) { item.classList.add('in'); });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
