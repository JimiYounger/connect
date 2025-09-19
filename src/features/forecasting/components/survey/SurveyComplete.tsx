'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

interface SurveyCompleteProps {
  onStartNew?: () => void;
}

export function SurveyComplete({ onStartNew }: SurveyCompleteProps) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 text-center space-y-6 border-0 shadow-lg">
        <div className="flex justify-center">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>

        <h2 className="text-2xl font-semibold text-gray-900">
          Forecast Submitted!
        </h2>

        <p className="text-gray-600">
          Your weekly forecast has been successfully submitted. Thank you for keeping leadership informed.
        </p>

        <div className="space-y-3">
          {onStartNew && (
            <Button
              variant="outline"
              onClick={onStartNew}
              className="w-full"
            >
              Submit Another Response
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}