import { Metadata } from 'next'
import { PlusCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ContactsContainer } from '@/features/contacts/components/ContactsContainer'

export const metadata: Metadata = {
  title: 'Contacts',
  description: 'Manage your contacts',
}

export default function ContactsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Contacts</h1>
        <Button asChild>
          <Link href="/admin/contacts/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Contact
          </Link>
        </Button>
      </div>
      
      <ContactsContainer />
    </div>
  )
} 