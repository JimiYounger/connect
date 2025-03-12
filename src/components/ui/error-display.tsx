import { AlertCircle } from 'lucide-react';
import { Button } from './button';

interface ErrorDisplayProps {
  title: string;
  error: Error;
  retry?: () => void;
}

export function ErrorDisplay({ title, error, retry }: ErrorDisplayProps) {
  return (
    <div className="rounded-md bg-destructive/10 p-6 text-center">
      <div className="flex justify-center mb-4">
        <AlertCircle className="h-10 w-10 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold text-destructive mb-2">{title}</h3>
      <p className="text-sm text-destructive/90 mb-4">
        {error.message || 'An unexpected error occurred'}
      </p>
      {retry && (
        <Button variant="outline" onClick={retry}>
          Try Again
        </Button>
      )}
    </div>
  );
} 