// src/hooks/use-debounce.ts

import { useState, useEffect, useRef } from 'react'

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  const previousValue = useRef<T>(value)

  useEffect(() => {
    // Skip debounce if value hasn't changed
    if (value === previousValue.current) {
      return
    }

    previousValue.current = value
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
} 