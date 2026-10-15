/* ==========================================================================
   Daylight case study: return position for the Ray demo (v2). Loaded only
   by the combined Daylight page. When the reader follows a Try Ray link,
   the article position is stored for this tab. When the page loads again
   from the demo, the position is restored once and the marker is removed;
   if the browser applies the demo's fragment after that (Chrome animates
   it from around load), the position is put back once more, unless the
   reader has already scrolled. A cached history restore (pageshow.persisted)
   keeps the browser's own position and drops the marker.
   Without a stored position, a deep link (an old Ray link forwarded here,
   or the demo's Back on a first visit) would be lost when the gate lifts,
   because the gate scrolls to the top. So behind the gate the fragment is
   honoured right after it lifts. Nothing else is intercepted, no URL is
   rewritten, and the gate flag is never read or written. No em dashes.
   ========================================================================== */
(function () {
  'use strict';
  var KEY = 'ray-demo-return-v2';
  var MAX_AGE = 30 * 60 * 1000;
  var root = document.documentElement;

  function remember() {
    try { window.sessionStorage.setItem(KEY, JSON.stringify({ y: Math.round(window.pageYOffset || root.scrollTop || 0), t: Date.now() })); } catch (e) {}
  }
  function forget() { try { window.sessionStorage.removeItem(KEY); } catch (e) {} }
  /* read the marker and remove it in the same step, so a marker is never
     replayed on a later visit, whatever it contains */
  function marker() {
    var raw = null;
    try { raw = window.sessionStorage.getItem(KEY); } catch (e) { return null; }
    if (!raw) { return null; }
    forget();
    var m = null;
    try { m = JSON.parse(raw); } catch (e) { m = null; }
    if (!m || typeof m.y !== 'number' || typeof m.t !== 'number') { return null; }
    return m;
  }

  document.addEventListener('click', function (event) {
    var link = event.target && event.target.closest ? event.target.closest('a[data-ray-demo]') : null;
    if (link) { remember(); }
  });

  function instantly(fn) {
    var previous = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    fn();
    root.style.scrollBehavior = previous;
  }
  function jump(y) { instantly(function () { window.scrollTo(0, y); }); }
  function toFragment() {
    var id = '';
    try { id = decodeURIComponent((window.location.hash || '').slice(1)); } catch (e) { return; }
    var target = id ? document.getElementById(id) : null;
    if (target && target.scrollIntoView) { instantly(function () { target.scrollIntoView({ block: 'start' }); }); }
  }
  /* run once the gate is gone: at once if it already is, otherwise right
     after the gate's own scroll to the top */
  function whenOpen(fn) {
    if (!root.classList.contains('dl-locked')) { fn(); return; }
    if (!('MutationObserver' in window)) { return; }
    var mo = new MutationObserver(function () {
      if (root.classList.contains('dl-locked')) { return; }
      mo.disconnect();
      window.setTimeout(fn, 0);
    });
    mo.observe(root, { attributes: true, attributeFilter: ['class'] });
  }
  /* a fragment in the URL may be applied after DOMContentLoaded, and with
     smooth scrolling Chrome animates it from around load. Until shortly
     after load, put the stored position back once if the page is moved
     away from it, unless the reader has moved since */
  function holdUntilLoad(y) {
    if (document.readyState === 'complete') { return; }
    var moved = false, done = false;
    var mark = function () { moved = true; };
    ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(function (name) { window.addEventListener(name, mark, { passive: true, once: true }); });
    var stop = function () { window.removeEventListener('scroll', putBack); };
    function putBack() {
      if (done || moved || root.classList.contains('dl-locked')) { return; }
      if (Math.abs((window.pageYOffset || 0) - y) > 4) { done = true; stop(); jump(y); }
    }
    window.addEventListener('scroll', putBack, { passive: true });
    window.addEventListener('load', function () { putBack(); window.setTimeout(stop, 1500); }, { once: true });
  }
  function restore() {
    var m = marker();
    var from = document.referrer || '';
    var usable = !!m && Date.now() - m.t <= MAX_AGE && m.y > 0 && (!from || /ray-demo\.html/.test(from));
    if (usable) {
      if (root.classList.contains('dl-locked')) { whenOpen(function () { jump(m.y); }); return; }
      jump(m.y);
      holdUntilLoad(m.y);
      return;
    }
    if (window.location.hash && root.classList.contains('dl-locked')) { whenOpen(toFragment); }
  }

  window.addEventListener('pageshow', function (event) {
    if (event && event.persisted) { forget(); }
  });
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', restore); } else { restore(); }
})();
