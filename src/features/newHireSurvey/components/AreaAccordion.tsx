'use client';

import { useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { PersonRow } from './PersonRow';
import { PersonDetail } from './PersonDetail';
import type { Person } from '../lib/types';

interface AreaAccordionProps {
  areas: string[];
  people: Person[];
}

export function AreaAccordion({ areas, people }: AreaAccordionProps) {
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  const handlePersonClick = (person: Person) => {
    setSelectedPerson(person);
  };

  const handleCloseDetail = () => {
    setSelectedPerson(null);
  };

  // Group people by area
  const peopleByArea = people.reduce((acc, person) => {
    if (!acc[person.area]) {
      acc[person.area] = [];
    }
    acc[person.area].push(person);
    return acc;
  }, {} as Record<string, Person[]>);

  if (areas.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-gray-400">
          <p className="text-2xl font-semibold mb-3 text-white">No Data Available</p>
          <p className="text-lg">No new hire survey data found.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Accordion type="multiple" className="w-full space-y-4">
        {areas.map((area) => {
          const areaPeople = peopleByArea[area] || [];
          
          return (
            <AccordionItem
              key={area}
              value={area}
              className="border-2 border-gray-700 rounded-xl px-4 py-3 shadow-sm hover:shadow-md transition-shadow bg-gray-800"
            >
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center justify-between w-full mr-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-white">
                      {area}
                    </h3>
                    <Badge variant="outline" className="text-sm px-3 py-1 font-semibold border-2 border-gray-600 text-gray-300">
                      {areaPeople.length} {areaPeople.length === 1 ? 'person' : 'people'}
                    </Badge>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-6">
                {areaPeople.length === 0 ? (
                  <div className="text-base text-gray-400 italic py-8 text-center border border-dashed border-gray-600 rounded-lg">
                    No people found in this area
                  </div>
                ) : (
                  <div className="space-y-4">
                    {areaPeople.map((person) => (
                      <PersonRow
                        key={person.id}
                        person={person}
                        onViewDetails={handlePersonClick}
                      />
                    ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      <PersonDetail
        person={selectedPerson}
        open={!!selectedPerson}
        onClose={handleCloseDetail}
      />
    </>
  );
}