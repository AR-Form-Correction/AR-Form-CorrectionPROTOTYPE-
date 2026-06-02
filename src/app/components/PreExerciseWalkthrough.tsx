import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { StickFigure } from './StickFigure';
import { ArrowLeft, Play, Info } from 'lucide-react';
import { motion } from 'motion/react';
import { Progress } from './ui/progress';

interface PreExerciseWalkthroughProps {
  exerciseId: string;
  onStart: () => void;
  onBack: () => void;
}

const exerciseDetails: Record<string, {
  name: string;
  poses: Array<'standing' | 'pushup-up' | 'pushup-down' | 'plank' | 'squat-up' | 'squat-down' | 'situp-up' | 'situp-down'>;
  instructions: string[];
  keyPoints: string[];
}> = {
  pushup: {
    name: 'Push-Up',
    poses: ['pushup-up', 'pushup-down', 'pushup-up'],
    instructions: [
      'Start in plank position with hands shoulder-width apart',
      'Lower your body until chest nearly touches the floor',
      'Keep your core tight and back straight',
      'Push back up to starting position',
    ],
    keyPoints: [
      'Hands directly under shoulders',
      'Straight line from head to heels',
      'Elbows at 45-degree angle',
      'Controlled breathing',
    ],
  },
  plank: {
    name: 'Plank',
    poses: ['plank'],
    instructions: [
      'Start in forearm plank position',
      'Keep your body in a straight line',
      'Engage your core muscles',
      'Hold the position steadily',
    ],
    keyPoints: [
      'Elbows under shoulders',
      'Neutral spine alignment',
      'Engage glutes and core',
      'Breathe steadily',
    ],
  },
  squat: {
    name: 'Squat',
    poses: ['squat-up', 'squat-down', 'squat-up'],
    instructions: [
      'Stand with feet shoulder-width apart',
      'Lower down as if sitting in a chair',
      'Keep knees behind toes',
      '⚠️ NOTE: During live exercise, turn your LEFT side to face the camera',
      'Return to standing position',
    ],
    keyPoints: [
      'Chest up, shoulders back',
      'Knees track over toes',
      'Weight in heels',
      'Full depth squat',
    ],
  },
  situp: {
    name: 'Sit-Up',
    poses: ['situp-down', 'situp-up', 'situp-down'],
    instructions: [
      'Lie flat on your back with knees bent',
      'Engage your core and lift torso',
      'Bring chest toward knees',
      'Lower back down with control',
    ],
    keyPoints: [
      'Keep lower back pressed down',
      'Use core, not neck',
      'Controlled movement',
      'Steady breathing',
    ],
  },
};

export function PreExerciseWalkthrough({ exerciseId, onStart, onBack }: PreExerciseWalkthroughProps) {
  const [currentPoseIndex, setCurrentPoseIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const exercise = exerciseDetails[exerciseId];
  const poses = exercise.poses;

  useEffect(() => {
    if (!isAnimating) return;

    const interval = setInterval(() => {
      setCurrentPoseIndex((prev) => {
        if (prev >= poses.length - 1) {
          return 0;
        }
        return prev + 1;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isAnimating, poses.length]);

  const handleStartAnimation = () => {
    setIsAnimating(true);
    setCurrentPoseIndex(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={onBack}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2>{exercise.name} Walkthrough</h2>
            <p className="text-gray-600 text-sm">Learn the proper form before starting</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Visual Demonstration */}
          <div className="bg-white rounded-xl p-8 shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h3>Form Demonstration</h3>
              {!isAnimating && (
                <Button
                  onClick={handleStartAnimation}
                  size="sm"
                  className="bg-purple-500 hover:bg-purple-600"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Play
                </Button>
              )}
            </div>
            
            <div className="bg-gray-50 rounded-lg p-8 mb-4 flex items-center justify-center min-h-[300px]">
              <StickFigure
                pose={poses[currentPoseIndex]}
                showCorrect={true}
                className="w-full h-full max-w-sm"
              />
            </div>

            {isAnimating && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Animation Progress</span>
                  <span className="text-purple-600">
                    Step {currentPoseIndex + 1} of {poses.length}
                  </span>
                </div>
                <Progress value={((currentPoseIndex + 1) / poses.length) * 100} />
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="space-y-6">
            {/* Step by Step */}
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h3 className="mb-4">Step-by-Step Instructions</h3>
              <div className="space-y-3">
                {exercise.instructions.map((instruction, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center flex-shrink-0 text-sm">
                      {index + 1}
                    </div>
                    <p className="text-sm text-gray-700">{instruction}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Points */}
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
              <div className="flex items-center gap-2 mb-4">
                <Info className="w-5 h-5 text-blue-600" />
                <h3 className="text-blue-900">Key Form Points</h3>
              </div>
              <ul className="space-y-2">
                {exercise.keyPoints.map((point, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-blue-900">
                    <span className="text-blue-400">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Start Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                onClick={onStart}
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 py-6"
              >
                <Play className="w-5 h-5 mr-2" />
                Start Exercise with AR Guidance
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}