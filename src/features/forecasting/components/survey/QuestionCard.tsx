'use client';

import { Card } from '@/components/ui/card';
import { MobileInput } from '@/components/ui/mobile-input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MobileSelect } from '@/components/ui/mobile-select';
import { PeopleMultiSelect } from './PeopleMultiSelect';
import type { ForecastQuestion, UserProfile, PeopleTextAnswer } from '../../types';

interface QuestionCardProps {
  question: ForecastQuestion;
  value: string | number | string[] | PeopleTextAnswer | undefined;
  onChange: (value: string | number | string[] | PeopleTextAnswer) => void;
  questionNumber: number;
  users?: UserProfile[];
  currentUserArea?: string | null;
  selectedArea?: string | null;
}

export function QuestionCard({ question, value, onChange, questionNumber, users = [], currentUserArea, selectedArea }: QuestionCardProps) {
  const renderInput = () => {
    switch (question.question_type) {
      case 'number':
        return (
          <MobileInput
            type="number"
            value={value as number || ''}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : 0)}
            className="text-center"
            placeholder="Enter number"
            inputMode="numeric"
            mobileOptimized
          />
        );

      case 'text':
        return (
          <MobileInput
            type="text"
            value={value as string || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter your answer"
            mobileOptimized
          />
        );

      case 'multiline':
        return (
          <Textarea
            value={value as string || ''}
            onChange={(e) => onChange(e.target.value)}
            className="text-base min-h-[200px] resize-none touch-manipulation [-webkit-tap-highlight-color:transparent]"
            placeholder="Enter your answer"
          />
        );

      case 'select':
        if (question.options && Array.isArray(question.options)) {
          return (
            <MobileSelect
              options={question.options.map((option: string) => ({
                value: option,
                label: option
              }))}
              value={value as string || ''}
              onChange={onChange}
              placeholder="Select an option"
            />
          );
        }
        return <div>No options available</div>;

      case 'people_multi_select':
        // Handle both simple array and PeopleTextAnswer formats
        const peopleValue = value as string[] | PeopleTextAnswer | undefined;
        const currentPeople = Array.isArray(peopleValue) ? peopleValue : peopleValue?.people || [];
        const currentText = Array.isArray(peopleValue) ? "" : peopleValue?.text || "";

        const handlePeopleChange = (userIds: string[]) => {
          if (question.include_text_area) {
            onChange({ people: userIds, text: currentText });
          } else {
            onChange(userIds);
          }
        };

        const handleTextChange = (text: string) => {
          if (question.include_text_area) {
            onChange({ people: currentPeople, text });
          }
        };

        return (
          <PeopleMultiSelect
            users={users}
            targetArea={selectedArea || currentUserArea || null}
            selectedUserIds={currentPeople}
            onChange={handlePeopleChange}
            placeholder="Search for team members..."
            includeTextArea={question.include_text_area || undefined}
            textValue={currentText}
            onTextChange={handleTextChange}
            textPlaceholder="Describe your support plans or additional details..."
          />
        );

      default:
        return <div>Unsupported question type</div>;
    }
  };

  return (
    <Card className="w-full bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-3xl">
      <div className="p-8 space-y-8">
        {/* Question Number Badge */}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-bold text-lg">
            {questionNumber}
          </div>
          <div className="text-sm font-semibold tracking-wider text-gray-600 uppercase">
            {question.section}
          </div>
        </div>

        {/* Question */}
        <div>
          <Label className="text-xl md:text-2xl font-medium text-black leading-relaxed block">
            {question.question_text}
          </Label>
        </div>

        {/* Input */}
        <div className="pt-2">
          {renderInput()}
        </div>

        {/* Helper text for numeric inputs */}
        {question.question_type === 'number' && (
          <p className="text-sm text-gray-500 font-medium">
            Enter a numeric value
          </p>
        )}
      </div>
    </Card>
  );
}