import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create New Contact',
  description: 'Add a new contact to the system',
}

export default function NewContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 