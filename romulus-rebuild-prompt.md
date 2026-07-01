# Rebuild romulus.html — Romulus Case Study

You are Claude Opus 4.7. Your job is to completely rebuild `/Users/michaelbattaglia/.openclaw/workspace/mikebatts/romulus.html` as a polished, long-form narrative case study.

---

## STEP 1 — READ THESE FILES FIRST (in order)

1. `/Users/michaelbattaglia/.openclaw/workspace/mikebatts/romulus-case-study.md` — the approved copy. This is the entire written content of the page. Use it verbatim. Do not paraphrase, summarize, or cut anything.

2. `/Users/michaelbattaglia/.openclaw/workspace/mikebatts/romulus.html` — the existing page. Read the full CSS in the `<style>` block. Understand the design language: colors, fonts, spacing tokens. You are inheriting this design system.

3. `/Users/michaelbattaglia/.openclaw/workspace/mikebatts/index.html` — the main portfolio page. Understand the nav structure and how other pages link back to it.

---

## STEP 2 — UNDERSTAND WHAT YOU'RE BUILDING

This is a long-form case study for a product engineer / designer named Mike Battaglia. The audience is employers, recruiters, and collaborators. The tone is confident and direct — the work speaks, the copy doesn't announce itself.

**The five acts of the case study:**
- Act 1 — The Identity
- Act 2 — The Build (six sub-sections)
- Act 3 — A Tuesday
- Act 4 — The Work (four projects: Chronicle, Forbidden, Cherry Street Labs, Legion)
- Act 5 — The Open Question

---

## STEP 3 — DESIGN REQUIREMENTS

### Inherit from the existing page
- Background: `#030305`
- Amber accent: `#d9951a`
- Text colors: `rgba(255,255,255,0.92)` primary, `rgba(255,255,255,0.68)` body, `rgba(255,255,255,0.48)` secondary
- Fonts: Josefin Sans (display/headlines), Inter (body), Inconsolata (mono, dates, labels, code)
- Keep the existing Google Fonts + Typekit loading scripts

### Keep from the existing page
- The password gate — keep the `.romulus-gate` HTML and all its JS exactly as-is. Do not touch it. The gate stays.
- The top nav (back to mikebatts.net link + badge).

### Remove from the existing page
- The old content sections only (cohort cards, Gantt chart, experiment cards, broke sections, forward section) — replace these with the new case study layout.
- The new case study content goes inside `.romulus-content` (the element that becomes visible after the password gate is passed), exactly as the existing page does it.

### Layout approach — long-form editorial
This is a reading experience, not a dashboard. Think editorial: New Yorker, not SaaS landing page.

**Typography hierarchy:**
- Page title: Large Josefin Sans, `#ffffff`, tight letter-spacing
- Subtitle/tagline: Inter, secondary text color, italic
- Act labels: Inconsolata, amber, uppercase, small — `ACT 01`, `ACT 02`, etc.
- Section headings (h2): Josefin Sans, 28-36px, white
- Sub-section headings (h3): Inter Tight, 18-20px, white, `font-weight: 600`
- Body copy: Inter, 17-18px, `rgba(255,255,255,0.68)`, `line-height: 1.75`
- Dates/labels/mono: Inconsolata, amber or secondary color

**Layout details:**
- Max content width: `680px` centered, with generous side padding
- Section spacing: `80-100px` between acts
- Sub-section spacing: `48px`
- Acts separated by a full-width divider line (subtle, `rgba(255,255,255,0.08)`) with an amber dot centered on it — reuse the `.section-divider` pattern from the existing page
- No card grids. No feature columns. This is prose.

**Pull quotes:** For the key insight lines in the copy (e.g. *"Good product infrastructure is legible to the humans using it, not just to the machines running it."*), render them as pull quotes: larger type, amber left border, slightly indented, italic. Use judgment to identify 2-3 strong candidates per act.

**Inline code/paths:** File paths like `SOUL.md`, `03-Daily/`, `roma-eterna/romulus/` should render in Inconsolata with a subtle dark pill background — `background: rgba(255,255,255,0.06); border-radius: 4px; padding: 2px 6px;`

**The delegation pattern list in Act 2** — render as a clean numbered list with amber numbers, not a standard `<ol>`. Give it visual weight.

**Project entries in Act 4** — each project (Chronicle, Forbidden, Cherry Street Labs, Legion) gets:
- A top label in Inconsolata amber: `PROJECT 01`, `PROJECT 02`, etc.
- The project name as an h2
- The status/URL line in secondary color, italic
- Then the body copy flows normally beneath
- A subtle bottom border before the next project

**The "failure" sub-sections in Act 2** (The Memory Problem, The Model Problem, etc.) — each gets a small amber label above it in Inconsolata (e.g. `// memory`) and the sub-heading in Inter Tight.

### Scroll behavior
Add a subtle scroll-triggered fade-in for each act as it enters the viewport. Use the IntersectionObserver pattern — add class `visible` when in view, CSS handles the transition. `opacity: 0 → 1`, `transform: translateY(16px) → 0`, `transition: 0.5s ease`. Reuse the existing `.romulus-visible` pattern if present.

### Footer / byline
At the bottom, after Act 5, render the byline block:
```
Mike Battaglia
Senior PM at Daylight · Founder, Cherry Street Labs
Park Slope, Brooklyn · mikebatts.net
```
Clean, centered, Inconsolata, secondary text color. Small. No decoration.

---

## STEP 4 — TECHNICAL RULES

1. Single self-contained HTML file — all CSS in a `<style>` block in `<head>`, all JS at bottom of `<body>`
2. No external CSS dependencies beyond the existing Google Fonts + Typekit scripts (already in the file)
3. No frameworks, no build step, no npm — pure HTML/CSS/JS
4. Preserve the existing `<head>` meta tags, GA scripts, favicon links
5. Preserve the top nav structure
6. Mobile responsive — body copy readable on 375px wide screens, font sizes scale down, padding adjusts
7. Keep the password gate JS exactly as it exists in the current file — do not modify it at all
8. The page title in `<title>` should be: `Romulus — Mike Battaglia`
9. OG title: `Romulus — How I Built My AI, Then Built With It`

---

## STEP 5 — WHAT TO WRITE

Write the complete, final `romulus.html` file. Every line. No placeholders, no `<!-- rest of content here -->` comments, no shortcuts.

The copy comes entirely from `romulus-case-study.md`. Translate it faithfully into HTML. Apply the design system above. Make it beautiful.

When done, write the file to:
`/Users/michaelbattaglia/.openclaw/workspace/mikebatts/romulus.html`

Overwrite the existing file completely.
