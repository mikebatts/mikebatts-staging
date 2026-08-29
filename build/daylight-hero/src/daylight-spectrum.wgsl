// Daylight spectrum — the living energy field for the case-study hero.
// A clean, luminous field of warm orange/yellow/cream energy in slow motion,
// disturbed gently by the pointer and settling as the reader scrolls. Inspired
// by simple-gradient and interactive-fluid: soft flowing bands, generous cream
// highlights, no muddy brown floor, no neon. No logo or text is ever composited
// here.
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

@fragment
fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let t = u.params.x;
  let scroll = clamp(u.params.y, 0.0, 1.0);
  let aspect = max(u.params.z, 0.0001);

  // centered, aspect-corrected coords
  var c = uv - vec2f(0.5, 0.5);
  c.x = c.x * aspect;

  // gentle domain warp so the bands feel organic and fluid, not mechanical
  let warp  = fbm(c * 1.5 + vec2f(t * 0.028, t * 0.016));
  let warp2 = fbm(c * 2.1 - vec2f(t * 0.021, 0.0));
  var p = c + vec2f(warp - 0.5, warp2 - 0.5) * 0.42;

  // pointer draws the flow softly toward the cursor (fluid-like disturbance)
  let pt = u.pointer.xy;
  let penergy = clamp(u.pointer.z, 0.0, 1.0);
  p = p + pt * (0.045 + penergy * 0.05);

  // diagonal band axis
  let ang = -0.34;
  let axis = p.x * sin(ang) + p.y * cos(ang);

  // three layered wave bands at different scales/speeds
  var band = sin(axis * 5.0 + t * 0.30 + warp * 2.1);
  band = band + 0.60 * sin(axis * 9.5 - t * 0.20 + warp2 * 2.8);
  band = band + 0.32 * sin(axis * 16.5 + t * 0.44);
  band = band / 1.92;
  var v = band * 0.5 + 0.5;

  // warm luminous interference toward the middle keeps the center bright
  let d = length(c * vec2f(0.82, 1.22));
  let glow = smoothstep(1.25, 0.0, d);
  v = v * 0.74 + glow * 0.36;

  // a soft radiant bloom that follows the pointer
  let pd = length(c - pt * vec2f(0.45 * aspect, 0.45));
  v = v + smoothstep(0.55, 0.0, pd) * (0.10 + penergy * 0.14);

  // organic detail; only a whisper of animated grain (keeps it clean)
  v = v + (fbm(c * 2.7 + vec2f(t * 0.045, 0.0)) - 0.5) * 0.10;
  v = v + (hash2(uv * 900.0 + vec2f(t * 60.0, 0.0)) - 0.5) * 0.018;

  // as the reader scrolls past, the field settles: slightly calmer, still warm.
  // Gentle lift (not darken) so it never turns muddy.
  v = mix(v, v * 0.90 + 0.05, scroll * 0.5);

  var col = ramp(clamp(v, 0.0, 1.0));

  // very soft framed vignette — warm, never dark. Edges stay luminous.
  let vig = smoothstep(1.5, 0.35, length(c));
  col = col * mix(0.9, 1.02, vig);

  return vec4f(col, 1.0);
}
