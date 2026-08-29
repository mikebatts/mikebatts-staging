// Ambient type for typed .wgsl imports through @vgpu/wgsl/loader-vite.
declare module "*.wgsl" {
  import type { ShaderSource } from "@vgpu/wgsl";
  const source: ShaderSource;
  export default source;
}
