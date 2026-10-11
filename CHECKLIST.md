# MIRAGE manual verification checklist

## Real browser media

- [ ] HTTPS or localhost is used; the secure-context message appears on an insecure origin.
- [ ] Vision opens the permission screen before `getUserMedia`; Allow camera shows live `<video>` and no substitute image.
- [ ] Camera denial shows browser re-enable instructions and Try again.
- [ ] Switch camera appears only when multiple video inputs exist; front camera mirroring follows the setting.
- [ ] Capture creates a JPEG thumbnail with the current timestamp and it appears in Memory; object URLs remain valid while the app is open.
- [ ] Talk requests microphone permission only from the Talk button, orb, Space, or long-press.
- [ ] Accepted microphone input changes the listening aura; denial shows “Microphone off” behavior without a crash.
- [ ] A camera unplug/replug or track-ended event shows an actionable error.
- [ ] Switching tabs for more than 30 seconds stops camera tracks; returning restarts only after the user has previously granted access.

## Responsive and accessibility

- [ ] At 390×844, 768×1024, and 1440×900 the nav is visible, readable, inside the viewport, and the aura has no rectangular corners.
- [ ] Vision, Talk, Memory, Imagine, and Command Palette each have a visible close/back path; Escape closes overlays.
- [ ] Every icon button has an accessible name, tooltip/title, and turquoise keyboard focus ring.
- [ ] Mobile uses safe-area padding, a 72px central capture/talk target, no horizontal page scroll, and snap-scrolling memories.
- [ ] Settings toggles persist after reload; reduced motion removes nonessential movement.
- [ ] Browser back/forward and mobile back gestures do not leave an overlay stuck open.

## Device/browser matrix

- [ ] Chromium desktop with camera and microphone permissions accepted and denied.
- [ ] Mobile Safari with rotation from portrait to landscape.
- [ ] Chrome Android with front/back camera switching.
- [ ] Tab switch/return on desktop and mobile.

## Measurement limitations

- [ ] Measure real GPU frame rate and WebGL context recovery on representative hardware.
- [ ] Verify physical camera/microphone switching and unplug/replug behavior.
- [ ] Verify Safari permission UI, iOS background suspension, and Android Chrome rotation.
- [ ] Run the Playwright fake-media suite after Chromium headless-shell installation succeeds.
