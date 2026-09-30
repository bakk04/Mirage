# MIRAGE AI — Phase 1 Spec Compliance Audit

Read-only baseline review of the Vite/React implementation before optimization. “OK” means the requirement is present in the current code; “Partial” means a prototype exists but an important part of the contract is missing; “Broken” means the behavior is unsafe or does not meet the stated requirement.

| Item | Status | File | Problem | Fix |
| --- | --- | --- | --- | --- |
| Eight states and labels | OK | `src/store/mirageStore.ts:4-12,60-79` | All eight state values and labels are defined. | Preserve the typed state union. |
| Numeric keyboard states 1–8 | OK | `src/App.tsx:194-225` | Direct numeric mapping exists. | Keep centralized routing and add smoke coverage. |
| Arrow state navigation | OK | `src/App.tsx:212-214` | Left/right cycling exists. | Keep and test. |
| Dock state buttons | Partial | `src/components/Dock.tsx:26-31,63-69` | Text is a no-op, and buttons lack accessible names. | Make text open its composer intentionally and add labels/focus states. |
| Shared-layout orb travel | Partial | `src/App.tsx:346-382`, `src/components/MirageOrb/index.tsx:84-94` | `layoutId` is on the orb, but center/corner movement is manual fixed positioning and not a shared-layout handoff between surfaces. | Keep one shared orb surface, use transform-based travel and explicit mobile dock placement. |
| MirageOrb props and fallback | OK | `src/components/MirageOrb/index.tsx:23-31` | WebGL and SVG accept the required state/amplitude/gaze/size contract. | Preserve the interface and improve loading/error fallback. |
| Two translucent crescents | OK | `src/components/MirageOrb/OrbSVG.tsx:57-128`, `src/components/MirageOrb/shaders.ts:82-94` | Both fallback and shader render two crescent forms. | Preserve visual identity. |
| Simplex-noise organic edges | OK | `src/components/MirageOrb/shaders.ts:17-45,69-73` | Simplex noise is present in the shader. | Reduce per-frame work and expose quality. |
| Bloom | OK | `src/components/MirageOrb/OrbWebGL.tsx:82-84` | Postprocessing bloom is enabled. | Use adaptive DPR and cheaper antialias/postprocessing settings. |
| ~24 particles | OK | `src/components/MirageOrb/OrbSVG.tsx:131-164` | SVG fallback renders 24 particles. | Avoid repeated animation allocations where practical. |
| Floor reflection | OK | `src/components/MirageOrb/OrbSVG.tsx:166-177` | Reflection exists in fallback. | Keep it aligned with WebGL behavior. |
| Four-second breathing, amplitude, gaze | Partial | `src/components/MirageOrb/OrbWebGL.tsx:41-48`, `OrbSVG.tsx:19-25,35-53` | Breathing is state-specific in WebGL and CSS fallback; gaze is copied through React state in App, causing per-frame rerenders. | Move continuous values to motion refs/values and freeze correctly for reduced motion. |
| Cursor gaze max 14px | OK | `src/components/MirageOrb/OrbSVG.tsx:19-25`, `src/App.tsx:99-115` | Spring gaze is capped by the `* 14` mapping. | Extract a reusable rAF-batched mouse hook. |
| Six-second idle look-around | Partial | `src/App.tsx:105-115` | It starts only after mouse movement, can stack intervals/timeouts, and does not account for reduced motion. | Make the idle timer deterministic and cancelable. |
| Eight-to-twelve-second blink | Missing | `src/components/MirageOrb/OrbSVG.tsx`, `shaders.ts` | No blink implementation exists. | Add a low-cost fallback/WebGL blink signal with cleanup and motion preference support. |
| macOS dock magnification | Partial | `src/components/Dock.tsx:49-60` | Desktop magnification exists, but mouse geometry is read inside a transform callback and touch/mobile behavior is not redesigned. | Keep motion values and add mobile-safe dock sizing. |
| Magnetic dock buttons | Partial | `src/components/Dock.tsx:58-60` | Magnetic y transform exists; no explicit touch fallback or cleanup for press timers. | Add pointer-safe interaction and cleanup. |
| Dynamic-Island status pill | Partial | `src/components/StatusPill.tsx:72-118` | Layout animation and content morphing exist, but width is directly animated (`width: 'auto'`) and no reduced-motion gating is applied. | Animate transform/opacity where possible and add motion-safe behavior. |
| Cinematic focus pull | Partial | `src/components/states/UnderstandingState.tsx:50-57` | Masked blur prototype exists but does not robustly handle image failure or a true extracted object target. | Add image/error fallback and keep the focus mask performant. |
| Dominant-color ambient light | Missing | `src/store/mirageStore.ts`, `src/components/states/*` | A dominant color store field exists but no extraction or ambient application is wired. | Add a one-shot, idle-scheduled 32×32 image sampler. |
| Real microphone amplitude | Broken | `src/App.tsx:35-85` | Microphone access starts on mount without a gesture, creates an AudioContext per hook instance, never stops tracks/closes the context, and the fallback runs forever. | Create audio only after interaction, share one analyser loop, clean up all resources. |
| Word-by-word blur-to-sharp streaming | OK | `src/components/states/ConversationState.tsx:8-35` | Word reveals and blur-to-sharp animation exist. | Add live-region semantics and reduced-motion behavior. |
| Suggestion chips | OK | `src/components/SuggestionChips.tsx:5-49` | Chips exist and route to states. | Add touch/focus affordances and avoid unnecessary nested loops. |
| Parallax depth | Partial | `src/components/states/ImagineState.tsx:10-40`, `MemoryState.tsx:49-67` | Parallax uses React state on every pointer move. | Use motion values and rAF-batched pointer input. |
| Scan sweep | OK | `CameraState.tsx:61-72`, `UnderstandingState.tsx:68-79` | Both camera and understanding include a sweep. | Keep as transform-only animation. |
| Cmd/Ctrl+K command palette | Partial | `src/App.tsx:205-208`, `src/components/CommandPalette.tsx:40-132` | Shortcut and palette exist, but dialog/listbox semantics, focus return, and focus trap are missing. | Add accessible dialog semantics and keyboard selection. |
| Long-press talk + vibrate(10) | Partial | `src/components/MirageOrb/index.tsx:47-68` | Long press works on pointer up but pointer cancel/blur cleanup is incomplete. | Use a reusable long-press hook with cancel paths. |
| Optional sound design off by default | Partial | `src/store/mirageStore.ts:26,34-58` | Store toggle exists but no sound design is implemented or exposed. | Keep off by default; add only a small gesture-created audio path if wired. |
| `prefers-reduced-motion` | Partial | `src/index.css:147-153` | CSS reduces durations, but JS/Three animation loops and movement state continue. | Add a `useReducedMotion` hook and freeze shader/continuous effects. |
| 60fps transform/opacity-only motion | Broken | Multiple state files | Width, height, clip-path, backdrop-filter, SVG path, filter and React-state-per-pointer animations are used in hot paths. | Restrict continuous animation to transforms/opacity and batch input. |
| Top-nav auto-fade after four seconds | OK | `src/components/TopNav.tsx:28-42,51-55` | Fades after four seconds and reveals on pointer/touch. | Add keyboard activity and reduced-motion handling. |
| Memory timeline | Partial | `src/components/states/MemoryState.tsx:127-193` | Cards, parallax, line, and traveling dot exist; cards are not draggable and mobile snap behavior is absent. | Add scroll snap, pointer drag affordance, and motion-value parallax. |
| Imagine 1.2s transition | OK | `src/App.tsx:332-343`, `ImagineState.tsx:23-25` | 1.2s transition exists. | Preserve and add robust image fallback. |
| “Back to reality” | OK | `src/components/states/ImagineState.tsx:161-177` | Button returns to camera. | Add accessible focus treatment. |
| Mobile 390×844 redesign | Broken | `src/App.tsx`, `src/components/Dock.tsx`, `src/components/states/MemoryState.tsx` | Desktop dimensions dominate; no 72px thumb button, bottom-sheet treatment, safe-area padding or snap timeline. | Add responsive layout tokens and mobile-specific surfaces. |
| No technical data in UI | OK | `src` | No FPS/log/stats UI is rendered. | Preserve this invariant. |
| Server Components / Next.js architecture | Missing | `package.json`, `src` | This is a Vite SPA; there are no Server Components, `next/dynamic`, `next/image`, or `next/font` boundaries. | Keep the Figma Make Vite runtime; emulate the useful boundaries with dynamic imports and browser-only components rather than breaking the scaffold. |
| Heavy-state code splitting | Broken | `src/App.tsx:10-18` | Every state and WebGL dependency is imported into the initial module. | Lazy-load heavy states and WebGL with lightweight fallbacks. |
| Strict TypeScript | OK | `tsconfig.json:17-20` | Strict mode is enabled. | Remove remaining unsafe casts and implicit cleanup gaps. |
| Zustand selector usage | Partial | `src/store/mirageStore.ts`, components | Zustand is used with selectors, but high-frequency amplitude is pushed through global store state and causes broad updates. | Keep selectors and isolate hot animation values from React state. |
| Error fallbacks | Missing | `src/components/MirageOrb`, state images/audio | WebGL import errors are swallowed, and image/mic/camera/offline failure UI is not surfaced. | Add explicit non-crashing fallback surfaces and status messaging. |
| Existing verification scripts | Broken | `package.json` | `lint` is missing; no Playwright smoke test or bundle analyzer exists. | Add minimal existing-tool-compatible scripts/configuration and smoke coverage. |

## Prioritized issue list

### Critical

1. Microphone resources leak and permission is requested on initial mount (`src/App.tsx:43-83`).
2. The initial bundle includes all state modules and the ~1 MB WebGL chunk is eagerly reachable (`src/App.tsx:10-18`; baseline build).
3. The application has no lint script, no smoke test, and no explicit error UI for core media/rendering failures.

### High

1. High-frequency pointer and microphone updates trigger React/store rerenders instead of staying in motion values or refs.
2. Reduced motion does not freeze JS/Three loops or remove movement semantics.
3. Mobile requirements (safe areas, bottom sheet, 72px thumb control, snap memory timeline) are not implemented.
4. Dominant-color lighting and blink behavior are missing.
5. Command palette and icon controls lack complete keyboard/ARIA semantics.

### Medium

1. Focus-pull, status morph, and dock interactions animate layout/filter properties in places where transform/opacity would be cheaper.
2. Memory cards are visual-only rather than draggable and do not use mobile scroll snap.
3. Image loading relies on remote CSS backgrounds with no explicit loading/error strategy.
4. The SVG fallback generates animated DOM particles and unique SVG filter IDs per instance.

### Low

1. Vite reports config-loader deprecation warnings for `__dirname` and JSON imports.
2. The development demo switcher is always visible and is not part of the requested polished surface.
3. The global grain animation is more expensive than a static tiled texture.
