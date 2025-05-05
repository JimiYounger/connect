'use client';

import { useState, useEffect } from 'react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { SortableContactItem } from './SortableContactItem';
import { Contact } from '../types';
import { useToast } from '@/hooks/use-toast';

interface SortableContactListProps {
  contacts: Contact[];
  departmentId: string;
}

export function SortableContactList({ contacts, departmentId }: SortableContactListProps) {
  const [items, setItems] = useState<Contact[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();
  
  // Initialize with provided contacts
  useEffect(() => {
    setItems(contacts);
  }, [contacts]);
  
  // Set up DndKit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Handle drag end event
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setItems((currentItems) => {
        // Find the indexes
        const activeIndex = currentItems.findIndex(item => item.id === active.id);
        const overIndex = currentItems.findIndex(item => item.id === over.id);
        
        // Return the reordered array
        return arrayMove(currentItems, activeIndex, overIndex);
      });
      
      // Update order in database
      await updateContactOrder();
    }
  };
  
  // Update contact order in database
  const updateContactOrder = async () => {
    setIsUpdating(true);
    
    try {
      // Create new order indexes
      const updatedContacts = items.map((contact, index) => ({
        id: contact.id,
        order_index: index
      }));
      
      // Call API to update order
      const response = await fetch('/api/contacts/update-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contacts: updatedContacts,
          departmentId
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update contact order');
      }
      
      // No need to show success toast to avoid too many notifications
    } catch (error) {
      console.error('Error updating contact order:', error);
      toast({
        title: 'Error',
        description: 'Failed to update contact order',
        variant: 'destructive',
      });
      
      // Revert back to original order on error
      setItems(contacts);
    } finally {
      setIsUpdating(false);
    }
  };
  
  if (items.length === 0) {
    return (
      <div className="text-center p-4 text-muted-foreground">
        No contacts in this department
      </div>
    );
  }
  
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map(item => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-1">
          {items.map((contact) => (
            <SortableContactItem
              key={contact.id}
              contact={contact}
              disabled={isUpdating}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
} 