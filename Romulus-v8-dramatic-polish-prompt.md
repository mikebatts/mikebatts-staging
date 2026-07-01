You are Claude Opus 4.7 running via subscription. Your task: completely redesign `/Users/michaelbattaglia/.openclaw/workspace/mikebatts/romulus.html`. Full rewrite. Read the file entirely. Apply changes precisely.

Design philosophy: **Light-mode editorial page** with classical video content treated through an ASCII/dot-matrix filter. Clean typography on cream backgrounds. ContraLabs.com as heavy inspiration — but we're more eloquent, Roman Greco-futurism, with our own ASCII art treatment.

Keep copy from romulus-case-study.md verbatim. Keep password gate JS verbatim. Rewrite ALL CSS + hero/media structure.

---

## STEP 1: New Color Palette

```css
:root {
  --bg: #F4F1EB;
  --bg-dark: #EDE8DF;
  --ink: #1A1A1A;
  --ink-2: #3A3835;
  --ink-3: #636059;
  --ink-4: #938F87;
  --ink-5: #C4C0B8;
  --rule: rgba(26, 26, 26, 0.07);
  --accent: #8B1A1A;
  --accent-faint: rgba(139, 26, 26, 0.07);
  --gold: #B8960B;
  --gold-soft: rgba(184, 150, 11, 0.12);
  --charcoal: #0F0E0C;
  --measure: 640px;
  --wide: 1200px;
}
```

Warmer cream base. Deep ink for contrast. Deep burgundy accent (not cherry red). ONE accent color system.

---

## STEP 2: Base Styles — Clean & Minimal

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: var(--bg);
  color: var(--ink-2);
  font-family: 'Inter', sans-serif;
  font-size: 17px;
  line-height: 1.75;
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}
```

**REMOVE ALL:** paper-grain overlay, paper-grain div, global scanlines. The page is clean cream. No noise layers.

---

## STEP 3: ASCII Dot-Matrix Filter — Signature Treatment

Replace the scanlines with a proper halftone/dot-matrix overlay (ascii-magic.com style):

```css
.ascii-filter {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 2;
  background-image: radial-gradient(circle at center, rgba(26,26,26,0.07) 0.5px, transparent 0.5px);
  background-size: 3px 3px;
}

.ascii-filter.inverse {
  background-image: radial-gradient(circle at center, rgba(255,255,255,0.07) 0.5px, transparent 0.5px);
}
```

This creates a halftone dot pattern over videos — making classical imagery feel digitally rendered. It's the visual signature, not noise.

---

## STEP 4: Hero — bath.mp4, Clean Light Mode

Currently: cream gradient washes out the video completely. Text sits on cream overlaid on cream. Video is dead.

Fix: The hero has a cream background that BLEEDS THROUGH the video at the bottom for seamless transition, but the video itself is VISIBLE at the top. Text sits on a dark scrim for contrast.

```html
<header class="hero" id="hero">
  <div class="hero-media">
    <video class="hero-video" autoplay muted loop playsinline disablepictureinpicture preload="metadata" poster="video-refs/bath_1s.jpg"
      style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;"></video>
    <div class="hero-overlay"></div>
    <div class="ascii-filter"></div>
  </div>

  <div class="hero-content" data-romulus-animate>
    <div class="hero-eyebrow">R O M A &nbsp; E T E R N A</div>
    <div class="hero-mark">Romulus</div>
    <div class="hero-subtitle">A Case Study</div>
    <h1 class="hero-title">How I Built My&nbsp;AI,</h1>
    <h1 class="hero-title hero-title-accent">Then Built With&nbsp;It.</h1>
    <p class="hero-desc">Eighty-seven days. One designed system. Four products shipped.</p>
    <div class="hero-meta">
      <span>Feb 3 &rarr; May 1, 2026</span>
      <span class="dot">&bull;</span>
      <span>Brooklyn, NY</span>
    </div>
  </div>

  <div class="scroll-cue" data-romulus-animate>Scroll</div>
</header>
```

CSS:

```css
.hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  overflow: hidden;
}

.hero-media {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  background: linear-gradient(
    180deg,
    rgba(244,241,235, 0.30) 0%,
    rgba(244,241,235, 0.15) 28%,
    rgba(244,241,235, 0.0) 48%,
    rgba(244,241,235, 0.0) 60%,
    var(--bg) 88%,
    var(--bg) 100%
  );
}
/* Cream opacity ramp. Visible at top (30%), clears in middle (0% at 48%), blends to solid cream at bottom. */

.hero-content {
  position: relative;
  z-index: 3;
  max-width: 860px;
  padding: 0 32px;
}

.hero-eyebrow {
  font-family: 'Inconsolata', monospace;
  font-size: 10px;
  letter-spacing: 0.6em;
  text-transform: uppercase;
  color: var(--ink-3);
  margin-bottom: 16px;
}

.hero-mark {
  font-family: 'Source Serif 4', serif;
  font-style: italic;
  font-size: clamp(14px, 1.8vw, 18px);
  color: var(--ink-3);
  margin-bottom: 6px;
}

.hero-subtitle {
  font-family: 'Inconsolata', monospace;
  font-size: 10px;
  letter-spacing: 0.45em;
  text-transform: uppercase;
  color: var(--ink-4);
  margin-bottom: 32px;
}

.hero-title {
  font-family: 'Source Serif 4', serif;
  font-size: clamp(36px, 7.5vw, 96px);
  font-weight: 400;
  line-height: 1.06;
  letter-spacing: -0.016em;
  color: var(--ink);
  margin-bottom: 0;
}

.hero-title-accent {
  font-style: italic;
  color: var(--accent);
  margin-bottom: 28px;
}

.hero-desc {
  font-family: 'Inter', sans-serif;
  font-size: clamp(15px, 2vw, 20px);
  color: var(--ink-3);
  max-width: 540px;
  margin: 0 auto 28px;
}

.hero-meta {
  font-family: 'Inconsolata', monospace;
  font-size: 11px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--ink-4);
}
.hero-meta .dot { margin: 0 12px; color: var(--ink-5); }

.scroll-cue {
  position: absolute;
  bottom: 48px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 3;
  font-family: 'Inconsolata', monospace;
  font-size: 9px;
  letter-spacing: 0.5em;
  text-transform: uppercase;
  color: var(--ink-4);
}
```

The hero has a CREAM overlay (not dark scrim) — matching the overall light mode. The cream ramp starts at 30% opacity (text is visible on the cream-tinted video), drops to 0% (video shows clearly in the middle), then blends to solid cream at the bottom. No dark overlays. Light mode throughout.

---

## STEP 5: Navigation — Transparent to Cream

```css
.romulus-nav {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 100;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 28px;
  font-family: 'Inconsolata', monospace;
  font-size: 10px;
  letter-spacing: 0.35em;
  text-transform: uppercase;
  background: none;
  transition: background 0.4s ease;
}

.romulus-nav a { color: var(--ink-3); text-decoration: none; transition: color 0.2s; }
.romulus-nav a:hover { color: var(--accent); }
.romulus-nav .badge { color: var(--ink-4); }
```

JS: Add scroll listener — when user scrolls past hero, add class `.nav-solid` that gives it `background: var(--bg)`.

---

## STEP 6: Clean Typography System

```css
.prose { max-width: var(--measure); }
.prose p { color: var(--ink-2); line-height: 1.8; margin-bottom: 24px; }
.prose p:last-child { margin-bottom: 0; }

.prose em {
  font-family: 'Source Serif 4', serif;
  font-style: italic;
  color: var(--ink);
}

.prose code {
  font-family: 'Inconsolata', monospace;
  font-size: 14px;
  background: var(--bg-dark);
  padding: 2px 6px;
  border-radius: 3px;
  color: var(--ink);
}

.pull-quote {
  font-family: 'Source Serif 4', serif;
  font-style: italic;
  font-size: clamp(20px, 2.4vw, 26px);
  line-height: 1.40;
  color: var(--ink);
  border-left: 2px solid var(--accent);
  padding: 4px 0 4px 24px;
  margin: 52px 0;
  max-width: var(--measure);
}
```

---

## STEP 7: Clean ACT Styling

```css
.act { position: relative; padding: 100px 32px; max-width: 1160px; margin: 0 auto; }
.act-narrow { max-width: 860px; }

.act-label {
  font-family: 'Inconsolata', monospace;
  font-size: 10px;
  letter-spacing: 0.5em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 20px;
}

.act-title {
  font-family: 'Source Serif 4', serif;
  font-size: clamp(32px, 5.2vw, 64px);
  font-weight: 400;
  line-height: 1.06;
  color: var(--ink);
  margin-bottom: 52px;
  letter-spacing: -0.01em;
}

.act-title em { font-style: italic; color: var(--accent); }
```

---

## STEP 8: Editorial Grid — Text + Portrait Video Insets

Portrait videos (eterna.mp4, pillars.mp4) as magazine-style editorial insets alongside text.

```css
.editorial {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 0.7fr);
  gap: 56px;
  align-items: start;
}
.editorial.reverse { grid-template-columns: minmax(0, 0.7fr) minmax(0, 1fr); }
.editorial.reverse .editorial-text { order: 2; }
.editorial.reverse .editorial-media { order: 1; }

.editorial-text .prose { max-width: none; }

.editorial-media {
  position: sticky;
  top: 80px;
}

.media-frame {
  position: relative;
  overflow: hidden;
  background: var(--bg-dark);
  aspect-ratio: 3/4;
}

.media-frame video {
  position: absolute;
  inset: 0;
  width: 100%; height: 100%;
  object-fit: cover;
}

.media-frame::before, .media-frame::after { content: none; }
/* NO decorative borders. The frames are just clean rectangles showing the video. */

.media-cap {
  margin-top: 14px;
  font-family: 'Inconsolata', monospace;
  font-size: 10px;
  letter-spacing: 0.30em;
  text-transform: uppercase;
  color: var(--ink-4);
}
```

CRITICAL: **NO crimson borders on inset images.** Remove all `.video-frame::after` pseudo-elements that paint colored side-borders. Remove `.video-frame::before`. Clean rectangles only.

---

## STEP 9: Minimalist Stats

```css
.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  max-width: var(--wide);
  margin: 0 auto;
  border-top: 1px solid var(--rule);
  border-bottom: 1px solid var(--rule);
}

.stat {
  text-align: center;
  padding: 56px 20px;
  border-right: 1px solid var(--rule);
}
.stat:last-child { border-right: none; }

.stat-num {
  display: block;
  font-family: 'Source Serif 4', serif;
  font-size: clamp(40px, 5vw, 56px);
  font-weight: 400;
  line-height: 1;
  color: var(--ink);
  margin-bottom: 10px;
}

.stat-label {
  font-family: 'Inconsolata', monospace;
  font-size: 10px;
  letter-spacing: 0.35em;
  text-transform: uppercase;
  color: var(--ink-4);
}
```

NO SaaS card vibes. No backgrounds. No inner borders. No hover effects. Just clean numbers. Museum wall labels.

---

## STEP 10: Projects — Remove Floating Numerals

REMOVE `.project-numeral` entirely. No oversized italic Roman numerals at 8% opacity floating top-right.

```css
.project { padding: 80px 0; border-top: 1px solid var(--rule); max-width: var(--measure); }
.project:first-of-type { border-top: none; padding-top: 40px; }

.project-num {
  font-family: 'Inconsolata', monospace;
  font-size: 10px;
  letter-spacing: 0.4em;
  text-transform: uppercase;
  color: var(--ink-3);
  margin-bottom: 16px;
}

.project-name {
  font-family: 'Source Serif 4', serif;
  font-size: clamp(28px, 4.6vw, 52px);
  font-weight: 400;
  line-height: 1.08;
  color: var(--ink);
  margin-bottom: 10px;
}

.project-tagline {
  font-family: 'Source Serif 4', serif;
  font-style: italic;
  font-size: clamp(15px, 1.8vw, 19px);
  color: var(--ink-3);
}

.project-status {
  font-family: 'Inconsolata', monospace;
  font-size: 11px;
  letter-spacing: 0.20em;
  text-transform: uppercase;
  color: var(--ink-4);
  margin-bottom: 36px;
}
.project-status a {
  color: var(--gold);
  text-decoration: none;
  border-bottom: 1px solid var(--gold-soft);
}
.project-status a:hover { color: var(--accent); border-color: var(--accent); }
```

---

## STEP 11: Dramatic Interstitial — scene.mp4

Between Act 2 (The Build) and Act 3 (A Tuesday). This is the ONE dark section on the entire page — a rare contrast moment.

```css
.cinematic {
  position: relative;
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  overflow: hidden;
  background: var(--charcoal);
  margin: 80px 0;
}

.cinematic-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  background: linear-gradient(
    180deg,
    var(--bg) 0%,
    rgba(15,14,12, 0.80) 16%,
    rgba(15,14,12, 0.45) 50%,
    rgba(15,14,12, 0.80) 84%,
    var(--bg) 100%
  );
}

.cinematic-inner {
  position: relative;
  z-index: 3;
  max-width: 780px;
  padding: 0 28px;
}

.cinematic-quote {
  font-family: 'Source Serif 4', serif;
  font-style: italic;
  font-size: clamp(24px, 4vw, 44px);
  line-height: 1.30;
  color: rgba(255,255,255,0.92);
  text-shadow: 0 2px 30px rgba(0,0,0,0.40);
  margin-bottom: 20px;
}

.cinematic-attr {
  font-family: 'Inconsolata', monospace;
  font-size: 10px;
  letter-spacing: 0.45em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.30);
}
```

Cream gradient edges blend to/from the cream body on both sides. ONE dark moment, earned through contrast.

---

## STEP 12: Password Gate — Minimalist

NO video. NO scanlines. NO grain. Just a clean entrance.

```css
.romulus-gate {
  position: fixed;
  inset: 0;
  z-index: 9000;
  background: var(--bg);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.romulus-gate.hidden { display: none; }

.gate-card {
  text-align: center;
  max-width: 380px;
  width: 100%;
  padding: 48px 32px 36px;
}

.gate-mark {
  font-family: 'Source Serif 4', serif;
  font-style: italic;
  font-size: clamp(36px, 6vw, 52px);
  font-weight: 400;
  color: var(--ink);
  margin-bottom: 6px;
}

.gate-sub {
  font-family: 'Inconsolata', monospace;
  font-size: 10px;
  letter-spacing: 0.45em;
  text-transform: uppercase;
  color: var(--ink-3);
  margin-bottom: 28px;
}

.gate-line {
  width: 40px;
  height: 1px;
  background: var(--ink-5);
  margin: 0 auto 28px;
}

.gate-label {
  font-family: 'Inconsolata', monospace;
  font-size: 10px;
  letter-spacing: 0.45em;
  text-transform: uppercase;
  color: var(--ink-4);
  margin-bottom: 14px;
}

.gate-input {
  width: 100%;
  padding: 12px 0;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--ink-5);
  text-align: center;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: var(--ink);
  outline: none;
  letter-spacing: 0.06em;
  margin-bottom: 16px;
  transition: border-color 0.2s;
}
.gate-input::placeholder { color: var(--ink-4); font-size: 13px; letter-spacing: 0.1em; }
.gate-input:focus { border-bottom-color: var(--accent); }

.gate-submit {
  width: 100%;
  padding: 12px 20px;
  background: var(--ink);
  color: var(--bg);
  border: none;
  font-family: 'Inconsolata', monospace;
  font-size: 10px;
  letter-spacing: 0.4em;
  text-transform: uppercase;
  cursor: pointer;
}
.gate-submit:hover { opacity: 0.8; }

.gate-error {
  display: none;
  margin-top: 12px;
  font-family: 'Inconsolata', monospace;
  font-size: 10px;
  letter-spacing: 0.3em;
  color: var(--accent);
  text-transform: uppercase;
}
.gate-error.visible { display: block; }

.gate-foot {
  margin-top: 28px;
  font-family: 'Inconsolata', monospace;
  font-size: 9px;
  letter-spacing: 0.5em;
  text-transform: uppercase;
  color: var(--ink-5);
}
```

Gate HTML (no video, no scanlines, no tint):
```html
<div class="romulus-gate" id="gate">
  <div class="gate-card">
    <div class="gate-mark">Romulus</div>
    <div class="gate-sub">A Case Study</div>
    <div class="gate-line"></div>
    <div class="gate-label">Access Required</div>
    <input type="password" class="gate-input" id="gateInput" placeholder="passphrase" autocomplete="off" />
    <button class="gate-submit" id="gateSubmit">Enter</button>
    <div class="gate-error" id="gateError">Incorrect passphrase. Try again.</div>
    <div class="gate-foot">MMXXVI</div>
  </div>
</div>
```

JS: PASSWORD, localStorage (24h TTL), unlock() — all verbatim.

---

## STEP 13: Sub-act Labels

```css
.sub-act { padding: 56px 0 8px; }
.sub-act-tag {
  font-family: 'Inconsolata', monospace;
  font-size: 10px;
  letter-spacing: 0.45em;
  text-transform: uppercase;
  color: var(--ink-3);
  margin-bottom: 14px;
}
.sub-act-heading {
  font-family: 'Source Serif 4', serif;
  font-size: clamp(24px, 3.2vw, 36px);
  font-weight: 400;
  line-height: 1.2;
  color: var(--ink);
  margin-bottom: 28px;
}
```

---

## STEP 14: Pattern List (Delegation Pattern)

```css
.pattern-list { list-style: none; counter-reset: pl; margin: 8px 0 0; }

.pattern-list li {
  counter-increment: pl;
  position: relative;
  padding-left: 48px;
  margin-bottom: 20px;
  font-size: 17px;
  line-height: 1.7;
  color: var(--ink-2);
}

.pattern-list li::before {
  content: counter(pl, upper-roman);
  position: absolute;
  left: 0; top: 0;
  font-family: 'Source Serif 4', serif;
  font-style: italic;
  font-size: 15px;
  color: var(--accent);
  width: 32px;
}
```

---

## STEP 15: Byline (Clean Footer)

```css
.byline {
  padding: 120px 32px;
  text-align: center;
  border-top: 1px solid var(--rule);
}

.byline-content { max-width: 500px; margin: 0 auto; }
.byline-mark {
  font-family: 'Source Serif 4', serif;
  font-style: italic;
  font-size: 28px;
  color: var(--ink);
  margin-bottom: 12px;
}
.byline-line {
  width: 40px; height: 1px;
  background: var(--ink-5);
  margin: 0 auto 24px;
}
.byline-name {
  font-family: 'Source Serif 4', serif;
  font-size: 20px;
  color: var(--ink);
  margin-bottom: 12px;
}
.byline-role {
  font-family: 'Inter', sans-serif;
  font-size: 15px;
  color: var(--ink-2);
  line-height: 1.7;
}
.byline-role .dot { color: var(--ink-4); margin: 0 6px; }
.byline-coda {
  margin-top: 28px;
  font-family: 'Inconsolata', monospace;
  font-size: 10px;
  letter-spacing: 0.5em;
  text-transform: uppercase;
  color: var(--ink-4);
}
```

---

## STEP 16: Scroll Animations

```css
[data-romulus-animate] {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1),
              transform 0.8s cubic-bezier(0.22, 1, 0.36, 1);
}
.romulus-visible { opacity: 1; transform: none; }

/* Hero content fades in immediately */
.hero[data-romulus-animate] { opacity: 1; transform: none; transition: none; }
.hero[data-romulus-animate] .hero-content {
  opacity: 0; transform: translateY(20px);
  transition: opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1),
              transform 0.8s cubic-bezier(0.22, 1, 0.36, 1);
}
.hero.romulus-visible .hero-content { opacity: 1; transform: none; }
```

Remove parallax JS. Keep IntersectionObserver.

---

## STEP 17: Responsive

```css
@media (max-width: 800px) {
  .editorial, .editorial.reverse { grid-template-columns: 1fr; gap: 36px; }
  .editorial-media { position: static; }
  .media-frame { aspect-ratio: 16/10; max-width: 480px; margin: 0 auto; }
  .stats { grid-template-columns: repeat(2, 1fr); }
  .stat { border-right: none; border-bottom: 1px solid var(--rule); }
  .stat:nth-last-child(-n+2) { border-bottom: none; }
}

@media (max-width: 480px) {
  .stats { grid-template-columns: 1fr; }
  .stat { border-bottom: 1px solid var(--rule); }
  .stat:last-child { border-bottom: none; }
  .act { padding: 72px 20px; }
  .hero-content { padding: 0 20px; }
  .byline { padding: 80px 20px; }
}
```

---

## STEP 18: Nav Scroll Detection (add this JS)

After the password gate script, add:

```javascript
// Nav background toggle on scroll
(function() {
  const nav = document.getElementById('topNav');
  if (!nav) return;
  const hero = document.getElementById('hero');
  if (!hero) return;

  function checkScroll() {
    const heroBottom = hero.offsetHeight * 0.7;
    if (window.scrollY > heroBottom) {
      nav.classList.add('nav-solid');
    } else {
      nav.classList.remove('nav-solid');
    }
  }
  window.addEventListener('scroll', checkScroll, { passive: true });
  checkScroll();
})();
```

CSS for nav-solid:
```css
.nav-solid {
  background: var(--bg) !important;
}
```

---

## STEP 19: Build

Write the COMPLETE final file. Every CSS rule. Every HTML element. Copy content verbatim from `romulus-case-study.md`. Password gate JS unchanged.

---

## STEP 20: Deploy

```bash
cd /Users/michaelbattaglia/.openclaw/workspace/mikebatts
git add romulus.html
git commit -m "V8: Clean editorial redesign, light-mode, ASCII dot-matrix filter, dramatic hero video"
git push origin master
```

---

## STEP 21: Report

1. High-level summary (what changed, what was removed, what was added)
2. Live URL: mikebatts.net/romulus.html
3. Notes (video load times, mobile considerations)
