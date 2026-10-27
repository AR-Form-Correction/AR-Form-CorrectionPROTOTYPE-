# AR Fitness Form Correction

A browser-based exercise coaching prototype built with React, MediaPipe Pose,
and the Web Speech API. The app uses a live camera feed to identify body
landmarks, compare the user's posture with target poses, count completed
movement cycles, and provide visual and spoken feedback.

For implementation details, formulas, thresholds, and state-machine behavior,
see [TECHNICAL_REFERENCE.md](./TECHNICAL_REFERENCE.md).

## User journey

### 1. Home

The landing screen introduces the form-correction experience. Select **Get
Started** to open the exercise library.

### 2. Exercise selection

Choose one of four exercises:

- Push-up
- Plank
- Squat
- Sit-up

Selecting an exercise starts the calibration flow.

### 3. Camera and distance calibration

The app requests camera permission and starts MediaPipe pose detection.

Stand far enough from the camera for your full body to be visible. Distance is
considered optimal when:

- normalized shoulder width is between `0.15` and `0.35`; and
- both ankles are detected with a depth value below `1`.

Hold the optimal position for three seconds, or use the continue button when it
appears.

### 4. Body calibration

Follow eight guided poses:

1. T-pose
2. Standing with arms lowered
3. Left leg raise
4. Right leg raise
5. Arms extended
6. Head turned left
7. Head turned right
8. Forward torso bend

Each pose must reach a match score of at least `70`. The alignment meter rises
while the pose matches and falls when it does not. Once locked, hold the pose
for four seconds before moving to the next instruction.

### 5. Goal selection

Choose a repetition target for push-ups, squats, or sit-ups. Plank offers a
duration target in seconds.

### 6. Exercise walkthrough

Review the movement sequence, form instructions, and key points. The
demonstration cycles through the target poses before the live session starts.

### 7. Live exercise

After a three-second countdown, the app:

- tracks pose landmarks continuously;
- analyzes the latest pose once per second;
- compares all target poses for the selected exercise;
- measures exercise-specific joint angles and alignment;
- tracks camera distance and detected form issues;
- displays an overlay and joint-level status;
- provides queued spoken corrections and encouragement; and
- counts a repetition after a complete start → end → start pose cycle.

For squats, turn your left side toward the camera. Other exercises use the
front-view distance heuristic.

### 8. Results

After the target is completed, the analysis screen reports:

- overall form consistency;
- average exercise-specific angles;
- distance consistency;
- frequently detected form issues; and
- suggested corrections.

You can retry the same exercise or return to exercise selection.

## Camera requirements

- Use `localhost` or HTTPS; camera access is blocked in insecure contexts.
- Allow camera access in Chrome and in operating-system privacy settings.
- Close other applications that may already be using the camera.
- If Chrome flags are changed, fully restart Chrome before testing.
- If permission was previously denied, reset the site's camera permission,
  reload, and select **Try Again**.

The app requests a 1280×720 stream and initially prefers the front-facing
camera. A camera-switch control toggles between front and rear cameras when the
device supports both.

## Run locally

Requirements:

- Node.js 22
- npm

```bash
npm ci
npm run dev
```

Open the local URL shown by Vite.

## Production build

```bash
npm run build
```

The static output is written to `dist/`.

## Current limitation

The plank UI accepts a duration target, but the current live implementation
does not increment a plank timer or automatically complete a plank session.
Push-up, squat, and sit-up repetition counting are implemented.
