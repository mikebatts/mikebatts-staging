/* ==========================================================================
   Ray case study — page behavior
   - scroll reveals (progressive, degrades to fully visible)
   - reading progress is CSS-native (animation-timeline:scroll); no JS scroll
     listener. This file only adds the js-on class that fades the current in.
   - fixed nav shadow: an IntersectionObserver sentinel, not a scroll listener.
   - hero load choreography: flip a class, CSS carries the two-line title,
     the Ray sun object, and the supporting copy in.
   - the trust sequence: one persistent answer surface while four guarantees
     scroll past. GSAP ScrollTrigger drives the scrubbed text reveal and the
     card's proof state over a CSS-sticky stage (robust, no pin-spacer). It is
     built desktop + motion only via gsap.matchMedia, so it is cleanly killed
     and rebuilt on breakpoint changes. Everything is visible and correctly
     ordered with no GSAP and no JS; mobile and reduced motion get a settled,
     non-pinned stack. No scroll hijack, no manual continuous scroll listener.
   - portal to phone: one graceful focus/scale transition on scroll-in.
   - a working chat rebuild: real composer, local deterministic response engine,
     streamed status, grounded answers, propose-then-confirm (support + document
     placement), document concierge, repeat turns, short memory, reset.
   Honors prefers-reduced-motion and Save-Data. No network calls. Nothing here
   touches a backend. All records are fictional. Nothing is ever sent.
   ========================================================================== */
(function () {
  'use strict';

  var reduceMotion = false;
  try {
    reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) { reduceMotion = false; }

  var pointerFine = false;
  try { pointerFine = window.matchMedia && window.matchMedia('(pointer: fine)').matches; } catch (e) {}

  var saveData = false;
  try { saveData = !!(navigator.connection && navigator.connection.saveData); } catch (e) { saveData = false; }

  var hasIO = 'IntersectionObserver' in window;

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

    if (reduceMotion || !hasIO) {
      reveals.forEach(function (b) { b.classList.add('in'); });
      return;
    }

    var vh = window.innerHeight || 800;
    reveals.forEach(function (b) {
      var r = b.getBoundingClientRect();
      if (r.top < vh * 0.95) { b.classList.add('in'); }
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });

    reveals.forEach(function (b) { if (!b.classList.contains('in')) { io.observe(b); } });

    // Failsafe: never leave content stranded hidden if the observer misfires
    // (full-page capture tooling, background tabs, odd viewports).
    setTimeout(function () { reveals.forEach(function (b) { b.classList.add('in'); }); }, 2800);
  }

  /* -------------------------------------------------------------- */
  /* Fixed nav shadow — sentinel IntersectionObserver, no scroll listener */
  /* -------------------------------------------------------------- */
  function setupNav() {
    var nav = document.getElementById('ray-nav');
    if (!nav) { return; }
    if (!hasIO) { nav.classList.add('is-scrolled'); return; }
    var sentinel = document.createElement('div');
    sentinel.setAttribute('aria-hidden', 'true');
    sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:8px;pointer-events:none';
    document.body.appendChild(sentinel);
    var io = new IntersectionObserver(function (entries) {
      nav.classList.toggle('is-scrolled', !entries[0].isIntersecting);
    }, { threshold: 0 });
    io.observe(sentinel);
  }

  /* -------------------------------------------------------------- */
  /* Hero load choreography — flip the switch, CSS carries the rest */
  /* -------------------------------------------------------------- */
  function setupHero() {
    var hero = document.querySelector('.ray-hero');
    if (!hero) { return; }
    if (reduceMotion) { hero.classList.add('hero-in'); return; }
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () { hero.classList.add('hero-in'); });
    });
    setTimeout(function () { hero.classList.add('hero-in'); }, 2600);

    var scene = hero.querySelector('.ray-hero-scene');
    var sun = hero.querySelector('.ray-sun');
    var answer = hero.querySelector('.ray-hero-answer');
    var gsap = window.gsap;
    var ScrollTrigger = window.ScrollTrigger;
    if (!scene || !sun || !answer || !gsap || !ScrollTrigger) { return; }
    try { gsap.registerPlugin(ScrollTrigger); } catch (e) { return; }
    var mm = gsap.matchMedia();
    mm.add('(min-width: 1025px) and (prefers-reduced-motion: no-preference)', function () {
      var tl = gsap.timeline({
        scrollTrigger: {
          trigger: hero,
          start: 'top top',
          end: 'bottom top',
          scrub: true
        }
      });
      tl.to(sun, { xPercent: -12, yPercent: 12, scale: 0.72, ease: 'none' }, 0)
        .to(answer, { xPercent: -4, yPercent: 34, scale: 0.88, autoAlpha: 0, ease: 'none' }, 0)
        .to(scene, { yPercent: 8, ease: 'none' }, 0);
      return function () {
        if (tl.scrollTrigger) { tl.scrollTrigger.kill(); }
        tl.kill();
        gsap.set([sun, answer, scene], { clearProps: 'all' });
      };
    });
  }

  /* -------------------------------------------------------------- */
  /* Ray sun video — plays as the hero identity, paused offscreen.  */
  /* Save-Data / reduced motion hold the poster.                    */
  /* -------------------------------------------------------------- */
  function setupHeroVideo() {
    var video = document.getElementById('ray-hero-video');
    if (!video) { return; }
    if (reduceMotion || saveData) {
      try { video.removeAttribute('autoplay'); video.pause(); } catch (e) {}
      return;
    }
    var tryPlay = function () {
      var p = video.play();
      if (p && typeof p.catch === 'function') { p.catch(function () {}); }
    };
    tryPlay();
    if (hasIO) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { tryPlay(); } else { try { video.pause(); } catch (e) {} }
        });
      }, { threshold: 0.15 });
      io.observe(video);
    }
  }

  /* -------------------------------------------------------------- */
  /* The trust sequence — pinned split + scrubbed text reveal.      */
  /* Real GSAP ScrollTrigger, desktop + motion only, over a sticky  */
  /* stage. Cleanly reverted on breakpoint change by gsap.matchMedia*/
  /* Without GSAP/JS: the CSS shows every proof and step in order.  */
  /* -------------------------------------------------------------- */
  function setupTrust() {
    var split = document.getElementById('ray-trust-split');
    var card = document.getElementById('ray-trust-card');
    if (!split || !card) { return; }
    var steps = Array.prototype.slice.call(split.querySelectorAll('.ray-trust-step'));
    var proofs = Array.prototype.slice.call(card.querySelectorAll('.tc-proof'));
    if (!steps.length || !proofs.length) { return; }

    // Below the pinned desktop composition, pair each guarantee with the proof
    // it describes. The persistent card keeps the shared question and answer;
    // the proof details move into the reading flow instead of appearing as one
    // enormous duplicate block before all four explanations.
    steps.forEach(function (step) {
      var state = step.getAttribute('data-trust');
      var proof = proofs.filter(function (item) {
        return item.getAttribute('data-proof') === state;
      })[0];
      if (!proof || step.querySelector('.ray-trust-mobile-proof')) { return; }
      var mobileProof = document.createElement('div');
      mobileProof.className = 'ray-trust-mobile-proof';
      mobileProof.appendChild(proof.cloneNode(true));
      step.appendChild(mobileProof);
    });
    split.classList.add('has-mobile-pairs');

    var gsap = window.gsap;
    var ScrollTrigger = window.ScrollTrigger;
    // No GSAP (blocked / failed): leave the legible settled stack in place.
    if (!gsap || !ScrollTrigger || reduceMotion) { return; }
    try { gsap.registerPlugin(ScrollTrigger); } catch (e) { return; }

    function activate(state) {
      card.setAttribute('data-trust', state);
      proofs.forEach(function (p) {
        p.classList.toggle('is-on', p.getAttribute('data-proof') === state);
      });
    }

    // Split each step paragraph into words for the scrubbed reveal. Done once,
    // preserving text content and spacing, so no-JS text stays intact.
    function wordwrap(elm) {
      if (elm.dataset.split === '1') { return; }
      var text = elm.textContent;
      var parts = text.split(/(\s+)/);
      var frag = document.createDocumentFragment();
      parts.forEach(function (tok) {
        if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(tok)); }
        else if (tok.length) {
          var s = document.createElement('span');
          s.className = 'rt-word';
          s.textContent = tok;
          frag.appendChild(s);
        }
      });
      elm.textContent = '';
      elm.appendChild(frag);
      elm.dataset.split = '1';
    }

    var mm = gsap.matchMedia();

    // Desktop + fine control + motion: the pinned split with scrub + state.
    mm.add('(min-width: 1025px) and (prefers-reduced-motion: no-preference)', function () {
      split.classList.add('is-pinned');
      activate(steps[0].getAttribute('data-trust'));

      var triggers = [];

      steps.forEach(function (step) {
        var para = step.querySelector('.ray-trust-step-p');
        if (para) { wordwrap(para); }
        var words = para ? para.querySelectorAll('.rt-word') : [];

        // scrubbed text reveal for this step's copy
        if (words.length) {
          var tl = gsap.to(words, {
            opacity: 1, stagger: 0.08, ease: 'none',
            scrollTrigger: {
              trigger: step,
              start: 'top 78%',
              end: 'top 34%',
              scrub: true
            }
          });
          triggers.push(tl.scrollTrigger);
        }

      });

      // One state controller chooses the guarantee nearest the viewport
      // centre. This stays deterministic during ordinary scrolling, large
      // trackpad jumps, scrollbar dragging, and reverse navigation.
      function syncNearestProof() {
        var centre = (window.innerHeight || 800) / 2;
        var nearest = steps[0];
        var distance = Infinity;
        steps.forEach(function (step) {
          var rect = step.getBoundingClientRect();
          var current = Math.abs((rect.top + rect.height / 2) - centre);
          if (current < distance) { distance = current; nearest = step; }
        });
        activate(nearest.getAttribute('data-trust'));
      }
      var stateTrigger = ScrollTrigger.create({
        trigger: split,
        start: 'top bottom',
        end: 'bottom top',
        onEnter: syncNearestProof,
        onEnterBack: syncNearestProof,
        onUpdate: syncNearestProof
      });
      triggers.push(stateTrigger);

      ScrollTrigger.refresh();

      return function () {
        // cleanup on breakpoint change: kill triggers, drop pinned styling.
        triggers.forEach(function (t) { if (t && t.kill) { t.kill(); } });
        split.classList.remove('is-pinned');
        proofs.forEach(function (p) { p.classList.remove('is-on'); });
        card.setAttribute('data-trust', 'source');
      };
    });
  }

  /* -------------------------------------------------------------- */
  /* One thread, two readers. The stage stays still while emphasis  */
  /* moves from the operational portal to the homeowner phone.     */
  /* -------------------------------------------------------------- */
  function setupReaders() {
    var stage = document.getElementById('ray-readers-stage');
    var scroll = document.getElementById('ray-readers-scroll');
    var phone = document.getElementById('ray-phone');
    var portal = document.getElementById('ray-portal');
    var handoff = stage ? stage.querySelector('.ray-reader-handoff') : null;
    var labels = stage ? Array.prototype.slice.call(stage.querySelectorAll('[data-reader-label]')) : [];
    var caption = stage ? stage.querySelector('[data-reader-caption]') : null;
    if (!stage || !scroll || !phone || !portal) { return; }
    var gsap = window.gsap;
    var ScrollTrigger = window.ScrollTrigger;
    if (!gsap || !ScrollTrigger || reduceMotion) { return; }
    try { gsap.registerPlugin(ScrollTrigger); } catch (e) { return; }

    var mm = gsap.matchMedia();
    mm.add('(min-width: 1025px) and (prefers-reduced-motion: no-preference)', function () {
      function setReader(mode) {
        labels.forEach(function (label) {
          label.classList.toggle('is-active', label.getAttribute('data-reader-label') === mode);
        });
        if (caption) {
          caption.textContent = mode === 'phone'
            ? 'The same trust contract, recomposed for a homeowner in plain language.'
            : 'The operator gets depth, project context, and the next operational move.';
        }
      }
      setReader('portal');
      function stageTop() {
        return scroll.getBoundingClientRect().top + (window.pageYOffset || document.documentElement.scrollTop || 0);
      }
      function navHeight() {
        return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 60;
      }
      var tl = gsap.timeline({
        scrollTrigger: {
          trigger: scroll,
          start: function () { return stageTop() - navHeight(); },
          end: function () { return stageTop() + scroll.offsetHeight - (window.innerHeight || 800); },
          scrub: true,
          onUpdate: function (self) { setReader(self.progress < 0.52 ? 'portal' : 'phone'); }
        }
      });
      gsap.set(phone, { autoAlpha: 0.34, y: 46, scale: 0.88, filter: 'blur(6px)' });
      if (handoff) { gsap.set(handoff, { scaleX: 0 }); }
      tl.to(portal, { autoAlpha: 0.42, x: -34, scale: 0.93, filter: 'blur(5px)', ease: 'none' }, 0)
        .to(phone, { autoAlpha: 1, y: 0, scale: 1, filter: 'blur(0px)', ease: 'none' }, 0)
        .to(handoff, { scaleX: 1, ease: 'none' }, 0.08);
      ScrollTrigger.refresh();
      return function () {
        if (tl.scrollTrigger) { tl.scrollTrigger.kill(); }
        tl.kill();
        gsap.set([portal, phone, handoff], { clearProps: 'all' });
        setReader('portal');
      };
    });
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
      });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          if (!busy) { sendCurrent(); }
        }
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
      setupNav();
      setupHero();
      setupHeroVideo();
      setupTrust();
      setupReaders();
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
