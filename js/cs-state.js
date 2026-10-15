/* ==========================================================================
   Case-study figure state (v3). One pure reducer and one fictional fixture
   for the single interactive figure on the Ray page: an exported file
   compared with a saved sheet that reruns its query when it is reopened.
   No DOM, no timers, no network. Every record here is invented for the
   portfolio. Loaded in the browser as window.CSState and in Node (tests)
   via module.exports.
   ========================================================================== */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.CSState = factory(); }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function clone(value) { return JSON.parse(JSON.stringify(value)); }

  /* The file is a snapshot of the query result when it was exported. The
     sheet is the same query, rerun when it is reopened. Between the export
     and the reopen, one fictional record changed status and one was added.
     A repeat reopen finds nothing new. Reset returns the sheet to the
     as-saved state so the two can be compared again. */
  var fixture = {
    title: 'Installation reviews',
    fileName: 'installation-reviews.csv',
    savedAt: 'Sep 2, 9:40 AM',
    reopenedAt: 'Sep 5, 4:12 PM',
    saved: [
      { id: 'orchard', project: 'Orchard House', status: 'Rejected', tone: 'warn', note: 'Photo is missing' },
      { id: 'juniper', project: 'Juniper House', status: 'Rejected', tone: 'warn', note: 'Document needs review' }
    ],
    current: [
      { id: 'orchard', project: 'Orchard House', status: 'Rejected', tone: 'warn', note: 'Photo is missing' },
      { id: 'juniper', project: 'Juniper House', status: 'Approved', tone: 'ok', note: 'Reviewed Sep 4', change: 'changed' },
      { id: 'cedar', project: 'Cedar House', status: 'Rejected', tone: 'warn', note: 'Roof measurement is unclear', change: 'added' }
    ]
  };

  var sheet = {
    fixture: fixture,
    init: function () { return { opened: false, reopens: 0 }; },
    reduce: function (state, action) {
      switch (action && action.type) {
        case 'reopen':
          return { opened: true, reopens: state.reopens + 1 };
        case 'reset':
          if (!state.opened && state.reopens === 0) { return state; }
          return sheet.init();
        default:
          return state;
      }
    },
    /* the rows the sheet shows for a state; the file's rows never change */
    rows: function (state) { return clone(state.opened ? fixture.current : fixture.saved); },
    fileRows: function () { return clone(fixture.saved); },
    /* what changed between the file and the sheet, in reading order */
    changes: function (state) {
      if (!state.opened) { return []; }
      return fixture.current.filter(function (r) { return r.change; }).map(function (r) {
        return r.change === 'added' ? r.project + ' added' : r.project + ' changed to ' + r.status;
      });
    },
    /* the visible time line and summary under the sheet title */
    when: function (state) { return state.opened ? 'Reopened ' + fixture.reopenedAt : 'Saved ' + fixture.savedAt; },
    summary: function (state) {
      if (!state.opened) { return 'Same records as the exported file.'; }
      var changed = fixture.current.filter(function (r) { return r.change === 'changed'; }).length;
      var added = fixture.current.filter(function (r) { return r.change === 'added'; }).length;
      var parts = [];
      if (changed) { parts.push(changed + ' record' + (changed === 1 ? '' : 's') + ' changed'); }
      if (added) { parts.push(added + ' added'); }
      return parts.join(', ') + ' since the file was saved.';
    },
    /* one concise message for the live region after an action */
    message: function (state, action) {
      if (action === 'reopen') {
        if (state.reopens > 1) { return 'Reopened again. Nothing has changed since the last open. The exported file is unchanged.'; }
        return 'Reopened ' + fixture.reopenedAt + '. ' + sheet.changes(state).join('. ') + '. The exported file is unchanged.';
      }
      if (action === 'reset') { return 'Reset. The sheet shows the records as they were saved, the same as the file.'; }
      return '';
    },
    /* what to say when an action changed nothing: no new result is implied */
    unchanged: function (action) {
      if (action === 'reset') { return 'Nothing to reset. The sheet already shows the records as they were saved.'; }
      return '';
    }
  };

  return { sheet: sheet, _clone: clone };
});
