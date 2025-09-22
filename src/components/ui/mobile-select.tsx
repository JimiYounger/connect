'use client';

import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, Check } from 'lucide-react';

export interface MobileSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface MobileSelectProps {
  options: MobileSelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  name?: string;
  id?: string;
}

/**
 * Mobile-optimized select component
 * Single responsibility: Touch-friendly dropdown selection
 * Replaces native select with custom implementation
 */
export function MobileSelect({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  disabled = false,
  className,
  name,
  id,
}: MobileSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value || '');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Get selected option label
  const selectedOption = options.find(opt => opt.value === selectedValue);
  const displayText = selectedOption?.label || placeholder;

  // Handle selection
  const handleSelect = (optionValue: string) => {
    if (options.find(opt => opt.value === optionValue)?.disabled) {
      return;
    }

    setSelectedValue(optionValue);
    setIsOpen(false);
    onChange?.(optionValue);
  };

  // Handle outside clicks
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Update selected value when prop changes
  useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value);
    }
  }, [value]);

  // Handle button click
  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className="relative">
      {/* Hidden input for form submission */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={selectedValue}
          id={id}
        />
      )}

      {/* Custom select button */}
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={handleButtonClick}
        className={cn(
          // Base styles
          'flex w-full items-center justify-between',
          'rounded-md border border-input bg-background',
          'px-4 py-3 text-left',
          // Touch optimization
          'min-h-[44px] touch-manipulation',
          '[-webkit-tap-highlight-color:transparent]',
          // States
          'transition-all duration-200',
          'hover:bg-accent hover:text-accent-foreground',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          // Active state for better mobile feedback
          'active:bg-accent active:text-accent-foreground',
          // Text styling
          'text-base font-semibold',
          !selectedValue && 'text-muted-foreground',
          className
        )}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={displayText}
      >
        <span className="truncate">{displayText}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className={cn(
            // Positioning
            'absolute z-50 mt-1 w-full',
            // Styling
            'rounded-md border bg-background shadow-lg',
            // Animation
            'animate-in fade-in-0 zoom-in-95',
            // Scrolling
            'max-h-[300px] overflow-auto',
            // Mobile scroll optimization
            'touch-manipulation [-webkit-overflow-scrolling:touch]'
          )}
          role="listbox"
          aria-label="Options"
        >
          {options.map((option) => (
            <OptionItem
              key={option.value}
              option={option}
              isSelected={option.value === selectedValue}
              onSelect={handleSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Individual option item component
 * Single responsibility: Render and handle individual option
 */
function OptionItem({
  option,
  isSelected,
  onSelect,
}: {
  option: MobileSelectOption;
  isSelected: boolean;
  onSelect: (value: string) => void;
}) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!option.disabled) {
      onSelect(option.value);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        // Base styles
        'relative flex cursor-pointer items-center',
        'px-4 py-3 text-base font-medium',
        // Touch optimization
        'min-h-[44px] touch-manipulation',
        '[-webkit-tap-highlight-color:transparent]',
        // States
        'transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        'focus:bg-accent focus:text-accent-foreground focus:outline-none',
        'active:bg-accent active:text-accent-foreground',
        // Selected state
        isSelected && 'bg-accent/50',
        // Disabled state
        option.disabled && 'cursor-not-allowed opacity-50'
      )}
      role="option"
      aria-selected={isSelected}
      aria-disabled={option.disabled}
    >
      <span className="flex-1 truncate">{option.label}</span>
      {isSelected && (
        <Check className="h-4 w-4 shrink-0 text-primary" />
      )}
    </div>
  );
}

/**
 * Convert array of strings to MobileSelectOption format
 * Single responsibility: Format conversion
 */
export function stringArrayToOptions(values: string[]): MobileSelectOption[] {
  return values.map(value => ({
    value,
    label: value,
  }));
}

/**
 * Convert object to MobileSelectOption format
 * Single responsibility: Format conversion
 */
export function objectToOptions(obj: Record<string, string>): MobileSelectOption[] {
  return Object.entries(obj).map(([value, label]) => ({
    value,
    label,
  }));
}