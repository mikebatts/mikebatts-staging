You are Claude Opus 4.7 running via subscription. Your job is to do a surgical visual polish pass on `/Users/michaelbattaglia/.openclaw/workspace/mikebatts/romulus.html`. Do NOT rewrite the full file. Make targeted CSS replacements only. The HTML structure, JS, and content text should remain completely untouched.

---

## STEP 1: Read the file

Read `/Users/michaelbattaglia/.openclaw/workspace/mikebatts/romulus.html` — ALL lines. Understand every CSS rule.

---

## STEP 2: Fix the issues below with surgical precision

### ISSUE 1: Hero text text-shadows — REMOVE the white/cream halos

The current text-shadows create an artificial white/cream glow that looks cheap:

```css
.hero-title { text-shadow: 0 2px 28px rgba(248, 245, 239, 0.6), 0 1px 2px rgba(255, 255, 255, 0.7); }
.hero-subtitle { text-shadow: 0 1px 14px rgba(248, 245, 239, 0.6); }
.hero-eyebrow { text-shadow: 0 1px 8px rgba(255, 255, 255, 0.5); }
```

REPLACE ALL hero text text-shadows with either:
- No text-shadow at all (preferred — the overlay provides enough contrast)
- OR a VERY subtle dark drop shadow for readability: `text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);`

The goal: text on video should look NATURAL, like editorial magazine typography on an image, not like CSS glow effects.

### ISSUE 2: Hero overlay — smooth, natural gradient blending

The current hero overlay has too-aggressive cream stops:

```css
.hero-overlay {
  background:
    linear-gradient(180deg,
      rgba(248, 245, 239, 0.18) 0%,
      rgba(248, 245, 239, 0.08) 35%,
      rgba(248, 245, 239, 0.55) 78%,
      rgba(248, 245, 239, 0.96) 100%),
    radial-gradient(ellipse at 50% 38%, rgba(248, 245, 239, 0) 30%, rgba(248, 245, 239, 0.40) 100%);
}
```

REPLACE with a smoother, more elegant gradient:

```css
.hero-overlay {
  background:
    linear-gradient(180deg,
      rgba(248, 245, 239, 0.10) 0%,
      rgba(248, 245, 239, 0.05) 25%,
      rgba(248, 245, 239, 0.15) 55%,
      rgba(248, 245, 239, 0.45) 75%,
      rgba(248, 245, 239, 0.85) 88%,
      rgba(248, 245, 239, 0.95) 94%,
      rgba(248, 245, 239, 1) 100%);
}
```

Key change: remove the radial-gradient layer (it was creating uneven blending). Use only one linear-gradient with many more stops so the transition from video-showing → cream-opaque is smooth and gradual, not abrupt.

### ISSUE 3: Section-to-section gradient transitions — eliminate visual jumps

Look at each section's background color. Any section that ends with one cream tint and the next section starts with a different cream tint creates a visible hard line. 

Fix: ensure ALL section backgrounds use the SAME cream `--cream: #F8F5EF` for the primary background. Remove section-specific background overrides that create cream-to-cream transitions. If there are `::after` gradient pseudo-elements at section boundaries, make them use the SAME cream at both ends with just a fade effect.

Specifically:
- `.romulus-content`: background should be `var(--cream)` only
- `.act` sections: no separate `background` declaration (inherit from parent)
- Only the `.cinematic` dark interstitial should have a different background

### ISSUE 4: Video filter on hero — ensure natural contrast

The current hero video filter is:
```css
.video-bg--hero {
  filter: contrast(1.04) brightness(0.95) saturate(0.78) sepia(0.06);
}
```

This is okay but slightly too dim. Change to:

```css
.video-bg--hero {
  filter: contrast(1.02) brightness(1.0) saturate(0.85) sepia(0.03);
}
```

Slightly brighter and more natural. Less sepia. The cream overlay handles the tint; the video should look close to its original.

### ISSUE 5: Gate overlay — make it less milky

The gate overlay currently has:
```css
.gate-tint {
  background:
    linear-gradient(180deg, rgba(248, 245, 239, 0.78) 0%, rgba(248, 245, 239, 0.86) 100%),
    radial-gradient(ellipse at 50% 50%, rgba(248, 245, 239, 0.0), rgba(248, 245, 239, 0.55) 80%);
}
```

This is too opaque — you can barely see the video through it. Replace with:

```css
.gate-tint {
  background:
    linear-gradient(180deg, rgba(248, 245, 239, 0.55) 0%, rgba(248, 245, 239, 0.65) 100%),
    radial-gradient(ellipse at 50% 50%, transparent, rgba(248, 245, 239, 0.35) 80%);
}
```

### ISSUE 6: Scan-line softness

The current scan-lines on the hero (`scanlines-soft`) at 4.5% opacity might be visible on the hero. Reduce to:

```css
.scanlines-soft {
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.025) 0px,
    rgba(0, 0, 0, 0.025) 1px,
    transparent 1px,
    transparent 3px
  );
}
```

2.5% instead of 4.5% — should be barely perceptible, just a subtle texture.

---

## STEP 3: Edit approach

Make targeted `oldText` → `newText` replacements in the CSS for each issue above. Do NOT rewrite the entire file. Each replacement should match a unique region of CSS that you're replacing.

---

## STEP 4: Deploy

```bash
cd /Users/michaelbattaglia/.openclaw/workspace/mikebatts
git add romulus.html
git commit -m "Visual polish: natural hero text contrast, smooth cream-to-video gradient, refined section transitions, softened scan-lines"
git push origin main
```

---

## STEP 5: Report

When done:
1. High-level what changed
2. Live URL
3. Any notes