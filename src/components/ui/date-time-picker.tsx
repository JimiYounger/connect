
// my-app/src/components/ui/date-time-picker.tsx

"use client"

import * as React from "react"
import { Calendar as CalendarIcon } from "lucide-react"
import { format } from "date-fns"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "./input"

interface DateTimePickerProps {
  date?: Date
  setDate: (date: Date | undefined) => void
  className?: string
}

export function DateTimePicker({
  date,
  setDate,
  className,
}: DateTimePickerProps) {
  const [selectedDateTime, setSelectedDateTime] = React.useState<Date | undefined>(
    date
  )
  const [isOpen, setIsOpen] = React.useState(false)

  // Update internal state when external date changes
  React.useEffect(() => {
    setSelectedDateTime(date)
  }, [date])

  // Update external state when internal state changes
  React.useEffect(() => {
    setDate(selectedDateTime)
  }, [selectedDateTime, setDate])

  // Handle calendar date change
  const handleDateSelect = (selected: Date | undefined) => {
    if (selected) {
      // Preserve time from existing selection or set to noon
      const hours = selectedDateTime ? selectedDateTime.getHours() : 12
      const minutes = selectedDateTime ? selectedDateTime.getMinutes() : 0
      
      selected.setHours(hours)
      selected.setMinutes(minutes)
      
      setSelectedDateTime(selected)
    }
  }

  // Handle time change
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedDateTime) return

    const [hours, minutes] = e.target.value.split(':').map(Number)
    const newDateTime = new Date(selectedDateTime)
    newDateTime.setHours(hours)
    newDateTime.setMinutes(minutes)
    setSelectedDateTime(newDateTime)
  }

  // Simplified click handler without event blocking
  const handleTriggerClick = () => {
    setIsOpen(!isOpen)
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              // PWA touch optimizations
              "touch-manipulation [-webkit-tap-highlight-color:transparent] min-h-[44px]",
              !date && "text-muted-foreground"
            )}
            onClick={handleTriggerClick}
            mobileOptimized
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? (
              format(date, "PPP p")
            ) : (
              <span>Pick a date and time</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0"
          align="start"
          onInteractOutside={() => setIsOpen(false)}
        >
          <Calendar
            mode="single"
            selected={selectedDateTime}
            onSelect={handleDateSelect}
            initialFocus
          />
          <div className="p-3 border-t border-border">
            <Input
              type="time"
              onChange={handleTimeChange}
              value={selectedDateTime ? format(selectedDateTime, 'HH:mm') : ''}
              className="w-full touch-manipulation [-webkit-tap-highlight-color:transparent] min-h-[44px]"
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
} 