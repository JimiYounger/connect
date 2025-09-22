'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MobileSelect } from '@/components/ui/mobile-select';
import { ChevronRight, Loader2 } from 'lucide-react';
import Image from 'next/image';

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
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-6">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-100 via-gray-50 to-white" />
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-gray-100/30 to-gray-200/20" />

      {/* Animated Background Elements */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-br from-gray-200/40 to-transparent rounded-full blur-3xl animate-pulse"
           style={{ animationDuration: '4s' }} />
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-tl from-gray-300/30 to-transparent rounded-full blur-3xl animate-pulse"
           style={{ animationDuration: '6s', animationDelay: '2s' }} />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-gray-200/20 to-transparent rounded-full blur-3xl opacity-50" />

      <Card className="w-full max-w-2xl bg-white/90 backdrop-blur-md border-0 shadow-2xl rounded-3xl relative z-10">
        <div className="p-8 space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto">
              <Image
                src="https://ucarecdn.com/4e75ee44-0e74-4eaa-b6c9-f3c46219bde0/-/preview/180x180/"
                alt="Forecast Icon"
                width={64}
                height={64}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-bold text-black">
                Weekly Forecast
              </h2>
              <p className="text-gray-600 font-medium">
                Select the area you are submitting the forecast for
              </p>
            </div>
          </div>

          {/* Area Selection */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold text-black tracking-wide">
              Submitting for:
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
          <div className="pt-4">
            <Button
              size="mobileLg"
              onClick={handleContinue}
              disabled={isLoading || isTransitioning}
              className="w-full flex items-center justify-center gap-3 bg-black hover:bg-gray-800 text-white font-semibold py-4 text-lg transition-all duration-200 rounded-2xl"
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