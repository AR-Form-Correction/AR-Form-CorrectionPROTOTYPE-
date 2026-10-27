import { useState, useEffect, useRef } from 'react';
import { useMediaPipePose, type PoseLandmarks } from '../hooks/useMediaPipePose';
import { comparePose, detectFormIssues, extractAngles, type FormIssues } from '../utils/poseComparison';
import { CameraFeed, type CameraFeedHandle } from './CameraFeed';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { PositionGuideFrame } from './PositionGuideFrame';
import { StickFigure, type JointName } from './StickFigure';
import { Badge } from './ui/badge';
import { X, Camera, Volume2, Circle, ScanLine, SwitchCamera } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LivePoseOverlay } from './LivePoseOverlay';

// Text-to-speech feedback with queue to prevent overlap
let isSpeaking = false;
const speechQueue: string[] = [];

const speakFeedback = (message: string) => {
  if ('speechSynthesis' in window) {
    // Add to queue if already speaking
    if (isSpeaking || window.speechSynthesis.speaking) {
      // Only add if not already in queue to prevent duplicates
      if (!speechQueue.includes(message)) {
        speechQueue.push(message);
      }
      return;
    }
    
    // Mark as speaking
    isSpeaking = true;
    
    // Cancel any existing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    // When speech ends, process queue
    utterance.onend = () => {
      isSpeaking = false;
      
      // Process next item in queue after a short delay
      setTimeout(() => {
        if (speechQueue.length > 0) {
          const nextMessage = speechQueue.shift();
          if (nextMessage) {
            speakFeedback(nextMessage);
          }
        }
      }, 500); // 500ms delay between messages
    };
    
    utterance.onerror = () => {
      isSpeaking = false;
      // Try next in queue if error occurs
      if (speechQueue.length > 0) {
        const nextMessage = speechQueue.shift();
        if (nextMessage) {
          speakFeedback(nextMessage);
        }
      }
    };
    
    window.speechSynthesis.speak(utterance);
  }
};

// Audio Feedback Indicator Component
function AudioFeedbackIndicator({ message, type }: { message: string; type: 'correction' | 'encouragement' | 'warning' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`p-3 rounded-xl backdrop-blur-lg border-2 ${
        type === 'correction'
          ? 'bg-red-500/20 border-red-400'
          : type === 'warning'
          ? 'bg-yellow-500/20 border-yellow-400'
          : 'bg-green-500/20 border-green-400'
      }`}
    >
      <div className="flex items-center gap-3">
        <Volume2
          className={`w-5 h-5 ${
            type === 'correction'
              ? 'text-red-400'
              : type === 'warning'
              ? 'text-yellow-400'
              : 'text-green-400'
          }`}
        />
        <span
          className={`text-sm ${
            type === 'correction'
              ? 'text-red-100'
              : type === 'warning'
              ? 'text-yellow-100'
              : 'text-green-100'
          }`}
        >
          {message}
        </span>
      </div>
    </motion.div>
  );
}

type ExerciseType = 'pushup' | 'plank' | 'squat' | 'situp';

interface LiveExerciseViewProps {
  exerciseId: ExerciseType;
  targetReps: number;
  onComplete: (sessionData: ExerciseSessionData) => void;
  onCancel: () => void;
}

// Session data to track throughout exercise
export interface ExerciseSessionData {
  exerciseId: ExerciseType;
  repsCompleted: number;
  targetReps: number;
  totalAnalysisCount: number;
  formIssueFrequency: Record<string, number>; // How many times each issue was detected
  averageAngles: {
    kneeAngle?: number;
    elbowAngle?: number;
    bodyAlignment?: number;
    trunkLean?: number;
    hipAngle?: number;
  };
  angleHistory: {
    kneeAngles: number[];
    elbowAngles: number[];
    bodyAlignments: number[];
    trunkLeans: number[];
    hipAngles: number[];
  };
  overallFormScore: number; // Percentage of time with good form
  distanceIssuesCount: number;
}

// Simulated joint status for demonstration
type JointStatus = Partial<Record<JointName, boolean>>;

const exerciseConfig: Record<string, {
  name: string;
  targetReps: number;
  poses: Array<'standing' | 'pushup-up' | 'pushup-down' | 'plank' | 'squat-up' | 'squat-down' | 'squat-up-side' | 'squat-down-side' | 'situp-up' | 'situp-down'>;
  feedbackMessages: Array<{ message: string; type: 'correction' | 'encouragement' | 'warning' }>;
}> = {
  pushup: {
    name: 'Push-Up',
    targetReps: 10,
    poses: ['pushup-up', 'pushup-down'],
    feedbackMessages: [
      { message: 'Keep your core tight!', type: 'correction' },
      { message: 'Great form! Keep it up!', type: 'encouragement' },
      { message: 'Lower your hips slightly', type: 'warning' },
      { message: 'Elbows at 45 degrees', type: 'correction' },
      { message: 'Perfect alignment!', type: 'encouragement' },
    ],
  },
  plank: {
    name: 'Plank Hold',
    targetReps: 30,
    poses: ['plank'],
    feedbackMessages: [
      { message: 'Engage your core muscles', type: 'correction' },
      { message: 'Excellent stability!', type: 'encouragement' },
      { message: 'Lower your hips', type: 'warning' },
      { message: 'Keep breathing steadily', type: 'correction' },
      { message: 'Strong hold!', type: 'encouragement' },
    ],
  },
  squat: {
    name: 'Squat',
    targetReps: 10,
    poses: ['squat-up-side', 'squat-down-side'],
    feedbackMessages: [
      { message: 'Knees behind toes!', type: 'correction' },
      { message: 'Nice depth! Keep going!', type: 'encouragement' },
      { message: 'Chest up, shoulders back', type: 'warning' },
      { message: 'Push through your heels', type: 'correction' },
      { message: 'Perfect form!', type: 'encouragement' },
    ],
  },
  situp: {
    name: 'Sit-Up',
    targetReps: 10,
    poses: ['situp-down', 'situp-up'],
    feedbackMessages: [
      { message: 'Use your core, not your neck', type: 'correction' },
      { message: 'Great control!', type: 'encouragement' },
      { message: 'Keep lower back down', type: 'warning' },
      { message: 'Slow and controlled', type: 'correction' },
      { message: 'Excellent technique!', type: 'encouragement' },
    ],
  },
};

export function LiveExerciseView({ exerciseId, targetReps, onComplete, onCancel }: LiveExerciseViewProps) {
  const [repsCompleted, setRepsCompleted] = useState(0);
  const [currentPoseIndex, setCurrentPoseIndex] = useState(0);
  const [currentFeedback, setCurrentFeedback] = useState<{ message: string; type: 'correction' | 'encouragement' | 'warning' } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [jointStatus, setJointStatus] = useState<JointStatus>({});
  const [deviationCount, setDeviationCount] = useState(0); // Track consecutive deviations
  const [lastAnalysisTime, setLastAnalysisTime] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('user'); // Default to front camera
  const [cameraReady, setCameraReady] = useState(false);
  const [detectedLandmarks, setDetectedLandmarks] = useState<PoseLandmarks | null>(null);
  const [formIssues, setFormIssues] = useState<FormIssues>({});
  const [distanceStatus, setDistanceStatus] = useState<'optimal' | 'too-close' | 'too-far'>('optimal');
  const [distanceWarningCount, setDistanceWarningCount] = useState(0);
  const [goodFormCount, setGoodFormCount] = useState(0); // Track consecutive good form intervals
  const [lastEncouragementTime, setLastEncouragementTime] = useState(0); // Prevent spam
  
  // Use ref to access latest landmarks inside interval without re-creating the interval
  const detectedLandmarksRef = useRef<PoseLandmarks | null>(null);
  
  // Rep detection state
  const [lastPoseMatch, setLastPoseMatch] = useState<string | null>(null);
  const [poseHoldCount, setPoseHoldCount] = useState(0); // How many frames the pose has been held
  const [isInStartPosition, setIsInStartPosition] = useState(false);
  const [lastBestScore, setLastBestScore] = useState(0); // Track the last best pose match score
  const [failedRepAttempts, setFailedRepAttempts] = useState(0); // Track failed rep attempts
  
  // DEBUG: Real-time pose scores for on-screen display
  const [debugPoseScores, setDebugPoseScores] = useState<Record<string, number>>({});
  const [debugBestMatch, setDebugBestMatch] = useState<{ pose: string; score: number } | null>(null);
  const [debugAnalysisCount, setDebugAnalysisCount] = useState(0);
  const [debugLastError, setDebugLastError] = useState<string | null>(null);
  
  const cameraFeedRef = useRef<CameraFeedHandle>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Safety check for config
  const config = exerciseConfig[exerciseId];
  if (!config) {
    console.error(`Unknown exercise ID: ${exerciseId}`);
    // Return to home if invalid exercise
    setTimeout(() => onCancel(), 100);
    return null;
  }
  
  // Session data tracking
  const [sessionData, setSessionData] = useState<ExerciseSessionData>({
    exerciseId,
    repsCompleted: 0,
    targetReps: targetReps,
    totalAnalysisCount: 0,
    formIssueFrequency: {},
    averageAngles: {},
    angleHistory: {
      kneeAngles: [],
      elbowAngles: [],
      bodyAlignments: [],
      trunkLeans: [],
      hipAngles: [],
    },
    overallFormScore: 100,
    distanceIssuesCount: 0,
  });
  
  const progress = (repsCompleted / targetReps) * 100;

  // MediaPipe pose detection hook
  const { isReady: mediaPipeReady, startDetection, stopDetection } = useMediaPipePose(
    () => cameraFeedRef.current?.videoElement || null,
    canvasRef,
    {
      onPoseDetected: (landmarks) => {
        setDetectedLandmarks(landmarks);
        detectedLandmarksRef.current = landmarks;
      },
      enableDrawing: false,
    }
  );

  // Start MediaPipe when recording begins and camera is ready
  useEffect(() => {
    if (isRecording && cameraReady && mediaPipeReady && cameraFeedRef.current?.videoElement) {
      const video = cameraFeedRef.current.videoElement;
      let retryTimer: number | undefined;
      
      // Wait for video to be fully ready with better checks
      const checkVideoReady = () => {
        if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
          console.log('Video ready for MediaPipe, starting detection');
          startDetection();
        } else {
          console.log('Waiting for video to be ready...', {
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
  }, [isRecording, cameraReady, mediaPipeReady, startDetection, stopDetection]);

  // Countdown before starting
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setIsRecording(true);
    }
  }, [countdown]);

  // Real-time posture analysis using actual MediaPipe pose data
  useEffect(() => {
    if (!isRecording) {
      return;
    }

    const analysisInterval = setInterval(() => {
      try {
        // Use ref to get the latest landmarks
        const currentLandmarks = detectedLandmarksRef.current;
        
        if (!currentLandmarks) {
          return;
        }
        
        setIsAnalyzing(true);
        setLastAnalysisTime(Date.now());
        setDebugAnalysisCount(prev => prev + 1);

        // Check distance from camera using shoulder width
        const leftShoulder = currentLandmarks.leftShoulder;
        const rightShoulder = currentLandmarks.rightShoulder;
        const leftAnkle = currentLandmarks.leftAnkle;
        const rightAnkle = currentLandmarks.rightAnkle;

        // Declare newDistanceStatus at the top scope of the interval
        let newDistanceStatus: 'optimal' | 'too-close' | 'too-far' = 'optimal';

        if (leftShoulder && rightShoulder) {
          // IMPORTANT: For SIDE VIEW exercises (squat), shoulder width is NOT a good metric
          // because both shoulders are stacked (side profile) so width is near zero!
          // Instead, use BODY HEIGHT (shoulder to ankle distance) for side view
          
          const isSideViewExercise = exerciseId === 'squat';
          
          if (isSideViewExercise) {
            // SIDE VIEW (squat): Use body height as distance metric
            // Calculate vertical span from shoulder to ankle
            const bodyHeight = Math.abs(leftShoulder.y - leftAnkle.y);
            
            // Also check if full body is visible (ankles in frame)
            const anklesVisible = leftAnkle?.z && leftAnkle.z < 1;
            
            // Distance thresholds for side view based on body height
            if (bodyHeight > 0.75) {
              // Body takes up most of the frame vertically = too close
              newDistanceStatus = 'too-close';
            } else if (bodyHeight < 0.45 || !anklesVisible) {
              // Body is small in frame or ankles cut off = too far
              newDistanceStatus = 'too-far';
            }
            // Optimal: 0.45 to 0.75 body height (good frame coverage)
            
          } else {
            // FRONT VIEW (push-up, plank, sit-up): Use shoulder width
            const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);
            const anklesVisible = leftAnkle?.z && leftAnkle.z < 1 && 
                                  rightAnkle?.z && rightAnkle.z < 1;

            // Determine distance status - MORE FORGIVING THRESHOLDS
            // Normalized coordinates: 0.0 = left edge, 1.0 = right edge of frame
            if (shoulderWidth > 0.45) {
              // Very close - shoulders take up almost half the frame
              newDistanceStatus = 'too-close';
            } else if (shoulderWidth < 0.10) {
              // Very far - shoulders are tiny
              newDistanceStatus = 'too-far';
            } else if (!anklesVisible && shoulderWidth < 0.15) {
              // Ankles not visible AND user is relatively small = probably too far
              newDistanceStatus = 'too-far';
            }
            // Otherwise: optimal (0.10 to 0.45 shoulder width is good range)
          }

          setDistanceStatus(newDistanceStatus);

          // Track consecutive distance warnings
          if (newDistanceStatus !== 'optimal') {
            setDistanceWarningCount(prev => prev + 1);
          } else {
            setDistanceWarningCount(0);
          }
        }

        // Check pose match for ALL poses in the exercise
        let bestMatchPose = '';
        let bestMatchScore = 0;
        const scoresMap: Record<string, number> = {};
        
        config.poses.forEach(pose => {
          try {
            const score = comparePose(currentLandmarks, pose);
            scoresMap[pose] = score;
            if (score > bestMatchScore) {
              bestMatchScore = score;
              bestMatchPose = pose;
            }
          } catch (error) {
            console.error(`Error checking pose '${pose}':`, error);
            scoresMap[pose] = 0;
            setDebugLastError(`${pose}: ${error}`);
          }
        });
        
        // Update debug state for on-screen display - ALWAYS update even if scores are 0
        setDebugPoseScores(scoresMap);
        setDebugBestMatch({ pose: bestMatchPose || 'none', score: bestMatchScore });
        
        console.log(`✓ Best match: ${bestMatchPose} with score ${bestMatchScore.toFixed(1)} / 100`);
        
        // Require minimum match to consider user is in a pose
        // LOWERED from 60% to 50% for more realistic real-world detection
        // Side view poses especially can be harder to match perfectly
        const MIN_POSE_MATCH_THRESHOLD = 50; // Was 60, now 50 for better usability
        const PARTIAL_REP_THRESHOLD = 35; // Lowered from 40 to detect attempted reps
        const isInRecognizablePose = bestMatchScore >= MIN_POSE_MATCH_THRESHOLD;
        const isPartialPose = bestMatchScore >= PARTIAL_REP_THRESHOLD && bestMatchScore < MIN_POSE_MATCH_THRESHOLD;
        
        // REP COUNTING LOGIC for non-plank exercises
        if (exerciseId !== 'plank') {
          const startPose = config.poses[0]; // First pose in cycle (e.g., pushup-up, squat-up-side, situp-down)
          const endPose = config.poses[1]; // Second pose in cycle (e.g., pushup-down, squat-down-side, situp-up)
          
          // Check if user is in start or end position (with good form >= 60%)
          if (isInRecognizablePose) {
            if (bestMatchPose === startPose) {
              if (!isInStartPosition) {
                // User just entered start position
                setIsInStartPosition(true);
                setLastPoseMatch(startPose);
              }
            } else if (bestMatchPose === endPose) {
              if (isInStartPosition && lastPoseMatch === startPose) {
                // User was in start position and now reached end position
                setLastPoseMatch(endPose);
              }
            }
            
            // Count rep when returning to start position from end position
            if (bestMatchPose === startPose && lastPoseMatch === endPose) {
              // Completed one full cycle!
              setRepsCompleted(prev => {
                const newReps = prev + 1;
                setSessionData(prevData => ({ ...prevData, repsCompleted: newReps }));
                
                // Announce rep completion
                speakFeedback(`Rep ${newReps} complete`);
                
                // ENCOURAGEMENT: Give motivational feedback if rep was completed with good form
                // Check if goodFormCount is high (most of the rep was in good form)
                if (goodFormCount >= 3) {
                  // Rep was done with good form! Give encouragement
                  const encouragementMessages = config.feedbackMessages.filter(msg => msg.type === 'encouragement');
                  if (encouragementMessages.length > 0) {
                    const randomEncouragement = encouragementMessages[Math.floor(Math.random() * encouragementMessages.length)];
                    // Delay slightly so it doesn't overlap with "Rep X complete"
                    setTimeout(() => {
                      setCurrentFeedback({ message: randomEncouragement.message, type: 'encouragement' });
                      speakFeedback(randomEncouragement.message);
                      setTimeout(() => setCurrentFeedback(null), 3000);
                    }, 1500);
                  }
                }
                
                // Check if exercise is complete
                if (newReps >= targetReps) {
                  setTimeout(() => {
                    setSessionData(finalData => {
                      const averages = {
                        kneeAngle: finalData.angleHistory.kneeAngles.length > 0
                          ? Math.round(finalData.angleHistory.kneeAngles.reduce((a, b) => a + b, 0) / finalData.angleHistory.kneeAngles.length)
                          : undefined,
                        elbowAngle: finalData.angleHistory.elbowAngles.length > 0
                          ? Math.round(finalData.angleHistory.elbowAngles.reduce((a, b) => a + b, 0) / finalData.angleHistory.elbowAngles.length)
                          : undefined,
                        bodyAlignment: finalData.angleHistory.bodyAlignments.length > 0
                          ? Math.round(finalData.angleHistory.bodyAlignments.reduce((a, b) => a + b, 0) / finalData.angleHistory.bodyAlignments.length)
                          : undefined,
                        trunkLean: finalData.angleHistory.trunkLeans.length > 0
                          ? Math.round(finalData.angleHistory.trunkLeans.reduce((a, b) => a + b, 0) / finalData.angleHistory.trunkLeans.length)
                          : undefined,
                        hipAngle: finalData.angleHistory.hipAngles.length > 0
                          ? Math.round(finalData.angleHistory.hipAngles.reduce((a, b) => a + b, 0) / finalData.angleHistory.hipAngles.length)
                          : undefined,
                      };
                      
                      const completedData = {
                        ...finalData,
                        averageAngles: averages,
                      };
                      
                      speakFeedback('Exercise complete! Great work!');
                      setTimeout(() => onComplete(completedData), 2000);
                      return completedData;
                    });
                  }, 500);
                }
                
                return newReps;
              });
              
              setLastPoseMatch(startPose);
              setIsInStartPosition(true);
            }
          }
        }
        
        // Use actual pose comparison to determine form quality
        const currentPose = config.poses[currentPoseIndex];
        const matchScore = comparePose(currentLandmarks, currentPose);
        
        // Detect specific form issues
        const issues = detectFormIssues(currentLandmarks, exerciseId);
        setFormIssues(issues);
        
        // DEBUG: Log trunk lean issues for squats
        if (exerciseId === 'squat' && issues.trunkLeanExcessive) {
          console.log('⚠️ TRUNK LEAN EXCESSIVE detected!', issues);
        }

        // Extract current angles for tracking
        const currentAngles = extractAngles(currentLandmarks, exerciseId);
        
        // Update session data
        setSessionData(prev => {
          const newData = { ...prev };
          
          // Track analysis count
          newData.totalAnalysisCount += 1;
          
          // Track angle history
          if (currentAngles.kneeAngle !== undefined) {
            newData.angleHistory.kneeAngles.push(currentAngles.kneeAngle);
          }
          if (currentAngles.elbowAngle !== undefined) {
            newData.angleHistory.elbowAngles.push(currentAngles.elbowAngle);
          }
          if (currentAngles.bodyAlignment !== undefined) {
            newData.angleHistory.bodyAlignments.push(currentAngles.bodyAlignment);
          }
          if (currentAngles.trunkLean !== undefined) {
            newData.angleHistory.trunkLeans.push(currentAngles.trunkLean);
          }
          if (currentAngles.hipAngle !== undefined) {
            newData.angleHistory.hipAngles.push(currentAngles.hipAngle);
          }
          
          // Track form issue frequency
          Object.keys(issues).forEach(issueKey => {
            if (issues[issueKey as keyof FormIssues]) {
              newData.formIssueFrequency[issueKey] = (newData.formIssueFrequency[issueKey] || 0) + 1;
            }
          });
          
          // Track distance issues
          if (newDistanceStatus !== 'optimal') {
            newData.distanceIssuesCount += 1;
          }
          
          // Calculate overall form score
          // Only give good score if:
          // 1. User is in a recognizable pose (bestMatchScore >= 60%)
          // 2. No form issues detected
          // 3. Distance is optimal
          const totalIssuesDetected = Object.values(issues).filter(issue => issue === true).length;
          const hasNoIssues = totalIssuesDetected === 0 && newDistanceStatus === 'optimal' && isInRecognizablePose;
          const goodFormCount = hasNoIssues ? 100 : 0;
          
          newData.overallFormScore = Math.round(
            ((newData.overallFormScore * (newData.totalAnalysisCount - 1)) + goodFormCount) / newData.totalAnalysisCount
          );
          
          return newData;
        });

        // Map form issues to joint status
        const newJointStatus: JointStatus = {
          leftShoulder: !issues.shouldersNotLevel,
          rightShoulder: !issues.shouldersNotLevel,
          hips: !issues.hipsSagging && !issues.hipsRaised && !issues.hipFlexionIncorrect,
          leftKnee: !issues.kneesOverToes && !issues.kneeAngleTooShallow && !issues.kneeAngleTooDeep,
          rightKnee: !issues.kneesOverToes && !issues.kneeAngleTooShallow && !issues.kneeAngleTooDeep,
          spine: !issues.hipsSagging && !issues.hipsRaised && !issues.bodyNotStraight && !issues.trunkLeanExcessive && !issues.trunkLeanInsufficient && !issues.lumbarFlexionInsufficient && !issues.lumbarFlexionExcessive,
          leftElbow: !issues.elbowsTooWide && !issues.elbowAngleIncorrect,
          rightElbow: !issues.elbowsTooWide && !issues.elbowAngleIncorrect,
        };

        setJointStatus(newJointStatus);

        // Track consecutive deviations for audio feedback trigger
        // IMPORTANT: Only give audio corrections when form is ACTUALLY BAD
        // If pose score is 50-60%, form is "acceptable" - don't nag the user
        // Only correct when pose score is LOW (<45%) OR severe safety issues detected
        const hasIncorrectJoint = Object.values(issues).some(issue => issue === true);
        
        // Severe safety issues that warrant correction even with acceptable pose score
        const hasSevereSafetyIssue = 
          issues.kneeAngleTooDeep || // Risk of knee injury
          issues.kneesOverToes || // Risk of knee injury
          issues.elbowAngleIncorrect || // Risk of shoulder injury
          issues.lumbarFlexionExcessive || // Risk of back injury
          issues.trunkLeanExcessive; // Risk of back injury - excessive forward lean
        
        // Only increment deviation count if:
        // 1. Pose score is LOW (<45%) = form is actually bad, OR
        // 2. Severe safety issue detected (even if pose score is acceptable)
        const shouldCorrect = (hasIncorrectJoint && bestMatchScore < 45) || hasSevereSafetyIssue;
        
        if (shouldCorrect && isInRecognizablePose && repsCompleted < (config.targetReps * 0.7)) {
          setDeviationCount(prev => prev + 1);
        } else {
          setDeviationCount(0);
        }
        
        // IMMEDIATE safety correction - don't wait 3 seconds!
        // If severe safety issue detected, trigger audio feedback NOW
        if (hasSevereSafetyIssue && isInRecognizablePose && repsCompleted < (config.targetReps * 0.7)) {
          // Determine which safety issue to correct
          let immediateFeedback = '';
          
          if (exerciseId === 'squat') {
            if (issues.trunkLeanExcessive) {
              immediateFeedback = 'Straighten your back - reduce forward trunk lean';
            } else if (issues.kneeAngleTooDeep) {
              immediateFeedback = 'Warning: squatting too deep - reduce knee flexion for safety';
            } else if (issues.kneesOverToes) {
              immediateFeedback = 'Push your hips back - keep knees behind toes';
            }
          } else if (exerciseId === 'pushup') {
            if (issues.elbowAngleIncorrect) {
              immediateFeedback = 'Elbow angle should be 80 to 100 degrees at the bottom';
            }
          } else if (exerciseId === 'situp') {
            if (issues.lumbarFlexionExcessive) {
              immediateFeedback = 'Don\'t curl too much - reduce lumbar flexion for safety';
            }
          }
          
          // Only trigger if we have a message and haven't already given this exact feedback recently
          // Check if this is a NEW safety issue (wasn't present in last check)
          if (immediateFeedback && !currentFeedback) {
            setCurrentFeedback({ message: immediateFeedback, type: 'correction' });
            speakFeedback(immediateFeedback);
            setTimeout(() => setCurrentFeedback(null), 3000);
          }
        }

        // Track consecutive GOOD form for encouragement AFTER completing a rep
        // This will be checked when rep completes, not here
        const isGoodForm = isInRecognizablePose && !hasSevereSafetyIssue && newDistanceStatus === 'optimal';
        if (isGoodForm && isInStartPosition) {
          setGoodFormCount(prev => prev + 1);
        } else {
          setGoodFormCount(0);
        }

        setTimeout(() => setIsAnalyzing(false), 200);
      } catch (error) {
        console.error('Error in pose analysis:', error);
        setDebugLastError(`Pose analysis error: ${error}`);
        setIsAnalyzing(false);
      }
    }, 1000); // Analysis every 1 second

    return () => clearInterval(analysisInterval);
  }, [isRecording, repsCompleted, config.targetReps, config.poses, currentPoseIndex, exerciseId, isInStartPosition, lastPoseMatch, onComplete]);

  // Audio feedback triggered after 3 consecutive deviations (3 seconds)
  useEffect(() => {
    if (!isRecording || !detectedLandmarks) return;
    
    // Distance warning feedback (after 3 consecutive seconds)
    if (distanceWarningCount >= 3) {
      let distanceMessage = '';
      if (distanceStatus === 'too-close') {
        distanceMessage = 'Step backward - You are too close to the camera';
      } else if (distanceStatus === 'too-far') {
        distanceMessage = 'Move closer - You are too far from the camera';
      }
      
      if (distanceMessage) {
        setCurrentFeedback({ message: distanceMessage, type: 'warning' });
        speakFeedback(distanceMessage);
        setTimeout(() => setCurrentFeedback(null), 3000);
        setDistanceWarningCount(0); // Reset to avoid spam
      }
    }
    
    // Form feedback (only if distance is OK)
    if (distanceStatus === 'optimal' && deviationCount >= 3 && repsCompleted < (config.targetReps * 0.7)) {
      // Trigger audio feedback based on actual detected issues using scientific baselines
      let feedbackMessage = '';
      
      // Exercise-specific feedback based on biomechanical analysis
      if (exerciseId === 'squat') {
        if (formIssues.kneeAngleTooShallow) {
          feedbackMessage = 'Squat deeper - aim for 90 degrees knee flexion';
        } else if (formIssues.kneeAngleTooDeep) {
          feedbackMessage = 'Warning: squatting too deep - reduce knee flexion for safety';
        } else if (formIssues.kneesOverToes) {
          feedbackMessage = 'Push your hips back - keep knees behind toes';
        } else if (formIssues.trunkLeanExcessive) {
          feedbackMessage = 'Straighten your back - reduce forward trunk lean';
        } else if (formIssues.trunkLeanInsufficient) {
          feedbackMessage = 'Lean forward slightly - aim for 30 to 45 degrees';
        }
      } else if (exerciseId === 'pushup') {
        if (formIssues.elbowAngleIncorrect) {
          feedbackMessage = 'Elbow angle should be 80 to 100 degrees at the bottom';
        } else if (formIssues.bodyNotStraight) {
          feedbackMessage = 'Keep your body straight - maintain alignment';
        } else if (formIssues.elbowsTooWide) {
          feedbackMessage = 'Keep your elbows closer to your body - not too wide';
        } else if (formIssues.hipsSagging) {
          feedbackMessage = 'Engage your core - lift your hips';
        } else if (formIssues.hipsRaised) {
          feedbackMessage = 'Lower your hips - keep your body straight';
        }
      } else if (exerciseId === 'plank') {
        if (formIssues.hipsSagging) {
          feedbackMessage = 'Engage your core - lift your hips to maintain straight line';
        } else if (formIssues.hipsRaised) {
          feedbackMessage = 'Lower your hips slightly - aim for straight body alignment';
        } else if (formIssues.hipAbductionTooWide) {
          feedbackMessage = 'Bring your feet closer together - reduce hip width';
        }
      } else if (exerciseId === 'situp') {
        if (formIssues.hipFlexionIncorrect) {
          feedbackMessage = 'Maintain 70 to 90 degree hip flexion - adjust your position';
        } else if (formIssues.lumbarFlexionInsufficient) {
          feedbackMessage = 'Curl your spine more - increase lumbar flexion';
        } else if (formIssues.lumbarFlexionExcessive) {
          feedbackMessage = 'Don\'t curl too much - reduce lumbar flexion for safety';
        }
      }
      
      // General issues that apply to all exercises
      if (!feedbackMessage && formIssues.shouldersNotLevel) {
        feedbackMessage = 'Level your shoulders - keep them even';
      }
      
      // Only give feedback if there's a specific issue detected
      // Don't give fallback generic messages
      if (feedbackMessage) {
        setCurrentFeedback({ message: feedbackMessage, type: 'correction' });
        speakFeedback(feedbackMessage);
        setTimeout(() => setCurrentFeedback(null), 3000);
        setDeviationCount(0); // Reset after giving feedback
      } else {
        // If deviationCount is high but no specific message, still reset to avoid spam
        setDeviationCount(0);
      }
    }
    
    // ENCOURAGEMENT FEEDBACK - trigger after 5 seconds of good form
    // Only give encouragement if enough time has passed since last encouragement (at least 10 seconds)
    const now = Date.now();
    if (distanceStatus === 'optimal' && goodFormCount >= 5 && (now - lastEncouragementTime) >= 10000) {
      // Get random encouragement message from config
      const encouragementMessages = config.feedbackMessages.filter(msg => msg.type === 'encouragement');
      if (encouragementMessages.length > 0) {
        const randomEncouragement = encouragementMessages[Math.floor(Math.random() * encouragementMessages.length)];
        setCurrentFeedback({ message: randomEncouragement.message, type: 'encouragement' });
        speakFeedback(randomEncouragement.message);
        setTimeout(() => setCurrentFeedback(null), 3000);
        setLastEncouragementTime(now); // Update last encouragement time
        setGoodFormCount(0); // Reset good form counter
      }
    }
  }, [deviationCount, distanceWarningCount, distanceStatus, isRecording, formIssues, config.feedbackMessages, repsCompleted, config.targetReps, detectedLandmarks]);

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Simulated Camera Feed */}
      <CameraFeed 
        className="absolute inset-0" 
        ref={cameraFeedRef} 
        facingMode={cameraFacingMode}
        onCameraReady={() => setCameraReady(true)}
        onCameraSwitch={(newMode) => setCameraFacingMode(newMode)}
      />

      {/* Live Pose Overlay - Real-time skeleton tracking with form feedback */}
      {cameraReady && cameraFeedRef.current?.videoElement && (
        <LivePoseOverlay
          landmarks={detectedLandmarks}
          videoWidth={cameraFeedRef.current.videoElement.videoWidth || 1280}
          videoHeight={cameraFeedRef.current.videoElement.videoHeight || 720}
          videoElement={cameraFeedRef.current.videoElement}
          formIssues={formIssues}
          exerciseType={exerciseId}
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

      {/* Grid Overlay */}
      <div className="absolute inset-0 opacity-20">
        <svg className="w-full h-full">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Position Guide Frame - Always visible */}
      <PositionGuideFrame 
        landmarks={detectedLandmarks} 
        isOptimal={distanceStatus === 'optimal'}
        showFeetGuide={exerciseId !== 'squat'} // Hide feet guide for side-view squat
      />

      {/* Header Controls */}
      <div className="absolute top-0 left-0 right-0 p-6 z-10">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="bg-black/50 text-white hover:bg-black/70 rounded-full"
          >
            <X className="w-5 h-5" />
          </Button>
          
          <div className="flex items-center gap-3 bg-black/50 px-4 py-2 rounded-full">
            <div className="flex items-center gap-2">
              <Circle className="w-3 h-3 fill-red-500 text-red-500 animate-pulse" />
              <span className="text-white text-sm">AR Active</span>
            </div>
            {isAnalyzing && (
              <div className="flex items-center gap-2 ml-2 pl-2 border-l border-white/30">
                <ScanLine className="w-4 h-4 text-blue-400 animate-pulse" />
                <span className="text-blue-400 text-sm">Analyzing</span>
              </div>
            )}
          </div>

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

        {/* Distance Indicator */}
        {isRecording && (
          <div className="flex justify-center mt-4">
            <motion.div
              className={`px-4 py-2 rounded-full backdrop-blur-lg border-2 transition-all duration-300 ${
                distanceStatus === 'optimal'
                  ? 'bg-green-500/20 border-green-400'
                  : distanceStatus === 'too-close'
                  ? 'bg-red-500/20 border-red-400'
                  : 'bg-yellow-500/20 border-yellow-400'
              }`}
              animate={{
                scale: distanceStatus !== 'optimal' ? [1, 1.05, 1] : 1,
              }}
              transition={{ duration: 0.5, repeat: distanceStatus !== 'optimal' ? Infinity : 0 }}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    distanceStatus === 'optimal'
                      ? 'bg-green-400'
                      : distanceStatus === 'too-close'
                      ? 'bg-red-400'
                      : 'bg-yellow-400'
                  }`}
                />
                <span
                  className={`text-sm ${
                    distanceStatus === 'optimal'
                      ? 'text-green-400'
                      : distanceStatus === 'too-close'
                      ? 'text-red-400'
                      : 'text-yellow-400'
                  }`}
                >
                  {distanceStatus === 'optimal'
                    ? 'Distance: Optimal'
                    : distanceStatus === 'too-close'
                    ? 'Distance: Too Close'
                    : 'Distance: Too Far'}
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Countdown Overlay */}
      <AnimatePresence>
        {countdown > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            className="absolute inset-0 flex items-center justify-center z-20"
          >
            <div className="text-white text-9xl">{countdown}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Squat Positioning Reminder - TOP RIGHT corner, more discreet */}
      {exerciseId === 'squat' && countdown === 0 && isRecording && repsCompleted === 0 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="absolute top-24 right-6 z-20 max-w-xs"
        >
          <div className="bg-yellow-500/90 backdrop-blur-lg rounded-xl px-4 py-3 border-2 border-yellow-300">
            <div className="flex items-start gap-2">
              <div className="text-xl">⚠️</div>
              <div>
                <p className="text-black text-sm">Position Check</p>
                <p className="text-black text-xs">Turn LEFT side to camera</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* AR Stick Figure Overlay */}
      {isRecording && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-full max-w-md px-8">
            <StickFigure
              pose={config.poses[currentPoseIndex]}
              showCorrect={Object.keys(jointStatus).length === 0}
              jointStatus={jointStatus}
              highlightIncorrect={true}
              className="w-full h-auto drop-shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* Bottom Stats Panel */}
      {isRecording && (
        <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
          <div className="bg-black/70 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
            {/* Exercise Info */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-white mb-1">{config.name}</h3>
                <p className="text-gray-400 text-sm">
                  {exerciseId === 'plank' 
                    ? `${repsCompleted}s / ${targetReps}s`
                    : `${repsCompleted} / ${targetReps} reps`
                  }
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl text-white mb-1">
                  {exerciseId === 'plank' ? `${repsCompleted}s` : repsCompleted}
                </div>
                <p className="text-gray-400 text-sm">
                  {Math.round(progress)}%
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <Progress value={progress} className="h-2 mb-4" />

            {/* Form Quality Indicator - Shows actual form analysis, not progress */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Form Quality</span>
                <span className={`text-sm ${
                  sessionData.overallFormScore >= 70 ? 'text-green-400' : 
                  sessionData.overallFormScore >= 40 ? 'text-yellow-400' : 
                  'text-red-400'
                }`}>
                  {sessionData.overallFormScore}%
                </span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full transition-colors duration-500 ${
                    sessionData.overallFormScore >= 70 ? 'bg-green-500' : 
                    sessionData.overallFormScore >= 40 ? 'bg-yellow-500' : 
                    'bg-red-500'
                  }`}
                  animate={{ width: `${sessionData.overallFormScore}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>

            {/* Analysis Indicator */}
            {isAnalyzing && (
              <div className="mb-3">
                <div className="flex items-center gap-2 text-blue-400 text-sm">
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                  <span>Capturing posture snapshot...</span>
                </div>
              </div>
            )}

            {/* Audio Feedback */}
            <AnimatePresence>
              {currentFeedback && (
                <AudioFeedbackIndicator
                  message={currentFeedback.message}
                  type={currentFeedback.type}
                />
              )}
            </AnimatePresence>
            
            {/* DEBUG: Pose Recognition Scores */}
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="text-xs text-gray-400 mb-2">Pose Recognition (Debug)</div>
              {debugBestMatch && (
                <div className={`text-sm mb-2 ${debugBestMatch.score >= 50 ? 'text-green-400' : debugBestMatch.score >= 35 ? 'text-yellow-400' : 'text-red-400'}`}>
                  Best: {debugBestMatch.pose} ({debugBestMatch.score.toFixed(0)}%) {debugBestMatch.score >= 50 ? '✓' : ''}
                </div>
              )}
              
              {/* Deviation Counter & Form Issues Debug */}
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs text-gray-400">Deviation Count:</span>
                <span className={`text-xs ${deviationCount >= 3 ? 'text-red-400' : 'text-gray-500'}`}>
                  {deviationCount}/3 {deviationCount >= 3 ? '🔊' : ''}
                </span>
              </div>
              
              {/* Active Form Issues */}
              {Object.entries(formIssues).some(([_, v]) => v === true) && (
                <div className="mb-2">
                  <div className="text-xs text-yellow-400 mb-1">Active Issues:</div>
                  <div className="text-xs text-yellow-300 space-y-0.5">
                    {formIssues.trunkLeanExcessive && <div>• Trunk lean excessive 🚨</div>}
                    {formIssues.kneeAngleTooDeep && <div>• Knee too deep 🚨</div>}
                    {formIssues.kneesOverToes && <div>• Knees over toes 🚨</div>}
                    {formIssues.elbowAngleIncorrect && <div>• Elbow angle 🚨</div>}
                    {formIssues.lumbarFlexionExcessive && <div>• Lumbar flexion 🚨</div>}
                    {formIssues.kneeAngleTooShallow && <div>• Knee too shallow</div>}
                    {formIssues.trunkLeanInsufficient && <div>• Trunk lean low</div>}
                  </div>
                </div>
              )}
              
              <div className="space-y-1">
                {Object.entries(debugPoseScores).map(([pose, score]) => (
                  <div key={pose} className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">{pose}:</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${score >= 50 ? 'bg-green-500' : score >= 35 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.min(100, score)}%` }}
                        />
                      </div>
                      <span className={`w-10 text-right ${score >= 50 ? 'text-green-400' : score >= 35 ? 'text-yellow-400' : 'text-gray-500'}`}>
                        {score.toFixed(0)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {debugLastError && (
                <div className="text-xs text-red-400 mt-2">Error: {debugLastError}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Alignment Guides */}
      {isRecording && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Center vertical line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-purple-500/30" />
          {/* Horizontal thirds */}
          <div className="absolute left-0 right-0 top-1/3 h-0.5 bg-purple-500/30" />
          <div className="absolute left-0 right-0 top-2/3 h-0.5 bg-purple-500/30" />
        </div>
      )}
    </div>
  );
}
