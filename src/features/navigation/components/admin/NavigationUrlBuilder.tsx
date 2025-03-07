'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/features/auth/context/auth-context'
import { useProfile } from '@/features/users/hooks/useProfile'
import { Variable } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { UserProfile } from '@/features/users/types'

interface NavigationUrlBuilderProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (url: string) => void
}

type Variable = {
  key: string
  label: string
  description: string
  example: string
  getValue: (user: UserProfile | null) => string
}

const variables: Variable[] = [
  {
    key: ':userId',
    label: 'User ID',
    description: 'The current user\'s ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    getValue: (user) => user?.id || '',
  },
  {
    key: ':email',
    label: 'Email',
    description: 'The current user\'s email',
    example: 'john.doe@example.com',
    getValue: (user) => user?.email || '',
  },
  {
    key: ':roleType',
    label: 'Role Type',
    description: 'The current user\'s role type',
    example: 'Admin',
    getValue: (user) => user?.role_type || '',
  },
  {
    key: ':team',
    label: 'Team',
    description: 'The current user\'s team',
    example: 'Sales',
    getValue: (user) => user?.team || '',
  },
  {
    key: ':area',
    label: 'Area',
    description: 'The current user\'s area',
    example: 'North',
    getValue: (user) => user?.area || '',
  },
  {
    key: ':region',
    label: 'Region',
    description: 'The current user\'s region',
    example: 'West',
    getValue: (user) => user?.region || '',
  },
]

export function NavigationUrlBuilder({
  open,
  onOpenChange,
  onSelect,
}: NavigationUrlBuilderProps) {
  const [url, setUrl] = useState('')
  const [variableOpen, setVariableOpen] = useState(false)
  const [usedVariables, setUsedVariables] = useState<Set<string>>(new Set())
  const [previewUrl, setPreviewUrl] = useState('')
  const { session } = useAuth()
  const { profile } = useProfile(session)

  // Update used variables when URL changes
  useEffect(() => {
    const used = new Set<string>()
    variables.forEach((variable) => {
      if (url.includes(variable.key)) {
        used.add(variable.key)
      }
    })
    setUsedVariables(used)
  }, [url])

  // Update preview URL when variables or URL changes
  useEffect(() => {
    let preview = url
    variables.forEach((variable) => {
      if (preview.includes(variable.key)) {
        const value = variable.getValue(profile)
        preview = preview.replace(new RegExp(variable.key, 'g'), value || '[not available]')
      }
    })
    setPreviewUrl(preview)
  }, [url, profile])

  // Validate URL format
  const isValidUrl = () => {
    // Must start with /
    if (!url.startsWith('/')) return false

    // Check for unmatched variables
    const matches = url.match(/:[a-zA-Z]+/g) || []
    return matches.every(match => variables.some(v => v.key === match))
  }

  const handleInsertVariable = (variable: Variable) => {
    const selectionStart = (document.activeElement as HTMLInputElement)?.selectionStart || url.length
    const selectionEnd = (document.activeElement as HTMLInputElement)?.selectionEnd || url.length
    
    const newUrl = url.substring(0, selectionStart) + 
                  variable.key + 
                  url.substring(selectionEnd)
    
    setUrl(newUrl)
    setVariableOpen(false)
  }

  const handleSubmit = () => {
    if (isValidUrl()) {
      onSelect(url)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Build Navigation URL</DialogTitle>
          <DialogDescription>
            Create a URL with optional dynamic variables that will be replaced with user data
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="flex items-center gap-2">
            <div className="grid flex-1 gap-2">
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="/path/to/page"
                className={cn(
                  'font-mono',
                  !isValidUrl() && url && 'border-red-500'
                )}
              />
              {!isValidUrl() && url && (
                <p className="text-sm text-red-500">
                  URL must start with / and use valid variables
                </p>
              )}
            </div>
            <Popover open={variableOpen} onOpenChange={setVariableOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="shrink-0"
                  size="icon"
                >
                  <Variable className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0" align="end">
                <Command>
                  <CommandInput placeholder="Search variables..." />
                  <CommandList>
                    <CommandEmpty>No variables found.</CommandEmpty>
                    <CommandGroup>
                      {variables.map((variable) => (
                        <CommandItem
                          key={variable.key}
                          onSelect={() => handleInsertVariable(variable)}
                        >
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm">
                                {variable.key}
                              </span>
                              <span className="text-muted-foreground">
                                {variable.label}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {variable.description}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {usedVariables.size > 0 && (
            <div className="flex flex-wrap gap-2">
              {Array.from(usedVariables).map((key) => {
                const variable = variables.find(v => v.key === key)
                if (!variable) return null
                return (
                  <Badge
                    key={key}
                    variant="secondary"
                    className="font-mono"
                  >
                    {key}
                  </Badge>
                )
              })}
            </div>
          )}

          <div className="rounded-md bg-muted p-4">
            <div className="text-sm font-medium mb-2">Preview</div>
            <div className="font-mono text-sm break-all">
              {previewUrl || 'No preview available'}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isValidUrl()}
            >
              Use URL
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 