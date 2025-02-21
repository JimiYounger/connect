// src/features/users/components/UserProfileNav.tsx
'use client'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { UserProfile } from "../types"
import { useAuth } from "@/features/auth/context/auth-context"

interface UserProfileNavProps {
  profile: UserProfile
}

export function UserProfileNav({ profile }: UserProfileNavProps) {
  const { signOut } = useAuth()
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile.profile_pic_url || undefined} alt={profile.first_name} />
            <AvatarFallback>{profile.first_name[0]}{profile.last_name[0]}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{profile.first_name} {profile.last_name}</p>
            <p className="text-xs leading-none text-muted-foreground">{profile.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="flex flex-col items-start gap-1 cursor-default">
          <span className="text-xs text-muted-foreground">Role</span>
          <span className="text-sm">{profile.role}</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="flex flex-col items-start gap-1 cursor-default">
          <span className="text-xs text-muted-foreground">Team</span>
          <span className="text-sm">{profile.team}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()}>
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}