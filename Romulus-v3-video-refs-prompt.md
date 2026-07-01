You are Claude Opus 4.7 running via subscription. Your job is to redesign `/Users/michaelbattaglia/.openclaw/workspace/mikebatts/romulus.html` with a completely revised visual direction based on the founder's actual art direction references.

---

## STEP 1: Read these files

1. `/Users/michaelbattaglia/.openclaw/workspace/mikebatts/romulus.html` — Current page. Read every line.
2. `/Users/michaelbattaglia/.openclaw/workspace/mikebatts/romulus-case-study.md` — The approved copy. Keep ALL text verbatim.
3. `/Users/michaelbattaglia/.openclaw/workspace/mikebatts/index.html` — Portfolio nav structure.
4. `/Users/michaelbattaglia/.openclaw/workspace/mikebatts/video-refs/` — 4 MP4 files (eterna, bath, pillars, scene). These are the art direction references.

---

## STEP 2: Understand the NEW design direction

The previous "classicical-bust-SVG" approach missed the mark. The founder has provided actual video references that define the aesthetic:

### The Art Direction Language: "Classical Antiquity Through CRT Noise"

**Core visual identity:** Monumental classical architecture (Colosseum interiors, colonnaded halls, the Parthenon, Roman villas) overlaid with a vertical scan-line effect that makes everything look like it's being viewed through an old monitor or broadcast transmission. The tension between ancient grandeur + lo-fi digital media.

**Key aesthetic principles:**
- Classical architecture at monumental scale (columns, arches, corridors, temples)
- Vertical scan-line overlay across all visual surfaces (CRT/monitor effect)
- Crimson/burgundy accent colors (imperial banners)
- Desaturated color grading with crushed shadows
- The effect of "equally mediated memories" — all epochs rendered at the same distance through noise
- Soft/degraded resolution, film grain, analog warmth

### What to REPLACE on the current page:

1. **Remove the SVG bust silhouettes** — replace with actual video backgrounds
2. **Add CSS scan-line overlay** — the primary visual treatment
3. **Remove the cream/parchment aesthetic** — go warmer, more atmospheric

---

## STEP 3: Visual system to build

### Color Palette:
- **Background:** Deep warm charcoal `#121010` (near-black, slightly warm)
- **Surface sections:** Darker charcoal `#0A0908`
- **Accent:** Imperial crimson `#8B1A1A` deep burgundy
- **Secondary accent:** Gold `#B8860B` (bronze)
- **Text on dark:** `rgba(255,255,255,0.92)` primary, `rgba(255,255,255,0.68)` body, `rgba(255,255,255,0.48)` muted
- **Warm highlight:** `rgba(184,134,11,0.15)` (bronze glow)

### CSS Scan-line Overlay Effect:
```css
.scanlines::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9999;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.08) 2px,
    rgba(0, 0, 0, 0.08) 4px
  );
}
```

Or for a more pronounced CRT effect:
```css
.crt-overlay {
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.15) 0px,
    rgba(0, 0, 0, 0.15) 1px,
    transparent 1px,
    transparent 3px
  );
}
```

This scan-line overlay should appear either:
- As a global layer over the entire page
- Or just over sections that have video/image backgrounds
- Adjust opacity so it doesn't interfere with reading text

### Video Background Integration:

The 4 videos live at `video-refs/`. For now, use them as backgrounds via `<video>` elements:

**Hero / Act 1 background:** `eterna.mp4` (Colosseum interior, monumental scale)
**Act 2 interstitial:** `pillars.mp4` (columns/arches corridor)
**Act 3 background:** `scene.mp4` (Roman villa, contemplative)
**Dark interstitial / footer:** `bath.mp4` (flooded colonnaded hall)

### Video element implementation:

```html
<video 
  autoplay 
  muted 
  loop 
  playsinline
  disablePictureInPicture
  controlsList="nodownload nofullscreen noremoteplayback"
  preload="auto"
  style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
>
  <source src="https://mikebatts.net/video-refs/eterna.mp4" type="video/mp4">
</video>
```

**IMPORTANT:** Videos need to be accessible at runtime. Since they're in the `video-refs/` folder but GitHub Pages serves from the repo root, either:
- Copy them to a `video-refs/` folder at the repo root and reference as `/video-refs/eterna.mp4`
- Or use the video-refs folder inside mikebatts/ repo

### Dark overlay for video backgrounds:

Videos need a dark overlay for text readability:
```css
.video-bg {
  position: relative;
}
.video-bg::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom, rgba(18,16,16,0.7), rgba(18,16,16,0.5), rgba(18,16,16,0.8));
}
```

### Typography System:
- **Display / Headings:** Source Serif 4 Variable (bold, large)
- **Body:** Inter (400, 17-18px, line-height 1.75-1.8)
- **Labels / mono:** Inconsolata (uppercase tracking, mono text)
- **Pull quotes:** Source Serif italic, crimson left border

### Layout Improvements:
- More generous whitespace
- Video backgrounds create immersive atmosphere behind key sections
- Scan-line overlay creates the signature lo-fi transmission aesthetic across the whole page
- Crimson accent replaces gold in most places (gold now secondary)
- Keep the password gate but redesign it with scanline + dark aesthetic

### Password Gate Redesign:
- Dark background with CRT scanlines
- "ROMULUS" in Source Serif, crimson tint
- Input field with subtle glow
- Keep ALL JS logic exactly as-is

---

## STEP 4: What to build

### Full-page scan-line aesthetic:
Apply a global scan-line overlay (CSS repeating-linear-gradient) that creates the CRT transmission effect across the entire page. This is the signature treatment.

### Video background sections:
Use the 4 MP4 videos as full-bleed backgrounds for key sections:
- Hero section: eterna.mp4 (Colosseum)
- Act interstitials: pillars.mp4 and scene.mp4
- Footer/closing: bath.mp4 (flooded hall)

Each video section gets:
- `<video>` element with autoplay, muted, loop, playsinline
- Dark gradient overlay for text readability
- CSS scan-line effect layered on top
- Content overlaid via position: relative

### Content sections:
Between full-bleed video sections, use solid dark charcoal backgrounds with the scan-line effect still present.

### Typography:
- White/light text on dark backgrounds
- Crimson accent for numbers, labels, left borders on pull quotes
- Source Serif for headlines, Inter for body, Inconsolata for labels

### Stats tiles (Act 3):
If the current page has floating stats, make them:
- Dark cards with subtle crimson inner border
- Numbers in Source Serif
- Scan-line overlay continues

---

## STEP 5: Technical rules

1. Single HTML file — all CSS in `<style>`, all JS in `<script>`
2. No build step, no frameworks, no npm
3. Add Source Serif 4 to Google Fonts load (keep Inter, Inconsolata)
4. Keep password gate JS exactly as-is
5. Keep all prose from romulus-case-study.md verbatim
6. Mobile responsive (375px readable)
7. Scroll animations (IntersectionObserver fade-up)
8. Videos: autoplay, muted, loop, playsinline, NO controls
9. Scan-line overlay: CSS-only, no external assets
10. Deploy to GitHub Pages when done

---

## STEP 6: Video file handling

The videos are currently at:
`/Users/michaelbattaglia/.openclaw/workspace/mikebatts/video-refs/{eterna,bath,pillars,scene}.mp4`

Move them into the repo's `video-refs/` directory (or create it at the repo root level):

```bash
cd /Users/michaelbattaglia/.openclaw/workspace/mikebatts
mkdir -p video-refs
cp /Users/michaelbattaglia/.openclaw/workspace/mikebatts/video-refs/*.mp4 ./video-refs/
git add video-refs/
```

Reference them in the HTML as:
```html
<source src="/video-refs/eterna.mp4" type="video/mp4">
```

---

## STEP 7: Deploy

```bash
cd /Users/michaelbattaglia/.openclaw/workspace/mikebatts
git add romulus.html video-refs/
git commit -m "Greco-futurism v2: classical video backgrounds, CRT scan-line overlay treatment, crimson imperial palette, video-based aesthetic"
git push origin main
```

---

## STEP 8: Report

When done:
1. High-level what changed
2. Live URL (mikebatts.net/romulus.html)
3. Notes (video load times, CDN recommendations, mobile considerations)