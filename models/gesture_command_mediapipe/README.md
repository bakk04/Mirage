# MediaPipe Gesture Recognizer — verified asset

## Installed asset

| Field | Verified value |
| --- | --- |
| File | `gesture_recognizer.task` |
| Source | `https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task` |
| Downloaded size | 8,373,440 bytes (7.99 MiB) |
| SHA-256 | `97952348cf6a6a4915c2ea1496b4b37ebabc50cbbf80571435643c455f2b0482` |
| MD5 | `4dbf485c473207651100a1895343f35a` |
| Model family | Official MediaPipe Gesture Recognizer float16 bundle, version 1 path |
| License / attribution | MediaPipe task documentation and code samples: Apache-2.0; retain Google/MediaPipe attribution. Confirm the embedded model's distribution terms before redistribution outside this project. |

The bundle is **for interface-control gestures only**. It must not be presented as an Arabic Sign Language classifier.

## Supported built-in categories

`None`, `Closed_Fist`, `Open_Palm`, `Pointing_Up`, `Thumb_Down`, `Thumb_Up`, `Victory`, and `ILoveYou`.

`Pinch`, swipes, and application-specific commands in the current UI are not standard categories in this bundle. They require either application-side landmark logic that is independently validated, or a separately trained custom MediaPipe gesture model.

## Web integration contract

Use the existing `src/services/gestureCommandService.ts` as the service boundary. The frontend still needs `@mediapipe/tasks-vision` added and pinned in `package.json`, then must initialize `GestureRecognizer` with this local asset, `runningMode: "VIDEO"`, and a unique video timestamp per frame. It returns category scores, handedness, 21 normalized landmarks, and 21 world landmarks per detected hand.

MediaPipe documents that Web `recognizeForVideo()` is synchronous and can block the UI thread. Run it at a bounded cadence and move inference to a Web Worker before treating real-time performance as proven.

Official references:

- https://developers.google.com/edge/mediapipe/solutions/vision/gesture_recognizer/web_js
- https://developers.google.com/edge/mediapipe/solutions/vision/gesture_recognizer
- https://developers.google.com/edge/mediapipe/solutions/customization/gesture_recognizer
