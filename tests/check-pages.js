/* Static checks for the combined Daylight case study (daylight.html), the
   ray.html compatibility alias, the Ray demo and the homepage lead card.
   Run: node tests/check-pages.js
   - no em dashes in visible copy of the pages, CSS, JS, and the build note
   - exactly one H1 outside the gate; gate heading is H2
   - the gate block is unchanged from HEAD apart from that heading level
   - every referenced local asset exists; every id target resolves
   - no form control, tab, table or retired simulator id outside the gate
   - videos: no autoplay, poster, muted, playsinline, preload metadata, a control
   - uppercase only on short mono labels (mono family, at least 12px), never on prose
   - the reading system: body at least 16px, captions at least 13px, controls
     at least 44px, no inner scrolling, no max-height on text, no negative
     margins in phone rules, min-width:0 on grid children, safe areas,
     reduced motion, touch-action only on controls
   - original brand media only; the rejected generated media is not referenced
   - cache-busting versions on the rebuilt CSS and JS
   - narrative budget (October 15, one combined Daylight and Ray study): at most
     2600 words of prose outside figures, details, nav, footer and the gate;
     every visible word including reconstruction labels stays under 4200.
     Both counts are printed each run.
   - ray.html is a text-free alias: no gate, no main, no case-study prose; it
     forwards every old fragment to an existing id on daylight.html
   - reading text never depends on the reveal state; only media settles on entrance
   - status tags wrap; the nav has a minimum height, not a fixed one; no body clip
   - the sheet controls precede the rows they change; reset is never disabled
   The Ray demo (ray-demo.html, css/ray-demo.css, js/ray-demo-state.js,
   js/ray-demo.js) and the Ray return script (js/ray-return.js) have their
   own section at the end: the same gate block as daylight.html apart from its
   title and intro, no network or HTML injection, sessionStorage only under
   the demo keys, a 17px textarea, 44px controls, dvh with a vh fallback,
   safe areas, reduced motion, an explicit sample-data label, no file
   picker, and no autofocus. Nothing above is relaxed for them. */
'use strict';
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const failures = [];
const fail = (m) => failures.push(m);

const pages = ['daylight.html'];
const alias = 'ray.html';
const styles = ['css/dl-shared.css', 'css/daylight-case-study.css', 'css/ray.css', 'css/product-scenes.css', 'css/daylight-story.css'];
const scripts = ['js/dl-shared.js', 'js/cs-state.js', 'js/ray-case-study.js', 'js/product-scenes.js'];
const demoPage = 'ray-demo.html';
const demoStyles = ['css/ray-demo.css'];
const demoScripts = ['js/ray-demo-state.js', 'js/ray-demo.js'];
const returnScript = 'js/ray-return.js';
const textFiles = [...pages, alias, ...styles, ...scripts, demoPage, ...demoStyles, ...demoScripts, returnScript];

for (const f of textFiles) {
  if (!fs.existsSync(path.join(root, f))) { fail(`${f}: missing`); continue; }
  const s = read(f);
  const idx = s.indexOf('—');
  if (idx !== -1) { fail(`${f}: em dash at offset ${idx}: ${JSON.stringify(s.slice(Math.max(0, idx - 40), idx + 40))}`); }
  if (/&mdash;/.test(s)) { fail(`${f}: &mdash; entity`); }
}
// Legacy tracked scripts may exist; page-level checks below reject loading them.

function stripGate(html) { return html.replace(/<div id="dl-gate"[\s\S]*?<\/form>\s*<a class="dl-gate-back"[^>]*>[\s\S]*?<\/a>\s*<\/div>\s*<\/div>/, ''); }
function gateBlock(html) { const m = html.match(/<div id="dl-gate"[\s\S]*?<\/form>\s*<a class="dl-gate-back"[^>]*>[\s\S]*?<\/a>\s*<\/div>\s*<\/div>/); return m ? m[0] : null; }
const RETIRED = ['notes-demo', 'mobile-demo', 'dl-chain', 'ls-explore', 'pc-explore', 'id="rv"', 'id="lb"', 'id="ls"', 'id="pc"', 'home-tab-', 'nd-compose', 'mp-form', 'cs-mask', 'cs-stepper', 'cs-tabs', 'cs-demo', 'cs-table-wrap', 'pc-seg', 'rv-seg'];

for (const page of pages) {
  const html = read(page);
  const body = stripGate(html);
  const h1s = (body.match(/<h1[\s>]/g) || []).length;
  if (h1s !== 1) { fail(`${page}: expected one H1 outside the gate, found ${h1s}`); }
  const gate = gateBlock(html);
  if (!gate) { fail(`${page}: gate block not found`); }
  else {
    if (!/<h2 class="dl-gate-t" id="dl-gate-t">/.test(gate)) { fail(`${page}: gate heading should be an H2`); }
    let head;
    try { head = execSync(`git show HEAD:${page}`, { cwd: root, encoding: 'utf8' }); } catch (e) { head = null; }
    if (head) {
      const headGate = gateBlock(head);
      if (!headGate || headGate !== gate) { fail(`${page}: gate block differs from HEAD`); }
    }
  }
  if (!/js\/daylight-gate\.js/.test(html)) { fail(`${page}: gate script missing`); }
  if (!/css\/daylight-gate\.css/.test(html)) { fail(`${page}: gate stylesheet missing`); }
  if (!/html\.dl-locked\{overflow:hidden\}/.test(html)) { fail(`${page}: inline lock rules missing`); }
  if (/sessionStorage\.setItem/.test(html)) { fail(`${page}: page must not write the unlock flag`); }
  if (/dl-unlocked/.test(body.replace(/<script[^>]*>[\s\S]*?<\/script>/g, ''))) { fail(`${page}: unlock key referenced outside the pre-paint lock script`); }
  if (!/class="cs-skip"/.test(html)) { fail(`${page}: skip link missing`); }
  if (!/<main id="[^"]+"/.test(html)) { fail(`${page}: main landmark missing`); }
  if (!/viewport-fit=cover/.test(html)) { fail(`${page}: viewport-fit=cover missing`); }
  if (/user-scalable=no|maximum-scale=1/.test(html)) { fail(`${page}: zoom must not be disabled`); }

  // versions on the rebuilt files
  for (const v of ['css/dl-shared.css?v=7', 'js/dl-shared.js?v=7']) { if (!html.includes(v)) { fail(`${page}: expected ${v}`); } }
  for (const v of ['css/daylight-case-study.css?v=50', 'css/product-scenes.css?v=2', 'css/ray.css?v=59', 'css/daylight-story.css?v=2', 'js/product-scenes.js?v=3', 'js/ray-case-study.js?v=50', 'js/cs-state.js?v=3', 'js/ray-return.js?v=3']) { if (!html.includes(v)) { fail(`${page}: expected ${v}`); } }
  if (!/<html lang="en" class="dl-page ray-page dl-story">/.test(html)) { fail(`${page}: the combined page scopes its composition with html.dl-story`); }
  if (/daylight-case-study\.js/.test(html)) { fail(`${page}: the retired Daylight page script stays unloaded`); }
  if (!/<a class="cs-btn ray-try" href="ray-demo\.html" data-ray-demo>/.test(html)) { fail(`${page}: the Ray chapter must offer Try Ray as a marked link to the demo`); }
  if (!/Interactive demo &middot; Sample data/.test(html)) { fail(`${page}: the Try Ray action must state sample data beside it`); }
  for (const m of html.matchAll(/<a\b[^>]*href="ray-demo\.html"[^>]*>/g)) { if (!/data-ray-demo/.test(m[0])) { fail(`${page}: every demo link is marked for the return position: ${m[0]}`); } }
  if (/js\/ray-demo(-state)?\.js/.test(html)) { fail(`${page}: the demo scripts belong to the demo page only`); }
  if (/main case study|shorter (overview|tour)|Daylight overview/i.test(stripGate(html))) { fail(`${page}: no main-versus-overview language in one combined story`); }
  if (/href="ray\.html/.test(html)) { fail(`${page}: the combined page never links to the alias`); }

  // local assets
  const refs = new Set();
  for (const m of html.matchAll(/(?:src|href)="([^"#?][^"]*?)(?:\?[^"]*)?"/g)) {
    const ref = m[1].split('#')[0];
    if (!ref || /^(https?:|mailto:|\/\/)/.test(ref)) { continue; }
    refs.add(ref);
  }
  for (const ref of refs) { if (!fs.existsSync(path.join(root, ref))) { fail(`${page}: missing asset ${ref}`); } }

  // id targets
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]));
  const dupes = [...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]).filter((v, i, a) => a.indexOf(v) !== i);
  if (dupes.length) { fail(`${page}: duplicate ids ${[...new Set(dupes)].join(', ')}`); }
  for (const attr of ['aria-controls', 'aria-labelledby', 'for']) {
    for (const m of html.matchAll(new RegExp(`\\s${attr}="([^"]+)"`, 'g'))) {
      for (const id of m[1].split(/\s+/)) { if (!ids.has(id)) { fail(`${page}: ${attr} points to missing id ${id}`); } }
    }
  }
  for (const m of html.matchAll(/data-video-toggle="([^"]+)"/g)) { if (!ids.has(m[1])) { fail(`${page}: video toggle for missing ${m[1]}`); } }
  for (const m of body.matchAll(/href="#([^"]+)"/g)) { if (!ids.has(m[1])) { fail(`${page}: in-page link to missing id ${m[1]}`); } }

  // the one interactive figure: controls before the result they change; reset never disabled
  {
    const actions = html.indexOf('id="sheet-actions"'), status = html.indexOf('id="sheet-status"'), rows = html.indexOf('id="sheet-rows"');
    if (!(actions > 0 && status > actions && rows > status)) { fail(`${page}: the sheet controls and status must precede the rows`); }
    if (/id="sheet-reset"[^>]*\bdisabled\b|\bdisabled\b[^>]*id="sheet-reset"/.test(html)) { fail(`${page}: reset must not start disabled; it stays focusable`); }
    if (/keyword search still answers/.test(body)) { fail(`${page}: retrieval and generation are separate; say keyword search remains available`); }
    if (/stops the reader/.test(body)) { fail(`${page}: obscure continuity caption`); }
  }
  {
    if (/credit check/.test(body.replace(/<details\b[\s\S]*?<\/details>/g, ''))) { fail(`${page}: the credit-check caveat belongs in optional engineering depth`); }
    if (/What is blocking this project\./.test(body)) { fail('daylight.html: questions need question marks or one ordinary sentence'); }
    if (/filed separately/.test(body.replace(/<details\b[\s\S]*?<\/details>/g, ''))) { fail('daylight.html: the attachment-versus-document caveat belongs in optional depth'); }
    if (/Question, prefilled from the note\. Editable before it is sent\./.test(body)) { fail('daylight.html: long uppercase label on the prefilled question'); }
  }
  // no all-caps prose: mono labels stay short
  for (const m of body.matchAll(/class="cs-label[^"]*"[^>]*>([^<]*)</g)) {
    if (m[1].trim().split(/\s+/).length > 6) { fail(`${page}: label too long for an uppercase treatment: ${m[1].trim()}`); }
  }

  // nothing that needs a simulator outside the gate
  if (/<(form|input|select|textarea)\b/.test(body)) { fail(`${page}: form control outside the gate`); }
  if (/role="tab(list|panel)?"/.test(body)) { fail(`${page}: tabs outside the gate`); }
  // Ray intentionally reconstructs the actual tabular sheet. Other scenes
  // remain editorial; table rows stack on phones instead of scrolling.
  {
    const outside = body.replace(/<figure class="sheet-story[^"]*"[\s\S]*?<\/figure>/, '').replace(/<figure class="dl-queue-figure[^"]*">[\s\S]*?<\/figure>/, '');
    if (/<table\b/.test(outside)) { fail(`${page}: table outside the source-faithful dashboard and sheet`); }
    if ((body.match(/<table class="sh-table">/g) || []).length !== 2) { fail(`${page}: expected file and live sheet tables`); }
    if ((body.match(/<table class="dp-jobs">/g) || []).length !== 1) { fail(`${page}: expected one dashboard table`); }
    if ((body.match(/<th scope="col">/g) || []).length !== 10) { fail(`${page}: dashboard (4) and sheet (6) columns need scoped headers`); }
    if ((body.match(/<th scope="row">/g) || []).length !== 3) { fail(`${page}: dashboard rows need row headers`); }
    const scenes = [...html.matchAll(/data-product-scene="([^"]+)"/g)].map((m) => m[1]);
    if (scenes.join() !== 'ray') { fail(`${page}: exactly one product scene, the Ray views; the retired abstract Daylight scene stays removed: ${scenes}`); }
  }
  for (const r of RETIRED) { if (body.includes(r)) { fail(`${page}: retired simulator marker present: ${r}`); } }
  for (const m of html.matchAll(/<(a|button)[^>]*>([\s\S]*?)<\/\1>/g)) {
    const inner = m[2].replace(/<[^>]+>/g, '').trim();
    const hasLabel = /aria-label(ledby)?=/.test(m[0]);
    if (!inner && !hasLabel) { fail(`${page}: control without text or label: ${m[0].slice(0, 80)}`); }
  }
  if (/target="_blank"(?![^>]*rel="noopener)/.test(html)) { fail(`${page}: target=_blank without noopener`); }
  if (!/<a class="cs-nav-back" href="[^"]+"/.test(html)) { fail(`${page}: nav back link missing`); }
  if (!/<span class="cs-nav-title">[^<]+<\/span>/.test(html)) { fail(`${page}: nav project name missing`); }
  if ((html.match(/<details class="cs-nav-chapters">/g) || []).length !== 1) { fail(`${page}: exactly one Chapters disclosure`); }
  if (/autoplay/.test(html)) { fail(`${page}: autoplay attribute present; films are opt-in and paused offscreen`); }
  for (const m of html.matchAll(/<video\b([^>]*)>/g)) {
    const attrs = m[1];
    const id = (attrs.match(/\sid="([^"]+)"/) || [])[1];
    if (!/\bposter="/.test(attrs)) { fail(`${page}: video ${id || ''} has no poster`); }
    if (!/\bmuted\b/.test(attrs) || !/\bplaysinline\b/.test(attrs)) { fail(`${page}: video ${id || ''} must be muted and playsinline`); }
    if (!/\bpreload="(none|metadata)"/.test(attrs)) { fail(`${page}: video ${id || ''} must preload none or metadata`); }
    if (!/\bdata-cs-video\b/.test(attrs)) { fail(`${page}: video ${id || ''} is not managed by dl-shared.js (data-cs-video)`); }
    if (!id || !html.includes(`data-video-toggle="${id}"`)) { fail(`${page}: video ${id || ''} has no play control`); }
  }
  for (const m of body.matchAll(/<img\b([^>]*)>/g)) {
    if (!/\balt="/.test(m[1])) { fail(`${page}: image without alt: ${m[1].slice(0, 60)}`); }
    if (!/\bwidth="\d+"/.test(m[1]) || !/\bheight="\d+"/.test(m[1])) { fail(`${page}: image without width and height: ${m[1].slice(0, 60)}`); }
  }
  // no emoji as iconography
  if (/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(body)) { fail(`${page}: emoji used as iconography`); }
}

// Ray narrative budget outside disclosures, navigation, the footer and the gate.
// Prose excludes figures, whose text is reconstructed product UI.
function visibleMarkup(page) {
  return stripGate(read(page))
    .replace(/<head>[\s\S]*?<\/head>/, '')
    .replace(/<nav\b[\s\S]*?<\/nav>/g, '')
    .replace(/<footer\b[\s\S]*?<\/footer>/g, '')
    .replace(/<details\b[\s\S]*?<\/details>/g, '')
    .replace(/<script\b[\s\S]*?<\/script>/g, '')
    .replace(/<style\b[\s\S]*?<\/style>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '');
}
function withoutFigures(html) {
  let out = '', i = 0;
  for (;;) {
    const a = html.indexOf('<figure', i);
    if (a < 0) { return out + html.slice(i); }
    out += html.slice(i, a);
    const re = /<(\/?)figure\b[^>]*>/g; re.lastIndex = a; let depth = 0, m;
    while ((m = re.exec(html))) { if (m[1]) { depth--; if (!depth) { i = re.lastIndex; break; } } else { depth++; } }
    if (depth) { return out; }
  }
}
function words(markup) {
  return markup.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;
}
function narrativeWords(page) { return words(visibleMarkup(page)); }
{
  const all = narrativeWords('daylight.html'), prose = words(withoutFigures(visibleMarkup('daylight.html')));
  if (prose > 2600) { fail(`daylight.html: ${prose} prose words outside figures, details, nav and footer; the budget is 2600`); }
  if (all > 4200) { fail(`daylight.html: ${all} visible words including figure labels; the budget is 4200`); }
  console.log('daylight.html prose words outside figures: ' + prose + '; all visible words: ' + all);
}

// uppercase is a label treatment, not a prose one
for (const f of styles) {
  const css = read(f);
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*text-transform:\s*uppercase[^{}]*)\}/g)) {
    const selector = m[1].trim().split('\n').pop().trim();
    const decl = m[2];
    if (!/font-family:\s*var\(--mono\)/.test(decl)) { fail(`${f}: uppercase without the mono family on ${selector}`); }
    const size = decl.match(/font-size:\s*([\d.]+)px/);
    if (!size || Number(size[1]) < 12) { fail(`${f}: uppercase label under 12px on ${selector}`); }
    if (!/letter-spacing/.test(decl)) { fail(`${f}: uppercase label without tracking on ${selector}`); }
    for (const part of selector.split(',')) {
      const last = part.trim().split(/[\s>+~]+/).pop();
      if (/^(p|body|h[1-4]|small|\.cs-body|\.cs-lead|\.cs-h[1-4]|\.cs-takeaway|\.cs-btn)$/.test(last)) { fail(`${f}: prose selector uppercased: ${part.trim()}`); }
    }
  }
}

// the reading system, in the stylesheets
{
  const shared = read('css/dl-shared.css');
  if (!/body\{[^}]*font-size:17px/.test(shared)) { fail('dl-shared.css: body must be 17px'); }
  if (!/@media \(min-width:900px\)\{\s*body\{font-size:18px\}/.test(shared)) { fail('dl-shared.css: body 18px from 900px'); }
  if (!/\.cs-caption\{[^}]*font-size:13\.5px/.test(shared)) { fail('dl-shared.css: captions at least 13px'); }
  if (!/\.cs-btn\{[^}]*min-height:50px/.test(shared)) { fail('dl-shared.css: buttons 50px'); }
  if (!/\.cs-btn\.small\{min-height:44px/.test(shared)) { fail('dl-shared.css: compact buttons 44px'); }
  if (!/\.cs-video-toggle\{[^}]*min-height:44px;min-width:44px/.test(shared)) { fail('dl-shared.css: the film control is 44px'); }
  if (!/\.cs-nav-chapters>summary\{[^}]*min-height:44px;min-width:44px/.test(shared)) { fail('dl-shared.css: the Chapters control is 44px'); }
  /* reading text is visible whether or not the reveal observer has run */
  const revealRule = shared.match(/\n\.cs-reveal\{([^}]*)\}/);
  if (!revealRule) { fail('dl-shared.css: .cs-reveal rule missing'); }
  else if (/opacity:\s*0|visibility:\s*hidden|translate/.test(revealRule[1])) { fail('dl-shared.css: reading text must not depend on the reveal state (.cs-reveal hides or moves its block)'); }
  for (const m of shared.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = m[1].trim().split('\n').pop().trim(), decl = m[2];
    if (!/opacity:\s*0(?![.\d])|visibility:\s*hidden/.test(decl)) { continue; }
    if (/cs-reveal/.test(selector) && !/\.cs-frame|\.cs-settle/.test(selector)) { fail(`dl-shared.css: a reveal rule hides content: ${selector}`); }
  }
  /* tags wrap; nothing clips the page to hide overflow; the nav bar grows with its text */
  if (/\.cs-tag\{[^}]*white-space:\s*nowrap/.test(shared)) { fail('dl-shared.css: status tags must wrap at large text sizes'); }
  if (/\.cs-nav-title\{[^}]*(white-space:\s*nowrap|text-overflow|overflow:\s*hidden)/.test(shared)) { fail('dl-shared.css: the nav title must not be clipped; omit it on narrow screens instead'); }
  if (/\nbody\{[^}]*overflow(-x)?:\s*(clip|hidden)/.test(shared)) { fail('dl-shared.css: no body overflow clip to conceal overflowing content'); }
  if (/\.cs-nav\{[^}]*[^-]height:/.test(shared)) { fail('dl-shared.css: the nav uses min-height, not a fixed height'); }
  if (/\.cs-nav-in\{[^}]*[^-]height:/.test(shared)) { fail('dl-shared.css: the nav row uses min-height, not a fixed height'); }
  if (!/\.cs-nav-in\{[^}]*flex-wrap:wrap/.test(shared)) { fail('dl-shared.css: the nav row must be allowed to wrap'); }
  if (/\.ray-continuity\{[^}]*overflow:\s*hidden/.test(read('css/ray.css'))) { fail('ray.css: the continuity chapter must not clip its content'); }
  if (/\.sh-rows li\{[^}]*grid-template-columns/.test(read('css/ray.css'))) { fail('ray.css: sheet rows must wrap (flex), not pin the tag to a fixed column'); }
  if (!/\*,\*::before,\*::after\{box-sizing:border-box;min-width:0\}/.test(shared)) { fail('dl-shared.css: min-width:0 on every element so grid children shrink'); }
  if (!/@media \(prefers-reduced-motion:reduce\)/.test(shared)) { fail('dl-shared.css: reduced-motion rule missing'); }
  if (!/env\(safe-area-inset-(top|left|right|bottom)/.test(shared)) { fail('dl-shared.css: safe-area insets missing'); }
  for (const side of ['top', 'left', 'right', 'bottom']) { if (!shared.includes('safe-area-inset-' + side)) { fail(`dl-shared.css: safe-area-inset-${side} missing`); } }
  if (!/-webkit-text-size-adjust:100%/.test(shared)) { fail('dl-shared.css: Safari text zoom must not be disabled'); }
  const touch = [...shared.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{[^{}]*touch-action:manipulation[^{}]*\}/g)].map((m) => m[1].trim());
  if (touch.length !== 1 || touch[0] !== 'a,button,summary') { fail('dl-shared.css: touch-action only on controls (a,button,summary): ' + JSON.stringify(touch)); }
  for (const f of styles) {
    const css = read(f);
    const noMenus = css.replace(/\.cs-nav-menu\{[^}]*\}/g, '');
    if (/overflow(-x|-y)?:\s*(auto|scroll)/.test(noMenus)) { fail(`${f}: inner scrolling outside the chapter menu`); }
    if (/max-height/.test(noMenus)) { fail(`${f}: max-height on variable content outside the chapter menu`); }
    for (const m of css.matchAll(/@media \(max-width:\d+px\)\{([\s\S]*?)\n\}/g)) {
      if (/margin(-top|-left|-right|-bottom)?:\s*-|margin:[^;}]*\s-\d/.test(m[1])) { fail(`${f}: negative margin inside a phone rule`); }
    }
    // Ray's compact mobile choices may stay reachable while their own figure
    // scrolls. Product scenes and reading content must never be pinned.
    const unpinnedContent = f === 'css/ray.css' ? css.replace(/\.feature-controls\{[^}]*\}/g, '') : css;
    if (/position:\s*sticky/.test(unpinnedContent)) { fail(`${f}: only Ray's feature choices may be sticky; narrative content stays in normal flow`); }
    /* nothing below 13px anywhere (labels and captions), and no unit-less or em tricks that could shrink under it */
    for (const m of css.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)) { if (Number(m[1]) < 13) { fail(`${f}: type under 13px: ${m[0]}`); } }
    for (const m of css.matchAll(/font-size:\s*clamp\(\s*(\d+(?:\.\d+)?)px/g)) { if (Number(m[1]) < 16) { fail(`${f}: fluid type may drop under 16px: ${m[0]}`); } }
  }
}

// original brand media only; rejected generated media stays out
for (const f of textFiles.filter((f) => !f.endsWith('.md'))) {
  if (/ray-information-/.test(read(f))) { fail(`${f}: references the rejected generated sculpture or film`); }
  if (/RAY-CONCEPT/.test(read(f))) { fail(`${f}: leftover placeholder marker`); }
}
{
  const dl = read('daylight.html');
  if (!/id="homeowners"/.test(dl)) { fail('daylight.html: homeowner Ray keeps its #homeowners anchor'); }
  if (!/Reconstructed iOS conversation and document card/.test(dl)) { fail('daylight.html: reconstructed native cards must be labeled'); }
  if (/images\/daylight-house-editorial-crop\.jpg/.test((dl.match(/<header class="ds-hero"[\s\S]*?<\/header>/) || [''])[0])) { fail('daylight.html: the opening leads with the homeowner app, not the separate house photograph'); }
  for (const s of ['ios-overview', 'ios-breakdown', 'ios-payments']) { if (!dl.includes(`images/${s}.png`)) { fail(`daylight.html: missing authentic screenshot ${s}`); } }
  if (!/<source src="images\/daylight-cover-loop\.mp4"/.test(dl)) { fail('daylight.html: the pivot must use the original gradient film'); }
  /* the brand media this page uses; the staging checkout does not carry the
     unused light-study files the earlier checkout listed here */
  const media = ['images/daylight-cover-loop.mp4', 'images/daylight-cover-poster.jpg', 'images/daylight-house-editorial-crop.jpg', 'images/ray-avatar-poster.png'];
  for (const m of media) { if (!fs.existsSync(path.join(root, m))) { fail(`missing brand asset ${m}`); } }
  if (/belong to colleagues/.test(dl)) { fail('ownership language regressed'); }
  if (/wilks7/.test(stripGate(dl).replace(/<details\b[\s\S]*?<\/details>/g, ''))) { fail('daylight.html: teammate credit belongs in the optional engineering summary'); }
}

// no external scripts, network, HTML injection or gate access in page JS
for (const f of scripts) {
  const s = read(f);
  if (/fetch\(|XMLHttpRequest|WebSocket|EventSource|navigator\.sendBeacon|<script/.test(s)) { fail(`${f}: network or script injection call found`); }
  if (/\.innerHTML\s*=|insertAdjacentHTML|outerHTML\s*=/.test(s)) { fail(`${f}: HTML injection API used; use textContent`); }
  if (/sessionStorage|localStorage|dl-unlocked|dl-locked'\)/.test(s.replace(/contains\('dl-locked'\)/g, ''))) { fail(`${f}: storage or gate flag touched`); }
  if (/scrollIntoView|scrollTo\(|location\.hash\s*=/.test(s)) { fail(`${f}: the script must never scroll the page or rewrite the URL`); }
}

{
  const s = read(returnScript);
  if (/fetch\(|XMLHttpRequest|WebSocket|EventSource|navigator\.sendBeacon|<script/.test(s)) { fail(`${returnScript}: network or script injection call found`); }
  if (/\.innerHTML\s*=|insertAdjacentHTML|outerHTML\s*=/.test(s)) { fail(`${returnScript}: HTML injection API used`); }
  if (/localStorage|dl-unlocked|indexedDB|document\.cookie/.test(s)) { fail(`${returnScript}: only sessionStorage under the return key is allowed`); }
  const keys = [...s.matchAll(/sessionStorage\.(getItem|setItem|removeItem)\(([^,)]+)/g)].map((m) => m[2].trim());
  if (!keys.length || keys.some((k) => k !== 'KEY')) { fail(`${returnScript}: sessionStorage must only be used through the single KEY constant: ${JSON.stringify(keys)}`); }
  if (!/var KEY = 'ray-demo-return-v2'/.test(s)) { fail(`${returnScript}: the return key must be the v2 key for the combined page, so v1 positions from the former Ray page are ignored`); }
  if (/location\.hash\s*=|pushState|replaceState/.test(s)) { fail(`${returnScript}: the return script must not rewrite the URL or history`); }
  if (!/a\[data-ray-demo\]/.test(s)) { fail(`${returnScript}: only marked demo links are handled, never every link`); }
  if (/addEventListener\('popstate'|addEventListener\('hashchange'/.test(s)) { fail(`${returnScript}: no history interception`); }
  if (/ray\.html|index\.html/.test(s)) { fail(`${returnScript}: the return script names no page; it is loaded by daylight.html only`); }
  if (/scrollTo\(0, 0\)|sessionStorage\.setItem\('dl/.test(s)) { fail(`${returnScript}: never scrolls to the top or writes a gate flag`); }
  const dl = read('daylight.html');
  if (!/<script src="js\/ray-return\.js\?v=3" defer><\/script>/.test(dl)) { fail('daylight.html: the return script is loaded'); }
  if (/js\/ray-demo/.test(dl)) { fail('daylight.html: no demo script on the case study'); }
  if (/where Ray started|led to Ray|already knew/.test(dl)) { fail('daylight.html: Notes shaped how Ray was expanded; Ray predates this work, so no origin claims'); }
  for (const f of ['index.html', 'ray-demo.html', 'ray.html']) { if (/ray-return/.test(read(f))) { fail(`${f}: the return script belongs to daylight.html only`); } }
  const home = read('index.html');
  if (!/<a href="daylight\.html" class="pf-lead">(?:(?!<\/a>)[\s\S])*?<span class="pf-title-text">Daylight<\/span>(?:(?!<\/a>)[\s\S])*?<span class="pf-year">2024–Present<\/span>/.test(home)) { fail('index.html: the lead card opens the combined Daylight story, dated to the tenure'); }
  if (/href="ray\.html"/.test(home)) { fail('index.html: no card competes with the combined story'); }
}

// ---------------- the Ray demo page ----------------
{
  const html = read(demoPage);
  const body = stripGate(html);
  const rayHtml = read('daylight.html');
  const gate = gateBlock(html), rayGate = gateBlock(rayHtml);
  if (!gate) { fail(`${demoPage}: gate block not found`); }
  else {
    /* the same gate as daylight.html apart from the visible title, intro and
       whitespace (the demo keeps its readable multi-line layout) */
    const neutral = (g) => g.replace(/>\s+</g, '><').replace(/\s+/g, ' ').replace(/<h2 class="dl-gate-t" id="dl-gate-t">[^<]*<\/h2>/, '<h2 class="dl-gate-t" id="dl-gate-t">T</h2>').replace(/<p class="dl-gate-s">[^<]*<\/p>/, '<p class="dl-gate-s">S</p>');
    if (!rayGate || neutral(gate) !== neutral(rayGate)) { fail(`${demoPage}: gate block differs from daylight.html beyond its title and intro`); }
    if (!/<h2 class="dl-gate-t" id="dl-gate-t">[^<]*<\/h2>/.test(gate)) { fail(`${demoPage}: gate heading should be an H2`); }
    const inlineLock = /<style>\s*html\.dl-locked\{overflow:hidden\}\s*html\.dl-locked body > \*:not\(#dl-gate\)\{visibility:hidden\}\s*#dl-gate\{display:none\}\s*html\.dl-locked #dl-gate\{display:flex\}\s*<\/style>/;
    if (!inlineLock.test(html)) { fail(`${demoPage}: inline lock rules must match daylight.html`); }
    const prePaint = rayHtml.match(/<script type="text\/javascript">\s*try\{if\(sessionStorage[\s\S]*?<\/script>/);
    if (!prePaint || !html.includes(prePaint[0])) { fail(`${demoPage}: the pre-paint lock script must be the one from daylight.html`); }
  }
  if (!/<script src="js\/daylight-gate\.js" defer><\/script>/.test(html)) { fail(`${demoPage}: gate script missing`); }
  if (!/css\/daylight-gate\.css\?v=3/.test(html)) { fail(`${demoPage}: gate stylesheet missing`); }
  if (/sessionStorage\.setItem/.test(html)) { fail(`${demoPage}: page must not write the unlock flag`); }
  if (/dl-unlocked/.test(body.replace(/<script[^>]*>[\s\S]*?<\/script>/g, ''))) { fail(`${demoPage}: unlock key referenced outside the pre-paint lock script`); }
  const scriptOrder = [...html.matchAll(/<script src="([^"?]+)/g)].map((m) => m[1]);
  if (scriptOrder[0] !== 'js/daylight-gate.js') { fail(`${demoPage}: the gate script must load first`); }
  if (!/viewport-fit=cover/.test(html)) { fail(`${demoPage}: viewport-fit=cover missing`); }
  if (/user-scalable=no|maximum-scale=1/.test(html)) { fail(`${demoPage}: zoom must not be disabled`); }
  if ((body.match(/<h1[\s>]/g) || []).length !== 1) { fail(`${demoPage}: expected one H1 outside the gate`); }
  if (!/<main [^>]*id="rd-chat"/.test(html)) { fail(`${demoPage}: main landmark missing`); }
  if (!/class="cs-skip"/.test(html)) { fail(`${demoPage}: skip link missing`); }
  for (const v of ['css/dl-shared.css?v=7', 'js/dl-shared.js?v=7', 'js/cs-state.js?v=3', 'css/ray-demo.css?v=1', 'js/ray-demo-state.js?v=1', 'js/ray-demo.js?v=1']) { if (!html.includes(v)) { fail(`${demoPage}: expected ${v}`); } }
  if (/js\/ray-case-study\.js|css\/ray\.css|js\/ray-return\.js/.test(html)) { fail(`${demoPage}: case-study composition and the return script stay off the demo page`); }
  /* honesty labels, no file picker, no autofocus, no external dependency */
  if (!/Interactive demo &middot; Sample data/.test(body)) { fail(`${demoPage}: the sample-data label is missing`); }
  if (!/<details class="rd-about"[^>]*>\s*<summary>About this demo<\/summary>/.test(body)) { fail(`${demoPage}: the About this demo disclosure is missing`); }
  if (!/scripted/i.test(body)) { fail(`${demoPage}: the disclosure must say the responses are scripted`); }
  if (!/placeholder="Ask about this sample project"/.test(body)) { fail(`${demoPage}: composer placeholder`); }
  if (!/<label class="cs-vh" for="rd-input">/.test(body)) { fail(`${demoPage}: the composer needs an accessible label`); }
  if (/type="file"|accept=|capture=/.test(body)) { fail(`${demoPage}: no local file picker`); }
  if (/\bautofocus\b/.test(body)) { fail(`${demoPage}: no autofocus on entry`); }
  if (/<script src="(https?:)?\/\/|<link[^>]*href="(https?:)?\/\//.test(html)) { fail(`${demoPage}: no external resource`); }
  if (/<iframe|<object|<embed/.test(html)) { fail(`${demoPage}: no embedded frames`); }
  if (/Intercom/.test(body.replace(/<script[^>]*>[\s\S]*?<\/script>/g, ''))) { fail(`${demoPage}: the static page must not promise Intercom`); }
  if (!/<a class="rd-back" href="daylight\.html#ray"/.test(body)) { fail(`${demoPage}: the top bar must link back to the Ray chapter of the case study with a plain link, never history.back`); }
  if (!/<noscript>[\s\S]*?href="daylight\.html#ray"[\s\S]*?<\/noscript>/.test(body)) { fail(`${demoPage}: the no-script note links to the combined case study`); }
  if (/href="ray\.html/.test(html)) { fail(`${demoPage}: links go to the canonical page, not the alias`); }
  if (!/<p class="cs-vh" id="rd-live" role="status" aria-live="polite"><\/p>/.test(body)) { fail(`${demoPage}: one polite live region for status summaries`); }
  if ((body.match(/aria-live=/g) || []).length !== 1) { fail(`${demoPage}: exactly one live region in the markup; the conversation itself is never live`); }
  if (/role="dialog"|aria-modal/.test(body)) { fail(`${demoPage}: the detail view is a destination or side panel, not a modal`); }
  if (!/<section class="rd-detail" id="rd-detail" aria-labelledby="rd-detail-title" hidden>/.test(body)) { fail(`${demoPage}: the detail region is a labelled section, hidden until opened`); }
  if (!/<h2 class="rd-detail-title" id="rd-detail-title" tabindex="-1">/.test(body)) { fail(`${demoPage}: the detail title receives focus on open`); }
  if (!/<textarea class="rd-input" id="rd-input"[^>]*rows="1"/.test(body)) { fail(`${demoPage}: the composer is a real textarea`); }
  if (!/<noscript>/.test(body)) { fail(`${demoPage}: a no-script note pointing back to the case study`); }
  /* local assets, ids, references, names */
  const refs = new Set();
  for (const m of html.matchAll(/(?:src|href)="([^"#?][^"]*?)(?:\?[^"]*)?"/g)) { const ref = m[1].split('#')[0]; if (ref && !/^(https?:|mailto:|\/\/)/.test(ref)) { refs.add(ref); } }
  for (const ref of refs) { if (!fs.existsSync(path.join(root, ref))) { fail(`${demoPage}: missing asset ${ref}`); } }
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const dupes = ids.filter((v, i, a) => a.indexOf(v) !== i);
  if (dupes.length) { fail(`${demoPage}: duplicate ids ${[...new Set(dupes)].join(', ')}`); }
  const idSet = new Set(ids);
  for (const attr of ['aria-controls', 'aria-labelledby', 'for']) {
    for (const m of html.matchAll(new RegExp(`\\s${attr}="([^"]+)"`, 'g'))) { for (const id of m[1].split(/\s+/)) { if (!idSet.has(id)) { fail(`${demoPage}: ${attr} points to missing id ${id}`); } } }
  }
  for (const m of body.matchAll(/href="#([^"]+)"/g)) { if (!idSet.has(m[1])) { fail(`${demoPage}: in-page link to missing id ${m[1]}`); } }
  for (const m of html.matchAll(/<(a|button)[^>]*>([\s\S]*?)<\/\1>/g)) {
    const inner = m[2].replace(/<[^>]+>/g, '').trim();
    if (!inner && !/aria-label(ledby)?=/.test(m[0])) { fail(`${demoPage}: control without text or label: ${m[0].slice(0, 80)}`); }
  }
  for (const m of body.matchAll(/<img\b([^>]*)>/g)) {
    if (!/\balt="/.test(m[1])) { fail(`${demoPage}: image without alt`); }
    if (!/\bwidth="\d+"/.test(m[1]) || !/\bheight="\d+"/.test(m[1])) { fail(`${demoPage}: image without width and height`); }
  }
  if (/ray-information-|RAY-CONCEPT/.test(html)) { fail(`${demoPage}: rejected media or placeholder marker`); }
  if (/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(body)) { fail(`${demoPage}: emoji used as iconography`); }
  for (const m of body.matchAll(/class="cs-label[^"]*"[^>]*>([^<]*)</g)) { if (m[1].trim().split(/\s+/).length > 6) { fail(`${demoPage}: label too long for an uppercase treatment: ${m[1].trim()}`); } }
  if (/target="_blank"(?![^>]*rel="noopener)/.test(html)) { fail(`${demoPage}: target=_blank without noopener`); }
  if (!/<meta name="robots" content="noindex">/.test(html)) { fail(`${demoPage}: the private demo should not be indexed`); }
}
{
  const css = read('css/ray-demo.css');
  if (!/height:100vh;height:100dvh/.test(css)) { fail('ray-demo.css: the shell needs dvh with a vh fallback, in that order'); }
  if (/100vh(?!;height:100dvh)/.test(css.replace(/max-height:40vh;max-height:40dvh/g, ''))) { fail('ray-demo.css: every 100vh must be followed by its dvh override'); }
  for (const side of ['top', 'left', 'right', 'bottom']) { if (!css.includes('safe-area-inset-' + side)) { fail(`ray-demo.css: safe-area-inset-${side} missing`); } }
  if (!/@media \(prefers-reduced-motion:reduce\)/.test(css)) { fail('ray-demo.css: reduced-motion rule missing'); }
  if (!/html\.reduce-motion \.rd-detail\.is-entering\{animation:none\}/.test(css)) { fail('ray-demo.css: a live reduced-motion change must switch off the spatial transition'); }
  const input = css.match(/\.rd-input\{([^}]*)\}/);
  if (!input || !/font-size:17px/.test(input[1])) { fail('ray-demo.css: the composer textarea must be 17px (at least 16px avoids Safari focus zoom)'); }
  if (!input || !/max-height:40vh;max-height:40dvh/.test(input[1]) || !/overflow-y:auto/.test(input[1])) { fail('ray-demo.css: the textarea grows to a bound then scrolls inside'); }
  const reply = css.match(/\.rd-reply-input\{([^}]*)\}/);
  if (!reply || !/font-size:17px/.test(reply[1])) { fail('ray-demo.css: the reply textarea must be 17px'); }
  for (const m of css.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)) { if (Number(m[1]) < 13) { fail(`ray-demo.css: type under 13px: ${m[0]}`); } }
  for (const m of css.matchAll(/font-size:\s*clamp\(\s*(\d+(?:\.\d+)?)px/g)) { if (Number(m[1]) < 16) { fail(`ray-demo.css: fluid type may drop under 16px: ${m[0]}`); } }
  for (const sel of ['.rd-back', '.rd-reset', '.rd-starter', '.rd-chip', '.rd-latest', '.rd-detail-back', '.rd-stop', '.rd-about>summary']) {
    const rule = css.match(new RegExp(sel.replace(/[.>]/g, (c) => '\\' + c) + '\\{([^}]*)\\}'));
    if (!rule || !/min-height:(4[4-9]|[5-9]\d)px/.test(rule[1])) { fail(`ray-demo.css: ${sel} needs a 44px minimum height`); }
  }
  const send = css.match(/\.rd-send\{([^}]*)\}/);
  if (!send || !/width:48px;height:48px/.test(send[1])) { fail('ray-demo.css: the Send control is 48px'); }
  const scrollers = [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{[^{}]*overflow(-y)?:\s*auto[^{}]*\}/g)].map((m) => m[1].trim());
  const allowed = ['.rd-scroll', '.rd-input', '.rd-detail-scroll'];
  for (const s of scrollers) { if (!allowed.includes(s)) { fail(`ray-demo.css: inner scrolling only on the message scroller, the textarea and the detail body: ${s}`); } }
  if (!/html\.rd-page,html\.rd-page body\{height:100%;overflow:hidden/.test(css)) { fail('ray-demo.css: the page behind the shell must not scroll (no double scrolling)'); }
  if (/position:\s*sticky/.test(css)) { fail('ray-demo.css: no sticky pinning'); }
  if (/user-select:\s*none/.test(css)) { fail('ray-demo.css: content stays selectable'); }
  if (/touch-action/.test(css)) { fail('ray-demo.css: touch-action is inherited from dl-shared.css on controls only'); }
  const rdBody = css.match(/\.rd-answer p\{([^}]*)\}/);
  if (!rdBody || !/font-size:17px/.test(rdBody[1])) { fail('ray-demo.css: Ray answers read at 17px'); }
  if (!/\.rd-shell\[data-view="detail"\] \.rd-body\{grid-template-columns/.test(css)) { fail('ray-demo.css: the desktop side panel only takes a column while a detail is open'); }
  const phone = css.match(/@media \(max-width:899px\)\{([\s\S]*?)\n\}/);
  if (!phone || !/\.rd-shell\[data-view="detail"\] \.rd-top\{display:none\}/.test(phone[1])) { fail('ray-demo.css: on phones an open detail hides the top bar, so there is one Back control'); }
  if (!phone || !/\.rd-detail-top\{[^}]*safe-area-inset-top/.test(phone[1])) { fail('ray-demo.css: the phone detail bar carries the top safe area once the top bar is hidden'); }
}
for (const f of demoScripts) {
  const s = read(f);
  if (/fetch\(|XMLHttpRequest|WebSocket|EventSource|navigator\.sendBeacon|<script|import\(|importScripts/.test(s)) { fail(`${f}: network or script injection call found`); }
  if (/\.innerHTML\s*=|insertAdjacentHTML|outerHTML\s*=|document\.write/.test(s)) { fail(`${f}: HTML injection API used; use textContent`); }
  if (/localStorage|indexedDB|document\.cookie|dl-unlocked/.test(s)) { fail(`${f}: only sessionStorage under the demo key is allowed`); }
  if (/scrollIntoView|window\.scrollTo|location\.hash\s*=|location\.href\s*=|location\.assign|location\.replace/.test(s)) { fail(`${f}: the demo must not scroll the page or rewrite the URL`); }
  if (/openai|anthropic|api\.|apiKey|api_key|Bearer/i.test(s)) { fail(`${f}: no model endpoint or key`); }
  if (/\bsetInterval\b/.test(s)) { fail(`${f}: no continuous timers; answers arrive on a cleared timer group`); }
  if (/\balert\(|\bconfirm\(|\bprompt\(/.test(s)) { fail(`${f}: no native dialogs`); }
}
{
  const s = read('js/ray-demo-state.js').replace(/\/\*[\s\S]*?\*\//g, '');
  if (/document\.|window\.|setTimeout|sessionStorage/.test(s)) { fail('ray-demo-state.js: the state module stays pure (no DOM, timers or storage)'); }
  if (!/var VERSION = 1;/.test(s)) { fail('ray-demo-state.js: the storage format is versioned'); }
  const c = read('js/ray-demo.js');
  const keys = [...c.matchAll(/sessionStorage\.(getItem|setItem|removeItem)\(([^,)]+)/g)].map((m) => m[2].trim());
  if (!keys.length || keys.some((k) => k !== 'KEY')) { fail(`ray-demo.js: sessionStorage must only be used through the single KEY constant: ${JSON.stringify(keys)}`); }
  if (!/var KEY = 'ray-demo-session-v1'/.test(c)) { fail('ray-demo.js: the session key must be versioned'); }
  if (!/try \{ window\.sessionStorage\.setItem/.test(c) || !/try \{ raw = window\.sessionStorage\.getItem/.test(c)) { fail('ray-demo.js: storage access must be guarded with try/catch'); }
  if (!/addEventListener\('popstate'/.test(c) || !/history\.pushState\(/.test(c) || !/rd: 'detail'/.test(c)) { fail('ray-demo.js: details are history entries'); }
  if (!/addEventListener\('pagehide'/.test(c)) { fail('ray-demo.js: leaving the page must clear timers and store an interrupted turn'); }
  if (/\.focus\(\)[^;]*;\s*\/\/ init|autofocus/.test(c)) { fail('ray-demo.js: no autofocus on entry'); }
}

// ---------------- ray.html: a compatibility alias only ----------------
{
  const html = read(alias);
  const text = html.replace(/<head>[\s\S]*?<\/head>/, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (text !== 'Continue to the Daylight case study') { fail(`${alias}: the alias shows one forwarding link and no case-study text: ${JSON.stringify(text.slice(0, 120))}`); }
  if (/<main|id="dl-gate"|daylight-gate|<section|<figure/.test(html)) { fail(`${alias}: no story, gate or figure on the alias`); }
  if (!/<meta name="robots" content="noindex">/.test(html) || !/<link rel="canonical" href="daylight\.html">/.test(html)) { fail(`${alias}: noindex and canonical to daylight.html`); }
  if (!/<noscript><meta http-equiv="refresh" content="0; url=daylight\.html#questions"><\/noscript>/.test(html)) { fail(`${alias}: a no-script refresh to the Ray chapter`); }
  if (!/location\.replace\('daylight\.html#' \+ target\)/.test(html)) { fail(`${alias}: forwards with location.replace, so the alias leaves no history entry`); }
  if (/sessionStorage|localStorage|document\.cookie|fetch\(/.test(html)) { fail(`${alias}: no storage or network`); }
  const map = html.match(/var map = (\{[^}]*\});/);
  if (!map) { fail(`${alias}: fragment map missing`); }
  else {
    const targets = Object.values(JSON.parse(map[1].replace(/'/g, '"')));
    const dlIds = new Set([...read('daylight.html').matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
    for (const t of targets) { if (!dlIds.has(t)) { fail(`${alias}: forwards to missing daylight.html#${t}`); } }
    const keys = Object.keys(JSON.parse(map[1].replace(/'/g, '"')));
    const oldIds = [...read('tests/fixtures/ray-914eb13-ids.txt').trim().split(/\s+/)];
    for (const id of oldIds) { if (!keys.includes(id)) { fail(`${alias}: old ray.html anchor #${id} is not mapped`); } }
  }
  const oldDaylight = read('tests/fixtures/daylight-914eb13-ids.txt').trim().split(/\s+/);
  const dlIds = new Set([...read('daylight.html').matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  for (const id of oldDaylight) { if (!dlIds.has(id)) { fail(`daylight.html: the old chapter anchor #${id} must still resolve`); } }
}

if (failures.length) { console.error('check-pages: FAIL\n' + failures.map(f => ' - ' + f).join('\n')); process.exit(1); }
console.log('check-pages: OK (' + pages.join(', ') + ', ' + alias + ' alias, ' + demoPage + ', index.html lead)');
