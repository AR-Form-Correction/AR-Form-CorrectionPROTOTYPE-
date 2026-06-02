import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { ChevronLeft, Play } from 'lucide-react';

interface RepSelectionViewProps {
  exerciseId: string;
  onStart: (targetReps: number) => void;
  onBack: () => void;
}

const exerciseConfig: Record<string, {
  name: string;
  defaultReps: number;
  repOptions: number[];
  unit: string;
}> = {
  pushup: {
    name: 'Push-Up',
    defaultReps: 10,
    repOptions: [5, 10, 15, 20, 25],
    unit: 'reps',
  },
  plank: {
    name: 'Plank Hold',
    defaultReps: 30,
    repOptions: [15, 30, 45, 60, 90],
    unit: 'seconds',
  },
  squat: {
    name: 'Squat',
    defaultReps: 10,
    repOptions: [5, 10, 15, 20, 25],
    unit: 'reps',
  },
  situp: {
    name: 'Sit-Up',
    defaultReps: 10,
    repOptions: [5, 10, 15, 20, 25],
    unit: 'reps',
  },
};

export function RepSelectionView({ exerciseId, onStart, onBack }: RepSelectionViewProps) {
  const config = exerciseConfig[exerciseId];
  const [selectedReps, setSelectedReps] = useState(config.defaultReps);

  if (!config) {
    console.error(`Unknown exercise ID: ${exerciseId}`);
    onBack();
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl"
      >
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={onBack}
          className="text-white/70 hover:text-white hover:bg-white/10 mb-6"
        >
          <ChevronLeft className="w-5 h-5 mr-2" />
          Back
        </Button>

        {/* Main Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-10">
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <h1 className="text-4xl md:text-5xl text-white mb-3">
                Set Your Goal
              </h1>
              <p className="text-white/70 text-lg">
                How many {config.unit} for <span className="text-purple-400">{config.name}</span>?
              </p>
            </motion.div>
          </div>

          {/* Rep Selection Grid */}
          <div className="mb-10">
            <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
              {config.repOptions.map((repCount, index) => (
                <motion.button
                  key={repCount}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  onClick={() => setSelectedReps(repCount)}
                  className={`relative group overflow-hidden rounded-2xl border-2 transition-all duration-300 ${
                    selectedReps === repCount
                      ? 'border-purple-500 bg-purple-500/20 scale-105'
                      : 'border-white/20 bg-white/5 hover:border-purple-400/50 hover:bg-white/10'
                  }`}
                >
                  {/* Selection Indicator */}
                  {selectedReps === repCount && (
                    <motion.div
                      layoutId="selectedIndicator"
                      className="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-pink-500/30"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}

                  {/* Content */}
                  <div className="relative py-8 px-4">
                    <div className="text-3xl md:text-4xl text-white mb-1">
                      {repCount}
                    </div>
                    <div className="text-white/60 text-xs md:text-sm">
                      {config.unit}
                    </div>
                  </div>

                  {/* Hover Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-pink-500/0 group-hover:from-purple-500/10 group-hover:to-pink-500/10 transition-all duration-300" />
                </motion.button>
              ))}
            </div>
          </div>

          {/* Selected Summary */}
          <motion.div
            key={selectedReps}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-purple-500/20 border border-purple-500/30">
              <span className="text-white/70">Target:</span>
              <span className="text-2xl text-white">
                {selectedReps} {config.unit}
              </span>
            </div>
          </motion.div>

          {/* Start Button */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              onClick={() => onStart(selectedReps)}
              className="w-full py-6 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl shadow-lg shadow-purple-500/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/40"
            >
              <Play className="w-6 h-6 mr-2" />
              Start Workout
            </Button>
          </motion.div>

          {/* Info Text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center text-white/50 text-sm mt-6"
          >
            Your workout will begin after a 3-second countdown
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}
