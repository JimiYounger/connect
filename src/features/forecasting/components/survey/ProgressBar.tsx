'use client';

import { Progress } from '@/components/ui/progress';

interface ProgressBarProps {
  progress: number;
  currentSection: string;
  questionNumber: number;
  totalQuestions: number;
}

export function ProgressBar({
  progress,
  currentSection,
  questionNumber,
  totalQuestions
}: ProgressBarProps) {
  return (
    <div className="bg-white border-b p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            {currentSection}
          </span>
          <span className="text-sm text-gray-500">
            Question {questionNumber} of {totalQuestions}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
    </div>
  );
}