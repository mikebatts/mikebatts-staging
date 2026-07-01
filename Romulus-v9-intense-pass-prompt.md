You are Claude Opus 4.7 running via subscription. Your task: completely redesign `/Users/michaelbattaglia/.openclaw/workspace/mikebatts/romulus.html`. This is a full rewrite — aggressive, dramatic, and clean. Read the full file first.

## The Core Problem

The current hero looks foggy and washed out. Text sits on a cream overlay (`rgba(244,241,235, 0.30)` etc.) which mutes the video completely. The "Roma Eterna" text in cream is nearly invisible. The ascii-filter adds a third layer of haze. The result: a video that's supposed to be the hero experience feels like a dead background.

## The Design Direction

1. **Hero should be BOLD WHITE TEXT on a DARK SCIM over the video.** Not cream. Not foggy. The text pops hard against the darkened video.
2. **Cream only at the very bottom edge** — a smooth gradient from dark scrim to cream that blends seamlessly into the cream body sections.
3. **Remove the ascii-filter entirely** — the videos already have the ASCII/dot-matrix treatment baked into them from production. Redundant.
4. **Swap hero video:** Use the scene.mp4 (Roman villa portico) as the hero — it's the more dramatic, atmospheric video. Move bath.mp4 to the cinematic quote section.
5. **More dramatic overall:** deeper colors, higher contrast, more confident typography.

---

## STEP 1: Read the full file

Read ALL of `/Users/michaelbattaglia/.openclaw/workspace/mikebatts/romulus.html` (1310 lines).

---

## STEP 2: Refined Color Palette — Deeper, More Dramatic

```css
:root {
  --bg: #F2EDE5;
  --bg-warm: #EBE4D8;
  --ink: #141310;
  --ink-2: #2E2C28;
  --ink-3: #5C5850;
  --ink-4: #8A8578;
  --rule: rgba(20, 19, 16, 0.08);
  --accent: #7A1616;
  --accent-strong: #5C0F0F;
  --gold: #A8840A;
  --charcoal: #0A0908;
  --measure: 640px;
}
```

---

## STEP 3: Base — Absolutely Clean, No Noise

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

::selection { background: var(--accent); color: #fff; }
```

**REMOVE ALL:** paper-grain div (if exists), global scanlines, ALL `.ascii-filter` divs. The page is clean cream. The videos already have their treatment baked in.

---

## STEP 4: Hero — Bold, Dramatic, Dark Scrim

Remove cream overlay entirely. Use a dark scrim so the video SHINES and text pops.

Use scene.mp4 (Roman villa portico) — more atmospheric and dramatic than bath.mp4 for a hero.

```html
<header class="hero" id="hero">
  <div class="hero-media">
    <video class="hero-video" autoplay muted loop playsinline disablepictureinpicture preload="metadata" poster="video-refs/scene_1s.jpg">
      <source src="video-refs/scene.mp4" type="video/mp4">
    </video>
    <div class="hero-overlay"></div>
  </div>

  <div class="hero-content">
    <div class="hero-eyebrow">ROMA&nbsp;ETERNA</div>
    <h1 class="hero-title">How I Built My&nbsp;AI,</h1>
    <h1 class="hero-title hero-title-italic">Then Built With&nbsp;It.</h1>
    <p class="hero-desc">Eighty-seven days. One designed system. Four products shipped or in&nbsp;flight.</p>
    <div class="hero-meta">
      <span>Feb 3 &rarr; May 1, 2026</span>
      <span class="meta-dot"></span>
      <span>Brooklyn, NY</span>
      <span class="meta-dot"></span>
      <span>Mike Battaglia</span>
    </div>
  </div>

  <div class="hero-scroll">scroll</div>
</header>
```

CSS:

```css
.hero {
  position: relative;
  min-height: 100dvh;
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

.hero-video {
  position: absolute;
  inset: 0;
  width: 100%; height: 100%;
  object-fit: cover;
  filter: none;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  background: linear-gradient(
    180deg,
    rgba(10, 9, 8, 0.50) 0%,
    rgba(10, 9, 8, 0.25) 35%,
    rgba(10, 9, 8, 0.0) 55%,
    rgba(10, 9, 8, 0.0) 70%,
    var(--bg) 92%,
    var(--bg) 100%
  );
}
/* CRITICAL: Dark scrim at top (50% opacity) for text readability, fades to 0% opacity at 55% (video shows clearly), then cream at 92% to blend into body. NOT a cream overlay. Dark scrim. */

.hero-content {
  position: relative;
  z-index: 2;
  max-width: 900px;
  padding: 0 32px;
}

.hero-eyebrow {
  font-family: 'Inconsolata', monospace;
  font-size: 10px;
  letter-spacing: 0.7em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.50);
  margin-bottom: 20px;
}

.hero-title {
  font-family: 'Source Serif 4', serif;
  font-size: clamp(36px, 7.5vw, 100px);
  font-weight: 400;
  line-height: 1.04;
  letter-spacing: -0.018em;
  color: rgba(255, 255, 255, 0.96);
  margin-bottom: 0;
}

.hero-title-italic {
  font-style: italic;
  color: rgba(255, 255, 255, 0.70);
  margin-bottom: 32px;
}

.hero-desc {
  font-family: 'Inter', sans-serif;
  font-size: clamp(15px, 2vw, 20px);
  color: rgba(255, 255, 255, 0.55);
  max-width: 540px;
  margin: 0 auto 32px;
}

.hero-meta {
  font-family: 'Inconsolata', monospace;
  font-size: 10px;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.35);
}

.meta-dot {
  display: inline-block;
  width: 3px; height: 3px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  margin: 0 14px;
  vertical-align: middle;
}

.hero-scroll {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
  font-family: 'Inconsolata', monospace;
  font-size: 9px;
  letter-spacing: 0.6em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.25);
}
```

---

## STEP 5: Nav — Transparent Over Hero, Cream Over Body

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

.romulus-nav a {
  color: rgba(255,255,255,0.50);
  text-decoration: none;
  transition: color 0.2s;
}
.romulus-nav a:hover { color: #fff; }
.romulus-nav .badge { color: rgba(255,255,255,0.35); }

.romulus-nav.nav-light {
  background: var(--bg);
}
.romulus-nav.nav-light a { color: var(--ink-3); }
.romulus-nav.nav-light a:hover { color: var(--accent); }
.romulus-nav.nav-light .badge { color: var(--ink-4); }
```

JS: Add scroll listener that adds `nav-light` class when user scrolls past 65% of hero height.

---

## STEP 6: Clean Typography — Sharp Contrast

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
  background: var(--bg-warm);
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

## STEP 7: ACT Sections — Generous Space

```css
.act { position: relative; padding: 100px 32px; max-width: 1200px; margin: 0 auto; }
.act-narrow { max-width: 860px; }

.act-label {
  font-family: 'Inconsolata', monospace;
  font-size: 10px;
  letter-spacing: 0.55em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 20px;
}

.act-title {
  font-family: 'Source Serif 4', serif;
  font-size: clamp(32px, 5.2vw, 68px);
  font-weight: 400;
  line-height: 1.06;
  color: var(--ink);
  margin-bottom: 52px;
  letter-spacing: -0.01em;
}
.act-title em { font-style: italic; color: var(--accent); }
```

---

## STEP 8: Editorial Grid — NO Decorative Borders

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

.editorial-media { position: sticky; top: 80px; }

.media-frame {
  position: relative;
  overflow: hidden;
  background: var(--bg-warm);
  aspect-ratio: 3/4;
}
.media-frame video {
  position: absolute;
  inset: 0;
  width: 100%; height: 100%;
  object-fit: cover;
}
.media-frame::before { content: none; }
.media-frame::after { content: none; }
/* NO borders, NO ::before, NO ::after */

.media-cap {
  margin-top: 12px;
  font-family: 'Inconsolata', monospace;
  font-size: 10px;
  letter-spacing: 0.30em;
  text-transform: uppercase;
  color: var(--ink-4);
}
```

---

## STEP 9: Stats — Museum Labels

```css
.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  max-width: 1200px;
  margin: 0 auto;
  padding: 64px 32px;
}
.stat {
  text-align: center;
  padding: 40px 20px;
  position: relative;
}
.stat + .stat::before {
  content: '';
  position: absolute;
  left: 0; top: 20%; bottom: 20%;
  width: 1px;
  background: var(--rule);
}

.stat-num {
  display: block;
  font-family: 'Source Serif 4', serif;
  font-size: clamp(40px, 5vw, 60px);
  font-weight: 400;
  line-height: 1;
  color: var(--ink);
  margin-bottom: 12px;
}
.stat-label {
  font-family: 'Inconsolata', monospace;
  font-size: 10px;
  letter-spacing: 0.35em;
  text-transform: uppercase;
  color: var(--ink-4);
}
```

---

## STEP 10: Projects — Clean, No Floating Numerals

REMOVE `.project-numeral` entirely.

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
  border-bottom: 1px solid;
}
.project-status a:hover { color: var(--accent); }
```

---

## STEP 11: Cinematic Interstitial — bath.mp4

Swap: bath.mp4 (flooded colonnaded hall) → cinematic section. The dramatic dark section.

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
    rgba(10, 9, 8, 0.80) 16%,
    rgba(10, 9, 8, 0.50) 50%,
    rgba(10, 9, 8, 0.80) 84%,
    var(--bg) 100%
  );
}

.cinematic-inner {
  position: relative;
  z-index: 3;
  max-width: 800px;
  padding: 0 28px;
}

.cinematic-quote {
  font-family: 'Source Serif 4', serif;
  font-style: italic;
  font-size: clamp(24px, 4vw, 48px);
  line-height: 1.30;
  color: rgba(255, 255, 255, 0.94);
  text-shadow: 0 2px 40px rgba(0, 0, 0, 0.50);
  margin-bottom: 20px;
}

.cinematic-attr {
  font-family: 'Inconsolata', monospace;
  font-size: 10px;
  letter-spacing: 0.45em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.30);
}
```

---

## STEP 12: Password Gate — Clean, Sharp

NO video, NO scanlines, NO ascii-filter. Clean cream card on cream background.

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
  max-width: 360px;
  width: 100%;
  padding: 40px 28px 32px;
}

.gate-mark {
  font-family: 'Source Serif 4', serif;
  font-style: italic;
  font-size: clamp(36px, 7vw, 56px);
  font-weight: 400;
  color: var(--ink);
  margin-bottom: 6px;
  letter-spacing: -0.01em;
}

.gate-sub {
  font-family: 'Inconsolata', monospace;
  font-size: 10px;
  letter-spacing: 0.45em;
  text-transform: uppercase;
  color: var(--ink-4);
  margin-bottom: 32px;
}

.gate-line {
  width: 32px;
  height: 1px;
  background: var(--ink-4);
  margin: 0 auto 28px;
}

.gate-label {
  font-family: 'Inconsolata', monospace;
  font-size: 9px;
  letter-spacing: 0.5em;
  text-transform: uppercase;
  color: var(--ink-4);
  margin-bottom: 14px;
}

.gate-input {
  width: 100%;
  padding: 12px 0;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--ink-4);
  text-align: center;
  font-family: 'Inter', sans-serif;
  font-size: 15px;
  color: var(--ink);
  outline: none;
  letter-spacing: 0.05em;
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
.gate-submit:hover { opacity: 0.75; }

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
  color: var(--ink-4);
}
```

HTML for gate (NO video, NO scanlines, NO ascii-filter):
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

JS: PASSWORD check, localStorage (24h), unlock — keep existing logic.

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

## STEP 15: Byline — Clean Footer

```css
.byline {
  padding: 120px 32px;
  text-align: center;
  border-top: 1px solid var(--rule);
}
.byline-inner { max-width: 480px; margin: 0 auto; }
.byline-mark {
  font-family: 'Source Serif 4', serif;
  font-style: italic;
  font-size: 28px;
  color: var(--ink);
  margin-bottom: 12px;
}
.byline-line {
  width: 32px; height: 1px;
  background: var(--ink-4);
  margin: 0 auto 24px;
}
.byline-name {
  font-family: 'Source Serif 4', serif;
  font-size: 20px;
  color: var(--ink);
  margin-bottom: 10px;
}
.byline-role {
  font-size: 15px;
  color: var(--ink-3);
  line-height: 1.7;
}
.byline-role .dot { color: var(--ink-4); margin: 0 6px; }
.byline-coda {
  margin-top: 28px;
  font-family: 'Inconsolata', monospace;
  font-size: 9px;
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
  transition: opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1), transform 0.8s cubic-bezier(0.22, 1, 0.36, 1);
}
.romulus-visible { opacity: 1; transform: none; }
```

No parallax. Remove parallax helper class. Keep IntersectionObserver only.

---

## STEP 17: Responsive

```css
@media (max-width: 800px) {
  .editorial, .editorial.reverse { grid-template-columns: 1fr; gap: 36px; }
  .editorial-media { position: static; }
  .media-frame { aspect-ratio: 16/10; max-width: 480px; margin: 0 auto; }
  .stats { grid-template-columns: repeat(2, 1fr); padding: 48px 24px; }
  .stat + .stat::before { left: 0; top: 0; bottom: auto; right: 0; width: 100%; height: 1px; top: 0; }
  .cinematic { margin: 40px 0; min-height: 50vh; }
  .hero-title { font-size: clamp(32px, 8vw, 72px); }
}

@media (max-width: 480px) {
  .stats { grid-template-columns: 1fr; padding: 40px 20px; }
  .stat + .stat::before { display: none; }
  .act { padding: 72px 20px; }
  .hero-content { padding: 0 20px; }
  .byline { padding: 80px 20px; }
  .hero-title { font-size: clamp(28px, 9vw, 60px); }
}
```

---

## STEP 18: Nav Scroll Detection

```javascript
(function() {
  const nav = document.getElementById('topNav');
  const hero = document.getElementById('hero');
  if (!nav || !hero) return;
  function checkScroll() {
    if (window.scrollY > hero.offsetHeight * 0.65) {
      nav.classList.add('nav-light');
    } else {
      nav.classList.remove('nav-light');
    }
  }
  window.addEventListener('scroll', checkScroll, { passive: true });
  checkScroll();
})();
```

---

## STEP 19: Build

Write COMPLETE final file to `/Users/michaelbattaglia/.openclaw/workspace/mikebatts/romulus.html`. Every CSS rule, every HTML element, every JS line. No shortcuts.

Copy content verbatim from `romulus-case-study.md`.

Password gate JS: keep password comparison logic (the previous version had a bug where anything unlocked it).

---

## STEP 20: Deploy

```bash
cd /Users/michaelbattaglia/.openclaw/workspace/mikebatts
git add romulus.html
git commit -m "V9: Dramatic dark-scrim hero, scene.mp4 swapped, no ascii-filter hazing"
git push origin master
```

---

## STEP 21: Report

1. High-level summary
2. Live URL: mikebatts.net/romulus.html  
3. Notes on video load, mobile, password behavior
