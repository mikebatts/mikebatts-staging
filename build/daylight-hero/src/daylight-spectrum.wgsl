// Daylight spectrum — the living energy field for the case-study hero.
// Warm, layered orange and yellow wave bands with organic grain and deep
// brown/orange troughs. Evokes Daylight's animated brand gradient: energy in
// motion, coming to rest. No logo or text is ever composited here.
//
// Leaf shader (no imports) so the Vite loader emits it directly. Validated with
// `npx vgpu check --require-validation`. uv is top-origin (0,0 = top-left).

struct U {
  // x: time (s)   y: scroll 0..1   z: aspect (w/h)   w: unused
  params  : vec4f,
  // x: pointer x (-1..1)   y: pointer y (-1..1)   z,w: unused
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

// warm palette ramp: deep brown trough -> orange -> yellow -> warm highlight
fn ramp(x: f32) -> vec3f {
  let t = clamp(x, 0.0, 1.0);
  let c0 = vec3f(0.121, 0.055, 0.012);  // deep brown trough
  let c1 = vec3f(0.400, 0.140, 0.010);  // dark orange
  let c2 = vec3f(0.780, 0.300, 0.000);  // burnt orange
  let c3 = vec3f(0.965, 0.435, 0.000);  // Daylight orange #F66F00
  let c4 = vec3f(1.000, 0.600, 0.160);  // bright orange #FF8A2B+
  let c5 = vec3f(0.988, 0.820, 0.290);  // yellow #FCCC3C
  let c6 = vec3f(1.000, 0.945, 0.760);  // warm highlight
  var col = mix(c0, c1, smoothstep(0.00, 0.18, t));
  col = mix(col, c2, smoothstep(0.16, 0.36, t));
  col = mix(col, c3, smoothstep(0.34, 0.55, t));
  col = mix(col, c4, smoothstep(0.53, 0.72, t));
  col = mix(col, c5, smoothstep(0.70, 0.88, t));
  col = mix(col, c6, smoothstep(0.88, 1.00, t));
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

  // gentle domain warp so the bands feel organic, not mechanical
  let warp  = fbm(c * 1.6 + vec2f(t * 0.030, t * 0.018));
  let warp2 = fbm(c * 2.3 - vec2f(t * 0.024, 0.0));
  var p = c + vec2f(warp - 0.5, warp2 - 0.5) * 0.38;

  // pointer nudges the flow slightly toward the cursor
  let pt = u.pointer.xy;
  p = p + pt * 0.04;

  // diagonal band axis
  let ang = -0.34;
  let axis = p.x * sin(ang) + p.y * cos(ang);

  // three layered wave bands at different scales/speeds
  var band = sin(axis * 5.5 + t * 0.32 + warp * 2.2);
  band = band + 0.62 * sin(axis * 10.5 - t * 0.21 + warp2 * 3.0);
  band = band + 0.34 * sin(axis * 18.0 + t * 0.46);
  band = band / 1.96;
  var v = band * 0.5 + 0.5;

  // warm luminous interference toward the middle
  let d = length(c * vec2f(0.85, 1.25));
  let glow = smoothstep(1.15, 0.0, d);
  v = v * 0.80 + glow * 0.30;

  // organic detail + a touch of animated grain
  v = v + (fbm(c * 3.0 + vec2f(t * 0.05, 0.0)) - 0.5) * 0.13;
  v = v + (hash2(uv * 900.0 + vec2f(t * 60.0, 0.0)) - 0.5) * 0.03;

  // soft highlight following the pointer
  let pd = length(c - pt * vec2f(0.45 * aspect, 0.45));
  v = v + smoothstep(0.55, 0.0, pd) * 0.10;

  // as the reader scrolls past, the field settles into deeper, calmer troughs
  v = mix(v, v * 0.82 - 0.04, scroll * 0.55);

  var col = ramp(clamp(v, 0.0, 1.0));

  // framed vignette keeps edges warm and legible
  let vig = smoothstep(1.35, 0.25, length(c));
  col = col * mix(0.72, 1.0, vig);

  return vec4f(col, 1.0);
}
