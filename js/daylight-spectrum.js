let at = class extends Error {
  code;
  severity;
  fix;
  where;
  cause;
  detail;
  constructor(t) {
    super(t.message, { cause: t.cause }), this.name = "VGPUError", this.code = t.code, this.severity = t.severity ?? "error", this.fix = t.fix, this.where = t.where, this.cause = t.cause, this.detail = t.detail;
  }
};
class M extends at {
  constructor(t) {
    super({ ...t, severity: "error" }), this.name = "ValidationError";
  }
}
function Ur(e) {
  return new at({
    code: "VGPU-FEATURE-UNSUPPORTED",
    message: `Adapter does not support requested feature(s): ${e.map((t) => `"${t}"`).join(", ")}.`,
    fix: "Remove the unsupported name(s) from init({ requiredFeatures: [...] }) or run on an adapter that supports them; gate optional code paths on device.features after init.",
    where: "init"
  });
}
function Ar(e, t) {
  if (!e)
    return;
  const n = (t ?? []).filter((r) => !e.has(r));
  if (n.length)
    throw Ur(n);
}
const Rr = {
  map_read: 1,
  map_write: 2,
  copy_src: 4,
  copy_dst: 8,
  index: 16,
  vertex: 32,
  uniform: 64,
  storage: 128,
  indirect: 256,
  query_resolve: 512
};
function Ee(e) {
  const t = globalThis.GPUBufferUsage;
  return e.reduce((n, r) => n | Dr(r, t), 0);
}
function Dr(e, t) {
  const n = e.toUpperCase();
  return t?.[n] ?? Rr[e];
}
function kt() {
  return globalThis.GPUMapMode?.READ ?? 1;
}
const Mr = {
  copy_src: 1,
  copy_dst: 2,
  texture_binding: 4,
  storage_binding: 8,
  render_attachment: 16
};
function Vr(e) {
  const t = globalThis.GPUTextureUsage;
  return e.reduce((n, r) => n | Nr(r, t), 0);
}
function Nr(e, t) {
  const n = e.toUpperCase();
  return t?.[n] ?? Mr[e];
}
function Fn(e) {
  return "__vgpuMockBytes" in e;
}
function It(e) {
  return "__vgpuMockBytes" in e;
}
let Or = 1;
function ct(e) {
  return Object.freeze({ kind: e, id: Or++ });
}
class ut {
  callbacks = /* @__PURE__ */ new Set();
  destroyed = !1;
  onDestroy(t, n) {
    return this.destroyed ? (n(t), () => {
    }) : (this.callbacks.add(n), () => {
      this.callbacks.delete(n);
    });
  }
  emit(t) {
    if (this.destroyed)
      return !1;
    this.destroyed = !0;
    const n = [...this.callbacks];
    this.callbacks.clear();
    for (const r of n)
      r(t);
    return !0;
  }
}
class q {
  device;
  gpu;
  options;
  ownership;
  destroySignal = new ut();
  identity = ct("buffer");
  destroyed = !1;
  constructor(t, n, r, i = "owned") {
    this.device = t, this.gpu = n, this.options = r, this.ownership = i, Object.defineProperty(this, "assertUsable", { value: (s) => this.#e(s) });
  }
  get resourceIdentity() {
    return this.identity;
  }
  onDestroy(t) {
    return this.destroySignal.onDestroy(this, t);
  }
  #e(t = "Buffer") {
    if (this.destroyed)
      throw new M({
        code: "VGPU-BUFFER-DISPOSED",
        message: "Buffer is destroyed.",
        where: t,
        fix: "Wrap or create a live GPUBuffer before using it."
      });
    this.device.assertUsable(t);
  }
  write(t, n = 0) {
    this.#e("Buffer.write"), this.ownership === "external" && this.validateExternalOperation("write", n, t.byteLength, "copy_dst");
    try {
      this.device.queue.writeBuffer(this.gpu, n, t);
    } catch (r) {
      throw this.ownership !== "external" ? r : Ie("Buffer.write", "The external GPUBuffer rejected the write operation.", r);
    }
  }
  async read(t, n = 0) {
    this.#e("Buffer.read"), this.ownership === "external" && this.validateExternalOperation("read", n, t, "copy_src");
    try {
      const r = await this.device.readback.read(this.gpu, t, n);
      return this.#e("Buffer.read"), r;
    } catch (r) {
      throw r instanceof M || this.ownership !== "external" ? r : Ie("Buffer.read", "The external GPUBuffer rejected the read operation.", r);
    }
  }
  destroy() {
    this.destroyed || (this.destroyed = !0, this.destroySignal.emit(this), this.ownership === "owned" && !Fn(this.gpu) && this.gpu.destroy());
  }
  dispose() {
    this.destroy();
  }
  validateExternalOperation(t, n, r, i) {
    if (!(Number.isSafeInteger(n) && n >= 0 && n % 4 === 0 && Number.isSafeInteger(r) && r >= 0 && r % 4 === 0 && n <= this.options.size && r <= this.options.size - n))
      throw Ie(`Buffer.${t}`, "External buffer offsets and lengths must be non-negative, 4-byte aligned, and within the buffer size.");
    if (!(this.gpu.usage & Ee([i])))
      throw Ie(`Buffer.${t}`, `External buffer is missing ${i.toUpperCase()} usage.`);
  }
}
function Ie(e, t, n) {
  return new M({
    code: "VGPU-EXTERNAL-BUFFER-VALIDATION",
    message: t,
    where: e,
    cause: n,
    fix: "Use a buffer with the required usage flags and an aligned in-range operation."
  });
}
function _r(e) {
  if (Wr(e))
    throw jr();
  const t = { version: 1, mappings: [] }, n = {
    version: 1,
    modules: [{ path: "<runtime>", text: e }],
    diagnostics: [],
    sourceMap: t,
    cacheKey: Br(e)
  };
  return {
    kind: "wgsl",
    wgsl: e,
    source: { text: e, path: "<runtime>", imports: [] },
    ast: n,
    sourceMap: t,
    diagnostics: [],
    cacheKey: n.cacheKey,
    entryPoints: zr(e),
    stats: { lines: e.split(/\r?\n/).length, bytes: new TextEncoder().encode(e).byteLength, bindGroups: 0 }
  };
}
function Br(e) {
  let t = 2166136261;
  for (let n = 0; n < e.length; n++)
    t = Math.imul(t ^ e.charCodeAt(n), 16777619);
  return { default: `vgpu-wgsl-1:${(t >>> 0).toString(16).padStart(8, "0")}` };
}
function zr(e) {
  const t = [], n = /@(vertex|fragment|compute)\s+fn\s+([A-Za-z_][A-Za-z0-9_]*)/g;
  for (const r of e.matchAll(n))
    t.push(r[2]);
  return t;
}
function Wr(e) {
  const t = e.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "").trimStart();
  return t.startsWith("import ") || t.startsWith("import{");
}
function jr() {
  const e = new Error("Runtime WGSL strings cannot contain import statements. Use a build-time loader or @vgpu/wgsl/runtime.");
  return e.name = "VGPUWGSLRuntimeImportError", e.code = "VGPU-WGSL-RUNTIME-IMPORT", e.severity = "error", e.source = "wgsl", e;
}
const Tt = Ee(["copy_dst", "map_read"]);
class Kr {
  device;
  constructor(t) {
    this.device = t;
  }
  async read(t, n, r) {
    if (Fn(t))
      return t.__vgpuMockBytes.slice(r, r + n).buffer;
    const i = this.device.createBuffer({
      size: n,
      usage: Tt
    });
    try {
      const s = this.device.createCommandEncoder();
      s.copyBufferToBuffer(t, r, i, 0, n), this.device.queue.submit([s.finish()]), await i.mapAsync(kt());
      const o = i.getMappedRange().slice(0);
      return Pt(i), o;
    } finally {
      Ft(i);
    }
  }
  async readTexture(t, n, r) {
    const [i, s] = n, o = Me(r, "Readback.readTexture"), a = o.bytesPerPixel, c = qr(i * a, 256), u = c * s, d = this.device.createBuffer({ size: u, usage: Tt });
    let f;
    try {
      const h = this.device.createCommandEncoder();
      h.copyTextureToBuffer({ texture: t }, { buffer: d, bytesPerRow: c, rowsPerImage: s }, { width: i, height: s }), this.device.queue.submit([h.finish()]), await d.mapAsync(kt());
      const g = new Uint8Array(d.getMappedRange());
      f = new Uint8Array(i * s * a);
      for (let w = 0; w < s; w++) {
        const b = w * c, I = w * i * a;
        f.set(g.subarray(b, b + i * a), I);
      }
      Pt(d);
    } finally {
      Ft(d);
    }
    return o.swizzle === "bgra-to-rgba" && Cn(f), f;
  }
  destroy() {
  }
}
function Pt(e) {
  try {
    e.unmap();
  } catch {
  }
}
function Ft(e) {
  try {
    e.destroy();
  } catch {
  }
}
function qr(e, t) {
  return Math.ceil(e / t) * t;
}
const Ct = {
  r8unorm: { bytesPerPixel: 1, components: 1, componentType: "unorm8" },
  rg8unorm: { bytesPerPixel: 2, components: 2, componentType: "unorm8" },
  rgba8unorm: { bytesPerPixel: 4, components: 4, componentType: "unorm8" },
  "rgba8unorm-srgb": { bytesPerPixel: 4, components: 4, componentType: "unorm8" },
  bgra8unorm: { bytesPerPixel: 4, components: 4, componentType: "unorm8", swizzle: "bgra-to-rgba" },
  "bgra8unorm-srgb": { bytesPerPixel: 4, components: 4, componentType: "unorm8", swizzle: "bgra-to-rgba" },
  r16float: { bytesPerPixel: 2, components: 1, componentType: "float16" },
  rg16float: { bytesPerPixel: 4, components: 2, componentType: "float16" },
  rgba16float: { bytesPerPixel: 8, components: 4, componentType: "float16" },
  r32float: { bytesPerPixel: 4, components: 1, componentType: "float32" },
  rg32float: { bytesPerPixel: 8, components: 2, componentType: "float32" },
  rgba32float: { bytesPerPixel: 16, components: 4, componentType: "float32" }
};
function Me(e, t) {
  const n = Ct[e];
  if (n)
    return n;
  throw new M({
    code: "VGPU-CORE-UNSUPPORTED-FORMAT",
    message: `Texture.read does not support format ${e}. Supported formats: ${Object.keys(Ct).join(", ")}.`,
    where: t
  });
}
function Hr(e, t, n = "Texture.readFloats") {
  const r = Me(t, n), i = r.bytesPerPixel / r.components, s = Math.floor(e.byteLength / i), o = new Float32Array(s), a = new DataView(e.buffer, e.byteOffset, e.byteLength);
  for (let c = 0; c < s; c++)
    r.componentType === "unorm8" ? o[c] = a.getUint8(c) / 255 : r.componentType === "float16" ? o[c] = Xr(a.getUint16(c * 2, !0)) : o[c] = a.getFloat32(c * 4, !0);
  return o;
}
function Xr(e) {
  const t = e & 32768 ? -1 : 1, n = e >> 10 & 31, r = e & 1023;
  return n === 0 ? t * r * 2 ** -24 : n === 31 ? r === 0 ? t * Number.POSITIVE_INFINITY : Number.NaN : t * (r + 1024) * 2 ** (n - 25);
}
function Yr(e, t, n) {
  const r = e.slice(0, t[0] * t[1] * n.bytesPerPixel);
  return n.swizzle === "bgra-to-rgba" && Cn(r), r;
}
function Cn(e) {
  for (let t = 0; t < e.length; t += 4) {
    const n = e[t];
    e[t] = e[t + 2], e[t + 2] = n;
  }
}
function Zr(e) {
  return { size: e, usage: Ee(["copy_src", "copy_dst"]) };
}
class Jr {
  gpu;
  guard;
  constructor(t, n = () => {
  }) {
    this.gpu = t, this.guard = n;
  }
  writeBuffer(t, n, r) {
    this.guard("Queue.writeBuffer"), this.gpu.writeBuffer(t, n, r);
  }
  async flush() {
    this.guard("Queue.flush"), await this.gpu.onSubmittedWorkDone?.(), this.guard("Queue.flush");
  }
}
class Qr {
  gpu;
  resolved;
  constructor(t, n) {
    this.gpu = t, this.resolved = n;
  }
  dispose() {
  }
  get kind() {
    return this.resolved.kind;
  }
  get source() {
    return this.resolved.source;
  }
  get code() {
    return this.resolved.wgsl;
  }
  get entryPoints() {
    return this.resolved.entryPoints;
  }
  get stats() {
    return this.resolved.stats;
  }
}
const ei = Symbol.for("vgpu/Texture"), ti = Symbol.for("vgpu/Texture/resizeLock");
class ue {
  device;
  ownership;
  [ei] = !0;
  destroySignal = new ut();
  identity = ct("texture");
  currentGpu;
  currentOptions;
  defaultView = null;
  resizeLock;
  destroyed = !1;
  constructor(t, n, r, i = "owned") {
    this.device = t, this.ownership = i, this.currentGpu = n, this.currentOptions = r, Object.defineProperty(this, ti, {
      value: (s) => {
        this.resizeLock = s;
      }
    });
  }
  get gpu() {
    return this.currentGpu;
  }
  get options() {
    return this.currentOptions;
  }
  get size() {
    return this.options.size;
  }
  get format() {
    return this.options.format;
  }
  get usage() {
    return this.options.usage;
  }
  get mipLevelCount() {
    return this.options.mipLevelCount ?? 1;
  }
  get sampleCount() {
    return this.options.sampleCount ?? 1;
  }
  get dimension() {
    return this.options.dimension ?? "2d";
  }
  get viewFormats() {
    return this.options.viewFormats ?? [];
  }
  get label() {
    return this.options.label;
  }
  get resourceIdentity() {
    return this.identity;
  }
  onDestroy(t) {
    return this.destroySignal.onDestroy(this, t);
  }
  get view() {
    return this.assertAlive(), this.defaultView ??= this.createView(), this.defaultView;
  }
  createView(t) {
    return this.assertAlive("Texture.createView"), this.gpu.createView(t);
  }
  resize(t) {
    if (this.assertAlive(), this.ownership === "external")
      throw new M({
        code: "VGPU-CORE-EXTERNAL-TEXTURE",
        message: "Texture wraps an externally owned GPUTexture and cannot be resized.",
        where: "Texture.resize"
      });
    if (this.resizeLock)
      throw new M({
        code: "VGPU-CORE-TEXTURE-RESIZE-LOCKED",
        message: this.resizeLock,
        where: "Texture.resize"
      });
    const n = this.options.size[2] ?? 1, r = t[2] ?? n;
    if (this.options.size[0] === t[0] && this.options.size[1] === t[1] && n === r)
      return !1;
    const i = t[2] === void 0 && this.options.size[2] === void 0 ? [t[0], t[1]] : [t[0], t[1], r], s = { ...this.options, size: i }, o = this.gpu;
    return this.currentGpu = this.device.gpu.createTexture(Ln(s)), this.currentOptions = s, this.defaultView = null, o.destroy(), !0;
  }
  /**
   * Raw, unpadded texel bytes in this texture's own format (row stride padding removed).
   * `byteLength` is `width * height * bytesPerPixel(format)`; `bgra*` bytes are swizzled to RGBA order.
   * Use `readFloats()` for float formats to get decoded component values.
   */
  async read() {
    this.assertAlive("Texture.read");
    const t = Me(this.options.format, "Texture.read");
    if (It(this.gpu))
      return Yr(this.gpu.__vgpuMockBytes, this.options.size, t);
    const n = await this.device.readback.readTexture(this.gpu, this.options.size, this.options.format);
    return this.assertAlive("Texture.read"), n;
  }
  /**
   * Texel components decoded to f32, row-major, `width * height * components(format)` long.
   * `float16`/`float32` formats keep their HDR values (no clamping); `unorm8` formats are
   * normalized to `[0, 1]` without srgb gamma conversion.
   */
  async readFloats() {
    return Me(this.options.format, "Texture.readFloats"), Hr(await this.read(), this.options.format);
  }
  destroy() {
    this.destroyed || (this.destroyed = !0, this.defaultView = null, this.destroySignal.emit(this), this.ownership !== "external" && (It(this.gpu) || this.gpu.destroy()));
  }
  dispose() {
    this.destroy();
  }
  assertAlive(t = "Texture") {
    if (this.destroyed)
      throw new M({ code: "VGPU-CORE-TEXTURE-DESTROYED", message: "Texture is destroyed", where: t });
    this.device.assertUsable?.(t);
  }
}
function Ln(e) {
  const t = {
    label: e.label,
    size: { width: e.size[0], height: e.size[1], depthOrArrayLayers: e.size[2] ?? 1 },
    format: e.format,
    usage: Vr(e.usage)
  };
  return e.mipLevelCount !== void 0 && (t.mipLevelCount = e.mipLevelCount), e.sampleCount !== void 0 && (t.sampleCount = e.sampleCount), e.dimension !== void 0 && (t.dimension = e.dimension), e.viewFormats !== void 0 && (t.viewFormats = [...e.viewFormats]), t;
}
class ni {
  gpu;
  adapterInfo;
  queue;
  /** @internal — use Buffer.read() and Texture.read() instead */
  readback;
  isCompatibilityMode;
  scopes = [];
  ownership;
  state = "alive";
  lossInfo;
  observeLoss = !0;
  constructor(t, n = null, r = "owned", i = {}) {
    this.gpu = t, this.adapterInfo = n, Object.defineProperty(this, "assertUsable", { value: (a) => this.#e(a) }), this.ownership = typeof r == "string" ? r : "owned";
    const s = typeof r == "string" ? i : r;
    this.isCompatibilityMode = s.isCompatibilityMode ?? !1, this.queue = new Jr(t.queue, (a) => this.#e(a)), this.readback = new Kr(t);
    const o = t.lost;
    o && typeof o.then == "function" && Promise.resolve(o).then((a) => {
      !this.observeLoss || this.state !== "alive" || (this.lossInfo = a, this.state = "lost");
    }, () => {
    });
  }
  get limits() {
    return this.#e("Device.limits"), this.gpu.limits;
  }
  get features() {
    return this.#e("Device.features"), this.gpu.features;
  }
  createShader(t) {
    this.#e("Device.createShader");
    const n = typeof t == "string" ? _r(t) : t;
    return new Qr(this.gpu.createShaderModule({ code: n.wgsl }), n);
  }
  createTexture(t) {
    return this.#e("Device.createTexture"), new ue(this, this.gpu.createTexture(Ln(t)), t);
  }
  createBuffer(t) {
    this.#e("Device.createBuffer");
    const n = ri(t);
    n && this.captureError(n);
    const r = n ? Zr(Math.max(4, t.size || 4)) : ii(t);
    return new q(this, this.gpu.createBuffer(r), t);
  }
  /** Wraps a caller-owned GPUBuffer without taking ownership of its native lifetime. */
  wrapBuffer(t) {
    if (this.#e("Device.wrapBuffer"), !oi(t))
      throw new M({
        code: "VGPU-EXTERNAL-BUFFER-INVALID",
        message: "Device.wrapBuffer requires a GPUBuffer with finite size and usage properties.",
        where: "Device.wrapBuffer",
        fix: "Pass a live GPUBuffer created for this GPUDevice."
      });
    const n = {
      size: t.size,
      usage: ci(t.usage),
      ...t.label ? { label: t.label } : {}
    };
    return new q(this, t, n, "external");
  }
  pushErrorScope(t) {
    this.#e("Device.pushErrorScope"), this.scopes.push([]), this.gpu.pushErrorScope?.(t);
  }
  async popErrorScope() {
    this.#e("Device.popErrorScope");
    const t = this.scopes.pop(), n = await this.gpu.popErrorScope?.();
    return this.#e("Device.popErrorScope"), t?.[0] ?? si(n) ?? null;
  }
  #e(t) {
    if (this.state === "alive")
      return;
    if (this.state === "disposed")
      throw new M({
        code: "VGPU-DEVICE-DISPOSED",
        message: "The GPU device wrapper has been disposed.",
        where: t,
        fix: "Create a new Gpu instance before performing more work."
      });
    const n = this.lossInfo?.reason, r = this.lossInfo?.message;
    throw new M({
      code: "VGPU-DEVICE-LOST",
      message: `The GPU device was lost${n ? ` (${n})` : ""}${r ? `: ${r}` : "."}`,
      where: t,
      cause: this.lossInfo
    });
  }
  destroy() {
    if (this.state === "disposed")
      return;
    const t = this.state === "lost";
    this.state = "disposed", this.observeLoss = !1, this.scopes.length = 0, this.readback.destroy(), this.ownership === "owned" && !t && this.gpu.destroy();
  }
  dispose() {
    this.destroy();
  }
  captureError(t) {
    const n = this.scopes.at(-1);
    if (n)
      n.push(t);
    else
      throw t;
  }
}
function ri(e) {
  return !Number.isFinite(e.size) || e.size <= 0 ? Lt("Buffer size must be greater than zero.") : e.usage.length === 0 ? Lt("Buffer usage must not be empty.") : null;
}
function Lt(e) {
  return new M({ code: "VGPU-CORE-INVALID-USAGE", message: e, where: "Device.createBuffer" });
}
function ii(e) {
  return { label: e.label, size: e.size, usage: Ee(e.usage) };
}
function si(e) {
  return e ? new M({ code: "VGPU-CORE-VALIDATION", message: e.message, where: "GPUDevice.popErrorScope", cause: e }) : null;
}
function oi(e) {
  if (typeof e != "object" && typeof e != "function" || e === null)
    return !1;
  const t = e;
  return Number.isSafeInteger(t.size) && (t.size ?? -1) >= 0 && Number.isSafeInteger(t.usage) && (t.usage ?? -1) >= 0 && typeof t.destroy == "function";
}
const ai = ["map_read", "map_write", "copy_src", "copy_dst", "index", "vertex", "uniform", "storage", "indirect", "query_resolve"];
function ci(e) {
  return ai.filter((t) => (e & Ee([t])) !== 0);
}
const Gn = /* @__PURE__ */ new WeakMap(), ui = /* @__PURE__ */ new WeakMap();
function di(e, t) {
  return Gn.set(e, fi(t)), e;
}
function ye(e) {
  return Gn.get(e);
}
function Un(e) {
  return ui.get(e);
}
function fi(e) {
  return { entries: e.entries.map((t) => ({ ...t })) };
}
let m = class extends at {
};
function li(e, t, n, r, i, s) {
  const o = t === "vertex" ? "Vertex" : "Fragment", a = t === "vertex" ? "VERTEX" : "FRAGMENT", c = `maxStorageBuffersIn${o}Stage`;
  return new m({
    code: `VGPU-LIMIT-STORAGE-${a}`,
    message: `${o} entry '${n}' in '${e}' uses ${r} storage buffer(s), but device limit ${c} is ${i}.`,
    fix: t === "vertex" ? `Request init({ requiredLimits: { ${c}: ${r} } }) if the adapter supports it, or move vertex data to geometry(gpu, ...) vertex streams.` : `Request init({ requiredLimits: { ${c}: ${r} } }) if the adapter supports it, or reduce fragment storage buffers.`,
    where: `${e}.pipelineLayout`,
    detail: { stage: t, entryPoint: n, count: r, limit: i, bindings: s.map(({ name: u, group: d, binding: f }) => ({ name: u, group: d, binding: f })) }
  });
}
function hi(e, t, n, r, i) {
  return new m({
    code: "VGPU-SET-TEXTURE-FILTERABILITY",
    message: `${r} (${n}) cannot satisfy filtering texture '${t.name}' @group(${t.group}) @binding(${t.binding}).`,
    fix: "Use a filterable format; request float32-filterable for rgba32float when supported; or use textureLoad without a sampler.",
    where: `${e}.set`,
    detail: { format: n, group: t.group, binding: t.binding, bindingName: t.name, resourceName: r, samplerName: i?.name, samplerGroup: i?.group, samplerBinding: i?.binding }
  });
}
function pi(e, t) {
  const n = Oi(e, t);
  return new m({
    code: "VGPU-R1-BINDING-NEVER-SET",
    message: `Unset \`${t.name}\` @group(${t.group}) @binding(${t.binding}) in '${e}'. Fix: ${n}; or ${e}.group(${t.group}, bindGroup).`,
    where: `${e}.draw`
  });
}
function An(e, t) {
  const n = t === "lib" ? "lib-owned by its first JS set()" : "user-owned by its first resource set()", r = t === "lib" ? `Fix: pass a resource from the start: wave.set({ ${e}: new Uniform(gpu.device, { size: 4 }) }).` : `Fix: pass JS values from the first set(): wave.set({ ${e}: jsValue }).`;
  return new m({
    code: "VGPU-R1-OWNERSHIP-FLIP",
    message: `\`${e}\` is ${n}; ownership cannot change. ${r}`,
    where: "set"
  });
}
function mi(e, t) {
  return new m({
    code: "VGPU-R4-GROUP-CLAIMED",
    message: `group ${t} of '${e}' is claimed; set() cannot update it.`,
    fix: `Call set() first, or build from ${e}.layout(${t}); pass dynamic offsets to p.draw().`,
    where: `${e}.set`
  });
}
function gi(e, t, n, r) {
  return new m({
    code: "VGPU-R4-GROUP-INCOMPATIBLE",
    message: `claimed group ${t} in '${e}' is incompatible: ${n}.`,
    fix: `Build from ${e}.layout(${t}, { dynamicOffsets? }) then call ${e}.group(${t}, bindGroup).`,
    where: `${e}.group`,
    cause: r
  });
}
function ce(e, t, n) {
  return new m({
    code: "VGPU-R4-GROUP-VALIDATION",
    message: `WebGPU rejected claimed group ${t} in '${e}'.`,
    fix: `Build from ${e}.layout(${t}); pass offsets via p.draw(draw, { offsets: { ${t}: [...] } }).`,
    where: `${e}.draw`,
    cause: n,
    detail: { drawLabel: e, group: t }
  });
}
function Gt(e, t) {
  return new m({
    code: "VGPU-BLEND-INVALID",
    message: `Invalid blend '${String(t)}' in '${e}'.`,
    fix: 'Use "alpha", "additive", "premultiplied", or { color, alpha? } components.',
    where: "draw"
  });
}
function Ut(e, t) {
  return new m({
    code: "VGPU-BLEND-CONSTANT-INVALID",
    message: `Invalid blendConstant in '${e}': ${t}`,
    fix: 'Use [r, g, b, a] finite numbers with a blend whose color or alpha uses "constant"/"one-minus-constant"; omit it to keep the pass default (0, 0, 0, 0).',
    where: "draw"
  });
}
function At(e, t) {
  return new m({
    code: "VGPU-WRITEMASK-INVALID",
    message: `Invalid writeMask ${t} in '${e}'.`,
    fix: "Use an array of r/g/b/a; omit it for all channels.",
    where: "draw"
  });
}
function Je(e, t, n = "draw") {
  return new m({
    code: "VGPU-COLORS-INVALID",
    message: `Invalid colors in '${e}': ${t}`,
    fix: "Use one { blend?, writeMask? } or null entry per color attachment of the target, aligned by index; omit colors to apply the top-level blend/writeMask to every attachment.",
    where: n
  });
}
function bi(e, t) {
  return new m({
    code: "VGPU-CULL-INVALID",
    message: `Invalid cull '${String(t)}' in '${e}'.`,
    fix: 'Use "none", "front", or "back"; omit it for no culling.',
    where: "draw"
  });
}
function wi(e, t) {
  return new m({
    code: "VGPU-FRONTFACE-INVALID",
    message: `Invalid frontFace '${String(t)}' in '${e}'.`,
    fix: 'Use "ccw" or "cw"; omit it for counter-clockwise.',
    where: "draw"
  });
}
function Rt(e, t) {
  return new m({
    code: "VGPU-UNCLIPPED-DEPTH-INVALID",
    message: `Invalid unclippedDepth in '${e}': ${t}`,
    fix: 'Use a boolean. unclippedDepth: true needs the "depth-clip-control" device feature — request it with init({ requiredFeatures: ["depth-clip-control"] }) on an adapter that supports it. Omit the option to keep depth clipping.',
    where: "draw"
  });
}
function O(e, t) {
  return new m({
    code: "VGPU-DEPTH-INVALID",
    message: `Invalid depth in '${e}': ${t}`,
    fix: 'Use false or { write?, compare?, bias?, biasSlopeScale?, biasClamp? }; omit it for { write: true, compare: "less-equal" }.',
    where: "draw"
  });
}
function oe(e, t, n = "draw") {
  return new m({
    code: "VGPU-STENCIL-INVALID",
    message: `Invalid stencil in '${e}': ${t}`,
    fix: `Use { front?, back?, readMask?, writeMask?, ref? } with GPUCompareFunction/GPUStencilOperation faces and u32 masks, against a target whose depth format has a stencil aspect (depth: "depth24plus-stencil8"); omit it for WebGPU's pass-through defaults.`,
    where: n
  });
}
function Ge(e, t, n = "draw") {
  return new m({
    code: "VGPU-MULTISAMPLE-INVALID",
    message: `Invalid multisample in '${e}': ${t}`,
    fix: "Use { alphaToCoverage?, mask? }: alphaToCoverage needs a target created with msaa: true, and mask must be an integer in [0, 0xFFFFFFFF] (bits above the target's sampleCount are ignored). Omit multisample for full-coverage defaults.",
    where: n
  });
}
function Te(e, t, n = "draw") {
  return new m({
    code: "VGPU-CONSTANTS-INVALID",
    message: `Invalid constants in '${e}': ${t}`,
    fix: "Key WGSL `override` constants by name, or by the decimal string of N when the declaration has @id(N); values are finite numbers or booleans, converted to the override's WGSL type (bool/i32/u32/f32/f16). Every override without a default value must be provided. Omit constants to keep the WGSL defaults.",
    where: n
  });
}
function Ue(e, t, n = "draw") {
  return new m({
    code: "VGPU-ENTRY-INVALID",
    message: `Invalid entry in '${e}': ${t}`,
    fix: "Name an entry point declared in the shader with the matching stage — { vertex?, fragment? } strings for draw, one @compute name string for compute. Omit entry (or a field) to use the first entry point of that stage.",
    where: n
  });
}
function ie(e, t, n) {
  return new m({
    code: "VGPU-INDIRECT-INVALID",
    message: `Invalid indirect in '${e}': ${t}`,
    fix: "Pass a storage buffer created with storage(gpu, bytes, { indirect: true }) — bare, or as { buffer, offset? } with a 4-aligned byte offset — sized so the GPU-read arguments fit: 16 bytes for drawIndirect, 20 for drawIndexedIndirect, 12 for dispatchWorkgroupsIndirect. Omit indirect to use CPU-side counts.",
    where: n
  });
}
function yi() {
  return new m({
    code: "VGPU-PASS-PRESERVE-MSAA",
    message: "clear:false cannot preserve MSAA; use a non-MSAA target.",
    fix: "Use non-MSAA for accumulation.",
    where: "Frame.pass"
  });
}
function Dt(e, t = "expected a number in [0, 1].", n = 'Use 1 (default), or 0 with depth: { compare: "greater" } for reversed-Z.') {
  return new m({
    code: "VGPU-PASS-CLEARDEPTH-INVALID",
    message: `clearDepth received ${String(e)}; ${t}`,
    fix: n,
    where: "Frame.pass"
  });
}
function _(e) {
  return new m({
    code: "VGPU-PASS-VIEWPORT-INVALID",
    message: `Invalid viewport: ${e}`,
    fix: "Use { x?, y?, width, height, minDepth?, maxDepth? } finite numbers within device limits; omit it for the full target.",
    where: "Frame.pass"
  });
}
function qe(e) {
  return new m({
    code: "VGPU-PASS-SCISSOR-INVALID",
    message: `Invalid scissor: ${e}`,
    fix: "Use [x, y, width, height] non-negative integers with x + width and y + height within the target's current pixel size; omit it for the full target.",
    where: "Frame.pass"
  });
}
function xi() {
  return new m({
    code: "VGPU-PASS-PRESERVE-CLEARDEPTH",
    message: "clear:false preserves depth; clearDepth cannot apply.",
    fix: "Remove clearDepth, or let the pass clear.",
    where: "Frame.pass"
  });
}
function Mt(e) {
  return new m({
    code: "VGPU-PASS-CLEARSTENCIL-INVALID",
    message: `clearStencil ${e}`,
    fix: `Use an integer in [0, 0xFFFFFFFF] on a target whose depth format has a stencil aspect, e.g. depth: "depth24plus-stencil8"; the value is masked to the stencil aspect's bit width.`,
    where: "Frame.pass"
  });
}
function Si() {
  return new m({
    code: "VGPU-PASS-PRESERVE-CLEARSTENCIL",
    message: "clear:false preserves stencil; clearStencil cannot apply.",
    fix: "Remove clearStencil, or let the pass clear.",
    where: "Frame.pass"
  });
}
function J(e, t, n = "Frame.pass") {
  return new m({
    code: "VGPU-PASS-DEPTH-READONLY",
    message: `depthReadOnly ${e}`,
    fix: t,
    where: n
  });
}
function vi() {
  return new m({
    code: "VGPU-PASS-DEPTH-READONLY-MSAA",
    message: `depthReadOnly cannot read an MSAA target's depth: multisampled depth is stored with storeOp "discard", so a read-only pass tests against discarded contents.`,
    fix: "Use a non-MSAA target for read-only depth, or drop depthReadOnly and let the pass own its depth.",
    where: "Frame.pass"
  });
}
function Ei(e, t, n = "timer") {
  return new m({
    code: "VGPU-TIMER-INVALID",
    message: `Invalid timer use: ${e}`,
    fix: t,
    where: n
  });
}
function $i(e, t, n = "visibility") {
  return new m({
    code: "VGPU-VIS-INVALID",
    message: `Invalid visibility use: ${e}`,
    fix: t,
    where: n
  });
}
function ki() {
  return new m({
    code: "VGPU-QUERY-NO-VISIBILITY",
    message: "occlusion() needs the pass to be opened with a visibility instance; the render pass has no occlusionQuerySet to write into.",
    fix: "Open the pass with f.pass({ target, visibility: vis }, ...) using the visibility(gpu) instance that created the query handle.",
    where: "FramePass.occlusion"
  });
}
function Ii() {
  return new m({
    code: "VGPU-QUERY-NESTED",
    message: "occlusion() cannot nest inside an active occlusion() body; WebGPU allows one active occlusion query per pass at a time.",
    fix: "Encode each occlusion scope sequentially: p.occlusion(a, ...); p.occlusion(b, ...).",
    where: "FramePass.occlusion"
  });
}
function Qe(e = "Frame.pass") {
  return new m({
    code: "VGPU-TARGET-REQUIRED",
    message: "Target required. Fix: pass surface(gpu, canvas) or target(gpu, { size }) as { target }.",
    where: e
  });
}
function Ti(e, t, n, r) {
  return new m({ code: e, message: `${e}: ${n}`, fix: r, where: t });
}
function dt(e, t) {
  return Ti("VGPU-MESH-RANGE-INVALID", e, t, "Use index ranges for indexed geometries, vertex ranges otherwise, within geometry counts.");
}
function Pi(e) {
  return new m({
    code: "VGPU-PIPELINE-LAYOUT-GAP",
    message: `Pipeline bind group ${e} is missing.`,
    fix: "Use consecutive @group() indices starting at 0.",
    where: "pipeline layout"
  });
}
function me(e, t, n) {
  return new m({
    code: "VGPU-COMPILE-FAILED",
    message: "WebGPU pipeline compilation failed.",
    fix: "Check WGSL, vertex layouts, and target signature.",
    where: e,
    cause: t,
    detail: n ? { signature: n } : void 0
  });
}
function Vt(e) {
  return new m({
    code: "VGPU-COMPILE-DISPOSED",
    message: "GPU disposed during pipeline compilation.",
    where: e
  });
}
function Pe(e, t) {
  return new m({
    code: "VGPU-COMPILE-SIGNATURE-INVALID",
    message: `Invalid TargetSignature: ${t}`,
    fix: "Pass { colors, depth?, sampleCount?:1|4 } or a Target.",
    where: e
  });
}
function Rn(e) {
  return new m({
    code: "VGPU-SURFACE-NOT-IN-FRAME",
    message: "Surface targets are only available inside frame(gpu).",
    fix: "surface passes must run inside frame(gpu, ...); precompile against an offscreen target(gpu, ...) instead",
    where: e
  });
}
function Fi() {
  return new m({
    code: "VGPU-SURFACE-CONTEXT",
    message: "Canvas WebGPU context failed. Fix: check navigator.gpu and remove any existing 2d/webgl context.",
    where: "surface"
  });
}
function Ci(e) {
  return new m({
    code: "VGPU-SURFACE-DUPLICATE",
    message: `Canvas already has surface${e ? ` '${e}'` : ""}. Fix: reuse or dispose it.`,
    where: "surface"
  });
}
function Li(e) {
  return new m({
    code: "VGPU-SURFACE-DISPOSED",
    message: `Surface '${e ?? "surface"}' is disposed. Fix: call surface(gpu, canvas).`,
    where: "surface"
  });
}
function Gi() {
  return new m({
    code: "VGPU-SURFACE-AUTORESIZE-UNSUPPORTED",
    message: "autoResize needs clientWidth. Fix: call surface.resize([w,h]) for OffscreenCanvas; onResize still fires.",
    where: "surface"
  });
}
function Ui(e) {
  return new m({
    code: "VGPU-SURFACE-RESIZE-REENTRANT",
    message: `Cannot resize this surface${e ? ` '${e}'` : ""} in onResize. Fix: resize derived targets only.`,
    where: "surface.resize"
  });
}
function Ai(e) {
  return new m({
    code: "VGPU-CLEAR-COLOR-INVALID",
    message: `Invalid ${e}: expected four finite numbers.`,
    fix: "Assign [r, g, b, a] or a GPUColor object ({ r, g, b, a }).",
    where: e
  });
}
function Ri(e) {
  return new m({
    code: "VGPU-CLOCK-DELTA-INVALID",
    message: `clock.advance() received ${String(e)}; expected a finite, non-negative number of seconds.`,
    fix: "Pass the elapsed seconds, e.g. clock(gpu).advance(1 / 60); use frame(gpu) alone to advance with wall-clock time.",
    where: "clock.advance"
  });
}
function Dn() {
  return new m({
    code: "VGPU-FRAME-REENTRANT",
    message: "Nested frame(gpu) is invalid. Fix: queue work for the next frame.",
    where: "frame"
  });
}
function Nt(e) {
  return new m({
    code: "VGPU-FRAME-CANCELED",
    message: "the frame was canceled; its command encoder was dropped and nothing more can be encoded or submitted on it.",
    fix: "Open a new frame(gpu) for further work; cancel() is the last operation on a frame.",
    where: e
  });
}
function Di(e) {
  return new m({
    code: "VGPU-FRAME-PASS-ACTIVE",
    message: "the frame cannot be canceled while a pass callback is active.",
    fix: "Return from the frame.pass(...) callback first, then call frame.cancel(); this keeps pass descriptor resources alive until the pass is closed.",
    where: e
  });
}
function Mi(e) {
  return new m({
    code: "VGPU-FRAME-SUBMITTED",
    message: "the frame was already submitted; submitted GPU work cannot be canceled.",
    fix: "Call cancel() only on a frame you decided not to submit; the frame you did submit needs no cleanup.",
    where: e
  });
}
function z(e, t, n) {
  return new m({
    code: "VGPU-R1-BINDING-INCOMPATIBLE-RESOURCE",
    message: `binding \`${e.name}\` @group(${e.group}) @binding(${e.binding}) needs ${t}.`,
    fix: n,
    where: "set"
  });
}
function D(e, t, n) {
  return new m({ code: "VGPU-RING1-UNSUPPORTED", message: t, fix: n, where: e });
}
function Fe(e) {
  return Vi(e) && e.version !== 1 ? new m({
    code: "VGPU-SHADER-SOURCE-INVALID",
    message: `VGPU-SHADER-SOURCE-INVALID: unsupported ShaderSource v${String(e.version)}; expected v1. Fix: update vgpu or regenerate it.`,
    where: "shader source"
  }) : new m({
    code: "VGPU-SHADER-SOURCE-INVALID",
    message: `VGPU-SHADER-SOURCE-INVALID: expected WGSL or { version, wgsl }, got ${Ni(e)}. Fix: configure @vgpu/wgsl loader-vite or loader-webpack.`,
    where: "shader source"
  });
}
function Vi(e) {
  return typeof e == "object" && e !== null && "version" in e;
}
function Ni(e) {
  if (typeof e != "object" || e === null)
    return typeof e;
  try {
    const t = JSON.stringify(e);
    return t.length > 80 ? `${t.slice(0, 77)}...` : t;
  } catch {
    return "object";
  }
}
function Oi(e, t) {
  switch (t.kind) {
    case "sampler":
      return `${e}.set({${t.name}:sampler(gpu)})`;
    case "texture":
      return `${e}.set({${t.name}:scene.color})`;
    case "buffer":
      return t.addressSpace === "uniform" ? `${e}.set({${t.name}:{ /* values */ }})` : `${e}.set({${t.name}:buffer})`;
    default:
      return `${e}.set({${t.name}:resource})`;
  }
}
const Ot = ["scheduler", "resource", "service"];
function $e(e) {
  return { name: e };
}
const Mn = /* @__PURE__ */ new WeakMap();
function _i(e) {
  const t = Mn.get(e);
  if (!t)
    throw new m({
      code: "VGPU-GPU-FOREIGN",
      message: "This object was not created by init(); it has no vgpu kernel.",
      fix: "Pass the gpu returned by init() from vgpu, vgpu/node or vgpu/mock.",
      where: "gpu"
    });
  return t;
}
class Bi {
  device;
  #e = /* @__PURE__ */ new Map();
  #t = new Map(Ot.map((t) => [t, /* @__PURE__ */ new Set()]));
  #r = /* @__PURE__ */ new Set();
  #n = /* @__PURE__ */ new Set();
  #s = /* @__PURE__ */ new Set();
  #i = !1;
  constructor(t) {
    this.device = t;
  }
  get disposed() {
    return this.#i;
  }
  service(t, n) {
    const r = this.#e.get(t);
    if (r !== void 0)
      return r;
    const i = n(this);
    return this.#e.set(t, i), i;
  }
  peekService(t) {
    return this.#e.get(t);
  }
  own(t, n) {
    const r = this.#t.get(t);
    return r.add(n), () => {
      r.delete(n);
    };
  }
  addErrorListener(t) {
    return this.#r.add(t), () => {
      this.#r.delete(t);
    };
  }
  reportError(t) {
    if (this.#i)
      return Promise.resolve();
    const n = Promise.resolve().then(() => {
      const r = [...this.#r];
      if (!r.length) {
        console.error(t);
        return;
      }
      for (const i of r)
        try {
          i(t);
        } catch (s) {
          console.error(s);
        }
    });
    return this.trackDelivery(n);
  }
  trackDelivery(t) {
    const n = Promise.resolve(t).then(() => {
    }, (r) => {
      console.error(r);
    });
    return this.#n.add(n), n.finally(() => this.#n.delete(n)), n;
  }
  registerSettledSource(t) {
    return this.#s.add(t), () => {
      this.#s.delete(t);
    };
  }
  async settled() {
    const t = [
      ...this.#n,
      ...[...this.#s].flatMap((n) => n())
    ];
    await Promise.allSettled(t);
  }
  dispose() {
    if (!this.#i) {
      this.#i = !0;
      for (const t of Ot) {
        const n = this.#t.get(t);
        for (const r of [...n])
          r();
        n.clear();
      }
      this.#e.clear(), this.#s.clear(), this.#r.clear(), this.device.dispose();
    }
  }
}
function zi(e) {
  const t = new Bi(e), n = {
    device: e,
    gpu: e.gpu,
    get disposed() {
      return t.disposed;
    },
    onError: (r) => t.addErrorListener(r),
    settled: () => t.settled(),
    dispose: () => {
      t.dispose();
    }
  };
  return Mn.set(n, t), n;
}
async function Wi(e, t = {}, n) {
  return zi(await ji(e, t, n));
}
async function ji(e, t, n) {
  return t.adapter || n ? (t.adapter ?? n()).requestDevice(t) : Ki(t);
}
async function Ki(e) {
  const n = await globalThis.navigator.gpu?.requestAdapter({ powerPreference: e.powerPreference });
  if (!n)
    throw D("init", "navigator.gpu.requestAdapter() returned null.");
  Ar(n.features, e.requiredFeatures);
  const r = await n.requestDevice({ requiredFeatures: e.requiredFeatures, requiredLimits: e.requiredLimits });
  return new ni(r, n.info ?? null);
}
function C(e, t) {
  e.assertUsable(t);
}
function _t(e, t) {
  e.assertUsable(t);
}
const Vn = Symbol("vgpu.bindingResource");
function qi(e) {
  return typeof (typeof e == "object" && e !== null ? e[Vn] : void 0) == "function" ? e : void 0;
}
const et = Symbol("vgpu.geometry.layoutResolver");
function We(e, t) {
  const n = _i(e);
  if (n.disposed)
    throw Nn(t);
  return n;
}
function Nn(e) {
  return new m({
    code: "VGPU-GPU-DISPOSED",
    message: `${e}() ran after gpu.dispose(); the device and everything it owned are gone.`,
    fix: "Create resources before disposing the gpu, or init() a new one.",
    where: e
  });
}
class On extends Error {
  code;
  line;
  column;
  severity;
  metadata;
  relatedDiagnostics;
  /** Actionable remediation text. Forwarded verbatim from the underlying error when there is one. */
  fix;
  /** Coarse origin of the failure (e.g. `"resolveShader"`), mirroring `@vgpu/core`'s `VGPUError`. */
  where;
  cause;
  constructor(t, n, r = 1, i = 1, s = "error") {
    super(n), this.name = "VGPUError", this.code = t, this.line = r, this.column = i, this.severity = s;
  }
}
function Hi(e, t, n = {}) {
  const r = new On(e, t, n.line ?? 1, n.column ?? 1, n.severity ?? "error");
  return n.fix !== void 0 && (r.fix = n.fix), n.where !== void 0 && (r.where = n.where), n.cause !== void 0 && (r.cause = n.cause), n.metadata !== void 0 && (r.metadata = n.metadata), r;
}
function T(e, t, n = 1, r = 1) {
  return new On(e, t, n, r);
}
const Xi = /* @__PURE__ */ new Set(["fn", "struct", "const", "alias", "var", "override"]);
function Yi(e) {
  const t = [], n = [], r = [];
  let i = 0, s = !1, o = 0;
  for (; i < e.length; ) {
    const a = e[i];
    if (a.text === "{") {
      o++, i++;
      continue;
    }
    if (a.text === "}") {
      o = Math.max(0, o - 1), i++;
      continue;
    }
    if (_n(a)) {
      i++;
      continue;
    }
    if (o > 0) {
      i++;
      continue;
    }
    if (a.text === "import") {
      if (s)
        throw T("VGPU-WGSL-IMP-ORDER", "Imports must precede declarations", a.line, a.column);
      const [f, h] = Zi(e, i);
      t.push(f), i = h;
      continue;
    }
    if (a.text === "export" && e[i + 1]?.text === "{")
      throw T("VGPU-WGSL-EXP-REEXPORT-CYCLE", "Re-export cycles are not supported", a.line, a.column);
    if (a.text === "@" && e[i + 2]?.text === "export" && e[i + 3]?.text === "@")
      throw T("VGPU-WGSL-EXP-NOTDECL", "Repeated export attributes", a.line, a.column);
    const c = a.text === "export" || a.text === "@" && e[i + 2]?.text === "export", u = c ? Ji(e, a.text === "export" ? i + 1 : i + 3) : i, d = e[u];
    if (d && Xi.has(d.text)) {
      const f = Qi(e, u);
      n.push({ name: f, localName: f, kind: d.text }), c && r.push({ name: f, localName: f, kind: d.text }), s = !0;
    }
    i++;
  }
  return { imports: t, exports: r, locals: n };
}
function Zi(e, t) {
  let n = t + 1;
  const r = [];
  if (e[n]?.text === "{") {
    for (n++; e[n] && e[n].text !== "}"; ) {
      if (_n(e[n])) {
        n++;
        continue;
      }
      const o = Xe(e[n]);
      let a = o;
      n++, e[n]?.text === "as" && (a = Xe(e[n + 1]), n += 2), r.push({ imported: o, local: a }), e[n]?.text === "," && n++;
    }
    n++, He(e[n], "from"), n++;
  } else if (e[n]?.text === "*")
    He(e[n + 1], "as"), r.push({ imported: "*", local: Xe(e[n + 2]), namespace: !0 }), n += 3, He(e[n], "from"), n++;
  else throw e[n]?.kind === "string" ? T("VGPU-WGSL-IMP-SIDEEFFECT", "Side-effect imports are not supported", e[n].line, e[n].column) : T("VGPU-WGSL-IMP-DEFAULT", "Default imports are not supported", e[n]?.line, e[n]?.column);
  const i = e[n];
  if (i?.kind !== "string")
    throw T("VGPU-WGSL-RES-NOTFOUND", "Import path must be a string", i?.line, i?.column);
  const s = i.text.slice(1, -1);
  return n++, e[n]?.text === ";" && n++, [{ from: s, bindings: r, start: e[t].start, end: e[n - 1].end }, n];
}
function Ji(e, t) {
  for (; e[t]?.text === "@"; ) {
    if (t += 2, e[t]?.text === "(")
      for (; e[t] && e[t].text !== ")"; )
        t++;
    e[t]?.text === ")" && t++;
  }
  return t;
}
function Qi(e, t) {
  let n = t + 1;
  if (e[t]?.text === "var" && e[n]?.text === "<")
    for (; e[n] && e[n].text !== ">"; )
      n++;
  for (; n < e.length; n++)
    if (e[n].kind === "ident")
      return e[n].text;
  throw T("VGPU-WGSL-EXP-NOTDECL", "Exported declaration has no name", e[t]?.line, e[t]?.column);
}
function He(e, t) {
  if (e?.text !== t)
    throw T("VGPU-WGSL-IMP-DEFAULT", `Expected ${t}`, e?.line, e?.column);
}
function Xe(e) {
  if (e?.kind !== "ident")
    throw T("VGPU-WGSL-IMP-DEFAULT", "Expected identifier", e?.line, e?.column);
  return e.text;
}
function _n(e) {
  return e.kind === "lineComment" || e.kind === "blockComment";
}
function es(e, t) {
  return t === "uniform" || t === "storage" ? "buffer" : e.kind === "sampler" ? "sampler" : e.kind === "texture" ? e.textureKind === "texture_external" ? "externalTexture" : "texture" : "unknown";
}
function ts(e, t, n, r, i) {
  if (e === "buffer")
    return ns(t, n, i);
  if (r.kind === "sampler")
    return rs(r);
  if (r.kind === "texture")
    return r.textureKind === "texture_external" ? { kind: "externalTexture", externalTexture: {} } : r.textureKind.startsWith("texture_storage_") ? is(r) : ss(r);
}
function ns(e, t, n) {
  return { kind: "buffer", buffer: { type: e === "uniform" ? "uniform" : t === "read" ? "read-only-storage" : "storage", hasDynamicOffset: !1, minBindingSize: n?.size } };
}
function rs(e) {
  return { kind: "sampler", sampler: { type: e.comparison ? "comparison" : "filtering" } };
}
function is(e) {
  return {
    kind: "storageTexture",
    storageTexture: {
      access: as(e.access),
      format: e.texelFormat ?? "rgba8unorm",
      viewDimension: Bn(e.dimension)
    }
  };
}
function ss(e) {
  return {
    kind: "texture",
    texture: {
      sampleType: os(e),
      viewDimension: Bn(e.dimension),
      multisampled: e.dimension === "multisampled_2d" || e.dimension === "depth_multisampled_2d"
    }
  };
}
function os(e) {
  if (e.textureKind.startsWith("texture_depth_"))
    return "depth";
  const t = e.sampleType;
  return t?.kind === "scalar" && t.name === "i32" ? "sint" : t?.kind === "scalar" && t.name === "u32" ? "uint" : "unfilterable-float";
}
function Bn(e) {
  switch (e) {
    case "1d":
      return "1d";
    case "2d_array":
    case "depth_2d_array":
      return "2d-array";
    case "cube":
    case "depth_cube":
      return "cube";
    case "cube_array":
    case "depth_cube_array":
      return "cube-array";
    case "3d":
      return "3d";
    default:
      return "2d";
  }
}
function as(e) {
  return e === "read" ? "read-only" : e === "read_write" ? "read-write" : "write-only";
}
const A = (1n << 64n) - 1n, Z = 11400714785074694791n, be = 14029467366897019727n, Bt = 1609587929392839161n, zn = 9650029242287828579n, zt = 2870177450012600261n;
function cs(e, t = 0n) {
  const n = new TextEncoder().encode(e);
  let r = 0, i;
  if (n.length >= 32) {
    let s = t + Z + be, o = t + be, a = t, c = t - Z;
    const u = n.length - 32;
    do
      s = se(s, ge(n, r)), r += 8, o = se(o, ge(n, r)), r += 8, a = se(a, ge(n, r)), r += 8, c = se(c, ge(n, r)), r += 8;
    while (r <= u);
    i = K(s, 1n) + K(o, 7n) + K(a, 12n) + K(c, 18n), i = Ce(i, s), i = Ce(i, o), i = Ce(i, a), i = Ce(i, c);
  } else
    i = t + zt;
  for (i = i + BigInt(n.length) & A; r + 8 <= n.length; )
    i ^= se(0n, ge(n, r)), i = K(i, 27n) * Z + zn & A, r += 8;
  for (r + 4 <= n.length && (i ^= us(n, r) * Z & A, i = K(i, 23n) * be + Bt & A, r += 4); r < n.length; )
    i ^= BigInt(n[r]) * zt & A, i = K(i, 11n) * Z & A, r++;
  return i ^= i >> 33n, i = i * be & A, i ^= i >> 29n, i = i * Bt & A, i ^= i >> 32n, i.toString(16).padStart(16, "0");
}
function se(e, t) {
  return K(e + t * be & A, 31n) * Z & A;
}
function Ce(e, t) {
  return e ^= se(0n, t), e * Z + zn & A;
}
function K(e, t) {
  return (e << t | e >> 64n - t) & A;
}
function ge(e, t) {
  let n = 0n;
  for (let r = 7; r >= 0; r--)
    n = (n << 8n) + BigInt(e[t + r]);
  return n;
}
function us(e, t) {
  return BigInt(e[t]) | BigInt(e[t + 1]) << 8n | BigInt(e[t + 2]) << 16n | BigInt(e[t + 3]) << 24n;
}
function ds(e) {
  return cs(e);
}
function fs(e) {
  return ds(e).slice(0, 8);
}
function ls(e, t) {
  return `_vgsl_${fs(e)}__${t}`;
}
function U(e, t) {
  const n = e.find((s) => s.name === t);
  if (!n)
    return;
  const r = n.args.map((s) => s.text).join(""), i = Number(r.replace(/[ui]$/, ""));
  return Number.isFinite(i) ? i : void 0;
}
function ft(e) {
  const t = [[]];
  let n = 0, r = 0;
  for (const i of e) {
    if (i.text === "<" ? n++ : i.text === ">" ? n = Math.max(0, n - 1) : i.text === "(" ? r++ : i.text === ")" && (r = Math.max(0, r - 1)), i.text === "," && n === 0 && r === 0) {
      t.push([]);
      continue;
    }
    t[t.length - 1].push(i);
  }
  return t.map(Wn).filter((i) => i.length > 0);
}
function Wn(e) {
  let t = 0, n = e.length;
  for (; t < n && e[t].text === ","; )
    t++;
  for (; n > t && e[n - 1].text === ","; )
    n--;
  return e.slice(t, n);
}
function hs(e) {
  if (e !== void 0 && jn(e))
    return Number(e.replace(/[ui]$/, ""));
}
function jn(e) {
  return /^(0|[1-9][0-9]*)([ui])?$/.test(e);
}
function Kn(e) {
  if (e === "read" || e === "write" || e === "read_write")
    return e;
}
function ps(e) {
  return ["f32", "f16", "i32", "u32", "bool"].find((t) => t === e);
}
function ms(e) {
  return { kind: "scalar", name: e === "f" ? "f32" : e === "h" ? "f16" : e === "i" ? "i32" : "u32" };
}
function qn(e) {
  return e === "f16" ? 2 : 4;
}
function ee(e, t) {
  return Math.ceil(t / e) * e;
}
function N(e) {
  const t = Wn(e);
  if (t.length === 0)
    throw T("VGPU-WGSL-REFLECT-TYPE", "Expected WGSL type");
  const n = t.map((s) => s.text).join(""), r = gs(n);
  if (r)
    return r;
  if (t[1]?.text === "<") {
    const s = t[0].text, o = ft(t.slice(2, -1)), a = bs(s, o);
    if (a)
      return a;
  }
  const i = ws(n);
  return i || ys(n);
}
function gs(e) {
  const t = ps(e);
  if (t)
    return { kind: "scalar", name: t };
  const n = e.match(/^vec([234])([fiuh])$/);
  if (n)
    return { kind: "vector", width: Number(n[1]), element: ms(n[2]) };
  const r = e.match(/^mat([234])x([234])([fh])$/);
  if (r) {
    const i = r[3] === "h" ? { kind: "scalar", name: "f16" } : { kind: "scalar", name: "f32" };
    return { kind: "matrix", columns: Number(r[1]), rows: Number(r[2]), element: i };
  }
}
function bs(e, t) {
  if (e === "array") {
    const n = t[1]?.map((i) => i.text).join(""), r = n === void 0 ? void 0 : hs(n);
    return { kind: "array", element: N(t[0] ?? []), count: r, countExpression: n };
  }
  if (e === "atomic")
    return { kind: "atomic", element: N(t[0] ?? []) };
  if (e === "vec2" || e === "vec3" || e === "vec4")
    return { kind: "vector", width: Number(e.slice(3)), element: N(t[0] ?? []) };
  if (/^mat[234]x[234]$/.test(e))
    return { kind: "matrix", columns: Number(e[3]), rows: Number(e[5]), element: N(t[0] ?? []) };
  if (e === "ptr")
    return { kind: "ptr", addressSpace: t[0]?.map((n) => n.text).join("") ?? "", element: N(t[1] ?? []), access: t[2]?.map((n) => n.text).join("") };
  if (e === "sampler")
    return { kind: "sampler", comparison: !1 };
  if (e.startsWith("texture_storage_"))
    return { kind: "texture", textureKind: e, dimension: e.slice(16), texelFormat: t[0]?.map((n) => n.text).join(""), access: Kn(t[1]?.map((n) => n.text).join("")) };
  if (e.startsWith("texture_"))
    return { kind: "texture", textureKind: e, dimension: e.slice(8), sampleType: t[0] ? N(t[0]) : void 0 };
}
function ws(e) {
  if (e === "sampler" || e === "sampler_comparison")
    return { kind: "sampler", comparison: e === "sampler_comparison" };
  if (e === "texture_external")
    return { kind: "texture", textureKind: e };
  if (e.startsWith("texture_depth_"))
    return { kind: "texture", textureKind: e, dimension: e.slice(8) };
  if (e.startsWith("texture_"))
    return { kind: "texture", textureKind: e, dimension: e.slice(8) };
}
function ys(e) {
  return { kind: "identifier", name: e };
}
function X(e) {
  if (e?.kind !== "ident" && e?.kind !== "keyword")
    throw T("VGPU-WGSL-REFLECT-PARSE", "Expected identifier", e?.line, e?.column);
  return e.text;
}
function te(e, t, n) {
  for (let r = t; r < e.length; r++)
    if (e[r].text === n)
      return r;
  throw T("VGPU-WGSL-REFLECT-PARSE", `Expected ${n}`, e[t]?.line, e[t]?.column);
}
function xs(e, t, n, r) {
  for (let i = t; i < n; i++)
    if (e[i].text === r)
      return i;
}
function je(e, t, n) {
  let r = 0;
  for (let i = t; i < e.length; i++)
    if ((e[i].text === "{" || e[i].text === "(") && r++, (e[i].text === "}" || e[i].text === ")") && (r = Math.max(0, r - 1)), r === 0 && e[i].text === n)
      return i;
  return e.length;
}
function lt(e, t) {
  const n = e[t].text, r = n === "(" ? ")" : n === "{" ? "}" : ">";
  let i = 0;
  for (let s = t; s < e.length; s++)
    if (e[s].text === n && i++, e[s].text === r && (i--, i === 0))
      return s;
  throw T("VGPU-WGSL-REFLECT-PARSE", `Unclosed ${n}`, e[t]?.line, e[t]?.column);
}
function ht(e, t) {
  const n = [];
  let r = t;
  for (; e[r]?.text === "@"; ) {
    const i = e[r], s = X(e[r + 1]);
    r += 2;
    let o = [];
    if (e[r]?.text === "(") {
      const a = lt(e, r);
      o = e.slice(r + 1, a), r = a + 1;
    }
    n.push({ name: s, args: o, token: i });
  }
  return [n, r];
}
function ae(e) {
  switch (e.kind) {
    case "scalar":
      return e.name;
    case "identifier":
      return e.name;
    case "vector":
      return `vec${e.width}<${ae(e.element)}>`;
    case "matrix":
      return `mat${e.columns}x${e.rows}<${ae(e.element)}>`;
    case "array":
      return `array<${ae(e.element)}${e.count === void 0 ? "" : `,${e.count}`}>`;
    default:
      return e.kind;
  }
}
function Ss(e) {
  const t = e.find((r) => r.name === "workgroup_size");
  if (!t)
    return;
  const n = ft(t.args).map((r) => Number(r.map((i) => i.text).join("")));
  return [n[0] ?? 1, n[1] ?? 1, n[2] ?? 1];
}
function vs(e, t) {
  if (e[t]?.text !== "<")
    return { after: t };
  const n = te(e, t, ">"), r = ft(e.slice(t + 1, n)).map((i) => i.map((s) => s.text).join(""));
  return { addressSpace: r[0], access: Kn(r[1]), after: n + 1 };
}
function Es(e) {
  const t = [], n = [], r = [], i = [], s = [], o = [], a = e.tokens.filter((d) => d.kind !== "lineComment" && d.kind !== "blockComment");
  let c = 0, u = 0;
  for (; c < a.length; ) {
    const d = a[c];
    if (d.text === "{") {
      u++, c++;
      continue;
    }
    if (d.text === "}") {
      u = Math.max(0, u - 1), c++;
      continue;
    }
    if (u > 0) {
      c++;
      continue;
    }
    const f = c, [h, g] = ht(a, c);
    c = g, a[c]?.text === "export" && c++;
    const w = a[c]?.text;
    if (w === "enable") {
      a[c + 1]?.kind === "ident" && o.push(a[c + 1].text), c = je(a, c, ";") + 1;
      continue;
    }
    if (w === "struct") {
      const b = $s(e, a, c);
      b.item && t.push(b.item), c = b.next;
      continue;
    }
    if (w === "alias") {
      const b = ks(e, a, c);
      b.item && n.push(b.item), c = b.next;
      continue;
    }
    if (w === "var") {
      const b = Is(e, a, c, h);
      b.item && r.push(b.item), c = b.next;
      continue;
    }
    if (w === "fn") {
      const b = Ts(e, a, c, h);
      b.item && i.push(b.item), c = b.next;
      continue;
    }
    if (w === "override") {
      const b = Fs(a, c, h);
      b.item && s.push(b.item), c = b.next;
      continue;
    }
    c = Math.max(f + 1, c + 1);
  }
  return { structs: t, aliases: n, vars: r, entries: i, overrides: s, features: o };
}
function $s(e, t, n, r) {
  const i = X(t[n + 1]), s = te(t, n + 2, "{"), o = lt(t, s);
  return {
    item: { name: i, originalName: i, mangledName: pt(e, i, "struct"), members: Cs(t.slice(s + 1, o)), path: e.path },
    next: o + 1
  };
}
function ks(e, t, n, r) {
  const i = X(t[n + 1]), s = te(t, n + 2, "="), o = je(t, s + 1, ";");
  return {
    item: { name: i, originalName: i, mangledName: pt(e, i, "alias"), target: N(t.slice(s + 1, o)), path: e.path },
    next: o + 1
  };
}
function Is(e, t, n, r) {
  const { addressSpace: i, access: s, after: o } = vs(t, n + 1), a = X(t[o]), c = te(t, o + 1, ":"), u = je(t, c + 1, ";");
  return {
    item: { path: e.path, name: a, mangledName: Ls(r) ? a : pt(e, a, "var"), attrs: r, addressSpace: i, access: s, type: N(t.slice(c + 1, u)) },
    next: u + 1
  };
}
function Ts(e, t, n, r) {
  const i = X(t[n + 1]), s = r.find((c) => c.name === "vertex" || c.name === "fragment" || c.name === "compute")?.name;
  if (!s)
    return { item: void 0, next: n + 1 };
  const o = te(t, n + 2, "("), a = lt(t, o);
  return { item: { name: i, mangledName: i, stage: s, workgroupSize: Ss(r), path: e.path, params: Ps(t.slice(o + 1, a)) }, next: a + 1 };
}
function Ps(e) {
  const t = [];
  let n = 0;
  for (; n < e.length; ) {
    const [r, i] = ht(e, n);
    if (n = i, !e[n] || e[n].text === ",") {
      n++;
      continue;
    }
    const s = X(e[n]), o = te(e, n + 1, ":");
    let a = o + 1, c = 0;
    for (; a < e.length && (e[a].text === "<" && c++, e[a].text === ">" && (c = Math.max(0, c - 1)), !(c === 0 && e[a].text === ",")); )
      a++;
    t.push({ name: s, attrs: r, type: N(e.slice(o + 1, a)) }), n = a + 1;
  }
  return t;
}
function Fs(e, t, n) {
  const r = X(e[t + 1]), i = je(e, t + 1, ";"), s = xs(e, t + 2, i, "=");
  return { item: { name: r, mangledName: r, id: U(n, "id"), defaultValue: s === void 0 ? void 0 : e.slice(s + 1, i).map((o) => o.text).join("") }, next: i + 1 };
}
function Cs(e) {
  const t = [];
  let n = 0;
  for (; n < e.length; ) {
    const [r, i] = ht(e, n);
    if (n = i, !e[n] || e[n].text === "," || e[n].text === ";") {
      n++;
      continue;
    }
    const s = X(e[n]), o = te(e, n + 1, ":");
    let a = o + 1, c = 0;
    for (; a < e.length && (e[a].text === "<" && c++, e[a].text === ">" && (c = Math.max(0, c - 1)), !(c === 0 && (e[a].text === "," || e[a].text === ";"))); )
      a++;
    t.push({ name: s, attrs: r, type: N(e.slice(o + 1, a)), align: U(r, "align"), size: U(r, "size") }), n = a + 1;
  }
  return t;
}
function pt(e, t, n) {
  return n === "override" ? t : ls(e.path, t);
}
function Ls(e) {
  return U(e, "group") !== void 0 || U(e, "binding") !== void 0;
}
const Gs = "literal length required for auto layout; use draw.group(n, bg) manual binding", Us = "VGPUError: `bool` is not host-shareable in uniform/storage. Fix: use `u32` (0 | 1) → struct Params { enabled: u32 }", Hn = "use a manual group claim (`draw.group(n, bg)`)";
function As(e = 1, t = 1) {
  return T("VGPU-WGSL-REFLECT-ARRAY-LENGTH", Gs, e, t);
}
function Xn(e = 1, t = 1) {
  return T("VGPU-WGSL-REFLECT-BOOL-HOST-SHAREABLE", Us, e, t);
}
function Ve(e, t, n = 1, r = 1) {
  return T("VGPU-WGSL-REFLECT-UNKNOWN-TYPE", `type '${e}' is unknown in ${t}; ${Hn}`, n, r);
}
function Wt(e, t, n = 1, r = 1) {
  return T("VGPU-WGSL-REFLECT-NS-TYPE", `type '${e}' is a namespace-member import; use a named import or manual @group(1+) binding`, n, r);
}
function Yn(e, t = 1, n = 1) {
  return T("VGPU-WGSL-REFLECT-NON-HOST-SHAREABLE", `Type ${e} is not host-shareable; ${Hn}`, t, n);
}
const de = "naga-standard";
function Rs(e, t, n) {
  const r = /* @__PURE__ */ new Map();
  for (const o of t) {
    const a = /* @__PURE__ */ new Map();
    for (const c of [...o.structs, ...o.aliases])
      a.set(c.originalName, { path: c.path, name: c.originalName, mangledName: c.mangledName, kind: "members" in c ? "struct" : "alias" });
    r.set(o.structs[0]?.path ?? o.aliases[0]?.path ?? o.vars[0]?.path ?? "", a);
  }
  const i = new Map(e.map((o) => [o.path, r.get(o.path) ?? /* @__PURE__ */ new Map()])), s = /* @__PURE__ */ new Map();
  for (const o of e) {
    const a = new Map(i.get(o.path));
    for (const c of o.parsed.imports)
      Ds(o, c, a, e, i);
    s.set(o.path, a);
  }
  return s;
}
function Ds(e, t, n, r, i, s) {
  const o = Vs(t, e.path, r), a = i.get(o);
  for (const c of t.bindings) {
    if (c.namespace) {
      n.set(c.local, { path: o, name: c.local, mangledName: c.local, kind: "namespace" });
      continue;
    }
    const u = a?.get(c.imported);
    u && n.set(c.local, u);
  }
}
function Ms(e, t) {
  const n = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Map();
  for (const s of e) {
    for (const o of s.structs) {
      const a = {
        name: o.name,
        mangledName: o.mangledName,
        members: o.members.map((c) => ({ name: c.name, type: Q(c.type, o.path, t), align: c.align, size: c.size }))
      };
      n.set(o.mangledName, a), i.set(o.mangledName, a);
    }
    for (const o of s.aliases) {
      const a = { name: o.name, mangledName: o.mangledName, target: Q(o.target, o.path, t) };
      r.set(o.mangledName, a), i.set(o.mangledName, a);
    }
  }
  return { structs: n, aliases: r, byMangled: i };
}
function Q(e, t, n, r) {
  switch (e.kind) {
    case "identifier": {
      const i = e.name.indexOf(".");
      if (i > 0) {
        const o = e.name.slice(0, i);
        if (n.get(t)?.get(o)?.kind === "namespace")
          throw Wt(e.name);
      }
      const s = n.get(t)?.get(e.name);
      if (s?.kind === "namespace")
        throw Wt(e.name);
      if (!s)
        throw Ve(e.name, t);
      return { kind: "identifier", name: s.name, mangledName: s.mangledName };
    }
    case "array":
    case "atomic":
    case "vector":
    case "matrix":
    case "ptr":
      return { ...e, element: Q(e.element, t, n) };
    case "texture":
      return { ...e, sampleType: e.sampleType ? Q(e.sampleType, t, n) : void 0 };
    default:
      return e;
  }
}
function fe(e, t) {
  if (!t || e.kind !== "identifier")
    return e;
  const n = t.aliases.get(e.mangledName ?? e.name);
  return n ? fe(n.target, t) : e;
}
function tt(e, t) {
  const n = fe(e, t);
  switch (n.kind) {
    case "array":
    case "atomic":
    case "vector":
    case "matrix":
    case "ptr":
      return { ...n, element: tt(n.element, t) };
    case "texture":
      return { ...n, sampleType: n.sampleType ? tt(n.sampleType, t) : void 0 };
    default:
      return n;
  }
}
function Vs(e, t, n, r) {
  const i = void 0;
  if (i !== void 0 && n.some((u) => u.path === i))
    return i;
  const s = e.from, o = t.slice(0, t.lastIndexOf("/") + 1), a = s.startsWith("/") ? s : Ns(`${o}${s}`);
  return [s, a].find((u) => n.some((d) => d.path === u)) ?? i ?? a;
}
function Ns(e) {
  const t = e.startsWith("/"), n = [];
  for (const r of e.split("/"))
    !r || r === "." || (r === ".." ? n.pop() : n.push(r));
  return `${t ? "/" : ""}${n.join("/")}`;
}
function ke(e, t, n = ae(e), r = n, i) {
  const s = i ? tt(e, i) : e;
  return Os(s, t, n, r, i);
}
function Os(e, t, n, r, i) {
  switch (e.kind) {
    case "scalar":
      return _s(e, t, n, r);
    case "atomic":
      return Bs(e, t, n, r);
    case "vector":
      return zs(e, t, n, r, i);
    case "matrix":
      return Ws(e, t, n, r, i);
    case "array":
      return js(e, t, n, r, i);
    case "identifier":
      return qs(e, t, n, r, i);
    default:
      throw Yn(ae(e));
  }
}
function _s(e, t, n, r) {
  const i = qn(e.name);
  if (e.name === "bool")
    throw Xn();
  return { name: n, mangledName: r, addressSpace: t, layoutMode: de, type: e, align: i, size: i };
}
function Bs(e, t, n, r) {
  return { name: n, mangledName: r, addressSpace: t, layoutMode: de, type: e, align: 4, size: 4 };
}
function zs(e, t, n, r, i) {
  const o = ke(e.element, t, n, r, i).size ?? 4, a = e.width === 2 ? o * 2 : o * 4;
  return { name: n, mangledName: r, addressSpace: t, layoutMode: de, type: e, align: a, size: o * e.width };
}
function Ws(e, t, n, r, i) {
  const s = { kind: "vector", width: e.rows, element: e.element }, o = ke(s, t, `${n}[]`, `${r}[]`, i), a = ee(o.align, o.size ?? 0);
  return { name: n, mangledName: r, addressSpace: t, layoutMode: de, type: e, align: o.align, size: a * e.columns, stride: a, element: o };
}
function js(e, t, n, r, i) {
  Ks(e.countExpression);
  const s = ke(e.element, t, `${n}[]`, `${r}[]`, i), o = ee(Se(e.element, t, i), s.size ?? 0);
  return {
    name: n,
    mangledName: r,
    addressSpace: t,
    layoutMode: de,
    type: e,
    align: Se(e, t, i),
    size: e.count === void 0 ? void 0 : o * e.count,
    stride: o,
    element: s,
    runtimeSized: e.count === void 0
  };
}
function Ks(e) {
  if (e !== void 0 && !jn(e))
    throw As();
}
function qs(e, t, n, r, i) {
  if (!i)
    throw Ve(e.name, "<unknown>");
  const s = i.structs.get(e.mangledName ?? e.name);
  if (!s)
    throw Ve(e.name, "<unknown>");
  const o = [];
  let a = 0, c = 1;
  for (const d of s.members) {
    const f = Hs(d, t, a, i);
    o.push(f.member), a = Xs(t, d.type, f.offset, f.member.size ?? 0, i), c = Math.max(c, f.member.align);
  }
  const u = Zs(t, c);
  return { name: n, mangledName: r, addressSpace: t, layoutMode: de, type: e, align: u, size: ee(u, a), members: o };
}
function Hs(e, t, n, r) {
  const i = ke(e.type, t, e.name, e.name, r), s = Math.max(Se(e.type, t, r), e.align ?? 1), o = Math.max(i.size ?? 0, e.size ?? 0), a = ee(s, n);
  return {
    member: { name: e.name, offset: a, align: s, size: o, type: e.type, layout: i, explicitAlign: e.align, explicitSize: e.size },
    offset: a
  };
}
function Xs(e, t, n, r, i) {
  return n + (e === "uniform" && Ys(t, i) ? ee(16, r) : r);
}
function Ys(e, t) {
  const n = fe(e, t);
  return n.kind === "identifier" && t.structs.has(n.mangledName ?? n.name);
}
function Zs(e, t) {
  return e === "uniform" ? ee(16, t) : t;
}
function Se(e, t, n) {
  const r = n ? fe(e, n) : e, i = Ae(r, t, n);
  return t === "uniform" && Js(r, n) ? ee(16, i) : i;
}
function Js(e, t) {
  return e.kind === "array" || e.kind === "identifier" && !!t?.structs.get(e.mangledName ?? e.name);
}
function Ae(e, t, n) {
  const r = n ? fe(e, n) : e;
  switch (r.kind) {
    case "scalar":
      return Qs(r.name);
    case "atomic":
      return 4;
    case "vector":
      return r.width === 2 ? Ae(r.element, t, n) * 2 : Ae(r.element, t, n) * 4;
    case "matrix":
      return Ae({ kind: "vector", width: r.rows, element: r.element }, t, n);
    case "array":
      return Se(r.element, t, n);
    case "identifier":
      return eo(r, t, n);
    default:
      throw Yn(ae(r));
  }
}
function Qs(e) {
  if (e === "bool")
    throw Xn();
  return qn(e);
}
function eo(e, t, n) {
  const r = n?.structs.get(e.mangledName ?? e.name);
  if (!r)
    throw Ve(e.name, "<unknown>");
  return Math.max(1, ...r.members.map((i) => Math.max(Se(i.type, t, n), i.align ?? 1)));
}
const to = /* @__PURE__ */ new Set([
  "alias",
  "break",
  "case",
  "const",
  "const_assert",
  "continue",
  "continuing",
  "default",
  "diagnostic",
  "discard",
  "else",
  "enable",
  "false",
  "fn",
  "for",
  "if",
  "let",
  "loop",
  "override",
  "requires",
  "return",
  "struct",
  "switch",
  "true",
  "var",
  "while"
]), no = /* @__PURE__ */ new Set(["import", "export", "from", "as"]), Zn = /* @__PURE__ */ new Set([...to, ...no]), ro = /* @__PURE__ */ new Set([
  "NULL",
  "Self",
  "abstract",
  "active",
  "alignas",
  "alignof",
  "as",
  "asm",
  "asm_fragment",
  "async",
  "attribute",
  "auto",
  "await",
  "become",
  "cast",
  "catch",
  "class",
  "co_await",
  "co_return",
  "co_yield",
  "coherent",
  "column_major",
  "common",
  "compile",
  "compile_fragment",
  "concept",
  "const_cast",
  "consteval",
  "constexpr",
  "constinit",
  "crate",
  "debugger",
  "decltype",
  "delete",
  "demote",
  "demote_to_helper",
  "do",
  "dynamic_cast",
  "enum",
  "explicit",
  "export",
  "extends",
  "extern",
  "external",
  "fallthrough",
  "filter",
  "final",
  "finally",
  "friend",
  "from",
  "fxgroup",
  "get",
  "goto",
  "groupshared",
  "highp",
  "impl",
  "implements",
  "import",
  "inline",
  "instanceof",
  "interface",
  "layout",
  "lowp",
  "macro",
  "macro_rules",
  "match",
  "mediump",
  "meta",
  "mod",
  "module",
  "move",
  "mut",
  "mutable",
  "namespace",
  "new",
  "nil",
  "noexcept",
  "noinline",
  "nointerpolation",
  "non_coherent",
  "noncoherent",
  "noperspective",
  "null",
  "nullptr",
  "of",
  "operator",
  "package",
  "packoffset",
  "partition",
  "pass",
  "patch",
  "pixelfragment",
  "precise",
  "precision",
  "premerge",
  "priv",
  "protected",
  "pub",
  "public",
  "readonly",
  "ref",
  "regardless",
  "register",
  "reinterpret_cast",
  "require",
  "resource",
  "restrict",
  "self",
  "set",
  "shared",
  "sizeof",
  "smooth",
  "snorm",
  "static",
  "static_assert",
  "static_cast",
  "std",
  "subroutine",
  "super",
  "target",
  "template",
  "this",
  "thread_local",
  "throw",
  "trait",
  "try",
  "type",
  "typedef",
  "typeid",
  "typename",
  "typeof",
  "union",
  "unless",
  "unorm",
  "unsafe",
  "unsized",
  "use",
  "using",
  "varying",
  "virtual",
  "volatile",
  "wgsl",
  "where",
  "with",
  "writeonly",
  "yield"
]), io = /* @__PURE__ */ new Set(["binding_array"]), so = /* @__PURE__ */ new Set([
  "array",
  "atomic",
  "bool",
  "f16",
  "f32",
  "i32",
  "mat2x2",
  "mat2x3",
  "mat2x4",
  "mat3x2",
  "mat3x3",
  "mat3x4",
  "mat4x2",
  "mat4x3",
  "mat4x4",
  "ptr",
  "sampler",
  "sampler_comparison",
  "texture_1d",
  "texture_2d",
  "texture_2d_array",
  "texture_3d",
  "texture_cube",
  "texture_cube_array",
  "texture_depth_2d",
  "texture_depth_2d_array",
  "texture_depth_cube",
  "texture_depth_cube_array",
  "texture_depth_multisampled_2d",
  "texture_external",
  "texture_multisampled_2d",
  "texture_storage_1d",
  "texture_storage_2d",
  "texture_storage_2d_array",
  "texture_storage_3d",
  "u32",
  "vec2",
  "vec2f",
  "vec2h",
  "vec2i",
  "vec2u",
  "vec3",
  "vec3f",
  "vec3h",
  "vec3i",
  "vec3u",
  "vec4",
  "vec4f",
  "vec4h",
  "vec4i",
  "vec4u"
]), oo = /* @__PURE__ */ new Set([
  "abs",
  "acos",
  "acosh",
  "all",
  "any",
  "arrayLength",
  "asin",
  "asinh",
  "atan",
  "atan2",
  "atanh",
  "ceil",
  "clamp",
  "cos",
  "cosh",
  "countLeadingZeros",
  "countOneBits",
  "countTrailingZeros",
  "cross",
  "degrees",
  "determinant",
  "distance",
  "dot",
  "dot4I8Packed",
  "dot4U8Packed",
  "dpdx",
  "dpdxCoarse",
  "dpdxFine",
  "dpdy",
  "dpdyCoarse",
  "dpdyFine",
  "exp",
  "exp2",
  "extractBits",
  "faceForward",
  "firstLeadingBit",
  "firstTrailingBit",
  "floor",
  "fma",
  "fract",
  "frexp",
  "fwidth",
  "fwidthCoarse",
  "fwidthFine",
  "insertBits",
  "inverseSqrt",
  "ldexp",
  "length",
  "log",
  "log2",
  "max",
  "min",
  "mix",
  "modf",
  "normalize",
  "pack2x16float",
  "pack2x16snorm",
  "pack2x16unorm",
  "pack4x8snorm",
  "pack4x8unorm",
  "pack4xI8",
  "pack4xU8",
  "pack4xI8Clamp",
  "pack4xU8Clamp",
  "pow",
  "quantizeToF16",
  "radians",
  "reflect",
  "refract",
  "reverseBits",
  "round",
  "saturate",
  "select",
  "sign",
  "sin",
  "sinh",
  "smoothstep",
  "sqrt",
  "step",
  "storageBarrier",
  "tan",
  "tanh",
  "textureBarrier",
  "textureDimensions",
  "textureGather",
  "textureGatherCompare",
  "textureLoad",
  "textureNumLayers",
  "textureNumLevels",
  "textureNumSamples",
  "textureSample",
  "textureSampleBaseClampToEdge",
  "textureSampleBias",
  "textureSampleCompare",
  "textureSampleCompareLevel",
  "textureSampleGrad",
  "textureSampleLevel",
  "textureStore",
  "transpose",
  "trunc",
  "unpack2x16float",
  "unpack2x16snorm",
  "unpack2x16unorm",
  "unpack4x8snorm",
  "unpack4x8unorm",
  "unpack4xI8",
  "unpack4xU8",
  "workgroupBarrier"
]), ao = /* @__PURE__ */ new Set([
  "frag_depth",
  "front_facing",
  "global_invocation_id",
  "instance_index",
  "local_invocation_id",
  "local_invocation_index",
  "num_workgroups",
  "position",
  "sample_index",
  "sample_mask",
  "subgroup_invocation_id",
  "subgroup_size",
  "vertex_index",
  "workgroup_id"
]), co = /* @__PURE__ */ new Set([
  "align",
  "binding",
  "blend_src",
  "builtin",
  "compute",
  "diagnostic",
  "fragment",
  "group",
  "id",
  "interpolate",
  "invariant",
  "location",
  "must_use",
  "size",
  "vertex",
  "workgroup_size"
]), uo = /* @__PURE__ */ new Set(["function", "private", "storage", "uniform", "workgroup"]), fo = /* @__PURE__ */ new Set(["read", "read_write", "write"]), lo = /* @__PURE__ */ new Set([
  "bgra8unorm",
  "r32float",
  "r32sint",
  "r32uint",
  "rg32float",
  "rg32sint",
  "rg32uint",
  "rgba16float",
  "rgba16sint",
  "rgba16uint",
  "rgba32float",
  "rgba32sint",
  "rgba32uint",
  "rgba8sint",
  "rgba8snorm",
  "rgba8uint",
  "rgba8unorm"
]);
[
  ...Zn,
  ...ro,
  ...io,
  ...so,
  ...oo,
  ...ao,
  ...co,
  ...uo,
  ...fo,
  ...lo
];
const ho = "VGPU-WGSL-IDENT-NONASCII", po = "https://github.com/vercel-labs/vgpu/issues/294";
function mo(e, t) {
  const n = [];
  let r = 0, i = 1, s = 1;
  const o = (c, u, d, f, h) => n.push({ kind: c, text: e.slice(u, d), start: u, end: d, line: f, column: h }), a = () => {
    e[r] === `
` ? (i++, s = 1) : s++, r++;
  };
  for (; r < e.length; ) {
    const c = e[r];
    if (/\s/.test(c)) {
      a();
      continue;
    }
    const u = r, d = i, f = s;
    if (c === "/" && e[r + 1] === "/") {
      for (; r < e.length && e[r] !== `
`; )
        a();
      o("lineComment", u, r, d, f);
      continue;
    }
    if (c === "/" && e[r + 1] === "*") {
      let h = 0;
      for (; r < e.length; ) {
        if (e[r] === "/" && e[r + 1] === "*") {
          h++, a(), a();
          continue;
        }
        if (e[r] === "*" && e[r + 1] === "/") {
          if (h--, a(), a(), h === 0) {
            o("blockComment", u, r, d, f);
            break;
          }
          continue;
        }
        a();
      }
      if (h !== 0)
        throw T("VGPU-WGSL-LEX-UNTERM-COMMENT", "Unterminated block comment", d, f);
      continue;
    }
    if (c === '"' || c === "'") {
      const h = c;
      for (a(); r < e.length && e[r] !== h; ) {
        if (e[r] === `
`)
          throw T("VGPU-WGSL-LEX-UNTERM-STRING", "Unterminated string", d, f);
        e[r] === "\\" && a(), a();
      }
      if (r >= e.length)
        throw T("VGPU-WGSL-LEX-UNTERM-STRING", "Unterminated string", d, f);
      a(), o("string", u, r, d, f);
      continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      for (; r < e.length && /[A-Za-z0-9_]/.test(e[r]); )
        a();
      const h = e.slice(u, r);
      o(Zn.has(h) ? "keyword" : "ident", u, r, d, f);
      continue;
    }
    if (/[0-9]/.test(c) || c === "." && /[0-9]/.test(e[r + 1] ?? "")) {
      for (c === "." && a(); r < e.length; ) {
        const h = e[r];
        if (/[A-Za-z0-9_.]/.test(h)) {
          a();
          continue;
        }
        if ((h === "+" || h === "-") && bo(e[r - 1]) && /[0-9]/.test(e[r + 1] ?? "")) {
          a();
          continue;
        }
        break;
      }
      o("number", u, r, d, f);
      continue;
    }
    if (c.charCodeAt(0) > 127)
      throw go(e, r, i, s, t);
    a(), o("punct", u, r, d, f);
  }
  return n;
}
function go(e, t, n, r, i) {
  let s = t;
  for (; s > 0 && jt(e[s - 1]); )
    s--;
  let o = t + 1;
  for (; o < e.length && jt(e[o]); )
    o++;
  const a = e.slice(s, o), c = r - (t - s), u = i === void 0 ? "" : ` in ${i}`, d = Hi(ho, `Non-ASCII identifier '${a}'${u} at line ${n} column ${c}; vgpu's WGSL pipeline supports ASCII identifiers only`, { fix: `Rename '${a}' using ASCII letters, digits and '_'. Unicode (XID) identifiers are tracked in ${po}`, line: n, column: c });
  return d.range = { file: i, start: { line: n, column: c } }, d;
}
function jt(e) {
  return e.charCodeAt(0) > 127 || /[A-Za-z0-9_]/.test(e);
}
function bo(e) {
  return e === "e" || e === "E" || e === "p" || e === "P";
}
const wo = /^_vgsl_[0-9a-f]{8,16}__[A-Za-z_][A-Za-z0-9_]*$/, yo = /* @__PURE__ */ new Set(["fn", "struct", "const", "alias", "var", "override"]);
function Jn(e) {
  return new xo(e).analyze();
}
class xo {
  tokens;
  scopes = [];
  declarations = [];
  references = [];
  functions = [];
  preserved = /* @__PURE__ */ new Map();
  symbolsByScope = /* @__PURE__ */ new Map();
  moduleFallbackReasons = [];
  pendingSymbols = [];
  moduleScopeId;
  constructor(t) {
    this.tokens = t, this.moduleScopeId = this.createScope("module", void 0, void 0, 0);
  }
  analyze() {
    this.collectTopLevel();
    for (const t of this.functions)
      this.walkFunction(t);
    return {
      tokens: this.tokens,
      scopes: this.scopes,
      declarations: this.declarations,
      references: this.references,
      functions: this.functions,
      preservedTokens: [...this.preserved.entries()].map(([t, n]) => ({ tokenIndex: t, reason: n })),
      fallback: { wholeModule: this.moduleFallbackReasons.length > 0, reasons: this.moduleFallbackReasons }
    };
  }
  collectTopLevel() {
    let t = 0;
    for (let n = 0; n < this.tokens.length; n++) {
      const r = this.tokens[n];
      if (!B(r)) {
        if (r.text === "{") {
          t++;
          continue;
        }
        if (r.text === "}") {
          t--, t < 0 && (this.moduleFallback("unmatched top-level closing brace", n), t = 0);
          continue;
        }
        if (t === 0) {
          if (r.text === "@") {
            n = this.preserveAttribute(n);
            continue;
          }
          if (r.text === "enable" || r.text === "requires" || r.text === "diagnostic" || r.text === "const_assert") {
            n = this.preserveStatement(n, "directive");
            continue;
          }
          if (r.text !== "export") {
            if (r.text === "struct") {
              n = this.collectStruct(n);
              continue;
            }
            if (r.text === "fn") {
              n = this.collectFunction(n);
              continue;
            }
            if (r.text === "const" || r.text === "alias" || r.text === "var" || r.text === "override") {
              n = this.preserveGlobalDeclaration(n);
              continue;
            }
            r.kind === "keyword" && !yo.has(r.text) && this.moduleFallback(`unexpected top-level keyword '${r.text}'`, n);
          }
        }
      }
    }
    t !== 0 && this.moduleFallback("unclosed top-level brace", this.tokens.length - 1), this.scopes[this.moduleScopeId].endToken = Math.max(0, this.tokens.length - 1);
  }
  collectStruct(t) {
    const n = this.nextSig(t);
    if (n === void 0 || this.tokens[n]?.kind !== "ident")
      return this.moduleFallback("struct without name", t), t;
    this.preserveToken(n, "global");
    const r = this.nextSig(n);
    if (r === void 0 || this.tokens[r]?.text !== "{")
      return this.moduleFallback("struct without body", t), n;
    const i = this.findMatching(r, "{", "}");
    if (i === void 0)
      return this.moduleFallback("unclosed struct body", r), r;
    for (let s = r; s <= i; s++)
      this.tokens[s]?.kind === "ident" && this.preserveToken(s, "struct");
    return i;
  }
  collectFunction(t) {
    const n = this.nextSig(t);
    if (n === void 0 || this.tokens[n]?.kind !== "ident")
      return this.moduleFallback("function without name", t), t;
    const r = this.tokens[n].text, i = wo.test(r) && !this.hasEntryAttributeBefore(t);
    this.addDeclaration(r, "function", n, this.moduleScopeId, void 0, i), i || this.preserveToken(n, "global");
    const s = this.nextSig(n);
    if (s === void 0 || this.tokens[s]?.text !== "(")
      return this.moduleFallback("function without parameter list", n), n;
    const o = this.findMatching(s, "(", ")");
    if (o === void 0)
      return this.moduleFallback("unclosed function parameter list", s), s;
    const a = this.findNextText(o + 1, "{");
    if (a === void 0)
      return this.moduleFallback("function without body", o), o;
    this.preserveFunctionSignatureTail(o + 1, a);
    const c = this.findMatching(a, "{", "}");
    if (c === void 0)
      return this.moduleFallback("unclosed function body", a), a;
    const u = this.createScope("function", this.moduleScopeId, this.functions.length, s);
    return this.functions.push({ id: this.functions.length, name: r, nameTokenIndex: n, scopeId: u, bodyStartToken: a, bodyEndToken: c, skipped: !1, fallbackReasons: [] }), this.collectParams(s, o, u, this.functions.length - 1), this.scopes[u].endToken = c, c;
  }
  collectParams(t, n, r, i) {
    for (let s = t + 1; s < n; s++) {
      const o = this.tokens[s];
      if (!B(o)) {
        if (o.text === "@") {
          s = this.preserveAttribute(s);
          continue;
        }
        if (o.kind === "ident" && this.nextSig(s) !== void 0 && this.tokens[this.nextSig(s)]?.text === ":") {
          this.addDeclaration(o.text, "param", s, r, i, !0);
          const a = this.nextSig(s);
          s = this.preserveTypeFrom(a + 1, [",", ")"], n);
        }
      }
    }
  }
  preserveFunctionSignatureTail(t, n) {
    for (let r = t; r < n; r++) {
      const i = this.tokens[r];
      if (!B(i)) {
        if (i.text === "@") {
          r = this.preserveAttribute(r);
          continue;
        }
        i.kind === "ident" && this.preserveToken(r, "type");
      }
    }
  }
  preserveGlobalDeclaration(t) {
    let n = t + 1;
    if (this.tokens[t]?.text === "var") {
      const s = this.nextSig(t);
      if (s !== void 0 && this.tokens[s]?.text === "<") {
        const o = this.findMatching(s, "<", ">");
        if (o === void 0)
          return this.moduleFallback("unparseable top-level var template", s), s;
        this.preserveRange(s, o, "type"), n = o + 1;
      }
    }
    const r = this.findNextIdent(n);
    r !== void 0 && (this.preserveToken(r, "global"), this.addDeclaration(this.tokens[r].text, "global", r, this.moduleScopeId, void 0, !1));
    const i = this.findStatementEnd(t);
    for (let s = t; s <= i; s++)
      this.tokens[s]?.kind === "ident" && this.preserveToken(s, "global");
    return i;
  }
  walkFunction(t) {
    const n = [this.moduleScopeId, t.scopeId], r = [], i = (a, c) => {
      const u = this.createScope(a, n[n.length - 1], t.id, c);
      return n.push(u), u;
    }, s = (a) => {
      if (n.length <= 2) {
        this.functionFallback(t, "scope frame underflow", a);
        return;
      }
      const c = n.pop();
      return this.scopes[c].endToken = a, c;
    };
    i("block", t.bodyStartToken);
    let o = 1;
    for (let a = t.bodyStartToken + 1; a < t.bodyEndToken; a++) {
      this.activatePendingSymbols(a);
      const c = this.tokens[a];
      if (B(c))
        continue;
      if (c.text === "@") {
        a = this.preserveAttribute(a);
        continue;
      }
      if (c.text === ".") {
        const d = this.nextSig(a);
        d !== void 0 && this.tokens[d]?.kind === "ident" && this.preserveToken(d, "member");
        continue;
      }
      if (c.text === "enable" || c.text === "requires" || c.text === "diagnostic") {
        a = this.preserveStatement(a, "directive");
        continue;
      }
      if (c.text === "for") {
        const d = i("for-init", a), f = this.nextSig(a);
        (f === void 0 || this.tokens[f]?.text !== "(") && this.functionFallback(t, "for without parenthesized header", a), r.push({ scopeId: d, headerDepth: 0, awaitingBody: !1 });
        continue;
      }
      const u = r[r.length - 1];
      if (u && u.bodyDepth === void 0 && (c.text === "(" && u.headerDepth++, c.text === ")" && (u.headerDepth--, u.headerDepth <= 0 && (u.awaitingBody = !0))), c.text === "{") {
        o++;
        const d = So(r, (f) => f.awaitingBody && f.bodyDepth === void 0);
        d && (d.bodyDepth = o), i("block", a);
        continue;
      }
      if (c.text === "}") {
        const d = o;
        for (s(a), o--; r.length > 0 && r[r.length - 1].bodyDepth === d; )
          s(a), r.pop();
        o < 0 && this.functionFallback(t, "unmatched closing brace", a);
        continue;
      }
      if (c.text === ":") {
        a = this.preserveTypeFrom(a + 1, ["=", ";", ",", ")", "{"], t.bodyEndToken);
        continue;
      }
      if (c.text === "-" && this.tokens[this.nextSig(a) ?? -1]?.text === ">") {
        a = this.preserveTypeFrom((this.nextSig(a) ?? a) + 1, ["{"], t.bodyEndToken);
        continue;
      }
      if (c.text === "let" || c.text === "const" || c.text === "var") {
        a = this.collectLocalDeclaration(a, n[n.length - 1], t);
        continue;
      }
      if (c.kind === "ident" && !this.preserved.has(a)) {
        const d = this.resolve(c.text, n);
        d !== void 0 ? this.references.push({ name: c.text, tokenIndex: a, declarationId: d, scopeId: n[n.length - 1], functionId: t.id }) : this.preserveToken(a, "unknown");
      }
    }
    for (; n.length > 2; )
      s(t.bodyEndToken);
  }
  collectLocalDeclaration(t, n, r) {
    const i = this.tokens[t].text;
    let s = t + 1;
    if (i === "var") {
      const c = this.nextSig(t);
      if (c !== void 0 && this.tokens[c]?.text === "<") {
        const u = this.findMatching(c, "<", ">");
        if (u === void 0)
          return this.functionFallback(r, "unparseable var template", c), c;
        this.preserveRange(c, u, "type"), s = u + 1;
      }
    }
    const o = this.findNextIdent(s);
    if (o === void 0 || o >= r.bodyEndToken)
      return this.functionFallback(r, `${i} without identifier`, t), t;
    this.addDeclaration(this.tokens[o].text, i, o, n, r.id, !0, this.findStatementEnd(t));
    const a = this.nextSig(o);
    return a !== void 0 && this.tokens[a]?.text === ":" ? this.preserveTypeFrom(a + 1, ["=", ";", ",", ")"], r.bodyEndToken) : o;
  }
  addDeclaration(t, n, r, i, s, o, a) {
    const c = this.declarations.length;
    return this.declarations.push({ id: c, name: t, kind: n, tokenIndex: r, scopeId: i, functionId: s, safeToRename: o }), a !== void 0 ? this.pendingSymbols.push({ name: t, id: c, scopeId: i, activateAfter: a }) : this.activateSymbol(t, c, i), c;
  }
  activatePendingSymbols(t) {
    for (let n = this.pendingSymbols.length - 1; n >= 0; n--) {
      const r = this.pendingSymbols[n];
      r.activateAfter >= t || (this.activateSymbol(r.name, r.id, r.scopeId), this.pendingSymbols.splice(n, 1));
    }
  }
  activateSymbol(t, n, r) {
    let i = this.symbolsByScope.get(r);
    i || (i = /* @__PURE__ */ new Map(), this.symbolsByScope.set(r, i)), i.has(t) || i.set(t, n);
  }
  resolve(t, n) {
    for (let r = n.length - 1; r >= 0; r--) {
      const i = this.symbolsByScope.get(n[r])?.get(t);
      if (i !== void 0)
        return i;
    }
  }
  preserveAttribute(t) {
    this.preserveToken(t, "attribute");
    const n = this.nextSig(t);
    if (n === void 0)
      return t;
    this.preserveToken(n, "attribute");
    const r = this.nextSig(n);
    if (r === void 0 || this.tokens[r]?.text !== "(")
      return n;
    const i = this.findMatching(r, "(", ")");
    return i === void 0 ? (this.preserveRange(r, r, "attribute"), r) : (this.preserveRange(r, i, "attribute"), i);
  }
  preserveTypeFrom(t, n, r) {
    let i = 0, s = 0, o = 0, a = t - 1;
    for (let c = t; c < r; c++) {
      const u = this.tokens[c];
      if (!B(u)) {
        if (i === 0 && s === 0 && o === 0 && n.includes(u.text))
          return Math.max(t - 1, c - 1);
        if (u.text === "<")
          i++;
        else if (u.text === ">")
          i = Math.max(0, i - 1);
        else if (u.text === "(")
          s++;
        else if (u.text === ")") {
          if (s === 0 && n.includes(")"))
            return Math.max(t - 1, c - 1);
          s = Math.max(0, s - 1);
        } else u.text === "[" ? o++ : u.text === "]" && (o = Math.max(0, o - 1));
        u.kind === "ident" && this.preserveToken(c, "type"), a = c;
      }
    }
    return a;
  }
  preserveStatement(t, n) {
    const r = this.findStatementEnd(t);
    return this.preserveRange(t, r, n), r;
  }
  preserveRange(t, n, r) {
    for (let i = t; i <= n; i++)
      this.tokens[i] && this.tokens[i].kind !== "lineComment" && this.tokens[i].kind !== "blockComment" && this.preserveToken(i, r);
  }
  preserveToken(t, n) {
    this.preserved.has(t) || this.preserved.set(t, n);
  }
  createScope(t, n, r, i) {
    const s = this.scopes.length;
    return this.scopes.push({ id: s, kind: t, parentId: n, functionId: r, startToken: i }), s;
  }
  nextSig(t) {
    for (let n = t + 1; n < this.tokens.length; n++)
      if (!B(this.tokens[n]))
        return n;
  }
  findNextIdent(t) {
    for (let n = t; n < this.tokens.length; n++) {
      const r = this.tokens[n];
      if (!B(r)) {
        if (r.kind === "ident")
          return n;
        if (r.text !== "@")
          return;
      }
    }
  }
  findNextText(t, n) {
    for (let r = t; r < this.tokens.length; r++)
      if (!B(this.tokens[r]) && this.tokens[r].text === n)
        return r;
  }
  // `<` / `>` are deliberately not tracked here: in a declaration's initializer they are
  // comparison or shift operators, not template brackets, and a net-positive count made this scan
  // overshoot the statement's own `;` (vgpu#251). A WGSL template argument list can never contain
  // `;`, `{` or `}`, so angle depth is not load-bearing for finding a statement end.
  findStatementEnd(t) {
    let n = 0;
    for (let r = t; r < this.tokens.length; r++) {
      const i = this.tokens[r].text;
      if (i === "(")
        n++;
      else if (i === ")")
        n = Math.max(0, n - 1);
      else if (n === 0 && (i === ";" || i === "{" || i === "}"))
        return r;
    }
    return this.tokens.length - 1;
  }
  findMatching(t, n, r) {
    let i = 0;
    for (let s = t; s < this.tokens.length; s++) {
      const o = this.tokens[s].text;
      if (o === n && i++, o === r && (i--, i === 0))
        return s;
    }
  }
  hasEntryAttributeBefore(t) {
    for (let n = t - 1; n >= 0; n--) {
      const r = this.tokens[n];
      if (!B(r)) {
        if (r.text === ")" || r.kind === "ident" || r.text === "@") {
          const i = r.text;
          if (i === "compute" || i === "vertex" || i === "fragment")
            return !0;
          continue;
        }
        break;
      }
    }
    return !1;
  }
  moduleFallback(t, n) {
    this.moduleFallbackReasons.push(`${t} at token ${n}`);
  }
  functionFallback(t, n, r) {
    t.skipped = !0, t.fallbackReasons.push(`${n} at token ${r}`);
  }
}
function So(e, t) {
  for (let n = e.length - 1; n >= 0; n--)
    if (t(e[n]))
      return e[n];
}
function B(e) {
  return e.kind === "lineComment" || e.kind === "blockComment";
}
const vo = /* @__PURE__ */ new Set(["textureSample", "textureSampleBias", "textureSampleLevel", "textureSampleGrad", "textureGather", "textureSampleBaseClampToEdge"]), Eo = /* @__PURE__ */ new Set(["textureSampleCompare", "textureSampleCompareLevel", "textureGatherCompare"]);
function $o(e, t, n) {
  const r = /* @__PURE__ */ new Map();
  for (let i = 0; i < e.length; i++) {
    const s = e[i], o = t[i], a = Jn(s.tokens), c = /* @__PURE__ */ new Map();
    for (const d of o.vars) {
      const f = U(d.attrs, "group"), h = U(d.attrs, "binding"), g = a.declarations.find((w) => w.kind === "global" && w.name === d.name);
      f !== void 0 && h !== void 0 && g && c.set(g.id, { group: f, binding: h });
    }
    const u = /* @__PURE__ */ new Map();
    for (const d of a.declarations) {
      if (d.kind !== "function")
        continue;
      const f = a.functions.find((h) => h.nameTokenIndex === d.tokenIndex);
      f && u.set(d.id, f.id);
    }
    for (const d of o.entries) {
      const f = a.functions.find((b) => b.name === d.name), h = [];
      let g = a.fallback.wholeModule || !f;
      !g && f && (g = !Qn(f.id, /* @__PURE__ */ new Map(), /* @__PURE__ */ new Set(), a, c, u, h));
      const w = f ? Fo(f.id, a, c, u) : n.map(nt);
      r.set(d, g ? Co(n, w) : Lo(h));
    }
  }
  return r;
}
function Qn(e, t, n, r, i, s, o) {
  const a = r.functions[e];
  if (!a || a.skipped)
    return !1;
  const c = `${e}|${[...t].map(([f, h]) => `${f}:${h.group}:${h.binding}`).join(",")}`;
  if (n.has(c))
    return !0;
  n.add(c);
  const u = r.references.filter((f) => f.functionId === e), d = new Map(u.map((f) => [f.tokenIndex, f]));
  for (let f = a.bodyStartToken + 1; f < a.bodyEndToken; f++) {
    const h = r.tokens[f]?.text, g = vo.has(h ?? "") ? "filtering" : Eo.has(h ?? "") ? "comparison" : void 0, w = d.get(f), b = w && s.get(w.declarationId);
    if (!g && b === void 0)
      continue;
    const I = Po(r, f);
    if (I === void 0 || r.tokens[I]?.text !== "(")
      continue;
    const P = To(r, I);
    if (!P)
      return !1;
    const E = P.map(([v, L]) => ko(v, L, r, i, t));
    if (g) {
      const v = h === "textureGather" && !Io(P[0], r, i, t) ? 1 : 0, L = E[v], F = E[v + 1];
      if (!L || !F)
        return !1;
      o.push({ texture: L, sampler: F, mode: g });
    } else {
      const v = r.declarations.filter((F) => F.kind === "param" && F.functionId === b).sort((F, V) => F.tokenIndex - V.tokenIndex), L = /* @__PURE__ */ new Map();
      for (let F = 0; F < v.length; F++)
        E[F] && L.set(v[F].id, E[F]);
      if (!Qn(b, L, n, r, i, s, o))
        return !1;
    }
  }
  return !0;
}
function ko(e, t, n, r, i) {
  for (const s of n.references) {
    if (s.tokenIndex < e || s.tokenIndex > t)
      continue;
    const o = r.get(s.declarationId) ?? i.get(s.declarationId);
    if (o)
      return o;
  }
}
function Io(e, t, n, r) {
  const i = t.references.find((s) => s.tokenIndex >= e[0] && s.tokenIndex <= e[1]);
  return i?.tokenIndex === e[0] ? n.get(i.declarationId) ?? r.get(i.declarationId) : void 0;
}
function To(e, t) {
  const n = [];
  let r = 1, i = 0, s = 0, o = 0, a = t + 1;
  for (let c = t + 1; c < e.tokens.length; c++) {
    const u = e.tokens[c].text;
    if (u === "(")
      r++;
    else if (u === ")") {
      if (r--, r === 0)
        return n.push([a, c - 1]), n;
    } else u === "[" ? i++ : u === "]" ? i-- : u === "{" ? s++ : u === "}" ? s-- : u === "<" ? o++ : u === ">" ? o-- : u === "," && r === 1 && i === 0 && s === 0 && o === 0 && (n.push([a, c - 1]), a = c + 1);
  }
}
function Po(e, t) {
  for (let n = t + 1; n < e.tokens.length; n++)
    if (e.tokens[n].kind !== "lineComment" && e.tokens[n].kind !== "blockComment")
      return n;
}
function Fo(e, t, n, r) {
  const i = [e], s = /* @__PURE__ */ new Set(), o = /* @__PURE__ */ new Map();
  for (; i.length; ) {
    const a = i.pop();
    if (!s.has(a)) {
      s.add(a);
      for (const c of t.references) {
        if (c.functionId !== a)
          continue;
        const u = n.get(c.declarationId);
        u && o.set(`${u.group}:${u.binding}`, u);
        const d = r.get(c.declarationId);
        d !== void 0 && i.push(d);
      }
    }
  }
  return [...o.values()];
}
function Co(e, t) {
  const n = new Set(t.map((o) => `${o.group}:${o.binding}`)), r = e.filter((o) => n.has(`${o.group}:${o.binding}`)), i = r.filter((o) => o.bindingLayout?.kind === "texture" && o.bindingLayout.texture.sampleType === "unfilterable-float" && !o.bindingLayout.texture.multisampled), s = r.filter((o) => o.bindingLayout?.kind === "sampler" && o.bindingLayout.sampler.type === "filtering");
  return i.flatMap((o) => s.map((a) => ({ texture: nt(o), sampler: nt(a), mode: "filtering" })));
}
function nt(e) {
  return { group: e.group, binding: e.binding };
}
function Lo(e) {
  const t = /* @__PURE__ */ new Set();
  return e.filter((n) => {
    const r = `${n.texture.group}:${n.texture.binding}:${n.sampler.group}:${n.sampler.binding}:${n.mode}`;
    return t.has(r) ? !1 : (t.add(r), !0);
  });
}
function Go(e, t) {
  const n = e.map(Es), r = Rs(e, n), i = Ms(n, r), s = [], o = [];
  for (const u of n)
    for (const d of u.vars) {
      const f = U(d.attrs, "group"), h = U(d.attrs, "binding");
      if (f === void 0 || h === void 0)
        continue;
      const g = Q(d.type, d.path, r), w = es(g, d.addressSpace), b = d.addressSpace === "uniform" || d.addressSpace === "storage" ? ke(g, d.addressSpace, d.name, d.mangledName, i) : void 0;
      b && o.push(b), s.push({
        group: f,
        binding: h,
        name: d.name,
        mangledName: d.mangledName,
        type: g,
        kind: w,
        addressSpace: d.addressSpace,
        access: d.access,
        struct: g.kind === "identifier" ? i.structs.get(g.mangledName ?? g.name) : void 0,
        layout: b,
        bindingLayout: ts(w, d.addressSpace, d.access, g, b)
      });
    }
  s.sort((u, d) => u.group - d.group || u.binding - d.binding);
  const a = Uo(e, n, s), c = $o(e, n, s);
  return {
    bindings: s,
    entryPoints: n.flatMap((u) => u.entries.map((d) => Ao(d, n.flatMap((f) => f.structs), r, i, a.get(d) ?? s, c.get(d) ?? []))),
    overrides: n.flatMap((u) => u.overrides),
    featuresRequired: [...new Set(n.flatMap((u) => u.features))],
    aliases: [...i.aliases.values()],
    structs: [...i.structs.values()],
    hostShareableLayouts: o
  };
}
function Uo(e, t, n) {
  const r = /* @__PURE__ */ new Map();
  for (let i = 0; i < e.length; i++) {
    const s = e[i], o = t[i], a = Jn(s.tokens), c = a.fallback.wholeModule, u = /* @__PURE__ */ new Map();
    for (const f of a.declarations) {
      if (f.kind !== "function")
        continue;
      const h = a.functions.find((g) => g.nameTokenIndex === f.tokenIndex);
      h && u.set(f.id, h.id);
    }
    const d = /* @__PURE__ */ new Map();
    for (const f of o.vars) {
      const h = U(f.attrs, "group"), g = U(f.attrs, "binding");
      if (h === void 0 || g === void 0)
        continue;
      const w = a.declarations.find((b) => b.kind === "global" && b.name === f.name);
      w && d.set(w.id, { group: h, binding: g });
    }
    for (const f of o.entries) {
      const h = a.functions.find((I) => I.name === f.name);
      if (c || !h) {
        r.set(f, n);
        continue;
      }
      const g = [h.id], w = /* @__PURE__ */ new Set(), b = /* @__PURE__ */ new Map();
      for (; g.length; ) {
        const I = g.pop();
        if (!w.has(I) && (w.add(I), !!a.functions[I]))
          for (const P of a.references) {
            if (P.functionId !== I)
              continue;
            const E = d.get(P.declarationId);
            E && b.set(`${E.group}:${E.binding}`, E);
            const v = u.get(P.declarationId);
            v !== void 0 && g.push(v);
          }
      }
      r.set(f, [...b.values()].sort((I, P) => I.group - P.group || I.binding - P.binding));
    }
  }
  return r;
}
function Ao(e, t, n, r, i, s) {
  return {
    name: e.name,
    mangledName: e.mangledName,
    stage: e.stage,
    // `workgroupSize` and `inputs` stay absent rather than `undefined`-valued when they do not
    // apply: an own key valued `undefined` survives structuredClone but is dropped by
    // JSON.stringify, which would make the key set differ across serialization boundaries.
    ...e.workgroupSize ? { workgroupSize: e.workgroupSize } : {},
    bindings: i.map(({ group: o, binding: a }) => ({ group: o, binding: a })),
    samplingPairs: s,
    ...e.stage === "vertex" ? { inputs: Ro(e, t, n, r) } : {}
  };
}
function Ro(e, t, n, r) {
  const i = [];
  for (const s of e.params) {
    if (Kt(s.attrs, "builtin"))
      continue;
    const o = Q(s.type, e.path, n), a = U(s.attrs, "location");
    if (a !== void 0) {
      i.push({ name: s.name, location: a, type: o });
      continue;
    }
    const c = fe(o, r);
    if (c.kind !== "identifier")
      continue;
    const u = t.find((f) => f.mangledName === (c.mangledName ?? c.name)), d = r.structs.get(c.mangledName ?? c.name);
    if (u)
      for (let f = 0; f < u.members.length; f++) {
        const h = u.members[f];
        if (Kt(h.attrs, "builtin"))
          continue;
        const g = U(h.attrs, "location");
        g !== void 0 && i.push({ name: h.name, location: g, type: d?.members[f]?.type ?? Q(h.type, u.path, n) });
      }
  }
  return i;
}
function Kt(e, t) {
  return e.some((n) => n.name === t);
}
function er(e, t = "<runtime>") {
  const n = mo(e, t), r = Yi(n);
  if (r.imports.length > 0)
    throw T("VGPU-WGSL-REFLECT-SOURCE-IMPORT", "reflectSource() accepts a single raw WGSL string; use resolveShader() for WGSL import graphs.");
  return Go([{ path: t, source: e, tokens: n, parsed: r }]);
}
function tr() {
  const e = /* @__PURE__ */ new Map();
  return {
    getOrCreate(t, n, r, i) {
      const s = r.map(rt), o = `${t}:${n}:${s.join("|")}`, a = e.get(o);
      if (a)
        return a.bindGroup;
      const c = i();
      return e.set(o, { identities: s, bindGroup: c }), c;
    },
    evictIdentity(t) {
      const n = rt(t);
      for (const [r, i] of e)
        i.identities.includes(n) && e.delete(r);
    },
    clearDraw(t) {
      const n = `${t}:`;
      for (const r of e.keys())
        r.startsWith(n) && e.delete(r);
    },
    dispose() {
      e.clear();
    }
  };
}
function rt(e) {
  return typeof e == "string" || typeof e == "number" ? String(e) : `${e.kind}:${e.id}`;
}
function Ne(e, t, n) {
  const r = e[t];
  if (!r)
    throw new m({
      code: "VGPU-REFLECT-ENTRY-METADATA-MISSING",
      message: `Entry point '${e.name}' has no reflected ${t}.`,
      fix: "Pass the reflection from reflectSource()/resolveShader().",
      where: n
    });
  return r;
}
const Oe = /* @__PURE__ */ new WeakMap();
function xe(e, t) {
  if (!e.gpu.pushErrorScope || !e.gpu.popErrorScope)
    return;
  e.gpu.pushErrorScope("validation");
  const n = Oe.get(e.gpu);
  n ? n.push(t) : Oe.set(e.gpu, [t]);
}
function R(e) {
  const t = Oe.get(e.gpu);
  if (!t?.length || !e.gpu.popErrorScope)
    return;
  const n = t.pop();
  return t.length || Oe.delete(e.gpu), { context: n, error: e.gpu.popErrorScope() };
}
function nr(e) {
  const t = [];
  let n = R(e);
  for (; n; )
    t.push(n), n = R(e);
  return t;
}
function Do(e) {
  const t = R(e);
  t && gt(t);
}
function rr(e) {
  for (const t of nr(e))
    gt(t);
}
function G(e) {
  for (const t of e)
    gt(t);
}
function mt(e) {
  return e.gpu.queue.onSubmittedWorkDone?.() ?? Promise.resolve();
}
function ir(e, t = [], n = {}) {
  return Vo(e, t, n.errorSink ?? No);
}
function _e(e, t) {
  return {
    context: e.context,
    error: Mo(e.error, t.error)
  };
}
async function Mo(e, t) {
  const n = await Promise.allSettled([e, t]);
  for (const i of n)
    if (i.status === "fulfilled" && i.value)
      return i.value;
  const r = n.find((i) => i.status === "rejected");
  if (r?.status === "rejected")
    throw r.reason;
  return null;
}
async function Vo(e, t, n) {
  await mt(e);
  for (const r of t)
    try {
      const i = await r.error;
      i && await n(ce(r.context.label, r.context.group, i));
    } catch (i) {
      await n(ce(r.context.label, r.context.group, i));
    }
}
function gt(e) {
  e.error.catch(() => {
  });
}
function No(e) {
  console.error(e);
}
function sr(e, t, n, r) {
  try {
    t.end();
  } catch (i) {
    const s = nr(e);
    G(n), G(s), n.length = 0;
    const o = s[0]?.context ?? r;
    throw o ? ce(o.label, o.group, i) : i;
  }
}
let Oo = 1;
const qt = /* @__PURE__ */ new WeakMap();
function _o(e) {
  return e === null || typeof e != "object" || ArrayBuffer.isView(e) || e instanceof ArrayBuffer || Array.isArray(e) ? !0 : e instanceof q || e instanceof ue ? !1 : !ar(e);
}
function it(e) {
  return typeof e != "object" || e === null || Array.isArray(e) || ArrayBuffer.isView(e) || e instanceof ArrayBuffer || e instanceof q || e instanceof ue ? !1 : !ar(e);
}
function Ht(e, t, n) {
  switch (e.bindingLayout?.kind) {
    case "buffer":
      return Bo(e, t, n);
    case "texture":
      return zo(e, t, n);
    case "sampler":
      return Wo(e, t);
    case "storageTexture":
      throw z(e, "storage texture", "Pass a storage-compatible texture.");
    case "externalTexture":
      throw z(e, "external texture", "Pass a compatible GPUExternalTexture.");
    default:
      throw z(e, "reflected resource", "Fix shader reflection bindingLayout.");
  }
}
function Bo(e, t, n) {
  const r = qi(t);
  if (r)
    return r[Vn](e, n.sourceHint);
  if (t instanceof q)
    return _t(t, `${n.sourceHint}.set`), Ko(e, t.options.usage), { resource: { buffer: t.gpu }, identity: t.resourceIdentity, unsubscribe: (i) => t.onDestroy(i) };
  if (Ho(t))
    return _t(t.buffer, `${n.sourceHint}.set`), { resource: { buffer: t.gpu, offset: 0, size: t.size }, identity: t.buffer.resourceIdentity, unsubscribe: (i) => t.buffer.onDestroy(i) };
  if (ur(t))
    return { resource: t, identity: ve(t.buffer) };
  if (bt(t))
    return { resource: { buffer: t }, identity: ve(t) };
  throw z(e, "buffer", `Pass a compatible Buffer/Uniform: ${e.name}.set({ ${e.name}: gpu.device.createBuffer(...) }).`);
}
function zo(e, t, n) {
  const r = or(t);
  if (r) {
    const i = r.color;
    Xt(e, i, n);
    const s = r.onTexturesRecreated?.bind(r);
    return { resource: i.createView(), identity: i.resourceIdentity, unsubscribe: (o) => r.onDestroy(o), onRecreate: s ? (o) => s(o) : void 0 };
  }
  if (t instanceof ue)
    return qo(e, t.usage), Xt(e, t, n), { resource: t.createView(), identity: t.resourceIdentity, unsubscribe: (i) => t.onDestroy(i) };
  if (cr(t))
    return { resource: t.createView(), identity: t.resourceIdentity ?? ve(t) };
  if (typeof t == "object" && t !== null)
    return { resource: t, identity: ve(t) };
  throw z(e, "texture/target", `Pass a Texture or Target: ${e.name}.set({ ${e.name}: scene.color }) or set({ ${e.name}: scene }).`);
}
function Wo(e, t) {
  if (jo(t))
    return { resource: t, identity: ve(t) };
  throw z(e, "sampler", `Use the cached sampler: set({ ${e.name}: sampler(gpu) }).`);
}
function jo(e) {
  return typeof e != "object" || e === null || e instanceof q || e instanceof ue ? !1 : !bt(e) && !ur(e) && !cr(e) && !or(e);
}
function Ko(e, t) {
  const n = e.bindingLayout?.kind === "buffer" ? e.bindingLayout.buffer.type : void 0;
  if (n === "uniform" && !t.includes("uniform"))
    throw z(e, "uniform buffer", "Create with usage: ['uniform','copy_dst'].");
  if ((n === "storage" || n === "read-only-storage") && !t.includes("storage"))
    throw z(e, "storage buffer", "Create with usage: ['storage','copy_dst'].");
}
function qo(e, t) {
  if (!t.includes("texture_binding") && !t.includes("render_attachment"))
    throw z(e, "sampled texture", "Use texture_binding usage or a sampleable Target.");
}
function Xt(e, t, n) {
  if (!(!n.filterableTexture || n.float32Filterable) && (t.format === "r32float" || t.format === "rg32float" || t.format === "rgba32float"))
    throw hi(n.sourceHint, e, t.format, t.label ?? "texture", n.pairedSampler);
}
function or(e) {
  if (typeof e != "object" || e === null)
    return;
  const t = e;
  if (!(!t.resourceIdentity || !t.color || typeof t.onDestroy != "function"))
    return t;
}
function ar(e) {
  const t = e;
  return "gpu" in t || "bindGroup" in t || "createView" in t || "resourceIdentity" in t;
}
function ve(e) {
  if (typeof e != "object" || e === null)
    return `value:${String(e)}`;
  let t = qt.get(e);
  return t || (t = { kind: "external", id: Oo++ }, qt.set(e, t)), t;
}
function Ho(e) {
  return typeof e == "object" && e !== null && "gpu" in e && "size" in e && "buffer" in e && e.buffer instanceof q;
}
function cr(e) {
  return typeof e == "object" && e !== null && typeof e.createView == "function";
}
function ur(e) {
  return typeof e == "object" && e !== null && "buffer" in e && bt(e.buffer);
}
function bt(e) {
  return typeof e == "object" && e !== null && "size" in e && "usage" in e && typeof e.destroy == "function";
}
function Xo(e, t) {
  Yo(e);
  const n = new ArrayBuffer(e.size);
  return wt(new DataView(n), e, 0, t), n;
}
function Yo(e) {
  if (e.size === void 0)
    throw D("set", `No se puede inferir byteLength para layout runtime-sized '${e.name}'.`);
}
function wt(e, t, n, r) {
  if (t.members)
    return Zo(e, t.members, n, r);
  Jo(e, t, n, r);
}
function Zo(e, t, n, r) {
  const i = r;
  for (const s of t)
    wt(e, s.layout, n + s.offset, i?.[s.name]);
}
function Jo(e, t, n, r) {
  switch (t.type.kind) {
    case "scalar":
      return yt(e, n, t.type.name, r);
    case "vector":
      return Qo(e, n, t.type, r);
    case "matrix":
      return ea(e, t, n, r);
    case "array":
      return ta(e, t, n, r);
    default:
      throw D("set", `No hay writer para layout ${t.type.kind}.`);
  }
}
function yt(e, t, n, r) {
  n === "f32" ? e.setFloat32(t, Number(r ?? 0), !0) : n === "i32" ? e.setInt32(t, Number(r ?? 0), !0) : n === "u32" || n === "bool" ? e.setUint32(t, n === "bool" ? r ? 1 : 0 : Number(r ?? 0), !0) : e.setUint16(t, na(Number(r ?? 0)), !0);
}
function Qo(e, t, n, r) {
  const i = r, s = dr(n.element);
  for (let o = 0; o < n.width; o++)
    yt(e, t + o * s, xt(n.element), i?.[o] ?? 0);
}
function ea(e, t, n, r) {
  const i = t.type, s = r, o = dr(i.element), a = t.stride ?? 16;
  for (let c = 0; c < i.columns; c++)
    for (let u = 0; u < i.rows; u++)
      yt(e, n + c * a + u * o, xt(i.element), s?.[c * i.rows + u] ?? 0);
}
function ta(e, t, n, r) {
  const i = r, s = t.stride ?? t.element?.size ?? 0;
  if (!t.element)
    throw D("set", "Array layout sin element layout.");
  for (let o = 0; o < (i?.length ?? 0); o++)
    wt(e, t.element, n + o * s, i[o]);
}
function dr(e) {
  return xt(e) === "f16" ? 2 : 4;
}
function xt(e) {
  if (e.kind !== "scalar")
    throw D("set", `Expected scalar, got ${e.kind}`);
  return e.name;
}
function na(e) {
  const t = new Float32Array(1), n = new Uint32Array(t.buffer);
  t[0] = e;
  const r = n[0], i = r >> 16 & 32768, s = r & 8388607, o = r >> 23 & 255;
  if (o === 255)
    return i | (s ? 32256 : 31744);
  const a = o - 127 + 15;
  return a >= 31 ? i | 31744 : a <= 0 ? a < -10 ? i : i | (s | 8388608) >> 1 - a + 13 : i | a << 10 | s >> 13;
}
const Yt = /* @__PURE__ */ new WeakMap();
function ra(e, t) {
  const n = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Set();
  for (const s of t) {
    const o = s.stage === "vertex" ? 1 : s.stage === "fragment" ? 2 : 4;
    for (const a of Ne(s, "bindings", "visibility")) {
      const c = `${a.group}:${a.binding}`;
      n.set(c, (n.get(c) ?? 0) | o);
    }
    for (const a of Ne(s, "samplingPairs", "visibility"))
      a.mode === "filtering" && r.add(`${a.texture.group}:${a.texture.binding}`);
  }
  const i = (s) => n.get(`${s.group}:${s.binding}`) ?? 0;
  return Object.defineProperty(i, "filterable", { value: r }), i;
}
function fr(e, t, n = St) {
  return e.flatMap((r) => {
    if (r.group !== t)
      return [];
    const i = n(r);
    return i === 0 ? [] : [{ binding: r.binding, visibility: i, ...oa(r, n.filterable?.has(`${r.group}:${r.binding}`) ?? !1) }];
  });
}
function ia(e, t, n, r = St) {
  const i = /* @__PURE__ */ new Map(), s = n.bindings.filter((a) => r(a) !== 0).map((a) => a.group), o = Math.max(-1, ...s);
  for (let a = 0; a <= o; a++)
    i.set(a, sa(e, t, n, a, r));
  return i;
}
function sa(e, t, n, r, i = St) {
  return lr(e, `${t}.group${r}.bgl`, fr(n.bindings, r, i));
}
function lr(e, t, n) {
  let r = Yt.get(e.gpu);
  r || (r = /* @__PURE__ */ new Map(), Yt.set(e.gpu, r));
  const i = JSON.stringify(n), s = r.get(i);
  if (s)
    return s;
  const o = di(e.gpu.createBindGroupLayout({ label: t, entries: n }), { entries: n });
  return r.set(i, o), o;
}
function oa(e, t) {
  const n = e.bindingLayout;
  if (!n)
    throw D("bindGroupLayout", `Binding '${e.name}' does not have a reflected bindingLayout.`);
  return t && n.kind === "texture" && n.texture.sampleType === "unfilterable-float" && !n.texture.multisampled ? { texture: { ...n.texture, sampleType: "float" } } : aa(n);
}
function aa(e) {
  switch (e.kind) {
    case "buffer":
      return { buffer: { ...e.buffer } };
    case "sampler":
      return { sampler: { ...e.sampler } };
    case "texture":
      return { texture: { ...e.texture } };
    case "storageTexture":
      return { storageTexture: { ...e.storageTexture } };
    case "externalTexture":
      return { externalTexture: {} };
  }
}
function St(e) {
  const t = globalThis.GPUShaderStage, n = t?.VERTEX ?? 1, r = t?.FRAGMENT ?? 2, i = t?.COMPUTE ?? 4;
  return e.kind === "buffer" ? n | r | i : r | i;
}
function ca(e) {
  const t = ua(e.reflection), n = [...e.bindGroupLayouts.keys()].sort((l, p) => l - p), r = /* @__PURE__ */ new Map();
  function i(l) {
    const p = [];
    for (const [y, S] of Object.entries(l))
      p.push(...o(y, S));
    return p;
  }
  function s(l) {
    const p = e.bindGroupLayouts.get(l.info.group);
    return !!p && !!ye(p)?.entries.some((y) => y.binding === l.info.binding);
  }
  function o(l, p) {
    const y = t.get(l);
    if (y)
      return a(y, l, p);
    const S = da(l, t, e.label);
    if (!S)
      throw D(`${e.label}.set`, `Binding '${l}' does not exist in '${e.label}'.`);
    return c(S, l, p);
  }
  function a(l, p, y) {
    F(l.info.group);
    const S = Zt(l.info, y);
    Jt(l, p, S);
    const $ = Re(l.identity);
    return S === "lib" ? u(l, pa(l.libValue, y)) : f(l, y), s(l) ? Ye(l, $) : [];
  }
  function c(l, p, y) {
    F(l.info.group);
    const S = Zt(l.info, y);
    if (Jt(l, p, S), fa(l, p, S), S !== "lib")
      throw D(`${e.label}.set`, `Member '${p}' needs a JS value; set resource '${l.info.name}' instead.`);
    const $ = Re(l.identity);
    return u(l, { ...ma(l.libValue), [p]: y }), s(l) ? Ye(l, $) : [];
  }
  function u(l, p) {
    const y = ne(l);
    l.libValue = p;
    const S = Xo(y, p);
    l.buffer || V(l, y.size), l.bytes = S, l.buffer.write(S, 0);
  }
  function d(l) {
    const p = ye(e.bindGroupLayouts.get(l.group))?.entries.find(($) => $.binding === l.binding), y = e.reflection.entryPoints.flatMap(($) => Ne($, "samplingPairs", e.label)).find(($) => $.mode === "filtering" && $.texture.group === l.group && $.texture.binding === l.binding), S = y && e.reflection.bindings.find(($) => $.group === y.sampler.group && $.binding === y.sampler.binding);
    return { sourceHint: e.label, filterableTexture: p?.texture?.sampleType === "float", float32Filterable: e.device.features.has("float32-filterable"), pairedSampler: S };
  }
  function f(l, p) {
    const y = Ht(l.info, p, d(l.info));
    l.unsubscribe?.(), l.unsubscribeRecreate?.(), l.resource = y.resource, l.identity = y.identity, l.unsubscribe = y.unsubscribe?.(() => {
      l.identity && e.cache.evictIdentity(l.identity);
    }), l.unsubscribeRecreate = y.onRecreate?.(() => h(l, p));
  }
  function h(l, p) {
    const y = Re(l.identity);
    l.identity && e.cache.evictIdentity(l.identity);
    const S = Ht(l.info, p, d(l.info));
    if (l.unsubscribe?.(), l.unsubscribeRecreate?.(), l.resource = S.resource, l.identity = S.identity, l.unsubscribe = S.unsubscribe?.(() => {
      l.identity && e.cache.evictIdentity(l.identity);
    }), l.unsubscribeRecreate = S.onRecreate?.(() => h(l, p)), s(l))
      for (const $ of Ye(l, y))
        e.onIdentityChange?.($);
  }
  function g(l, p, y) {
    w(l), la(e.label, l, p, y);
    const S = r.has(l) ? `claimed-group:${l}` : void 0;
    return r.set(l, p), S;
  }
  function w(l) {
    const p = e.bindGroupLayouts.get(l);
    if (!p)
      throw D(`${e.label}.layout`, `@group(${l}) does not exist in '${e.label}'.`);
    return p;
  }
  function b() {
    return n.map(I);
  }
  function I(l) {
    const p = r.get(l);
    if (p)
      return { group: l, bindGroup: p, offsets: [], claimValidation: P(p, l) };
    const y = new Set(ye(w(l))?.entries.map((re) => re.binding)), S = e.reflection.bindings.filter((re) => re.group === l && y.has(re.binding)), $ = E(S), le = v(S), he = e.cache.getOrCreate(e.drawId, l, le, () => e.device.gpu.createBindGroup({
      label: `${e.label}.group${l}`,
      layout: w(l),
      entries: $
    }));
    return { group: l, bindGroup: he, offsets: [] };
  }
  function P(l, p) {
    return Un(l) ? void 0 : { label: e.label, group: p };
  }
  function E(l) {
    return l.map((p) => {
      const y = L(p);
      return { binding: p.binding, resource: y.resource };
    });
  }
  function v(l) {
    return l.map((p) => L(p).identity);
  }
  function L(l) {
    const p = t.get(l.name);
    if (!p?.resource || !p.identity)
      throw pi(e.label, l);
    return p;
  }
  function F(l) {
    if (r.has(l))
      throw mi(e.label, l);
  }
  function V(l, p) {
    l.buffer = e.device.createBuffer({ size: p, usage: ["uniform", "copy_dst"], label: `${e.label}.${l.info.name}` }), l.resource = { buffer: l.buffer.gpu, offset: 0, size: p }, l.identity = l.buffer.resourceIdentity, l.unsubscribe = l.buffer.onDestroy(() => e.cache.evictIdentity(l.buffer.resourceIdentity));
  }
  function ne(l) {
    if (l.info.kind !== "buffer" || !l.info.layout?.size)
      throw D(`${e.label}.set`, `Binding '${l.info.name}' needs a compatible resource, not JS.`);
    return l.info.layout;
  }
  return {
    get groups() {
      return n;
    },
    set: i,
    claimGroup: g,
    layout: w,
    bindGroups: b,
    bindingState(l) {
      const p = t.get(l);
      if (!(!p?.ownership || !p.resource || !p.identity))
        return { info: p.info, ownership: p.ownership, resource: p.resource, identity: p.identity };
    }
  };
}
function ua(e) {
  return new Map(e.bindings.map((t) => [t.name, { info: t, memberOwnership: /* @__PURE__ */ new Map() }]));
}
function da(e, t, n) {
  let r;
  for (const i of t.values())
    if (i.info.layout?.members?.some((s) => s.name === e)) {
      if (r)
        throw D(`${n}.set`, `Binding member '${e}' is ambiguous in '${n}'; set the complete binding.`);
      r = i;
    }
  return r;
}
function Zt(e, t) {
  return e.bindingLayout?.kind === "buffer" && _o(t) ? "lib" : "user";
}
function Jt(e, t, n) {
  if (e.ownership && e.ownership !== n)
    throw An(t, e.ownership);
  e.ownership ??= n;
}
function fa(e, t, n) {
  const r = e.memberOwnership.get(t);
  if (r && r !== n)
    throw An(t, r);
  e.memberOwnership.set(t, n);
}
function la(e, t, n, r) {
  const i = Un(n);
  if (!i)
    return;
  const s = ye(r);
  if (!s)
    return;
  const o = ha(s.entries, i.layout.entries);
  if (o)
    throw gi(e, t, o);
}
function ha(e, t) {
  if (e.length !== t.length)
    return `expected ${e.length} bindings and received ${t.length}`;
  const n = Qt(e), r = Qt(t);
  for (const [i, s] of n) {
    const o = r.get(i);
    if (!o)
      return `missing @binding(${i})`;
    if (en(s) !== en(o))
      return `@binding(${i}) does not match the reflected layout`;
  }
}
function Qt(e) {
  return new Map(e.map((t) => [t.binding, t]));
}
function en(e) {
  return JSON.stringify({
    binding: e.binding,
    visibility: e.visibility,
    buffer: e.buffer,
    sampler: e.sampler,
    texture: e.texture,
    storageTexture: e.storageTexture,
    externalTexture: e.externalTexture ? {} : void 0
  });
}
function Ye(e, t) {
  const n = Re(e.identity);
  return !n || t === n ? [] : [{
    group: e.info.group,
    binding: e.info.binding,
    bindingName: e.info.name,
    bindingKind: e.info.kind,
    previousIdentity: t,
    newIdentity: n
  }];
}
function Re(e) {
  return e === void 0 ? void 0 : rt(e);
}
function pa(e, t) {
  return it(e) && it(t) ? { ...e, ...t } : t;
}
function ma(e) {
  return it(e) ? e : {};
}
const hr = Object.freeze([0, 0, 0, 1]);
function tn(e, t) {
  const n = e, r = Array.isArray(e) ? e : [n?.r, n?.g, n?.b, n?.a];
  if (r.length !== 4 || !r.every((i) => typeof i == "number" && Number.isFinite(i)))
    throw Ai(t);
  return pr(e);
}
function pr(e) {
  const t = e;
  return Array.isArray(e) ? [e[0], e[1], e[2], e[3]] : { r: t.r, g: t.g, b: t.b, a: t.a };
}
function vt(e) {
  return !!e && e.includes("stencil");
}
function ga(e) {
  return Array.isArray(e) ? { r: e[0], g: e[1], b: e[2], a: e[3] } : e;
}
function ba(e, t) {
  return e[0] === t[0] && e[1] === t[1];
}
function Ke(e) {
  return typeof e == "object" && e !== null && typeof e.renderPassDescriptor == "function";
}
let wa = 1, ya = 1;
const xa = /* @__PURE__ */ new WeakMap(), Sa = /* @__PURE__ */ new WeakMap();
function va(e) {
  return Ke(e) ? {
    colors: e.colors.map((t) => t.format),
    depth: e.depth?.format,
    sampleCount: e.sampleCount
  } : typeof e != "object" || e === null ? { colors: [] } : {
    colors: Array.isArray(e.colors) ? [...e.colors] : e.colors ?? [],
    depth: e.depth,
    sampleCount: e.sampleCount ?? 1
  };
}
function mr(e) {
  return `${e.colors.join(",")}:${e.depth ?? "none"}:${e.sampleCount ?? 1}`;
}
function Ea(e, t) {
  if (!Array.isArray(e.colors) || e.colors.length === 0)
    throw Pe(t, "colors must be a non-empty array.");
  const n = e.colors.find((i) => typeof i != "string" || i.length === 0);
  if (n !== void 0)
    throw Pe(t, `colors must contain only GPUTextureFormat strings; received ${String(n)}.`);
  if (e.depth !== void 0 && (typeof e.depth != "string" || e.depth.length === 0))
    throw Pe(t, "depth must be a GPUTextureFormat string.");
  const r = e.sampleCount ?? 1;
  if (r !== 1 && r !== 4)
    throw Pe(t, `sampleCount must be 1 or 4; received ${String(r)}.`);
}
function $a(e) {
  const t = `${on(xa, e.module, () => wa++)}|${on(Sa, e.pipelineLayout, () => ya++)}|${Ca(e.vertexBufferLayouts ?? [])}|${mr(e.signature)}`, n = e.topology || e.stripIndexFormat ? `${t}|${e.topology ?? "triangle-list"}|${e.stripIndexFormat ?? "none"}` : t, r = e.cullMode || e.frontFace ? `${n}|${e.cullMode ?? "none"}|${e.frontFace ?? "ccw"}` : n, i = e.unclippedDepth ? `${r}|unclipped` : r, s = e.depthKey ? `${i}|${e.depthKey}` : i, o = e.stencilKey ? `${s}|${e.stencilKey}` : s, a = e.multisampleKey ? `${o}|${e.multisampleKey}` : o, c = e.constantsKey ? `${a}|${e.constantsKey}` : a, u = e.entryKey ? `${c}|${e.entryKey}` : c;
  return e.fragmentKey ? `${u}|${e.fragmentKey}` : u;
}
function nn(e, t, n, r, i) {
  if (r === void 0)
    return t.find((o) => o.stage === n);
  if (typeof r != "string")
    throw Ue(e, `${n} received ${st(r)}; expected an entry point name string.`, i);
  const s = t.find((o) => o.name === r);
  if (!s)
    throw Ue(e, `"${r}" matches no entry point in the shader; available entry points: ${rn(t)}.`, i);
  if (s.stage !== n)
    throw Ue(e, `"${r}" is a @${s.stage} entry point, not @${n}; available entry points: ${rn(t)}.`, i);
  return s;
}
function rn(e) {
  return e.length ? e.map((t) => `"${t.name}" (@${t.stage})`).join(", ") : "none";
}
function ka(e, t, n, r) {
  if (t !== void 0 && (typeof t != "object" || t === null || Array.isArray(t)))
    throw Te(e, `received ${st(t)}; expected { overrideNameOrId: number | boolean }.`, r);
  const i = new Map(n.map((o) => [sn(o), o])), s = {};
  for (const [o, a] of Object.entries(t ?? {})) {
    if (!i.has(o))
      throw Te(e, `"${o}" matches no override in the shader; available overrides: ${Ia(n)}.`, r);
    if (typeof a == "boolean") {
      s[o] = a ? 1 : 0;
      continue;
    }
    if (typeof a != "number" || !Number.isFinite(a))
      throw Te(e, `"${o}" received ${st(a)}; use a finite number or a boolean (WebGPU converts the value to the override's WGSL type, and NaN/Infinity fail that conversion).`, r);
    s[o] = a;
  }
  for (const o of n) {
    const a = sn(o);
    if (o.defaultValue === void 0 && !(a in s))
      throw Te(e, `override '${o.name}' has no default value and must be provided; add constants: { "${a}": value }.`, r);
  }
  return Object.keys(s).length === 0 ? {} : { constants: s, constantsKey: Ta(s) };
}
function sn(e) {
  return e.id !== void 0 ? String(e.id) : e.name;
}
function Ia(e) {
  return e.length ? e.map((t) => t.id !== void 0 ? `"${t.id}" (@id of ${t.name})` : `"${t.name}"`).join(", ") : "none";
}
function Ta(e) {
  return `cn~${Object.entries(e).sort(([t], [n]) => t < n ? -1 : t > n ? 1 : 0).map(([t, n]) => `${t}=${n}`).join("~")}`;
}
function st(e) {
  if (typeof e == "string")
    return `"${e}"`;
  try {
    return JSON.stringify(e) ?? String(e);
  } catch {
    return String(e);
  }
}
function gr(e) {
  const t = /* @__PURE__ */ new Map();
  return {
    get(n, r) {
      let i = t.get(n);
      return i || (i = e.gpu.createShaderModule({ label: r, code: n }), t.set(n, i)), i;
    },
    dispose() {
      t.clear();
    }
  };
}
function br(e) {
  const t = /* @__PURE__ */ new Map();
  return {
    get(n) {
      const r = La(n);
      let i = t.get(r);
      return i || (i = e.gpu.createPipelineLayout({ bindGroupLayouts: Ga(n) }), t.set(r, i)), i;
    },
    dispose() {
      t.clear();
    }
  };
}
function wr(e, t = {}) {
  return new Pa(e, t);
}
class Pa {
  device;
  #e = /* @__PURE__ */ new Map();
  #t = /* @__PURE__ */ new Set();
  #r;
  #n;
  #s = !1;
  constructor(t, n) {
    this.device = t, this.#r = n.errorSink ?? (() => {
    }), this.#n = n.registerSettledSource?.(() => [...this.#t]);
  }
  getReady(t) {
    return this.#e.get(t)?.pipeline;
  }
  getSync(t, n, r) {
    this.#u(r.where);
    const i = this.#e.get(t);
    if (i?.pipeline)
      return i.pipeline;
    const s = i ?? {};
    i || this.#e.set(t, s);
    const o = this.#i(t, s, n, r);
    if (!o) {
      s.pending || this.#e.delete(t);
      return;
    }
    return s.pipeline = o, s.pending?.resolve(o), s.pending = void 0, o;
  }
  getAsync(t, n, r) {
    this.#u(r.where);
    const i = this.#e.get(t);
    if (i?.pipeline)
      return Promise.resolve(i.pipeline);
    if (i?.pending)
      return i.pending.promise;
    const s = {}, o = Fa();
    s.pending = o, this.#e.set(t, s);
    let a;
    try {
      a = n();
    } catch (c) {
      const u = me(r.where, c, r.signature);
      return o.reject(u), this.#e.delete(t), o.promise;
    }
    return this.#d(a), a.then((c) => {
      this.#e.get(t) !== s || s.pipeline || s.pending !== o || (s.pipeline = c, s.pending = void 0, o.resolve(c));
    }, (c) => {
      this.#e.get(t) !== s || s.pipeline || s.pending !== o || (s.pending = void 0, this.#e.delete(t), o.reject(me(r.where, c, r.signature)));
    }), o.promise;
  }
  dispose() {
    if (this.#s)
      return;
    this.#s = !0;
    const t = Vt("gpu.dispose");
    for (const n of this.#e.values())
      n.pending?.reject(t);
    this.#e.clear(), this.#t.clear(), this.#n?.();
  }
  #i(t, n, r, i) {
    const s = this.device.gpu, o = typeof s.pushErrorScope == "function" && typeof s.popErrorScope == "function";
    o && s.pushErrorScope("validation");
    try {
      const a = r();
      return o && this.#a(t, n, i), a;
    } catch (a) {
      o && this.#c();
      const c = me(i.where, a, i.signature);
      this.#r(c);
      return;
    }
  }
  #a(t, n, r) {
    const i = this.device.gpu.popErrorScope().then((s) => {
      if (!s)
        return;
      const o = me(r.where, s, r.signature);
      return this.#e.get(t) === n && this.#e.delete(t), this.#r(o);
    }, (s) => {
      const o = me(r.where, s, r.signature);
      return this.#e.get(t) === n && this.#e.delete(t), this.#r(o);
    });
    this.#d(i);
  }
  #c() {
    const t = this.device.gpu.popErrorScope?.();
    t && t.catch(() => {
    });
  }
  #u(t) {
    if (this.#s)
      throw Vt(t);
  }
  #d(t) {
    this.#t.add(t), t.catch(() => {
    }).then(() => this.#t.delete(t), () => this.#t.delete(t));
  }
}
function Fa() {
  let e, t;
  const n = new Promise((r, i) => {
    e = r, t = i;
  });
  return n.catch(() => {
  }), { promise: n, resolve: e, reject: t };
}
function on(e, t, n) {
  let r = e.get(t);
  return r || (r = n(), e.set(t, r)), r;
}
function Ca(e) {
  return JSON.stringify(e.map((t) => ({
    arrayStride: t.arrayStride,
    stepMode: t.stepMode ?? "vertex",
    attributes: [...t.attributes].map((n) => ({
      shaderLocation: n.shaderLocation,
      offset: n.offset,
      format: n.format
    }))
  })));
}
function La(e) {
  return JSON.stringify([...e.entries()].map(([t, n]) => ({ group: t, entries: Aa(n) })));
}
function Ga(e) {
  const t = Math.max(-1, ...e.keys()), n = [];
  for (let r = 0; r <= t; r++)
    n.push(Ua(e, r));
  return n;
}
function Ua(e, t) {
  const n = e.get(t);
  if (!n)
    throw Pi(t);
  return n;
}
function Aa(e) {
  return (ye(e)?.entries ?? []).map((t) => ({
    binding: t.binding,
    visibility: t.visibility,
    buffer: t.buffer ? { ...t.buffer } : void 0,
    sampler: t.sampler ? { ...t.sampler } : void 0,
    texture: t.texture ? { ...t.texture } : void 0,
    storageTexture: t.storageTexture ? { ...t.storageTexture } : void 0,
    externalTexture: t.externalTexture ? { ...t.externalTexture } : void 0
  }));
}
const Ra = $e("frame-state");
function Et(e) {
  return e.service(Ra, Da);
}
function Da() {
  const e = /* @__PURE__ */ new Set();
  let t = an(), n = !1, r = !1;
  const i = {
    time: 0,
    deltaTime: 0,
    frameCount: 0,
    advanceBy(s) {
      i.deltaTime = s, i.time += s, r = !0;
    },
    tick() {
      if (n)
        throw Dn();
      n = !0;
      try {
        const s = an();
        r ? r = !1 : (i.deltaTime = Math.max(0, (s - t) / 1e3), i.time += i.deltaTime), t = s, i.frameCount += 1;
        for (const o of [...e])
          o();
      } finally {
        n = !1;
      }
    },
    onAdvance(s) {
      return e.add(s), () => {
        e.delete(s);
      };
    }
  };
  return i;
}
function an() {
  return globalThis.performance?.now?.() ?? Date.now();
}
function Ma(e, t, n = {}) {
  const r = We(e, "surface"), i = Na(r), s = i.get(t);
  if (s && !s.disposed)
    throw Ci(s.label);
  const o = new xr(r.device, t, n, (u) => {
    i.get(u.canvas) === u && i.delete(u.canvas), a(), c();
  }), a = Et(r).onAdvance(() => o.applyAutoResize()), c = r.own("resource", () => o.dispose());
  return i.set(t, o), o;
}
const Va = $e("surfaces");
function Na(e) {
  return e.service(Va, () => /* @__PURE__ */ new Map());
}
let we = 0, $t = 0;
function Oa() {
  return we > 0;
}
function _a() {
  return $t > 0;
}
function Ba() {
  $t += 1;
}
function za() {
  $t -= 1;
}
function yr(e) {
  return e instanceof xr;
}
class xr {
  device;
  canvas;
  options;
  unregister;
  resourceIdentity = ct("render-target");
  label;
  context;
  autoResize;
  layoutBacked;
  format;
  #e = new ut();
  #t = /* @__PURE__ */ new Set();
  #r = /* @__PURE__ */ new Set();
  #n;
  #s;
  #i = !1;
  #a = !1;
  constructor(t, n, r, i) {
    this.device = t, this.canvas = n, this.options = r, this.unregister = i, this.label = r.label, this.#s = r.clearColor === void 0 ? hr : tn(r.clearColor, "surface.clearColor");
    const s = n.getContext("webgpu");
    if (!s)
      throw Fi();
    if (this.context = s, this.layoutBacked = Wa(n), r.autoResize === !0 && !this.layoutBacked)
      throw Gi();
    this.autoResize = r.autoResize ?? (r.size ? !1 : this.layoutBacked), this.#n = un(r.dpr), this.format = r.format ?? Ka();
    const o = ja(n, r, this.layoutBacked, this.#n);
    (r.size || this.layoutBacked) && cn(n, o), s.configure({
      device: t.gpu,
      format: this.format,
      alphaMode: r.alphaMode ?? "premultiplied",
      colorSpace: r.colorSpace ?? "srgb",
      usage: qa()
    });
  }
  get gpu() {
    return this.context;
  }
  get size() {
    return this.#o(), De(this.canvas);
  }
  get texelSize() {
    const t = this.size;
    return [1 / t[0], 1 / t[1]];
  }
  get color() {
    return this.#o(), new ue(this.device, this.context.getCurrentTexture(), {
      size: this.size,
      format: this.format,
      usage: ["render_attachment", "texture_binding", "copy_src"],
      label: this.options.label ? `${this.options.label}.color` : "surface.color"
    }, "external");
  }
  get colors() {
    return [this.color];
  }
  get depth() {
    this.#o();
  }
  get sampleCount() {
    return this.#o(), 1;
  }
  get dpr() {
    return this.#n;
  }
  /** Default clear color of this surface; passes that clear without naming a color use it. */
  get clearColor() {
    return pr(this.#s);
  }
  set clearColor(t) {
    this.#s = tn(t, "surface.clearColor");
  }
  get disposed() {
    return this.#i;
  }
  resize(t) {
    if (this.#o(), this.#a)
      throw Ui(this.options.label);
    this.#c(Be(t), this.#n, !0);
  }
  applyAutoResize() {
    if (this.#i || !this.autoResize || !this.layoutBacked)
      return;
    const t = un(this.options.dpr), n = Sr(this.canvas, t);
    this.#c(n, t, !0);
  }
  onResize(t) {
    this.#o(), this.#t.add(t), this.#a = !0, we += 1;
    try {
      t(this.#f());
    } finally {
      we -= 1, this.#a = !1;
    }
    return () => {
      this.#t.delete(t);
    };
  }
  async read() {
    return this.#o(), this.color.read();
  }
  async readFloats() {
    return this.#o(), this.color.readFloats();
  }
  onDestroy(t) {
    return this.#o(), this.#e.onDestroy(this, t);
  }
  onTexturesRecreated(t) {
    return this.#o(), this.#r.add(t), () => {
      this.#r.delete(t);
    };
  }
  renderPassDescriptor(t = {}) {
    const { clear: n = [0, 0, 0, 1], preserve: r } = t;
    this.#o();
    const i = { view: this.context.getCurrentTexture().createView(), loadOp: r ? "load" : "clear", storeOp: "store" };
    return r || (i.clearValue = ga(n)), { colorAttachments: [i] };
  }
  dispose() {
    if (!this.#i) {
      this.#i = !0;
      try {
        this.context.unconfigure?.();
      } catch {
      }
      this.unregister(this), this.#t.clear(), this.#r.clear(), this.#e.emit(this);
    }
  }
  #c(t, n, r) {
    const i = !ba(De(this.canvas), t);
    this.#n = n, i && (cn(this.canvas, t), this.#u(), r && this.#d());
  }
  #u() {
    for (const t of [...this.#r])
      t();
  }
  #d() {
    this.#a = !0, we += 1;
    try {
      const t = this.#f();
      for (const n of [...this.#t])
        n(t);
    } finally {
      we -= 1, this.#a = !1;
    }
  }
  #f() {
    const t = De(this.canvas);
    return { width: t[0], height: t[1], dpr: this.#n, surface: this };
  }
  #o() {
    if (this.#i)
      throw Li(this.options.label);
  }
}
function Wa(e) {
  return typeof e.clientWidth == "number";
}
function ja(e, t, n, r) {
  return t.size ? Be(t.size) : n ? Sr(e, r) : Be(De(e));
}
function Sr(e, t) {
  const n = e;
  return Be([Math.round(n.clientWidth * t), Math.round(n.clientHeight * t)]);
}
function De(e) {
  const t = e;
  return [t.width, t.height];
}
function cn(e, t) {
  const n = e;
  n.width = t[0], n.height = t[1];
}
function Be(e) {
  return [Math.max(1, Math.floor(e[0])), Math.max(1, Math.floor(e[1]))];
}
function un(e) {
  const t = globalThis.devicePixelRatio ?? 1;
  return Array.isArray(e) ? Math.min(e[1], Math.max(e[0], t)) : typeof e == "number" ? e : t;
}
function Ka() {
  return globalThis.navigator?.gpu?.getPreferredCanvasFormat?.() ?? "bgra8unorm";
}
function qa() {
  const e = globalThis.GPUTextureUsage;
  return e ? e.RENDER_ATTACHMENT | e.TEXTURE_BINDING | e.COPY_SRC : void 0;
}
const Ha = {
  drawIndirect: { bytes: 16, args: "4 u32 values: vertexCount, instanceCount, firstVertex, firstInstance" },
  drawIndexedIndirect: { bytes: 20, args: "5 32-bit values: indexCount, instanceCount, firstIndex, baseVertex (signed), firstInstance" },
  dispatchWorkgroupsIndirect: { bytes: 12, args: "3 u32 values: workgroupCountX, workgroupCountY, workgroupCountZ" }
};
function Xa(e, t, n, r) {
  const i = typeof n == "object" && n !== null ? n.buffer : void 0, s = dn(n) ? n : dn(i) ? i : void 0;
  if (!s)
    throw ie(e, `received ${fn(n)}; expected a StorageBuffer or { buffer, offset? }.`, t);
  const o = s === n ? 0 : n.offset ?? 0;
  if (typeof o != "number" || !Number.isInteger(o) || o < 0)
    throw ie(e, `offset must be an integer >= 0; received ${fn(o)}.`, t);
  if (o % 4 !== 0)
    throw ie(e, `offset must be a multiple of 4 (WebGPU requires "indirectOffset is a multiple of 4"); received ${o}.`, t);
  if (!s.buffer.options.usage.includes("indirect"))
    throw ie(e, `the buffer lacks the "indirect" usage (WebGPU requires "indirectBuffer.usage contains INDIRECT"); create it with storage(gpu, ${s.size}, { indirect: true }).`, t);
  const { bytes: a, args: c } = Ha[r];
  if (o + a > s.size)
    throw ie(e, `${r} reads ${a} bytes (${c}) at offset ${o}, but offset + ${a} = ${o + a} exceeds the buffer size ${s.size}.`, t);
  return { buffer: s.gpu, offset: o };
}
function dn(e) {
  return typeof e == "object" && e !== null && "gpu" in e && "size" in e && e.buffer instanceof q;
}
function fn(e) {
  if (typeof e == "string")
    return `"${e}"`;
  try {
    return JSON.stringify(e) ?? String(e);
  } catch {
    return String(e);
  }
}
const ze = Symbol("vgpu.frame.drawable");
function Ya(e) {
  return e?.[ze];
}
const Za = Symbol("vgpu.frame.bundle");
function Ja(e) {
  return e?.[Za];
}
const vr = Symbol("vgpu.frame.passAttachment");
function Qa(e) {
  return typeof e?.[vr] == "function" ? e : void 0;
}
let ln = 1;
function ec(e) {
  const t = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new WeakMap();
  return {
    sampler(r = {}) {
      const i = ot(r);
      let s = t.get(i);
      return s || (s = e.gpu.createSampler(r), t.set(i, s), n.set(s, { kind: "sampler", id: ln++ })), s;
    },
    identity(r) {
      let i = n.get(r);
      return i || (i = { kind: "sampler", id: ln++ }, n.set(r, i)), i;
    }
  };
}
function ot(e) {
  if (e === null || typeof e != "object")
    return JSON.stringify(e);
  if (Array.isArray(e))
    return `[${e.map(ot).join(",")}]`;
  const t = e;
  return `{${Object.keys(t).sort().map((n) => `${JSON.stringify(n)}:${ot(t[n])}`).join(",")}}`;
}
const tc = $e("render-service");
function nc(e) {
  return e.service(tc, rc);
}
function rc(e) {
  const t = e.device, n = tr(), r = wr(t, {
    errorSink: (a) => e.reportError(a),
    registerSettledSource: (a) => e.registerSettledSource(a)
  }), i = gr(t), s = br(t), o = ec(t);
  return e.own("service", () => {
    r.dispose(), i.dispose(), s.dispose(), n.dispose();
  }), { binds: n, pipelines: r, shaderModules: i, pipelineLayouts: s, sampler: (a) => o.sampler(a) };
}
function ic(e) {
  if (typeof e == "string")
    return e;
  if (!sc(e) || !("version" in e) || e.version !== 1)
    throw Fe(e);
  const n = e.wgsl;
  if (typeof n != "string")
    throw Fe(e);
  return n;
}
function sc(e) {
  return typeof e == "object" && e !== null;
}
let oc = 1;
const Er = /* @__PURE__ */ new WeakMap();
class ac {
  source;
  label;
  #e = /* @__PURE__ */ new Map();
  constructor(t, n, r, i = tr(), s, o = wr(t), a = gr(t), c = br(t), u, d) {
    this.source = n, C(t, "Draw.constructor"), this.label = r.label ?? "draw";
    const f = oc++, h = er(n, `${this.label}.wgsl`), g = gc(this.label, r.entry), w = nn(this.label, h.entryPoints, "vertex", g.vertex, "draw"), b = nn(this.label, h.entryPoints, "fragment", g.fragment, "draw"), I = bc(h, w, b), P = [w, b].filter((pe) => !!pe), E = ra(h.bindings, P);
    cc(t, this.label, h.bindings, P, E);
    const v = r.geometry, L = w ? Ne(w, "inputs", this.label) : [], F = v && et in v ? v[et](L, `${this.label}.geometry`) : v?.vertexBufferLayouts, V = new Map(ia(t, this.label, h, E)), ne = c.get(V), l = a.get(n, `${this.label}.shader`), p = Ac(), y = fc(this.label, r), S = hc(this.label, r, y), $ = wc(t, this.label, r), le = vc(t, this.label, r), he = Ic(this.label, r), re = Pc(this.label, r), Lr = ka(this.label, r.constants, h.overrides, "draw"), Gr = ca({
      device: t,
      label: this.label,
      drawId: f,
      reflection: h,
      bindGroupLayouts: V,
      cache: i,
      onIdentityChange: (pe) => p.markStale({ kind: "binding-identity", drawLabel: this.label, ...pe })
    });
    Er.set(this, { id: f, device: t, opts: r, vertexBufferLayouts: F, cache: i, defaultTarget: s, reflection: h, visibility: E, vertexEntry: w?.name ?? "vs_main", fragmentEntry: b?.name ?? "fs_main", entryKey: I, setCore: Gr, bindGroupLayouts: V, pipelineLayout: ne, shaderModule: l, pipelineStore: o, pipelineLayouts: c, errorSink: u, trackSettled: d, resolvedPipelineKeys: /* @__PURE__ */ new Set(), recordedIn: p, ...y, ...S, ...$, ...le, ...he, ...re, ...Lr }), r.set && this.set(r.set);
    for (const pe of r.targets ?? [])
      this.compileSync(pe);
  }
  get gpu() {
    const t = x(this);
    for (const n of t.resolvedPipelineKeys) {
      const r = t.pipelineStore.getReady(n);
      if (r)
        return r;
    }
  }
  get targets() {
    return x(this).opts.targets;
  }
  /**
   * Frame drawable protocol: a `Frame` encodes through this instead of importing draw.ts, so a
   * program that never draws never pulls this module. The instance is its own protocol object —
   * `encode`, `label` and the depth/stencil metadata below are exactly what a pass needs.
   */
  get [ze]() {
    return this;
  }
  /** @internal Frame drawable protocol; see {@link drawWritesDepth}. */
  writesDepth() {
    return Lc(this);
  }
  /** @internal Frame drawable protocol; see {@link drawStencilWritingOps}. */
  stencilWritingOps() {
    return Gc(this);
  }
  set(t) {
    const n = x(this);
    C(n.device, `${this.label}.set`);
    for (const r of n.setCore.set(t))
      n.recordedIn.markStale({ kind: "binding-identity", drawLabel: this.label, ...r });
    return this;
  }
  group(t, n) {
    const r = x(this);
    C(r.device, `${this.label}.group`);
    const i = this.#e.get(t) ?? this.layout(t), s = r.setCore.claimGroup(t, n, i);
    return r.recordedIn.markStale({ kind: "group-claim", drawLabel: this.label, group: t, previousIdentity: s, newIdentity: `claimed-group:${t}` }), this;
  }
  layout(t, n = {}) {
    return C(x(this).device, `${this.label}.layout`), n.dynamicOffsets ? this.#t(t) : x(this).setCore.layout(t);
  }
  #t(t) {
    const n = x(this);
    n.setCore.layout(t);
    const r = this.#e.get(t);
    if (r)
      return r;
    const i = Dc(this, t), s = lr(n.device, `${this.label}.group${t}.dynamic.bgl`, i);
    return this.#e.set(t, s), n.bindGroupLayouts.set(t, s), n.pipelineLayout = n.pipelineLayouts.get(n.bindGroupLayouts), s;
  }
  /**
   * Encodes and submits this draw as a one-shot render pass.
   *
   * Raw claimed-bind-group validation failures are delivered asynchronously via
   * `gpu.onError` as `VGPU-R4-GROUP-VALIDATION`.
   */
  draw(t = {}) {
    C(x(this).device, `${this.label}.draw`);
    const n = Ke(t) ? { target: t } : t, r = x(this), i = n.target ?? r.defaultTarget;
    if (!i)
      throw Qe(`${this.label}.draw`);
    In(i, `${this.label}.draw`);
    const s = r.device.gpu.createCommandEncoder(), o = s.beginRenderPass(i.renderPassDescriptor()), a = [];
    try {
      this.encode(o, i, n, (f) => a.push(f));
    } catch (f) {
      G(a), rr(r.device);
      try {
        o.end();
      } catch {
      }
      throw f;
    }
    sr(r.device, o, a, a[0]?.context);
    let c;
    const u = a[0]?.context;
    u && xe(r.device, u);
    try {
      c = s.finish();
    } catch (f) {
      const h = u ? R(r.device) : void 0;
      G(a), h && G([h]);
      const g = h?.context ?? u;
      if (g) {
        kn(r, g.label, g.group, f);
        return;
      }
      throw f;
    }
    if (u) {
      const f = R(r.device);
      f && (a[0] = a[0] ? _e(f, a[0]) : f);
    }
    const d = a[0]?.context;
    d && xe(r.device, d);
    try {
      r.device.gpu.queue.submit([c]);
    } catch (f) {
      const h = d ? R(r.device) : void 0;
      G(a), h && G([h]);
      const g = h?.context ?? d;
      if (g) {
        kn(r, g.label, g.group, f);
        return;
      }
      throw f;
    }
    if (d) {
      const f = R(r.device);
      f && (a[0] = a[0] ? _e(f, a[0]) : f);
    }
    if (a.length) {
      const f = ir(r.device, a, { errorSink: r.errorSink });
      r.trackSettled?.(f);
    }
  }
  encode(t, n, r = {}, i) {
    C(x(this).device, `${this.label}.encode`);
    const s = this.pipelineFor(n, !0);
    if (!s)
      return;
    t.setPipeline(s);
    const o = x(this);
    o.blendConstant && t.setBlendConstant(o.blendConstant), o.stencilRef !== void 0 && t.setStencilReference(o.stencilRef);
    for (const a of o.setCore.bindGroups())
      this.#r(t, a, r, i);
    this.#a(t, r);
  }
  #r(t, n, r, i) {
    const s = Rc(r.offsets, n.group, n.offsets);
    if (!n.claimValidation || !i) {
      t.setBindGroup(n.group, n.bindGroup, s);
      return;
    }
    xe(x(this).device, n.claimValidation);
    try {
      t.setBindGroup(n.group, n.bindGroup, s);
    } catch (a) {
      throw Do(x(this).device), ce(n.claimValidation.label, n.claimValidation.group, a);
    }
    const o = R(x(this).device);
    o && i(o);
  }
  compile(t) {
    C(x(this).device, `${this.label}.compile`);
    const { key: n, signature: r, signatureKey: i } = this.#n(t, `${this.label}.compile`);
    return x(this).pipelineStore.getAsync(n, () => this.#d(r), { where: `${this.label}.compile`, signature: i }).then(() => (C(x(this).device, `${this.label}.compile`), x(this).resolvedPipelineKeys.add(n), this));
  }
  compileSync(t) {
    C(x(this).device, `${this.label}.compileSync`);
    const { key: n, signature: r, signatureKey: i } = this.#n(t, `${this.label}.compileSync`);
    return x(this).pipelineStore.getSync(n, () => this.#u(r), { where: `${this.label}.compileSync`, signature: i }) && x(this).resolvedPipelineKeys.add(n), this;
  }
  pipelineFor(t, n = !1) {
    C(x(this).device, `${this.label}.pipelineFor`);
    const { key: r, signature: i, signatureKey: s } = this.#n(t, `${this.label}.pipelineFor`, n), o = x(this).pipelineStore.getSync(r, () => this.#u(i), { where: `${this.label}.pipelineFor`, signature: s });
    return o && x(this).resolvedPipelineKeys.add(r), o;
  }
  pipelineForAsync(t) {
    C(x(this).device, `${this.label}.pipelineForAsync`);
    const { key: n, signature: r, signatureKey: i } = this.#n(t, `${this.label}.pipelineForAsync`);
    return x(this).pipelineStore.getAsync(n, () => this.#d(r), { where: `${this.label}.pipelineForAsync`, signature: i }).then((o) => (C(x(this).device, `${this.label}.pipelineForAsync`), x(this).resolvedPipelineKeys.add(n), o));
  }
  #n(t, n, r = !1) {
    const i = this.#s(t, n, r), s = mr(i);
    return { signature: i, signatureKey: s, key: this.#i(i) };
  }
  #s(t, n, r = !1) {
    const i = x(this), s = t ?? i.defaultTarget;
    if (!s)
      throw Qe(n);
    r || In(s, n);
    const o = va(s);
    if (Ea(o, n), i.colorStates && i.colorStates.length !== o.colors.length)
      throw Je(this.label, `expected one entry per color attachment; colors has ${i.colorStates.length}, but the target signature has ${o.colors.length}.`, n);
    if (i.multisampleState?.alphaToCoverageEnabled && (o.sampleCount ?? 1) <= 1)
      throw Ge(this.label, `alphaToCoverage requires a multisampled target, but the target signature has sampleCount ${o.sampleCount ?? 1}; create the target with msaa: true.`, n);
    if ((i.stencilState || i.stencilRef !== void 0) && !vt(o.depth))
      throw oe(this.label, `stencil requires a depth format with a stencil aspect, but the target signature has ${o.depth ? `"${o.depth}"` : "no depth"}; create the target with depth: "depth24plus-stencil8".`, n);
    return o;
  }
  #i(t) {
    const n = x(this), r = n.opts.geometry;
    return $a({ module: n.shaderModule, pipelineLayout: n.pipelineLayout, vertexBufferLayouts: n.vertexBufferLayouts, signature: t, fragmentKey: n.fragmentKey, topology: r?.topology, stripIndexFormat: $r(r), cullMode: n.cullMode, frontFace: n.frontFace, unclippedDepth: n.unclippedDepth, depthKey: n.depthKey, stencilKey: n.stencilKey, multisampleKey: n.multisampleKey, constantsKey: n.constantsKey, entryKey: n.entryKey });
  }
  #a(t, n = {}) {
    const r = x(this).opts.geometry;
    if (r?.vertexBuffers && r.vertexBuffers.forEach((s, o) => t.setVertexBuffer(o, s)), n.indirect !== void 0)
      return this.#c(t, r, n);
    const i = dc(this.label, r, x(this).opts, n);
    if (!r?.indexBuffer)
      return t.draw(i.vertexCount, i.instanceCount, i.firstVertex, i.firstInstance);
    t.setIndexBuffer(r.indexBuffer, r.indexFormat ?? "uint32"), t.drawIndexed(i.indexCount, i.instanceCount, i.firstIndex, i.baseVertex, i.firstInstance);
  }
  /**
   * The GPU reads the draw arguments from the buffer, so per-call counts alongside indirect are dead options and throw.
   * A non-zero firstInstance in the buffered arguments cannot be validated on the CPU; per WebGPU, it "must be 0,
   * unless the 'indirect-first-instance' feature is enabled", otherwise the indirect call "will be treated as a no-op".
   */
  #c(t, n, r) {
    const i = `${this.label}.draw`, s = uc.find((u) => r[u] !== void 0);
    if (s !== void 0)
      throw ie(this.label, `indirect cannot be combined with ${s} in the same call; the GPU reads the draw arguments from the buffer, so the CPU-side value would be ignored.`, i);
    const o = !!n?.indexBuffer, { buffer: a, offset: c } = Xa(this.label, i, r.indirect, o ? "drawIndexedIndirect" : "drawIndirect");
    if (!o)
      return t.drawIndirect(a, c);
    t.setIndexBuffer(n.indexBuffer, n.indexFormat ?? "uint32"), t.drawIndexedIndirect(a, c);
  }
  #u(t) {
    const n = x(this);
    return n.device.gpu.createRenderPipeline({
      label: `${this.label}.pipeline`,
      layout: n.pipelineLayout,
      vertex: { module: n.shaderModule, entryPoint: n.vertexEntry, buffers: [...n.vertexBufferLayouts ?? []], ...n.constants ? { constants: n.constants } : {} },
      fragment: { module: n.shaderModule, entryPoint: n.fragmentEntry, targets: hn(t, n), ...n.constants ? { constants: n.constants } : {} },
      primitive: pn(n.opts.geometry, n.cullMode, n.frontFace, n.unclippedDepth),
      depthStencil: xn(t, n),
      multisample: En(t, n)
    });
  }
  #d(t) {
    const n = x(this);
    return n.device.gpu.createRenderPipelineAsync({
      label: `${this.label}.pipeline`,
      layout: n.pipelineLayout,
      vertex: { module: n.shaderModule, entryPoint: n.vertexEntry, buffers: [...n.vertexBufferLayouts ?? []], ...n.constants ? { constants: n.constants } : {} },
      fragment: { module: n.shaderModule, entryPoint: n.fragmentEntry, targets: hn(t, n), ...n.constants ? { constants: n.constants } : {} },
      primitive: pn(n.opts.geometry, n.cullMode, n.frontFace, n.unclippedDepth),
      depthStencil: xn(t, n),
      multisample: En(t, n)
    });
  }
}
function cc(e, t, n, r, i) {
  const s = e.limits;
  for (const [o, a, c] of [["vertex", 1, "maxStorageBuffersInVertexStage"], ["fragment", 2, "maxStorageBuffersInFragmentStage"]]) {
    const u = r.find((h) => h.stage === o);
    if (!u)
      continue;
    const d = n.filter((h) => h.bindingLayout?.kind === "buffer" && h.bindingLayout.buffer.type !== "uniform" && i(h) & a), f = s[c] ?? s.maxStorageBuffersPerShaderStage;
    if (f !== void 0 && d.length > f)
      throw li(t, o, u.name, d.length, f, d);
  }
}
const uc = ["vertices", "indices", "instances", "firstVertex", "firstIndex", "baseVertex", "firstInstance"];
function hn(e, t) {
  return e.colors.map((n, r) => {
    const i = t.colorStates?.[r], s = i?.blendState ?? t.blendState, o = i?.writeMask ?? t.writeMask, a = { format: n };
    return s && (a.blend = s), o !== void 0 && (a.writeMask = o), a;
  });
}
function dc(e, t, n, r) {
  j(e, "DrawOptions.instances", n.instances), j(e, "DrawOptions.vertices", n.vertices), j(e, "DrawOptions.firstInstance", n.firstInstance), j(e, "DrawCallOptions.instances", r.instances), W(e, "DrawCallOptions.vertices", r.vertices), W(e, "DrawCallOptions.indices", r.indices), W(e, "DrawCallOptions.firstVertex", r.firstVertex), W(e, "DrawCallOptions.firstIndex", r.firstIndex), W(e, "DrawCallOptions.baseVertex", r.baseVertex), j(e, "DrawCallOptions.firstInstance", r.firstInstance), j(e, "GeometryLike.vertexCount", t?.vertexCount), j(e, "GeometryLike.indexCount", t?.indexCount), j(e, "GeometryLike.instanceCount", t?.instanceCount), W(e, "GeometryLike.firstVertex", t?.firstVertex), W(e, "GeometryLike.firstIndex", t?.firstIndex), W(e, "GeometryLike.baseVertex", t?.baseVertex);
  const i = !!t?.indexBuffer, o = t?.geometry ?? (t && et in t ? t : void 0), a = r.firstVertex ?? t?.firstVertex ?? 0, c = r.vertices ?? t?.vertexCount ?? n.vertices ?? 3, u = r.firstIndex ?? t?.firstIndex ?? 0, d = r.indices ?? t?.indexCount ?? 0, f = r.baseVertex ?? t?.baseVertex ?? 0;
  if (i)
    mn(e, "index", u, d, o?.indexCount);
  else if (r.indices !== void 0 || r.firstIndex !== void 0 || r.baseVertex !== void 0)
    throw dt(`${e}.draw`, "Index range needs an indexed geometry.");
  return i || mn(e, "vertex", a, c, o?.vertexCount), {
    instanceCount: r.instances ?? n.instances ?? t?.instanceCount ?? 1,
    firstInstance: r.firstInstance ?? n.firstInstance ?? 0,
    vertexCount: c,
    firstVertex: a,
    indexCount: d,
    firstIndex: u,
    baseVertex: f
  };
}
function $r(e) {
  const t = e?.topology ?? "triangle-list";
  return e?.stripIndexFormat ?? (t.endsWith("strip") ? e?.indexFormat : void 0);
}
function pn(e, t, n, r) {
  const i = e?.topology ?? "triangle-list", s = $r(e), o = s ? { topology: i, stripIndexFormat: s } : { topology: i };
  return t !== void 0 && (o.cullMode = t), n !== void 0 && (o.frontFace = n), r && (o.unclippedDepth = !0), o;
}
function mn(e, t, n, r, i) {
  if (!(i === void 0 || n + r <= i))
    throw dt(`${e}.draw`, `${t} range [${n}, ${n + r}) exceeds parent geometry ${t} count ${i}.`);
}
function W(e, t, n) {
  if (!(n === void 0 || Number.isInteger(n) && n >= 0))
    throw dt(`${e}.draw`, `${t} must be an integer >= 0; received ${String(n)}.`);
}
function j(e, t, n) {
  if (n !== void 0 && !(Number.isInteger(n) && n >= 0))
    throw new m({
      code: "VGPU-R1-DRAW-COUNT",
      message: `${t} of '${e}' must be an integer >= 0; received ${String(n)}. Use 0 only when you want to issue a valid draw with no vertices/instances.`,
      where: `${e}.draw`
    });
}
function fc(e, t) {
  const n = t.blend === void 0 ? void 0 : kr(e, t.blend), r = t.writeMask === void 0 ? void 0 : Pr(e, t.writeMask), i = t.colors === void 0 ? void 0 : lc(e, t.colors), s = i ? `${$n(n, r)}@${i.map(Cc).join("@")}` : n || r !== void 0 ? $n(n, r) : void 0;
  return { blendState: n, writeMask: r, colorStates: i, fragmentKey: s };
}
function lc(e, t) {
  if (!Array.isArray(t))
    throw Je(e, `colors must be an array; received ${k(t)}.`);
  return t.map((n, r) => {
    if (n == null)
      return null;
    if (typeof n != "object" || Array.isArray(n))
      throw Je(e, `colors[${r}] must be null or { blend?, writeMask? }; received ${k(n)}.`);
    const i = n.blend === void 0 ? void 0 : kr(`${e}.colors[${r}]`, n.blend), s = n.writeMask === void 0 ? void 0 : Pr(`${e}.colors[${r}]`, n.writeMask);
    return !i && s === void 0 ? null : { blendState: i, writeMask: s };
  });
}
function kr(e, t) {
  if (t === "alpha")
    return Le({ src: "src-alpha", dst: "one-minus-src-alpha" }, { src: "one", dst: "one-minus-src-alpha" });
  if (t === "premultiplied")
    return Le({ src: "one", dst: "one-minus-src-alpha" }, { src: "one", dst: "one-minus-src-alpha" });
  if (t === "additive")
    return Le({ src: "one", dst: "one" }, { src: "one", dst: "one" });
  if (typeof t != "object" || t === null || !gn(t.color))
    throw Gt(e, t);
  const n = t.color, r = t.alpha;
  if (r !== void 0 && !gn(r))
    throw Gt(e, t);
  return Le(n, r ?? n);
}
function gn(e) {
  return typeof e == "object" && e !== null && typeof e.src == "string" && typeof e.dst == "string";
}
function Le(e, t) {
  return { color: bn(e), alpha: bn(t) };
}
function bn(e) {
  return { srcFactor: e.src, dstFactor: e.dst, operation: e.op ?? "add" };
}
function hc(e, t, n) {
  if (t.blendConstant === void 0)
    return {};
  const r = t.blendConstant;
  if (!Array.isArray(r) || r.length !== 4 || r.some((i) => typeof i != "number" || !Number.isFinite(i)))
    throw Ut(e, `received ${k(r)}; expected [r, g, b, a] finite numbers.`);
  if (!pc(n).some((i) => i && mc(i)))
    throw Ut(e, `no color target's effective blend uses a "constant"/"one-minus-constant" factor (colors[i].blend replaces the top-level blend for that target), so blendConstant would have no effect.`);
  return { blendConstant: { r: r[0], g: r[1], b: r[2], a: r[3] } };
}
function pc(e) {
  return e.colorStates ? e.colorStates.map((t) => t?.blendState ?? e.blendState) : [e.blendState];
}
function mc(e) {
  return [e.color.srcFactor, e.color.dstFactor, e.alpha.srcFactor, e.alpha.dstFactor].some((t) => t === "constant" || t === "one-minus-constant");
}
function gc(e, t) {
  if (t === void 0)
    return {};
  if (typeof t != "object" || t === null || Array.isArray(t))
    throw Ue(e, `received ${k(t)}; expected { vertex?, fragment? } entry point names.`);
  return t;
}
function bc(e, t, n) {
  const r = e.entryPoints.find((s) => s.stage === "vertex"), i = e.entryPoints.find((s) => s.stage === "fragment");
  if (!(t === r && n === i))
    return `en~${t?.name ?? ""}~${n?.name ?? ""}`;
}
function wc(e, t, n) {
  const r = n.cull === void 0 ? void 0 : xc(t, n.cull), i = n.frontFace === void 0 ? void 0 : Sc(t, n.frontFace), s = n.unclippedDepth === void 0 ? void 0 : yc(e, t, n.unclippedDepth);
  return { cullMode: r, frontFace: i, unclippedDepth: s };
}
function yc(e, t, n) {
  if (typeof n != "boolean")
    throw Rt(t, `received ${k(n)}; expected a boolean.`);
  if (n) {
    if (!e.features.has("depth-clip-control"))
      throw Rt(t, 'the device lacks the "depth-clip-control" feature; request it at init: init({ requiredFeatures: ["depth-clip-control"] }) on an adapter that supports it.');
    return !0;
  }
}
function xc(e, t) {
  if (t === "none" || t === "front" || t === "back")
    return t;
  throw bi(e, t);
}
function Sc(e, t) {
  if (t === "ccw" || t === "cw")
    return t;
  throw wi(e, t);
}
const Ir = { depthWriteEnabled: !0, depthCompare: "less-equal" }, Tr = ["never", "less", "equal", "less-equal", "greater", "not-equal", "greater-equal", "always"], wn = -2147483648, yn = 2147483647;
function xn(e, t) {
  if (e.depth)
    return { format: e.depth, ...t.depthState ?? Ir, ...t.stencilState ?? {} };
}
function vc(e, t, n) {
  if (n.depth === void 0)
    return {};
  const r = Ec(e, t, n.depth, n.geometry?.topology ?? "triangle-list");
  return { depthState: r, depthKey: $c(r) };
}
function Ec(e, t, n, r) {
  if (n === !1)
    return { depthWriteEnabled: !1, depthCompare: "always" };
  if (typeof n != "object" || n === null)
    throw O(t, `received ${k(n)}.`);
  if (n.write !== void 0 && typeof n.write != "boolean")
    throw O(t, `write must be a boolean; received ${k(n.write)}.`);
  if (n.compare !== void 0 && !Tr.includes(n.compare))
    throw O(t, `compare must be a GPUCompareFunction; received ${k(n.compare)}.`);
  if (n.bias !== void 0 && !Number.isInteger(n.bias))
    throw O(t, `bias must be an integer (WebGPU depthBias is i32); received ${k(n.bias)}.`);
  if (n.bias !== void 0 && (n.bias < wn || n.bias > yn))
    throw O(t, `bias must fit in the i32 range [${wn}, ${yn}] (WebGPU depthBias is i32); received ${k(n.bias)}.`);
  if (n.biasSlopeScale !== void 0 && !Number.isFinite(n.biasSlopeScale))
    throw O(t, `biasSlopeScale must be a finite number; received ${k(n.biasSlopeScale)}.`);
  if (n.biasClamp !== void 0 && !Number.isFinite(n.biasClamp))
    throw O(t, `biasClamp must be a finite number; received ${k(n.biasClamp)}.`);
  const i = n.bias ?? 0, s = n.biasSlopeScale ?? 0, o = n.biasClamp ?? 0;
  if ((i !== 0 || s !== 0 || o !== 0) && !r.startsWith("triangle"))
    throw O(t, `bias, biasSlopeScale, and biasClamp must be 0 for "${r}" topology.`);
  if (o !== 0 && e.isCompatibilityMode)
    throw O(t, `biasClamp must be 0 on a compatibility-mode device; received ${k(n.biasClamp)}.`);
  return {
    depthWriteEnabled: n.write ?? !0,
    depthCompare: n.compare ?? "less-equal",
    ...i !== 0 ? { depthBias: i } : {},
    ...s !== 0 ? { depthBiasSlopeScale: s } : {},
    ...o !== 0 ? { depthBiasClamp: o } : {}
  };
}
function $c(e) {
  return `${e.depthWriteEnabled ? 1 : 0}~${e.depthCompare}~${e.depthBias ?? 0}~${e.depthBiasSlopeScale ?? 0}~${e.depthBiasClamp ?? 0}`;
}
const kc = ["keep", "zero", "replace", "invert", "increment-clamp", "decrement-clamp", "increment-wrap", "decrement-wrap"];
function Ic(e, t) {
  if (t.stencil === void 0)
    return {};
  const n = t.stencil;
  if (typeof n != "object" || n === null || Array.isArray(n))
    throw oe(e, `received ${k(n)}; expected { front?, back?, readMask?, writeMask?, ref? }.`);
  const r = n.front === void 0 ? void 0 : Sn(e, "front", n.front), i = n.back === void 0 ? void 0 : Sn(e, "back", n.back);
  Ze(e, "readMask", n.readMask), Ze(e, "writeMask", n.writeMask), Ze(e, "ref", n.ref);
  const s = {
    ...r ? { stencilFront: r } : {},
    // Omitted back mirrors the normalized front so both faces behave the same; with neither given, both keep the WebGPU defaults.
    ...i ?? r ? { stencilBack: i ?? { ...r } } : {},
    ...n.readMask !== void 0 ? { stencilReadMask: n.readMask } : {},
    ...n.writeMask !== void 0 ? { stencilWriteMask: n.writeMask } : {}
  }, o = s.stencilFront !== void 0 || s.stencilBack !== void 0 || s.stencilReadMask !== void 0 || s.stencilWriteMask !== void 0;
  return !o && n.ref === void 0 ? {} : {
    ...o ? { stencilState: s, stencilKey: Tc(s) } : {},
    // The reference is encoder state (setStencilReference), not pipeline state; it stays out of the pipeline key.
    ...n.ref !== void 0 ? { stencilRef: n.ref } : {}
  };
}
function Sn(e, t, n) {
  if (typeof n != "object" || n === null || Array.isArray(n))
    throw oe(e, `${t} must be a { compare?, fail?, depthFail?, pass? } object; received ${k(n)}.`);
  if (n.compare !== void 0 && !Tr.includes(n.compare))
    throw oe(e, `${t}.compare must be a GPUCompareFunction; received ${k(n.compare)}.`);
  for (const [r, i] of [["fail", n.fail], ["depthFail", n.depthFail], ["pass", n.pass]])
    if (i !== void 0 && !kc.includes(i))
      throw oe(e, `${t}.${r} must be a GPUStencilOperation; received ${k(i)}.`);
  return { compare: n.compare ?? "always", failOp: n.fail ?? "keep", depthFailOp: n.depthFail ?? "keep", passOp: n.pass ?? "keep" };
}
function Ze(e, t, n) {
  if (n !== void 0 && (typeof n != "number" || !Number.isInteger(n) || n < 0 || n > 4294967295))
    throw oe(e, `${t} must be an integer in [0, 0xFFFFFFFF] (WebGPU GPUStencilValue is u32); received ${k(n)}.`);
}
function Tc(e) {
  return `st~${vn(e.stencilFront)}~${vn(e.stencilBack)}~${e.stencilReadMask ?? 4294967295}~${e.stencilWriteMask ?? 4294967295}`;
}
function vn(e) {
  return e ? `${e.compare},${e.failOp},${e.depthFailOp},${e.passOp}` : "default";
}
function En(e, t) {
  return { count: e.sampleCount ?? 1, ...t.multisampleState ?? {} };
}
function Pc(e, t) {
  if (t.multisample === void 0)
    return {};
  const n = t.multisample;
  if (typeof n != "object" || n === null || Array.isArray(n))
    throw Ge(e, `received ${k(n)}; expected { alphaToCoverage?, mask? }.`);
  if (n.alphaToCoverage !== void 0 && typeof n.alphaToCoverage != "boolean")
    throw Ge(e, `alphaToCoverage must be a boolean; received ${k(n.alphaToCoverage)}.`);
  if (n.mask !== void 0 && (typeof n.mask != "number" || !Number.isInteger(n.mask) || n.mask < 0 || n.mask > 4294967295))
    throw Ge(e, `mask must be an integer in [0, 0xFFFFFFFF] (WebGPU GPUSampleMask is u32); received ${k(n.mask)}.`);
  const r = {
    ...n.alphaToCoverage !== void 0 ? { alphaToCoverageEnabled: n.alphaToCoverage } : {},
    ...n.mask !== void 0 ? { mask: n.mask } : {}
  };
  return r.alphaToCoverageEnabled === void 0 && r.mask === void 0 ? {} : { multisampleState: r, multisampleKey: Fc(r) };
}
function Fc(e) {
  return `ms~${e.alphaToCoverageEnabled ? 1 : 0}~${e.mask ?? 4294967295}`;
}
function Pr(e, t) {
  if (!Array.isArray(t))
    throw At(e, k(t));
  let n = 0;
  for (const r of t)
    if (r === "r")
      n |= 1;
    else if (r === "g")
      n |= 2;
    else if (r === "b")
      n |= 4;
    else if (r === "a")
      n |= 8;
    else
      throw At(e, k(r));
  return n;
}
function $n(e, t) {
  return `${Fr(e)};${t ?? 15}`;
}
function Fr(e) {
  if (!e)
    return "none;none";
  const t = e.color, n = e.alpha;
  return `${t.srcFactor},${t.dstFactor},${t.operation};${n.srcFactor},${n.dstFactor},${n.operation}`;
}
function Cc(e) {
  return e ? `${e.blendState ? Fr(e.blendState) : "inherit"};${e.writeMask ?? "inherit"}` : "inherit";
}
function k(e) {
  if (typeof e == "string")
    return `"${e}"`;
  try {
    return JSON.stringify(e) ?? String(e);
  } catch {
    return String(e);
  }
}
function Lc(e) {
  return (x(e).depthState ?? Ir).depthWriteEnabled;
}
function Gc(e) {
  const t = x(e), n = t.stencilState;
  if (!n || n.stencilWriteMask === 0)
    return [];
  const r = t.cullMode ?? "none", i = [], s = (o, a) => {
    if (a)
      for (const [c, u] of [["fail", a.failOp], ["depthFail", a.depthFailOp], ["pass", a.passOp]])
        u !== void 0 && u !== "keep" && i.push(`${o}.${c}: "${u}"`);
  };
  return r !== "front" && s("front", n.stencilFront), r !== "back" && s("back", n.stencilBack), i;
}
function Uc(e, t, n, r = {}, i) {
  e.encode(t, n, r, i);
}
function x(e) {
  const t = Er.get(e);
  if (!t)
    throw new TypeError("Invalid Draw instance");
  return t;
}
function kn(e, t, n, r) {
  const i = (async () => {
    await mt(e.device), C(e.device, `${t}.validation`);
    const s = ce(t, n, r);
    e.errorSink ? await e.errorSink(s) : console.error(s);
  })();
  return e.trackSettled?.(i), i;
}
function Ac() {
  const e = /* @__PURE__ */ new Set();
  return {
    add(t) {
      e.add(t);
    },
    delete(t) {
      e.delete(t);
    },
    list() {
      return [...e];
    },
    markStale(t) {
      for (const n of e)
        n.markStale(t);
    }
  };
}
function Rc(e, t, n) {
  return e ? Array.isArray(e) ? e : e[t] ?? n : n;
}
function Dc(e, t) {
  const n = x(e);
  return fr(n.reflection.bindings, t, n.visibility).map(Mc);
}
function Mc(e) {
  return e.buffer ? { ...e, buffer: { ...e.buffer, hasDynamicOffset: !0 } } : e;
}
function In(e, t) {
  if (yr(e) && !_a())
    throw Rn(t);
}
function Vc(e, t, n = {}) {
  if ("geometry" in n)
    throw D("effect", "effect() never accepts vertex buffers; use draw(gpu, { shader, geometry: geometry(gpu, descriptor) }).");
  const r = We(e, "effect"), i = nc(r);
  return new Nc(r.device, ic(t), n, i.binds, void 0, i.pipelines, i.shaderModules, i.pipelineLayouts, (s) => r.reportError(s), (s) => {
    r.trackDelivery(s);
  });
}
const Cr = /* @__PURE__ */ new WeakMap();
class Nc {
  get gpu() {
    return Y(this).gpu;
  }
  constructor(t, n, r = {}, i, s, o, a, c, u, d) {
    const f = Oc(n), h = new ac(t, f, { shader: f, set: r.set, label: r.label ?? "effect", blend: r.blend, writeMask: r.writeMask }, i, s, o, a, c, u, d);
    Cr.set(this, h);
  }
  set(t) {
    return Y(this).set(t), this;
  }
  draw(t = {}) {
    Y(this).draw(Ke(t) ? { target: t } : t);
  }
  compile(t) {
    return Y(this).compile(t).then(() => this);
  }
  compileSync(t) {
    return Y(this).compileSync(t), this;
  }
  /** @internal FramePass delegates here; not part of the frozen public Effect surface. */
  encode(t, n, r = {}, i) {
    Uc(Y(this), t, n, r, i);
  }
  /**
   * Frame drawable protocol: an effect is encoded as its underlying draw, so it reuses that draw's
   * protocol object — same encode path, same depth/stencil metadata for read-only passes.
   */
  get [ze]() {
    return Y(this)[ze];
  }
}
function Y(e) {
  const t = Cr.get(e);
  if (!t)
    throw new TypeError("Invalid Effect instance");
  return t;
}
function Oc(e) {
  return _c(e) ? e : `
struct VgpuFullscreenVertexOut {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
};
@vertex fn vgpu_fullscreen_vs(@builtin(vertex_index) vi: u32) -> VgpuFullscreenVertexOut {
  var pos = array<vec2f, 3>(vec2f(-1.0, -1.0), vec2f(3.0, -1.0), vec2f(-1.0, 3.0));
  var uv = array<vec2f, 3>(vec2f(0.0, 1.0), vec2f(2.0, 1.0), vec2f(0.0, -1.0));
  var out: VgpuFullscreenVertexOut;
  out.position = vec4f(pos[vi], 0.0, 1.0);
  out.uv = uv[vi];
  return out;
}
${e}`;
}
function _c(e) {
  return er(e, "effect.wgsl").entryPoints.some((t) => t.stage === "vertex");
}
const Bc = $e("clock");
function zc(e) {
  return Wc(We(e, "clock"));
}
function Wc(e) {
  return e.service(Bc, (t) => {
    const n = Et(t), r = (i) => {
      if (t.disposed)
        throw Nn(i);
      C(t.device, i);
    };
    return {
      get time() {
        return r("clock.time"), n.time;
      },
      get deltaTime() {
        return r("clock.deltaTime"), n.deltaTime;
      },
      get frameCount() {
        return r("clock.frameCount"), n.frameCount;
      },
      advance(i) {
        if (r("clock.advance"), typeof i != "number" || !Number.isFinite(i) || i < 0)
          throw Ri(i);
        n.advanceBy(i);
      }
    };
  });
}
function jc(e, t, n = {}) {
  return qc(We(e, "frameLoop")).loop(t, n);
}
const Kc = $e("frame-runner");
function qc(e) {
  return e.service(Kc, (t) => {
    const n = Et(t);
    return new iu(() => {
      let r = () => {
      };
      const i = new Hc(t.device, void 0, (s) => t.reportError(s), (s) => {
        t.trackDelivery(s);
      }, () => r());
      return r = t.own("scheduler", () => i.cancel()), i;
    }, () => n.tick(), (r) => t.own("scheduler", () => r.stop()));
  });
}
class Hc {
  device;
  defaultTarget;
  errorSink;
  trackSettled;
  releaseLifecycle;
  /**
   * Resolves after submitted GPU work completes and raw claimed-bind-group
   * validation has been delivered to `gpu.onError`.
   *
   * This is a completion/timing signal only; it never rejects and is not an error
   * channel.
   */
  done = Promise.resolve();
  #e;
  #t = [];
  /**
   * Everything a pass of this frame attached, as opaque {@link FrameOwner}s: timers and
   * visibilities today, scene view generations later. The frame never learns what they are — it
   * only guarantees each one sees exactly one `frameSubmitted` or `frameAbandoned`.
   */
  #r = /* @__PURE__ */ new Set();
  /**
   * Owners whose per-frame bookkeeping a failed pass invalidated: their frame is neither finalized
   * nor read back, so a throwing pass callback cannot leave a phantom result. Kept alongside the
   * live set so a later pass re-attaching the same instance in this frame stays dropped too — the
   * failed pass's span/slots are still in that instance's frame bookkeeping.
   */
  #n = /* @__PURE__ */ new Set();
  #s = !1;
  #i = !1;
  #a = !1;
  constructor(t, n, r, i, s) {
    this.device = t, this.defaultTarget = n, this.errorSink = r, this.trackSettled = i, this.releaseLifecycle = s, C(t, "Frame.constructor"), this.#e = t.gpu.createCommandEncoder({ label: "vgpu.frame" });
  }
  pass(t, n) {
    if (this.#i)
      throw Nt("Frame.pass");
    C(this.device, "Frame.pass");
    const r = Ke(t), i = typeof n == "function" ? n : (b) => b.draw(n), s = r ? t : t.target ?? this.defaultTarget;
    if (!s)
      throw Qe("Frame.pass");
    if (yr(s) && this.#s)
      throw Rn("Frame.pass");
    const o = r ? void 0 : t.clear, a = o === !1;
    if (a && s.sampleCount === 4)
      throw yi();
    const c = r ? void 0 : t.clearDepth;
    if (c !== void 0) {
      if (typeof c != "number" || !(c >= 0 && c <= 1))
        throw Dt(c);
      if (a)
        throw xi();
      if (!s.depth)
        throw Dt(c, "but the target has no depth attachment, so clearDepth would have no effect.", "Create the target with depth: true (or a depth format), or drop clearDepth.");
    }
    const u = r ? void 0 : t.clearStencil;
    if (u !== void 0) {
      if (typeof u != "number" || !Number.isInteger(u) || u < 0 || u > 4294967295)
        throw Mt(`received ${String(u)}; expected an integer in [0, 0xFFFFFFFF] (WebGPU GPUStencilValue).`);
      if (a)
        throw Si();
      const b = s.depth?.format;
      if (!vt(b))
        throw Mt(`received ${String(u)}, but the target's depth format ${b ? `"${b}"` : "(none)"} has no stencil aspect, so clearStencil would have no effect.`);
    }
    const d = r ? void 0 : t.depthReadOnly;
    if (d !== void 0 && typeof d != "boolean")
      throw J(`received ${H(d)}; expected a boolean.`, "Pass depthReadOnly: true to open the pass with a read-only depth attachment, or omit it.");
    if (d) {
      if (!s.depth)
        throw J("is set, but the target has no depth attachment, so there is nothing to make read-only.", "Create the target with depth: true (or a depth format), or drop depthReadOnly.");
      if (s.sampleCount === 4)
        throw vi();
      if (c !== void 0)
        throw J("cannot be combined with clearDepth; a read-only depth aspect omits its load/store ops and is never cleared.", "Remove clearDepth, or drop depthReadOnly.");
      if (u !== void 0)
        throw J("cannot be combined with clearStencil; a read-only stencil aspect omits its load/store ops and is never cleared.", "Remove clearStencil, or drop depthReadOnly.");
    }
    const f = r ? void 0 : tu(t.viewport, this.device.gpu.limits, s.size), h = r ? void 0 : nu(t.scissor, s.size), g = [];
    let w;
    try {
      const b = r || t.timer === void 0 ? void 0 : this.#o(t.timer, s, g, Qc), P = (r || t.visibility === void 0 ? void 0 : this.#o(t.visibility, s, g, eu))?.occlusion;
      let E = s.renderPassDescriptor({ clear: o === void 0 || o === !0 || o === !1 ? s.clearColor ?? hr : o, preserve: a, clearDepth: c, clearStencil: u, depthReadOnly: d });
      b?.timestampWrites && (E = { ...E, timestampWrites: b.timestampWrites }), P && (E = { ...E, occlusionQuerySet: P.querySet }), w = this.#e.beginRenderPass(E), f && w.setViewport(f.x, f.y, f.width, f.height, f.minDepth, f.maxDepth), h && w.setScissorRect(h[0], h[1], h[2], h[3]), this.#a = !0;
      try {
        i(new Xc(w, s, this.#t, d === !0, P, this, (v) => {
          if (C(this.device, v), this.#i)
            throw Nt(v);
        }));
      } finally {
        this.#a = !1;
      }
    } catch (b) {
      this.#d(g), G(this.#t), this.#t.length = 0, rr(this.device);
      try {
        w?.end();
      } catch {
      }
      throw b;
    }
    sr(this.device, w, this.#t);
  }
  submit() {
    if (this.#s || this.#i)
      return;
    C(this.device, "Frame.submit"), this.#s = !0, this.releaseLifecycle?.();
    for (const i of this.#f())
      i.finalizeFrame(this, this.#e);
    let t;
    const n = this.#t[0]?.context;
    n && xe(this.device, n);
    try {
      t = this.#e.finish();
    } catch (i) {
      this.#c(this.#u());
      const s = n ? R(this.device) : void 0;
      G(this.#t), s && G([s]);
      const o = s?.context ?? n;
      if (!o)
        throw i;
      this.done = this.#l(this.#h(o.label, o.group, i));
      return;
    }
    if (n) {
      const i = R(this.device);
      i && (this.#t[0] = this.#t[0] ? _e(i, this.#t[0]) : i);
    }
    const r = this.#t[0]?.context;
    r && xe(this.device, r);
    try {
      this.device.gpu.queue.submit([t]);
    } catch (i) {
      this.#c(this.#u());
      const s = r ? R(this.device) : void 0;
      G(this.#t), s && G([s]);
      const o = s?.context ?? r;
      if (!o)
        throw i;
      this.done = this.#l(this.#h(o.label, o.group, i));
      return;
    }
    if (r) {
      const i = R(this.device);
      i && (this.#t[0] = this.#t[0] ? _e(i, this.#t[0]) : i);
    }
    for (const i of this.#f())
      i.frameSubmitted(this);
    this.#c(this.#n), this.done = this.#l(ir(this.device, this.#t, { errorSink: this.errorSink }));
  }
  /**
   * Discards the frame without submitting it: the command encoder is dropped (nothing this frame
   * encoded ever runs) and every telemetry instance it attached releases the retain it took on its
   * query ring, so a `timer(gpu)` / `visibility(gpu)` can be disposed for good without waiting for
   * `gpu.dispose()`. This is the explicit way out of the leak a manual `frame(gpu)` would otherwise
   * hold: a frame is never assumed abandoned, because an old frame can still be submitted.
   *
   * Idempotent, like `submit()`: cancelling twice is a no-op, and `submit()` after `cancel()` does
   * nothing. Cancelling a frame that was already submitted throws `VGPU-FRAME-SUBMITTED` — its work
   * is on the queue and cannot be taken back, so silently accepting the call would hide a real
   * lifecycle bug.
   */
  cancel() {
    if (!this.#i) {
      if (this.#s)
        throw Mi("Frame.cancel");
      if (this.#a)
        throw Di("Frame.cancel");
      this.#i = !0, this.releaseLifecycle?.(), this.#c(this.#u()), this.#r.clear(), this.#n.clear(), G(this.#t), this.#t.length = 0;
    }
  }
  /**
   * Ends the frame for telemetry instances that will never see a real frameSubmitted: a pass whose
   * callback threw, a frame whose finish/submit failed, or a canceled frame. Each one took a retain
   * on its query ring when it was attached to a pass descriptor (so a mid-frame dispose() cannot
   * destroy a set the frame still points at); without the matching release, a dispose() after the
   * failure leaves the ring alive forever. frameAbandoned() drops the instance's pending encoded
   * state as it releases: a resolve that never reached the queue must not be decoded — its staging
   * buffer holds stale bytes, which would surface as a phantom duration or a phantom "hidden".
   */
  #c(t) {
    for (const n of [...t])
      n.frameAbandoned(this);
  }
  /** Every owner this frame attached, discarded ones included. */
  #u() {
    return [...this.#r, ...this.#n];
  }
  /** Moves owners out of this frame's live set: they are neither finalized nor read back. */
  #d(t) {
    for (const n of [...t])
      this.#r.delete(n), this.#n.add(n);
  }
  #f() {
    return [...this.#r].filter((t) => !this.#n.has(t));
  }
  /**
   * Attaches one `FramePassOptions` telemetry value to this pass through the nominal attachment
   * protocol, so the frame never learns whether it is a timer span, a visibility or a future
   * scene-view generation: it only records the owner it must settle exactly once.
   */
  #o(t, n, r, i) {
    const s = Qa(t);
    if (!s)
      throw i(t);
    let o;
    try {
      o = s[vr]({ frame: this, device: this.device, target: n });
    } catch (a) {
      throw this.#d(this.#r), a;
    }
    return this.#r.add(o.owner), r.push(o.owner), o;
  }
  async #h(t, n, r) {
    await mt(this.device), C(this.device, "Frame.validation");
    const i = ce(t, n, r);
    this.errorSink ? await this.errorSink(i) : console.error(i);
  }
  #l(t) {
    return this.trackSettled?.(t), t;
  }
}
class Xc {
  encoder;
  target;
  validations;
  depthReadOnly;
  occlusionSource;
  frame;
  assertFrameOpen;
  #e = !1;
  constructor(t, n, r, i = !1, s, o, a) {
    this.encoder = t, this.target = n, this.validations = r, this.depthReadOnly = i, this.occlusionSource = s, this.frame = o, this.assertFrameOpen = a;
  }
  draw(t, n = {}) {
    this.assertFrameOpen?.("FramePass.draw");
    const r = Zc(t);
    this.depthReadOnly && Yc(r, this.target), r.encode(this.encoder, this.target, n, (i) => this.validations.push(i));
  }
  /**
   * Wraps one or more draws in begin/endOcclusionQuery. The body ALWAYS executes; condition your
   * real draws on `q.hidden` outside.
   */
  occlusion(t, n) {
    if (this.assertFrameOpen?.("FramePass.occlusion"), !this.occlusionSource)
      throw ki();
    if (this.#e)
      throw Ii();
    const r = this.occlusionSource.beginQuery(t, this.frame);
    this.encoder.beginOcclusionQuery(r), this.#e = !0;
    try {
      typeof n == "function" ? n() : this.draw(n);
    } finally {
      this.#e = !1, this.encoder.endOcclusionQuery();
    }
  }
  bundles(...t) {
    if (this.assertFrameOpen?.("FramePass.bundles"), this.depthReadOnly)
      throw J("pass cannot replay bundles: bundle records bundles with writable depth/stencil, and WebGPU only executes read-only-recorded bundles in a read-only pass.", "Encode the draws directly with pass.draw(...) inside the depthReadOnly pass.", "FramePass.bundles");
    const n = t.map((r) => Ja(r) ?? Jc());
    for (const r of n)
      r.assertReplayable(this.target);
    this.encoder.executeBundles(n.map((r) => r.gpu));
  }
}
function Yc(e, t) {
  if (e.writesDepth())
    throw J(`pass cannot encode draw '${e.label}': its depth state writes depth (the default is write: true). Give the draw depth: { write: false } (or depth: false to disable depth testing).`, "Use depth: { write: false } on the draw, or open the pass without depthReadOnly.", "FramePass.draw");
  if (vt(t.depth?.format)) {
    const n = e.stencilWritingOps();
    if (n.length)
      throw J(`pass cannot encode draw '${e.label}': its stencil ops can write (${n.join(", ")}), and the pass's stencil aspect is read-only too.`, 'Use "keep" for those ops or stencil writeMask: 0, or open the pass without depthReadOnly.', "FramePass.draw");
  }
}
function Zc(e) {
  const t = Ya(e);
  if (!t)
    throw new TypeError("Invalid Effect instance: pass.draw() expects a Draw or an Effect created by this library.");
  return t;
}
function Jc() {
  throw new m({ code: "VGPU-R3-BUNDLE-INVALID", message: "p.bundles() expected bundles created by bundle(gpu, { target }, cb).", where: "FramePass.bundles" });
}
function Qc(e) {
  return Ei(`FramePassOptions.timer received ${H(e)}; expected a TimerSpan from timer.span(name).`, 'Create const passTimer = timer(gpu) once, then pass passTimer.span("name") per pass.', "Frame.pass");
}
function eu(e) {
  return $i(`FramePassOptions.visibility received ${H(e)}; expected a Visibility from visibility(gpu).`, "Create const vis = visibility(gpu) once, then pass { target, visibility: vis } per pass.", "Frame.pass");
}
function tu(e, t, n) {
  if (e === void 0)
    return;
  if (typeof e != "object" || e === null || Array.isArray(e))
    throw _(`received ${H(e)}; expected { x?, y?, width, height, minDepth?, maxDepth? }.`);
  const { x: r = 0, y: i = 0, width: s, height: o, minDepth: a = 0, maxDepth: c = 1 } = e;
  for (const [h, g] of [["x", r], ["y", i], ["width", s], ["height", o], ["minDepth", a], ["maxDepth", c]])
    if (typeof g != "number" || !Number.isFinite(g))
      throw _(`${h} received ${H(g)}; expected a finite number.`);
  const u = t.maxTextureDimension2D, d = u * 2, f = `target is ${n[0]}x${n[1]}px, device maxTextureDimension2D is ${u}`;
  if (!(s >= 0 && s <= u))
    throw _(`width ${s} is outside [0, ${u}] (${f}).`);
  if (!(o >= 0 && o <= u))
    throw _(`height ${o} is outside [0, ${u}] (${f}).`);
  if (!(r >= -d && r + s <= d - 1))
    throw _(`x ${r} with width ${s} is outside [${-d}, ${d - 1}] (${f}).`);
  if (!(i >= -d && i + o <= d - 1))
    throw _(`y ${i} with height ${o} is outside [${-d}, ${d - 1}] (${f}).`);
  if (!(a >= 0 && a <= 1))
    throw _(`minDepth ${a} is outside [0, 1].`);
  if (!(c >= 0 && c <= 1))
    throw _(`maxDepth ${c} is outside [0, 1].`);
  if (!(a <= c))
    throw _(`minDepth ${a} exceeds maxDepth ${c}.`);
  return { x: r, y: i, width: s, height: o, minDepth: a, maxDepth: c };
}
function nu(e, t) {
  if (e === void 0)
    return;
  if (!Array.isArray(e) || e.length !== 4)
    throw qe(`received ${H(e)}; expected [x, y, width, height].`);
  const [n, r, i, s] = e;
  for (const [c, u] of [["x", n], ["y", r], ["width", i], ["height", s]])
    if (typeof u != "number" || !Number.isInteger(u) || u < 0)
      throw qe(`${c} received ${H(u)}; expected a non-negative integer.`);
  const [o, a] = t;
  if (n + i > o || r + s > a)
    throw qe(`[${n}, ${r}, ${i}, ${s}] exceeds the target's current size ${o}x${a}px (x + width <= ${o}, y + height <= ${a}).`);
  return [n, r, i, s];
}
function H(e) {
  return typeof e == "string" ? `'${e}'` : Array.isArray(e) ? `[${e.map((t) => H(t)).join(", ")}]` : typeof e == "object" && e !== null ? "an object" : String(e);
}
function ru(e) {
  const t = e?.code;
  return t === "VGPU-DEVICE-DISPOSED" || t === "VGPU-DEVICE-LOST";
}
class iu {
  createFrame;
  advance;
  trackLoop;
  #e = !1;
  /**
   * @param trackLoop Lifecycle hook for the owning gpu: called with each started loop handle and
   * returns the untrack function the handle runs when it stops on its own, so `gpu.dispose()` can
   * stop the loops still running without holding on to the ones already stopped.
   */
  constructor(t, n, r) {
    this.createFrame = t, this.advance = n, this.trackLoop = r;
  }
  frame(t) {
    if (this.#e || Oa())
      throw Dn();
    this.#e = !0, Ba();
    try {
      this.advance();
      const n = this.createFrame();
      if (t)
        try {
          t(n);
        } finally {
          try {
            n.submit();
          } catch (r) {
            if (!ru(r))
              throw r;
          }
        }
      return n;
    } finally {
      za(), this.#e = !1;
    }
  }
  loop(t, n = {}) {
    let r = !1;
    const i = globalThis.requestAnimationFrame ?? ((h) => setTimeout(() => h(performance.now()), 16)), s = globalThis.cancelAnimationFrame ?? ((h) => clearTimeout(h)), o = n.fps && n.fps > 0 ? 1e3 / n.fps : 0;
    let a, c = 0;
    const u = (h) => {
      r || (su(h, a, o) && (a = h, this.frame(t)), r || (c = i(u)));
    };
    c = i(u);
    let d;
    const f = {
      stop() {
        r = !0, s(c), d?.(), d = void 0;
      }
    };
    return d = this.trackLoop?.(f), f;
  }
}
function su(e, t, n) {
  return t === void 0 || n <= 0 ? !0 : e - t >= n;
}
function ou(e) {
  return Wi("browser", e);
}
const au = { version: 1, wgsl: "struct U{params:vec4f,pointer:vec4f,}@group(0) @binding(0) var<uniform> u:U;fn hash2(a:vec2f)-> f32{let b=dot(a,vec2f(127.1,311.7));return fract(sin(b)*43758.5453123);}fn vnoise(a:vec2f)-> f32{let b=floor(a);let c=fract(a);let d=c*c*(3.0-2.0*c);let e=hash2(b+vec2f(0.0,0.0));let f=hash2(b+vec2f(1.0,0.0));let g=hash2(b+vec2f(0.0,1.0));let h=hash2(b+vec2f(1.0,1.0));return mix(mix(e,f,d.x),mix(g,h,d.x),d.y);}fn fbm(a:vec2f)-> f32{var b=0.0;var c=0.5;var d=a;for(var e=0;e<5;e=e+1){b=b+c*vnoise(d);d=d*2.02+vec2f(11.3,7.7);c=c*0.5;}return b;}fn ramp(a:f32)-> vec3f{let b=clamp(a,0.0,1.0);let c=vec3f(0.988,0.878,0.686);let d=vec3f(0.988,0.780,0.420);let e=vec3f(0.988,0.612,0.176);let f=vec3f(0.965,0.435,0.000);let g=vec3f(1.000,0.620,0.180);let h=vec3f(0.992,0.835,0.325);let i=vec3f(1.000,0.972,0.870);var j=mix(c,d,smoothstep(0.00,0.22,b));j=mix(j,e,smoothstep(0.18,0.40,b));j=mix(j,f,smoothstep(0.36,0.56,b));j=mix(j,g,smoothstep(0.54,0.70,b));j=mix(j,h,smoothstep(0.68,0.86,b));j=mix(j,i,smoothstep(0.86,1.00,b));return j;}@fragment fn fs_main(@location(0) a:vec2f)-> @location(0) vec4f{let b=u.params.x;let c=clamp(u.params.y,0.0,1.0);let d=max(u.params.z,0.0001);var e=a-vec2f(0.5,0.5);e.x=e.x*d;let f=fbm(e*1.5+vec2f(b*0.028,b*0.016));let g=fbm(e*2.1-vec2f(b*0.021,0.0));var h=e+vec2f(f-0.5,g-0.5)*0.42;let i=u.pointer.xy;let j=clamp(u.pointer.z,0.0,1.0);h=h+i*(0.045+j*0.05);let k=-0.34;let l=h.x*sin(k)+h.y*cos(k);var m=sin(l*5.0+b*0.30+f*2.1);m=m+0.60*sin(l*9.5-b*0.20+g*2.8);m=m+0.32*sin(l*16.5+b*0.44);m=m/1.92;var n=m*0.5+0.5;let o=length(e*vec2f(0.82,1.22));let p=smoothstep(1.25,0.0,o);n=n*0.74+p*0.36;let q=length(e-i*vec2f(0.45*d,0.45));n=n+smoothstep(0.55,0.0,q)*(0.10+j*0.14);n=n+(fbm(e*2.7+vec2f(b*0.045,0.0))-0.5)*0.10;n=n+(hash2(a*900.0+vec2f(b*60.0,0.0))-0.5)*0.018;n=mix(n,n*0.90+0.05,c*0.5);var r=ramp(clamp(n,0.0,1.0));let s=smoothstep(1.5,0.35,length(e));r=r*mix(0.9,1.02,s);return vec4f(r,1.0);}" };
function Tn() {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return !1;
  }
}
function cu() {
  try {
    const e = navigator.connection;
    return !!(e && e.saveData);
  } catch {
    return !1;
  }
}
async function Pn() {
  const e = document.getElementById("dl-hero-canvas");
  if (!e) return;
  const t = e.closest("[data-dl-hero]"), n = (p) => {
    t && t.setAttribute("data-dl-hero-state", p);
  };
  if (Tn() || cu() || !("gpu" in navigator)) {
    n("fallback");
    return;
  }
  let r;
  try {
    r = await ou();
  } catch {
    n("fallback");
    return;
  }
  if (!r) {
    n("fallback");
    return;
  }
  let i, s, o;
  try {
    i = Ma(r, e, { dpr: [1, 2] }), s = Vc(r, au, {
      label: "daylight-spectrum",
      set: { u: { params: [0, 0, 1.6, 0], pointer: [0, 0, 0, 0] } }
    }), o = zc(r);
  } catch {
    try {
      r.dispose?.();
    } catch {
    }
    n("fallback");
    return;
  }
  let a = 0, c = 0, u = 0, d = 0, f = 0, h = 0, g = 0, w = 1.6;
  const b = () => {
    const p = e.getBoundingClientRect();
    w = p.height > 0 ? p.width / p.height : 1.6;
    const y = window.innerHeight || 1;
    h = Math.min(1, Math.max(0, -p.top / y));
  };
  b();
  const I = () => {
    const p = e.getBoundingClientRect(), y = window.innerHeight || 1;
    h = Math.min(1, Math.max(0, -p.top / y));
  }, P = () => b(), E = (p) => {
    const y = e.getBoundingClientRect();
    if (y.width <= 0 || y.height <= 0) return;
    const S = (p.clientX - y.left) / y.width * 2 - 1, $ = (p.clientY - y.top) / y.height * 2 - 1, le = S - a, he = $ - c;
    f = Math.min(1, f + Math.min(1, Math.hypot(le, he) * 2.2)), a = S, c = $;
  };
  window.addEventListener("scroll", I, { passive: !0 }), window.addEventListener("resize", P, { passive: !0 }), window.addEventListener("pointermove", E, { passive: !0 });
  let v = null;
  const L = (p) => {
    u += (a - u) * 0.06, d += (c - d) * 0.06, g += (h - g) * 0.08, f *= 0.94, s.set({ u: { params: [o.time, g, w, 0], pointer: [u, d, f, 0] } }), p.pass(i, s);
  }, F = () => {
    v || (v = jc(r, L));
  }, V = () => {
    v && (v.stop(), v = null);
  };
  let ne = !0;
  const l = () => {
    ne && !document.hidden && !Tn() ? F() : V();
  };
  "IntersectionObserver" in window && new IntersectionObserver(
    (y) => {
      y.forEach((S) => {
        ne = S.isIntersecting;
      }), l();
    },
    { threshold: 0 }
  ).observe(e), document.addEventListener("visibilitychange", l);
  try {
    window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", l);
  } catch {
  }
  window.addEventListener("pagehide", () => {
    V();
    try {
      r.dispose?.();
    } catch {
    }
  }), n("live"), l();
}
document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", Pn) : Pn();
