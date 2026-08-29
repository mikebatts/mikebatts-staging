# Vesuvius case study — Midjourney art brief

Production prompts for the five placeholder frames in `vesuvius.html`. Each
placeholder in the page carries a `data-asset` attribute with the exact target
filename. Generate the image at the stated ratio, save it in `images/`, then
insert it as a `.vs-plate-img` (or `.vs-ending-img` for plate 05) inside the
matching placeholder. The frame already reserves the final aspect ratio, so
the swap causes no layout change.

## Shared art direction

- **Palette:** near-black mineral navy base (`#0a0e14`), hot volcanic orange as
  the single accent (`#ff5a1f`), warm ash-white (`#ece7dd`). One restrained cool
  CT-blue (`#6fb4d6`) is allowed *only* inside scan/depth imagery (plates 02 and,
  faintly, 05). No other hues.
- **Mood:** cinematic, quiet, premium, scientific. Editorial, not fantasy.
  Think Apple product photography lighting and a museum conservation lab — dark
  rooms, single directional light, deep shadow, no clutter.
- **Finish:** subtle film grain, high dynamic range, matte blacks (no crushed
  pure black, no glossy studio white). Physically plausible; avoid CGI sheen.
- **Negatives (append to every prompt):**
  `--no text, letters, watermark, signature, logo, people faces, cartoon, lens flare, rainbow colors, teal-and-orange cliché, UI, hud, frame border`

Midjourney note: put aspect with `--ar`, style rendering with `--style raw`,
and `--stylize 250` for restraint. Version `--v 6` (or current). Keep prompts on
one line when you paste them.

---

## 01 — A carbonized scroll, before the scan
- **Filename:** `images/vesuvius-01-carbonized-scroll.jpg`
- **Aspect ratio:** 3:2 (landscape) — `--ar 3:2`
- **Placement:** Chapter 1, "The challenge."
- **Subject:** A single carbonized Herculaneum papyrus scroll — a brittle black
  cylinder of solid carbon, its crushed concentric layers visible at the cut end,
  resting on a dark matte surface in a scanning chamber.
- **Composition:** Extreme close-up, scroll running left-to-right across the lower
  two-thirds, negative space above. Shallow depth of field, the spiral cross-section
  in sharp focus.
- **Texture:** charred, cracked, fibrous papyrus; ember-like fissures; fine ash dust.
- **Lighting:** one low warm orange rim light grazing the layers from the right,
  everything else falling into mineral-navy darkness.
- **Prompt:**
  `Extreme macro photograph of a single carbonized ancient Herculaneum papyrus scroll, a brittle cylinder of solid black carbon, crushed concentric layers visible at the cut spiral end, resting on a dark matte surface in a scientific scanning chamber, one low warm volcanic-orange rim light grazing the charred fibrous texture from the right, deep mineral navy shadow, fine ash dust, cinematic editorial conservation-lab mood, shallow depth of field, subtle film grain, matte blacks --style raw --ar 3:2 --stylize 250 --no text, letters, watermark, signature, logo, people faces, cartoon, lens flare, rainbow colors, teal-and-orange cliché, UI, hud, frame border`

---

## 02 — Exploded scroll cutaway · scan to surface
- **Filename:** `images/vesuvius-02-exploded-cutaway.jpg`
- **Aspect ratio:** 4:3 — `--ar 4:3`
- **Placement:** Chapter 2, "How you read a closed scroll."
- **Subject:** A technical, semi-diagrammatic exploded view of a scroll: concentric
  papyrus layers pulled apart into separated translucent wireframe sheets, one sheet
  peeling away and flattening into a readable plane.
- **Composition:** Centered, isometric-leaning three-quarter view, layers fanning
  from a dense core to a single flat sheet at the front.
- **Texture:** thin translucent sheets, faint wireframe contour lines, papyrus grain.
- **Lighting:** cool CT-blue volumetric light passing through the sheets (this is a
  scan visualization), with a single warm orange accent marking the flattened front
  sheet. Blue confined to the depth data only.
- **Prompt:**
  `Semi-diagrammatic exploded technical cutaway of an ancient scroll, concentric papyrus layers separated into thin translucent wireframe sheets fanning from a dense core, one sheet peeling away and flattening into a single readable plane at the front, isometric three-quarter view centered on black, cool CT-blue volumetric scan light passing through the layers, a single warm volcanic-orange accent on the flattened front sheet, faint contour lines, papyrus grain, cinematic scientific visualization, mineral navy background, subtle film grain --style raw --ar 4:3 --stylize 250 --no text, letters, watermark, signature, logo, people faces, cartoon, lens flare, rainbow colors, teal-and-orange cliché, UI, hud, frame border`

---

## 03 — False glyphs resolving into papyrus fiber
- **Filename:** `images/vesuvius-03-false-signal.jpg`
- **Aspect ratio:** 2:1 (full-width band) — `--ar 2:1`
- **Placement:** Chapter 3, "What fooled us."
- **Subject:** An abstract flattened scan surface. On the left, faint orange marks
  arrange into shapes that *almost* read as ancient Greek letters; moving right, the
  same marks dissolve and reveal themselves to be the woven fibers, seams and torn
  edges of papyrus.
- **Composition:** Horizontal left-to-right gradient of resolution: ambiguous "letters"
  on the left, unmistakable fiber texture on the right. No actual legible characters.
- **Texture:** woven papyrus fibers, hairline seams, fiber knots, micro-tears.
- **Lighting:** flat raking light from the left, orange marks glowing faintly then
  fading into ash-grey fiber toward the right.
- **Prompt:**
  `Abstract macro of a flattened ancient papyrus scan surface, faint volcanic-orange marks on the left arranged into ambiguous shapes that almost resemble letters, dissolving toward the right into the woven fibers, hairline seams and torn edges of real papyrus, left-to-right gradient from illusion to texture, flat raking light, no legible characters, warm orange glow fading to ash grey, mineral navy ground, cinematic scientific abstraction, fine film grain, matte blacks --style raw --ar 2:1 --stylize 250 --no text, letters, watermark, signature, logo, people faces, cartoon, lens flare, rainbow colors, teal-and-orange cliché, UI, hud, frame border`

---

## 04 — The cohort as one system atlas
- **Filename:** `images/vesuvius-04-research-atlas.jpg`
- **Aspect ratio:** 3:2 — `--ar 3:2`
- **Placement:** Chapter 5, "Cohors Vesuviana."
- **Subject:** An abstract isometric research system / atlas: six quiet nodes on a
  dark plane connected by thin luminous pathways, a single moving packet of light
  travelling one path. No characters, no Roman figures — a diagram of a system.
- **Composition:** Isometric, centered, generous negative space, one node subtly
  emphasized. Reads as an elegant infrastructure schematic, not a circuit board.
- **Texture:** matte plane, thin etched lines, soft node glows.
- **Lighting:** self-lit nodes; five in ash-white, one in volcanic orange (the active
  claim), the connecting pathway carrying a faint orange packet. Optional single faint
  CT-blue node for the audit role.
- **Prompt:**
  `Abstract isometric diagram of a small research system on a dark matte plane, six quiet self-lit nodes connected by thin luminous etched pathways, five nodes ash-white and one glowing volcanic orange, a single small packet of orange light travelling one path, generous negative space, elegant minimal infrastructure schematic, mineral navy background, soft node glows, one faint cool CT-blue node, cinematic premium, subtle film grain, matte blacks --style raw --ar 3:2 --stylize 250 --no text, letters, watermark, signature, logo, people faces, cartoon, lens flare, rainbow colors, teal-and-orange cliché, UI, hud, frame border`

---

## 05 — One unresolved point of light
- **Filename:** `images/vesuvius-05-single-point.jpg`
- **Aspect ratio:** 16:9 (cinematic wide, quiet) — `--ar 16:9`
- **Placement:** Chapter 6, "What we know now" (the ending).
- **Subject:** A dark, nearly empty scan field with a single unresolved point of warm
  orange light suspended in the darkness — suggesting ongoing excavation without
  claiming a discovery.
- **Composition:** Vast negative space, the point placed off-center (right third),
  a faint horizontal scan gradient across the field, nothing else. Restraint is the
  point.
- **Texture:** almost none — soft grain, a whisper of horizontal scan banding.
- **Lighting:** the single point is the only light source, a small warm bloom fading
  fast into total mineral-navy darkness.
- **Prompt:**
  `A dark nearly empty scan field, one single unresolved point of warm volcanic-orange light suspended off-center in deep mineral-navy darkness, faint horizontal scan banding, vast negative space, quiet and restrained, suggesting ongoing search without discovery, small warm bloom fading fast to black, cinematic wide, minimal, soft film grain, matte blacks --style raw --ar 16:9 --stylize 200 --no text, letters, watermark, signature, logo, people faces, cartoon, lens flare, rainbow colors, teal-and-orange cliché, UI, hud, frame border`

---

## Filename ↔ placeholder map

| # | Filename | Aspect | Chapter |
|---|----------|--------|---------|
| 01 | `images/vesuvius-01-carbonized-scroll.jpg` | 3:2 | 1 · The challenge |
| 02 | `images/vesuvius-02-exploded-cutaway.jpg` | 4:3 | 2 · How you read a closed scroll |
| 03 | `images/vesuvius-03-false-signal.jpg` | 2:1 | 3 · What fooled us |
| 04 | `images/vesuvius-04-research-atlas.jpg` | 3:2 | 5 · Cohors Vesuviana |
| 05 | `images/vesuvius-05-single-point.jpg` | 16:9 | 6 · What we know now |

To swap a placeholder for final art, export it at the aspect ratio above and
save it to the listed path. Then add this immediately after `.vs-plate-art` in
the matching figure:

```html
<img class="vs-plate-img" loading="lazy"
  src="images/vesuvius-01-carbonized-scroll.jpg"
  onload="this.classList.add('is-loaded')"
  alt="A concise description of the final artwork.">
```

For plate 05, use `vs-ending-img` instead. The placeholder badge automatically
disappears when the final image loads.
