// src/app/(auth)/admin/carousel/layout.tsx
'use client'

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

export default function CarouselLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto py-6">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/admin" className="flex items-center gap-2">
            <ChevronLeft className="h-4 w-4" />
            Back to Admin
          </Link>
        </Button>
      </div>
      {children}
    </div>
  )
}