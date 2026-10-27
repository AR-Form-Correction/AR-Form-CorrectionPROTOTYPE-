# Technical Reference

This document describes the behavior currently implemented in the application.
It is a code-level reference, not a clinical validation of the biomechanical
thresholds.

## 1. Runtime architecture

The top-level state machine lives in `src/app/App.tsx`:

```text
home
  → selection
  → calibration
  → repSelection
  → walkthrough
  → live
  → analysis
```

The selected exercise, target count, and completed session data are held in
React state. There is no router or backend; screen changes are conditional
renders in one browser session.

Primary modules:

- `CameraFeed.tsx`: camera permission, stream startup, camera switching,
  fallback Test Mode, and stream cleanup.
- `useMediaPipePose.ts`: MediaPipe initialization and per-frame landmark
  detection.
- `CalibrationView.tsx`: distance and eight-pose calibration.
- `poseComparison.ts`: geometry, pose scores, form-issue rules, and metric
  extraction.
- `LiveExerciseView.tsx`: one-second analysis loop, movement state machine,
  scoring, audio feedback, and session data.
- `PostExerciseAnalysis.tsx`: summary metrics and frequency-based feedback.

## 2. Camera and landmark pipeline

`CameraFeed` calls:

```ts
navigator.mediaDevices.getUserMedia({
  video: {
    facingMode,
    width: { ideal: 1280 },
    height: { ideal: 720 },
  },
  audio: false,
});
```

The returned `MediaStream` becomes the `<video>` element's `srcObject`.
MediaPipe starts only after the video has metadata, non-zero dimensions, and a
`readyState` of at least `2`.

MediaPipe Pose Landmarker uses:

- the hosted MediaPipe WASM runtime;
- the lite pose-landmarker model;
- GPU delegation;
- `VIDEO` running mode;
- one detected pose;
- detection, presence, and tracking confidence thresholds of `0.5`.

Detection runs through `requestAnimationFrame`. A video frame is skipped when
its `currentTime` is unchanged. MediaPipe returns normalized landmark
coordinates:

- `x`: horizontal position, normally in `[0, 1]`;
- `y`: vertical position, normally in `[0, 1]`, increasing downward;
- `z`: relative depth.

The app maps the required MediaPipe indices into named landmarks such as
shoulders, elbows, wrists, hips, knees, and ankles.

MediaPipe can detect landmarks every video frame, but live movement analysis
uses only the most recent landmark set once every `1000 ms`.

## 3. Geometry

### 3.1 Joint angle

For points `A`, `B`, and `C`, where `B` is the joint vertex:

```text
θ1 = atan2(Cy - By, Cx - Bx)
θ2 = atan2(Ay - By, Ax - Bx)
θ  = abs((θ1 - θ2) × 180 / π)

if θ > 180:
  θ = 360 - θ
```

The result is constrained to `[0°, 180°]`.

Examples:

- shoulder → elbow → wrist gives elbow flexion;
- hip → knee → ankle gives knee flexion;
- shoulder center → hip center → ankle center gives body alignment.

### 3.2 Point distance

The utility defines normalized Euclidean distance:

```text
d = sqrt((x2 - x1)² + (y2 - y1)²)
```

Most current distance checks use horizontal or vertical spans directly rather
than this helper.

### 3.3 Angle from vertical

For a top point and bottom point:

```text
dx = top.x - bottom.x
dy = top.y - bottom.y
horizontalAngle = atan2(dy, dx) × 180 / π
verticalAngle = abs(90 - abs(horizontalAngle))
```

This is used for squat trunk lean and sit-up torso/lumbar flexion.

### 3.4 Linear pose scoring

Many pose components use:

```text
score = max(0, 100 - abs(targetAngle - measuredAngle) × penalty)
```

The penalty is commonly `2` points per degree. A 10° error therefore removes
20 points. Composite pose scores are arithmetic means or explicit weighted
means of their component scores.

## 4. Distance classification

### 4.1 Calibration

```text
shoulderWidth = abs(leftShoulder.x - rightShoulder.x)
```

- Too close: `shoulderWidth > 0.35`
- Too far: `shoulderWidth < 0.15` or either ankle has `z >= 1`
- Optimal: shoulder width from `0.15` through `0.35`, with both ankles visible

Optimal distance must persist for three seconds. The timer advances by `0.1`
every `100 ms` and resets whenever distance becomes non-optimal.

### 4.2 Live front-view exercises

Push-ups, planks, and sit-ups use shoulder width:

- Too close: width `> 0.45`
- Too far: width `< 0.10`
- Too far: ankles are not visible and width `< 0.15`
- Otherwise optimal

### 4.3 Live side-view squat

Squats use normalized body height because shoulder width collapses in profile:

```text
bodyHeight = abs(leftShoulder.y - leftAnkle.y)
```

- Too close: height `> 0.75`
- Too far: height `< 0.45` or the left ankle is not visible
- Otherwise optimal

## 5. Calibration pose acceptance

Each calibration pose receives a `0–100` score from `comparePose`.

- Score `>= 70`: alignment progress increases by `10`.
- Score `< 70`: alignment progress decreases by `5`.
- Progress is clamped to `[0, 100]`.
- At `100`, a one-second delay locks the position.
- A locked pose is held for four seconds.

Progress updates when new landmarks cause the calibration effect to run; it is
not a fixed 10 Hz sample despite the historical comments in the source.

Calibration pose formulas:

- **T-pose:** mean of left-arm straightness, right-arm straightness, and a
  binary horizontal-arm score. Wrists must be within `0.1` normalized y-units
  of shoulders.
- **Standing:** mean of arm-by-side score and left/right knee straightness.
- **Leg raise:** raised knee targets `90°`, the support leg targets `180°`,
  and the raised knee must be above its hip.
- **Arms extended:** binary horizontal-position and height tests.
- **Head turns:** score from nose displacement over `0.01` and left/right ear
  depth difference over `0.03`.
- **Torso bend:** torso vertical angle receives 70% weight and leg straightness
  receives 30%. `70–100°` earns full torso-angle credit; `60–110°` earns 80.

## 6. Exercise pose scores

### 6.1 Push-up

**Up pose**

- Both elbow angles target `180°`.
- Alignment uses the vertical difference between average shoulder and hip
  height: `max(0, 100 - abs(shoulderY - hipY) × 300)`.
- Final score is the mean of both elbow scores and alignment.

**Down pose**

- Both elbow angles target `90°`.
- The same shoulder/hip alignment score is used.

### 6.2 Squat, left-side view

**Up pose**

- Left knee targets `170°`.
- Upright score is
  `max(0, 100 - abs(shoulderY - hipY + 0.15) × 200)`.
- Final score is the mean of leg and upright scores.

**Down pose**

- Left knee angles from `70°` through `110°` receive `100`.
- Outside that range, score falls by `2` points per degree from `90°`.
- Depth score is
  `clamp((leftHip.y - leftKnee.y) × 500, 0, 100)`.
- Final score is the mean of knee and depth scores.

### 6.3 Sit-up

**Down pose**

```text
flatScore = max(0, 100 - abs(shoulderY - hipY) × 300)
```

**Up pose**

- Shoulders at or above hip height receive full upright credit.
- A second score uses shoulder/hip vertical separation.
- Final score is the mean of upright and torso scores.

### 6.4 Plank

- Both elbow angles target `90°`.
- Alignment penalty uses shoulder-to-hip and hip-to-ankle vertical differences:

```text
alignment =
  max(0, 100 - (abs(shoulderY - hipY) + abs(hipY - ankleY)) × 200)
```

- Final score is the mean of left elbow, right elbow, and alignment.

## 7. Movement start and completion

Live analysis calculates every configured pose score and chooses the highest:

```text
bestPose  = pose with maximum comparePose score
recognized = bestScore >= 50
partial    = 35 <= bestScore < 50
```

`partial` is calculated but is not currently used for counting or feedback.

For push-ups, squats, and sit-ups:

```text
startPose = configured poses[0]
endPose   = configured poses[1]
```

State transitions:

1. A recognized `startPose` sets `isInStartPosition = true` and records the
   start pose.
2. A recognized `endPose` is accepted only after the start pose was recorded.
3. A repetition completes only when a recognized `startPose` follows the
   recorded end pose.
4. The state resets to the start pose for the next cycle.

Exercise cycles:

- Push-up: `pushup-up → pushup-down → pushup-up`
- Squat: `squat-up-side → squat-down-side → squat-up-side`
- Sit-up: `situp-down → situp-up → situp-down`

There is no minimum pose-hold duration in the current rep state machine.
Recognition is sampled once per second, so each transition must be visible on
an analysis tick.

The target is complete when counted reps reach the user-selected target. The
app computes angle averages, announces completion, waits two seconds, and opens
the analysis screen.

### Plank limitation

Plank is excluded from the repetition state machine. Although the UI labels
its target as seconds, no interval currently increments `repsCompleted` for
plank and no plank-specific completion path exists. A plank session therefore
does not automatically finish in the current implementation.

## 8. Good movement versus bad movement

Three related systems are used:

### 8.1 Recognizable pose

A pose is recognizable when its best target-pose score is at least `50`.
Recognition controls rep-state transitions and is required for a good-form
analysis sample.

### 8.2 Form issue rules

At each one-second analysis tick, exercise-specific issues are evaluated.

**Squat**

- Analysis activates when minimum knee angle is below `140°`.
- `kneeAngleTooDeep`: knee angle `> 135°`.
- `kneeAngleTooShallow`: knee angle `< 90°`.
- `kneesOverToes`: left knee x is more than `0.05` beyond left ankle x.
- `trunkLeanExcessive`: vertical angle `> 45°`.
- `trunkLeanInsufficient`: vertical angle `< 30°` while knee angle `< 110°`.

Note: the issue names/comments around squat depth are semantically inconsistent
with conventional angle naming, but the values above are the implemented rules.

**Push-up**

- When average elbow angle is below `120°`, it must be in `80–100°`.
- Shoulder/hip/ankle alignment must be in `170–190°`.
- Hips are classified as sagging or raised when hip-center y differs from
  shoulder-center y by more than `0.1`.
- Either elbow is too wide when its shoulder-relative x distance exceeds
  `0.75 × shoulderWidth`.

**Plank**

- Alignment below `170°` is hips sagging.
- Alignment above `190°` is hips raised.
- Feet wider than `1.5 × hipWidth` is excessive abduction.

**Sit-up**

- Average shoulder/hip/knee angle must be `70–90°`.
- In the up position, torso vertical angle below `30°` is insufficient lumbar
  flexion and above `45°` is excessive flexion.

**All exercises**

- Shoulder y difference over `0.05` marks shoulders as not level.

### 8.3 Overall form score

Each analysis sample is binary:

```text
sample = 100 when:
  best pose score >= 50
  AND no form issue is true
  AND camera distance is optimal

sample = 0 otherwise
```

The displayed score is the rounded running mean:

```text
newAverage =
  round((oldAverage × (sampleCount - 1) + sample) / sampleCount)
```

The initial score is `100`, but after the first analyzed sample the formula
reduces to that sample's value. The result is the percentage of analyzed
seconds classified as fully good form.

## 9. Audio feedback

The app uses `window.speechSynthesis`.

### 9.1 Queue behavior

- If speech is active, a new unique message is appended to an in-memory queue.
- Duplicate queued text is ignored.
- The next message starts `500 ms` after the previous message ends.
- Speech rate is `0.9`, pitch is `1`, and volume is `1`.

### 9.2 Calibration audio

Audio fires when:

- distance state changes;
- distance calibration completes;
- body calibration starts;
- a new calibration movement starts; or
- a calibration position locks.

Calibration speech cancels existing speech before speaking the newest message.

### 9.3 Distance warnings

A non-optimal distance increments `distanceWarningCount` once per analysis
second. At three consecutive samples, the app speaks a move-closer or
step-back message, displays it for three seconds, and resets the count.

### 9.4 Standard form corrections

The app first computes:

```text
hasIncorrectJoint = any issue is true

shouldCorrect =
  (hasIncorrectJoint AND bestPoseScore < 45)
  OR hasSevereSafetyIssue
```

The standard deviation counter increments only when:

- `shouldCorrect` is true;
- the pose is still recognizable (`best score >= 50`); and
- completed reps are below 70% of the exercise config's built-in target.

Otherwise it resets to zero. After three consecutive increments, a specific
exercise correction is spoken, shown for three seconds, and the counter resets.
Standard form corrections run only while camera distance is optimal.

Because the non-severe branch requires both `best score < 45` and recognizable
pose `>= 50`, non-severe low-score issues cannot currently satisfy both
conditions. In practice, the three-sample correction path is primarily reached
through severe issues.

### 9.5 Immediate safety corrections

These issues bypass the three-second wait:

- squat too deep flag;
- squat knees over toes;
- push-up elbow angle outside the accepted range;
- excessive sit-up lumbar flexion;
- excessive squat trunk lean.

Immediate feedback requires a recognizable pose, fewer than 70% of configured
target reps, a mapped message, and no currently displayed feedback.

### 9.6 Encouragement

Good-form intervals increment when:

- the pose is recognizable;
- no severe safety issue exists;
- distance is optimal; and
- the movement has entered its start position.

Five consecutive good intervals can trigger a random encouragement, provided
at least ten seconds have passed since the prior encouragement.

On rep completion, `goodFormCount >= 3` schedules additional encouragement
`1.5 s` after the rep announcement.

### 9.7 Rep and completion announcements

- Every completed repetition speaks `Rep N complete`.
- Reaching the target speaks `Exercise complete! Great work!`.

## 10. Session metrics and results

Every one-second sample records:

- total analysis count;
- issue occurrence counts;
- distance issue count;
- exercise-specific angle history; and
- the running overall form score.

At completion, each angle average is:

```text
round(sum(history) / history.length)
```

Results classify issue frequency as:

- over 30% of samples: error;
- over 10% through 30%: warning;
- 10% or less: omitted from the issue summary.

Distance receives a warning when it is non-optimal in more than 20% of
analysis samples.

Distance consistency is:

```text
round((1 - distanceIssueCount / totalAnalysisCount) × 100)
```

Overall result labels:

- `>= 85`: Excellent
- `>= 70`: Good
- `< 70`: Needs Practice

## 11. Important implementation caveats

- Thresholds are heuristics and have not been clinically validated.
- Analysis is based on 2D normalized image coordinates plus relative depth;
  camera angle and landmark occlusion affect results.
- The current implementation does not use MediaPipe landmark visibility or
  presence values per joint.
- The partial-pose threshold and several rep-debug state variables are defined
  but do not affect counting.
- The live target pose index is initialized to the first pose and is not
  advanced, so its direct `matchScore` is not the same as the separately
  calculated best-pose score.
- The correction cutoff uses each exercise config's built-in target rather
  than the user-selected target.
- Plank timing and completion are not implemented.
