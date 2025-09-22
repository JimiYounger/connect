'use client';

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
    <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200/50 px-6 py-5">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-semibold tracking-wide text-black uppercase">
            {currentSection}
          </span>
          <span className="text-sm font-medium text-gray-600">
            {questionNumber} / {totalQuestions}
          </span>
        </div>
        <div className="relative">
          {/* Background track */}
          <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
            {/* Progress fill */}
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${progress}%`,
                backgroundColor: '#61B2DC'
              }}
            />
          </div>
          {/* Athletic accent dot */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-black rounded-full transition-all duration-500 ease-out shadow-sm"
            style={{ left: `calc(${progress}% - 6px)` }}
          />
        </div>
      </div>
    </div>
  );
}