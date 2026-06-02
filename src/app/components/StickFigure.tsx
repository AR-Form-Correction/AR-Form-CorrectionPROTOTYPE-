import { motion } from 'motion/react';
import { JointHighlight } from './JointHighlight';

interface JointPosition {
  x: number;
  y: number;
}

export type JointName = 'head' | 'neck' | 'leftShoulder' | 'rightShoulder' | 'leftElbow' | 'rightElbow' | 
  'leftHand' | 'rightHand' | 'spine' | 'hips' | 'leftHip' | 'rightHip' | 'leftKnee' | 'rightKnee' | 
  'leftFoot' | 'rightFoot';

interface StickFigureProps {
  pose: 'standing' | 'pushup-up' | 'pushup-down' | 'plank' | 'squat-up' | 'squat-down' | 'squat-up-side' | 'squat-down-side' | 'situp-up' | 'situp-down' | 'left-leg-raise' | 'right-leg-raise' | 'torso-bend' | 'torso-pivot-left' | 'torso-pivot-right' | 'head-pivot-left' | 'head-pivot-right' | 't-pose';
  showCorrect?: boolean;
  className?: string;
  jointStatus?: Partial<Record<JointName, boolean>>; // true = correct, false = incorrect
  highlightIncorrect?: boolean;
  transitionProgress?: number; // 0-1, for animating from standing to target pose
  fromPose?: 'standing' | 'pushup-up' | 'pushup-down' | 'plank' | 'squat-up' | 'squat-down' | 'squat-up-side' | 'squat-down-side' | 'situp-up' | 'situp-down' | 'left-leg-raise' | 'right-leg-raise' | 'torso-bend' | 'torso-pivot-left' | 'torso-pivot-right' | 'head-pivot-left' | 'head-pivot-right' | 't-pose';
}

export function StickFigure({ pose, showCorrect = true, className = '', jointStatus, highlightIncorrect = false, transitionProgress = 1, fromPose = 'standing' }: StickFigureProps) {
  const poses: Record<string, {
    head: JointPosition;
    neck: JointPosition;
    leftShoulder: JointPosition;
    rightShoulder: JointPosition;
    leftElbow: JointPosition;
    rightElbow: JointPosition;
    leftHand: JointPosition;
    rightHand: JointPosition;
    spine: JointPosition;
    hips: JointPosition;
    leftHip: JointPosition;
    rightHip: JointPosition;
    leftKnee: JointPosition;
    rightKnee: JointPosition;
    leftFoot: JointPosition;
    rightFoot: JointPosition;
  }> = {
    'standing': {
      head: { x: 100, y: 20 },
      neck: { x: 100, y: 35 },
      leftShoulder: { x: 85, y: 35 },
      rightShoulder: { x: 115, y: 35 },
      // Arms bent 90 degrees at elbow, forearms pointing inward toward chest
      leftElbow: { x: 85, y: 55 },  // Straight down from left shoulder
      rightElbow: { x: 115, y: 55 }, // Straight down from right shoulder
      leftHand: { x: 100, y: 55 },   // 90° bend inward (right) from left elbow
      rightHand: { x: 100, y: 55 },  // 90° bend inward (left) from right elbow
      spine: { x: 100, y: 65 },
      hips: { x: 100, y: 95 },
      leftHip: { x: 90, y: 95 },
      rightHip: { x: 110, y: 95 },
      leftKnee: { x: 90, y: 130 },
      rightKnee: { x: 110, y: 130 },
      leftFoot: { x: 90, y: 165 },
      rightFoot: { x: 110, y: 165 },
    },
    'pushup-up': {
      head: { x: 50, y: 80 },
      neck: { x: 60, y: 85 },
      leftShoulder: { x: 60, y: 90 },
      rightShoulder: { x: 60, y: 80 },
      leftElbow: { x: 60, y: 120 },
      rightElbow: { x: 60, y: 110 },
      leftHand: { x: 60, y: 140 },
      rightHand: { x: 60, y: 130 },
      spine: { x: 90, y: 85 },
      hips: { x: 120, y: 85 },
      leftHip: { x: 120, y: 90 },
      rightHip: { x: 120, y: 80 },
      leftKnee: { x: 140, y: 115 },
      rightKnee: { x: 140, y: 105 },
      leftFoot: { x: 160, y: 140 },
      rightFoot: { x: 160, y: 130 },
    },
    'pushup-down': {
      head: { x: 50, y: 95 },
      neck: { x: 60, y: 100 },
      leftShoulder: { x: 60, y: 105 },
      rightShoulder: { x: 60, y: 95 },
      leftElbow: { x: 60, y: 115 },
      rightElbow: { x: 60, y: 105 },
      leftHand: { x: 60, y: 140 },
      rightHand: { x: 60, y: 130 },
      spine: { x: 90, y: 100 },
      hips: { x: 120, y: 100 },
      leftHip: { x: 120, y: 105 },
      rightHip: { x: 120, y: 95 },
      leftKnee: { x: 140, y: 123 },
      rightKnee: { x: 140, y: 113 },
      leftFoot: { x: 160, y: 140 },
      rightFoot: { x: 160, y: 130 },
    },
    'plank': {
      head: { x: 50, y: 80 },
      neck: { x: 60, y: 85 },
      leftShoulder: { x: 60, y: 90 },
      rightShoulder: { x: 60, y: 80 },
      leftElbow: { x: 60, y: 120 },
      rightElbow: { x: 60, y: 110 },
      leftHand: { x: 60, y: 140 },
      rightHand: { x: 60, y: 130 },
      spine: { x: 90, y: 97.5 },
      hips: { x: 120, y: 110 },
      leftHip: { x: 120, y: 115 },
      rightHip: { x: 120, y: 105 },
      leftKnee: { x: 140, y: 127.5 },
      rightKnee: { x: 140, y: 117.5 },
      leftFoot: { x: 160, y: 140 },
      rightFoot: { x: 160, y: 130 },
    },
    'squat-up': {
      // FRONT VIEW: Standing upright for calibration
      head: { x: 100, y: 20 },
      neck: { x: 100, y: 35 },
      leftShoulder: { x: 85, y: 35 },
      rightShoulder: { x: 115, y: 35 },
      leftElbow: { x: 75, y: 50 },
      rightElbow: { x: 125, y: 50 },
      leftHand: { x: 70, y: 65 },
      rightHand: { x: 130, y: 65 },
      spine: { x: 100, y: 65 },
      hips: { x: 100, y: 95 },
      leftHip: { x: 90, y: 95 },
      rightHip: { x: 110, y: 95 },
      leftKnee: { x: 90, y: 130 },
      rightKnee: { x: 110, y: 130 },
      leftFoot: { x: 90, y: 165 },
      rightFoot: { x: 110, y: 165 },
    },
    'squat-down': {
      // FRONT VIEW: Squatting position for calibration
      head: { x: 100, y: 55 },
      neck: { x: 100, y: 70 },
      leftShoulder: { x: 85, y: 70 },
      rightShoulder: { x: 115, y: 70 },
      leftElbow: { x: 70, y: 90 },
      rightElbow: { x: 130, y: 90 },
      leftHand: { x: 65, y: 110 },
      rightHand: { x: 135, y: 110 },
      spine: { x: 100, y: 100 },
      hips: { x: 100, y: 130 },
      leftHip: { x: 85, y: 130 },
      rightHip: { x: 115, y: 130 },
      leftKnee: { x: 80, y: 145 },
      rightKnee: { x: 120, y: 145 },
      leftFoot: { x: 75, y: 165 },
      rightFoot: { x: 125, y: 165 },
    },
    'squat-up-side': {
      // SIDE PROFILE: Left side facing camera, standing upright
      head: { x: 100, y: 20 },
      neck: { x: 100, y: 35 },
      // Shoulders aligned vertically (side view, one in front of the other)
      leftShoulder: { x: 100, y: 35 },
      rightShoulder: { x: 100, y: 35 },
      // Arms down by sides in side profile
      leftElbow: { x: 100, y: 60 },
      rightElbow: { x: 100, y: 60 },
      leftHand: { x: 100, y: 85 },
      rightHand: { x: 100, y: 85 },
      spine: { x: 100, y: 65 },
      hips: { x: 100, y: 95 },
      // Hips aligned (side view)
      leftHip: { x: 100, y: 95 },
      rightHip: { x: 100, y: 95 },
      // Legs straight down
      leftKnee: { x: 100, y: 130 },
      rightKnee: { x: 100, y: 130 },
      leftFoot: { x: 100, y: 165 },
      rightFoot: { x: 100, y: 165 },
    },
    'squat-down-side': {
      // SIDE PROFILE: Left side facing camera, squatting position
      // Head slightly forward as torso leans
      head: { x: 90, y: 65 },
      neck: { x: 95, y: 75 },
      // Shoulders move forward as person squats
      leftShoulder: { x: 95, y: 80 },
      rightShoulder: { x: 95, y: 80 },
      // Arms extended forward for balance (side view)
      leftElbow: { x: 80, y: 90 },
      rightElbow: { x: 80, y: 90 },
      leftHand: { x: 65, y: 95 },
      rightHand: { x: 65, y: 95 },
      // Spine angles forward from hips
      spine: { x: 100, y: 100 },
      // Hips drop down and slightly back
      hips: { x: 110, y: 130 },
      leftHip: { x: 110, y: 130 },
      rightHip: { x: 110, y: 130 },
      // Knees bent forward, shins angled
      leftKnee: { x: 95, y: 145 },
      rightKnee: { x: 95, y: 145 },
      // Feet stay planted
      leftFoot: { x: 100, y: 165 },
      rightFoot: { x: 100, y: 165 },
    },
    'situp-up': {
      // SIDE PROFILE: Torso upright (90° from ground), knees bent pointing upward
      // Head and torso are ABOVE hips (vertical), feet on RIGHT side
      head: { x: 105, y: 70 },
      neck: { x: 105, y: 85 },
      // Shoulders aligned vertically above hips
      leftShoulder: { x: 105, y: 90 },
      rightShoulder: { x: 105, y: 90 },
      // Arms lateral (out to sides), elbows bent with hands behind head
      // In side profile: one elbow forward, one backward
      leftElbow: { x: 85, y: 85 },    // Elbow out to left/forward
      rightElbow: { x: 125, y: 85 },  // Elbow out to right/backward
      leftHand: { x: 100, y: 75 },    // Hand behind head (forward side)
      rightHand: { x: 110, y: 75 },   // Hand behind head (backward side)
      // Spine vertical from shoulders down to hips
      spine: { x: 105, y: 110 },
      // Hips on ground - pivot point
      hips: { x: 105, y: 130 },
      leftHip: { x: 105, y: 130 },
      rightHip: { x: 105, y: 130 },
      // Knees bent pointing upward, to the RIGHT of hips
      leftKnee: { x: 125, y: 110 },
      rightKnee: { x: 125, y: 110 },
      // Feet planted on ground to the RIGHT
      leftFoot: { x: 135, y: 130 },
      rightFoot: { x: 135, y: 130 },
    },
    'situp-down': {
      // SIDE PROFILE: Torso flat on ground, knees bent pointing upward
      // Head on LEFT side, feet on RIGHT side
      head: { x: 50, y: 130 },
      neck: { x: 65, y: 130 },
      // Shoulders aligned, torso horizontal extending toward hips
      leftShoulder: { x: 75, y: 130 },
      rightShoulder: { x: 75, y: 130 },
      // Arms lateral (out to sides), elbows bent with hands behind head
      // In side profile lying down: elbows point up/down, hands behind head
      leftElbow: { x: 75, y: 110 },   // Elbow pointing up/forward
      rightElbow: { x: 75, y: 150 },  // Elbow pointing down/backward
      leftHand: { x: 55, y: 125 },    // Hand behind head (upper side)
      rightHand: { x: 55, y: 135 },   // Hand behind head (lower side)
      // Spine horizontal on ground extending to hips
      spine: { x: 90, y: 130 },
      // Hips on ground - pivot point (same x as situp-up)
      hips: { x: 105, y: 130 },
      leftHip: { x: 105, y: 130 },
      rightHip: { x: 105, y: 130 },
      // Knees bent pointing upward, to the RIGHT of hips
      leftKnee: { x: 125, y: 110 },
      rightKnee: { x: 125, y: 110 },
      // Feet planted on ground to the RIGHT
      leftFoot: { x: 135, y: 130 },
      rightFoot: { x: 135, y: 130 },
    },
    'left-leg-raise': {
      head: { x: 100, y: 20 },
      neck: { x: 100, y: 35 },
      leftShoulder: { x: 85, y: 35 },
      rightShoulder: { x: 115, y: 35 },
      leftElbow: { x: 85, y: 60 },
      rightElbow: { x: 115, y: 60 },
      leftHand: { x: 85, y: 85 },
      rightHand: { x: 115, y: 85 },
      spine: { x: 100, y: 65 },
      hips: { x: 100, y: 95 },
      leftHip: { x: 90, y: 95 },
      rightHip: { x: 110, y: 95 },
      // Left leg is bent outward
      leftKnee: { x: 70, y: 115 },
      leftFoot: { x: 65, y: 140 },
      // Right leg stays straight
      rightKnee: { x: 110, y: 130 },
      rightFoot: { x: 110, y: 165 },
    },
    'right-leg-raise': {
      head: { x: 100, y: 20 },
      neck: { x: 100, y: 35 },
      leftShoulder: { x: 85, y: 35 },
      rightShoulder: { x: 115, y: 35 },
      leftElbow: { x: 85, y: 60 },
      rightElbow: { x: 115, y: 60 },
      leftHand: { x: 85, y: 85 },
      rightHand: { x: 115, y: 85 },
      spine: { x: 100, y: 65 },
      hips: { x: 100, y: 95 },
      leftHip: { x: 90, y: 95 },
      rightHip: { x: 110, y: 95 },
      // Left leg stays straight
      leftKnee: { x: 90, y: 130 },
      leftFoot: { x: 90, y: 165 },
      // Right leg is bent outward
      rightKnee: { x: 130, y: 115 },
      rightFoot: { x: 135, y: 140 },
    },
    'torso-bend': {
      // Standing with legs straight, torso bent 90 degrees at hips
      head: { x: 60, y: 75 },
      neck: { x: 70, y: 80 },
      leftShoulder: { x: 70, y: 85 },
      rightShoulder: { x: 70, y: 75 },
      // Arms hanging down naturally
      leftElbow: { x: 70, y: 105 },
      rightElbow: { x: 70, y: 95 },
      leftHand: { x: 70, y: 125 },
      rightHand: { x: 70, y: 115 },
      // Spine horizontal from neck to hips
      spine: { x: 85, y: 80 },
      hips: { x: 100, y: 80 },
      leftHip: { x: 100, y: 85 },
      rightHip: { x: 100, y: 75 },
      // Legs straight down
      leftKnee: { x: 100, y: 120 },
      rightKnee: { x: 100, y: 110 },
      leftFoot: { x: 100, y: 155 },
      rightFoot: { x: 100, y: 145 },
    },
    'torso-pivot-left': {
      // Standing, torso bent ~20 degrees to the left at hips
      head: { x: 90, y: 22 },
      neck: { x: 93, y: 36 },
      leftShoulder: { x: 80, y: 38 },
      rightShoulder: { x: 106, y: 36 },
      // Arms bent 90 degrees, resting on chest
      leftElbow: { x: 80, y: 56 },
      rightElbow: { x: 106, y: 54 },
      leftHand: { x: 93, y: 56 },
      rightHand: { x: 93, y: 54 },
      spine: { x: 96, y: 66 },
      hips: { x: 100, y: 95 },
      leftHip: { x: 90, y: 95 },
      rightHip: { x: 110, y: 95 },
      leftKnee: { x: 90, y: 130 },
      rightKnee: { x: 110, y: 130 },
      leftFoot: { x: 90, y: 165 },
      rightFoot: { x: 110, y: 165 },
    },
    'torso-pivot-right': {
      // Standing, torso bent ~20 degrees to the right at hips
      head: { x: 110, y: 22 },
      neck: { x: 107, y: 36 },
      leftShoulder: { x: 94, y: 36 },
      rightShoulder: { x: 120, y: 38 },
      // Arms bent 90 degrees, resting on chest
      leftElbow: { x: 94, y: 54 },
      rightElbow: { x: 120, y: 56 },
      leftHand: { x: 107, y: 54 },
      rightHand: { x: 107, y: 56 },
      spine: { x: 104, y: 66 },
      hips: { x: 100, y: 95 },
      leftHip: { x: 90, y: 95 },
      rightHip: { x: 110, y: 95 },
      leftKnee: { x: 90, y: 130 },
      rightKnee: { x: 110, y: 130 },
      leftFoot: { x: 90, y: 165 },
      rightFoot: { x: 110, y: 165 },
    },
    'head-pivot-left': {
      // Standing, head pivoted ~20 degrees to the left
      head: { x: 85, y: 20 },
      neck: { x: 100, y: 35 },
      leftShoulder: { x: 85, y: 35 },
      rightShoulder: { x: 115, y: 35 },
      // Arms bent 90 degrees at elbow, forearms pointing inward toward chest
      leftElbow: { x: 85, y: 55 },
      rightElbow: { x: 115, y: 55 },
      leftHand: { x: 100, y: 55 },
      rightHand: { x: 100, y: 55 },
      spine: { x: 100, y: 65 },
      hips: { x: 100, y: 95 },
      leftHip: { x: 90, y: 95 },
      rightHip: { x: 110, y: 95 },
      leftKnee: { x: 90, y: 130 },
      rightKnee: { x: 110, y: 130 },
      leftFoot: { x: 90, y: 165 },
      rightFoot: { x: 110, y: 165 },
    },
    'head-pivot-right': {
      // Standing, head pivoted ~20 degrees to the right
      head: { x: 115, y: 20 },
      neck: { x: 100, y: 35 },
      leftShoulder: { x: 85, y: 35 },
      rightShoulder: { x: 115, y: 35 },
      // Arms bent 90 degrees at elbow, forearms pointing inward toward chest
      leftElbow: { x: 85, y: 55 },
      rightElbow: { x: 115, y: 55 },
      leftHand: { x: 100, y: 55 },
      rightHand: { x: 100, y: 55 },
      spine: { x: 100, y: 65 },
      hips: { x: 100, y: 95 },
      leftHip: { x: 90, y: 95 },
      rightHip: { x: 110, y: 95 },
      leftKnee: { x: 90, y: 130 },
      rightKnee: { x: 110, y: 130 },
      leftFoot: { x: 90, y: 165 },
      rightFoot: { x: 110, y: 165 },
    },
    't-pose': {
      // Standing with arms straight out to the sides (T-shape)
      head: { x: 100, y: 20 },
      neck: { x: 100, y: 35 },
      leftShoulder: { x: 85, y: 35 },
      rightShoulder: { x: 115, y: 35 },
      // Arms straight out horizontally to the sides
      leftElbow: { x: 50, y: 35 },
      rightElbow: { x: 150, y: 35 },
      leftHand: { x: 20, y: 35 },
      rightHand: { x: 180, y: 35 },
      spine: { x: 100, y: 65 },
      hips: { x: 100, y: 95 },
      leftHip: { x: 90, y: 95 },
      rightHip: { x: 110, y: 95 },
      leftKnee: { x: 90, y: 130 },
      rightKnee: { x: 110, y: 130 },
      leftFoot: { x: 90, y: 165 },
      rightFoot: { x: 110, y: 165 },
    },
  };

  // Helper function to interpolate between two joint positions
  const interpolateJoint = (from: JointPosition, to: JointPosition, progress: number): JointPosition => {
    return {
      x: from.x + (to.x - from.x) * progress,
      y: from.y + (to.y - from.y) * progress,
    };
  };

  // Get the target pose and starting pose
  const targetPose = poses[pose];
  const startPose = poses[fromPose];
  
  // Interpolate between start and target based on transitionProgress
  const currentPose = Object.keys(targetPose).reduce((acc, jointName) => {
    const key = jointName as JointName;
    acc[key] = interpolateJoint(startPose[key], targetPose[key], transitionProgress);
    return acc;
  }, {} as typeof targetPose);

  const defaultColor = showCorrect ? '#22c55e' : '#ef4444';
  
  // Helper function to get color for a specific joint/limb
  const getJointColor = (jointName: JointName): string => {
    if (!jointStatus) return defaultColor;
    const status = jointStatus[jointName];
    if (status === undefined) return defaultColor;
    return status ? '#22c55e' : '#ef4444';
  };

  // Get limb color based on connected joints
  const getLimbColor = (joint1: JointName, joint2: JointName): string => {
    if (!jointStatus) return defaultColor;
    const status1 = jointStatus[joint1];
    const status2 = jointStatus[joint2];
    // If either joint is incorrect, show red
    if (status1 === false || status2 === false) return '#ef4444';
    // If both are correct, show green
    if (status1 === true && status2 === true) return '#22c55e';
    // Default
    return defaultColor;
  };

  const jointLabels: Record<JointName, string> = {
    head: 'Head',
    neck: 'Neck',
    leftShoulder: 'L Shoulder',
    rightShoulder: 'R Shoulder',
    leftElbow: 'L Elbow',
    rightElbow: 'R Elbow',
    leftHand: 'L Hand',
    rightHand: 'R Hand',
    spine: 'Spine',
    hips: 'Hips',
    leftHip: 'L Hip',
    rightHip: 'R Hip',
    leftKnee: 'L Knee',
    rightKnee: 'R Knee',
    leftFoot: 'L Foot',
    rightFoot: 'R Foot',
  };

  return (
    <svg viewBox="0 0 200 180" className={className}>
      {/* Head */}
      <motion.circle
        cx={currentPose.head.x}
        cy={currentPose.head.y}
        r="8"
        fill="none"
        stroke={getJointColor('head')}
        strokeWidth="3"
        initial={false}
        animate={{ cx: currentPose.head.x, cy: currentPose.head.y }}
        transition={{ duration: 0.5 }}
      />
      
      {/* Neck to head */}
      <motion.line
        x1={currentPose.neck.x}
        y1={currentPose.neck.y}
        x2={currentPose.head.x}
        y2={currentPose.head.y}
        stroke={getLimbColor('neck', 'head')}
        strokeWidth="3"
        strokeLinecap="round"
        initial={false}
        animate={{
          x1: currentPose.neck.x,
          y1: currentPose.neck.y,
          x2: currentPose.head.x,
          y2: currentPose.head.y,
        }}
        transition={{ duration: 0.5 }}
      />
      
      {/* Shoulders */}
      <motion.line
        x1={currentPose.leftShoulder.x}
        y1={currentPose.leftShoulder.y}
        x2={currentPose.rightShoulder.x}
        y2={currentPose.rightShoulder.y}
        stroke={getLimbColor('leftShoulder', 'rightShoulder')}
        strokeWidth="3"
        strokeLinecap="round"
        initial={false}
        animate={{
          x1: currentPose.leftShoulder.x,
          y1: currentPose.leftShoulder.y,
          x2: currentPose.rightShoulder.x,
          y2: currentPose.rightShoulder.y,
        }}
        transition={{ duration: 0.5 }}
      />
      
      {/* Spine */}
      <motion.line
        x1={currentPose.neck.x}
        y1={currentPose.neck.y}
        x2={currentPose.hips.x}
        y2={currentPose.hips.y}
        stroke={getLimbColor('spine', 'hips')}
        strokeWidth="3"
        strokeLinecap="round"
        initial={false}
        animate={{
          x1: currentPose.neck.x,
          y1: currentPose.neck.y,
          x2: currentPose.hips.x,
          y2: currentPose.hips.y,
        }}
        transition={{ duration: 0.5 }}
      />
      
      {/* Left arm */}
      <motion.line
        x1={currentPose.leftShoulder.x}
        y1={currentPose.leftShoulder.y}
        x2={currentPose.leftElbow.x}
        y2={currentPose.leftElbow.y}
        stroke={getLimbColor('leftShoulder', 'leftElbow')}
        strokeWidth="3"
        strokeLinecap="round"
        initial={false}
        animate={{
          x1: currentPose.leftShoulder.x,
          y1: currentPose.leftShoulder.y,
          x2: currentPose.leftElbow.x,
          y2: currentPose.leftElbow.y,
        }}
        transition={{ duration: 0.5 }}
      />
      <motion.line
        x1={currentPose.leftElbow.x}
        y1={currentPose.leftElbow.y}
        x2={currentPose.leftHand.x}
        y2={currentPose.leftHand.y}
        stroke={getLimbColor('leftElbow', 'leftHand')}
        strokeWidth="3"
        strokeLinecap="round"
        initial={false}
        animate={{
          x1: currentPose.leftElbow.x,
          y1: currentPose.leftElbow.y,
          x2: currentPose.leftHand.x,
          y2: currentPose.leftHand.y,
        }}
        transition={{ duration: 0.5 }}
      />
      
      {/* Right arm */}
      <motion.line
        x1={currentPose.rightShoulder.x}
        y1={currentPose.rightShoulder.y}
        x2={currentPose.rightElbow.x}
        y2={currentPose.rightElbow.y}
        stroke={getLimbColor('rightShoulder', 'rightElbow')}
        strokeWidth="3"
        strokeLinecap="round"
        initial={false}
        animate={{
          x1: currentPose.rightShoulder.x,
          y1: currentPose.rightShoulder.y,
          x2: currentPose.rightElbow.x,
          y2: currentPose.rightElbow.y,
        }}
        transition={{ duration: 0.5 }}
      />
      <motion.line
        x1={currentPose.rightElbow.x}
        y1={currentPose.rightElbow.y}
        x2={currentPose.rightHand.x}
        y2={currentPose.rightHand.y}
        stroke={getLimbColor('rightElbow', 'rightHand')}
        strokeWidth="3"
        strokeLinecap="round"
        initial={false}
        animate={{
          x1: currentPose.rightElbow.x,
          y1: currentPose.rightElbow.y,
          x2: currentPose.rightHand.x,
          y2: currentPose.rightHand.y,
        }}
        transition={{ duration: 0.5 }}
      />
      
      {/* Hips */}
      <motion.line
        x1={currentPose.leftHip.x}
        y1={currentPose.leftHip.y}
        x2={currentPose.rightHip.x}
        y2={currentPose.rightHip.y}
        stroke={getLimbColor('leftHip', 'rightHip')}
        strokeWidth="3"
        strokeLinecap="round"
        initial={false}
        animate={{
          x1: currentPose.leftHip.x,
          y1: currentPose.leftHip.y,
          x2: currentPose.rightHip.x,
          y2: currentPose.rightHip.y,
        }}
        transition={{ duration: 0.5 }}
      />
      
      {/* Left leg */}
      <motion.line
        x1={currentPose.leftHip.x}
        y1={currentPose.leftHip.y}
        x2={currentPose.leftKnee.x}
        y2={currentPose.leftKnee.y}
        stroke={getLimbColor('leftHip', 'leftKnee')}
        strokeWidth="3"
        strokeLinecap="round"
        initial={false}
        animate={{
          x1: currentPose.leftHip.x,
          y1: currentPose.leftHip.y,
          x2: currentPose.leftKnee.x,
          y2: currentPose.leftKnee.y,
        }}
        transition={{ duration: 0.5 }}
      />
      <motion.line
        x1={currentPose.leftKnee.x}
        y1={currentPose.leftKnee.y}
        x2={currentPose.leftFoot.x}
        y2={currentPose.leftFoot.y}
        stroke={getLimbColor('leftKnee', 'leftFoot')}
        strokeWidth="3"
        strokeLinecap="round"
        initial={false}
        animate={{
          x1: currentPose.leftKnee.x,
          y1: currentPose.leftKnee.y,
          x2: currentPose.leftFoot.x,
          y2: currentPose.leftFoot.y,
        }}
        transition={{ duration: 0.5 }}
      />
      
      {/* Right leg */}
      <motion.line
        x1={currentPose.rightHip.x}
        y1={currentPose.rightHip.y}
        x2={currentPose.rightKnee.x}
        y2={currentPose.rightKnee.y}
        stroke={getLimbColor('rightHip', 'rightKnee')}
        strokeWidth="3"
        strokeLinecap="round"
        initial={false}
        animate={{
          x1: currentPose.rightHip.x,
          y1: currentPose.rightHip.y,
          x2: currentPose.rightKnee.x,
          y2: currentPose.rightKnee.y,
        }}
        transition={{ duration: 0.5 }}
      />
      <motion.line
        x1={currentPose.rightKnee.x}
        y1={currentPose.rightKnee.y}
        x2={currentPose.rightFoot.x}
        y2={currentPose.rightFoot.y}
        stroke={getLimbColor('rightKnee', 'rightFoot')}
        strokeWidth="3"
        strokeLinecap="round"
        initial={false}
        animate={{
          x1: currentPose.rightKnee.x,
          y1: currentPose.rightKnee.y,
          x2: currentPose.rightFoot.x,
          y2: currentPose.rightFoot.y,
        }}
        transition={{ duration: 0.5 }}
      />
      
      {/* Joint markers */}
      {Object.entries(currentPose).map(([jointName, joint]) => (
        <motion.circle
          key={jointName}
          cx={joint.x}
          cy={joint.y}
          r="4"
          fill={getJointColor(jointName as JointName)}
          initial={false}
          animate={{ cx: joint.x, cy: joint.y }}
          transition={{ duration: 0.5 }}
        />
      ))}

      {/* Joint Highlights for incorrect positions */}
      {highlightIncorrect && jointStatus && Object.entries(jointStatus).map(([jointName, isCorrect]) => {
        if (isCorrect) return null;
        const joint = currentPose[jointName as JointName];
        if (!joint) return null;
        return (
          <JointHighlight
            key={`highlight-${jointName}`}
            x={joint.x}
            y={joint.y}
            label={jointLabels[jointName as JointName]}
            isCorrect={isCorrect}
          />
        );
      })}
    </svg>
  );
}