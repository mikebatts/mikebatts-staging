/* ==========================================================================
   Ray case study — page behavior
   - scroll reveals (progressive, degrades to fully visible)
   - reading progress bar
   - one morphing "system stage": a sticky, four-movement reveal driven by scroll
     progress. Degrades to a legible stacked layout with no JS and on mobile.
   - offscreen video pause (IntersectionObserver, optional)
   - reactive signature field (canvas) that responds to typing / thinking / rest
   - a working chat rebuild: real composer, local deterministic response engine,
     streamed status, grounded answers, propose-then-confirm (support + document
     placement), document concierge, repeat turns, short memory, reset.
   Honors prefers-reduced-motion. No network calls. Nothing here touches a backend.
   All records are fictional. Nothing is ever sent.
   ========================================================================== */
(function () {
  'use strict';

  var reduceMotion = false;
  try {
    reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) { reduceMotion = false; }

  var pointerFine = false;
  try { pointerFine = window.matchMedia && window.matchMedia('(pointer: fine)').matches; } catch (e) {}

  /* -------------------------------------------------------------- */
  /* Scroll reveals                                                 */
  /* -------------------------------------------------------------- */
  function setupReveals() {
    var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
    if (!reveals.length) { return; }

    reveals.forEach(function (block) {
      var kids = block.querySelectorAll('.stagger');
      for (var i = 0; i < kids.length; i++) { kids[i].style.setProperty('--i', i); }
    });

    if (reduceMotion || !('IntersectionObserver' in window)) {
      reveals.forEach(function (b) { b.classList.add('in'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });

    reveals.forEach(function (b) { io.observe(b); });

    // Failsafe: never leave content stranded hidden if the observer misfires
    // (full-page capture tooling, background tabs, odd viewports).
    setTimeout(function () { reveals.forEach(function (b) { b.classList.add('in'); }); }, 2600);
  }

  /* -------------------------------------------------------------- */
  /* Reading progress bar                                           */
  /* -------------------------------------------------------------- */
  function setupProgress() {
    var bar = document.getElementById('ray-progress-bar');
    if (!bar) { return; }
    var ticking = false;
    function update() {
      var doc = document.documentElement;
      var max = (doc.scrollHeight - window.innerHeight);
      var pct = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      bar.style.width = (pct * 100).toFixed(2) + '%';
      ticking = false;
    }
    function onScroll() {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
  }

  /* -------------------------------------------------------------- */
  /* System stage — one sticky visual that morphs across 4 movements */
  /* Default (no JS / reduced motion / mobile): a readable stack.     */
  /* -------------------------------------------------------------- */
  function setupSystemStage() {
    var section = document.getElementById('ray-system');
    if (!section) { return; }
    var track = section.querySelector('.sys');
    var sticky = document.getElementById('sys-sticky');
    var convo = section.querySelector('.sys-convo');
    var moves = section.querySelectorAll('.sys-move');
    if (!track || !sticky || !convo || !moves.length) { return; }
    var COUNT = moves.length;

    // Movement stepper — only rendered visible in pinned mode (CSS-gated).
    var titles = ['Find the right evidence', 'Check who is asking', 'Answer in context', 'Act with permission'];
    var steps = document.createElement('div');
    steps.className = 'sys-steps';
    steps.setAttribute('aria-hidden', 'true');
    for (var i = 0; i < COUNT; i++) {
      var ss = document.createElement('div');
      ss.className = 'ss';
      ss.setAttribute('data-s', String(i + 1));
      ss.innerHTML = '<span class="ss-n">' + (i + 1) + '</span><span class="ss-t"></span>';
      ss.querySelector('.ss-t').textContent = titles[i] || ('Movement ' + (i + 1));
      steps.appendChild(ss);
    }
    convo.appendChild(steps);

    var mq = window.matchMedia('(min-width:901px)');
    var pinned = false, ticking = false;
    var moveList = Array.prototype.slice.call(moves);

    function setMv(n) {
      if (section.getAttribute('data-mv') !== String(n)) { section.setAttribute('data-mv', String(n)); }
    }

    // Continuous transition between movements. The wipe is compressed into a
    // narrow scroll band so most of the scroll shows one clean movement; inside
    // the band the incoming movement is revealed top-to-bottom while the outgoing
    // one fades out in sync, so there is never a lingering double-text ghost.
    function smoothBand(a, b, x) { if (x <= a) { return 0; } if (x >= b) { return 1; } var t = (x - a) / (b - a); return t * t * (3 - 2 * t); }
    function applyMovements(f) {
      var base = Math.floor(f); if (base < 0) { base = 0; } else if (base > COUNT - 1) { base = COUNT - 1; }
      var frac = f - base; if (frac < 0) { frac = 0; } else if (frac > 1) { frac = 1; }
      var next = Math.min(COUNT - 1, base + 1);
      var e = smoothBand(0.40, 0.60, frac);
      for (var i = 0; i < moveList.length; i++) {
        var m = moveList[i], s = m.style;
        if (i === next && next !== base) {
          var pct = e * 116 - 8;
          var mask = 'linear-gradient(180deg,#000 ' + (pct - 10).toFixed(1) + '%, transparent ' + pct.toFixed(1) + '%)';
          s.opacity = '1'; s.transform = 'none'; s.pointerEvents = e > 0.5 ? 'auto' : 'none'; s.zIndex = '2';
          s.webkitMaskImage = mask; s.maskImage = mask;
        } else if (i === base) {
          s.opacity = (next !== base ? (1 - e) : 1).toFixed(3); s.transform = 'none';
          s.pointerEvents = e < 0.5 ? 'auto' : 'none'; s.zIndex = '1';
          s.webkitMaskImage = 'none'; s.maskImage = 'none';
        } else {
          s.opacity = '0'; s.pointerEvents = 'none'; s.zIndex = '0';
          s.webkitMaskImage = 'none'; s.maskImage = 'none';
        }
      }
      setMv((frac >= 0.5 ? next : base) + 1);
    }
    function clearMovements() {
      for (var i = 0; i < moveList.length; i++) {
        var s = moveList[i].style;
        s.opacity = ''; s.transform = ''; s.pointerEvents = ''; s.zIndex = '';
        s.webkitMaskImage = ''; s.maskImage = '';
      }
    }
    function compute() {
      try {
        var rect = track.getBoundingClientRect();
        var scrollable = track.offsetHeight - window.innerHeight;
        var p = scrollable > 0 ? (-rect.top) / scrollable : 0;
        if (p < 0) { p = 0; } else if (p > 1) { p = 1; }
        applyMovements(p * COUNT);
      } catch (err) {
        /* a single bad frame must never wedge the scroll handler */
      } finally {
        ticking = false;
      }
    }
    function onScroll() {
      if (!pinned || ticking) { return; }
      ticking = true;
      window.requestAnimationFrame(compute);
    }
    function enable() {
      if (pinned) { return; }
      pinned = true;
      section.classList.add('is-pinned', 'sys-wipe');
      // Scroll length per movement (vh). Kept under 100vh so the section stays
      // snappy and the whole page lands inside the target desktop height.
      track.style.height = (COUNT * 74) + 'vh';
      window.addEventListener('scroll', onScroll, { passive: true });
      compute();
    }
    function disable() {
      if (!pinned) { return; }
      pinned = false;
      section.classList.remove('is-pinned', 'sys-wipe');
      track.style.height = '';
      window.removeEventListener('scroll', onScroll);
      clearMovements();
      setMv(1);
    }
    function evaluate() {
      if (!reduceMotion && mq.matches) { enable(); } else { disable(); }
    }
    evaluate();
    if (mq.addEventListener) { mq.addEventListener('change', evaluate); }
    else if (mq.addListener) { mq.addListener(evaluate); }
    window.addEventListener('resize', function () { if (pinned) { onScroll(); } }, { passive: true });
  }

  /* -------------------------------------------------------------- */
  /* Hero video                                                     */
  /* -------------------------------------------------------------- */
  function setupHeroVideo() {
    var video = document.getElementById('ray-hero-video');
    if (!video) { return; }
    if (reduceMotion) {
      try { video.removeAttribute('autoplay'); video.pause(); } catch (e) {}
      return;
    }
    var tryPlay = function () {
      var p = video.play();
      if (p && typeof p.catch === 'function') { p.catch(function () {}); }
    };
    tryPlay();
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { tryPlay(); } else { try { video.pause(); } catch (e) {} }
        });
      }, { threshold: 0.15 });
      io.observe(video);
    }
  }

  /* -------------------------------------------------------------- */
  /* Signature field — a calm, reactive canvas that carries Ray     */
  /* -------------------------------------------------------------- */
  function SignatureField(canvas) {
    var ctx = canvas.getContext ? canvas.getContext('2d') : null;
    if (!ctx) { return { setEnergy: function () {}, resize: function () {}, start: function () {}, stop: function () {} }; }

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0, t = 0, energy = 0.14, target = 0.14, raf = null, running = false;

    var LAYERS = [
      { col: '246,111,0', base: 0.62, amp: 0.40, speed: 0.55, freq: 1.2, phase: 0.0, alpha: 0.55 },
      { col: '255,138,43', base: 0.58, amp: 0.30, speed: 0.85, freq: 1.9, phase: 1.9, alpha: 0.42 },
      { col: '252,204,60', base: 0.54, amp: 0.22, speed: 1.20, freq: 2.7, phase: 3.4, alpha: 0.30 }
    ];

    function resize() {
      var r = canvas.getBoundingClientRect();
      w = Math.max(1, Math.round(r.width));
      h = Math.max(1, Math.round(r.height));
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      var e = 0.25 + 0.75 * energy;
      ctx.globalCompositeOperation = 'lighter';
      for (var i = 0; i < LAYERS.length; i++) {
        var L = LAYERS[i];
        var base = h * L.base;
        var amp = h * L.amp * e;
        ctx.beginPath();
        for (var x = 0; x <= w; x += 6) {
          var y = base + Math.sin((x / (w || 1)) * Math.PI * 2 * L.freq + t * L.speed + L.phase) * amp;
          if (x === 0) { ctx.moveTo(x, y); } else { ctx.lineTo(x, y); }
        }
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        var g = ctx.createLinearGradient(0, base - amp, 0, h);
        g.addColorStop(0, 'rgba(' + L.col + ',' + (L.alpha * (0.35 + 0.65 * energy)).toFixed(3) + ')');
        g.addColorStop(1, 'rgba(' + L.col + ',0)');
        ctx.fillStyle = g;
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
    }

    function frame() {
      t += 0.016 * (0.5 + energy * 1.6);
      energy += (target - energy) * 0.06;
      draw();
      raf = window.requestAnimationFrame(frame);
    }

    function start() {
      if (running || reduceMotion) { return; }
      running = true;
      frame();
    }
    function stop() {
      running = false;
      if (raf) { window.cancelAnimationFrame(raf); raf = null; }
    }

    resize();
    if (reduceMotion) {
      energy = 0.4; t = 0.6; draw();
    }

    return {
      setEnergy: function (v) { target = v; },
      resize: function () { resize(); if (reduceMotion) { draw(); } },
      start: start,
      stop: stop
    };
  }

  /* -------------------------------------------------------------- */
  /* Chat engine                                                    */
  /* -------------------------------------------------------------- */
  function setupChat() {
    var demo = document.getElementById('ray-demo');
    if (!demo) { return; }

    var chat = demo.querySelector('.ray-chat');
    var thread = document.getElementById('ray-thread');
    var empty = document.getElementById('ray-empty');
    var input = document.getElementById('ray-input');
    var sendBtn = document.getElementById('ray-send');
    var form = document.getElementById('ray-composer');
    var presenceEl = document.getElementById('ray-presence');
    var newChatBtn = document.getElementById('ray-newchat');
    var demoVideo = document.getElementById('ray-demo-video');
    var sigCanvas = document.getElementById('ray-sig');

    var sig = sigCanvas ? SignatureField(sigCanvas) : null;

    var busy = false;
    var timers = [];
    var proposalSeq = 0;
    var lastIntent = null; // short server-owned-style memory of the last topic

    var POSTER = 'images/ray-avatar-poster.png';

    var now = new Date();
    var dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    /* ---- response library (fictional, deterministic) ---- */
    var RESPONSES = {
      greeting: {
        statuses: [],
        lead: "Hi, I'm Ray. Ask me anything about Maple Street residence, or about your projects across the portal. This demo answers from a fictional project record and published process knowledge, and always shows its sources.",
        card: '',
        sources: ''
      },
      capability: {
        statuses: ['Checking what Ray can do'],
        lead: "That one stays out of what Ray can touch. Cancelling or deleting a project, running a credit check, or sending an agreement are deliberately off the menu, even with a confirmation. I can point you to the right place in the portal, or open a support request for a person to handle it.",
        card: '',
        sources: '<b>Sources</b>&nbsp;guarded action policy&nbsp;·&nbsp;<b>Freshness</b>&nbsp;capability check, this turn'
      },
      blocker: {
        statuses: ['Checking project stage', 'Checking what is blocking the project'],
        lead: "Maple Street can't advance because a required step in document verification is still open.",
        card:
          '<ul class="ray-fields">' +
            '<li><span class="f-k">Blocker</span><span class="f-v hot">Title verification has not cleared</span></li>' +
            '<li><span class="f-k">Also true</span><span class="f-v">The signed agreement is in, and identity is verified</span></li>' +
            '<li><span class="f-k">Next action</span><span class="f-v">Confirm title, or request an updated title document from the homeowner</span></li>' +
            '<li><span class="f-k">Owner</span><span class="f-v">Assigned reviewer</span></li>' +
          '</ul>',
        sources: '<b>Sources</b>&nbsp;Blockers and capabilities, project stage&nbsp;·&nbsp;<b>Freshness</b>&nbsp;fictional project record, checked this turn'
      },
      documents: {
        statuses: ['Checking document status', 'Collecting the project documents'],
        lead: "Two items are still outstanding for document verification.",
        card:
          '<ul class="ray-docs">' +
            '<li><span class="d-name"><span class="ray-dot miss"></span>Proof of title</span><span class="d-state miss">Not received</span></li>' +
            '<li><span class="d-name"><span class="ray-dot miss"></span>Signed work order</span><span class="d-state miss">Pending design</span></li>' +
            '<li><span class="d-name"><span class="ray-dot ok"></span>Government ID</span><span class="d-state ok">Received</span></li>' +
            '<li><span class="d-name"><span class="ray-dot ok"></span>Utility bill</span><span class="d-state ok">Received</span></li>' +
          '</ul>',
        sources: '<b>Sources</b>&nbsp;Documents and contracts&nbsp;·&nbsp;<b>Freshness</b>&nbsp;fictional project record, checked this turn'
      },
      doclookup: {
        statuses: ['Collecting the project documents', 'Preparing the document actions'],
        lead: "Here are the documents on Maple Street you can open. I can also place a new one, with your confirmation.",
        card: 'DOCLIST',
        sources: '<b>Sources</b>&nbsp;Documents and contracts&nbsp;·&nbsp;<b>Freshness</b>&nbsp;fictional project record, checked this turn'
      },
      review: {
        statuses: ['Loading project details', 'Reading the review history'],
        lead: "Review sent this back with structured feedback. Here is what they asked for.",
        card:
          '<div class="ray-review">' +
            '<div class="rv-head"><span class="rv-role">Document verification review</span><span class="rv-decision">Sent back</span></div>' +
            '<div class="rv-body">' +
              '<p class="rv-lbl">Why it was returned</p>' +
              '<ul><li>The title document on file is expired</li><li>The work order is missing the homeowner signature</li></ul>' +
              '<p class="rv-lbl">What they need</p>' +
              '<ul class="req"><li>Upload a current, unexpired title document</li><li>Re-sign the work order with the homeowner</li></ul>' +
            '</div>' +
          '</div>',
        sources: '<b>Sources</b>&nbsp;Timeline and review history&nbsp;·&nbsp;<b>Freshness</b>&nbsp;fictional project record, checked this turn'
      },
      payment: {
        statuses: ['Retrieving invoice totals'],
        lead: "Here is where this project's milestone payments stand.",
        card:
          '<ul class="ray-mile-list">' +
            '<li><span class="m-name">M1 · Contract signed</span><span class="m-amt">$1,200</span><span class="m-state paid">Paid</span></li>' +
            '<li><span class="m-name">M2 · Work ordered</span><span class="m-amt">$1,800</span><span class="m-state await">Awaiting payment</span></li>' +
            '<li><span class="m-name">M3 · System installed</span><span class="m-amt">$2,400</span><span class="m-state none">Not payable yet</span></li>' +
          '</ul>' +
          '<div class="ray-mile-total"><span>Paid to date</span><span class="v">$1,200</span></div>',
        sources: '<b>Sources</b>&nbsp;Invoices&nbsp;·&nbsp;<b>Freshness</b>&nbsp;fictional project record, checked this turn'
      },
      notes: {
        statuses: ['Reading the project notes'],
        lead: "Here is the short version of the recent notes.",
        card:
          '<ul class="ray-notes">' +
            '<li><span class="n-who">Sales rep</span><span class="n-txt">Homeowner says the updated title document is coming this week.</span><span class="n-time">2 days ago</span></li>' +
            '<li><span class="n-who">Reviewer</span><span class="n-txt">Holding document verification until the title clears.</span><span class="n-time">2 days ago</span></li>' +
            '<li><span class="n-who">Coordinator</span><span class="n-txt">Design is ready to start the moment this gate opens.</span><span class="n-time">Yesterday</span></li>' +
          '</ul>',
        sources: '<b>Sources</b>&nbsp;Project notes&nbsp;·&nbsp;<b>Freshness</b>&nbsp;as of ' + dateStr
      },
      timeline: {
        statuses: ['Loading the project timeline'],
        lead: "The next step is title verification, and it sits with your assigned reviewer.",
        card:
          '<ul class="ray-fields">' +
            '<li><span class="f-k">Next step</span><span class="f-v hot">Title verification</span></li>' +
            '<li><span class="f-k">Owner</span><span class="f-v">Assigned reviewer</span></li>' +
            '<li><span class="f-k">Waiting on</span><span class="f-v">An updated title document from the homeowner</span></li>' +
            '<li><span class="f-k">Status</span><span class="f-v">Open, inside the review window</span></li>' +
          '</ul>',
        sources: '<b>Sources</b>&nbsp;Timeline and review history&nbsp;·&nbsp;<b>Freshness</b>&nbsp;fictional project record, checked this turn'
      },
      knowledge: {
        statuses: ["Checking Daylight's documentation"],
        lead: "Document verification needs four things before a project can clear the gate.",
        card:
          '<div class="ray-kb">' +
            '<div class="kb-k">Daylight knowledge base</div>' +
            '<div class="kb-title">What document verification requires</div>' +
            '<div class="kb-sec">Origination · Standard operating procedure</div>' +
            '<ul>' +
              '<li>A signed agreement on file</li>' +
              '<li>Verified homeowner identity</li>' +
              '<li>A current, unexpired proof of title</li>' +
              '<li>A signed work order once the design is set</li>' +
            '</ul>' +
          '</div>',
        sources: '<b>Sources</b>&nbsp;Daylight knowledge base&nbsp;·&nbsp;<b>Freshness</b>&nbsp;as of Aug 12, 2026'
      },
      support: {
        statuses: ['Preparing a support ticket'],
        lead: "No project data or published article settles this on its own, so Ray does not guess. He can hand it to a person.",
        card: 'SUPPORT',
        sources: '<b>Sources</b>&nbsp;none available&nbsp;·&nbsp;<b>Freshness</b>&nbsp;Ray could not verify an answer, so he offered a handoff'
      },
      fallback: {
        statuses: ['Searching your projects', 'Reading the project notes'],
        lead: "Here is what I can see on Maple Street right now, and a few threads I can pull.",
        card:
          '<div class="ray-state">' +
            '<div class="s-row"><span class="s-k">Phase</span><span class="s-v">Document verification</span></div>' +
            '<div class="s-row"><span class="s-k">Blocker</span><span class="s-v">Title verification has not cleared</span></div>' +
            '<div class="s-row"><span class="s-k">Next action</span><span class="s-v">Confirm title, or request an updated document</span></div>' +
            '<div class="s-row"><span class="s-k">Owner</span><span class="s-v">Assigned reviewer</span></div>' +
          '</div>' +
          '<p class="ray-suggest">I can also pull the <b>missing documents</b>, find a <b>specific document</b>, the <b>review feedback</b>, the <b>payout status</b>, or hand this to a <b>person</b>. Just ask.</p>',
        sources: '<b>Sources</b>&nbsp;Project record&nbsp;·&nbsp;<b>Freshness</b>&nbsp;fictional project record, checked this turn'
      }
    };

    function classify(text) {
      var s = (' ' + text + ' ').toLowerCase();
      if (/\b(cancel|delete|terminate|refund|credit check|run a credit|send (the |an )?agreement|sign (it |this )?for me|change (the )?price|adjust (the )?pricing)\b/.test(s)) { return 'capability'; }
      if (s.trim().length < 42 && /^\s*(hi|hey|hello|yo|sup|thanks|thank you|good morning|good afternoon|howdy)\b/.test(s)) { return 'greeting'; }
      if (/\b(help from (a )?(person|human|someone)|a person|a human|talk to (someone|a person|a human|support)|escalate|support (ticket|request|team|case)|raise (a|this)|get someone|speak to|real person)\b/.test(s)) { return 'support'; }
      // Document lookup / concierge: "find / open / pull the agreement, contract, title..."
      if (/\b(find|open|pull|locate|get me|show me|where('?s| is)|copy of|send me|download|link to|retrieve)\b/.test(s) &&
          /\b(agreement|contract|document|doc|docs|file|title|survey|welcome|report|paperwork|pdf|package)\b/.test(s)) { return 'doclookup'; }
      if (/\b(pay|paid|payout|payouts|payment|payments|invoice|invoices|commission|owed|milestone|disburse|disbursement|money|remit|remittance)\b/.test(s)) { return 'payment'; }
      if (/\b(review|reject|rejected|rejection|feedback|sent back|revision|kickback|reviewer)\b/.test(s)) { return 'review'; }
      if (/\b(next step|timeline|when|due|deadline|overdue|schedule|scheduled|how long|eta|behind)\b/.test(s)) { return 'timeline'; }
      if (/\b(require|requirement|requirements|needs|needed|how (do|does|can|is|are)|policy|guideline|guidelines|process for|credit|rule|rules|what is the|explain|documentation)\b/.test(s)) { return 'knowledge'; }
      if (/\b(document|documents|doc|docs|paperwork|file|files|title|utility bill|site survey|\bid\b|proof|upload|checklist|missing|outstanding)\b/.test(s)) { return 'documents'; }
      if (/\b(note|notes|summar|catch me up|happening|latest|recent|update|thread)\b/.test(s)) { return 'notes'; }
      if (/\b(blocker|blocked|stuck|advance|move forward|progress|stage|phase|hold|holding|waiting|why can|why is|can.?t|cannot)\b/.test(s)) { return 'blocker'; }
      return 'fallback';
    }

    /* ---- short conversation memory: follow-ups continue the prior topic ---- */
    var TOPICS = { blocker: 1, documents: 1, doclookup: 1, review: 1, timeline: 1, payment: 1, notes: 1, knowledge: 1 };
    var MEMORY_LABEL = {
      blocker: 'why this project is blocked',
      documents: 'the missing documents',
      doclookup: 'the project documents',
      review: 'the review feedback',
      timeline: 'the next step',
      payment: 'the payout status',
      notes: 'the recent notes',
      knowledge: 'what document verification requires'
    };
    function isFollowup(text) {
      var s = text.toLowerCase().trim();
      if (/^(and\b|then\b|what about|how about|what'?s next|whats next|what next|next\b|what do i do|what should i do|what now|now what|why\b|who\b|when\b|okay\b|ok\b|so\b|got it|thanks|thank you|continue|go on|and then|more\b)/.test(s)) { return true; }
      return s.replace(/[^a-z0-9]/g, '').length <= 5;
    }
    function route(text) {
      var direct = classify(text);
      if (lastIntent && direct === 'fallback' && isFollowup(text)) {
        var cont = (lastIntent === 'blocker' || lastIntent === 'timeline' || lastIntent === 'review' || lastIntent === 'documents') ? 'timeline' : lastIntent;
        return { intent: cont, memoryOf: lastIntent };
      }
      return { intent: direct, memoryOf: null };
    }

    /* ---- DOM helpers ---- */
    function el(html) {
      var d = document.createElement('div');
      d.innerHTML = html;
      return d.firstElementChild;
    }
    function scrollBottom() {
      if (thread) { thread.scrollTop = thread.scrollHeight; }
    }
    function clearTimers() {
      timers.forEach(function (id) { clearTimeout(id); });
      timers = [];
    }
    function later(fn, ms) { var id = setTimeout(fn, ms); timers.push(id); return id; }

    function setPresence(txt) { if (presenceEl) { presenceEl.textContent = txt; } }

    function moveAvatar() {
      if (reduceMotion || !demoVideo) { return; }
      try { demoVideo.currentTime = 0; var p = demoVideo.play(); if (p && p.catch) { p.catch(function () {}); } } catch (e) {}
    }
    function freezeAvatar() {
      if (demoVideo) { try { demoVideo.pause(); } catch (e) {} }
    }

    function hideEmpty() { if (empty) { empty.hidden = true; } }
    function showEmpty() { if (empty) { empty.hidden = false; } }

    /* ---- message builders ---- */
    function appendUser(text) {
      var row = el('<div class="rc-row user"><div class="rc-bubble-user"></div></div>');
      row.querySelector('.rc-bubble-user').textContent = text;
      thread.appendChild(row);
      scrollBottom();
    }

    function appendWorking(firstStatus) {
      var row = el(
        '<div class="rc-row ray">' +
          '<img class="rc-ray-avatar" src="' + POSTER + '" alt="" width="480" height="480" aria-hidden="true">' +
          '<div class="rc-ray-col"><div class="rc-working"><span class="pulse" aria-hidden="true"></span><span class="rc-working-text"></span></div></div>' +
        '</div>'
      );
      row.querySelector('.rc-working-text').textContent = firstStatus;
      thread.appendChild(row);
      scrollBottom();
      return row;
    }

    function supportProposalHTML() {
      proposalSeq += 1;
      var id = 'ray-prop-' + proposalSeq;
      return (
        '<div class="ray-proposal" data-kind="support" data-proposal="' + id + '">' +
          '<div class="p-head"><span>Proposed action</span><span class="clock">Expires in 15 min</span></div>' +
          '<div class="p-body">' +
            '<p class="p-title">Open a support request</p>' +
            '<p class="p-desc">Create a support handoff for Maple Street with your question and the current stage. A person reviews it and replies. Nothing runs until you confirm.</p>' +
            '<ul class="p-fields">' +
              '<li><span class="pk">Project</span><span class="pv">Maple Street residence</span></li>' +
              '<li><span class="pk">Category</span><span class="pv">Installation</span></li>' +
              '<li><span class="pk">Summary</span><span class="pv">Requesting a person to look at this project</span></li>' +
            '</ul>' +
            '<div class="p-actions">' +
              '<button class="ray-btn primary" type="button" data-confirm>Confirm request</button>' +
              '<button class="ray-btn ghost" type="button" data-dismiss>Not now</button>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }

    function placementProposalHTML() {
      proposalSeq += 1;
      var id = 'ray-prop-' + proposalSeq;
      return (
        '<div class="ray-proposal" data-kind="placement" data-proposal="' + id + '">' +
          '<div class="p-head"><span>Proposed action</span><span class="clock">Expires in 15 min</span></div>' +
          '<div class="p-body">' +
            '<p class="p-title">Place the updated title document</p>' +
            '<p class="p-desc">Attach the current title and Ray places it on Maple Street through the existing guarded upload. The previous version stays in history. Access is re-checked at confirm, and nothing runs until you confirm.</p>' +
            '<ul class="p-fields">' +
              '<li><span class="pk">Project</span><span class="pv">Maple Street residence</span></li>' +
              '<li><span class="pk">Document</span><span class="pv">Proof of title</span></li>' +
              '<li><span class="pk">Mode</span><span class="pv">Replace, prior version archived</span></li>' +
            '</ul>' +
            '<div class="p-actions">' +
              '<button class="ray-btn primary" type="button" data-confirm>Confirm placement</button>' +
              '<button class="ray-btn ghost" type="button" data-dismiss>Not now</button>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }

    function docListHTML() {
      return (
        '<div class="ray-doclist">' +
          '<div class="dl-head">Documents · Maple Street residence</div>' +
          '<ul>' +
            '<li><span class="dl-nm"><span class="ray-dot ok"></span>Signed agreement</span><span class="dl-kind">Agreement</span><span class="dl-act view" aria-hidden="true">View</span></li>' +
            '<li><span class="dl-nm"><span class="ray-dot ok"></span>Government ID</span><span class="dl-kind">Identity</span><span class="dl-act view" aria-hidden="true">View</span></li>' +
            '<li><span class="dl-nm"><span class="ray-dot ok"></span>Utility bill</span><span class="dl-kind">Utility</span><span class="dl-act view" aria-hidden="true">View</span></li>' +
            '<li><span class="dl-nm"><span class="ray-dot miss"></span>Proof of title</span><span class="dl-kind">Missing</span><button class="dl-act" type="button" data-place="title">Place</button></li>' +
          '</ul>' +
        '</div>'
      );
    }

    function bylineHTML() {
      return (
        '<div class="rc-byline">' +
          '<button class="rc-bybtn" type="button" data-copy aria-label="Copy answer">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>' +
            '<span class="rc-lbl">Copy</span>' +
          '</button>' +
          '<button class="rc-bybtn" type="button" data-vote="up" aria-label="Good response" aria-pressed="false">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 11v9H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3Zm0 0 4-8a2 2 0 0 1 2 2v3h5a2 2 0 0 1 2 2.3l-1.3 6A2 2 0 0 1 18.7 20H7"/></svg>' +
          '</button>' +
          '<button class="rc-bybtn" type="button" data-vote="down" aria-label="Bad response" aria-pressed="false">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 13V4h3a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-3Zm0 0-4 8a2 2 0 0 1-2-2v-3H6a2 2 0 0 1-2-2.3l1.3-6A2 2 0 0 1 7.3 4H17"/></svg>' +
          '</button>' +
        '</div>'
      );
    }

    function cardMarkup(card) {
      if (card === 'SUPPORT') { return supportProposalHTML(); }
      if (card === 'DOCLIST') { return docListHTML(); }
      return card;
    }

    function appendAnswer(resp) {
      var cardHTML = cardMarkup(resp.card);
      var inner =
        '<div class="rc-answer">' +
          '<div class="rc-answer-in">' +
            '<p class="a-line"></p>' +
            (cardHTML ? '<div class="ray-card">' + cardHTML + '</div>' : '') +
          '</div>' +
          (resp.sources ? '<p class="ray-sources">' + resp.sources + '</p>' : '') +
        '</div>';
      var row = el(
        '<div class="rc-row ray">' +
          '<img class="rc-ray-avatar" src="' + POSTER + '" alt="" width="480" height="480" aria-hidden="true">' +
          '<div class="rc-ray-col">' + inner + bylineHTML() + '</div>' +
        '</div>'
      );
      row.querySelector('.a-line').textContent = resp.lead;
      thread.appendChild(row);
      var ans = row.querySelector('.rc-answer');
      if (!reduceMotion) {
        window.requestAnimationFrame(function () { ans.classList.add('reveal-in'); });
      }
      scrollBottom();
      return row;
    }

    function appendStopped() {
      var row = el(
        '<div class="rc-row ray">' +
          '<img class="rc-ray-avatar" src="' + POSTER + '" alt="" width="480" height="480" aria-hidden="true">' +
          '<div class="rc-ray-col"><div class="rc-answer"><div class="rc-answer-in"><p class="a-line">Stopped. Ask me anything else about this project.</p></div></div></div>' +
        '</div>'
      );
      thread.appendChild(row);
      scrollBottom();
    }

    /* ---- turn lifecycle ---- */
    function settle() {
      busy = false;
      chat.classList.remove('is-working');
      setPresence('At rest');
      freezeAvatar();
      if (sig) { sig.setEnergy(0.16); }
      updateSendState();
    }

    function finishTurn(resp) {
      appendAnswer(resp);
      settle();
    }

    function runTurn(text) {
      busy = true;
      chat.classList.add('is-working');
      hideEmpty();
      appendUser(text);
      setPresence('Working');
      if (sig) { sig.setEnergy(0.9); }
      moveAvatar();
      updateSendState();

      var r = route(text);
      var base = RESPONSES[r.intent] || RESPONSES.fallback;
      var resp = base;
      if (r.memoryOf && MEMORY_LABEL[r.memoryOf]) {
        resp = {};
        for (var key in base) { if (Object.prototype.hasOwnProperty.call(base, key)) { resp[key] = base[key]; } }
        resp.lead = 'Following up on ' + MEMORY_LABEL[r.memoryOf] + ': ' + base.lead;
      }
      if (TOPICS[r.intent]) { lastIntent = r.intent; }

      if (reduceMotion) {
        finishTurn(resp);
        return;
      }

      var statuses = resp.statuses && resp.statuses.length ? resp.statuses : ['Thinking'];
      var work = appendWorking(statuses[0]);
      var textEl = work.querySelector('.rc-working-text');
      var idx = 0;

      function next() {
        idx += 1;
        if (idx < statuses.length) {
          textEl.textContent = statuses[idx];
          scrollBottom();
          later(next, 760);
        } else {
          later(function () {
            if (work.parentNode) { work.parentNode.removeChild(work); }
            finishTurn(resp);
          }, 780);
        }
      }
      later(next, 780);
    }

    function stopTurn() {
      clearTimers();
      var work = thread.querySelector('.rc-working');
      if (work) {
        var row = work.closest('.rc-row');
        if (row && row.parentNode) { row.parentNode.removeChild(row); }
      }
      appendStopped();
      settle();
    }

    /* ---- composer wiring ---- */
    function autosize() {
      if (!input) { return; }
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 132) + 'px';
    }
    function updateSendState() {
      if (!sendBtn) { return; }
      if (busy) {
        sendBtn.disabled = false;
        sendBtn.setAttribute('aria-label', 'Stop generating');
      } else {
        sendBtn.disabled = !(input && input.value.trim().length);
        sendBtn.setAttribute('aria-label', 'Send message');
      }
    }
    function sendCurrent() {
      if (busy || !input) { return; }
      var text = input.value.trim();
      if (!text) { return; }
      input.value = '';
      autosize();
      updateSendState();
      runTurn(text);
    }

    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (busy) { stopTurn(); return; }
        sendCurrent();
      });
    }
    if (input) {
      input.addEventListener('input', function () {
        autosize();
        updateSendState();
        if (!busy && sig) { sig.setEnergy(input.value.trim().length ? 0.42 : 0.16); }
      });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          if (!busy) { sendCurrent(); }
        }
      });
      input.addEventListener('blur', function () {
        if (!busy && sig) { sig.setEnergy(0.16); }
      });
    }

    // attachment affordance: faithful to the real composer; this local demo
    // runs on fictional records, so it explains rather than uploads.
    var attachBtn = document.getElementById('ray-attach');
    if (attachBtn) {
      attachBtn.addEventListener('click', function () {
        var composer = attachBtn.closest('.ray-chat-composer');
        if (!composer || composer.querySelector('.rc-attach-toast')) { if (input) { input.focus(); } return; }
        var toast = document.createElement('div');
        toast.className = 'rc-attach-toast';
        toast.setAttribute('role', 'status');
        toast.textContent = 'In the product, Ray reads PDFs and images you attach. This demo runs on fictional records, so uploads stay off here.';
        composer.appendChild(toast);
        if (!reduceMotion) { window.requestAnimationFrame(function () { toast.classList.add('in'); }); }
        else { toast.classList.add('in'); }
        window.setTimeout(function () {
          toast.classList.remove('in');
          window.setTimeout(function () { if (toast.parentNode) { toast.parentNode.removeChild(toast); } }, 300);
        }, 3400);
        if (input) { input.focus(); }
      });
    }

    // suggested prompts (empty state, product-faithful full-width buttons)
    var suggs = Array.prototype.slice.call(demo.querySelectorAll('.rc-sugg'));
    suggs.forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (busy) { return; }
        var q = btn.getAttribute('data-prompt');
        if (!q) { return; }
        runTurn(q);
      });
    });

    // new chat
    if (newChatBtn) {
      newChatBtn.addEventListener('click', function () {
        clearTimers();
        busy = false;
        lastIntent = null;
        chat.classList.remove('is-working');
        var rows = thread.querySelectorAll('.rc-row');
        rows.forEach(function (r) { r.parentNode.removeChild(r); });
        showEmpty();
        setPresence('At rest');
        freezeAvatar();
        if (sig) { sig.setEnergy(0.16); }
        if (input) { input.value = ''; autosize(); }
        updateSendState();
        if (pointerFine && input) { input.focus(); }
      });
    }

    // delegated card actions (confirm / dismiss / place / copy / vote)
    thread.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('button') : null;
      if (!t) { return; }

      // document concierge: "Place" spawns a guarded placement proposal
      if (t.hasAttribute('data-place')) {
        var list = t.closest('.ray-doclist');
        if (list && !list.parentNode.querySelector('.ray-proposal')) {
          var prop = el(placementProposalHTML());
          list.parentNode.appendChild(prop);
          scrollBottom();
        }
        return;
      }

      if (t.hasAttribute('data-confirm')) {
        var proposal = t.closest('.ray-proposal');
        if (proposal) {
          var kind = proposal.getAttribute('data-kind') || 'support';
          proposal.classList.add('is-confirmed');
          var head, strongTxt, subTxt;
          if (kind === 'placement') {
            head = '<div class="p-head"><span>Recorded in this demo</span><span class="clock">local only</span></div>';
            strongTxt = 'Placement recorded in this demo';
            subTxt = 'Nothing was placed. In the product this routes through the guarded upload operation, re-checking your access at confirm, and the prior version stays archived in history.';
          } else {
            head = '<div class="p-head"><span>Recorded in this demo</span><span class="clock">local only</span></div>';
            strongTxt = 'Support request recorded in this demo';
            subTxt = 'Nothing was sent. In the product this opens a support case, with deduplication and a daily cap, for a person to pick up.';
          }
          proposal.innerHTML =
            head +
            '<div class="p-confirmed"><span class="ok" aria-hidden="true">&#10003;</span>' +
              '<span class="txt"><strong></strong><span></span></span></div>';
          proposal.querySelector('.p-confirmed strong').textContent = strongTxt;
          proposal.querySelector('.p-confirmed .txt span').textContent = subTxt;
          scrollBottom();
        }
        return;
      }
      if (t.hasAttribute('data-dismiss')) {
        var prop2 = t.closest('.ray-proposal');
        if (prop2) {
          var body = prop2.querySelector('.p-body') || prop2;
          body.innerHTML = '<p class="p-desc" style="margin:0">Okay, no action. Ask me anything else about this project.</p>';
        }
        return;
      }
      if (t.hasAttribute('data-copy')) {
        var answer = t.closest('.rc-ray-col').querySelector('.rc-answer');
        var txt = answer ? (answer.innerText || answer.textContent || '') : '';
        var lbl = t.querySelector('.rc-lbl');
        var done = function () { if (lbl) { var o = lbl.textContent; lbl.textContent = 'Copied'; setTimeout(function () { lbl.textContent = o; }, 1400); } };
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(txt).then(done, done);
          } else { done(); }
        } catch (err) { done(); }
        return;
      }
      if (t.hasAttribute('data-vote')) {
        var group = t.closest('.rc-byline');
        if (group) {
          group.querySelectorAll('[data-vote]').forEach(function (b) {
            b.setAttribute('aria-pressed', b === t ? (b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true') : 'false');
          });
        }
        return;
      }
    });

    // signature field lifecycle: run when the demo is visible, pause otherwise
    if (sig && !reduceMotion) {
      sig.start();
      if ('IntersectionObserver' in window) {
        var sio = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) { sig.start(); } else { sig.stop(); }
          });
        }, { threshold: 0.05 });
        sio.observe(demo);
      }
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) { sig.stop(); } else { sig.start(); }
      });
      var rt = null;
      window.addEventListener('resize', function () {
        if (rt) { clearTimeout(rt); }
        rt = setTimeout(function () { sig.resize(); }, 160);
      }, { passive: true });
    }

    if (reduceMotion && demoVideo) {
      try { demoVideo.removeAttribute('autoplay'); demoVideo.pause(); } catch (e) {}
    }

    updateSendState();
  }

  /* -------------------------------------------------------------- */
  function init() {
    var docEl = document.documentElement;
    try {
      setupReveals();
      docEl.classList.add('js-on');
      setupProgress();
      setupSystemStage();
      setupHeroVideo();
      setupChat();
    } catch (e) {
      // Fail open: any init exception must never leave content stranded hidden.
      docEl.classList.remove('js-on');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
