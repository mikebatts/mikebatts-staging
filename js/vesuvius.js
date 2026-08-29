/* ==========================================================================
   vesuvius.js — "Digital excavation"
   Code-native visuals + scroll choreography for the Vesuvius case study.
   All canvases are aria-hidden; every fact also lives in the HTML.
   No framework, no network dependency. Degrades to static under reduced
   motion or missing WebGL/canvas support, and never blocks page load.
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = false;
  try { reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  var hasGsap = !!(window.gsap && window.ScrollTrigger);
  if (hasGsap) { try { window.gsap.registerPlugin(window.ScrollTrigger); } catch (e) { hasGsap = false; } }

  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };

  /* Size a canvas to its CSS box at capped DPR. Returns css w/h in px. */
  function fitCanvas(canvas, dpr) {
    var r = canvas.getBoundingClientRect();
    var w = Math.max(1, Math.round(r.width));
    var h = Math.max(1, Math.round(r.height));
    var d = dpr || Math.min(2, window.devicePixelRatio || 1);
    if (canvas.width !== w * d || canvas.height !== h * d) {
      canvas.width = w * d; canvas.height = h * d;
    }
    return { w: w, h: h, dpr: d };
  }

  /* Run a rAF loop only while `el` is on screen (perf + battery). */
  function onScreenLoop(el, frame) {
    var visible = false, raf = 0;
    function tick(t) { raf = 0; if (visible) { frame(t || 0); raf = window.requestAnimationFrame(tick); } }
    try {
      var io = new IntersectionObserver(function (ents) {
        visible = ents[0].isIntersecting;
        if (visible && !raf && !reduceMotion) { raf = window.requestAnimationFrame(tick); }
      }, { rootMargin: '120px' });
      io.observe(el);
    } catch (e) { visible = true; if (!reduceMotion) { raf = window.requestAnimationFrame(tick); } }
    return { once: function () { frame(0); } };
  }

  /* ------------------------------------------------------------------ */
  /* Viewport height (iOS Safari dynamic toolbar)                        */
  /* ------------------------------------------------------------------ */
  function setupViewport() {
    function update() {
      var h = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      root.style.setProperty('--vs-vh', h + 'px');
    }
    window.addEventListener('resize', update, { passive: true });
    if (window.visualViewport) { window.visualViewport.addEventListener('resize', update, { passive: true }); }
    update();
  }

  /* ------------------------------------------------------------------ */
  /* Progress bar + nav stuck state                                      */
  /* ------------------------------------------------------------------ */
  function setupChrome() {
    var bar = document.querySelector('.vs-progress span');
    var nav = document.getElementById('vs-nav');
    var ticking = false;
    function update() {
      ticking = false;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var y = window.scrollY || window.pageYOffset || 0;
      if (bar) { bar.style.transform = 'scaleX(' + (max > 0 ? clamp(y / max, 0, 1) : 0) + ')'; }
      if (nav) { nav.classList.toggle('is-stuck', y > 8); }
    }
    function req() { if (!ticking) { ticking = true; window.requestAnimationFrame(update); } }
    window.addEventListener('scroll', req, { passive: true });
    window.addEventListener('resize', req, { passive: true });
    update();
  }

  /* ------------------------------------------------------------------ */
  /* HERO — WebGL2 carbonized scroll cross-section                       */
  /* ------------------------------------------------------------------ */
  var HERO_VERT = '#version 300 es\nin vec2 p;void main(){gl_Position=vec4(p,0.0,1.0);}';
  var HERO_FRAG = [
    '#version 300 es',
    'precision highp float;',
    'out vec4 o;',
    'uniform vec2 res; uniform float time; uniform vec2 ptr;',
    'float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}',
    'float noise(vec2 p){vec2 i=floor(p),f=fract(p);float a=hash(i),b=hash(i+vec2(1,0)),c=hash(i+vec2(0,1)),d=hash(i+vec2(1,1));vec2 u=f*f*(3.0-2.0*f);return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);}',
    'float fbm(vec2 p){float v=0.0,a=0.5;for(int i=0;i<5;i++){v+=a*noise(p);p*=2.02;a*=0.5;}return v;}',
    'void main(){',
    '  vec2 uv=(gl_FragCoord.xy-0.5*res)/res.y;',
    '  uv-=ptr*0.05;',
    '  float r=length(uv);',
    '  float warp=fbm(uv*3.0+vec2(0.0,time*0.02));',
    '  float rr=r+(warp-0.5)*0.11;',
    '  float rings=sin(rr*46.0-time*0.12);',
    '  float layer=smoothstep(0.5,1.0,abs(rings));',
    '  float ringMask=layer*smoothstep(0.95,0.12,r);',
    '  float scanY=sin(time*0.20)*0.52;',
    '  float scan=smoothstep(0.05,0.0,abs(uv.y-scanY));',
    '  float core=smoothstep(0.44,0.0,r);',
    '  float g=fbm(uv*22.0+time*0.05);',
    '  vec3 bg=vec3(0.039,0.055,0.078);',
    '  vec3 ash=vec3(0.86,0.82,0.74);',
    '  vec3 orange=vec3(1.0,0.35,0.12);',
    '  vec3 ct=vec3(0.30,0.62,0.78);',
    '  vec3 col=bg;',
    '  col+=ash*ringMask*0.18;',
    '  col+=ct*ringMask*core*0.22;',
    '  col+=orange*core*(0.16+0.10*sin(time*0.4));',
    '  col+=orange*scan*(0.55+0.45*core);',
    '  col+=ash*scan*ringMask*0.35;',
    '  col*=0.9+0.2*g;',
    '  col*=smoothstep(1.3,0.18,r);',
    '  o=vec4(col,1.0);',
    '}'
  ].join('\n');

  function compile(gl, type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { return null; }
    return s;
  }

  function setupHero() {
    var canvas = document.querySelector('.vs-hero-canvas');
    if (!canvas) { return; }
    var gl = null;
    try { gl = canvas.getContext('webgl2', { antialias: true, alpha: false, powerPreference: 'low-power' }); } catch (e) {}
    if (!gl) { return; } // CSS fallback stays visible

    var vs = compile(gl, gl.VERTEX_SHADER, HERO_VERT);
    var fs = compile(gl, gl.FRAGMENT_SHADER, HERO_FRAG);
    if (!vs || !fs) { return; }
    var prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { return; }
    gl.useProgram(prog);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    var uRes = gl.getUniformLocation(prog, 'res');
    var uTime = gl.getUniformLocation(prog, 'time');
    var uPtr = gl.getUniformLocation(prog, 'ptr');

    var ptr = { x: 0, y: 0, tx: 0, ty: 0 };
    var hero = document.querySelector('.vs-hero');
    if (hero && !reduceMotion) {
      hero.addEventListener('pointermove', function (e) {
        var r = hero.getBoundingClientRect();
        ptr.tx = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1);
        ptr.ty = clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1);
      }, { passive: true });
      hero.addEventListener('pointerleave', function () { ptr.tx = 0; ptr.ty = 0; }, { passive: true });
    }

    function size() { var f = fitCanvas(canvas); gl.viewport(0, 0, canvas.width, canvas.height); return f; }
    size();
    window.addEventListener('resize', size, { passive: true });

    function draw(tSec) {
      ptr.x = lerp(ptr.x, ptr.tx, 0.06); ptr.y = lerp(ptr.y, ptr.ty, 0.06);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, tSec);
      gl.uniform2f(uPtr, ptr.x, -ptr.y);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    canvas.classList.add('is-live');
    if (reduceMotion) { draw(6.0); return; } // one calm static frame

    var start = null, visible = true, raf = 0;
    try {
      var io = new IntersectionObserver(function (e) { visible = e[0].isIntersecting; if (visible && !raf) { raf = requestAnimationFrame(loop); } }, {});
      io.observe(hero || canvas);
    } catch (e) {}
    function loop(now) {
      raf = 0;
      if (start === null) { start = now; }
      draw((now - start) / 1000);
      if (visible) { raf = requestAnimationFrame(loop); }
    }
    raf = requestAnimationFrame(loop);
  }

  /* ------------------------------------------------------------------ */
  /* CH2 — sticky Scan → Separate → Flatten → Read sequence              */
  /* ------------------------------------------------------------------ */
  function setupSequence() {
    var wrap = document.querySelector('[data-seq]');
    if (!wrap) { return; }
    var canvas = wrap.querySelector('.vs-seq-canvas');
    var steps = [].slice.call(wrap.querySelectorAll('[data-seq-step]'));
    var tagName = wrap.querySelector('[data-seq-tag]');
    var tagIndex = wrap.querySelector('[data-seq-index]');
    var ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;

    var meta = {
      scan: { i: 0, tag: 'Scan', morph: 0, explode: 0, mark: 0, hi: 0.5, scan: 1 },
      separate: { i: 1, tag: 'Separate', morph: 0, explode: 1, mark: 0, hi: 1, scan: 0 },
      flatten: { i: 2, tag: 'Flatten', morph: 1, explode: 0, mark: 0, hi: 1, scan: 0 },
      detect: { i: 3, tag: 'Read', morph: 1, explode: 0, mark: 1, hi: 1, scan: 0 }
    };
    var cur = { morph: 0, explode: 0, mark: 0, hi: 0.5, scan: 1 };
    var target = meta.scan;
    var L = 13;
    var marks = [];
    for (var m = 0; m < 26; m++) { marks.push({ x: Math.random(), y: (Math.random() - 0.5), on: Math.random() > 0.7 }); }

    function setState(key) {
      target = meta[key] || meta.scan;
      steps.forEach(function (s) { s.classList.toggle('is-active', s.getAttribute('data-seq-step') === key); });
      if (tagName) { tagName.textContent = target.tag; }
      if (tagIndex) { tagIndex.textContent = String(target.i + 1).padStart(2, '0'); }
      if (reduceMotion) { cur.morph = target.morph; cur.explode = target.explode; cur.mark = target.mark; cur.hi = target.hi; cur.scan = target.scan; draw(0); }
    }

    function draw(tSec) {
      if (!ctx) { return; }
      var f = fitCanvas(canvas);
      var W = canvas.width, H = canvas.height, d = f.dpr;
      var cx = W / 2, cy = H / 2;
      var R = Math.min(W, H) * 0.40;
      ctx.clearRect(0, 0, W, H);

      var highlightLayer = 6;
      var samples = 96;
      for (var i = 0; i < L; i++) {
        var frac = (i + 1) / L;
        var rad = R * frac + cur.explode * (i - L / 2) * (R * 0.012);
        var yFlat = cy + (i - (L - 1) / 2) * (R * 2 / L);
        var isHi = i === highlightLayer;
        ctx.beginPath();
        for (var sIdx = 0; sIdx <= samples; sIdx++) {
          var th = -Math.PI + (sIdx / samples) * Math.PI * 2;
          var pxC = cx + Math.cos(th) * rad;
          var pyC = cy + Math.sin(th) * rad;
          var pxF = cx + (th / Math.PI) * (R * 1.02);
          var pyF = yFlat;
          var px = lerp(pxC, pxF, cur.morph);
          var py = lerp(pyC, pyF, cur.morph);
          if (sIdx === 0) { ctx.moveTo(px, py); } else { ctx.lineTo(px, py); }
        }
        var baseA = 0.10 + 0.10 * (1 - Math.abs(i - L / 2) / (L / 2));
        if (isHi) {
          ctx.strokeStyle = 'rgba(255,90,31,' + (0.35 + 0.5 * cur.hi) + ')';
          ctx.lineWidth = 1.6 * d;
          ctx.shadowColor = 'rgba(255,90,31,0.6)'; ctx.shadowBlur = 8 * d * cur.hi;
        } else {
          ctx.strokeStyle = 'rgba(236,231,221,' + baseA + ')';
          ctx.lineWidth = 1 * d; ctx.shadowBlur = 0;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // scan plane (scan state): a sweeping cool line
      if (cur.scan > 0.01) {
        var sy = cy + Math.sin((tSec || 0) * 0.0016) * R * 0.9;
        if (reduceMotion) { sy = cy - R * 0.3; }
        var grd = ctx.createLinearGradient(cx - R, sy, cx + R, sy);
        grd.addColorStop(0, 'rgba(111,180,214,0)');
        grd.addColorStop(0.5, 'rgba(111,180,214,' + (0.55 * cur.scan) + ')');
        grd.addColorStop(1, 'rgba(111,180,214,0)');
        ctx.strokeStyle = grd; ctx.lineWidth = 1.4 * d;
        ctx.beginPath(); ctx.moveTo(cx - R * 1.05, sy); ctx.lineTo(cx + R * 1.05, sy); ctx.stroke();
      }

      // ink marks (detect state): specks on the flattened middle rows
      if (cur.mark > 0.01) {
        for (var k = 0; k < marks.length; k++) {
          var mk = marks[k];
          var mx = cx + (mk.x * 2 - 1) * (R * 0.95);
          var my = cy + mk.y * (R * 0.5);
          var a = cur.mark * (mk.on ? 0.9 : 0.4);
          ctx.fillStyle = mk.on ? 'rgba(255,90,31,' + a + ')' : 'rgba(236,231,221,' + (a * 0.5) + ')';
          var sz = (mk.on ? 2.4 : 1.6) * d;
          ctx.fillRect(mx - sz / 2, my - sz / 2, sz, sz);
          if (mk.on) { ctx.shadowColor = 'rgba(255,90,31,0.5)'; ctx.shadowBlur = 6 * d; ctx.fillRect(mx - sz / 2, my - sz / 2, sz, sz); ctx.shadowBlur = 0; }
        }
      }
    }

    // activate steps via ScrollTrigger (no pinning), else IntersectionObserver
    setState('scan');
    if (!reduceMotion && hasGsap && window.innerWidth > 760) {
      steps.forEach(function (step) {
        window.ScrollTrigger.create({
          trigger: step, start: 'top 60%', end: 'bottom 40%',
          onEnter: function () { setState(step.getAttribute('data-seq-step')); },
          onEnterBack: function () { setState(step.getAttribute('data-seq-step')); }
        });
      });
    } else if (!reduceMotion && 'IntersectionObserver' in window) {
      var so = new IntersectionObserver(function (ents) {
        ents.forEach(function (e) { if (e.isIntersecting) { setState(e.target.getAttribute('data-seq-step')); } });
      }, { rootMargin: '-45% 0px -45% 0px' });
      steps.forEach(function (s) { so.observe(s); });
    }
    // click a step to jump its state (keyboard/mobile friendly)
    steps.forEach(function (s) {
      s.addEventListener('click', function () { setState(s.getAttribute('data-seq-step')); });
    });

    if (reduceMotion) { setState('detect'); return; }
    onScreenLoop(canvas, function (t) {
      cur.morph = lerp(cur.morph, target.morph, 0.08);
      cur.explode = lerp(cur.explode, target.explode, 0.08);
      cur.mark = lerp(cur.mark, target.mark, 0.08);
      cur.hi = lerp(cur.hi, target.hi, 0.1);
      cur.scan = lerp(cur.scan, target.scan, 0.08);
      draw(t);
    });
  }

  /* ------------------------------------------------------------------ */
  /* CH3 — false-signal field (glyphs → papyrus fiber)                   */
  /* ------------------------------------------------------------------ */
  function setupFalseField() {
    var wrap = document.querySelector('[data-falsefield]');
    if (!wrap) { return; }
    var canvas = wrap.querySelector('.vs-falsefield-canvas');
    var ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;
    if (!ctx) { return; }

    // Build fake "glyph" stroke points and their dissolved "fiber" targets.
    var N = 220, pts = [];
    var cols = 7;
    for (var i = 0; i < N; i++) {
      var col = i % cols;
      var t = (i / N);
      // glyph layout: clustered vertical strokes that read as letters
      var gx = (col + 0.5) / cols + (Math.sin(i * 12.9898) * 0.5 + 0.5 - 0.5) * 0.04;
      var gy = 0.28 + (Math.floor(i / cols) % 6) * 0.09 + (Math.sin(i) * 0.012);
      // fiber layout: scattered along horizontal fiber lines
      var fy = Math.floor((Math.sin(i * 78.233) * 0.5 + 0.5) * 22) / 22;
      var fx = (Math.sin(i * 45.11) * 0.5 + 0.5);
      pts.push({ gx: gx, gy: clamp(gy, 0.06, 0.9), fx: fx, fy: fy });
    }

    var prog = 0, target = 0;
    function draw() {
      var f = fitCanvas(canvas);
      var W = canvas.width, H = canvas.height, d = f.dpr;
      ctx.clearRect(0, 0, W, H);
      var p = prog;
      // background fiber texture strengthens with progress
      ctx.lineWidth = 1 * d;
      var fibers = 26;
      for (var l = 0; l < fibers; l++) {
        var y = (l + 0.5) / fibers * H;
        var a = 0.03 + 0.05 * p;
        ctx.strokeStyle = 'rgba(236,231,221,' + a + ')';
        ctx.beginPath();
        for (var x = 0; x <= W; x += 8 * d) {
          var yy = y + Math.sin(x * 0.01 + l) * 2 * d;
          if (x === 0) { ctx.moveTo(x, yy); } else { ctx.lineTo(x, yy); }
        }
        ctx.stroke();
      }
      // marks: interpolate glyph → fiber, orange → faint ash
      for (var i = 0; i < pts.length; i++) {
        var pt = pts[i];
        var x = lerp(pt.gx, pt.fx, p) * W;
        var y = lerp(pt.gy, pt.fy, p) * H;
        var glyphA = (1 - p);
        var col = 'rgba(255,90,31,' + (0.20 + 0.6 * glyphA) + ')';
        if (p > 0.5) { col = 'rgba(236,231,221,' + (0.10 + 0.12 * (1 - p)) + ')'; }
        ctx.fillStyle = col;
        var w = lerp(2.2, 1.2, p) * d, h = lerp(7.0, 1.4, p) * d;
        ctx.fillRect(x - w / 2, y - h / 2, w, h);
      }
    }

    if (reduceMotion) { prog = 0.55; draw(); return; }

    if (hasGsap) {
      window.ScrollTrigger.create({
        trigger: wrap, start: 'top 85%', end: 'bottom 30%', scrub: true,
        onUpdate: function (self) { target = self.progress; }
      });
    }
    var visible = false, raf = 0;
    function loop() {
      raf = 0;
      if (!hasGsap) {
        // fallback: derive progress from element position in viewport
        var r = wrap.getBoundingClientRect();
        target = clamp(1 - (r.bottom) / (window.innerHeight + r.height), 0, 1);
      }
      prog = lerp(prog, target, 0.12);
      draw();
      if (visible) { raf = requestAnimationFrame(loop); }
    }
    try {
      var io = new IntersectionObserver(function (e) { visible = e[0].isIntersecting; if (visible && !raf) { raf = requestAnimationFrame(loop); } }, { rootMargin: '120px' });
      io.observe(wrap);
    } catch (e) { visible = true; raf = requestAnimationFrame(loop); }
    draw();
  }

  /* ------------------------------------------------------------------ */
  /* CH4 — evidence pipeline: packet + progressive node reveal           */
  /* ------------------------------------------------------------------ */
  function setupPipeline() {
    var wrap = document.querySelector('[data-pipeline]');
    if (!wrap) { return; }
    var packet = wrap.querySelector('.vs-packet');
    var nodes = [].slice.call(wrap.querySelectorAll('[data-node]'));

    if (reduceMotion || !hasGsap || window.innerWidth <= 760) {
      nodes.forEach(function (n) { n.classList.add('in'); });
      return;
    }
    window.ScrollTrigger.create({
      trigger: wrap, start: 'top 80%', end: 'bottom 55%', scrub: 0.6,
      onUpdate: function (self) {
        var p = self.progress;
        if (packet) { packet.style.left = (p * 100) + '%'; }
        nodes.forEach(function (n, i) {
          var threshold = i / (nodes.length - 1 || 1);
          n.classList.toggle('in', p >= threshold - 0.04);
        });
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* CH5 — Cohors Vesuviana atlas (hover preview, click pins)            */
  /* ------------------------------------------------------------------ */
  function setupAtlas() {
    var wrap = document.querySelector('[data-atlas]');
    if (!wrap) { return; }
    var roles = [].slice.call(wrap.querySelectorAll('[data-role]'));
    if (!roles.length) { return; }
    var canHover = false;
    try { canHover = window.matchMedia('(hover:hover) and (pointer:fine)').matches; } catch (e) {}
    var pinned = roles[0];

    function apply(active) {
      roles.forEach(function (r) {
        var on = r === active;
        r.classList.toggle('is-active', on);
        var btn = r.querySelector('.vs-role-btn');
        if (btn) { btn.setAttribute('aria-expanded', on ? 'true' : 'false'); }
      });
    }
    apply(pinned);

    roles.forEach(function (r) {
      var btn = r.querySelector('.vs-role-btn');
      if (!btn) { return; }
      btn.addEventListener('click', function () { pinned = r; apply(r); });
      btn.addEventListener('focus', function () { apply(r); });
      btn.addEventListener('blur', function () { apply(pinned); });
      if (canHover) {
        r.addEventListener('mouseenter', function () { apply(r); });
      }
    });
    if (canHover) {
      wrap.addEventListener('mouseleave', function () { apply(pinned); });
    }
  }

  /* ------------------------------------------------------------------ */
  /* CH6 — quiet ending: near-empty field, one point of orange light     */
  /* ------------------------------------------------------------------ */
  function setupEnding() {
    var canvas = document.querySelector('.vs-ending-canvas');
    var ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;
    if (!ctx) { return; }
    function draw(tSec) {
      var f = fitCanvas(canvas);
      var W = canvas.width, H = canvas.height, d = f.dpr;
      ctx.clearRect(0, 0, W, H);
      var cx = W * 0.62, cy = H * 0.46;
      var pulse = reduceMotion ? 0.5 : (0.5 + 0.5 * Math.sin(tSec * 0.0009));
      var rad = Math.min(W, H) * (0.10 + 0.02 * pulse);
      var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad * 3.4);
      g.addColorStop(0, 'rgba(255,110,60,' + (0.55 + 0.25 * pulse) + ')');
      g.addColorStop(0.18, 'rgba(255,90,31,0.28)');
      g.addColorStop(0.5, 'rgba(255,90,31,0.05)');
      g.addColorStop(1, 'rgba(255,90,31,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(255,150,110,0.95)';
      ctx.beginPath(); ctx.arc(cx, cy, 2.2 * d, 0, Math.PI * 2); ctx.fill();
    }
    if (reduceMotion) { draw(0); return; }
    onScreenLoop(canvas, draw);
  }

  /* ------------------------------------------------------------------ */
  /* Reveals                                                             */
  /* ------------------------------------------------------------------ */
  function setupReveals() {
    var sel = ['.vs-chapter-head', '.vs-prose', '.vs-plate', '.vs-fact', '.vs-bento article', '.vs-role', '.vs-ending-copy', '.vs-atlas-flow', '.vs-falsefield-lesson'];
    var items = [].slice.call(document.querySelectorAll(sel.join(',')));
    items.forEach(function (it) { it.classList.add('vs-reveal'); });
    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (it) { it.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.06, rootMargin: '0px 0px -6% 0px' });
    items.forEach(function (it) { io.observe(it); });
    window.setTimeout(function () { items.forEach(function (it) { it.classList.add('in'); }); }, 4000);
  }

  /* ------------------------------------------------------------------ */
  function init() {
    root.classList.add('vs-js');
    setupViewport();
    setupChrome();
    setupReveals();
    setupHero();
    setupSequence();
    setupFalseField();
    setupPipeline();
    setupAtlas();
    setupEnding();
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();
