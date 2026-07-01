You are Claude Opus 4.7 running via subscription. Your job is to completely redesign `/Users/michaelbattaglia/.openclaw/workspace/mikebatts/romulus.html` using the greco-futurism aesthetic with classical Roman art + ASCII digital overlay treatment.

Generate the final romulus.html file, then commit and push to GitHub Pages.

---

## STEP 1: Read these files first

1. `/Users/michaelbattaglia/.openclaw/workspace/mikebatts/romulus.html` — Read every line. Understand:
   - The password gate HTML + JS (keep functional gate, redesign visuals)
   - Content sections (5 acts + byline)
   - Animation system (IntersectionObserver, fade-up)
   - What CSS patterns exist already

2. `/Users/michaelbattaglia/.openclaw/workspace/mikebatts/romulus-case-study.md` — The approved copy. Keep ALL text verbatim.

3. `/Users/michaelbattaglia/.openclaw/workspace/mikebatts/index.html` — Portfolio nav structure.

---

## STEP 2: The new design direction — "Greco-Futurism" with ASCII overlay treatment

**Inspiration:** Classical Roman art, Renaissance bust sculptures, and marble textures merged with digital ASCII-art glitches and halftone patterns. The juxtaposition of ancient craftsmanship + digital artifacts. Think classical statuary converted to ASCII dots, pixelated overlays on ancient frescoes, marble textures with digital noise.

### Visual language:
- Cream/parchment primary background (#F8F5EF)
- Dark charcoal interstitial sections (#1A1916)
- Bronze/gold accent (#B8860B)
- Terracotta/copper secondary (#C67B5C)
- ASCII halftone dot patterns over classical imagery
- Classical Roman busts/columns as background elements
- Source Serif 4 for all display/headings
- Inter for body copy
- Inconsolata for labels/mono

### Key design elements to add:
1. Classical imagery as backgrounds (CSS gradients/patterns since no external images needed)
2. ASCII dot-matrix overlay patterns on classical elements
3. Full-bleed dark interstitial sections between acts with dramatic quotes in white serif italic
4. Redesigned password gate: classical portico/doorway aesthetic instead of terminal vibe
5. Floating stat tiles in the "A Tuesday" section (scattered editorial layout)
6. Marble texture or paper grain on cream backgrounds (CSS noise pattern)

---

## STEP 3: What to build

### Password Gate (completely redesigned):
- Full-screen cream background with subtle classical art CSS pattern
- Centered card: elegant, not frosted glass
- "ROMULUS" in Source Serif italic, gold accent
- "Access Required" small uppercase label
- Beautiful input field with gold pill button
- Keep ALL JS logic exactly as-is

### Content Page:
- Cream/parchment background with subtle grain texture
- Act labels (Inconsolata, gold, uppercase)
- Section headings (Source Serif 4)
- Body copy (Inter, warm charcoal)
- Pull quotes (gold left border, serif italic, indented)
- Section dividers (gold line + gold dot)
- Pattern lists (gold numbers, clean formatting)
- Project entries with gold labels, serif names, body copy

### Dark Interstitial Sections (NEW):
Between each act, add full-bleed dark sections with:
- Dramatic quote from the case study
- Classical art CSS background (Roman column/bust imagery using gradients/patterns or inline SVG)
- ASCII halftone dot overlay pattern
- Short, impactful text in large white serif italic

Examples:
- After Act 1: "You don't start with the technology. You start with the person using it."
- After Act 2: "The vault is the brain. Sessions are the work."
- After Act 3: "Good product infrastructure is legible to the humans using it, not just to the machines running it."

### ASCII Halftone Pattern CSS:
```css
.ascii-overlay {
  background-image: radial-gradient(circle, rgba(184,134,11,0.08) 0.5px, transparent 0.5px);
  background-size: 3px 3px;
}
```

### Classical Art as CSS Backgrounds (using gradients/patterns):
Use CSS linear/radial gradients to create classical column/bust silhouettes as background elements. Combine with ASCII overlay for the digital artifact effect.

---

## STEP 4: Technical rules

1. Single HTML file — all CSS in `<style>`, all JS in `<script>`
2. No build step, no frameworks, no npm
3. Add Source Serif 4 to Google Fonts load (keep existing fonts)
4. Keep password gate JS unchanged
5. Keep all prose from romulus-case-study.md verbatim
6. Mobile responsive (375px readable)
7. Scroll animations (IntersectionObserver fade-up)
8. CSS noise pattern for paper grain — no external images
9. Classical imagery via CSS gradients, SVG patterns, inline SVG — no external dependencies
10. Deploy to GitHub Pages when done

---

## STEP 5: Deploy

```bash
cd /Users/michaelbattaglia/.openclaw/workspace/mikebatts
git add romulus.html
git commit -m "Greco-futurism redesign: classical Roman art + ASCII overlay, cream parchment, Source Serif 4 typography, dark interstitial sections, redesigned password gate"
git push origin main
```

---

## STEP 6: Report

When done:
1. High-level what changed
2. Live URL (mikebatts.net/romulus.html)
3. Notes for Mike (images to add, things to refine)