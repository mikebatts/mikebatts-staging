/* ==========================================================================
   Ray demo controller (v1). Wires ray-demo.html to the pure state in
   ray-demo-state.js. Everything visible is rendered from state with
   textContent, never HTML. Answers arrive in short chunks on a timer
   group that Stop, Start over and leaving the page clear; a generation
   counter makes a late timer harmless. Details (a source, the saved
   sheet, the reply draft, the support request) are history entries, so
   Back means the same thing from the top bar and from the browser; each
   entry is stamped with the conversation's session token, so an entry
   from before Start over or a reload of another conversation is never
   reopened. The conversation and the draft live in versioned
   sessionStorage for this tab only. No network, no model, nothing sent
   anywhere.
   ========================================================================== */
(function () {
  'use strict';
  var S = window.DLShared, D = window.RayDemoState;
  if (!S || !D) { return; }
  var $ = function (id) { return document.getElementById(id); };
  var slice = function (list) { return Array.prototype.slice.call(list || []); };
  var KEY = 'ray-demo-session-v1';
  var FIRST_DELAY = 520, NEXT_DELAY = 440;

  var el = {
    shell: $('rd-shell'), chat: $('rd-chat'), scroll: $('rd-scroll'), turns: $('rd-turns'), starters: $('rd-starters'),
    composer: $('rd-composer'), input: $('rd-input'), send: $('rd-send'), stop: $('rd-stop'), live: $('rd-live'), note: $('rd-note'),
    latest: $('rd-latest'), reset: $('rd-reset'), detail: $('rd-detail'), detailBack: $('rd-detail-back'),
    detailKind: $('rd-detail-kind'), detailTitle: $('rd-detail-title'), detailBody: $('rd-detail-body'), detailScroll: $('rd-detail-scroll')
  };
  for (var k in el) { if (!el[k]) { return; } }

  /* seen: chunk count per rendered turn, so growth means real new content;
     pendingBack: history.back() calls whose popstate has not arrived yet */
  var state = null, timers = S.timers(), gen = 0, nearBottom = true, detail = null, seen = {}, pendingBack = 0;
  var wide = null, fine = null;
  try { wide = window.matchMedia('(min-width: 900px)'); fine = window.matchMedia('(pointer: fine)'); } catch (e) {}
  function isWide() { return !!(wide && wide.matches); }

  /* ---------------- small DOM helpers: text only ---------------- */
  function make(tag, className, text) {
    var node = document.createElement(tag);
    if (className) { node.className = className; }
    if (text != null) { node.textContent = String(text); }
    return node;
  }
  function empty(node) { while (node.firstChild) { node.removeChild(node.firstChild); } }
  function button(className, label, data) {
    var b = make('button', className, label);
    b.type = 'button';
    Object.keys(data || {}).forEach(function (key) { b.setAttribute('data-' + key, data[key]); });
    return b;
  }
  function tag(tone, text) { return make('span', 'cs-tag' + (tone ? ' ' + tone : ''), text); }
  function announce(message) { S.announce(el.live, message); }
  function focusSafely(node) { if (node && node.isConnected) { try { node.focus({ preventScroll: true }); } catch (e) { try { node.focus(); } catch (e2) {} } } }

  /* ---------------- session storage: versioned, guarded ---------------- */
  function load() {
    var raw = null;
    try { raw = window.sessionStorage.getItem(KEY); } catch (e) { return null; }
    if (raw == null) { return null; }
    var s = D.hydrate(raw);
    if (!s) { try { window.sessionStorage.removeItem(KEY); } catch (e) {} }
    return s;
  }
  function save() { try { window.sessionStorage.setItem(KEY, D.serialize(state)); } catch (e) {} }
  function wipe() { try { window.sessionStorage.removeItem(KEY); } catch (e) {} }

  /* every conversation carries a session token; history entries for details
     are stamped with it, so only entries of this conversation can reopen */
  function token() { return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10); }
  function adopt(s) { if (!s.session) { s.session = token(); } return s; }

  function dispatch(action) {
    var previous = state;
    state = D.reduce(state, action);
    if (state === previous) { return false; }
    render();
    save();
    return true;
  }

  /* ---------------- timers: chunked answers, one generation at a time ---------------- */
  function cancelTimers() { gen++; timers.clear(); }
  function schedule(id, first) {
    var g = gen;
    timers.after(first ? FIRST_DELAY : NEXT_DELAY, function () {
      if (g !== gen) { return; }
      var turn = D.findTurn(state, id);
      if (!turn || turn.status !== 'sending') { return; }
      dispatch({ type: 'chunk', id: id });
      turn = D.findTurn(state, id);
      if (turn.status === 'sending') { schedule(id, false); }
      else { announce(D.turnSummary(turn)); }
    });
  }
  function start(id) {
    cancelTimers();
    schedule(id, true);
    announce('Checking sample project');
  }

  /* ---------------- the message scroller follows only near the bottom ---------------- */
  function atBottom() { var s = el.scroll; return (s.scrollHeight - s.scrollTop - s.clientHeight) <= 96; }
  function showLatest() { el.latest.hidden = false; }
  function hideLatest() { el.latest.hidden = true; }
  function follow(force) {
    if (force || nearBottom) { el.scroll.scrollTop = el.scroll.scrollHeight; nearBottom = true; hideLatest(); }
    else { showLatest(); }
  }
  el.scroll.addEventListener('scroll', function () { nearBottom = atBottom(); if (nearBottom) { hideLatest(); } }, { passive: true });
  el.latest.addEventListener('click', function () { follow(true); focusSafely(el.scroll); });

  /* ---------------- rendering: reconcile turns by id ---------------- */
  function syncKeyed(container, items, keyOf, create, update) {
    var existing = {};
    slice(container.children).forEach(function (node) { existing[node.getAttribute('data-key')] = node; });
    var keep = {};
    items.forEach(function (item, i) {
      var key = keyOf(item);
      keep[key] = true;
      var node = existing[key];
      if (!node) { node = create(item); node.setAttribute('data-key', key); }
      if (update) { update(node, item); }
      var at = container.children[i] || null;
      if (at !== node) { container.insertBefore(node, at); }
    });
    slice(container.children).forEach(function (node) { if (!keep[node.getAttribute('data-key')]) { container.removeChild(node); } });
  }

  function createTurn(turn) {
    var li = make('li', 'rd-turn');
    li.setAttribute('data-id', turn.id);
    if (turn.role === 'user') {
      li.classList.add('is-user');
      li.appendChild(make('p', 'rd-bubble', turn.text));
      return li;
    }
    li.classList.add('is-ray');
    if (turn.kind === 'note') { li.classList.add('is-note'); }
    li.setAttribute('data-kind', turn.kind);
    li.appendChild(make('p', 'rd-by', 'Ray'));
    li.appendChild(make('div', 'rd-answer'));
    if (turn.kind === 'note') { var quote = make('blockquote', 'rd-note-quote'); quote.hidden = true; li.appendChild(quote); }
    var progress = make('p', 'rd-progress', 'Checking sample project'); progress.hidden = true; li.appendChild(progress);
    var halt = make('div', 'rd-halt'); halt.hidden = true; halt.appendChild(make('p', '', '')); halt.appendChild(button('cs-btn ghost small', 'Retry', { retry: turn.id })); li.appendChild(halt);
    var sources = make('div', 'rd-sources'); sources.hidden = true; sources.appendChild(make('p', 'cs-label quiet rd-sources-k', 'Sources')); li.appendChild(sources);
    var actions = make('div', 'rd-actions cs-actions'); actions.hidden = true; li.appendChild(actions);
    var card = make('div', 'rd-card'); card.hidden = true; card.setAttribute('role', 'group'); li.appendChild(card);
    var examples = make('div', 'rd-examples'); examples.hidden = true; li.appendChild(examples);
    return li;
  }

  function updateTurn(li, turn) {
    if (turn.role === 'user') { return; }
    li.setAttribute('data-status', turn.status);
    var answer = li.querySelector('.rd-answer');
    while (answer.children.length > turn.chunks.length) { answer.removeChild(answer.lastChild); }
    for (var i = answer.children.length; i < turn.chunks.length; i++) { answer.appendChild(make('p', 'cs-enter', turn.chunks[i])); }
    var quote = li.querySelector('.rd-note-quote');
    if (quote) { quote.hidden = !turn.quote; quote.textContent = turn.quote || ''; }
    li.querySelector('.rd-progress').hidden = turn.status !== 'sending';
    var halt = li.querySelector('.rd-halt');
    var halted = turn.status === 'stopped' || turn.status === 'interrupted';
    halt.hidden = !halted;
    if (halted) {
      halt.querySelector('p').textContent = turn.status === 'interrupted'
        ? 'This answer was interrupted before it finished.'
        : (turn.chunks.length ? 'Stopped. The partial answer is kept.' : 'Stopped before an answer arrived.');
    }
    var sources = D.turnSources(turn), sourcesEl = li.querySelector('.rd-sources');
    sourcesEl.hidden = !sources.length;
    var chips = slice(sourcesEl.querySelectorAll('.rd-chip'));
    if (chips.length !== sources.length) {
      chips.forEach(function (c) { sourcesEl.removeChild(c); });
      sources.forEach(function (src) { sourcesEl.appendChild(button('rd-chip', src.title, { source: src.id })); });
    }
    var actions = D.turnActions(turn), actionsEl = li.querySelector('.rd-actions');
    actionsEl.hidden = !actions.length;
    syncKeyed(actionsEl, actions, function (a) { return a; }, function (a) {
      return button('cs-btn ' + (a === 'reply' ? 'small' : 'ghost small'), '', { action: a, turn: turn.id });
    }, function (node, a) {
      if (a === 'reply') { node.textContent = state.reply.posted ? 'Sample reply posted' : 'Review reply'; }
      if (a === 'support') { node.textContent = state.support.sent ? 'Sample request recorded' : 'Ask a person'; }
    });
    renderCard(li.querySelector('.rd-card'), turn);
    var examples = D.turnExamples(turn), examplesEl = li.querySelector('.rd-examples');
    examplesEl.hidden = !examples.length;
    if (examples.length && examplesEl.children.length !== examples.length) {
      empty(examplesEl);
      examples.forEach(function (text) { examplesEl.appendChild(button('rd-starter', text, { starter: '' })); });
    }
  }

  function path(parts) {
    var span = make('span', 'rd-path');
    parts.forEach(function (p, i) {
      if (i) { var sep = make('i', '', '›'); sep.setAttribute('aria-hidden', 'true'); span.appendChild(sep); }
      span.appendChild(document.createTextNode(p));
    });
    return span;
  }
  function row(label, value) {
    var div = make('div');
    div.appendChild(make('dt', '', label));
    var dd = make('dd');
    if (typeof value === 'string') { dd.textContent = value; } else { dd.appendChild(value); }
    div.appendChild(dd);
    return div;
  }
  function fileHead() {
    var head = make('div', 'rd-card-file');
    var doc = make('span', 'rd-doc'); doc.setAttribute('aria-hidden', 'true');
    for (var i = 0; i < 3; i++) { doc.appendChild(make('i')); }
    head.appendChild(doc);
    var name = make('span', 'rd-card-name');
    name.appendChild(make('b', '', D.sampleFile.name));
    name.appendChild(make('small', '', D.sampleFile.size + ' · ' + D.sampleFile.type + ' · sample metadata'));
    head.appendChild(name);
    return head;
  }

  /* one card per answer: the saved sheet, or the sample file in its three steps */
  function renderCard(card, turn) {
    var artifact = D.turnArtifact(turn), kind = D.turnCard(turn);
    if (!artifact && !kind) { card.hidden = true; return; }
    card.hidden = false;
    var M = D.sheet, sig;
    if (artifact === 'sheet') {
      sig = 'sheet:' + state.sheet.reopens;
      if (card.getAttribute('data-sig') === sig) { return; }
      card.setAttribute('data-sig', sig);
      card.setAttribute('aria-label', 'Saved sheet: ' + M.fixture.title);
      empty(card);
      card.appendChild(make('p', 'cs-label quiet rd-card-k', 'Saved sheet'));
      card.appendChild(make('p', 'rd-card-t', M.fixture.title));
      card.appendChild(make('p', 'rd-card-p', state.sheet.opened
        ? M.rows(state.sheet).length + ' records. ' + M.when(state.sheet) + '.'
        : M.fixture.saved.length + ' records when saved, ' + M.fixture.savedAt + '. Reruns its query each time it opens.'));
      var actions = make('div', 'cs-actions');
      actions.appendChild(button('cs-btn small', 'Open sheet', { open: 'sheet', turn: turn.id }));
      card.appendChild(actions);
      return;
    }
    sig = 'file:' + state.file.step;
    if (card.getAttribute('data-sig') === sig) { return; }
    card.setAttribute('data-sig', sig);
    card.setAttribute('aria-label', 'Sample attachment');
    empty(card);
    var step = state.file.step;
    card.appendChild(make('p', 'cs-label quiet rd-card-k', step === 'filed' ? 'Sample document' : 'Sample attachment'));
    card.appendChild(fileHead());
    if (step === 'offer') {
      card.appendChild(make('p', 'rd-card-p', 'This demo uses one sample bill. No file is read from your device.'));
      var offer = make('div', 'cs-actions');
      offer.appendChild(button('cs-btn small', 'Use sample attachment', { file: 'attach' }));
      card.appendChild(offer);
      return;
    }
    var rows = make('dl', 'rd-rows');
    rows.appendChild(row('Proposed destination', path(D.sampleFile.destination)));
    rows.appendChild(row('Status', step === 'filed' ? tag('ok', 'Filed in the sample project') : tag('', 'Waiting for your confirmation')));
    card.appendChild(rows);
    if (step === 'proposed') {
      card.appendChild(make('p', 'rd-card-p', 'Ray proposes. You decide. Confirming files the sample only within this page.'));
      var confirm = make('div', 'cs-actions');
      confirm.appendChild(button('cs-btn small rd-primary', 'File sample document', { file: 'confirm' }));
      confirm.appendChild(button('cs-btn ghost small', 'Cancel', { file: 'cancel' }));
      card.appendChild(confirm);
    } else {
      var done = make('p', 'rd-card-state', 'Filed locally in this demo. No file was uploaded.');
      done.tabIndex = -1;
      card.appendChild(done);
    }
  }

  /* the scroller follows only when content was actually added: a new turn,
     or a turn that has more chunks than the last time it was rendered */
  function renderTurns() {
    syncKeyed(el.turns, state.turns, function (t) { return t.id; }, createTurn, updateTurn);
    var grew = false, now = {};
    state.turns.forEach(function (t) {
      var count = t.chunks ? t.chunks.length : 0;
      if (!Object.prototype.hasOwnProperty.call(seen, t.id) || count > seen[t.id]) { grew = true; }
      now[t.id] = count;
    });
    seen = now;
    if (grew) { follow(false); }
  }
  function renderComposer() {
    var busy = D.busy(state);
    el.send.hidden = busy;
    el.stop.hidden = !busy;
    el.composer.setAttribute('data-busy', busy ? 'true' : 'false');
  }
  function render() { renderTurns(); renderComposer(); }

  /* ---------------- composer ---------------- */
  function autosize() {
    var ta = el.input;
    ta.style.height = 'auto';
    var cap = Math.max(96, Math.round((el.shell.clientHeight || window.innerHeight || 600) * 0.35));
    var h = ta.scrollHeight || 0;
    if (h) { ta.style.height = Math.min(h, cap) + 'px'; ta.style.overflowY = h > cap ? 'auto' : 'hidden'; }
    else { ta.style.overflowY = ''; }
  }
  /* a message the demo cannot send is refused in the open, and the draft
     stays exactly as typed; nothing is ever cut down and sent */
  function showNote(message) {
    el.note.textContent = message;
    el.note.hidden = false;
    el.input.setAttribute('aria-invalid', 'true');
    el.input.setAttribute('aria-describedby', 'rd-note');
    announce(message);
  }
  function hideNote() {
    if (el.note.hidden) { return; }
    el.note.hidden = true;
    el.note.textContent = '';
    el.input.removeAttribute('aria-invalid');
    el.input.removeAttribute('aria-describedby');
  }
  function submit() {
    if (D.busy(state)) { return false; }
    var text = el.input.value;
    var check = D.checkMessage(text);
    if (!check.ok) {
      if (check.reason === 'long') {
        showNote('This message is ' + check.length + ' characters. The limit here is ' + D.limits.message + '. Shorten it and send again.');
        focusSafely(el.input);
      }
      return false;
    }
    if (!dispatch({ type: 'send', text: check.text })) { return false; }
    hideNote();
    el.input.value = '';
    autosize();
    var turn = state.turns[state.turns.length - 1];
    follow(true);
    start(turn.id);
    focusSafely(el.input);
    return true;
  }
  el.composer.addEventListener('submit', function (event) { event.preventDefault(); submit(); });
  el.input.addEventListener('input', function () { hideNote(); dispatch({ type: 'draft', text: el.input.value }); autosize(); });
  el.input.addEventListener('keydown', function (event) {
    if (event.key === 'Enter' && !event.shiftKey && !event.altKey && !event.ctrlKey && !event.metaKey && !event.isComposing && fine && fine.matches) {
      event.preventDefault();
      submit();
    }
  });
  el.stop.addEventListener('click', function () {
    if (!D.busy(state)) { return; }
    cancelTimers();
    dispatch({ type: 'stop' });
    announce('Stopped. The partial answer is kept.');
    focusSafely(el.send);
  });

  function useStarter(text) {
    el.input.value = text;
    dispatch({ type: 'draft', text: text });
    autosize();
    focusSafely(el.input);
  }

  /* ---------------- clicks inside the conversation ---------------- */
  el.chat.addEventListener('click', function (event) {
    var target = event.target && event.target.closest ? event.target.closest('button') : null;
    if (!target || !el.chat.contains(target)) { return; }
    if (target.hasAttribute('data-starter')) { useStarter(target.textContent); return; }
    if (target.hasAttribute('data-retry')) {
      var id = target.getAttribute('data-retry');
      if (dispatch({ type: 'retry', id: id })) { start(id); focusSafely(el.stop); }
      return;
    }
    if (target.hasAttribute('data-source')) { openDetail('source', target.getAttribute('data-source'), target); return; }
    if (target.getAttribute('data-open') === 'sheet') { openDetail('sheet', target.getAttribute('data-turn'), target); return; }
    if (target.hasAttribute('data-action')) { openDetail(target.getAttribute('data-action'), target.getAttribute('data-turn'), target); return; }
    if (target.hasAttribute('data-file')) {
      var step = target.getAttribute('data-file'), card = target.closest('.rd-card');
      if (step === 'attach' && dispatch({ type: 'file-attach' })) {
        announce('Sample attachment added. Review the proposed destination, then confirm.');
        focusSafely(card.querySelector('[data-file="confirm"]'));
      } else if (step === 'confirm' && dispatch({ type: 'file-confirm' })) {
        announce(D.turnSummary(state.turns[state.turns.length - 1]));
        focusSafely(card.querySelector('.rd-card-state'));
      } else if (step === 'cancel' && dispatch({ type: 'file-cancel' })) {
        announce('Sample attachment removed. Nothing was filed.');
        focusSafely(card.querySelector('[data-file="attach"]'));
      }
    }
  });

  /* ---------------- start over: state, timers, storage, history ---------------- */
  el.reset.addEventListener('click', function () {
    var had = state.turns.length || state.draft || state.reply.posted || state.file.step !== 'offer' || state.support.sent || state.sheet.reopens;
    cancelTimers();
    if (detail) { closeDetail(false); }
    state = adopt(D.init());
    wipe();
    seen = {};
    slice(el.turns.querySelectorAll('.rd-card')).forEach(function (c) { c.removeAttribute('data-sig'); });
    render();
    el.input.value = '';
    hideNote();
    autosize();
    hideLatest();
    announce(had ? 'Conversation cleared. Nothing was kept.' : 'Nothing to clear yet.');
    focusSafely(el.reset);
  });

  /* ---------------- details: source, sheet, reply, support ---------------- */
  function questionBefore(turnId) {
    var idx = -1;
    state.turns.forEach(function (t, i) { if (t.id === turnId) { idx = i; } });
    for (var i = idx - 1; i >= 0; i--) { if (state.turns[i].role === 'user') { return state.turns[i].text; } }
    return D.starters[0];
  }

  function buildSource(id) {
    var src = D.sources[id];
    if (!src) { return null; }
    var body = make('div', 'rd-detail-content');
    body.appendChild(make('p', 'rd-detail-where', src.where));
    var quote = make('blockquote', 'rd-excerpt');
    quote.appendChild(make('p', '', src.excerpt));
    quote.appendChild(make('cite', '', 'Supporting excerpt, ' + src.title));
    body.appendChild(quote);
    if (src.context) {
      var ctx = make('div', 'rd-context');
      ctx.appendChild(make('p', 'cs-label quiet', 'In context'));
      src.context.forEach(function (sentence) {
        var p = make('p');
        if (sentence === src.excerpt) { p.appendChild(make('mark', '', sentence)); } else { p.textContent = sentence; }
        ctx.appendChild(p);
      });
      body.appendChild(ctx);
    }
    if (src.rows) {
      var list = make('ul', 'rd-record');
      list.setAttribute('aria-label', 'Project requirements in the sample record');
      src.rows.forEach(function (r) {
        var li = make('li');
        li.appendChild(make('span', '', r.label));
        li.appendChild(tag(r.tone, r.value));
        list.appendChild(li);
      });
      body.appendChild(list);
    }
    body.appendChild(make('p', '', 'Sample source. Every record in this demo is fictional.'));
    return { kind: 'Source', title: src.title, body: body };
  }

  function sheetRowsInto(list) {
    var M = D.sheet;
    empty(list);
    M.rows(state.sheet).forEach(function (r) {
      var li = make('li', r.change ? 'is-' + r.change : '');
      li.appendChild(make('b', '', r.project));
      li.appendChild(tag(r.tone, r.status));
      li.appendChild(make('small', '', r.note));
      if (r.change) { li.appendChild(make('i', 'rd-sheet-mark', r.change === 'added' ? 'Added on reopen' : 'Changed on reopen')); }
      list.appendChild(li);
    });
  }
  function sheetMessage() {
    var M = D.sheet, s = state.sheet;
    if (!s.opened) { return 'Showing the records as they were saved.'; }
    if (s.reopens > 1) { return 'Reopened again. Nothing has changed since the last open.'; }
    return 'Reopened ' + M.fixture.reopenedAt + '. ' + M.changes(s).join('. ') + '.';
  }
  function buildSheet() {
    var M = D.sheet;
    var body = make('div', 'rd-detail-content');
    var head = make('div', 'rd-sheet-head');
    head.appendChild(make('p', 'rd-sheet-when', M.when(state.sheet)));
    head.appendChild(make('p', '', 'Sample data. The sheet reruns its query when you open it and never on its own.'));
    body.appendChild(head);
    var status = make('p', 'cs-status'); status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite'); status.textContent = sheetMessage();
    body.appendChild(status);
    var list = make('ul', 'rd-sheet-rows'); list.setAttribute('aria-label', 'Records in the sheet');
    sheetRowsInto(list);
    body.appendChild(list);
    var summary = make('p', 'rd-sheet-summary', M.summary(state.sheet));
    body.appendChild(summary);
    var actions = make('div', 'cs-actions');
    var reopen = button('cs-btn ghost small', 'Reopen the sheet', { sheet: 'reopen' });
    actions.appendChild(reopen);
    body.appendChild(actions);
    body.appendChild(make('p', '', 'Cells are not editable here. The exported file from the case study is not part of this demo.'));
    reopen.addEventListener('click', function () {
      dispatch({ type: 'sheet-open' });
      head.firstChild.textContent = M.when(state.sheet);
      sheetRowsInto(list);
      summary.textContent = M.summary(state.sheet);
      S.announce(status, sheetMessage());
    });
    return { kind: 'Saved sheet', title: M.fixture.title, body: body };
  }

  function buildReply(turnId) {
    var body = make('div', 'rd-detail-content');
    body.appendChild(make('p', '', 'Replying to the Orchard House note. A person reviews the reply before it is posted.'));
    body.appendChild(make('blockquote', 'rd-quote', 'The bill is uploaded. What still needs to happen before we can send the agreement?'));
    if (state.reply.posted) {
      body.appendChild(make('blockquote', 'rd-quote', state.reply.draft));
      var done = make('p'); done.appendChild(tag('ok', 'Sample reply posted')); body.appendChild(done);
      body.appendChild(make('p', '', 'Posted in this demo only. Title verification is still open until a reviewer completes it.'));
      return { kind: 'Reply', title: 'Reply to the note', body: body };
    }
    var label = make('label', 'rd-reply-label');
    label.appendChild(make('span', '', 'Reply, prefilled by Ray. Edit before posting.'));
    var ta = make('textarea', 'rd-reply-input');
    ta.id = 'rd-reply';
    ta.rows = 5;
    ta.maxLength = D.limits.reply;
    ta.value = state.reply.draft;
    label.appendChild(ta);
    body.appendChild(label);
    var problem = make('p', 'rd-field-note'); problem.id = 'rd-reply-note'; problem.hidden = true;
    body.appendChild(problem);
    function complain(message) {
      problem.textContent = message; problem.hidden = false;
      ta.setAttribute('aria-invalid', 'true'); ta.setAttribute('aria-describedby', 'rd-reply-note');
      announce(message); focusSafely(ta);
    }
    ta.addEventListener('input', function () {
      problem.hidden = true; ta.removeAttribute('aria-invalid'); ta.removeAttribute('aria-describedby');
      dispatch({ type: 'reply-draft', text: ta.value });
    });
    var actions = make('div', 'cs-actions');
    var post = button('cs-btn rd-primary', 'Post sample reply', { reply: 'post' });
    var cancel = button('cs-btn ghost', 'Cancel', { reply: 'cancel' });
    actions.appendChild(post); actions.appendChild(cancel);
    body.appendChild(actions);
    body.appendChild(make('p', '', 'Posting adds the reply to this sample conversation. The project requirement stays open.'));
    post.addEventListener('click', function () {
      /* what is posted is exactly what the editor shows: refused in the open
         when it is empty or over the limit, never cut down */
      var value = ta.value;
      if (!value.trim()) { complain('Write a reply before posting.'); return; }
      if (value.length > D.limits.reply) { complain('This reply is ' + value.length + ' characters. The limit here is ' + D.limits.reply + '. Shorten it and post again.'); return; }
      if (value !== state.reply.draft) { dispatch({ type: 'reply-draft', text: value }); }
      if (dispatch({ type: 'reply-post' })) {
        var last = state.turns[state.turns.length - 1];
        closeDetail(false);
        announce(D.turnSummary(last));
      }
    });
    cancel.addEventListener('click', function () { dispatch({ type: 'reply-cancel' }); closeDetail(false); });
    return { kind: 'Reply', title: 'Review the reply', body: body };
  }

  function buildSupport(turnId) {
    var body = make('div', 'rd-detail-content');
    if (state.support.sent) {
      body.appendChild(make('p', '', 'A sample support request was recorded in this demo.'));
      var rowsDone = make('dl', 'rd-rows');
      rowsDone.appendChild(row('Reference', state.support.reference + ' (sample)'));
      rowsDone.appendChild(row('Status', tag('ok', 'Recorded in this demo')));
      body.appendChild(rowsDone);
      body.appendChild(make('p', '', 'No request was sent to Intercom or to anyone. In the portal, the request would go to the support team after the person reviews it.'));
      return { kind: 'Support', title: 'Sample request recorded', body: body };
    }
    body.appendChild(make('p', '', 'The question is still open, so Ray offers a person. Review what would travel with the request.'));
    var rows = make('dl', 'rd-rows');
    rows.appendChild(row('To', D.support.recipient));
    rows.appendChild(row('Project', D.project.name));
    rows.appendChild(row('Question', questionBefore(turnId)));
    var inc = make('span'); inc.textContent = D.support.includes.join(', ');
    rows.appendChild(row('Includes', inc));
    body.appendChild(rows);
    var actions = make('div', 'cs-actions');
    var send = button('cs-btn rd-primary', 'Record sample request', { support: 'confirm' });
    var cancel = button('cs-btn ghost', 'Cancel', { support: 'cancel' });
    actions.appendChild(send); actions.appendChild(cancel);
    body.appendChild(actions);
    body.appendChild(make('p', '', 'This records a sample request in the demo only. Nothing is sent to Intercom or to any person.'));
    send.addEventListener('click', function () {
      if (dispatch({ type: 'support-confirm' })) {
        var last = state.turns[state.turns.length - 1];
        closeDetail(false);
        announce(D.turnSummary(last));
      }
    });
    cancel.addEventListener('click', function () { closeDetail(false); });
    return { kind: 'Support', title: 'Ask a person', body: body };
  }

  function buildDetail(kind, id) {
    if (kind === 'source') { return buildSource(id); }
    if (kind === 'sheet') { return D.sheet ? buildSheet() : null; }
    if (kind === 'reply') { return buildReply(id); }
    if (kind === 'support') { return buildSupport(id); }
    return null;
  }

  function syncInert() {
    var hide = !!detail && !isWide();
    if (hide) { el.chat.setAttribute('inert', ''); el.chat.setAttribute('aria-hidden', 'true'); }
    else { el.chat.removeAttribute('inert'); el.chat.removeAttribute('aria-hidden'); }
  }
  if (wide) {
    /* a side panel becoming a full-screen detail: focus that was in the
       conversation moves into the visible detail before the chat is inert */
    var onWide = function () {
      if (detail && !isWide() && el.chat.contains(document.activeElement)) { focusSafely(el.detailTitle); }
      syncInert();
    };
    if (wide.addEventListener) { wide.addEventListener('change', onWide); } else if (wide.addListener) { wide.addListener(onWide); }
  }

  /* a detail belongs to this conversation only when its turn is here and
     offers it (or, for a source, when a complete answer cites it) */
  function ownsDetail(kind, id) {
    if (kind === 'source') {
      return !!D.sources[id] && state.turns.some(function (t) { return D.turnSources(t).some(function (s) { return s.id === id; }); });
    }
    var turn = D.findTurn(state, id);
    if (!turn) { return false; }
    if (kind === 'sheet') { return D.turnArtifact(turn) === 'sheet'; }
    if (kind === 'reply' || kind === 'support') { return D.turnActions(turn).indexOf(kind) !== -1; }
    return false;
  }
  function entryFor(kind, id) { return { rd: 'detail', kind: kind, id: id, s: state.session }; }
  function ownsEntry(st) { return !!st && st.rd === 'detail' && st.s === state.session && ownsDetail(st.kind, st.id); }

  /* a trigger may be rebuilt while a detail is open (a card repaints when its
     state changes); remember what identified it so focus can return to its
     replacement */
  function triggerKey(node) {
    if (!node || !node.getAttribute) { return ''; }
    var parts = [];
    ['source', 'open', 'action', 'turn', 'retry', 'file'].forEach(function (name) {
      var v = node.getAttribute('data-' + name);
      if (v != null) { parts.push('[data-' + name + '="' + v.replace(/"/g, '') + '"]'); }
    });
    return parts.length ? 'button' + parts.join('') : '';
  }
  /* viaHistory: the entry already exists (popstate or load), so nothing is
     pushed; silent: on load, no focus is moved */
  function openDetail(kind, id, trigger, viaHistory, silent) {
    if (!ownsDetail(kind, id)) { return false; }
    if (kind === 'sheet' && !viaHistory) { dispatch({ type: 'sheet-open' }); }
    var content = buildDetail(kind, id);
    if (!content) { return false; }
    if (!detail) { detail = { scrollTop: el.scroll.scrollTop, trigger: trigger || null, key: triggerKey(trigger), pushed: false }; }
    else if (trigger) { detail.trigger = trigger; detail.key = triggerKey(trigger); }
    detail.kind = kind; detail.id = id;
    if (viaHistory) { detail.pushed = true; }
    else if (pendingBack > 0) { detail.pushed = false; /* the entry is pushed once the pending back has landed */ }
    else {
      try {
        if (!detail.pushed) { window.history.pushState(entryFor(kind, id), ''); detail.pushed = true; }
        else { window.history.replaceState(entryFor(kind, id), ''); }
      } catch (e) {}
    }
    el.detailKind.textContent = content.kind;
    el.detailTitle.textContent = content.title;
    empty(el.detailBody);
    el.detailBody.appendChild(content.body);
    el.detail.hidden = false;
    el.detail.classList.remove('is-entering');
    void el.detail.offsetWidth;
    el.detail.classList.add('is-entering');
    el.shell.setAttribute('data-view', 'detail');
    syncInert();
    el.detailScroll.scrollTop = 0;
    if (!silent) { focusSafely(el.detailTitle); }
    return true;
  }

  function closeDetail(viaHistory) {
    if (!detail) { return false; }
    var closing = detail;
    detail = null;
    el.detail.hidden = true;
    el.detail.classList.remove('is-entering');
    empty(el.detailBody);
    el.shell.setAttribute('data-view', 'chat');
    syncInert();
    if (!isWide()) { el.scroll.scrollTop = closing.scrollTop; }
    nearBottom = atBottom();
    if (!viaHistory && closing.pushed) { try { window.history.back(); pendingBack++; } catch (e) {} }
    var target = (closing.trigger && closing.trigger.isConnected) ? closing.trigger : null;
    if (!target && closing.key) { target = el.turns.querySelector(closing.key); }
    focusSafely(target || el.scroll);
    return true;
  }

  el.detailBack.addEventListener('click', function () { closeDetail(false); });
  el.detail.addEventListener('keydown', function (event) { if (event.key === 'Escape' && detail) { event.preventDefault(); closeDetail(false); } });
  window.addEventListener('popstate', function (event) {
    var st = event.state && event.state.rd ? event.state : null;
    if (pendingBack > 0) {
      /* the back from a close has landed. A detail opened in the meantime
         keeps the screen and gets its own entry now, on top of wherever the
         browser landed; otherwise the landed entry is handled as usual. */
      pendingBack--;
      if (detail && !detail.pushed) { try { window.history.pushState(entryFor(detail.kind, detail.id), ''); detail.pushed = true; } catch (e) {} return; }
    }
    if (st && st.rd === 'detail') {
      if (ownsEntry(st)) {
        if (!detail || detail.kind !== st.kind || detail.id !== st.id) { openDetail(st.kind, st.id, null, true); }
      } else {
        /* an entry from another conversation (before Start over, or another
           session): show the chat and let the entry mean the chat */
        closeDetail(true);
        try { window.history.replaceState({ rd: 'chat' }, ''); } catch (e) {}
      }
    } else { closeDetail(true); }
  });

  /* ---------------- leaving, returning, the keyboard ---------------- */
  window.addEventListener('pagehide', function () {
    cancelTimers();
    if (D.busy(state)) { state = D.reduce(state, { type: 'interrupt' }); render(); }
    save();
  });

  function setupViewport() {
    var vv = window.visualViewport;
    if (!vv) { return; }
    var pending = false;
    function apply() {
      pending = false;
      var full = window.innerHeight || 0, h = vv.height || 0, top = vv.offsetTop || 0, scale = vv.scale || 1;
      if (scale > 1.01 || !h || (Math.abs(full - h) < 2 && top < 1)) { el.shell.style.height = ''; el.shell.style.top = ''; return; }
      el.shell.style.height = Math.round(h) + 'px';
      el.shell.style.top = Math.round(top) + 'px';
      if (nearBottom) { el.scroll.scrollTop = el.scroll.scrollHeight; }
    }
    function schedule() { if (pending) { return; } pending = true; window.requestAnimationFrame(apply); }
    vv.addEventListener('resize', schedule);
    vv.addEventListener('scroll', schedule);
  }

  /* ---------------- init: hydrate, render, join history ---------------- */
  /* nothing is focused or blurred on entry: the composer never takes focus
     by itself, and whatever had focus (the gate's password field, say) keeps it */
  function init() {
    state = adopt(load() || D.init());
    render();
    el.input.value = state.draft;
    autosize();
    var hs = null;
    try { hs = window.history.state; } catch (e) {}
    if (ownsEntry(hs)) {
      detail = { scrollTop: 0, trigger: null, key: '', pushed: true };
      openDetail(hs.kind, hs.id, null, true, true);
    } else {
      try { window.history.replaceState({ rd: 'chat' }, ''); } catch (e) {}
    }
    follow(true);
    setupViewport();
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }

  window.RayDemo = {
    state: function () { return state; },
    pendingTimers: function () { return timers.pending(); },
    detail: function () { return detail ? { kind: detail.kind, id: detail.id, pushed: detail.pushed } : null },
    session: function () { return state ? state.session : null; },
    key: KEY
  };
})();
