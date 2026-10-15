/* ==========================================================================
   Ray case study (v50). Sample confirmations, a saved sheet, and
   viewport-aware engineering diagrams. The sheet reruns its query when
   reopened. Without scripting the figure already shows the reopened sheet;
   with scripting it starts as saved so the reader can reopen it. Nothing
   is downloaded or sent. All records are fictional. The controls sit above
   the rows, so a new row never moves the tap target; both buttons stay
   enabled and keep focus; rows that did not change keep their nodes, so a
   repeat reopen neither rebuilds nor re-animates them; an action that
   changes nothing says so without pretending a new result arrived.
   ========================================================================== */
(function () {
  'use strict';
  var S = window.DLShared, C = window.CSState;
  if (!S || !C) { return; }
  var $ = function (id) { return document.getElementById(id); };
  var slice = function (list) { return Array.prototype.slice.call(list || []); };

  function setupSheet() {
    var figure = $('sheet-figure');
    if (!figure) { return; }
    var M = C.sheet, state = M.init();
    var el = {
      live: $('sheet-live'), rows: $('sheet-rows'), when: $('sheet-when'), summary: $('sheet-summary'),
      reopen: $('sheet-reopen'), reset: $('sheet-reset'), status: $('sheet-status'), actions: $('sheet-actions')
    };
    if (!el.rows || !el.reopen || !el.reset) { return; }

    function enter(li) {
      li.classList.remove('cs-enter');
      void li.offsetWidth; /* restart the short fade for a row that really changed */
      li.classList.add('cs-enter');
    }
    function paintRow(li, row) {
      li.className = row.change ? 'is-' + row.change : '';
      li.querySelector('b').textContent = row.project;
      var tag = li.querySelector('[data-status]');
      tag.className = 'cs-tag ' + row.tone;
      tag.textContent = row.status;
      li.querySelector('[data-note]').textContent = row.note;
      var mark = li.querySelector('.sh-mark');
      if (row.change) {
        if (!mark) { mark = document.createElement('i'); mark.className = 'sh-mark'; li.querySelector('td:last-child').appendChild(mark); }
        mark.textContent = row.change === 'added' ? 'Added on reopen' : 'Changed on reopen';
      } else if (mark) { mark.remove(); }
    }
    function buildRow(row) {
      var li = document.createElement('tr');
      li.setAttribute('data-row', row.id);
      var nameCell = document.createElement('td');
      nameCell.setAttribute('data-cell', 'Project');
      var statusCell = document.createElement('td');
      statusCell.setAttribute('data-cell', 'Review');
      var noteCell = document.createElement('td');
      noteCell.setAttribute('data-cell', 'Feedback');
      var name = document.createElement('b');
      var tag = document.createElement('span');
      tag.setAttribute('data-status', '');
      var note = document.createElement('small');
      note.setAttribute('data-note', '');
      nameCell.appendChild(name); statusCell.appendChild(tag); noteCell.appendChild(note);
      li.appendChild(nameCell); li.appendChild(statusCell); li.appendChild(noteCell);
      paintRow(li, row);
      return li;
    }
    function same(li, row) {
      var tag = li.querySelector('[data-status]'), note = li.querySelector('[data-note]');
      var change = (li.className.match(/is-(added|changed)/) || [])[1] || '';
      return !!tag && !!note && tag.textContent === row.status && note.textContent === row.note && change === (row.change || '');
    }
    /* reconcile the list against the rows for this state: remove rows that
       are gone, keep unchanged nodes in place, repaint changed ones, insert
       new ones where they belong */
    function renderRows() {
      var rows = M.rows(state), wanted = {};
      rows.forEach(function (row) { wanted[row.id] = true; });
      slice(el.rows.children).forEach(function (li) { if (!wanted[li.getAttribute('data-row')]) { el.rows.removeChild(li); } });
      var existing = {};
      slice(el.rows.children).forEach(function (li) { existing[li.getAttribute('data-row')] = li; });
      rows.forEach(function (row, i) {
        var li = existing[row.id];
        if (!li) { li = buildRow(row); enter(li); }
        else if (!same(li, row)) { paintRow(li, row); enter(li); }
        var at = el.rows.children[i] || null;
        if (at !== li) { el.rows.insertBefore(li, at); }
      });
    }

    function render(action) {
      el.live.setAttribute('data-state', state.opened ? 'reopened' : 'saved');
      renderRows();
      S.text(el.when, M.when(state));
      S.text(el.summary, M.summary(state));
      var message = M.message(state, action);
      if (message) { S.announce(el.status, message); }
    }

    function dispatch(type) {
      var previous = state;
      state = M.reduce(state, { type: type });
      if (state === previous) {
        var note = M.unchanged(type);
        if (note) { S.announce(el.status, note); }
        return;
      }
      render(type);
    }

    el.reopen.addEventListener('click', function () { dispatch('reopen'); });
    el.reset.addEventListener('click', function () { dispatch('reset'); });
    S.show(el.actions, true);
    render(null);
  }

  /* Direct, optional state controls. No next-button loops, automatic state
     changes, requests or mutations to the real product. Source-faithful
     samples are complete static reading content without JavaScript. */
  function setupFeatures() {
    var root = document.documentElement;
    var preference = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    var stages = [];
    function cancel(stage) {
      stage.animations.forEach(function (animation) { animation.cancel(); });
      stage.animations = [];
    }
    function cancelAll() { stages.forEach(cancel); }
    function canAnimate(element) {
      if (root.classList.contains('dl-locked') || document.hidden || (preference && preference.matches)) { return false; }
      var box = element.getBoundingClientRect();
      return box.width > 0 && box.height > 0 && box.bottom > 0 && box.top < window.innerHeight;
    }
    slice(document.querySelectorAll('[data-ray-feature]')).forEach(function (element) {
      var choices = slice(element.querySelectorAll('[data-feature-choice]'));
      var panels = slice(element.querySelectorAll('[data-feature-panel]'));
      var status = element.querySelector('[data-feature-status]');
      var controls = slice(element.querySelectorAll('[data-feature-controls]'));
      var messages;
      try { messages = JSON.parse(element.getAttribute('data-feature-messages') || '[]'); }
      catch (e) { return; }
      if (!choices.length || panels.length !== choices.length || !Array.isArray(messages)) { return; }
      var initial = Number(element.getAttribute('data-feature-default')) || 0;
      var stage = { element: element, animations: [], step: -1 };
      stages.push(stage);
      function render(step, announce) {
        if (step === stage.step || step < 0 || step >= panels.length) { return; }
        cancel(stage);
        stage.step = step;
        element.setAttribute('data-step', String(step));
        panels.forEach(function (panel, index) { panel.hidden = index !== step; });
        if (announce && status && typeof messages[step] === 'string') { status.textContent = messages[step]; }
        var panel = panels[step];
        // The action lives in the product card. Transfer keyboard focus out
        // of the hidden card without dragging the reader's viewport.
        if (announce) { panel.focus({ preventScroll: true }); }
        if (announce && canAnimate(element) && typeof panel.animate === 'function') {
          var animation = panel.animate([
            { opacity: 0.55, transform: 'translateY(12px)' },
            { opacity: 1, transform: 'translateY(0)' }
          ], { duration: 340, easing: 'cubic-bezier(.2,.75,.2,1)' });
          stage.animations.push(animation);
          animation.onfinish = function () { stage.animations = []; };
        }
      }
      choices.forEach(function (button) {
        button.addEventListener('click', function () { render(Number(button.getAttribute('data-feature-choice')), true); });
      });
      render(initial, false);
      controls.forEach(function (control) { control.hidden = false; });
    });
    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) {
            stages.forEach(function (stage) { if (stage.element === entry.target) { cancel(stage); } });
          }
        });
      });
      stages.forEach(function (stage) { observer.observe(stage.element); });
    }
    document.addEventListener('visibilitychange', function () { if (document.hidden) { cancelAll(); } });
    window.addEventListener('pagehide', cancelAll);
    window.addEventListener('resize', cancelAll, { passive: true });
    if (preference) {
      var onPreference = function () { if (preference.matches) { cancelAll(); } };
      if (preference.addEventListener) { preference.addEventListener('change', onPreference); }
      else if (preference.addListener) { preference.addListener(onPreference); }
    }
    if ('MutationObserver' in window) {
      new MutationObserver(function () { if (root.classList.contains('dl-locked')) { cancelAll(); } })
        .observe(root, { attributes: true, attributeFilter: ['class'] });
    }
  }

  function setupEngineering() {
    var section = document.querySelector('[data-ray-motion]');
    if (!section || !('IntersectionObserver' in window)) { return; }
    var root = document.documentElement, visible = false;
    var preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    function sync() {
      section.classList.toggle('is-running', visible && !document.hidden && !preference.matches && !root.classList.contains('dl-locked'));
    }
    new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; sync(); }, { threshold: 0.15 }).observe(section);
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('pagehide', function () { section.classList.remove('is-running'); });
    window.addEventListener('pageshow', sync);
    if (preference.addEventListener) { preference.addEventListener('change', sync); }
    else if (preference.addListener) { preference.addListener(sync); }
    new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ['class'] });
  }

  function init() { setupSheet(); setupFeatures(); setupEngineering(); }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();
