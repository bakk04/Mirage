# MIRAGE AI — Verification Checklist

## Completed automated gates

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- Production build emits separate chunks for each state, the command palette, and `OrbWebGL`.
- `tests/mirage.smoke.spec.ts` covers loading the page, keyboard switching through states 1–8, and console-error collection.

The Playwright package is not installed in this Figma Make workspace, so the smoke test is added but not executed here. Install it with `npm install -D @playwright/test` before running `npm run test:e2e`.

## Manual responsive checks

Use the preview at:

- 390×844: confirm the bottom dock, 72px touch targets, safe-area padding, no horizontal overflow, and snap-scrolling memory cards.
- 768×1024: confirm state surfaces do not clip and the command palette remains centered.
- 1440×900: confirm orb travel, dock magnification, status-pill morphing, focus pull, and Imagine transition.

## Lighthouse commands

With the app available at `http://localhost:8443`:

```bash
npx lighthouse http://localhost:8443 --preset=desktop --output=html --output-path=./lighthouse-desktop.html
npx lighthouse http://localhost:8443 --preset=mobile --output=html --output-path=./lighthouse-mobile.html
```

Review LCP, CLS, INP/TBT, total blocking time, image delivery, unused JavaScript, and the largest network requests. The target thresholds are LCP under 2s, CLS under 0.05, and INP under 200ms on representative hardware.

## Chrome DevTools performance recording

1. Open Performance, enable screenshots, and record a cold load through Idle.
2. Record a state switch from Idle to Listening and inspect Main-thread tasks, scripting time, long tasks, and paint/composite events.
3. Record orb gaze movement for five seconds; look for React commits, layout/forced style recalculation, and dropped frames.
4. Record Imagine entry and “Back to reality”; inspect transition duration, image decode, filters, and layout shifts.
5. Repeat with CPU 4× slowdown and the mobile viewport.
6. In the Rendering panel, enable Paint flashing and FPS meter for diagnosis only; do not expose these metrics in the product UI.

Runtime FPS cannot be measured reliably from this coding environment. Send back the Performance recording’s dropped-frame count, long-task duration, LCP/CLS/INP, and the largest JS/image requests for a hardware-specific follow-up.

## Remaining limitations

- This repository is a Vite React app, not Next.js. Next Server Components, `next/dynamic`, `next/image`, `next/font`, and `@next/bundle-analyzer` cannot be added without replacing the Figma Make runtime.
- The WebGL chunk remains large because Three.js, React Three Fiber, postprocessing, and shader support are loaded together. The production build reports approximately 998 kB minified (about 265 kB gzip) for `OrbWebGL`; keep it dynamically loaded and consider a lighter shader/postprocessing implementation if the mobile budget requires it.
- Vite emits existing config-loader warnings for `__dirname` and JSON import attributes.
- Camera and scene imagery are remote Unsplash URLs; a production deployment should provide local optimized assets and explicit image error UI.
- Playwright execution requires installing its package and browser binaries in the host environment.
