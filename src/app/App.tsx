import { useState } from 'react';
import { HomePage } from './components/HomePage';
import { ExerciseSelection } from './components/ExerciseSelection';
import { CalibrationView } from './components/CalibrationView';
import { PreExerciseWalkthrough } from './components/PreExerciseWalkthrough';
import { RepSelectionView } from './components/RepSelectionView';
import { LiveExerciseView, type ExerciseSessionData } from './components/LiveExerciseView';
import { PostExerciseAnalysis } from './components/PostExerciseAnalysis';

type AppState = 'home' | 'selection' | 'calibration' | 'repSelection' | 'walkthrough' | 'live' | 'analysis';
type ExerciseType = 'pushup' | 'plank' | 'squat' | 'situp';

export default function App() {
  const [currentState, setCurrentState] = useState<AppState>('home');
  const [selectedExercise, setSelectedExercise] = useState<ExerciseType>('pushup');
  const [targetReps, setTargetReps] = useState<number>(10);
  const [exerciseSessionData, setExerciseSessionData] = useState<ExerciseSessionData | null>(null);

  const handleGetStarted = () => {
    setCurrentState('selection');
  };

  const handleSelectExercise = (exerciseId: string) => {
    setSelectedExercise(exerciseId as ExerciseType);
    setCurrentState('calibration');
  };

  const handleCalibrationComplete = () => {
    setCurrentState('repSelection');
  };

  const handleRepSelectionStart = (reps: number) => {
    setTargetReps(reps);
    setCurrentState('walkthrough');
  };

  const handleStartExercise = () => {
    setCurrentState('live');
  };

  const handleCompleteExercise = (sessionData: ExerciseSessionData) => {
    setExerciseSessionData(sessionData);
    setCurrentState('analysis');
  };

  const handleRetryExercise = () => {
    setExerciseSessionData(null);
    setCurrentState('calibration');
  };

  const handleBackToSelection = () => {
    setCurrentState('selection');
    setSelectedExercise('pushup');
    setExerciseSessionData(null);
  };

  return (
    <>
      {currentState === 'home' && (
        <HomePage onGetStarted={handleGetStarted} />
      )}

      {currentState === 'selection' && (
        <ExerciseSelection onSelectExercise={handleSelectExercise} />
      )}

      {currentState === 'calibration' && (
        <CalibrationView
          onComplete={handleCalibrationComplete}
          onBack={handleBackToSelection}
        />
      )}

      {currentState === 'repSelection' && (
        <RepSelectionView
          exerciseId={selectedExercise}
          onStart={handleRepSelectionStart}
          onBack={handleBackToSelection}
        />
      )}

      {currentState === 'walkthrough' && (
        <PreExerciseWalkthrough
          exerciseId={selectedExercise}
          onStart={handleStartExercise}
          onBack={handleBackToSelection}
        />
      )}

      {currentState === 'live' && (
        <LiveExerciseView
          exerciseId={selectedExercise}
          targetReps={targetReps}
          onComplete={handleCompleteExercise}
          onCancel={handleBackToSelection}
        />
      )}

      {currentState === 'analysis' && exerciseSessionData && (
        <PostExerciseAnalysis
          exerciseId={selectedExercise}
          sessionData={exerciseSessionData}
          onRetry={handleRetryExercise}
          onHome={handleBackToSelection}
        />
      )}
    </>
  );
}