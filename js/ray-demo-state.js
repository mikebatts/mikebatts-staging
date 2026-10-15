/* ==========================================================================
   Ray demo state (v1). Pure fixtures and one reducer for the interactive
   Ray demo (ray-demo.html). No DOM, no timers, no network, no storage.
   Everything here is fictional: Orchard House, its records, the people,
   and every reference number. The three supported tasks are scripted;
   free text is matched against documented intents and anything else gets
   an honest boundary message. The saved-sheet fixture is the one the
   Ray case study already uses (CSState.sheet), so both show the same
   refresh. Loaded in the browser as window.RayDemoState and in Node
   (tests) via module.exports. No em dashes.
   ========================================================================== */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(require('./cs-state.js')); }
  else { root.RayDemoState = factory(root.CSState); }
})(typeof self !== 'undefined' ? self : this, function (CSState) {
  'use strict';

  var VERSION = 1;
  /* One limit for the composer: the textarea's maxlength, the draft and a
     send all use it, and an oversized send is refused, never cut. The reply
     editor has its own limit and the same rule. */
  var MAX_USER_TEXT = 2000;
  var MAX_REPLY = 4000;
  var sheetModule = CSState && CSState.sheet;

  function clone(value) { return JSON.parse(JSON.stringify(value)); }

  /* ---------------- the sample project ---------------- */
  var project = { name: 'Orchard House', stage: 'Origination' };

  var starters = [
    'What is holding up this project?',
    'Show installation reviews that need attention.',
    'Help me file a utility bill.'
  ];

  var sources = {
    guidance: {
      id: 'guidance',
      title: 'Origination guidance',
      where: 'Help center article',
      excerpt: 'An agreement can be sent once the utility bill and title verification are complete.',
      context: [
        'Before sending the agreement, confirm that the required documents are in place.',
        'An agreement can be sent once the utility bill and title verification are complete.',
        'Title verification is completed by a reviewer in the project. Ray can explain the step; a person performs it.'
      ]
    },
    record: {
      id: 'record',
      title: 'Orchard House project record',
      where: 'Project page, sample record',
      excerpt: 'Utility bill uploaded Sep 1. Title verification needs review. Agreement not sent.',
      rows: [
        { label: 'Utility bill', value: 'Uploaded Sep 1', tone: 'ok' },
        { label: 'Title verification', value: 'Needs review', tone: 'open' },
        { label: 'Agreement', value: 'Not sent', tone: '' }
      ]
    }
  };

  var sampleFile = {
    name: 'orchard-house-utility-bill.pdf',
    size: '412 KB',
    type: 'PDF',
    destination: ['Orchard House', 'Documents', 'Utility bill'],
    note: 'Sample metadata only. No file is read or uploaded.'
  };

  var replyDefault = 'Thanks for the update. The utility bill is in. Title verification still needs review before we can send the agreement. I will check with the reviewer on timing.';

  var support = {
    recipient: 'Daylight support (sample)',
    reference: 'SAMPLE-0427',
    includes: ['Orchard House', 'This conversation', 'The question above']
  };

  /* ---------------- scripted responses ----------------
     Each answer arrives in short chunks (whole sentences or paragraphs),
     never letter by letter. Sources and actions attach only when the
     answer is complete. */
  var responses = {
    blockers: {
      chunks: [
        'Title verification still needs review.',
        'The utility bill is uploaded and the agreement has not been sent. Origination guidance lists title verification as a requirement before an agreement can go out. A reviewer completes that step in the project.'
      ],
      sources: ['guidance', 'record'],
      actions: ['reply', 'support'],
      summary: 'Answer ready. Title verification still needs review. Two sources and two actions.'
    },
    reviews: {
      chunks: [
        'Two installation reviews needed attention when this sheet was saved.',
        'Orchard House was rejected because a photo is missing. Juniper House was rejected because a document needs review. The saved sheet reruns its query each time it opens.'
      ],
      sources: [],
      artifact: 'sheet',
      summary: 'Answer ready. Two reviews needed attention when the sheet was saved. One saved sheet to open.'
    },
    file: {
      chunks: [
        'I can file a utility bill for Orchard House.',
        'Attach the bill and I will propose where it belongs in the project. Nothing is added until you confirm.'
      ],
      sources: [],
      card: 'file',
      summary: 'Answer ready. Ray can file a sample utility bill after you confirm.'
    }
  };

  var boundary = {
    chunks: [
      'This demo does not answer that. Ray here is scripted for three questions about Orchard House: what is holding the project up, which installation reviews need attention, and filing a utility bill.'
    ],
    examples: starters,
    summary: 'Not supported in this demo. Three example questions are offered.'
  };

  /* ---------------- intent matching ----------------
     Deterministic and deliberately narrow. An intent matches only when the
     text carries both a task phrase and a term from the sample project's
     domain, or is one of a few short unambiguous phrases on its own. A
     common word by itself ("status", "review", "missing", "why is") is
     never enough, so "What is the status of my flight?" or "Review this
     poem" get the boundary, not project facts. A request that negates the
     task or asks for two tasks at once is unsupported too. */
  var intents = {
    blockers: {
      task: [/\bhold(ing|s)?\b[\s\S]{0,24}\bup\b/, /\bblock(ed|er|ers|ing|s)?\b/, /\bstuck\b/, /\bwaiting (on|for)\b/, /\bmissing\b/, /\bstatus\b/, /\bdelay(ed|s|ing)?\b/, /\bwhat('s| is| are)?( still)?( the)? (next|left|outstanding)\b/, /\bnext steps?\b/, /\bstill need/, /\bneeded before\b/, /\bbefore (we|i|you) (can )?send/, /\bnot (been )?sent\b/, /\bwhy (is|isn't|isnt|has|hasn't|hasnt|can't|cant|wasn't|wasnt|didn't|didnt)\b/],
      domain: [/\b(project|orchard|agreement|title|verification|reviewer|documents?|bill|utility)\b/],
      bare: [/^(so |ok |okay |and )?(what('s| is| are)?( the)? next( steps?)?|what (should|do|can) (i|we) do next|next steps?|what('s| is)( still)? (left|outstanding|holding (things|us) up))( now| please)?$/]
    },
    reviews: {
      task: [/\breviews\b/, /\binstall(ation)? review\b/, /\breview (sheet|queue|list)\b/, /\bneeds? attention\b/, /\brejected\b/],
      domain: [/\b(install(ation|ations|s|ed)?|rejected|attention|sheet|saved|project|orchard|juniper|cedar|photo)\b/],
      bare: [/^(show |list |open |see |the |my |all )*(installation |install )?reviews( sheet)?( please)?$/]
    },
    file: {
      task: [/\b(file|filing|upload|uploading|attach|attaching)\b[\s\S]*\b(bill|bills|document|documents|pdf|utility)\b/, /\b(bill|document|pdf)\b[\s\S]*\b(file|filed|upload|uploaded|attach|attached)\b/, /\b(add|adding|save|saving|store|storing|put)\b[\s\S]*\b(bill|bills|pdf)\b/],
      domain: [/\b(bill|bills|utility|pdf|orchard|project|attachment)\b/, /\b(file|filing|upload|uploading|attach|attaching)\b[\s\S]*\bdocuments?\b/, /\bdocuments?\b[\s\S]*\b(file|filed|upload|uploaded|attach|attached)\b/],
      bare: []
    }
  };
  var negated = /\b(don't|dont|do not|never|stop|cancel)\s+(\w+\s+){0,2}(fil(e|ing)|upload(ing)?|attach(ing)?|add(ing)?|sav(e|ing)|stor(e|ing)|show(ing)?|list(ing)?|open(ing)?|review(ing)?)\b/;

  function normalize(text) {
    return String(text || '').toLowerCase().replace(/[‘’]/g, "'").replace(/[^a-z0-9'\s]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function any(list, t) { return list.some(function (re) { return re.test(t); }); }

  function matchIntent(text) {
    var t = normalize(text);
    if (!t || negated.test(t)) { return null; }
    var matched = Object.keys(intents).filter(function (name) {
      var def = intents[name];
      return any(def.bare, t) || (any(def.task, t) && any(def.domain, t));
    });
    return matched.length === 1 ? matched[0] : null;
  }

  /* what a send needs: trimmed text, not empty, within the limit */
  function checkMessage(text) {
    var trimmed = String(text == null ? '' : text).replace(/\s+$/, '').replace(/^\s+/, '');
    if (!trimmed) { return { ok: false, reason: 'empty', length: 0 }; }
    if (trimmed.length > MAX_USER_TEXT) { return { ok: false, reason: 'long', length: trimmed.length }; }
    return { ok: true, reason: null, length: trimmed.length, text: trimmed };
  }

  function responseFor(intent) { return intent ? responses[intent] : boundary; }

  /* ---------------- state ---------------- */
  function init() {
    return {
      session: null,
      seq: 0,
      turns: [],
      draft: '',
      sheet: sheetModule ? sheetModule.init() : { opened: false, reopens: 0 },
      reply: { draft: replyDefault, posted: false },
      file: { step: 'offer' },
      support: { sent: false, reference: null }
    };
  }

  function sendingTurn(state) {
    for (var i = state.turns.length - 1; i >= 0; i--) { if (state.turns[i].status === 'sending') { return state.turns[i]; } }
    return null;
  }
  function busy(state) { return !!sendingTurn(state); }
  function findTurn(state, id) {
    for (var i = 0; i < state.turns.length; i++) { if (state.turns[i].id === id) { return state.turns[i]; } }
    return null;
  }
  function withTurns(state, turns, patch) {
    var next = clone(state);
    next.turns = turns;
    Object.keys(patch || {}).forEach(function (k) { next[k] = patch[k]; });
    return next;
  }
  /* a note is Ray's short record of a confirmed sample action; a quote
     carries the exact text the person confirmed, so it stays visible */
  function note(state, text, quote) {
    var n = { id: 'n' + (++state.seq), role: 'ray', kind: 'note', intent: null, status: 'complete', chunks: [text], total: 1 };
    if (quote) { n.quote = quote; }
    return n;
  }

  function reduce(state, action) {
    var type = action && action.type;
    var turns, turn, next, text;
    switch (type) {
      case 'draft':
        text = String(action.text == null ? '' : action.text).slice(0, MAX_USER_TEXT);
        if (text === state.draft) { return state; }
        next = clone(state); next.draft = text; return next;

      case 'send':
        var check = checkMessage(action.text);
        if (!check.ok || busy(state)) { return state; }
        text = check.text;
        next = clone(state);
        next.draft = '';
        var intent = matchIntent(text);
        var response = responseFor(intent);
        next.turns.push({ id: 'u' + (++next.seq), role: 'user', text: text, status: 'complete' });
        next.turns.push({ id: 'r' + (++next.seq), role: 'ray', kind: intent ? 'answer' : 'boundary', intent: intent, status: 'sending', chunks: [], total: response.chunks.length });
        return next;

      case 'chunk':
        turn = findTurn(state, action.id);
        if (!turn || turn.status !== 'sending') { return state; }
        next = clone(state);
        turn = findTurn(next, action.id);
        var all = responseFor(turn.intent).chunks;
        if (turn.chunks.length < all.length) { turn.chunks.push(all[turn.chunks.length]); }
        if (turn.chunks.length >= all.length) { turn.status = 'complete'; }
        return next;

      case 'stop':
        turn = sendingTurn(state);
        if (!turn) { return state; }
        next = clone(state);
        findTurn(next, turn.id).status = 'stopped';
        return next;

      case 'interrupt':
        turn = sendingTurn(state);
        if (!turn) { return state; }
        next = clone(state);
        findTurn(next, turn.id).status = 'interrupted';
        return next;

      case 'retry':
        turn = findTurn(state, action.id);
        if (!turn || (turn.status !== 'stopped' && turn.status !== 'interrupted') || busy(state)) { return state; }
        next = clone(state);
        findTurn(next, action.id).status = 'sending';
        return next;

      case 'reply-draft':
        text = String(action.text == null ? '' : action.text);
        if (state.reply.posted || text === state.reply.draft || text.length > MAX_REPLY) { return state; }
        next = clone(state); next.reply.draft = text; return next;

      case 'reply-cancel':
        if (state.reply.posted || state.reply.draft === replyDefault) { return state; }
        next = clone(state); next.reply.draft = replyDefault; return next;

      case 'reply-post':
        if (state.reply.posted || !state.reply.draft.trim()) { return state; }
        next = clone(state);
        next.reply.posted = true;
        next.turns.push(note(next, 'Sample reply posted to the Orchard House note. Title verification stays open until a reviewer completes it.', next.reply.draft));
        return next;

      case 'file-attach':
        if (state.file.step !== 'offer') { return state; }
        next = clone(state); next.file.step = 'proposed'; return next;

      case 'file-cancel':
        if (state.file.step !== 'proposed') { return state; }
        next = clone(state); next.file.step = 'offer'; return next;

      case 'file-confirm':
        if (state.file.step !== 'proposed') { return state; }
        next = clone(state);
        next.file.step = 'filed';
        next.turns.push(note(next, 'Sample bill filed under ' + sampleFile.destination.join(', ') + '.'));
        return next;

      case 'support-confirm':
        if (state.support.sent) { return state; }
        next = clone(state);
        next.support.sent = true;
        next.support.reference = support.reference;
        next.turns.push(note(next, 'Sample support request recorded. Reference ' + support.reference + '.'));
        return next;

      case 'sheet-open':
        if (!sheetModule) { return state; }
        next = clone(state);
        next.sheet = sheetModule.reduce(next.sheet, { type: 'reopen' });
        return next;

      case 'reset':
        return init();

      default:
        return state;
    }
  }

  /* ---------------- what the page reads from a turn ---------------- */
  function turnResponse(turn) { return turn.kind === 'note' ? null : responseFor(turn.intent); }
  function turnSources(turn) {
    if (turn.status !== 'complete' || turn.kind !== 'answer') { return []; }
    return responseFor(turn.intent).sources.map(function (id) { return sources[id]; });
  }
  function turnActions(turn) {
    if (turn.status !== 'complete') { return []; }
    var r = turnResponse(turn);
    return r && r.actions ? r.actions.slice() : [];
  }
  function turnArtifact(turn) {
    if (turn.status !== 'complete') { return null; }
    var r = turnResponse(turn);
    return r && r.artifact ? r.artifact : null;
  }
  function turnCard(turn) {
    if (turn.status !== 'complete') { return null; }
    var r = turnResponse(turn);
    return r && r.card ? r.card : null;
  }
  function turnExamples(turn) {
    if (turn.status !== 'complete' || turn.kind !== 'boundary') { return []; }
    return boundary.examples.slice();
  }
  function turnSummary(turn) {
    if (turn.kind === 'note') { return turn.chunks[0]; }
    return responseFor(turn.intent).summary;
  }

  /* ---------------- session serialization ----------------
     A turn that was still arriving is stored as interrupted, never as
     sending, so a reload offers Retry instead of a spinner that no timer
     will ever finish. The reducer never produces text over its limit, so
     stored text over a limit is tampering and hydrate rejects it. */
  function serialize(state) {
    var copy = clone(state);
    copy.turns = copy.turns.map(function (t) {
      if (t.status === 'sending') { t.status = 'interrupted'; }
      return t;
    });
    return JSON.stringify({ v: VERSION, state: copy });
  }

  var STATUSES = { complete: 1, sending: 1, stopped: 1, interrupted: 1 };
  function hydrate(raw) {
    var data = null;
    try { data = JSON.parse(raw); } catch (e) { return null; }
    if (!data || data.v !== VERSION || !data.state || typeof data.state !== 'object') { return null; }
    var s = data.state, base = init();
    if (!Array.isArray(s.turns) || typeof s.seq !== 'number') { return null; }
    var turns = [];
    for (var i = 0; i < s.turns.length; i++) {
      var t = s.turns[i];
      if (!t || typeof t.id !== 'string' || !STATUSES[t.status]) { return null; }
      if (t.role === 'user') {
        if (typeof t.text !== 'string' || t.text.length > MAX_USER_TEXT) { return null; }
        turns.push({ id: t.id, role: 'user', text: t.text, status: 'complete' });
      } else if (t.role === 'ray') {
        if (!Array.isArray(t.chunks)) { return null; }
        var kind = t.kind === 'note' ? 'note' : (t.kind === 'boundary' ? 'boundary' : 'answer');
        var intent = kind === 'answer' && responses[t.intent] ? t.intent : null;
        if (kind === 'answer' && !intent) { return null; }
        var all = kind === 'note' ? t.chunks : responseFor(intent).chunks;
        var chunks = kind === 'note' ? t.chunks.filter(function (c) { return typeof c === 'string'; }).slice(0, 1) : all.slice(0, Math.min(t.chunks.length, all.length));
        var status = t.status === 'sending' ? 'interrupted' : t.status;
        if (kind === 'note') { status = 'complete'; }
        if (status === 'complete' && chunks.length < all.length) { chunks = all.slice(); }
        var restored = { id: t.id, role: 'ray', kind: kind, intent: intent, status: status, chunks: chunks, total: all.length };
        if (kind === 'note' && typeof t.quote === 'string' && t.quote.length <= MAX_REPLY) { restored.quote = t.quote; }
        turns.push(restored);
      } else { return null; }
    }
    base.session = (typeof s.session === 'string' && s.session.length > 0 && s.session.length <= 64) ? s.session : null;
    base.seq = s.seq;
    base.turns = turns;
    base.draft = typeof s.draft === 'string' ? s.draft.slice(0, MAX_USER_TEXT) : '';
    if (s.sheet && typeof s.sheet.reopens === 'number') { base.sheet = { opened: !!s.sheet.opened && s.sheet.reopens > 0, reopens: Math.max(0, Math.floor(s.sheet.reopens)) }; }
    if (s.reply) { base.reply = { draft: (typeof s.reply.draft === 'string' && s.reply.draft.length <= MAX_REPLY) ? s.reply.draft : replyDefault, posted: !!s.reply.posted }; }
    if (s.file && (s.file.step === 'offer' || s.file.step === 'proposed' || s.file.step === 'filed')) { base.file = { step: s.file.step }; }
    if (s.support) { base.support = { sent: !!s.support.sent, reference: s.support.sent ? support.reference : null }; }
    return base;
  }

  return {
    VERSION: VERSION,
    limits: { message: MAX_USER_TEXT, reply: MAX_REPLY },
    checkMessage: checkMessage,
    project: project,
    starters: starters.slice(),
    sources: sources,
    sampleFile: sampleFile,
    replyDefault: replyDefault,
    support: support,
    responses: responses,
    boundary: boundary,
    sheet: sheetModule,
    matchIntent: matchIntent,
    normalize: normalize,
    init: init,
    reduce: reduce,
    busy: busy,
    sendingTurn: sendingTurn,
    findTurn: findTurn,
    turnSources: turnSources,
    turnActions: turnActions,
    turnArtifact: turnArtifact,
    turnCard: turnCard,
    turnExamples: turnExamples,
    turnSummary: turnSummary,
    serialize: serialize,
    hydrate: hydrate,
    _clone: clone
  };
});
