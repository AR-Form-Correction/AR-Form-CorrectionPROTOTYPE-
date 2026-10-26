import { useEffect, useRef, useState } from 'react';
import { PoseLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';

export interface PoseLandmarks {
  // Normalized coordinates (0-1)
  nose: { x: number; y: number; z: number };
  leftEye: { x: number; y: number; z: number };
  rightEye: { x: number; y: number; z: number };
  leftEar: { x: number; y: number; z: number };
  rightEar: { x: number; y: number; z: number };
  leftShoulder: { x: number; y: number; z: number };
  rightShoulder: { x: number; y: number; z: number };
  leftElbow: { x: number; y: number; z: number };
  rightElbow: { x: number; y: number; z: number };
  leftWrist: { x: number; y: number; z: number };
  rightWrist: { x: number; y: number; z: number };
  leftHip: { x: number; y: number; z: number };
  rightHip: { x: number; y: number; z: number };
  leftKnee: { x: number; y: number; z: number };
  rightKnee: { x: number; y: number; z: number };
  leftAnkle: { x: number; y: number; z: number };
  rightAnkle: { x: number; y: number; z: number };
}

interface UseMediaPipePoseOptions {
  onPoseDetected?: (landmarks: PoseLandmarks) => void;
  enableDrawing?: boolean;
}

export function useMediaPipePose(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  options: UseMediaPipePoseOptions = {}
) {
  const [isReady, setIsReady] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);

  // Initialize MediaPipe Pose
  useEffect(() => {
    let mounted = true;

    const initializePose = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'GPU', // Use GPU for optimal performance
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        if (mounted) {
          poseLandmarkerRef.current = poseLandmarker;
          setIsReady(true);
        }
      } catch (err) {
        console.error('Failed to initialize MediaPipe Pose:', err);
        if (mounted) {
          setError('Failed to load pose detection. Please refresh the page.');
        }
      }
    };

    initializePose();

    return () => {
      mounted = false;
      if (poseLandmarkerRef.current) {
        poseLandmarkerRef.current.close();
      }
    };
  }, []);

  // Start detection loop
  const startDetection = () => {
    if (!isReady) {
      console.warn('MediaPipe not initialized yet');
      return;
    }
    
    if (!poseLandmarkerRef.current) {
      console.warn('PoseLandmarker not available');
      return;
    }

    if (!videoRef.current) {
      console.warn('Video element not available');
      return;
    }

    if (!canvasRef.current) {
      console.warn('Canvas element not available');
      return;
    }

    // Check if video has dimensions and is ready to play
    const video = videoRef.current;
    if (!video.videoWidth || !video.videoHeight || video.readyState < 2) {
      console.log('Video not ready yet, retrying in 200ms...');
      // Retry after a short delay
      setTimeout(() => startDetection(), 200);
      return;
    }

    console.log('Starting MediaPipe detection - video ready:', {
      width: video.videoWidth,
      height: video.videoHeight,
      readyState: video.readyState
    });

    setIsDetecting(true);

    const detectPose = async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const poseLandmarker = poseLandmarkerRef.current;

      if (!video || !canvas || !poseLandmarker) {
        return;
      }

      // Double check video is still ready
      if (video.readyState < 2 || !video.videoWidth || !video.videoHeight) {
        animationFrameRef.current = requestAnimationFrame(detectPose);
        return;
      }

      // Set canvas size to match video if not already set
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      try {
        const startTimeMs = performance.now();
        
        // Skip if same frame as last time
        if (video.currentTime === lastVideoTimeRef.current) {
          animationFrameRef.current = requestAnimationFrame(detectPose);
          return;
        }
        lastVideoTimeRef.current = video.currentTime;
        
        const results = poseLandmarker.detectForVideo(video, startTimeMs);

        // Clear canvas
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Draw landmarks if enabled
          if (options.enableDrawing && results.landmarks && results.landmarks.length > 0) {
            const drawingUtils = new DrawingUtils(ctx);
            
            for (const landmark of results.landmarks) {
              drawingUtils.drawLandmarks(landmark, {
                radius: 4,
                color: '#00FF00',
                fillColor: '#00FF00',
              });
              drawingUtils.drawConnectors(
                landmark,
                PoseLandmarker.POSE_CONNECTIONS,
                { color: '#00FF00', lineWidth: 2 }
              );
            }
          }
        }

        // Extract pose landmarks
        if (results.landmarks && results.landmarks.length > 0) {
          const landmarks = results.landmarks[0];
          
          // Map MediaPipe landmarks to our format
          // MediaPipe landmark indices: https://developers.google.com/mediapipe/solutions/vision/pose_landmarker
          const poseLandmarks: PoseLandmarks = {
            nose: landmarks[0],
            leftEye: landmarks[1],
            rightEye: landmarks[2],
            leftEar: landmarks[3],
            rightEar: landmarks[4],
            leftShoulder: landmarks[11],
            rightShoulder: landmarks[12],
            leftElbow: landmarks[13],
            rightElbow: landmarks[14],
            leftWrist: landmarks[15],
            rightWrist: landmarks[16],
            leftHip: landmarks[23],
            rightHip: landmarks[24],
            leftKnee: landmarks[25],
            rightKnee: landmarks[26],
            leftAnkle: landmarks[27],
            rightAnkle: landmarks[28],
          };

          options.onPoseDetected?.(poseLandmarks);
        }
      } catch (err) {
        console.error('Pose detection error:', err);
      }

      if (isDetecting) {
        animationFrameRef.current = requestAnimationFrame(detectPose);
      }
    };

    detectPose();
  };

  const stopDetection = () => {
    setIsDetecting(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  return {
    isReady,
    isDetecting,
    error,
    startDetection,
    stopDetection,
  };
}