import { useState, useEffect, useRef } from 'react';
import { PositionLockedEffect } from './PositionLockedEffect';
import { PositionGuideFrame } from './PositionGuideFrame';
import { useMediaPipePose, type PoseLandmarks } from '../hooks/useMediaPipePose';
import { comparePose } from '../utils/poseComparison';
import { CameraFeed, type CameraFeedHandle } from './CameraFeed';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { ArrowLeft, SwitchCamera, User, Check, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { StickFigure } from './StickFigure';
import { LivePoseOverlay } from './LivePoseOverlay';

// Text-to-speech helper
const speak = (message: string, rate: number = 0.9) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = rate;
    utterance.pitch = 1;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
  }
};

interface CalibrationViewProps {
  onComplete: () => void;
  onBack: () => void;
}

type CalibrationStage = 'distance' | 'body-calibration';
type DistanceStatus = 'too-close' | 'too-far' | 'optimal';

const calibrationMovements = [
  {
    id: 1,
    instruction: 'Extend both arms horizontally to the sides (T-pose)',
    pose: 't-pose' as const,
    fromPose: 'standing' as const,
    duration: 4,
  },
  {
    id: 2,
    instruction: 'Lower arms back down to your sides',
    pose: 'standing' as const,
    fromPose: 't-pose' as const,
    duration: 4,
  },
  {
    id: 3,
    instruction: 'Bend your LEFT leg outward (keep right leg straight)',
    pose: 'left-leg-raise' as const,
    fromPose: 'standing' as const,
    duration: 4,
  },
  {
    id: 4,
    instruction: 'Bend your RIGHT leg outward (keep left leg straight)',
    pose: 'right-leg-raise' as const,
    fromPose: 'standing' as const,
    duration: 4,
  },
  {
    id: 5,
    instruction: 'Extend arms outward with wrists bent toward the floor',
    pose: 'squat-up' as const,
    fromPose: 'standing' as const,
    duration: 4,
  },
  {
    id: 6,
    instruction: 'Turn your head to the LEFT',
    pose: 'head-pivot-left' as const,
    fromPose: 'standing' as const,
    duration: 4,
  },
  {
    id: 7,
    instruction: 'Turn your head to the RIGHT',
    pose: 'head-pivot-right' as const,
    fromPose: 'head-pivot-left' as const,
    duration: 4,
  },
  {
    id: 8,
    instruction: 'Bend your torso forward to a 90° angle from the hips',
    pose: 'torso-bend' as const,
    fromPose: 'standing' as const,
    duration: 4,
  },
];

export function CalibrationView({ onComplete, onBack }: CalibrationViewProps) {
  const [stage, setStage] = useState<CalibrationStage>('distance');
  const [distanceStatus, setDistanceStatus] = useState<DistanceStatus>('too-far');
  const [optimalHoldTime, setOptimalHoldTime] = useState(0); // Track how long user holds optimal position
  const [currentMovementIndex, setCurrentMovementIndex] = useState(0);
  const [movementTimer, setMovementTimer] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [positionProgress, setPositionProgress] = useState(0); // 0-100, tracks user getting into position
  const [isInPosition, setIsInPosition] = useState(false);
  const [showLockedEffect, setShowLockedEffect] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('user'); // Default to front camera
  const [cameraReady, setCameraReady] = useState(false);
  
  const cameraFeedRef = useRef<CameraFeedHandle>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [detectedLandmarks, setDetectedLandmarks] = useState<PoseLandmarks | null>(null);

  // MediaPipe pose detection hook
  const { isReady: mediaPipeReady, startDetection, stopDetection } = useMediaPipePose(
    () => cameraFeedRef.current?.videoElement || null,
    canvasRef,
    {
      onPoseDetected: (landmarks) => {
        setDetectedLandmarks(landmarks);
      },
      enableDrawing: false, // Disable drawing for cleaner UI
    }
  );

  // Start MediaPipe when calibration begins (for both stages)
  useEffect(() => {
    if (cameraReady && mediaPipeReady && cameraFeedRef.current?.videoElement) {
      const video = cameraFeedRef.current.videoElement;
      let retryTimer: number | undefined;
      
      // Wait for video to be fully ready with better checks
      const checkVideoReady = () => {
        if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
          console.log('Video ready for MediaPipe calibration, starting detection');
          startDetection();
        } else {
          console.log('Waiting for calibration video to be ready...', {
            readyState: video.readyState,
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight
          });
          retryTimer = window.setTimeout(checkVideoReady, 300);
        }
      };
      
      // Initial delay to let camera stabilize
      const timer = setTimeout(checkVideoReady, 800);
      return () => {
        clearTimeout(timer);
        if (retryTimer) {
          clearTimeout(retryTimer);
        }
        stopDetection();
      };
    }
    return () => {
      stopDetection();
    };
  }, [cameraReady, mediaPipeReady, startDetection, stopDetection]);

  // Real distance detection using MediaPipe pose landmarks
  useEffect(() => {
    if (stage !== 'distance' || !detectedLandmarks) return;

    // Calculate shoulder width in pixels to estimate distance
    const leftShoulder = detectedLandmarks.leftShoulder;
    const rightShoulder = detectedLandmarks.rightShoulder;
    const leftAnkle = detectedLandmarks.leftAnkle;
    const rightAnkle = detectedLandmarks.rightAnkle;

    if (!leftShoulder || !rightShoulder) {
      setDistanceStatus('too-far');
      setOptimalHoldTime(0); // Reset timer
      return;
    }

    // Calculate shoulder width in normalized coordinates (0-1)
    const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);
    
    // Check if ankles are visible (full body in frame)
    // For visibility, check z-depth (closer to 0 = more visible)
    const anklesVisible = leftAnkle && rightAnkle && 
                          leftAnkle.z < 1 && rightAnkle.z < 1;

    console.log('Distance calibration:', {
      shoulderWidth,
      anklesVisible,
      leftAnkle: leftAnkle?.z,
      rightAnkle: rightAnkle?.z
    });

    // Determine distance status based on shoulder width
    // Optimal range: 0.15 - 0.35 (normalized coordinates)
    // Too close: > 0.35
    // Too far: < 0.15 or ankles not visible
    
    const previousStatus = distanceStatus;
    let newStatus: DistanceStatus;
    
    if (shoulderWidth > 0.35) {
      newStatus = 'too-close';
      setOptimalHoldTime(0); // Reset timer
    } else if (shoulderWidth < 0.15 || !anklesVisible) {
      newStatus = 'too-far';
      setOptimalHoldTime(0); // Reset timer
    } else {
      newStatus = 'optimal';
    }
    
    setDistanceStatus(newStatus);
    
    // Speak audio feedback when status changes
    if (previousStatus !== newStatus) {
      if (newStatus === 'too-close') {
        speak('Step backward. You are too close to the camera.');
      } else if (newStatus === 'too-far') {
        speak('Step forward. You are too far from the camera.');
      } else if (newStatus === 'optimal') {
        speak('Perfect! Hold this position for three seconds.');
      }
    }

  }, [stage, detectedLandmarks, distanceStatus]);

  // Auto-advance timer for distance calibration
  useEffect(() => {
    if (stage !== 'distance' || distanceStatus !== 'optimal') {
      setOptimalHoldTime(0);
      return;
    }

    // Increment hold time every 100ms
    const timer = setTimeout(() => {
      setOptimalHoldTime(prev => {
        const newTime = prev + 0.1;
        // Auto-advance after 3 seconds
        if (newTime >= 3) {
          handleDistanceConfirm();
          return 0;
        }
        return newTime;
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [stage, distanceStatus, optimalHoldTime]);

  // Announce new movement when it changes
  useEffect(() => {
    if (!isCapturing) return;
    
    // Announce the movement instruction
    const movement = calibrationMovements[currentMovementIndex];
    speak(`Movement ${currentMovementIndex + 1} of ${calibrationMovements.length}. ${movement.instruction}`);
  }, [currentMovementIndex, isCapturing]);

  // Announce when position is locked
  useEffect(() => {
    if (isInPosition) {
      speak('Position locked! Hold steady.');
    }
  }, [isInPosition]);

  // Simulate user getting into position (gradual progress from red to green)
  useEffect(() => {
    if (stage !== 'body-calibration' || !isCapturing || !detectedLandmarks) return;

    // Use actual pose detection to check if user matches required pose
    const currentMovement = calibrationMovements[currentMovementIndex];
    const matchScore = comparePose(detectedLandmarks, currentMovement.pose);
    
    // Update position progress based on actual pose match
    if (!isInPosition) {
      if (matchScore >= 70) {
        // Good pose match - increase progress
        setPositionProgress(prev => {
          const newProgress = Math.min(100, prev + 10); // Increase by 10% every 100ms
          if (newProgress >= 100) {
            // Wait 1 second before confirming position is locked
            setTimeout(() => {
              setIsInPosition(true);
              setShowLockedEffect(true);
              // Hide the effect after 1 second
              setTimeout(() => setShowLockedEffect(false), 1000);
            }, 1000);
            return 100;
          }
          return newProgress;
        });
      } else {
        // Poor pose match - decrease progress
        setPositionProgress(prev => Math.max(0, prev - 5)); // Decrease by 5% every 100ms
      }
    }
    
    const timer = setTimeout(() => {
      // This will trigger the effect again in 100ms
    }, 100);
    
    return () => clearTimeout(timer);
  }, [stage, isCapturing, detectedLandmarks, positionProgress, isInPosition, currentMovementIndex]);

  // Handle movement timer (only starts after user is in position)
  useEffect(() => {
    if (stage !== 'body-calibration' || !isCapturing || !isInPosition) return;

    if (movementTimer < calibrationMovements[currentMovementIndex].duration) {
      const timer = setTimeout(() => {
        setMovementTimer(movementTimer + 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Move to next calibration movement
      if (currentMovementIndex < calibrationMovements.length - 1) {
        setCurrentMovementIndex(currentMovementIndex + 1);
        setMovementTimer(0);
        setPositionProgress(0); // Reset for next movement
        setIsInPosition(false);
      } else {
        // Calibration complete
        setTimeout(onComplete, 1000);
      }
    }
  }, [stage, isCapturing, isInPosition, movementTimer, currentMovementIndex, onComplete]);

  const handleDistanceConfirm = () => {
    if (distanceStatus === 'optimal') {
      speak('Distance calibration complete. Moving to body calibration.');
      setStage('body-calibration');
    }
  };

  const handleStartBodyCalibration = () => {
    speak('Body calibration starting. Listen for movement instructions.');
    setIsCapturing(true);
  };

  const getDistanceColor = () => {
    switch (distanceStatus) {
      case 'too-close':
        return 'border-red-500';
      case 'too-far':
        return 'border-red-500';
      case 'optimal':
        return 'border-green-500';
    }
  };

  const getDistanceMessage = () => {
    switch (distanceStatus) {
      case 'too-close':
        return 'Step backward - You are too close';
      case 'too-far':
        return 'Step forward - You are too far';
      case 'optimal':
        return 'Perfect! Hold this position';
    }
  };

  const getDistanceIndicatorColor = () => {
    return distanceStatus === 'optimal' ? 'bg-green-500' : 'bg-red-500';
  };

  const currentMovement = calibrationMovements[currentMovementIndex];
  const totalProgress = ((currentMovementIndex + (movementTimer / currentMovement.duration)) / calibrationMovements.length) * 100;

  return (
    <div className="h-screen max-h-screen bg-black relative overflow-hidden">
      {/* Simulated Camera Feed */}
      <CameraFeed
        className="absolute inset-0"
        ref={cameraFeedRef}
        facingMode={cameraFacingMode}
        onCameraReady={() => setCameraReady(true)}
      />

      {/* Live Pose Overlay - Real-time skeleton tracking */}
      {cameraReady && cameraFeedRef.current?.videoElement && (
        <LivePoseOverlay
          landmarks={detectedLandmarks}
          videoWidth={cameraFeedRef.current.videoElement.videoWidth || 1280}
          videoHeight={cameraFeedRef.current.videoElement.videoHeight || 720}
          videoElement={cameraFeedRef.current.videoElement}
          className="z-[5]"
        />
      )}

      {/* Hidden canvas for MediaPipe */}
      <canvas 
        ref={canvasRef} 
        className="absolute top-0 left-0 pointer-events-none opacity-0"
        width={1280}
        height={720}
      />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 z-10 safe-top">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="bg-black/50 text-white hover:bg-black/70 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="bg-black/50 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full">
            <span className="text-white text-xs sm:text-sm">
              {stage === 'distance' ? 'Distance Calibration' : 'Body Calibration'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* MediaPipe Detection Indicator */}
            {detectedLandmarks && (
              <div className="bg-black/50 px-3 py-1.5 rounded-full flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-green-400 text-xs">Pose Detected</span>
              </div>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => cameraFeedRef.current?.switchCamera()}
              className="bg-black/50 text-white hover:bg-black/70 rounded-full"
              title="Switch Camera"
            >
              <SwitchCamera className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Distance Calibration Stage */}
      {stage === 'distance' && (
        <>
          {/* Position Guide Frame Overlay */}
          <PositionGuideFrame 
            landmarks={detectedLandmarks} 
            isOptimal={distanceStatus === 'optimal'}
            showFeetGuide={true}
          />
          
          {/* Distance Indicator - TOP CENTER, more compact */}
          <div className="absolute top-20 left-0 right-0 p-4 z-10 pointer-events-none">
            <div className="flex justify-center">
              <motion.div
                className={`${getDistanceIndicatorColor()} text-white px-4 py-2 rounded-full inline-block pointer-events-auto`}
                animate={{ scale: distanceStatus === 'optimal' ? [1, 1.05, 1] : 1 }}
                transition={{ duration: 0.5, repeat: distanceStatus === 'optimal' ? Infinity : 0 }}
              >
                <p className="text-sm">{getDistanceMessage()}</p>
                {distanceStatus === 'optimal' && optimalHoldTime > 0 && (
                  <div className="mt-1 flex items-center justify-center gap-2">
                    <div className="w-24 h-1 bg-white/30 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-white"
                        initial={{ width: '0%' }}
                        animate={{ width: `${(optimalHoldTime / 3) * 100}%` }}
                        transition={{ duration: 0.1 }}
                      />
                    </div>
                    <span className="text-xs">{Math.ceil(3 - optimalHoldTime)}s</span>
                  </div>
                )}
              </motion.div>
            </div>
          </div>

          {/* Instructions - BOTTOM LEFT corner, more compact */}
          <div className="absolute bottom-6 left-6 right-6 md:right-auto md:max-w-md z-10 pointer-events-none">
            <div className="bg-black/70 backdrop-blur-lg rounded-xl p-4 border border-white/10 pointer-events-auto">
              <div className="flex items-start gap-2">
                <User className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <h3 className="text-white mb-1 text-sm">Distance Calibration</h3>
                  <p className="text-gray-300 text-xs mb-2">
                    Position your full body within the guide frame. Move forward or backward until the frame turns green.
                  </p>
                  <p className="text-gray-400 text-xs">
                    Ensures accurate posture tracking during exercise.
                  </p>
                </div>
              </div>
            </div>

            {/* Confirm Button */}
            <AnimatePresence>
              {distanceStatus === 'optimal' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mt-3"
                >
                  <Button
                    onClick={handleDistanceConfirm}
                    size="lg"
                    className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 text-sm w-full"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Continue to Body Calibration
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}

      {/* Body Calibration Stage */}
      {stage === 'body-calibration' && (
        <div className="absolute inset-0 flex flex-col">
          {/* Position Guide Frame - Show during body calibration */}
          {isCapturing && (
            <PositionGuideFrame 
              landmarks={detectedLandmarks} 
              isOptimal={true} // Always show as optimal during body calibration
              showFeetGuide={true}
            />
          )}

          {/* Progress Bar */}
          <div className="px-4 sm:px-6 pt-20 sm:pt-24 pb-3 sm:pb-4 safe-top">
            <div className="bg-black/70 backdrop-blur-lg rounded-2xl p-3 sm:p-4 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white text-xs sm:text-sm">Calibration Progress</span>
                <span className="text-white text-xs sm:text-sm">
                  Movement {currentMovementIndex + 1} of {calibrationMovements.length}
                </span>
              </div>
              <Progress value={totalProgress} className="h-2" />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex items-center justify-center px-4 sm:px-6 overflow-y-auto">
            <div className="w-full max-w-2xl py-4">
              {!isCapturing ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center"
                >
                  <div className="bg-black/70 backdrop-blur-lg rounded-2xl p-4 sm:p-8 border border-white/10 mb-4 sm:mb-6">
                    <h2 className="text-white mb-3 sm:mb-4 text-lg sm:text-xl">Body Calibration</h2>
                    <p className="text-gray-300 mb-3 sm:mb-4 text-sm sm:text-base">
                      Follow the on-screen instructions to perform {calibrationMovements.length} movements. This helps the system identify your body landmarks and proportions.
                    </p>
                    <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                      <p className="text-blue-200 text-xs sm:text-sm">
                        <span className="font-semibold">Why calibrate?</span> The system maps key body landmarks (shoulders, hips, knees, elbows, spine) to accurately measure joint angles during your exercise and provide real-time form corrections.
                      </p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4 sm:p-6 max-h-[30vh] overflow-y-auto">
                      <p className="text-white text-xs sm:text-sm mb-2">You will perform:</p>
                      <ul className="text-gray-300 text-xs sm:text-sm space-y-2 text-left max-w-md mx-auto">
                        {calibrationMovements.map((movement) => (
                          <li key={movement.id} className="flex items-start gap-2">
                            <span className="text-purple-400">•</span>
                            <span>{movement.instruction}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <Button
                    onClick={handleStartBodyCalibration}
                    size="lg"
                    className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-4 sm:px-8 sm:py-6 text-sm sm:text-base"
                  >
                    Start Body Calibration
                  </Button>
                </motion.div>
              ) : (
                <div className="space-y-4 sm:space-y-6 relative">
                  {/* Position Locked Visual Effect */}
                  <PositionLockedEffect show={showLockedEffect} />

                  {/* Stick Figure Demonstration */}
                  <motion.div
                    key={currentMovementIndex}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-8 border-2 transition-colors duration-300 ${
                      isInPosition ? 'border-green-400' : 'border-red-400'
                    }`}
                  >
                    {/* Position Status Badge */}
                    <div className="flex justify-center mb-3 sm:mb-4">
                      <motion.div
                        className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm transition-colors duration-300 ${
                          isInPosition 
                            ? 'bg-green-500/20 text-green-300 border border-green-400' 
                            : 'bg-red-500/20 text-red-300 border border-red-400'
                        }`}
                        animate={{
                          scale: isInPosition ? [1, 1.05, 1] : 1,
                        }}
                        transition={{
                          duration: 0.5,
                          repeat: isInPosition ? Infinity : 0,
                          repeatDelay: 0.5,
                        }}
                      >
                        {isInPosition ? '✓ Position Locked' : `Getting into position... ${Math.round(positionProgress)}%`}
                      </motion.div>
                    </div>

                    {/* Progress bar for position alignment */}
                    {!isInPosition && (
                      <div className="mb-4 sm:mb-6">
                        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                            initial={{ width: '0%' }}
                            animate={{ width: `${positionProgress}%` }}
                            transition={{ duration: 0.1 }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-center mb-4 sm:mb-6 min-h-[200px] sm:min-h-[300px]">
                      <motion.div
                        className="w-full h-full max-w-sm"
                        animate={isInPosition ? {
                          filter: [
                            'drop-shadow(0 0 0px rgba(34, 197, 94, 0))',
                            'drop-shadow(0 0 20px rgba(34, 197, 94, 0.5))',
                            'drop-shadow(0 0 0px rgba(34, 197, 94, 0))',
                          ],
                        } : {}}
                        transition={{
                          duration: 2,
                          repeat: isInPosition ? Infinity : 0,
                        }}
                      >
                        <StickFigure
                          pose={currentMovement.pose}
                          fromPose={currentMovement.fromPose}
                          transitionProgress={positionProgress / 100}
                          showCorrect={isInPosition}
                          className="w-full h-full"
                        />
                      </motion.div>
                    </div>
                  </motion.div>

                  {/* Instruction Card */}
                  <motion.div
                    key={`instruction-${currentMovementIndex}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-black/70 backdrop-blur-lg rounded-2xl p-4 sm:p-6 border border-white/10"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-white text-sm sm:text-base">
                        Movement {currentMovementIndex + 1} of {calibrationMovements.length}
                      </h3>
                      {isInPosition && (
                        <div className="text-xl sm:text-2xl text-purple-400">
                          {currentMovement.duration - movementTimer}s
                        </div>
                      )}
                    </div>
                    <p className="text-gray-300 text-sm sm:text-lg mb-3 sm:mb-4">
                      {currentMovement.instruction}
                    </p>
                    
                    {!isInPosition ? (
                      <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-lg p-2.5 sm:p-3 mb-3">
                        <p className="text-yellow-200 text-xs sm:text-sm">
                          Move into position - the stick figure will turn green when you're aligned correctly
                        </p>
                      </div>
                    ) : (
                      <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-2.5 sm:p-3 mb-3">
                        <p className="text-green-200 text-xs sm:text-sm">
                          ✓ Great! Hold this position while we capture your body landmarks
                        </p>
                      </div>
                    )}
                    
                    {isInPosition && (
                      <Progress 
                        value={(movementTimer / currentMovement.duration) * 100} 
                        className="h-2"
                      />
                    )}
                  </motion.div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Hint */}
          {isCapturing && (
            <div className="px-4 sm:px-6 pb-4 sm:pb-6 safe-bottom">
              <div className="bg-blue-500/20 backdrop-blur-lg rounded-xl p-3 sm:p-4 border border-blue-400/30">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    {isInPosition ? (
                      <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                    ) : (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      >
                        <Circle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                      </motion.div>
                    )}
                  </div>
                  <p className="text-blue-200 text-xs sm:text-sm">
                    {isInPosition 
                      ? 'Capturing body landmarks... Hold your position steady'
                      : 'Follow the on-screen pose - the stick figure will turn green when aligned'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
