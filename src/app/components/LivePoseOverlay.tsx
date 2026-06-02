import { motion } from 'motion/react';
import { type PoseLandmarks } from '../hooks/useMediaPipePose';
import { type FormIssues } from '../utils/poseComparison';

interface LivePoseOverlayProps {
  landmarks: PoseLandmarks | null;
  videoWidth: number;
  videoHeight: number;
  formIssues?: FormIssues;
  exerciseType?: 'pushup' | 'plank' | 'squat' | 'situp';
  className?: string;
  videoElement?: HTMLVideoElement | null;
}

export function LivePoseOverlay({ 
  landmarks, 
  videoWidth, 
  videoHeight, 
  formIssues = {},
  exerciseType,
  className = '',
  videoElement
}: LivePoseOverlayProps) {
  if (!landmarks || !videoWidth || !videoHeight) {
    return null;
  }

  // Get the actual displayed dimensions of the video element
  // This accounts for CSS scaling and object-fit
  let displayWidth = videoWidth;
  let displayHeight = videoHeight;
  let offsetX = 0;
  let offsetY = 0;

  if (videoElement) {
    const rect = videoElement.getBoundingClientRect();
    const videoAspect = videoWidth / videoHeight;
    const displayAspect = rect.width / rect.height;

    // Account for object-fit: cover
    if (displayAspect > videoAspect) {
      // Display is wider - video fills height
      displayHeight = rect.height;
      displayWidth = displayHeight * videoAspect;
      offsetX = (rect.width - displayWidth) / 2;
    } else {
      // Display is taller - video fills width
      displayWidth = rect.width;
      displayHeight = displayWidth / videoAspect;
      offsetY = (rect.height - displayHeight) / 2;
    }
  }

  // Convert normalized coordinates (0-1) to screen pixels
  const toScreenCoords = (point: { x: number; y: number }) => {
    return {
      x: point.x * displayWidth + offsetX,
      y: point.y * displayHeight + offsetY,
    };
  };

  // Get all landmarks in screen coordinates
  const nose = toScreenCoords(landmarks.nose);
  const leftShoulder = toScreenCoords(landmarks.leftShoulder);
  const rightShoulder = toScreenCoords(landmarks.rightShoulder);
  const leftElbow = toScreenCoords(landmarks.leftElbow);
  const rightElbow = toScreenCoords(landmarks.rightElbow);
  const leftWrist = toScreenCoords(landmarks.leftWrist);
  const rightWrist = toScreenCoords(landmarks.rightWrist);
  const leftHip = toScreenCoords(landmarks.leftHip);
  const rightHip = toScreenCoords(landmarks.rightHip);
  const leftKnee = toScreenCoords(landmarks.leftKnee);
  const rightKnee = toScreenCoords(landmarks.rightKnee);
  const leftAnkle = toScreenCoords(landmarks.leftAnkle);
  const rightAnkle = toScreenCoords(landmarks.rightAnkle);

  // Calculate shoulder and hip midpoints
  const shoulderMid = {
    x: (leftShoulder.x + rightShoulder.x) / 2,
    y: (leftShoulder.y + rightShoulder.y) / 2,
  };
  const hipMid = {
    x: (leftHip.x + rightHip.x) / 2,
    y: (leftHip.y + rightHip.y) / 2,
  };

  // Determine colors based on form issues
  const getColor = (bodyPart: 'upper' | 'lower' | 'leftArm' | 'rightArm' | 'leftLeg' | 'rightLeg' | 'shoulders' | 'body'): string => {
    if (!exerciseType || Object.keys(formIssues).length === 0) {
      return '#22c55e'; // Green by default
    }

    switch (exerciseType) {
      case 'squat':
        if (bodyPart === 'lower' || bodyPart === 'leftLeg' || bodyPart === 'rightLeg') {
          if (formIssues.kneeAngleTooShallow || formIssues.kneeAngleTooDeep || formIssues.kneesOverToes) {
            return '#ef4444'; // Red
          }
        }
        if (bodyPart === 'body' || bodyPart === 'upper') {
          if (formIssues.trunkLeanExcessive || formIssues.trunkLeanInsufficient) {
            return '#ef4444'; // Red
          }
        }
        break;

      case 'pushup':
        if (bodyPart === 'leftArm' || bodyPart === 'rightArm') {
          if (formIssues.elbowAngleIncorrect || formIssues.elbowsTooWide) {
            return '#ef4444'; // Red
          }
        }
        if (bodyPart === 'body') {
          if (formIssues.bodyNotStraight || formIssues.hipsSagging || formIssues.hipsRaised) {
            return '#ef4444'; // Red
          }
        }
        break;

      case 'plank':
        if (bodyPart === 'body') {
          if (formIssues.hipsSagging || formIssues.hipsRaised) {
            return '#ef4444'; // Red
          }
        }
        if (bodyPart === 'leftLeg' || bodyPart === 'rightLeg') {
          if (formIssues.hipAbductionTooWide) {
            return '#ef4444'; // Red
          }
        }
        break;

      case 'situp':
        if (bodyPart === 'body' || bodyPart === 'upper') {
          if (formIssues.lumbarFlexionInsufficient || formIssues.lumbarFlexionExcessive) {
            return '#ef4444'; // Red
          }
        }
        if (bodyPart === 'lower') {
          if (formIssues.hipFlexionIncorrect) {
            return '#ef4444'; // Red
          }
        }
        break;
    }

    // Check general issues
    if (bodyPart === 'shoulders' && formIssues.shouldersNotLevel) {
      return '#ef4444'; // Red
    }
    if (bodyPart === 'body' && formIssues.backNotStraight) {
      return '#ef4444'; // Red
    }

    return '#22c55e'; // Green
  };

  const bodyColor = getColor('body');
  const upperBodyColor = getColor('upper');
  const lowerBodyColor = getColor('lower');
  const leftArmColor = getColor('leftArm');
  const rightArmColor = getColor('rightArm');
  const leftLegColor = getColor('leftLeg');
  const rightLegColor = getColor('rightLeg');
  const shouldersColor = getColor('shoulders');

  return (
    <svg
      className={`absolute top-0 left-0 pointer-events-none ${className}`}
      width={videoWidth}
      height={videoHeight}
      style={{ position: 'absolute', top: 0, left: 0 }}
    >
      {/* Torso - Spine */}
      <motion.line
        x1={shoulderMid.x}
        y1={shoulderMid.y}
        x2={hipMid.x}
        y2={hipMid.y}
        stroke={bodyColor}
        strokeWidth="4"
        strokeLinecap="round"
        initial={false}
      />

      {/* Shoulders */}
      <motion.line
        x1={leftShoulder.x}
        y1={leftShoulder.y}
        x2={rightShoulder.x}
        y2={rightShoulder.y}
        stroke={shouldersColor}
        strokeWidth="4"
        strokeLinecap="round"
        initial={false}
      />

      {/* Hips */}
      <motion.line
        x1={leftHip.x}
        y1={leftHip.y}
        x2={rightHip.x}
        y2={rightHip.y}
        stroke={lowerBodyColor}
        strokeWidth="4"
        strokeLinecap="round"
        initial={false}
      />

      {/* Left Arm */}
      <motion.line
        x1={leftShoulder.x}
        y1={leftShoulder.y}
        x2={leftElbow.x}
        y2={leftElbow.y}
        stroke={leftArmColor}
        strokeWidth="4"
        strokeLinecap="round"
        initial={false}
      />
      <motion.line
        x1={leftElbow.x}
        y1={leftElbow.y}
        x2={leftWrist.x}
        y2={leftWrist.y}
        stroke={leftArmColor}
        strokeWidth="4"
        strokeLinecap="round"
        initial={false}
      />

      {/* Right Arm */}
      <motion.line
        x1={rightShoulder.x}
        y1={rightShoulder.y}
        x2={rightElbow.x}
        y2={rightElbow.y}
        stroke={rightArmColor}
        strokeWidth="4"
        strokeLinecap="round"
        initial={false}
      />
      <motion.line
        x1={rightElbow.x}
        y1={rightElbow.y}
        x2={rightWrist.x}
        y2={rightWrist.y}
        stroke={rightArmColor}
        strokeWidth="4"
        strokeLinecap="round"
        initial={false}
      />

      {/* Left Leg */}
      <motion.line
        x1={leftHip.x}
        y1={leftHip.y}
        x2={leftKnee.x}
        y2={leftKnee.y}
        stroke={leftLegColor}
        strokeWidth="4"
        strokeLinecap="round"
        initial={false}
      />
      <motion.line
        x1={leftKnee.x}
        y1={leftKnee.y}
        x2={leftAnkle.x}
        y2={leftAnkle.y}
        stroke={leftLegColor}
        strokeWidth="4"
        strokeLinecap="round"
        initial={false}
      />

      {/* Right Leg */}
      <motion.line
        x1={rightHip.x}
        y1={rightHip.y}
        x2={rightKnee.x}
        y2={rightKnee.y}
        stroke={rightLegColor}
        strokeWidth="4"
        strokeLinecap="round"
        initial={false}
      />
      <motion.line
        x1={rightKnee.x}
        y1={rightKnee.y}
        x2={rightAnkle.x}
        y2={rightAnkle.y}
        stroke={rightLegColor}
        strokeWidth="4"
        strokeLinecap="round"
        initial={false}
      />

      {/* Neck to nose */}
      <motion.line
        x1={shoulderMid.x}
        y1={shoulderMid.y}
        x2={nose.x}
        y2={nose.y}
        stroke={upperBodyColor}
        strokeWidth="4"
        strokeLinecap="round"
        initial={false}
      />

      {/* Joint Circles */}
      {/* Head */}
      <motion.circle
        cx={nose.x}
        cy={nose.y}
        r="8"
        fill={upperBodyColor}
        stroke="white"
        strokeWidth="2"
        initial={false}
      />

      {/* Shoulders */}
      <motion.circle
        cx={leftShoulder.x}
        cy={leftShoulder.y}
        r="6"
        fill={leftArmColor}
        stroke="white"
        strokeWidth="2"
        initial={false}
      />
      <motion.circle
        cx={rightShoulder.x}
        cy={rightShoulder.y}
        r="6"
        fill={rightArmColor}
        stroke="white"
        strokeWidth="2"
        initial={false}
      />

      {/* Elbows */}
      <motion.circle
        cx={leftElbow.x}
        cy={leftElbow.y}
        r="6"
        fill={leftArmColor}
        stroke="white"
        strokeWidth="2"
        initial={false}
      />
      <motion.circle
        cx={rightElbow.x}
        cy={rightElbow.y}
        r="6"
        fill={rightArmColor}
        stroke="white"
        strokeWidth="2"
        initial={false}
      />

      {/* Wrists */}
      <motion.circle
        cx={leftWrist.x}
        cy={leftWrist.y}
        r="6"
        fill={leftArmColor}
        stroke="white"
        strokeWidth="2"
        initial={false}
      />
      <motion.circle
        cx={rightWrist.x}
        cy={rightWrist.y}
        r="6"
        fill={rightArmColor}
        stroke="white"
        strokeWidth="2"
        initial={false}
      />

      {/* Hips */}
      <motion.circle
        cx={leftHip.x}
        cy={leftHip.y}
        r="6"
        fill={leftLegColor}
        stroke="white"
        strokeWidth="2"
        initial={false}
      />
      <motion.circle
        cx={rightHip.x}
        cy={rightHip.y}
        r="6"
        fill={rightLegColor}
        stroke="white"
        strokeWidth="2"
        initial={false}
      />

      {/* Knees */}
      <motion.circle
        cx={leftKnee.x}
        cy={leftKnee.y}
        r="6"
        fill={leftLegColor}
        stroke="white"
        strokeWidth="2"
        initial={false}
      />
      <motion.circle
        cx={rightKnee.x}
        cy={rightKnee.y}
        r="6"
        fill={rightLegColor}
        stroke="white"
        strokeWidth="2"
        initial={false}
      />

      {/* Ankles */}
      <motion.circle
        cx={leftAnkle.x}
        cy={leftAnkle.y}
        r="6"
        fill={leftLegColor}
        stroke="white"
        strokeWidth="2"
        initial={false}
      />
      <motion.circle
        cx={rightAnkle.x}
        cy={rightAnkle.y}
        r="6"
        fill={rightLegColor}
        stroke="white"
        strokeWidth="2"
        initial={false}
      />
    </svg>
  );
}