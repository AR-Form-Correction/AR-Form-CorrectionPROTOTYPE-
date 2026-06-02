import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { StickFigure } from './StickFigure';
import { ArrowLeft, TrendingUp, AlertTriangle, CheckCircle2, RotateCcw } from 'lucide-react';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import type { ExerciseSessionData } from './LiveExerciseView';

interface PostExerciseAnalysisProps {
  exerciseId: string;
  sessionData: ExerciseSessionData | null;
  onRetry: () => void;
  onHome: () => void;
}

// Helper function to convert issue key to readable text
function issueKeyToMessage(key: string): string {
  const messages: Record<string, string> = {
    kneeAngleTooShallow: 'Squat depth was insufficient - aim for 90° knee flexion',
    kneeAngleTooDeep: 'Squat depth exceeded safe range - risk of injury above 135°',
    kneesOverToes: 'Knees extended past toes - push hips back more',
    trunkLeanExcessive: 'Forward trunk lean exceeded 45° - keep chest more upright',
    trunkLeanInsufficient: 'Insufficient trunk lean (less than 30°) - lean forward slightly',
    elbowAngleIncorrect: 'Elbow angle outside optimal 80-100° range at bottom position',
    bodyNotStraight: 'Body alignment deviated from straight line (170-180°)',
    elbowsTooWide: 'Elbows flared out too wide - keep closer to body',
    hipsSagging: 'Hips sagged below optimal alignment - engage core more',
    hipsRaised: 'Hips raised above optimal alignment - lower slightly',
    hipAbductionTooWide: 'Foot stance too wide - bring feet closer together',
    lumbarFlexionInsufficient: 'Insufficient spine curl (less than 30°) - curl more',
    lumbarFlexionExcessive: 'Excessive spine flexion (over 45°) - reduce curl for safety',
    hipFlexionIncorrect: 'Hip angle outside optimal 70-90° range',
    shouldersNotLevel: 'Shoulders were not level - maintain even shoulder height',
  };
  return messages[key] || key;
}

export function PostExerciseAnalysis({ exerciseId, sessionData, onRetry, onHome }: PostExerciseAnalysisProps) {
  const [selectedComparison, setSelectedComparison] = useState<'form' | 'metrics'>('metrics');
  
  // If no session data, show loading or error
  if (!sessionData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-6 flex items-center justify-center">
        <Card className="p-8">
          <p className="text-gray-600">No session data available</p>
          <Button onClick={onHome} className="mt-4">Go Back</Button>
        </Card>
      </div>
    );
  }
  
  // Generate feedback based on actual form issues detected
  const feedback: Array<{ type: 'success' | 'warning' | 'error'; message: string }> = [];
  
  // Sort issues by frequency
  const sortedIssues = Object.entries(sessionData.formIssueFrequency)
    .sort(([, a], [, b]) => b - a);
  
  // Add warnings for frequent issues
  sortedIssues.forEach(([issueKey, count]) => {
    const percentage = (count / sessionData.totalAnalysisCount) * 100;
    if (percentage > 30) {
      // Issue occurred in more than 30% of analyses
      feedback.push({
        type: 'error',
        message: `${issueKeyToMessage(issueKey)} (detected ${Math.round(percentage)}% of the time)`
      });
    } else if (percentage > 10) {
      // Issue occurred in 10-30% of analyses
      feedback.push({
        type: 'warning',
        message: `${issueKeyToMessage(issueKey)} (detected ${Math.round(percentage)}% of the time)`
      });
    }
  });
  
  // Add distance feedback if there were issues
  if (sessionData.distanceIssuesCount > 0) {
    const distancePercentage = (sessionData.distanceIssuesCount / sessionData.totalAnalysisCount) * 100;
    if (distancePercentage > 20) {
      feedback.push({
        type: 'warning',
        message: `Distance from camera was suboptimal ${Math.round(distancePercentage)}% of the time - try to maintain optimal distance`
      });
    }
  }
  
  // Add success messages if form was good
  if (sessionData.overallFormScore >= 85) {
    feedback.unshift({
      type: 'success',
      message: 'Excellent form maintained throughout most of the exercise!'
    });
  } else if (sessionData.overallFormScore >= 70) {
    feedback.unshift({
      type: 'success',
      message: 'Good overall form with some areas for improvement'
    });
  }
  
  // If very few or no issues, add encouragement
  if (feedback.length === 0 || (feedback.length === 1 && feedback[0].type === 'success')) {
    feedback.push({
      type: 'success',
      message: 'Great job! Your form was excellent throughout the exercise'
    });
  }
  
  // Generate metrics based on actual data
  const metrics: Array<{ label: string; value: number; actualValue?: string; status: 'good' | 'needs-improvement' | 'poor' }> = [];
  
  // Exercise-specific metrics based on angles
  if (exerciseId === 'squat') {
    if (sessionData.averageAngles.kneeAngle) {
      const kneeAngle = sessionData.averageAngles.kneeAngle;
      const kneeStatus = (kneeAngle >= 90 && kneeAngle <= 110) ? 'good' : 
                        (kneeAngle >= 80 && kneeAngle <= 120) ? 'needs-improvement' : 'poor';
      const kneeScore = kneeStatus === 'good' ? 95 : kneeStatus === 'needs-improvement' ? 75 : 55;
      metrics.push({
        label: `Knee Flexion Angle (Avg: ${kneeAngle}°)`,
        value: kneeScore,
        actualValue: `${kneeAngle}°`,
        status: kneeStatus
      });
    }
    
    if (sessionData.averageAngles.trunkLean) {
      const trunkLean = sessionData.averageAngles.trunkLean;
      const trunkStatus = (trunkLean >= 30 && trunkLean <= 45) ? 'good' :
                         (trunkLean >= 25 && trunkLean <= 50) ? 'needs-improvement' : 'poor';
      const trunkScore = trunkStatus === 'good' ? 92 : trunkStatus === 'needs-improvement' ? 72 : 52;
      metrics.push({
        label: `Trunk Forward Lean (Avg: ${trunkLean}°)`,
        value: trunkScore,
        actualValue: `${trunkLean}°`,
        status: trunkStatus
      });
    }
  } else if (exerciseId === 'pushup') {
    if (sessionData.averageAngles.elbowAngle) {
      const elbowAngle = sessionData.averageAngles.elbowAngle;
      const elbowStatus = (elbowAngle >= 80 && elbowAngle <= 100) ? 'good' :
                         (elbowAngle >= 70 && elbowAngle <= 110) ? 'needs-improvement' : 'poor';
      const elbowScore = elbowStatus === 'good' ? 95 : elbowStatus === 'needs-improvement' ? 75 : 55;
      metrics.push({
        label: `Elbow Angle (Avg: ${elbowAngle}°)`,
        value: elbowScore,
        actualValue: `${elbowAngle}°`,
        status: elbowStatus
      });
    }
    
    if (sessionData.averageAngles.bodyAlignment) {
      const bodyAlign = sessionData.averageAngles.bodyAlignment;
      const alignStatus = (bodyAlign >= 170 && bodyAlign <= 180) ? 'good' :
                         (bodyAlign >= 165 && bodyAlign <= 185) ? 'needs-improvement' : 'poor';
      const alignScore = alignStatus === 'good' ? 93 : alignStatus === 'needs-improvement' ? 73 : 53;
      metrics.push({
        label: `Body Alignment (Avg: ${bodyAlign}°)`,
        value: alignScore,
        actualValue: `${bodyAlign}°`,
        status: alignStatus
      });
    }
  } else if (exerciseId === 'plank') {
    if (sessionData.averageAngles.bodyAlignment) {
      const bodyAlign = sessionData.averageAngles.bodyAlignment;
      const alignStatus = (bodyAlign >= 170 && bodyAlign <= 190) ? 'good' :
                         (bodyAlign >= 165 && bodyAlign <= 195) ? 'needs-improvement' : 'poor';
      const alignScore = alignStatus === 'good' ? 94 : alignStatus === 'needs-improvement' ? 74 : 54;
      metrics.push({
        label: `Body Alignment (Avg: ${bodyAlign}°)`,
        value: alignScore,
        actualValue: `${bodyAlign}°`,
        status: alignStatus
      });
    }
  } else if (exerciseId === 'situp') {
    if (sessionData.averageAngles.hipAngle) {
      const hipAngle = sessionData.averageAngles.hipAngle;
      const hipStatus = (hipAngle >= 70 && hipAngle <= 90) ? 'good' :
                       (hipAngle >= 65 && hipAngle <= 95) ? 'needs-improvement' : 'poor';
      const hipScore = hipStatus === 'good' ? 93 : hipStatus === 'needs-improvement' ? 73 : 53;
      metrics.push({
        label: `Hip Flexion Angle (Avg: ${hipAngle}°)`,
        value: hipScore,
        actualValue: `${hipAngle}°`,
        status: hipStatus
      });
    }
    
    if (sessionData.averageAngles.trunkLean) {
      const trunkLean = sessionData.averageAngles.trunkLean;
      const trunkStatus = (trunkLean >= 30 && trunkLean <= 45) ? 'good' :
                         (trunkLean >= 25 && trunkLean <= 50) ? 'needs-improvement' : 'poor';
      const trunkScore = trunkStatus === 'good' ? 91 : trunkStatus === 'needs-improvement' ? 71 : 51;
      metrics.push({
        label: `Lumbar Flexion (Avg: ${trunkLean}°)`,
        value: trunkScore,
        actualValue: `${trunkLean}°`,
        status: trunkStatus
      });
    }
  }
  
  // Add overall form score metric
  metrics.push({
    label: 'Overall Form Consistency',
    value: sessionData.overallFormScore,
    status: sessionData.overallFormScore >= 85 ? 'good' : 
            sessionData.overallFormScore >= 70 ? 'needs-improvement' : 'poor'
  });
  
  // Add distance consistency metric
  const distanceScore = Math.round((1 - (sessionData.distanceIssuesCount / sessionData.totalAnalysisCount)) * 100);
  metrics.push({
    label: 'Distance Consistency',
    value: distanceScore,
    status: distanceScore >= 85 ? 'good' : distanceScore >= 70 ? 'needs-improvement' : 'poor'
  });
  
  const exerciseNames: Record<string, string> = {
    pushup: 'Push-Up',
    plank: 'Plank',
    squat: 'Squat',
    situp: 'Sit-Up'
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Good';
    return 'Needs Practice';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={onHome}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2>{exerciseNames[exerciseId]} - Performance Analysis</h2>
            <p className="text-gray-600 text-sm">Review your form and get personalized feedback</p>
          </div>
        </div>

        {/* Overall Score Card */}
        <Card className="p-8 mb-8 bg-gradient-to-br from-purple-500 to-blue-500 text-white border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 mb-2">Overall Form Score</p>
              <div className="flex items-baseline gap-3">
                <span className="text-6xl">{sessionData.overallFormScore}</span>
                <span className="text-2xl text-purple-100">/ 100</span>
              </div>
              <p className="mt-2 text-purple-100">{getScoreLabel(sessionData.overallFormScore)}</p>
            </div>
            <div className="text-right">
              <TrendingUp className="w-16 h-16 text-white/50 mb-2" />
              <p className="text-sm text-purple-100">Keep practicing to improve!</p>
            </div>
          </div>
        </Card>

        {/* Comparison Toggle */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={selectedComparison === 'form' ? 'default' : 'outline'}
            onClick={() => setSelectedComparison('form')}
            className={selectedComparison === 'form' ? 'bg-purple-500 hover:bg-purple-600' : ''}
          >
            Form Comparison
          </Button>
          <Button
            variant={selectedComparison === 'metrics' ? 'default' : 'outline'}
            onClick={() => setSelectedComparison('metrics')}
            className={selectedComparison === 'metrics' ? 'bg-purple-500 hover:bg-purple-600' : ''}
          >
            Detailed Metrics
          </Button>
        </div>

        {selectedComparison === 'form' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Correct Form */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <h3 className="text-green-900">Correct Form</h3>
              </div>
              <div className="bg-green-50 rounded-lg p-8 flex items-center justify-center min-h-[400px]">
                <StickFigure
                  pose={exerciseId}
                  showCorrect={true}
                  className="w-full h-full max-w-sm"
                />
              </div>
              <p className="text-sm text-gray-600 text-center mt-4">
                Target form for optimal results
              </p>
            </Card>

            {/* Your Form */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="text-amber-900">Your Form</h3>
              </div>
              <div className="bg-amber-50 rounded-lg p-8 flex items-center justify-center min-h-[400px]">
                <StickFigure
                  pose={exerciseId}
                  showCorrect={false}
                  className="w-full h-full max-w-sm"
                />
              </div>
              <p className="text-sm text-gray-600 text-center mt-4">
                Captured form during exercise
              </p>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {metrics.map((metric, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h4>{metric.label}</h4>
                  <Badge
                    variant={metric.status === 'good' ? 'default' : 'secondary'}
                    className={
                      metric.status === 'good'
                        ? 'bg-green-100 text-green-700'
                        : metric.status === 'needs-improvement'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-red-100 text-red-700'
                    }
                  >
                    {metric.status === 'good'
                      ? 'Good'
                      : metric.status === 'needs-improvement'
                      ? 'Needs Work'
                      : 'Poor'}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Progress value={metric.value} className="h-3" />
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{metric.value}%</span>
                    <span className="text-gray-400">Target: 85%+</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Feedback Section */}
        <Card className="p-6 mb-8">
          <h3 className="mb-4">Personalized Feedback</h3>
          <div className="space-y-3">
            {feedback.map((item, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 p-4 rounded-lg ${
                  item.type === 'success'
                    ? 'bg-green-50 border border-green-200'
                    : item.type === 'warning'
                    ? 'bg-amber-50 border border-amber-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                {item.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                    item.type === 'warning' ? 'text-amber-600' : 'text-red-600'
                  }`} />
                )}
                <p className={`text-sm ${
                  item.type === 'success'
                    ? 'text-green-900'
                    : item.type === 'warning'
                    ? 'text-amber-900'
                    : 'text-red-900'
                }`}>
                  {item.message}
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            onClick={onRetry}
            className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 py-6"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Try Again
          </Button>
          <Button
            onClick={onHome}
            variant="outline"
            className="flex-1 py-6"
          >
            Choose Another Exercise
          </Button>
        </div>
      </div>
    </div>
  );
}