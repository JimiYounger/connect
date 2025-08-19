'use client';

import { HelpCircle } from 'lucide-react';

interface QuestionsListProps {
  questions: string[];
  searchQuery?: string;
}

export function QuestionsList({ questions, searchQuery = '' }: QuestionsListProps) {
  const highlightSearchTerm = (text: string) => {
    if (!searchQuery) return text;
    
    const regex = new RegExp(`(${searchQuery})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? 
        <mark key={index} className="bg-yellow-200 px-1 rounded">{part}</mark> : 
        part
    );
  };

  if (questions.length === 0) return null;

  return (
    <div>
      <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
        <HelpCircle className="h-4 w-4" />
        Typical Questions
      </h4>
      <div className="space-y-2">
        {questions.map((question, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2.5 flex-shrink-0"></div>
            <span className="text-sm text-slate-700">
              {highlightSearchTerm(question)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}