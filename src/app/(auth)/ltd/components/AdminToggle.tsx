'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit3, Eye } from 'lucide-react'

interface AdminToggleProps {
  isEditMode: boolean
  onToggle: (editMode: boolean) => void
}

export function AdminToggle({ isEditMode, onToggle }: AdminToggleProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
      <Badge variant="outline" className="text-xs text-gray-700 border-gray-300">
        Admin Mode
      </Badge>
      
      <Button
        onClick={() => onToggle(!isEditMode)}
        variant={isEditMode ? "default" : "outline"}
        size="sm"
        className="gap-2 transition-all duration-200"
      >
        {isEditMode ? (
          <>
            <Edit3 className="h-4 w-4" />
            Edit Mode
          </>
        ) : (
          <>
            <Eye className="h-4 w-4" />
            Production View
          </>
        )}
      </Button>
    </div>
  )
}