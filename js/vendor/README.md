# Vendored third-party libraries

Local production builds, pinned to an exact version. No runtime CDN dependency.

## GSAP + ScrollTrigger — 3.13.0

- Source: https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js
- Source: https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollTrigger.min.js
- Version: 3.13.0
- License: GreenSock Standard "No Charge" License — https://gsap.com/standard-license
  ScrollTrigger is included in the free/standard tier as of GSAP 3.12+.
- Used only for the Ray case study's two signature story moments:
  the pinned trust sequence and its scrubbed text reveal.
- The page is fully legible and correctly ordered if these files are blocked;
  GSAP is pure progressive enhancement (see js/ray-case-study.js).
