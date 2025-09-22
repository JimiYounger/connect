import * as React from 'react';
import { cn } from '@/lib/utils';

export interface MobileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Input mode for mobile keyboards */
  inputMode?: 'none' | 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url';
  /** Enable mobile-specific optimizations */
  mobileOptimized?: boolean;
}

/**
 * Mobile-optimized input component
 * Single responsibility: Mobile-friendly text input
 * Extends base input with touch-friendly features
 */
const MobileInput = React.forwardRef<HTMLInputElement, MobileInputProps>(
  ({ className, type = 'text', inputMode, mobileOptimized = true, ...props }, ref) => {
    // Determine input mode based on type if not explicitly provided
    const getInputMode = (): MobileInputProps['inputMode'] => {
      if (inputMode) return inputMode;

      switch (type) {
        case 'number':
          return 'numeric';
        case 'tel':
          return 'tel';
        case 'email':
          return 'email';
        case 'url':
          return 'url';
        case 'search':
          return 'search';
        default:
          return 'text';
      }
    };

    // Mobile-optimized classes
    const mobileClasses = mobileOptimized
      ? cn(
          // Minimum touch target height (44px)
          'min-h-[44px]',
          // Touch-friendly padding
          'px-4 py-3',
          // Prevent zoom on focus (16px min font size)
          'text-base',
          // Optimize touch behavior
          'touch-manipulation',
          // Prevent text selection issues
          'select-text',
          // Remove tap highlight
          '[-webkit-tap-highlight-color:transparent]',
          // Smooth transitions
          'transition-all duration-200'
        )
      : '';

    return (
      <input
        type={type}
        className={cn(
          // Base styles
          'flex w-full rounded-md border border-input bg-background',
          'ring-offset-background placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:ring-2',
          'focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          // File input specific styles
          'file:border-0 file:bg-transparent file:text-sm file:font-medium',
          // Mobile optimizations
          mobileClasses,
          // Custom classes
          className
        )}
        ref={ref}
        inputMode={getInputMode()}
        // Mobile-specific attributes
        autoComplete={props.autoComplete || 'off'}
        autoCorrect={props.autoCorrect || 'off'}
        autoCapitalize={props.autoCapitalize || 'off'}
        spellCheck={props.spellCheck || false}
        {...props}
      />
    );
  }
);

MobileInput.displayName = 'MobileInput';

/**
 * Utility function to determine if input should show numeric keyboard
 * Single responsibility: Keyboard type detection
 */
export function shouldShowNumericKeyboard(type: string): boolean {
  return ['number', 'tel'].includes(type);
}

/**
 * Utility function to get optimal autoComplete value
 * Single responsibility: AutoComplete value determination
 */
export function getAutoCompleteValue(type: string, name?: string): string {
  // Map common input names to autocomplete values
  const nameMap: Record<string, string> = {
    email: 'email',
    phone: 'tel',
    telephone: 'tel',
    mobile: 'tel',
    name: 'name',
    firstname: 'given-name',
    lastname: 'family-name',
    address: 'street-address',
    city: 'address-level2',
    state: 'address-level1',
    zip: 'postal-code',
    zipcode: 'postal-code',
    country: 'country',
    username: 'username',
    password: 'current-password',
    newpassword: 'new-password',
  };

  // Check type first
  if (type === 'email') return 'email';
  if (type === 'tel') return 'tel';
  if (type === 'password') return 'current-password';

  // Check name attribute
  if (name) {
    const normalizedName = name.toLowerCase().replace(/[-_\s]/g, '');
    return nameMap[normalizedName] || 'off';
  }

  return 'off';
}

export { MobileInput };