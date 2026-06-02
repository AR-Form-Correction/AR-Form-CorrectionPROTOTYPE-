import { Card } from './ui/card';
import { Button } from './ui/button';
import { Activity, ArrowRight } from 'lucide-react';
import { StickFigure } from './StickFigure';

interface Exercise {
  id: string;
  name: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  iconType: 'emoji' | 'stickfigure';
  icon?: string;
  pose?: 'pushup-up' | 'plank' | 'squat-up' | 'situp-up';
}

const exercises: Exercise[] = [
  {
    id: 'pushup',
    name: 'Push-Up',
    description: 'Build upper body strength with proper form guidance',
    difficulty: 'Beginner',
    iconType: 'emoji',
    icon: '💪',
  },
  {
    id: 'plank',
    name: 'Plank',
    description: 'Core stability exercise with posture correction',
    difficulty: 'Beginner',
    iconType: 'emoji',
    icon: '🧘',
  },
  {
    id: 'squat',
    name: 'Squat',
    description: 'Lower body strength with knee and hip alignment',
    difficulty: 'Intermediate',
    iconType: 'emoji',
    icon: '🦵',
  },
  {
    id: 'situp',
    name: 'Sit-Up',
    description: 'Core strengthening with spinal alignment feedback',
    difficulty: 'Beginner',
    iconType: 'emoji',
    icon: '🏃',
  },
];

interface ExerciseSelectionProps {
  onSelectExercise: (exerciseId: string) => void;
}

export function ExerciseSelection({ onSelectExercise }: ExerciseSelectionProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl mb-4">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h1 className="mb-2">FormFit AR</h1>
          <p className="text-gray-600">
            Real-time exercise form correction with AR guidance
          </p>
        </div>

        {/* Exercise Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {exercises.map((exercise) => (
            <Card
              key={exercise.id}
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-purple-200"
              onClick={() => onSelectExercise(exercise.id)}
            >
              <div className="flex items-start justify-between mb-4">
                {exercise.iconType === 'emoji' ? (
                  <div className="text-4xl">{exercise.icon}</div>
                ) : (
                  <StickFigure
                    className="w-10 h-10"
                    pose={exercise.pose as 'pushup-up' | 'plank' | 'squat-up' | 'situp-up'}
                  />
                )}
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                  {exercise.difficulty}
                </span>
              </div>
              <h3 className="mb-2">{exercise.name}</h3>
              <p className="text-gray-600 text-sm mb-4">{exercise.description}</p>
              <Button className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600">
                Start Exercise
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Card>
          ))}
        </div>

        {/* Info Section */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="mb-3">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span>1</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  Calibrate your body position and landmarks
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span>2</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  Watch the walkthrough to learn proper form
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span>3</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  Follow AR overlay with real-time feedback
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span>4</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  Review your performance and improve
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}