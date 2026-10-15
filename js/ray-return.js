/* ==========================================================================
   Ray case study: return position for the demo (v1). Loaded only by
   ray.html. When the reader follows a Try Ray link, the article position
   is stored for this tab. When ray.html loads again from the demo, the
   position is restored once and the marker is removed. A cached history
   restore (pageshow.persisted) keeps the browser's own position and drops
   the marker. Nothing else is intercepted, no URL is rewritten, and the
   gate flag is never read or written. No em dashes.
   ========================================================================== */
(function () {
  'use strict';
  var KEY = 'ray-demo-return-v1';
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

  function jump(y) {
    var previous = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    window.scrollTo(0, y);
    root.style.scrollBehavior = previous;
  }
  function restore() {
    var m = marker();
    if (!m) { return; }
    if (Date.now() - m.t > MAX_AGE || m.y <= 0) { return; }
    var from = document.referrer || '';
    if (from && !/ray-demo\.html/.test(from)) { return; }
    if (root.classList.contains('dl-locked')) {
      /* the gate scrolls to the top when it lifts; restore right after it */
      if (!('MutationObserver' in window)) { return; }
      var mo = new MutationObserver(function () {
        if (root.classList.contains('dl-locked')) { return; }
        mo.disconnect();
        window.setTimeout(function () { jump(m.y); }, 0);
      });
      mo.observe(root, { attributes: true, attributeFilter: ['class'] });
      return;
    }
    jump(m.y);
  }

  window.addEventListener('pageshow', function (event) {
    if (event && event.persisted) { forget(); }
  });
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', restore); } else { restore(); }
})();
