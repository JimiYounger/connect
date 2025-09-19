'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Send } from 'lucide-react';
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
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl p-8">
          <div className="text-center">Loading survey...</div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl p-8">
          <div className="text-center text-red-600">Error: {error}</div>
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
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl p-8">
          <div className="text-center">No questions available</div>
        </Card>
      </div>
    );
  }

  const handleNext = () => {
    if (isLastQuestion) {
      handleSubmit();
    } else {
      nextQuestion();
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
        <div className="w-full max-w-2xl">
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
      <div className="border-t bg-white p-4">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <Button
            variant="outline"
            onClick={previousQuestion}
            disabled={isFirstQuestion || isSubmitting}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          {isLastQuestion ? (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Forecast'}
              <Send className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}