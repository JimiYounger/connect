import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from './button';
import { Upload } from 'lucide-react';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
}

export function ImageUpload({ value, onChange }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  
  // Placeholder for actual upload functionality
  const handleUpload = () => {
    setIsUploading(true);
    // Simulate upload delay
    setTimeout(() => {
      // This would be replaced with actual upload logic
      const mockImageUrl = `https://picsum.photos/seed/${Math.random()}/400/400`;
      onChange(mockImageUrl);
      setIsUploading(false);
    }, 1500);
  };
  
  return (
    <div className="flex flex-col items-center gap-4">
      {value ? (
        <div className="relative w-full h-48">
          <Image 
            src={value} 
            alt="Thumbnail" 
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            className="object-cover rounded-md"
            unoptimized={value.startsWith('data:') || value.startsWith('blob:')}
          />
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={() => onChange('')}
            className="absolute top-2 right-2 z-10"
          >
            Remove
          </Button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-md p-6 w-full flex flex-col items-center gap-2">
          <Upload className="h-10 w-10 text-gray-400" />
          <p className="text-sm text-gray-500">Click to upload an image</p>
        </div>
      )}
      
      {!value && (
        <Button 
          type="button" 
          onClick={handleUpload}
          disabled={isUploading}
        >
          {isUploading ? 'Uploading...' : 'Upload Image'}
        </Button>
      )}
    </div>
  );
} 