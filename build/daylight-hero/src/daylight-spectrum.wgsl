// Daylight spectrum — the living energy field for the case-study hero.
//
// Concept: sunlight becoming a system. A warm light source sits at the top
// right; energy streams from it as directional filaments of light. As the
// reader scrolls, the free-flowing light organizes into an ordered luminous
// lattice — the same energy, now a structured project. The pointer deflects
// the flow and lifts a soft bloom. No logo or text is ever composited here.
//
// Leaf shader (no imports) so the Vite loader emits it directly. Validated with
// `npx vgpu check --require-validation`. uv is top-origin (0,0 = top-left).

struct U {
  // x: time (s)   y: scroll 0..1   z: aspect (w/h)   w: unused
  params  : vec4f,
  // x: pointer x (-1..1)   y: pointer y (-1..1)   z: pointer energy 0..1   w: unused
  pointer : vec4f,
}
@group(0) @binding(0) var<uniform> u: U;

fn hash2(p: vec2f) -> f32 {
  let h = dot(p, vec2f(127.1, 311.7));
  return fract(sin(h) * 43758.5453123);
}

// smooth value noise
fn vnoise(p: vec2f) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let w = f * f * (3.0 - 2.0 * f);
  let a = hash2(i + vec2f(0.0, 0.0));
  let b = hash2(i + vec2f(1.0, 0.0));
  let c = hash2(i + vec2f(0.0, 1.0));
  let d = hash2(i + vec2f(1.0, 1.0));
  return mix(mix(a, b, w.x), mix(c, d, w.x), w.y);
}

fn fbm(p: vec2f) -> f32 {
  var v = 0.0;
  var amp = 0.5;
  var pp = p;
  for (var i = 0; i < 5; i = i + 1) {
    v = v + amp * vnoise(pp);
    pp = pp * 2.02 + vec2f(11.3, 7.7);
    amp = amp * 0.5;
  }
  return v;
}

// warm luminous palette: soft cream low end -> amber -> Daylight orange ->
// yellow -> near-white highlight. No dark/brown trough; the field stays bright.
fn ramp(x: f32) -> vec3f {
  let t = clamp(x, 0.0, 1.0);
  let c0 = vec3f(0.988, 0.878, 0.686);  // warm cream low  #FCE0AF
  let c1 = vec3f(0.988, 0.780, 0.420);  // soft amber
  let c2 = vec3f(0.988, 0.612, 0.176);  // warm orange
  let c3 = vec3f(0.965, 0.435, 0.000);  // Daylight orange #F66F00
  let c4 = vec3f(1.000, 0.620, 0.180);  // bright orange
  let c5 = vec3f(0.992, 0.835, 0.325);  // yellow #FCCC3C
  let c6 = vec3f(1.000, 0.972, 0.870);  // near-white warm highlight
  var col = mix(c0, c1, smoothstep(0.00, 0.22, t));
  col = mix(col, c2, smoothstep(0.18, 0.40, t));
  col = mix(col, c3, smoothstep(0.36, 0.56, t));
  col = mix(col, c4, smoothstep(0.54, 0.70, t));
  col = mix(col, c5, smoothstep(0.68, 0.86, t));
  col = mix(col, c6, smoothstep(0.86, 1.00, t));
  return col;
}

// Free-flowing energy: directional filaments streaming from the source. The
// coordinate along the flow (a) advances with time so the light visibly moves;
// ridged waves across the flow (b) read as bright veins of energy.
fn flow(c: vec2f, t: f32, warpAmt: f32) -> f32 {
  let dir  = vec2f(-0.80, 0.60);   // stream toward lower-left (source is upper-right)
  let perp = vec2f(0.60, 0.80);
  let a = dot(c, dir);
  let b = dot(c, perp);
  let w = fbm(c * 1.35 + vec2f(t * 0.030, -t * 0.020));
  let bb = b + (w - 0.5) * warpAmt;
  var s = sin(bb * 6.0 - a * 1.3 + t * 0.50 + w * 2.0);
  s = s + 0.55 * sin(bb * 11.0 - a * 0.8 - t * 0.34 + w * 3.0);
  s = s + 0.30 * sin(bb * 18.5 + a * 0.4 + t * 0.62);
  s = s / 1.85;
  // ridged filaments (bright veins of energy), sharpened so the flow reads as
  // legible streams of light rather than a formless cloud
  let vein = pow(clamp(1.0 - abs(s), 0.0, 1.0), 1.6);
  return mix(s * 0.5 + 0.5, vein, 0.72);
}

// Ordered energy: a soft luminous lattice of square cells with bright seams and
// a gentle per-cell shimmer. The structured, "it's a project now" state.
fn lattice(c: vec2f, t: f32) -> f32 {
  let cell = 0.150;
  let id = floor(c / cell);
  let f = fract(c / cell) - vec2f(0.5, 0.5);
  let gx = abs(f.x) * 2.0;
  let gy = abs(f.y) * 2.0;
  // bright near the cell edges, calm in the middle
  let seam = smoothstep(0.62, 1.0, max(gx, gy));
  // faint node glow at the crossings
  let node = smoothstep(0.32, 0.0, length(f));
  // slow shimmer so the grid breathes rather than freezing
  let sh = 0.5 + 0.5 * sin(t * 0.6 + (id.x - id.y) * 0.9 + hash2(id) * 6.28);
  return 0.30 + seam * 0.62 + node * 0.30 * sh;
}

@fragment
fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let t = u.params.x;
  let scroll = clamp(u.params.y, 0.0, 1.0);
  let aspect = max(u.params.z, 0.0001);

  // centered, aspect-corrected coords
  var c = uv - vec2f(0.5, 0.5);
  c.x = c.x * aspect;

  // pointer deflects the field and lifts a bloom
  let pt = u.pointer.xy;
  let penergy = clamp(u.pointer.z, 0.0, 1.0);
  let cd = c + pt * (0.05 + penergy * 0.06);

  // organize the flow into the lattice as the reader scrolls away. A small floor
  // keeps a faint structure present at rest — energy is always systematized here.
  let order = mix(0.14, 1.0, smoothstep(0.06, 0.94, scroll));
  let warpAmt = mix(0.42, 0.10, order);

  let fld = flow(cd, t, warpAmt);
  let lat = lattice(cd, t);
  var v = mix(fld, lat, order);

  // warm luminous source in the upper-right, streaming toward center
  let src = vec2f(0.62 * aspect, -0.40);
  let sd = length((cd - src) * vec2f(0.72, 1.0));
  v = v + smoothstep(1.35, 0.0, sd) * 0.30;

  // keep the heart of the field bright and legible
  let d = length(c * vec2f(0.82, 1.16));
  v = v * 0.80 + smoothstep(1.30, 0.0, d) * 0.30;

  // radiant bloom that follows the pointer
  let pd = length(c - pt * vec2f(0.45 * aspect, 0.45));
  v = v + smoothstep(0.55, 0.0, pd) * (0.10 + penergy * 0.16);

  // a whisper of animated grain keeps gradients from banding
  v = v + (hash2(uv * 900.0 + vec2f(t * 60.0, 0.0)) - 0.5) * 0.018;

  var col = ramp(clamp(v, 0.0, 1.0));

  // very soft framed vignette — warm, never dark. Edges stay luminous.
  let vig = smoothstep(1.55, 0.35, length(c));
  col = col * mix(0.92, 1.02, vig);

  return vec4f(col, 1.0);
}
