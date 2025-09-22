'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Send, Loader2 } from 'lucide-react';
import { AthleticLoadingScreen } from '@/components/ui/athletic-loading';
import { useForecastSurvey } from '../../hooks/useForecastSurvey';
import { QuestionCard } from './QuestionCard';
import { ProgressBar } from './ProgressBar';
import { SurveyComplete } from './SurveyComplete';
import { AreaSelection } from './AreaSelection';
import { useState } from 'react';

export function SurveyWizard() {
  const {
    questions,
    currentQuestion,
    currentQuestionIndex,
    answers,
    users,
    currentUserArea,
    areas,
    currentUserRegion,
    showAreaSelection,
    selectedArea,
    defaultWeek,
    isLoading,
    error,
    isSubmitting,
    isNavigating,
    isLastQuestion,
    isFirstQuestion,
    progress,
    setAnswer,
    nextQuestion,
    previousQuestion,
    selectArea,
    submitSurvey
  } = useForecastSurvey();

  const [isComplete, setIsComplete] = useState(false);

  if (isLoading) {
    return (
      <AthleticLoadingScreen message="Preparing forecast survey" />
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4 relative overflow-hidden">
        {/* Subtle Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-white to-red-50" />

        <Card className="w-full max-w-2xl p-8 shadow-lg border-0 relative z-10">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <div className="w-8 h-8 bg-red-500 rounded-full" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-gray-900">Unable to load survey</h3>
              <p className="text-red-600 font-medium">{error}</p>
              <p className="text-gray-500 text-sm">Please try refreshing the page or contact support if the issue persists.</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (isComplete) {
    return <SurveyComplete onStartNew={() => {
      setIsComplete(false);
      window.location.reload();
    }} />;
  }

  // Show area selection screen first
  if (showAreaSelection && currentUserArea && currentUserRegion && defaultWeek) {
    return (
      <AreaSelection
        areas={areas}
        currentUserArea={currentUserArea}
        currentUserRegion={currentUserRegion}
        defaultWeek={defaultWeek}
        onAreaSelected={selectArea}
        isLoading={isLoading}
      />
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4 relative overflow-hidden">
        {/* Subtle Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-50" />

        <Card className="w-full max-w-2xl p-8 shadow-lg border-0 relative z-10">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
              <div className="w-8 h-8 bg-gray-400 rounded-full" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-gray-900">No questions available</h3>
              <p className="text-gray-500 text-sm">There are currently no survey questions to display.</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const handleNext = async () => {
    if (isNavigating || isSubmitting) return;

    if (isLastQuestion) {
      handleSubmit();
    } else {
      await nextQuestion();
    }
  };

  const handleSubmit = async () => {
    try {
      await submitSurvey();
      setIsComplete(true);
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  const currentAnswer = answers.get(currentQuestion.id);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Progress Bar */}
      <ProgressBar
        progress={progress}
        currentSection={currentQuestion.section || ''}
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={questions.length}
      />

      {/* Question Card */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className={`w-full max-w-2xl transition-all duration-300 ${
          isNavigating ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
        }`}>
          <QuestionCard
            question={currentQuestion}
            value={currentAnswer}
            onChange={(value) => setAnswer(currentQuestion.id, value)}
            questionNumber={currentQuestionIndex + 1}
            users={users}
            currentUserArea={currentUserArea}
            selectedArea={selectedArea}
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="border-t bg-white px-4 pt-4 pb-8 safe-area-bottom">
        <div className="max-w-2xl mx-auto flex justify-between items-center gap-4">
          <Button
            variant="outline"
            size="mobileLg"
            onClick={previousQuestion}
            disabled={isFirstQuestion || isSubmitting || isNavigating}
            className="flex items-center gap-2 transition-all duration-200 min-w-[120px]"
            mobileOptimized
          >
            {isNavigating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
            Previous
          </Button>

          {isLastQuestion ? (
            <Button
              size="mobileLg"
              onClick={handleSubmit}
              disabled={isSubmitting || isNavigating}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 transition-all duration-200 min-w-[160px]"
              mobileOptimized
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting Forecast...
                </>
              ) : (
                <>
                  Submit Forecast
                  <Send className="h-4 w-4" />
                </>
              )}
            </Button>
          ) : (
            <Button
              size="mobileLg"
              onClick={handleNext}
              disabled={isSubmitting || isNavigating}
              className="flex items-center gap-2 transition-all duration-200 min-w-[120px]"
              mobileOptimized
            >
              {isNavigating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}