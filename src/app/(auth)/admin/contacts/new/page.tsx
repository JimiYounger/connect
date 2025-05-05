import { Metadata } from 'next'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import ContactForm from '@/features/contacts/components/ContactForm'

export const metadata: Metadata = {
  title: 'Create New Contact',
  description: 'Add a new contact to the system',
}

export default function NewContactPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            asChild
          >
            <Link href="/admin/contacts">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Create New Contact</h1>
        </div>
      </div>
      
      <div className="mx-auto max-w-3xl">
        <ContactForm />
      </div>
    </div>
  )
} 