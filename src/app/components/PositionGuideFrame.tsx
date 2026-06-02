import { motion } from 'motion/react';
import { type PoseLandmarks } from '../hooks/useMediaPipePose';

interface PositionGuideFrameProps {
  landmarks: PoseLandmarks | null;
  isOptimal: boolean;
  showFeetGuide?: boolean;
}

export function PositionGuideFrame({ landmarks, isOptimal, showFeetGuide = true }: PositionGuideFrameProps) {
  // Calculate if user's body fits within the guide frame
  const shoulderInFrame = landmarks?.leftShoulder && landmarks?.rightShoulder;
  const hipsInFrame = landmarks?.leftHip && landmarks?.rightHip;
  const feetInFrame = landmarks?.leftAnkle && landmarks?.rightAnkle;
  
  const frameColor = isOptimal ? 'border-green-500' : 'border-red-500';
  const fillColor = isOptimal ? 'bg-green-500/10' : 'bg-red-500/10';

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
      {/* Main Guide Frame */}
      <motion.div
        className={`relative border-4 rounded-3xl transition-all duration-500 ${frameColor} ${fillColor}`}
        style={{
          width: '85%',
          maxWidth: '400px',
          aspectRatio: '9/16',
        }}
        animate={{
          boxShadow: isOptimal 
            ? ['0 0 20px rgba(34, 197, 94, 0.3)', '0 0 40px rgba(34, 197, 94, 0.5)', '0 0 20px rgba(34, 197, 94, 0.3)']
            : ['0 0 20px rgba(239, 68, 68, 0.3)', '0 0 40px rgba(239, 68, 68, 0.5)', '0 0 20px rgba(239, 68, 68, 0.3)'],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {/* Corner Markers */}
        <div className="absolute -top-1 -left-1 w-8 h-8 border-l-4 border-t-4 border-white rounded-tl-lg" />
        <div className="absolute -top-1 -right-1 w-8 h-8 border-r-4 border-t-4 border-white rounded-tr-lg" />
        <div className="absolute -bottom-1 -left-1 w-8 h-8 border-l-4 border-b-4 border-white rounded-bl-lg" />
        <div className="absolute -bottom-1 -right-1 w-8 h-8 border-r-4 border-b-4 border-white rounded-br-lg" />

        {/* Human Silhouette Guide - Head Zone */}
        <div className="absolute top-[8%] left-1/2 -translate-x-1/2 w-12 h-12 rounded-full border-2 border-white/50 border-dashed" />
        
        {/* Shoulder Zone */}
        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[70%] h-1 bg-white/50" />
        {shoulderInFrame && (
          <motion.div
            className="absolute top-[20%] left-1/2 -translate-x-1/2"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            <div className="w-4 h-4 rounded-full bg-green-400 border-2 border-white" />
          </motion.div>
        )}

        {/* Torso Zone */}
        <div className="absolute top-[20%] left-[20%] w-2 h-[40%] bg-white/30 rounded-full" />
        <div className="absolute top-[20%] right-[20%] w-2 h-[40%] bg-white/30 rounded-full" />

        {/* Hip Zone */}
        <div className="absolute top-[60%] left-1/2 -translate-x-1/2 w-[60%] h-1 bg-white/50" />
        {hipsInFrame && (
          <motion.div
            className="absolute top-[60%] left-1/2 -translate-x-1/2"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            <div className="w-4 h-4 rounded-full bg-green-400 border-2 border-white" />
          </motion.div>
        )}

        {/* Legs Zone */}
        <div className="absolute top-[60%] left-[35%] w-2 h-[32%] bg-white/30 rounded-full" />
        <div className="absolute top-[60%] right-[35%] w-2 h-[32%] bg-white/30 rounded-full" />

        {/* Feet Zone */}
        {showFeetGuide && (
          <>
            <div className="absolute bottom-[6%] left-[30%] w-8 h-3 rounded-full border-2 border-white/50 border-dashed" />
            <div className="absolute bottom-[6%] right-[30%] w-8 h-3 rounded-full border-2 border-white/50 border-dashed" />
            {feetInFrame && (
              <motion.div
                className="absolute bottom-[6%] left-1/2 -translate-x-1/2"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                <div className="w-4 h-4 rounded-full bg-green-400 border-2 border-white" />
              </motion.div>
            )}
          </>
        )}

        {/* Center Alignment Line */}
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/20 -translate-x-1/2" />

        {/* Distance Guidelines - Top and Bottom */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <div className={`px-3 py-1.5 rounded-full text-xs backdrop-blur-lg ${
            isOptimal ? 'bg-green-500/90 text-white' : 'bg-red-500/90 text-white'
          }`}>
            {isOptimal ? '✓ Fit Full Body in Frame' : '⚠ Adjust Position'}
          </div>
        </div>

        {showFeetGuide && (
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <div className={`px-3 py-1.5 rounded-full text-xs backdrop-blur-lg ${
              feetInFrame ? 'bg-green-500/90 text-white' : 'bg-yellow-500/90 text-white'
            }`}>
              {feetInFrame ? '✓ Feet Visible' : '⚠ Show Full Legs'}
            </div>
          </div>
        )}
      </motion.div>

      {/* Side Distance Indicators */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2">
        <motion.div
          className="flex flex-col items-center gap-2"
          animate={{
            opacity: isOptimal ? 0.3 : 1,
          }}
        >
          <div className="w-1 h-16 bg-white/50 rounded-full" />
          <div className="w-1 h-16 bg-white/50 rounded-full" />
          <div className="w-1 h-16 bg-white/50 rounded-full" />
        </motion.div>
      </div>

      <div className="absolute right-4 top-1/2 -translate-y-1/2">
        <motion.div
          className="flex flex-col items-center gap-2"
          animate={{
            opacity: isOptimal ? 0.3 : 1,
          }}
        >
          <div className="w-1 h-16 bg-white/50 rounded-full" />
          <div className="w-1 h-16 bg-white/50 rounded-full" />
          <div className="w-1 h-16 bg-white/50 rounded-full" />
        </motion.div>
      </div>
    </div>
  );
}
