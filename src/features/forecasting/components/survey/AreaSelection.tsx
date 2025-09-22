'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MobileSelect } from '@/components/ui/mobile-select';
import { ChevronRight, Loader2 } from 'lucide-react';

interface AreaOption {
  area: string;
  region: string;
}

interface AreaSelectionProps {
  areas: AreaOption[];
  currentUserArea: string;
  currentUserRegion: string;
  defaultWeek: string;
  onAreaSelected: (area: string, region: string, week: string) => void;
  isLoading?: boolean;
}

export function AreaSelection({
  areas,
  currentUserArea,
  currentUserRegion,
  defaultWeek,
  onAreaSelected,
  isLoading = false
}: AreaSelectionProps) {
  const [selectedArea, setSelectedArea] = useState(currentUserArea);
  const [selectedRegion, setSelectedRegion] = useState(currentUserRegion);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Update region when area changes
  useEffect(() => {
    const areaOption = areas.find(a => a.area === selectedArea);
    if (areaOption) {
      setSelectedRegion(areaOption.region);
    }
  }, [selectedArea, areas]);

  const handleContinue = async (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isTransitioning || isLoading) return;

    setIsTransitioning(true);

    // Add a small delay to show loading state
    await new Promise(resolve => setTimeout(resolve, 300));

    onAreaSelected(selectedArea, selectedRegion, defaultWeek);
  };



  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-8 shadow-lg border-0">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900">
              Weekly Forecast Submission
            </h2>
            <p className="text-gray-600">
              Select the area you are submitting the forecast for
            </p>
          </div>

          {/* Area Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium text-gray-700">
              You are submitting for:
            </Label>
            <MobileSelect
              options={areas.map(areaOption => ({
                value: areaOption.area,
                label: `${areaOption.area} (${areaOption.region})`,
                disabled: isLoading || isTransitioning
              }))}
              value={selectedArea}
              onChange={setSelectedArea}
              placeholder="Select an area"
              disabled={isLoading || isTransitioning}
              className={isTransitioning ? 'opacity-60' : ''}
            />
          </div>


          {/* Continue Button */}
          <div className="pt-6 mt-6">
            <Button
              size="mobileLg"
              onClick={handleContinue}
              disabled={isLoading || isTransitioning}
              className="w-full flex items-center justify-center gap-2"
              mobileOptimized
            >
              {isTransitioning ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading Questions...
                </>
              ) : (
                <>
                  Continue to Questions
                  <ChevronRight className="h-5 w-5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}