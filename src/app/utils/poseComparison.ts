import type { PoseLandmarks } from '../hooks/useMediaPipePose';

// Calculate angle between three points
function calculateAngle(
  point1: { x: number; y: number },
  point2: { x: number; y: number },
  point3: { x: number; y: number }
): number {
  const radians =
    Math.atan2(point3.y - point2.y, point3.x - point2.x) -
    Math.atan2(point1.y - point2.y, point1.x - point2.x);
  
  let angle = Math.abs((radians * 180.0) / Math.PI);
  
  if (angle > 180.0) {
    angle = 360.0 - angle;
  }
  
  return angle;
}

// Calculate distance between two points (normalized 0-1)
function calculateDistance(
  point1: { x: number; y: number },
  point2: { x: number; y: number }
): number {
  return Math.sqrt(
    Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2)
  );
}

// Check if user is in T-pose
function checkTPose(landmarks: PoseLandmarks): number {
  // Arms should be horizontal (shoulders-elbows-wrists alignment)
  const leftArmAngle = calculateAngle(
    landmarks.leftShoulder,
    landmarks.leftElbow,
    landmarks.leftWrist
  );
  const rightArmAngle = calculateAngle(
    landmarks.rightShoulder,
    landmarks.rightElbow,
    landmarks.rightWrist
  );
  
  // Both arms should be nearly straight (close to 180 degrees)
  const leftArmScore = Math.max(0, 100 - Math.abs(180 - leftArmAngle) * 2);
  const rightArmScore = Math.max(0, 100 - Math.abs(180 - rightArmAngle) * 2);
  
  // Check if arms are horizontal
  const leftArmHorizontal = Math.abs(landmarks.leftWrist.y - landmarks.leftShoulder.y) < 0.1;
  const rightArmHorizontal = Math.abs(landmarks.rightWrist.y - landmarks.rightShoulder.y) < 0.1;
  
  const horizontalScore = (leftArmHorizontal ? 50 : 0) + (rightArmHorizontal ? 50 : 0);
  
  return (leftArmScore + rightArmScore + horizontalScore) / 3;
}

// Check if user is standing
function checkStanding(landmarks: PoseLandmarks): number {
  // Arms should be by the sides
  const leftArmByide = landmarks.leftWrist.y > landmarks.leftHip.y && 
                        Math.abs(landmarks.leftWrist.x - landmarks.leftHip.x) < 0.15;
  const rightArmBySide = landmarks.rightWrist.y > landmarks.rightHip.y && 
                         Math.abs(landmarks.rightWrist.x - landmarks.rightHip.x) < 0.15;
  
  // Legs should be straight
  const leftLegAngle = calculateAngle(
    landmarks.leftHip,
    landmarks.leftKnee,
    landmarks.leftAnkle
  );
  const rightLegAngle = calculateAngle(
    landmarks.rightHip,
    landmarks.rightKnee,
    landmarks.rightAnkle
  );
  
  const leftLegScore = Math.max(0, 100 - Math.abs(180 - leftLegAngle) * 2);
  const rightLegScore = Math.max(0, 100 - Math.abs(180 - rightLegAngle) * 2);
  
  const armScore = (leftArmByide ? 50 : 0) + (rightArmBySide ? 50 : 0);
  
  return (armScore + leftLegScore + rightLegScore) / 3;
}

// Check if left leg is raised
function checkLeftLegRaise(landmarks: PoseLandmarks): number {
  // Left knee should be bent and raised
  const leftKneeAngle = calculateAngle(
    landmarks.leftHip,
    landmarks.leftKnee,
    landmarks.leftAnkle
  );
  
  // Left knee should be higher than hip
  const leftKneeRaised = landmarks.leftKnee.y < landmarks.leftHip.y;
  
  // Right leg should be straight
  const rightLegAngle = calculateAngle(
    landmarks.rightHip,
    landmarks.rightKnee,
    landmarks.rightAnkle
  );
  const rightLegScore = Math.max(0, 100 - Math.abs(180 - rightLegAngle) * 2);
  
  // Left knee should be bent (around 90 degrees)
  const leftKneeScore = Math.max(0, 100 - Math.abs(90 - leftKneeAngle) * 2);
  
  const raiseScore = leftKneeRaised ? 100 : 0;
  
  return (leftKneeScore + rightLegScore + raiseScore) / 3;
}

// Check if right leg is raised
function checkRightLegRaise(landmarks: PoseLandmarks): number {
  // Right knee should be bent and raised
  const rightKneeAngle = calculateAngle(
    landmarks.rightHip,
    landmarks.rightKnee,
    landmarks.rightAnkle
  );
  
  // Right knee should be higher than hip
  const rightKneeRaised = landmarks.rightKnee.y < landmarks.rightHip.y;
  
  // Left leg should be straight
  const leftLegAngle = calculateAngle(
    landmarks.leftHip,
    landmarks.leftKnee,
    landmarks.leftAnkle
  );
  const leftLegScore = Math.max(0, 100 - Math.abs(180 - leftLegAngle) * 2);
  
  // Right knee should be bent (around 90 degrees)
  const rightKneeScore = Math.max(0, 100 - Math.abs(90 - rightKneeAngle) * 2);
  
  const raiseScore = rightKneeRaised ? 100 : 0;
  
  return (rightKneeScore + leftLegScore + raiseScore) / 3;
}

// Check squat-up pose (arms extended)
function checkSquatUp(landmarks: PoseLandmarks): number {
  // Arms should be extended forward
  const leftArmExtended = landmarks.leftWrist.x < landmarks.leftShoulder.x - 0.1;
  const rightArmExtended = landmarks.rightWrist.x > landmarks.rightShoulder.x + 0.1;
  
  // Arms should be at shoulder height or slightly below
  const leftArmHeight = Math.abs(landmarks.leftWrist.y - landmarks.leftShoulder.y) < 0.2;
  const rightArmHeight = Math.abs(landmarks.rightWrist.y - landmarks.rightShoulder.y) < 0.2;
  
  const extendScore = (leftArmExtended ? 50 : 0) + (rightArmExtended ? 50 : 0);
  const heightScore = (leftArmHeight ? 50 : 0) + (rightArmHeight ? 50 : 0);
  
  return (extendScore + heightScore) / 2;
}

// Check push-up up position
function checkPushUpUp(landmarks: PoseLandmarks): number {
  // Arms should be straight
  const leftArmAngle = calculateAngle(
    landmarks.leftShoulder,
    landmarks.leftElbow,
    landmarks.leftWrist
  );
  const rightArmAngle = calculateAngle(
    landmarks.rightShoulder,
    landmarks.rightElbow,
    landmarks.rightWrist
  );
  
  const leftArmScore = Math.max(0, 100 - Math.abs(180 - leftArmAngle) * 2);
  const rightArmScore = Math.max(0, 100 - Math.abs(180 - rightArmAngle) * 2);
  
  // Body should be in plank position (shoulders, hips, ankles aligned)
  const shoulderY = (landmarks.leftShoulder.y + landmarks.rightShoulder.y) / 2;
  const hipY = (landmarks.leftHip.y + landmarks.rightHip.y) / 2;
  const alignmentScore = Math.max(0, 100 - Math.abs(shoulderY - hipY) * 300);
  
  return (leftArmScore + rightArmScore + alignmentScore) / 3;
}

// Check push-up down position
function checkPushUpDown(landmarks: PoseLandmarks): number {
  // Elbows should be bent (around 90 degrees)
  const leftArmAngle = calculateAngle(
    landmarks.leftShoulder,
    landmarks.leftElbow,
    landmarks.leftWrist
  );
  const rightArmAngle = calculateAngle(
    landmarks.rightShoulder,
    landmarks.rightElbow,
    landmarks.rightWrist
  );
  
  const leftArmScore = Math.max(0, 100 - Math.abs(90 - leftArmAngle) * 2);
  const rightArmScore = Math.max(0, 100 - Math.abs(90 - rightArmAngle) * 2);
  
  // Body should still be aligned
  const shoulderY = (landmarks.leftShoulder.y + landmarks.rightShoulder.y) / 2;
  const hipY = (landmarks.leftHip.y + landmarks.rightHip.y) / 2;
  const alignmentScore = Math.max(0, 100 - Math.abs(shoulderY - hipY) * 300);
  
  return (leftArmScore + rightArmScore + alignmentScore) / 3;
}

// Check plank position
function checkPlank(landmarks: PoseLandmarks): number {
  // Elbows should be bent at roughly 90 degrees (forearm plank)
  const leftArmAngle = calculateAngle(
    landmarks.leftShoulder,
    landmarks.leftElbow,
    landmarks.leftWrist
  );
  const rightArmAngle = calculateAngle(
    landmarks.rightShoulder,
    landmarks.rightElbow,
    landmarks.rightWrist
  );
  
  const leftArmScore = Math.max(0, 100 - Math.abs(90 - leftArmAngle) * 2);
  const rightArmScore = Math.max(0, 100 - Math.abs(90 - rightArmAngle) * 2);
  
  // Body alignment (shoulders, hips, ankles should form straight line)
  const shoulderY = (landmarks.leftShoulder.y + landmarks.rightShoulder.y) / 2;
  const hipY = (landmarks.leftHip.y + landmarks.rightHip.y) / 2;
  const ankleY = (landmarks.leftAnkle.y + landmarks.rightAnkle.y) / 2;
  
  const hipAlignment = Math.abs(shoulderY - hipY);
  const ankleAlignment = Math.abs(hipY - ankleY);
  const alignmentScore = Math.max(0, 100 - (hipAlignment + ankleAlignment) * 200);
  
  return (leftArmScore + rightArmScore + alignmentScore) / 3;
}

// Check squat down position (side view)
function checkSquatDown(landmarks: PoseLandmarks): number {
  // Knees should be bent (around 90 degrees or less)
  const leftKneeAngle = calculateAngle(
    landmarks.leftHip,
    landmarks.leftKnee,
    landmarks.leftAnkle
  );
  const rightKneeAngle = calculateAngle(
    landmarks.rightHip,
    landmarks.rightKnee,
    landmarks.rightAnkle
  );
  
  // For squat, we want angles between 70-110 degrees
  const leftKneeScore = leftKneeAngle >= 70 && leftKneeAngle <= 110 ? 100 : Math.max(0, 100 - Math.abs(90 - leftKneeAngle) * 2);
  const rightKneeScore = rightKneeAngle >= 70 && rightKneeAngle <= 110 ? 100 : Math.max(0, 100 - Math.abs(90 - rightKneeAngle) * 2);
  
  // Hips should be lowered (hip y should be closer to knee y)
  const hipY = (landmarks.leftHip.y + landmarks.rightHip.y) / 2;
  const kneeY = (landmarks.leftKnee.y + landmarks.rightKnee.y) / 2;
  const depthScore = Math.max(0, Math.min(100, (hipY - kneeY) * 500));
  
  return (leftKneeScore + rightKneeScore + depthScore) / 3;
}

// Check squat up position (side view) - alias for standing
function checkSquatUpSide(landmarks: PoseLandmarks): number {
  // SIDE VIEW: Only check LEFT side (visible to camera)
  // Right side is hidden behind left side
  const leftKneeAngle = calculateAngle(
    landmarks.leftHip,
    landmarks.leftKnee,
    landmarks.leftAnkle
  );
  
  // Legs should be relatively straight (160-180 degrees)
  const leftLegScore = Math.max(0, 100 - Math.abs(170 - leftKneeAngle) * 2);
  
  // Body should be upright (shoulder above hip)
  const shoulderY = landmarks.leftShoulder.y;
  const hipY = landmarks.leftHip.y;
  const uprightScore = Math.max(0, 100 - Math.abs(shoulderY - hipY + 0.15) * 200);
  
  // In side view, only use left side data
  return (leftLegScore + uprightScore) / 2;
}

// Check squat down position (side view) - more lenient
function checkSquatDownSide(landmarks: PoseLandmarks): number {
  // SIDE VIEW: Only check LEFT side (visible to camera)
  // Knees should be bent (around 90 degrees)
  const leftKneeAngle = calculateAngle(
    landmarks.leftHip,
    landmarks.leftKnee,
    landmarks.leftAnkle
  );
  
  // For squat, we want angles between 70-110 degrees
  const leftKneeScore = leftKneeAngle >= 70 && leftKneeAngle <= 110 
    ? 100 
    : Math.max(0, 100 - Math.abs(90 - leftKneeAngle) * 2);
  
  // Hips should be lowered (hip y should be closer to knee y)
  const hipY = landmarks.leftHip.y;
  const kneeY = landmarks.leftKnee.y;
  const depthScore = Math.max(0, Math.min(100, (hipY - kneeY) * 500));
  
  // Only use left side data for side view
  return (leftKneeScore + depthScore) / 2;
}

// Check sit-up up position
function checkSitUpUp(landmarks: PoseLandmarks): number {
  // Upper body should be upright
  const shoulderY = (landmarks.leftShoulder.y + landmarks.rightShoulder.y) / 2;
  const hipY = (landmarks.leftHip.y + landmarks.rightHip.y) / 2;
  
  // Shoulders should be above or at hip level
  const uprightScore = shoulderY <= hipY ? 100 : Math.max(0, 100 - (shoulderY - hipY) * 300);
  
  // Torso angle (should be closer to vertical)
  const torsoAngle = Math.abs(shoulderY - hipY);
  const angleScore = Math.max(0, 100 - torsoAngle * 200);
  
  return (uprightScore + angleScore) / 2;
}

// Check sit-up down position
function checkSitUpDown(landmarks: PoseLandmarks): number {
  // Upper body should be on the ground
  const shoulderY = (landmarks.leftShoulder.y + landmarks.rightShoulder.y) / 2;
  const hipY = (landmarks.leftHip.y + landmarks.rightHip.y) / 2;
  
  // Shoulders should be at roughly same level as hips (lying down)
  const flatScore = Math.max(0, 100 - Math.abs(shoulderY - hipY) * 300);
  
  return flatScore;
}

// Check torso bend (forward bend to roughly 90 degrees)
function checkTorsoBend(landmarks: PoseLandmarks): number {
  // Calculate torso angle from vertical
  const shoulderCenter = {
    x: (landmarks.leftShoulder.x + landmarks.rightShoulder.x) / 2,
    y: (landmarks.leftShoulder.y + landmarks.rightShoulder.y) / 2
  };
  const hipCenter = {
    x: (landmarks.leftHip.x + landmarks.rightHip.x) / 2,
    y: (landmarks.leftHip.y + landmarks.rightHip.y) / 2
  };
  
  // Calculate angle from vertical (should be around 90 degrees for forward bend)
  const torsoAngle = calculateVerticalAngle(shoulderCenter, hipCenter);
  
  // Accept a wide range: 60-110 degrees (more forgiving than strict 90)
  // Score based on how close to the ideal 70-100 degree range
  let angleScore;
  if (torsoAngle >= 70 && torsoAngle <= 100) {
    angleScore = 100; // Perfect range
  } else if (torsoAngle >= 60 && torsoAngle <= 110) {
    angleScore = 80; // Good range
  } else {
    // Gradually decrease score outside the range
    angleScore = Math.max(0, 100 - Math.abs(85 - torsoAngle) * 2);
  }
  
  // Also check that legs are relatively straight
  const leftLegAngle = calculateAngle(
    landmarks.leftHip,
    landmarks.leftKnee,
    landmarks.leftAnkle
  );
  const rightLegAngle = calculateAngle(
    landmarks.rightHip,
    landmarks.rightKnee,
    landmarks.rightAnkle
  );
  
  const leftLegScore = Math.max(0, 100 - Math.abs(180 - leftLegAngle) * 1.5);
  const rightLegScore = Math.max(0, 100 - Math.abs(180 - rightLegAngle) * 1.5);
  
  // Weight the angle more heavily (70%) and leg straightness less (30%)
  return angleScore * 0.7 + (leftLegScore + rightLegScore) / 2 * 0.3;
}

// Check head pivot left
function checkHeadPivotLeft(landmarks: PoseLandmarks): number {
  // Check if head is turned left by comparing nose position to ear positions
  const nose = landmarks.nose;
  const leftEar = landmarks.leftEar;
  const rightEar = landmarks.rightEar;
  
  // When head pivots left, left ear becomes more visible (closer to camera/larger x)
  // and right ear becomes less visible (further from camera/smaller x)
  const earDistance = Math.abs(leftEar.x - rightEar.x);
  
  // Also check nose position relative to shoulder center
  const shoulderCenterX = (landmarks.leftShoulder.x + landmarks.rightShoulder.x) / 2;
  const noseOffsetFromCenter = nose.x - shoulderCenterX;
  
  // For left pivot: nose should be left of center (negative offset for front camera)
  // Ear distance should be reasonable (head turned but not too extreme)
  let pivotScore = 0;
  
  // Check if nose is displaced from center (indicates rotation) - MUCH MORE LENIENT
  const noseDisplacement = Math.abs(noseOffsetFromCenter);
  if (noseDisplacement > 0.01) { // Reduced from 0.02 to 0.01 (more sensitive)
    pivotScore += 60; // Increased from 50 to 60
  }
  
  // Check ear visibility (when pivoting, one ear becomes less visible)
  // Z-depth check: if ears have different z values, head is rotated - MUCH MORE LENIENT
  const earDepthDiff = Math.abs(leftEar.z - rightEar.z);
  if (earDepthDiff > 0.03) { // Reduced from 0.05 to 0.03 (more sensitive)
    pivotScore += 60; // Increased from 50 to 60
  }
  
  return pivotScore;
}

// Check head pivot right
function checkHeadPivotRight(landmarks: PoseLandmarks): number {
  // Similar to left pivot but checking for right rotation
  const nose = landmarks.nose;
  const leftEar = landmarks.leftEar;
  const rightEar = landmarks.rightEar;
  
  const shoulderCenterX = (landmarks.leftShoulder.x + landmarks.rightShoulder.x) / 2;
  const noseOffsetFromCenter = nose.x - shoulderCenterX;
  
  let pivotScore = 0;
  
  // Check if nose is displaced from center - MUCH MORE LENIENT
  const noseDisplacement = Math.abs(noseOffsetFromCenter);
  if (noseDisplacement > 0.01) { // Reduced from 0.02 to 0.01 (more sensitive)
    pivotScore += 60; // Increased from 50 to 60
  }
  
  // Check ear depth difference - MUCH MORE LENIENT
  const earDepthDiff = Math.abs(leftEar.z - rightEar.z);
  if (earDepthDiff > 0.03) { // Reduced from 0.05 to 0.03 (more sensitive)
    pivotScore += 60; // Increased from 50 to 60
  }
  
  return Math.min(100, pivotScore);
}

// Check torso pivot left
function checkTorsoPivotLeft(landmarks: PoseLandmarks): number {
  // Check if torso is rotated left by comparing shoulder and hip positions
  const leftShoulder = landmarks.leftShoulder;
  const rightShoulder = landmarks.rightShoulder;
  const leftHip = landmarks.leftHip;
  const rightHip = landmarks.rightHip;
  
  // Calculate shoulder width and hip width
  const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);
  const hipWidth = Math.abs(leftHip.x - rightHip.x);
  
  // When torso pivots, shoulder width appears different from hip width
  const widthRatio = shoulderWidth / hipWidth;
  
  // Also check z-depth differences (rotation creates depth difference)
  const shoulderDepthDiff = Math.abs(leftShoulder.z - rightShoulder.z);
  const hipDepthDiff = Math.abs(leftHip.z - rightHip.z);
  
  let pivotScore = 0;
  
  // Check if there's shoulder rotation (depth difference)
  if (shoulderDepthDiff > 0.08) {
    pivotScore += 50;
  }
  
  // Check if shoulder/hip width ratio indicates rotation
  if (widthRatio < 0.85 || widthRatio > 1.15) {
    pivotScore += 50;
  }
  
  return Math.min(100, pivotScore);
}

// Check torso pivot right
function checkTorsoPivotRight(landmarks: PoseLandmarks): number {
  // Similar to left torso pivot
  const leftShoulder = landmarks.leftShoulder;
  const rightShoulder = landmarks.rightShoulder;
  const leftHip = landmarks.leftHip;
  const rightHip = landmarks.rightHip;
  
  const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);
  const hipWidth = Math.abs(leftHip.x - rightHip.x);
  const widthRatio = shoulderWidth / hipWidth;
  
  const shoulderDepthDiff = Math.abs(leftShoulder.z - rightShoulder.z);
  
  let pivotScore = 0;
  
  // Check shoulder rotation via depth
  if (shoulderDepthDiff > 0.08) {
    pivotScore += 50;
  }
  
  // Check width ratio
  if (widthRatio < 0.85 || widthRatio > 1.15) {
    pivotScore += 50;
  }
  
  return Math.min(100, pivotScore);
}

// Check for form issues in exercises
export interface FormIssues {
  // Squat issues
  kneeAngleTooShallow?: boolean;   // Knee flexion < 90°
  kneeAngleTooDeep?: boolean;      // Knee flexion > 135° (risk)
  kneesOverToes?: boolean;         // Knees past toes
  trunkLeanExcessive?: boolean;    // Trunk lean > 45°
  trunkLeanInsufficient?: boolean; // Trunk lean < 30°
  
  // Push-up issues
  elbowAngleIncorrect?: boolean;   // Elbow not in 80-100° range
  bodyNotStraight?: boolean;       // Body alignment not 170-180°
  elbowsTooWide?: boolean;         // Elbows flared out
  
  // Plank issues
  hipsSagging?: boolean;           // Body angle < 170°
  hipsRaised?: boolean;            // Body angle > 190°
  hipAbductionTooWide?: boolean;   // Hip width > 30°
  
  // Sit-up issues
  lumbarFlexionInsufficient?: boolean; // Lumbar flexion < 30°
  lumbarFlexionExcessive?: boolean;    // Lumbar flexion > 45°
  hipFlexionIncorrect?: boolean;       // Hip flexion not in 70-90°
  
  // General issues
  shouldersNotLevel?: boolean;
  backNotStraight?: boolean;
}

// Helper: Calculate angle from vertical (for trunk lean)
function calculateVerticalAngle(
  topPoint: { x: number; y: number },
  bottomPoint: { x: number; y: number }
): number {
  // Calculate angle from vertical (0° = straight up)
  const dx = topPoint.x - bottomPoint.x;
  const dy = topPoint.y - bottomPoint.y;
  const angleFromHorizontal = Math.atan2(dy, dx) * (180 / Math.PI);
  // Convert to angle from vertical
  return Math.abs(90 - Math.abs(angleFromHorizontal));
}

// Helper: Calculate body alignment angle (shoulder-hip-ankle line)
function calculateBodyAlignment(
  shoulder: { x: number; y: number },
  hip: { x: number; y: number },
  ankle: { x: number; y: number }
): number {
  // Returns the angle formed by shoulder-hip-ankle
  // 180° = perfectly straight
  return calculateAngle(shoulder, hip, ankle);
}

export function detectFormIssues(
  landmarks: PoseLandmarks,
  exerciseType: 'pushup' | 'plank' | 'squat' | 'situp'
): FormIssues {
  const issues: FormIssues = {};
  
  // Common landmarks
  const leftShoulder = landmarks.leftShoulder;
  const rightShoulder = landmarks.rightShoulder;
  const leftHip = landmarks.leftHip;
  const rightHip = landmarks.rightHip;
  const leftKnee = landmarks.leftKnee;
  const rightKnee = landmarks.rightKnee;
  const leftAnkle = landmarks.leftAnkle;
  const rightAnkle = landmarks.rightAnkle;
  const leftElbow = landmarks.leftElbow;
  const rightElbow = landmarks.rightElbow;
  const leftWrist = landmarks.leftWrist;
  const rightWrist = landmarks.rightWrist;
  
  switch (exerciseType) {
    case 'squat': {
      // Squat Form Analysis (Side View Optimal)
      
      // 1. Knee Flexion Angle (90°-110° medium, up to 135° deep)
      const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
      const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
      const kneeAngle = Math.min(leftKneeAngle, rightKneeAngle); // Use lower angle (deeper squat)
      
      console.log('Squat Knee Angle:', kneeAngle);
      
      // ONLY CHECK FORM ISSUES WHEN ACTUALLY SQUATTING (knee bent < 140°)
      // Don't flag issues when user is just standing idle
      const isActuallySquatting = kneeAngle < 140;
      
      if (isActuallySquatting) {
        if (kneeAngle > 135) {
          issues.kneeAngleTooDeep = true; // Risk of injury
        } else if (kneeAngle < 90) {
          issues.kneeAngleTooShallow = true; // Not deep enough
        }
        
        // 2. Knees Over Toes Check (ONLY for left side in side view)
        // In side view: knee x should not exceed ankle x significantly
        const leftKneeOverToes = leftKnee.x > leftAnkle.x + 0.05; // 5% tolerance
        
        if (leftKneeOverToes) {
          issues.kneesOverToes = true;
        }
        
        // 3. Trunk Forward Lean (30°-45° from vertical)
        // ONLY check when in squat position
        const shoulderCenter = {
          x: (leftShoulder.x + rightShoulder.x) / 2,
          y: (leftShoulder.y + rightShoulder.y) / 2
        };
        const hipCenter = {
          x: (leftHip.x + rightHip.x) / 2,
          y: (leftHip.y + rightHip.y) / 2
        };
        
        const trunkLean = calculateVerticalAngle(shoulderCenter, hipCenter);
        console.log('Squat Trunk Lean:', trunkLean);
        
        if (trunkLean > 45) {
          issues.trunkLeanExcessive = true;
        } else if (trunkLean < 30 && kneeAngle < 110) {
          // Only flag if actually squatting deeply
          issues.trunkLeanInsufficient = true;
        }
      }
      
      break;
    }
    
    case 'pushup': {
      // Push-up Form Analysis
      
      // 1. Elbow Flexion Angle (80°-100° at bottom)
      const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
      const rightElbowAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
      const avgElbowAngle = (leftElbowAngle + rightElbowAngle) / 2;
      
      console.log('Push-up Elbow Angle:', avgElbowAngle);
      
      // Check if in down position (elbows bent)
      if (avgElbowAngle < 120) {
        // In down position, check range
        if (avgElbowAngle < 80 || avgElbowAngle > 100) {
          issues.elbowAngleIncorrect = true;
        }
      }
      
      // 2. Body Alignment (170°-180° straight line)
      const shoulderCenter = {
        x: (leftShoulder.x + rightShoulder.x) / 2,
        y: (leftShoulder.y + rightShoulder.y) / 2
      };
      const hipCenter = {
        x: (leftHip.x + rightHip.x) / 2,
        y: (leftHip.y + rightHip.y) / 2
      };
      const ankleCenter = {
        x: (leftAnkle.x + rightAnkle.x) / 2,
        y: (leftAnkle.y + rightAnkle.y) / 2
      };
      
      const bodyAlignment = calculateBodyAlignment(shoulderCenter, hipCenter, ankleCenter);
      console.log('Push-up Body Alignment:', bodyAlignment);
      
      if (bodyAlignment < 170 || bodyAlignment > 190) {
        issues.bodyNotStraight = true;
        
        // Determine if hips are sagging or raised
        if (hipCenter.y > shoulderCenter.y + 0.1) {
          issues.hipsSagging = true;
        } else if (hipCenter.y < shoulderCenter.y - 0.1) {
          issues.hipsRaised = true;
        }
      }
      
      // 3. Elbow Position (not too wide)
      const leftElbowDistance = Math.abs(leftElbow.x - leftShoulder.x);
      const rightElbowDistance = Math.abs(rightElbow.x - rightShoulder.x);
      const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);
      
      // Elbows should be within ~1.5x shoulder width
      if (leftElbowDistance > shoulderWidth * 0.75 || rightElbowDistance > shoulderWidth * 0.75) {
        issues.elbowsTooWide = true;
      }
      
      break;
    }
    
    case 'plank': {
      // Plank Form Analysis
      
      // 1. Body Alignment (170°-190°, ideal 180°)
      const shoulderCenter = {
        x: (leftShoulder.x + rightShoulder.x) / 2,
        y: (leftShoulder.y + rightShoulder.y) / 2
      };
      const hipCenter = {
        x: (leftHip.x + rightHip.x) / 2,
        y: (leftHip.y + rightHip.y) / 2
      };
      const ankleCenter = {
        x: (leftAnkle.x + rightAnkle.x) / 2,
        y: (leftAnkle.y + rightAnkle.y) / 2
      };
      
      const bodyAlignment = calculateBodyAlignment(shoulderCenter, hipCenter, ankleCenter);
      console.log('Plank Body Alignment:', bodyAlignment);
      
      if (bodyAlignment < 170) {
        issues.hipsSagging = true;
      } else if (bodyAlignment > 190) {
        issues.hipsRaised = true;
      }
      
      // 2. Hip Abduction (feet width) - Should be ≤15° ideal, >30° problematic
      const footDistance = Math.abs(leftAnkle.x - rightAnkle.x);
      const hipDistance = Math.abs(leftHip.x - rightHip.x);
      
      // Calculate approximate abduction angle
      // If feet are much wider than hips, flag it
      if (footDistance > hipDistance * 1.5) {
        issues.hipAbductionTooWide = true;
      }
      
      break;
    }
    
    case 'situp': {
      // Sit-up Form Analysis
      
      // 1. Hip Flexion (70°-90° thigh to torso)
      const leftHipAngle = calculateAngle(leftShoulder, leftHip, leftKnee);
      const rightHipAngle = calculateAngle(rightShoulder, rightHip, rightKnee);
      const avgHipAngle = (leftHipAngle + rightHipAngle) / 2;
      
      console.log('Sit-up Hip Angle:', avgHipAngle);
      
      if (avgHipAngle < 70 || avgHipAngle > 90) {
        issues.hipFlexionIncorrect = true;
      }
      
      // 2. Lumbar Flexion (30°-45° spine flexion)
      // Approximate using shoulder-hip angle
      const shoulderCenter = {
        x: (leftShoulder.x + rightShoulder.x) / 2,
        y: (leftShoulder.y + rightShoulder.y) / 2
      };
      const hipCenter = {
        x: (leftHip.x + rightHip.x) / 2,
        y: (leftHip.y + rightHip.y) / 2
      };
      
      const torsoVerticalAngle = calculateVerticalAngle(shoulderCenter, hipCenter);
      console.log('Sit-up Torso Angle:', torsoVerticalAngle);
      
      // In up position (shoulders above hips)
      if (shoulderCenter.y < hipCenter.y) {
        if (torsoVerticalAngle < 30) {
          issues.lumbarFlexionInsufficient = true;
        } else if (torsoVerticalAngle > 45) {
          issues.lumbarFlexionExcessive = true;
        }
      }
      
      break;
    }
  }
  
  // General checks for all exercises
  
  // Shoulders Level Check
  const shoulderHeightDiff = Math.abs(leftShoulder.y - rightShoulder.y);
  if (shoulderHeightDiff > 0.05) {
    issues.shouldersNotLevel = true;
  }
  
  return issues;
}

// Extract current angles from landmarks for tracking
export function extractAngles(
  landmarks: PoseLandmarks,
  exerciseType: 'pushup' | 'plank' | 'squat' | 'situp'
): {
  kneeAngle?: number;
  elbowAngle?: number;
  bodyAlignment?: number;
  trunkLean?: number;
  hipAngle?: number;
} {
  const angles: {
    kneeAngle?: number;
    elbowAngle?: number;
    bodyAlignment?: number;
    trunkLean?: number;
    hipAngle?: number;
  } = {};

  const leftShoulder = landmarks.leftShoulder;
  const rightShoulder = landmarks.rightShoulder;
  const leftHip = landmarks.leftHip;
  const rightHip = landmarks.rightHip;
  const leftKnee = landmarks.leftKnee;
  const rightKnee = landmarks.rightKnee;
  const leftAnkle = landmarks.leftAnkle;
  const rightAnkle = landmarks.rightAnkle;
  const leftElbow = landmarks.leftElbow;
  const rightElbow = landmarks.rightElbow;
  const leftWrist = landmarks.leftWrist;
  const rightWrist = landmarks.rightWrist;

  switch (exerciseType) {
    case 'squat': {
      // Knee flexion angle
      const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
      const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
      angles.kneeAngle = Math.min(leftKneeAngle, rightKneeAngle);

      // Trunk lean from vertical
      const shoulderCenter = {
        x: (leftShoulder.x + rightShoulder.x) / 2,
        y: (leftShoulder.y + rightShoulder.y) / 2
      };
      const hipCenter = {
        x: (leftHip.x + rightHip.x) / 2,
        y: (leftHip.y + rightHip.y) / 2
      };
      angles.trunkLean = calculateVerticalAngle(shoulderCenter, hipCenter);
      break;
    }

    case 'pushup': {
      // Elbow angle
      const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
      const rightElbowAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
      angles.elbowAngle = (leftElbowAngle + rightElbowAngle) / 2;

      // Body alignment
      const shoulderCenter = {
        x: (leftShoulder.x + rightShoulder.x) / 2,
        y: (leftShoulder.y + rightShoulder.y) / 2
      };
      const hipCenter = {
        x: (leftHip.x + rightHip.x) / 2,
        y: (leftHip.y + rightHip.y) / 2
      };
      const ankleCenter = {
        x: (leftAnkle.x + rightAnkle.x) / 2,
        y: (leftAnkle.y + rightAnkle.y) / 2
      };
      angles.bodyAlignment = calculateBodyAlignment(shoulderCenter, hipCenter, ankleCenter);
      break;
    }

    case 'plank': {
      // Body alignment
      const shoulderCenter = {
        x: (leftShoulder.x + rightShoulder.x) / 2,
        y: (leftShoulder.y + rightShoulder.y) / 2
      };
      const hipCenter = {
        x: (leftHip.x + rightHip.x) / 2,
        y: (leftHip.y + rightHip.y) / 2
      };
      const ankleCenter = {
        x: (leftAnkle.x + rightAnkle.x) / 2,
        y: (leftAnkle.y + rightAnkle.y) / 2
      };
      angles.bodyAlignment = calculateBodyAlignment(shoulderCenter, hipCenter, ankleCenter);
      break;
    }

    case 'situp': {
      // Hip flexion
      const leftHipAngle = calculateAngle(leftShoulder, leftHip, leftKnee);
      const rightHipAngle = calculateAngle(rightShoulder, rightHip, rightKnee);
      angles.hipAngle = (leftHipAngle + rightHipAngle) / 2;

      // Trunk angle from vertical
      const shoulderCenter = {
        x: (leftShoulder.x + rightShoulder.x) / 2,
        y: (leftShoulder.y + rightShoulder.y) / 2
      };
      const hipCenter = {
        x: (leftHip.x + rightHip.x) / 2,
        y: (leftHip.y + rightHip.y) / 2
      };
      angles.trunkLean = calculateVerticalAngle(shoulderCenter, hipCenter);
      break;
    }
  }

  return angles;
}

// Main function to compare detected pose with expected pose
export function comparePose(
  landmarks: PoseLandmarks,
  expectedPose: string
): number {
  // Returns a score from 0-100 indicating how well the detected pose matches the expected pose
  
  switch (expectedPose) {
    case 't-pose':
      return checkTPose(landmarks);
    case 'standing':
      return checkStanding(landmarks);
    case 'left-leg-raise':
      return checkLeftLegRaise(landmarks);
    case 'right-leg-raise':
      return checkRightLegRaise(landmarks);
    case 'squat-up':
      return checkSquatUp(landmarks);
    case 'squat-up-side':
      return checkSquatUpSide(landmarks);
    case 'squat-down-side':
      return checkSquatDownSide(landmarks);
    case 'pushup-up':
      return checkPushUpUp(landmarks);
    case 'pushup-down':
      return checkPushUpDown(landmarks);
    case 'plank':
      return checkPlank(landmarks);
    case 'squat-down':
      return checkSquatDown(landmarks);
    case 'situp-up':
      return checkSitUpUp(landmarks);
    case 'situp-down':
      return checkSitUpDown(landmarks);
    case 'torso-bend':
      return checkTorsoBend(landmarks);
    case 'head-pivot-left':
      return checkHeadPivotLeft(landmarks);
    case 'head-pivot-right':
      return checkHeadPivotRight(landmarks);
    case 'torso-pivot-left':
      return checkTorsoPivotLeft(landmarks);
    case 'torso-pivot-right':
      return checkTorsoPivotRight(landmarks);
    default:
      return 0;
  }
}