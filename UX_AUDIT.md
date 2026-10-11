# MIRAGE UX audit

| Issue | Severity | Fix | Verified how |
| --- | --- | --- | --- |
| Listening visual was a ring/rectangle composition rather than a Siri-style orb | Critical | Replaced it with a single circular shader/fallback sphere, 2.4× transparent host, four additive liquid-light blobs, circular rim, radial halo, amplitude deformation and speaking rings | Source inspection; `npx tsc --noEmit`, `npm run lint`, and `npm run build` pass |
| Orb could return with stale transforms or duplicated animation resources | Critical | Added explicit transition validation, state lifecycle enter/exit hook, spring stop cleanup, deterministic CSS/WebGL mount surface, analyser reset and runtime loop/listener counters | 15-cycle Playwright regression test added; browser execution blocked by Chromium headless-shell download |
| WebGL alpha/context handling was incomplete | High | Transparent renderer clear, circular SDF with anti-aliased edge, context lost/restored listeners, reduced-motion frozen shader time | Build passes; real GPU context restoration remains manual |
| Static state imagery could hide the live camera | Critical | Camera remains the media layer for Understanding; contour/focus-pull overlays sit above the live video | Typecheck/build pass; fake-media browser run blocked by browser binary |
| Shared layout and layer values were scattered | High | Added `src/lib/designSystem.ts`, CSS variables for spacing/type/radius/layers, and applied shared z-index/touch/nav/dock geometry to core chrome | Typecheck/build pass; responsive geometry requires browser measurement |
| Settings/profile controls were not fully useful | Medium | Profile opens the settings popover; settings now include sound, motion, mirror, demo detection, camera device and microphone device values with local persistence | Typecheck/build pass; persistence is covered in the manual checklist |
| Async state effects could leak timers/RAF work | High | Count-up RAF and understanding timers now clean up; microphone fallback/real loops reset to one active loop and zero amplitude on stop | Static inspection and typecheck; runtime metrics exposed in development |
| Focus-pull and detection overlays lacked a masked live-video layer | Medium | Added a normalized radial backdrop blur mask behind the contour/label overlay | Source inspection; live camera appearance remains manual |
| Command palette layering was outside the documented scale | Medium | Moved palette scrim/dialog to modal z-index tokens | Typecheck/build pass |
| Listening feedback felt fast and the voice amplitude was not fully reactive in the SVG fallback | High | Bound halo and sphere scale directly to the microphone MotionValue, slowed the liquid drift/specular motion, and softened the status pulse | Source inspection; `npx tsc --noEmit`, `npm run lint`, and `npm run build` pass |
| User prompts and MIRAGE replies could compete visually in Conversation | Medium | Added distinct speaker labels, asymmetric glass surfaces, constrained readable widths, and a safe conversation zone above the dock | Source inspection; responsive classes cover mobile and desktop layouts |

## Verification evidence

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed.
- `npm install --save-dev @playwright/test`: completed with 0 vulnerabilities.
- `npx playwright test`: attempted but blocked because the required Chromium headless-shell binary was unavailable.
- `npx playwright install chromium`: full Chrome for Testing downloaded, but the headless-shell download timed out and then failed DNS resolution.

The build still reports Vite’s existing `__dirname`/JSON import warning and the large WebGL chunk warning. They are warnings, not failed gates.
