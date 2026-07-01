You are Claude Opus 4.7 running via subscription. Your job is to do a comprehensive visual redesign of `/Users/michaelbattaglia/.openclaw/workspace/mikebatts/romulus.html`. This is a light-mode, cream/parchment Greco-futurism case study page with embedded video backgrounds. The page is ALREADY built and deployed — it just looks muddy and overworked. You need to strip back the visual noise and make it look clean, elegant, and intentional.

This is a SURRENDER-AND-BUILD task: the HTML structure is good, the copy is good, the concept is good — the VISUAL EXECUTION needs to be tightened.

---

## STEP 1: Read the file

Read ALL of `/Users/michaelbattaglia/.openclaw/workspace/mikebatts/romulus.html`. Understand every CSS rule, every HTML section.

---

## STEP 2: The design philosophy — "Quiet Elegance"

This is a case study page on a personal portfolio. It should feel like a premium editorial publication — think New York Times Magazine, Monocle, or a high-end architect's portfolio. NOT a dark hacker terminal, NOT a grainy CRT scan, NOT a distressed vintage filter.

The Greco-futurism aesthetic should come from:
- The classical video content itself (busts, columns, Roman architecture)
- The CRT scan-line treatment applied ONLY to the videos, subtly
- Typography that feels classical-meets-modern
- Generous negative space

Everything else should be CLEAN: solid cream backgrounds, sharp text, minimal decoration.

---

## STEP 3: Specific fixes (surgical replacements)

### FIX 1: REMOVE the paper-grain overlay entirely

The `.paper-grain` fixed-position SVG noise filter at 45% opacity is the #1 cause of the muddy feel. It adds grain to EVERYTHING — text, videos, backgrounds — and makes the whole page look distressed instead of clean.

Delete the `.paper-grain` CSS rule entirely.
Delete the `<div class="paper-grain" aria-hidden="true"></div>` from the HTML.

The videos already have their own scanlines. The page doesn't need a third layer of noise.

### FIX 2: Hero overlay — smooth, natural blending

Current hero overlay has jarring opacity jumps:
```css
background:
  linear-gradient(180deg,
    rgba(248, 245, 239, 0.10) 0%,
    rgba(248, 245, 239, 0.05) 25%,
    rgba(248, 245, 239, 0.15) 55%,
    rgba(248, 245, 239, 0.45) 75%,
    rgba(248, 245, 239, 0.85) 88%,
    rgba(248, 245, 239, 0.95) 94%,
    rgba(248, 245, 239, 1) 100%);
```

The problem: the hero has a cream gradient wash that fights with the cream body background below it, creating a visible transition line.

Replace with a much simpler approach:

```css
.hero-overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background:
    linear-gradient(180deg,
      rgba(248, 245, 239, 0.0) 0%,
      rgba(248, 245, 239, 0.0) 18%,
      rgba(248, 245, 239, 0.12) 40%,
      rgba(248, 245, 239, 0.40) 62%,
      rgba(248, 245, 239, 0.72) 78%,
      rgba(248, 245, 239, 0.90) 86%,
      rgba(248, 245, 239, 1.0) 94%,
      rgba(248, 245, 239, 1.0) 100%);
}
```

Key changes:
- Start at 0% opacity at the very top (video shows through completely)
- Stay transparent until 18% (more video visible)
- Smooth, gradual ramp with smaller increments
- The cream at the bottom matches exactly the body background `--cream: #F8F5EF` so there's NO visible transition

### FIX 3: Hero text text-shadows — make them natural

Current hero text has subtle dark text-shadows. For text over video backgrounds in an editorial context, use a VERY subtle dark shadow ONLY where needed for contrast:

```css
.hero-title {
  /* Remove existing text-shadow. Add subtle dark shadow for video legibility */
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}
.hero-subtitle {
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}
.hero-eyebrow {
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}
```

These should be barely visible — just enough to prevent text from disappearing against bright parts of the video. The cream gradient overlay does most of the work.

### FIX 4: Hero video filter — make it natural, NOT filtered

Current: `filter: contrast(1.02) brightness(1.0) saturate(0.85) sepia(0.03);`

Replace with:
```css
.video-bg--hero {
  filter: none;
}
```

The video is already warm-toned (it's a classical painting). Don't filter it. Let the cream gradient overlay handle the tint.

### FIX 5: Inset video filters — same thing

Current: `filter: contrast(1.05) brightness(0.96) saturate(0.82) sepia(0.04);`

Replace with:
```css
.video-bg--inset {
  filter: none;
}
```

### FIX 6: Dark video (cinematic) — remove the crimson tint

Current:
```css
.cinematic-tint {
  background:
    linear-gradient(180deg, rgba(26, 25, 22, 0.78) 0%, rgba(26, 25, 22, 0.42) 40%, rgba(26, 25, 22, 0.86) 100%),
    radial-gradient(ellipse at 50% 60%, rgba(139, 26, 26, 0.15), transparent 60%);
}
```

The crimson tint (`rgba(139, 26, 26, 0.15)`) over the Neoclassical painting looks wrong. It's painting red over painted imagery.

Replace with:
```css
.cinematic-tint {
  background: linear-gradient(180deg, rgba(26, 25, 22, 0.72) 0%, rgba(26, 25, 22, 0.38) 40%, rgba(26, 25, 22, 0.80) 100%);
}
```

Just a simple dark scrim. Let the painting show through.

### FIX 7: Remove section dividers

The `.section-divider` elements with bronze lines and dots between EVERY act create visual interruption. Editorial pages use whitespace, not decorative elements, to separate sections.

In the HTML, REPLACE each:
```html
<div class="section-divider"><span class="crest"></span></div>
```

With an empty line (just remove the entire element). Or if you want subtle separation, use a single thin rule:
```html
<hr class="section-rule">
```

Where `.section-rule { border: none; border-top: 1px solid var(--rule-soft); margin: 0 auto; max-width: var(--measure); }` (much simpler than the bronze dot dividers).

### FIX 8: Simplify scanlines on inset videos

Current inset videos have scanlines-soft (2.5%) layered on top of each portrait video frame. For the editorial look, KEEP the scanlines but make them even more subtle on inset videos:

```css
.video-frame .scanlines-soft {
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.015) 0px,
    rgba(0, 0, 0, 0.015) 1px,
    transparent 1px,
    transparent 4px
  );
}
```

1.5% instead of 2.5%, and wider gaps (4px instead of 3px) so the scanlines are barely perceptible — more like the texture of an old photograph than a CRT screen.

### FIX 9: Gate — make it cleaner

The gate has bath.mp4 playing behind it with a tint layer and scanlines. This creates a muddy entrance.

Simplify: Remove the video from the gate entirely. Make the gate a clean cream background with the card centered.

Replace the gate HTML to NOT include the `<video>` element. Just:
```html
<div class="romulus-gate" id="gate" style="background: var(--cream);">
  <div class="gate-card">
    <!-- card contents unchanged -->
  </div>
  <div class="gate-foot">MMXXVI &middot; By Invitation</div>
</div>
```

And remove the `.gate-tint` CSS rule entirely (no longer needed without video).

### FIX 10: Tighten spacing rhythm

Current spacing:
- `.act` padding: `100px 32px`
- `.section-divider` padding: `80px 0`
- `.project` padding: `100px 0`

With section dividers at 80px padding between acts at 100px padding, you get 280px of space between sections — that's way too much. With dividers removed, adjust:

- `.act` padding: `120px 32px` (more vertical breathing room to replace dividers)
- `.section-rule` margin: `0 auto` with the cream background handling the transition
- Projects: keep spacing as-is

### FIX 11: Prose code blocks — make them cleaner

Current: `background: var(--cream-deep)` which is `#F1ECE2` — a slightly darker cream that creates a visible box around every code reference in body text.

Replace with:
```css
.prose code {
  font-family: 'Inconsolata', monospace;
  font-size: 14.5px;
  color: var(--crimson-deep);
  padding: 1px 5px;
  letter-spacing: 0.02em;
}
```

No background, no border. Just italic crimson-tinted monospace text — cleaner integration.

---

## STEP 4: Edit approach

Make targeted `oldText` → `newText` replacements in the CSS AND HTML for each fix above. Do NOT rewrite the entire file. Each replacement should match a unique region.

---

## STEP 5: Deploy

```bash
cd /Users/michaelbattaglia/.openclaw/workspace/mikebatts
git add romulus.html
git commit -m "Design polish: remove visual noise, simplify hero overlay, clean gate, remove section dividers, natural contrast"
git push origin master
```

---

## STEP 6: Report

When done:
1. High-level what changed
2. Live URL
3. Any notes