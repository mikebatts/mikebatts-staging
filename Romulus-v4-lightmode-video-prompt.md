You are Claude Opus 4.7 running via subscription. Your job is to redesign `/Users/michaelbattaglia/.openclaw/workspace/mikebatts/romulus.html` with a light-mode, eloquent Roman-Greco futurism aesthetic, properly using landscape and portrait videos based on their orientation.

---

## STEP 1: Read these files

1. `/Users/michaelbattaglia/.openclaw/workspace/mikebatts/romulus.html` — Current page. Read every line.
2. `/Users/michaelbattaglia/.openclaw/workspace/mikebatts/romulus-case-study.md` — The approved copy. Keep ALL text verbatim.
3. `/Users/michaelbattaglia/.openclaw/workspace/mikebatts/index.html` — Portfolio nav structure.

---

## STEP 2: Understand the video orientations

**Landscape videos (use as FULL-BLEED HERO BACKGROUND):**
- `bath.mp4` (2048×1484) — flooded colonnaded hall — Baroque painting aesthetic, dark waters, receding arches
- `scene.mp4` (2532×1900) — Roman villa portico — Neoclassical painting, lake landscape, contemplative figure

**Portrait videos (use as INSET MEDIA ASSETS alongside text):**
- `eterna.mp4` (1996×2650) — Colosseum interior with imperial banners, mounted soldiers
- `pillars.mp4` (1536×2048) — Parthenon through the Propylaea gateway columns

---

## STEP 3: The design direction — "Light-Mode Greco-Futurism"

**Core aesthetic:** Return to light cream/parchment backgrounds (NOT dark). The v2 cream direction was on the right track — we just need better visual execution with the actual video media, not SVG busts. The vibe is eloquent, premium, classical-modern fusion. Think: Renaissance art meets clean editorial web design, NOT dark terminal/hacker aesthetic.

### Light Mode Color Palette:
- **Primary background:** Cream/parchment `#F8F5EF`
- **Surface sections:** Warm white `#FFFFFF`
- **Text primary:** Deep warm charcoal `#2B2B29`
- **Text secondary:** `#5A5854`
- **Text muted:** `#8A8681`
- **Accent — Imperial crimson:** `#8B1A1A` (deep burgundy, replaces gold)
- **Accent — Bronze/gold secondary:** `#B8860B`
- **Dark contrast sections:** Occasional deep warm charcoal `#1A1916` for dramatic interstitial breaks only

### Typography:
- **Display/headings:** Source Serif 4 Variable
- **Body:** Inter (400, 17-18px, line-height 1.75-1.8)
- **Labels/mono:** Inconsolata (uppercase tracking)
- **Pull quotes:** Source Serif italic, crimson left border

---

## STEP 4: Layout & video integration

### HERO SECTION — Full-bleed landscape video background
Use `bath.mp4` (the flooded hall with receding arches) as a FULL-BLEED hero video background behind the "ROMULUS / Roma Eterna / How I Built My AI, Then Built With It" hero section.

Implementation:
```html
<section class="hero video-hero">
  <video autoplay muted loop playsinline class="hero-video-bg" preload="auto" poster="video-refs/bath_1s.jpg">
    <source src="video-refs/bath.mp4" type="video/mp4">
  </video>
  <div class="hero-overlay"></div>
  <div class="hero-content">
    <!-- ROMULUS title, subtitle, metadata -->
  </div>
</section>
```

The hero-overlay should be a subtle gradient from cream (at bottom) to semi-transparent (at top) so the video bleeds through but the text on top is readable. The video should feel atmospheric, not overwhelming. Add the CRT scan-line effect gently over the video:

```css
.scanline-overlay {
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.04) 0px,
    rgba(0, 0, 0, 0.04) 1px,
    transparent 1px,
    transparent 3px
  );
  pointer-events: none;
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
}
```

This makes it feel like "classical art viewed through an old screen" — subtle CRT texture, not overpowering.

### SECOND FULL-BLEED SECTION — Second landscape video
Use `scene.mp4` (the Roman villa portico) as a full-bleed background for a dramatic mid-page interstitial section. This section could be a quote or transitional moment between Acts.

Example: Between Act 2 (The Build) and Act 3 (A Tuesday), insert a full-bleed video section with a powerful quote in large white serif italic text overlaid on the Roman villa background with dark gradient overlay.

### PORTRAIT VIDEOS AS INSET ASSETS
The portrait videos (eterna.mp4, pillars.mp4) should be used as INSET media elements alongside text sections:

**eterna.mp4** — Place as a portrait video inset alongside one of the early text sections (maybe Act 01 "The Identity"). Layout: text flows on the left, the portrait video appears as a tall inset panel on the right. Like an editorial magazine layout.

```html
<div class="text-video-grid">
  <div class="text-content">
    <!-- prose copy -->
  </div>
  <div class="video-inset">
    <video autoplay muted loop playsinline class="portrait-video" preload="auto" poster="video-refs/eterna_1s.jpg">
      <source src="video-refs/eterna.mp4" type="video/mp4">
    </video>
    <div class="video-scanlines"></div>
  </div>
</div>
```

**pillars.mp4** — Place as a portrait video inset in a later section (maybe Act 02 or Act 03). Alternate the layout — if eterna is text-left/video-right, make pillars video-left/text-right.

For the inset videos:
- Add CRT scan-line overlay as a CSS layer on top of each inset video
- Use a subtle frame/border — maybe a thin crimson border on one side (like the pull quotes)
- The video inset should feel like an editorial image in a magazine spread
- On mobile, stack them: video first or inline between paragraphs

### Section blending — Creative transitions between sections
Blend sections with taste — don't just stack dark/light blocks. Use:

1. **Gradient transitions:** Cream-to-transparent gradients at section edges to create smooth visual transitions between video-hero and cream content areas
2. **Pull-out quotes with crimson left border** floating in the cream sections
3. **Gold accent line + dot dividers** between acts (from the v2 design)
4. **Occasional dark interstitial sections** (only 1-2) for dramatic quotes against dark charcoal, creating visual rhythm
5. **Whitespace as a design element** — generous breathing room between sections, don't over-pack

### PASSWORD GATE
Redesign with the light-mode aesthetic:
- Cream background with the bath.mp4 video playing softly behind it (low opacity)
- Centered card on cream — "ROMULUS" in Source Serif italic, crimson tint
- Elegant input field with subtle crimson glow on focus
- Keep ALL JS logic exactly as-is (PASSWORD, session check, localStorage TTL, IntersectionObserver)

---

## STEP 5: Scroll behavior
- Keep IntersectionObserver fade-up animations
- Add a subtle parallax drift on video backgrounds (slow scroll speed difference from content)
- Smooth section transitions with CSS transitions

---

## STEP 6: Video file handling

The portrait video snapshots exist at:
`/Users/michaelbattaglia/.openclaw/workspace/mikebatts/video-refs/{eterna,bath,pillars,scene}_{1,4,7,11}s.jpg`

Add `poster` attributes to `<video>` elements so pages show a still image instead of black on load:
- bath.mp4 → poster="video-refs/bath_1s.jpg"
- scene.mp4 → poster="video-refs/scene_1s.jpg"
- eterna.mp4 → poster="video-refs/eterna_1s.jpg"
- pillars.mp4 → poster="video-refs/pillars_1s.jpg"

---

## STEP 7: Technical rules

1. Single HTML file — all CSS in `<style>`, all JS in `<script>`
2. No build step, no frameworks, no npm
3. Google Fonts: Source Serif 4, Inter, Inconsolata (already referenced)
4. Password gate JS unchanged
5. All prose from romulus-case-study.md verbatim
6. Mobile responsive (375px readable)
7. Videos: autoplay, muted, loop, playsinline, NO controls
8. CRT scan-line: CSS-only repeating-linear-gradient
9. Portrait videos as editorial inset panels alongside text
10. Landscape videos as full-bleed hero/transitional backgrounds
11. Light mode cream/parchment primary, dark only for dramatic interstitial moments

---

## STEP 8: Deploy

```bash
cd /Users/michaelbattaglia/.openclaw/workspace/mikebatts
git add romulus.html video-refs/*.jpg
git commit -m "Light-mode Greco-futurism: landscape video hero backgrounds, portrait video insets, cream parchment, CRT scan-lines, editorial layout"
git push origin main
```

---

## STEP 9: Report

When done:
1. High-level what changed
2. Live URL (mikebatts.net/romulus.html)
3. Notes (video load times, CDN recommendations, mobile considerations)