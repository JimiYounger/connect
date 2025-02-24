import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a phone number to E.164 format (+1XXXXXXXXXX)
 * @param phone The phone number to format
 * @returns Formatted phone number or null if invalid
 */
export function formatPhoneE164(phone: string | null | undefined): string | null {
  if (!phone) return null
  
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '')
  
  // Check if it's a valid US number (10 digits)
  if (cleaned.length === 10) {
    return `+1${cleaned}`
  }
  
  // If it already has country code (11 digits starting with 1)
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`
  }
  
  // Invalid number
  console.warn(`Invalid phone number format: ${phone}`)
  return null
}
