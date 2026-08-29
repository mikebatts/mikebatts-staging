/**
 * Daylight case-study hero — isolated WebGPU field, built on Vercel Labs vgpu.
 *
 * Persistent pattern: one init() context, one responsive surface() with capped
 * DPR, one effect, one clock, one frame loop. Uniforms carry the only changing
 * state (time, scroll, pointer). GPU resources are never recreated per frame.
 *
 * The loop pauses when the canvas is offscreen or the tab is hidden, and never
 * starts under reduced-motion, save-data, or when WebGPU is unavailable — in
 * those cases the static CSS poster underneath stays visible. Compiles to a
 * self-contained ESM bundle (js/daylight-spectrum.js) for static hosting.
 *
 * No network calls, no credentials, nothing outside the hero canvas.
 */
import { init, effect, surface, clock, frameLoop } from "vgpu";
import spectrumShader from "./daylight-spectrum.wgsl";

type LoopHandle = { stop(): void };

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

function prefersSaveData(): boolean {
  try {
    const conn = (navigator as unknown as { connection?: { saveData?: boolean } }).connection;
    return !!(conn && conn.saveData);
  } catch {
    return false;
  }
}

async function boot(): Promise<void> {
  const canvas = document.getElementById("dl-hero-canvas") as HTMLCanvasElement | null;
  if (!canvas) return;
  const stage = canvas.closest("[data-dl-hero]") as HTMLElement | null;
  const setState = (state: string) => {
    if (stage) stage.setAttribute("data-dl-hero-state", state);
  };

  // Bail to the static poster before touching the GPU when motion is unwanted,
  // data is precious, or WebGPU simply is not there.
  if (prefersReducedMotion() || prefersSaveData() || !("gpu" in navigator)) {
    setState("fallback");
    return;
  }

  let gpu: Awaited<ReturnType<typeof init>>;
  try {
    gpu = await init();
  } catch {
    setState("fallback");
    return;
  }
  if (!gpu) {
    setState("fallback");
    return;
  }

  let surf: ReturnType<typeof surface>;
  let fx: ReturnType<typeof effect>;
  let time: ReturnType<typeof clock>;
  try {
    surf = surface(gpu, canvas, { dpr: [1, 2] });
    fx = effect(gpu, spectrumShader, {
      label: "daylight-spectrum",
      set: { u: { params: [0, 0, 1.6, 0], pointer: [0, 0, 0, 0] } },
    });
    time = clock(gpu);
  } catch {
    try {
      (gpu as unknown as { dispose?: () => void }).dispose?.();
    } catch {
      /* noop */
    }
    setState("fallback");
    return;
  }

  // Smoothed, interaction-driven uniforms.
  let ptxTarget = 0;
  let ptyTarget = 0;
  let ptx = 0;
  let pty = 0;
  let energy = 0;        // pointer energy: rises on movement, decays at rest
  let scrollTarget = 0;
  let scroll = 0;
  let aspect = 1.6;

  const measure = () => {
    const rect = canvas.getBoundingClientRect();
    aspect = rect.height > 0 ? rect.width / rect.height : 1.6;
    const vh = window.innerHeight || 1;
    scrollTarget = Math.min(1, Math.max(0, -rect.top / vh));
  };
  measure();

  const onScroll = () => {
    const rect = canvas.getBoundingClientRect();
    const vh = window.innerHeight || 1;
    scrollTarget = Math.min(1, Math.max(0, -rect.top / vh));
  };
  const onResize = () => measure();
  const onPointer = (e: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    // energy is proportional to how far the pointer jumped this event
    const dx = nx - ptxTarget;
    const dy = ny - ptyTarget;
    energy = Math.min(1, energy + Math.min(1, Math.hypot(dx, dy) * 2.2));
    ptxTarget = nx;
    ptyTarget = ny;
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });
  window.addEventListener("pointermove", onPointer, { passive: true });

  let handle: LoopHandle | null = null;
  const render = (frame: { pass: (target: unknown, body: unknown) => void }) => {
    ptx += (ptxTarget - ptx) * 0.06;
    pty += (ptyTarget - pty) * 0.06;
    scroll += (scrollTarget - scroll) * 0.08;
    energy *= 0.94; // decay toward rest
    fx.set({ u: { params: [time.time, scroll, aspect, 0], pointer: [ptx, pty, energy, 0] } });
    frame.pass(surf, fx);
  };

  const start = () => {
    if (!handle) handle = frameLoop(gpu, render) as LoopHandle;
  };
  const stop = () => {
    if (handle) {
      handle.stop();
      handle = null;
    }
  };

  let onScreen = true;
  const evaluate = () => {
    if (onScreen && !document.hidden && !prefersReducedMotion()) start();
    else stop();
  };

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          onScreen = entry.isIntersecting;
        });
        evaluate();
      },
      { threshold: 0 },
    );
    io.observe(canvas);
  }
  document.addEventListener("visibilitychange", evaluate);
  try {
    window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", evaluate);
  } catch {
    /* Safari < 14 has no MediaQueryList.addEventListener; static check already ran. */
  }
  window.addEventListener("pagehide", () => {
    stop();
    try {
      (gpu as unknown as { dispose?: () => void }).dispose?.();
    } catch {
      /* noop */
    }
  });

  setState("live");
  evaluate();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  void boot();
}
