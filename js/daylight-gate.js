/* ==========================================================================
   Daylight case-study privacy gate — shared behavior for daylight.html + ray.html
   Static, client-side privacy screen. Not server authentication: the check runs
   entirely in the browser and only hides page markup that is already delivered.
   Unlocking one Daylight page unlocks the collection for the session via the
   shared sessionStorage key `dl-unlocked`. Honors reduced motion, no forced
   mobile autofocus, accessible error messaging. No network calls.
   ========================================================================== */
(function () {
  'use strict';

  var KEY = 'dl-unlocked';
  // SHA-256 of the shared collection password. The plaintext never appears here.
  var HASH = '0e3690809a8ee4fc9e8baf5d93346f92d0b0670be7e60266eb9f2224b05d3bf0';

  var gate = document.getElementById('dl-gate');
  if (!gate) { return; }

  var locked = document.documentElement.classList.contains('dl-locked');

  var form = document.getElementById('dl-gate-form');
  var input = document.getElementById('dl-pass');
  var err = document.getElementById('dl-err');

  var reduceMotion = false;
  try {
    reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) { reduceMotion = false; }

  function reveal() {
    document.documentElement.classList.remove('dl-locked');
    if (reduceMotion) {
      gate.parentNode && gate.parentNode.removeChild(gate);
      window.scrollTo(0, 0);
      return;
    }
    gate.classList.add('dl-bye');
    window.setTimeout(function () {
      gate.parentNode && gate.parentNode.removeChild(gate);
    }, 450);
    window.scrollTo(0, 0);
  }

  function unlock() {
    try { sessionStorage.setItem(KEY, '1'); } catch (e) {}
    reveal();
  }

  // Already unlocked in another Daylight page this session: clear the gate quietly.
  if (!locked) {
    if (gate.parentNode) { gate.parentNode.removeChild(gate); }
    return;
  }

  function fail() {
    if (err) {
      err.textContent = 'That is not it. Try again.';
      err.classList.add('on');
    }
    if (input) { input.select(); }
  }

  function toHex(buf) {
    return Array.prototype.map.call(new Uint8Array(buf), function (b) {
      return b.toString(16).padStart(2, '0');
    }).join('');
  }

  function check() {
    var v = input ? input.value : '';
    if (!v) { return; }
    if (window.crypto && window.crypto.subtle && window.TextEncoder) {
      window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(v)).then(function (buf) {
        if (toHex(buf) === HASH) { unlock(); } else { fail(); }
      }).catch(function () { fail(); });
    } else {
      // No SubtleCrypto (very old / insecure context): cannot verify, do not reveal.
      fail();
    }
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      check();
    });
  }
  if (input) {
    input.addEventListener('input', function () {
      if (err) { err.classList.remove('on'); err.textContent = ''; }
    });
    // No forced autofocus on touch devices (avoids a jarring keyboard pop on mobile).
    try {
      if (window.matchMedia && window.matchMedia('(pointer: fine)').matches) {
        window.setTimeout(function () { input.focus(); }, 60);
      }
    } catch (e) {}
  }
})();
