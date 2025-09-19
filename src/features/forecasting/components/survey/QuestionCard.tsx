'use client';

import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
          <Input
            type="number"
            value={value as number || ''}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : 0)}
            className="text-lg p-6 text-center"
            placeholder="Enter number"
            inputMode="numeric"
          />
        );

      case 'text':
        return (
          <Input
            type="text"
            value={value as string || ''}
            onChange={(e) => onChange(e.target.value)}
            className="text-lg p-6"
            placeholder="Enter your answer"
          />
        );

      case 'multiline':
        return (
          <Textarea
            value={value as string || ''}
            onChange={(e) => onChange(e.target.value)}
            className="text-lg p-4 min-h-[200px] resize-none"
            placeholder="Enter your answer"
          />
        );

      case 'select':
        if (question.options && Array.isArray(question.options)) {
          return (
            <select
              value={value as string || ''}
              onChange={(e) => onChange(e.target.value)}
              className="w-full text-lg p-6 border rounded-md"
            >
              <option value="">Select an option</option>
              {question.options.map((option: string, index: number) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
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
    <Card className="w-full p-8 shadow-lg border-0">
      <div className="space-y-6">
        {/* Section Label */}
        <div className="text-sm text-gray-500 uppercase tracking-wide">
          {question.section}
        </div>

        {/* Question */}
        <div className="space-y-2">
          <Label className="text-xl md:text-2xl font-normal text-gray-900 leading-relaxed">
            {questionNumber}. {question.question_text}
          </Label>
        </div>

        {/* Input */}
        <div className="pt-4">
          {renderInput()}
        </div>

        {/* Helper text for numeric inputs */}
        {question.question_type === 'number' && (
          <p className="text-sm text-gray-500">
            Enter a numeric value
          </p>
        )}
      </div>
    </Card>
  );
}