// src/features/carousel/components/RoleSelector.tsx

'use client'

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"

// TODO: Replace with your actual roles or fetch from API
const AVAILABLE_ROLES = [
  { value: "admin", label: "Admin" },
  { value: "setter", label: "Setter" },
  { value: "closer", label: "Closer" },
  { value: "manager", label: "Manager" },
]

interface RoleSelectorProps {
  value: string[]
  onChange: (value: string[]) => void
}

export function RoleSelector({ value, onChange }: RoleSelectorProps) {
  const selectedRoles = new Set(value)

  const toggleRole = (roleValue: string) => {
    const newRoles = new Set(selectedRoles)
    if (newRoles.has(roleValue)) {
      newRoles.delete(roleValue)
    } else {
      newRoles.add(roleValue)
    }
    onChange(Array.from(newRoles))
  }

  return (
    <div className="flex flex-col gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start"
          >
            {value.length === 0 ? (
              <span className="text-muted-foreground">
                Select roles...
              </span>
            ) : (
              <span>
                {value.length} role{value.length === 1 ? '' : 's'} selected
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput placeholder="Search roles..." />
            <CommandEmpty>No roles found.</CommandEmpty>
            <CommandGroup>
              {AVAILABLE_ROLES.map((role) => (
                <CommandItem
                  key={role.value}
                  onSelect={() => toggleRole(role.value)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedRoles.has(role.value) 
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  {role.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map(roleValue => {
            const role = AVAILABLE_ROLES.find(r => r.value === roleValue)
            return (
              <Badge
                key={roleValue}
                variant="secondary"
                className="cursor-pointer"
                onClick={() => toggleRole(roleValue)}
              >
                {role?.label ?? roleValue}
                <Check className="ml-1 h-3 w-3" />
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
} 