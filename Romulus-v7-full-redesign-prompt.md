You are Claude Opus 4.7 running via subscription. Your job is to completely rewrite `/Users/michaelbattaglia/.openclaw/workspace/mikebatts/romulus.html` as a premium, award-quality editorial case study. This is NOT a surgical patch — it's a full rebuild. The copy stays the same. The structure stays the same. The VISUAL EXECUTION needs to be dramatically better.

Use the awwwards-design skill as your guiding framework. Apply the antislop principle of minimalism and intention — every pixel earns its place.

Heavy inspiration: contralabs.com (bold editorial typography, generous whitespace, dramatic full-bleed media, purposeful use of serif + sans-serif) combined with our "Roman Greco-futurism" aesthetic (classical Roman/renaissance art, ASCII art overlay treatment, ancient-meets-digital).

---

## STEP 1: Read the current file

Read `/Users/michaelbattaglia/.openclaw/workspace/mikebatts/romulus.html` in full. Note:
- Copy is in `romulus-case-study.md` (do NOT change any prose)
- Password gate JS works — preserve it
- Videos: bath.mp4 (landscape), scene.mp4 (landscape), eterna.mp4 (portrait), pillars.mp4 (portrait)
- Video refs: `video-refs/` folder

---

## STEP 2: Color System — Light-mode Greco-futurism

Replace the entire CSS `:root` with this refined palette:

```css
:root {
  --cream: #F5F0E8;
  --cream-light: #FAF7F0;
  --ink: #1A1A18;
  --ink-secondary: #4A4844;
  --ink-muted: #888580;
  --rule: rgba(26, 26, 24, 0.08);
  --crimson: #7A1616;
  --crimson-bright: #9B2020;
  --gold: #C4A35A;
  --charcoal: #121110;
  --measure: 660px;
  --wide: 1140px;
}
```

**Why these changes:**
- `--cream` shifted from `#F8F5EF` to `#F5F0E8` — slightly warmer, more parchment-like, more refined
- `--cream-light` replaces multiple cream variants (`cream-deep`, `cream-warm`, `paper`) — ONE cream for all light backgrounds
- `--ink` deepened to `#1A1A18` — sharper contrast, not washed-out
- `--crimson` deepened to `#7A1616` — more burgundy, less cherry red
- `--gold` replaces bronze — warmer, more classical
- Remove `--crimson-soft`, `--crimson-deep`, `--bronze-soft` — simplify the accent system

---

## STEP 3: Global styles — clean and intentional

### Remove ALL decorative overlays:
- NO paper-grain overlay (delete the `.paper-grain` class and its div)
- NO global scan-line overlay
- Scan-lines ONLY appear on video backgrounds, and only as a subtle texture layer

### Body:
```css
body {
  background: var(--cream);
  color: var(--ink-secondary);
  font-family: 'Inter', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  line-height: 1.7;
}
```

### Typography system:
- Headings (h1-h3): Source Serif 4 — large, confident, italic where needed
- Body: Inter — 17px, line-height 1.8, color `--ink-secondary`
- Labels/metadata: Inconsolata — 10-11px, uppercase, wide letter-spacing
- Pull quotes: Source Serif 4 italic — 22-28px, with crimson left border
- Code inline: Inconsolata — no background box, just color contrast

---

## STEP 4: Password Gate — clean entrance

NO video background. NO scan-line overlay. Just a clean cream card on a cream field.

```html
<div class="romulus-gate" id="gate">
  <div class="gate-card">
    <div class="gate-eyebrow">R O M A&nbsp;E T E R N A</div>
    <div class="gate-mark">Romulus</div>
    <div class="gate-sub">A Case Study</div>
    <div class="gate-line"></div>
    <div class="gate-label">Access Required</div>
    <input type="password" class="gate-input" id="gateInput" placeholder="passphrase" autocomplete="off" />
    <button class="gate-submit" id="gateSubmit">Enter</button>
    <div class="gate-error" id="gateError">Incorrect passphrase. Try again.</div>
  </div>
  <div class="gate-foot">MMXXVI</div>
</div>
```

CSS:
- Gate background: `var(--cream)` — solid, clean
- Gate card: white background, subtle shadow, crimson accent line at top
- Gate mark: Source Serif italic, crimson, large
- Gate input: thin underline style (not boxed), inks on focus
- Gate button: transparent with crimson border, uppercase monospace
- All existing JS stays (PASSWORD, localStorage, session check)
- Remove ALL gate video/scantile/tint/grain references

---

## STEP 5: Hero — bath.mp4 full-bleed, but dramatically better

The hero currently has a cream gradient overlay that washes out the video. We want the video to COME THROUGH while text stays readable. Think: a classical painting visible behind editorial typography.

```html
<header class="hero" id="hero">
  <div class="hero-media">
    <video class="hero-video" autoplay muted loop playsinline disablepictureinpicture preload="metadata" poster="video-refs/bath_1s.jpg">
      <source src="video-refs/bath.mp4" type="video/mp4">
    </video>
    <div class="hero-scanlines"></div>
  </div>
  <div class="hero-overlay"></div>
  <div class="hero-content">
    <div class="hero-eyebrow">R O M A&nbsp;E T E R N A</div>
    <div class="hero-subtitle-mark">Romulus &middot; A Case Study</div>
    <h1 class="hero-title">How I Built My&nbsp;AI,</h1>
    <h1 class="hero-title accent">Then Built With&nbsp;It.</h1>
    <p class="hero-desc">Eighty-seven days. One designed system. Four products shipped.</p>
    <div class="hero-meta">
      <span>Feb 3 → May 1, 2026</span>
      <span class="sep">—</span>
      <span>Brooklyn, NY</span>
    </div>
  </div>
</header>
```

CSS (key changes):
- Hero is 100vh, full-bleed video, NO cream gradient background
- Video uses `object-fit: cover`, filter: `contrast(1.05) brightness(0.92) saturate(0.90)` — slight warmth
- Scan-lines overlay: VERY subtle, `repeating-linear-gradient` at 1.5% opacity with 4px gaps
- Hero overlay: NOT a cream wash. Instead, use a targeted dark-to-transparent gradient ONLY where text sits:

```css
.hero-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(
    180deg,
    rgba(26, 26, 24, 0.15) 0%,
    rgba(26, 26, 24, 0.0) 35%,
    rgba(26, 26, 24, 0.0) 55%,
    rgba(26, 26, 24, 0.04) 75%,
    rgba(26, 26, 24, 0.20) 90%,
    rgba(26, 26, 24, 0.40) 96%,
    var(--cream) 100%
  );
}
```

This creates a subtle dark scrim behind text (so it reads clearly on any part of the video) with a smooth cream fade-to-body at the bottom edge.

- Hero title: Source Serif 4, very large (`clamp(48px, 8vw, 120px)`), `--ink` color
- The "Then Built With It." part: crimson (`#7A161A`), italic, on its own line
- Hero desc: Inter, 18px, `--ink-secondary`, centered
- Hero meta: Inconsolata, 11px, `--ink-muted`, with crimson accent dashes

Bottom of hero: a simple "SCROLL ↓" cue in crimson monospace, not a vertical line.

Transition from hero to first cream section: the cream gradient at the hero's bottom creates a seamless blend into the cream content sections below.

---

## STEP 6: Content sections — clean editorial flow

### After hero, cream sections with:
- Generous bottom/top padding (120px)
- Max-width content (660px for prose, 1140px for wide layouts)
- NO decorative dividers between sections

### Act labels:
- Inconsolata, 10px, uppercase, `--crimson`, letter-spacing 0.5em
- With a small crimson dot before: `· ACT 01`

### Act titles:
- Source Serif 4, `clamp(38px, 5.5vw, 72px)`, `--ink`
- Subtitle in smaller serif italic where applicable

### Prose:
- Inter, 17.5px, line-height 1.8, `--ink-secondary`
- Max-width 660px
- Paragraph spacing: 28px
- `<em>` in body text: Source Serif italic, `--ink` color (no background pill)
- `<code>` inline: Inconsolata, `--ink`, background: `rgba(26,26,24,0.04)`, padding: 2px 6px, border-radius: 2px

### Pull quotes:
- Source Serif italic, `clamp(20px, 2.5vw, 28px)`, `--ink`
- Left border: 2px solid `--crimson`
- Padding: 8px 0 8px 24px
- Margin: 56px 0

### Sub-act sections (// memory, // model, etc.):
- Tag: Inconsolata, 10px, uppercase, wide letter-spacing, `--ink-muted`
- Sub-heading: Inter, 20-22px, `--ink`, weight 500
- Body: same as regular prose

### Pattern list (Act 2, "The Delegation Pattern"):
- Roman numerals in Source Serif italic, crimson: `I`, `II`, `III`, etc.
- List items: Inter, 17.5px, line-height 1.7, `--ink-secondary`
- Clean left alignment, no background boxes

---

## STEP 7: Editorial two-column layout (text + portrait video inset)

This is the key innovation. Portrait videos (eterna.mp4, pillars.mp4) are placed as editorial media panels alongside text, like a magazine spread.

```html
<section class="act act-narrow">
  <div class="act-label">· ACT 01</div>
  <h2 class="act-title">The Identity</h2>

  <div class="editorial">
    <div class="editorial-text">
      <p>Body copy flows here...</p>
      <p>More text paragraphs...</p>
    </div>
    <aside class="editorial-media">
      <div class="media-frame">
        <video autoplay muted loop playsinline disablepictureinpicture preload="metadata" poster="video-refs/eterna_1s.jpg">
          <source src="video-refs/eterna.mp4" type="video/mp4">
        </video>
        <div class="media-scanlines"></div>
      </div>
      <div class="media-caption">
        <span class="cap-dot"></span>
        The Colosseum — Arena Architecture
      </div>
    </aside>
  </div>
</section>
```

CSS:
- `.editorial`: CSS Grid, `1fr 0.7fr`, 60px gap, align-items start
- `.editorial.reverse`: swap columns
- `.editorial-media`: sticky, top 100px
- `.media-frame`: aspect-ratio 3/4, overflow hidden, subtle shadow
- `.media-frame video`: `object-fit: cover`, width 100%, height 100%
- `.media-scanlines`: subtle repeating-linear-gradient at 1.5% opacity, 4px gaps
- `.media-frame::before`: very subtle inset border, 1px, rgba(26,26,24,0.06), NOT crimson
- **NO crimson border on the side** — the user explicitly doesn't like the "cherry red border on images"
- `.media-caption`: Inconsolata, 10px, `--ink-muted`, letter-spacing 0.3em, with subtle dot prefix
- Mobile: collapse to single column, media first (full width), text below

For Act 2, swap: video-left/text-right using `.editorial.reverse`.

---

## STEP 8: Stats section (87 days / 4 products / 1 system / ∞ decisions)

Clean, minimal stat tiles on a cream background. No shadows, no inner borders, no hover lift effects.

```css
.stats-float {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0;
  max-width: var(--wide);
  margin: 80px auto;
  padding: 0 32px;
}
.stat-tile {
  text-align: center;
  padding: 60px 20px;
  border-right: 1px solid var(--rule);
}
.stat-tile:last-child { border-right: none; }
.stat-number {
  font-family: 'Source Serif 4', serif;
  font-size: 64px;
  color: var(--ink);
  line-height: 1;
}
.stat-unit {
  font-family: 'Source Serif 4', serif;
  font-style: italic;
  font-size: 15px;
  color: var(--ink-muted);
  margin-top: 12px;
}
.stat-label {
  font-family: 'Inconsolata', monospace;
  font-size: 10px;
  letter-spacing: 0.4em;
  text-transform: uppercase;
  color: var(--ink-muted);
  margin-top: 8px;
}
```

Mobile: collapse to 2 columns with border-bottom instead of border-right.

---

## STEP 9: Cinematic interstitial — scene.mp4 dramatic break

Between Act 2 (The Build) and Act 3 (A Tuesday), insert a full-bleed video section:

```html
<section class="cinematic">
  <video class="cinematic-video" autoplay muted loop playsinline disablepictureinpicture preload="metadata" poster="video-refs/scene_1s.jpg">
    <source src="video-refs/scene.mp4" type="video/mp4">
  </video>
  <div class="cinematic-scanlines"></div>
  <div class="cinematic-overlay"></div>
  <div class="cinematic-content">
    <div class="cinematic-quote">"Execution is free. Judgment is everything."</div>
  </div>
</section>
```

CSS:
- 70vh height, video full-bleed
- Video filter: `brightness(0.7) saturate(0.85)` — dark and moody
- Scanlines: 3% opacity (more visible on dark backgrounds)
- Overlay: dark-to-transparent radial gradient:
  ```css
  .cinematic-overlay {
    background: radial-gradient(ellipse at center, rgba(18,17,16,0.3) 0%, rgba(18,17,16,0.85) 100%);
  }
  ```
- Quote: Source Serif italic, white at 90% opacity, `clamp(26px, 4vw, 50px)`
- Cream edge gradients at top and bottom for seamless transitions

---

## STEP 10: Projects section (Act 4)

Remove the oversized italic crimson roman numerals floating top-right. They feel decorative and out of place.

Instead, each project gets:
```html
<article class="project">
  <div class="project-header">
    <div class="project-tag">
      <span class="tag-line"></span>
      Project 01
    </div>
    <h2 class="project-name">Chronicle</h2>
    <div class="project-status">
      Live at <a href="https://thischronicle.com" target="_blank">thischronicle.com</a>
    </div>
  </div>
  <div class="project-body">
    <p>Body copy...</p>
  </div>
</article>
```

- Tag: Inconsolata, 10px, uppercase, `--ink-muted`, with a 16px `--crimson` line prefix
- Name: Source Serif 4, `clamp(32px, 4.8vw, 56px)`, `--ink`
- Status: Inconsolata, 11px, `--ink-muted`, with link in `--gold`
- Body: standard prose, max-width 660px
- Bottom border: 1px `--rule` between projects
- Generous vertical spacing between projects (100px padding top)

---

## STEP 11: Byline / Footer

Clean, minimal, no video background. Cream field with subtle gold accents.

```html
<footer class="byline">
  <div class="byline-content">
    <div class="byline-mark">Romulus</div>
    <div class="byline-line"></div>
    <p class="byline-name">Mike Battaglia</p>
    <p class="byline-role">Senior PM at Daylight <span class="dot">·</span> Founder, Cherry Street Labs</p>
    <p class="byline-loc">Brooklyn, NY <span class="dot">·</span> <a href="https://mikebatts.net">mikebatts.net</a></p>
  </div>
</footer>
```

- Mark: Source Serif italic, `--crimson`, 36px
- Gold line: 48px wide, 1px, `--gold`, centered
- Name: Inter, 20px, `--ink`
- Role/loc: Inter, 15px, `--ink-secondary`
- Generous padding: 120px top/bottom

---

## STEP 12: Navigation

Clean, minimal, over-video:
```html
<nav class="romulus-nav" id="topNav">
  <a href="index.html">← mikebatts.net</a>
  <span class="badge">Case Study · MMXXVI</span>
</nav>
```

CSS:
- Fixed, top: 0, left: 0, right: 0
- Background: `linear-gradient(180deg, var(--cream) 0%, var(--cream) 60%, transparent 100%)` — no blur backdrop needed
- Font: Inconsolata, 11px, `--ink-muted`
- Hover: links go to `--crimson`
- Z-index: 100

---

## STEP 13: Animations

- Scroll-triggered fade-in for sections: `opacity: 0 → 1`, `transform: translateY(24px) → 0`, duration 0.8s, ease `cubic-bezier(0.22, 1, 0.36, 1)`
- Parallax drift on hero video: subtle slow drift (0.15x) using requestAnimationFrame
- Hero content fades in with stagger: eyebrow → mark → title → desc → meta
- `prefers-reduced-motion`: disable all animations, make videos `display:none`

---

## STEP 14: Scan-line implementation details

Global scan-line CSS (only visible on videos):

```css
.hero-scanlines,
.media-scanlines,
.cinematic-scanlines {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 2;
}
.hero-scanlines {
  background: repeating-linear-gradient(
    0deg,
    rgba(26, 26, 24, 0.018) 0px,
    rgba(26, 26, 24, 0.018) 1px,
    transparent 1px,
    transparent 4px
  );
}
.cinematic-scanlines {
  background: repeating-linear-gradient(
    0deg,
    rgba(255, 255, 255, 0.035) 0px,
    rgba(255, 255, 255, 0.035) 1px,
    transparent 1px,
    transparent 4px
  );
}
.media-scanlines {
  background: repeating-linear-gradient(
    0deg,
    rgba(26, 26, 24, 0.015) 0px,
    rgba(26, 26, 24, 0.015) 1px,
    transparent 1px,
    transparent 4px
  );
}
```

Note: On cream backgrounds use dark lines (rgba(26,26,24,...)). On dark backgrounds use light lines (rgba(255,255,255,...)).

---

## STEP 15: Responsive design

```css
/* Tablet */
@media (max-width: 768px) {
  .editorial {
    grid-template-columns: 1fr;
    gap: 40px;
  }
  .editorial-media { position: static; }
  .stats-float { grid-template-columns: repeat(2, 1fr); }
  .stats-float .stat-tile { border-right: none; border-bottom: 1px solid var(--rule); }
  .stats-float .stat-tile:nth-last-child(-n+2) { border-bottom: none; }
  .cinematic { min-height: 50vh; }
}

/* Mobile */
@media (max-width: 480px) {
  .hero { padding: 120px 20px 80px; }
  .act { padding: 80px 20px; }
  .hero-title { font-size: clamp(32px, 9vw, 64px); }
  .act-title { margin-bottom: 40px; }
  .stats-float { grid-template-columns: 1fr; }
  .stats-float .stat-tile { border-bottom: 1px solid var(--rule); padding: 40px 20px; }
  .stats-float .stat-tile:last-child { border-bottom: none; }
}
```

---

## STEP 16: Build instructions

1. Write the COMPLETE final `romulus.html` file
2. Every CSS rule, every HTML element, every script line — no shortcuts
3. Copy content verbatim from `/Users/michaelbattaglia/.openclaw/workspace/mikebatts/romulus-case-study.md`
4. Keep password gate JS exactly as-is
5. Use Google Fonts: Source Serif 4, Inter, Inconsolata (single request)

---

## STEP 17: Deploy

```bash
cd /Users/michaelbattaglia/.openclaw/workspace/mikebatts
git add romulus.html video-refs/*.jpg
git commit -m "Redesign: Awwwards-level editorial case study, clean media, Roman Greco-futurism aesthetic"
git push origin master
```

---

## STEP 18: Report

When done:
1. High-level summary of changes
2. Live URL (mikebatts.net/romulus.html)
3. Notes on what to watch (video load times, mobile testing)