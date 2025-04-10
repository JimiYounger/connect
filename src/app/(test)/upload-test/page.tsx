// ✅ app/(test)/upload-test/page.tsx
'use client'

import { UploadForm } from '@/features/documentLibrary/upload/UploadForm'

const mockCategories = [
  { id: 'cat-1', name: 'Training' },
  { id: 'cat-2', name: 'Sales Enablement' },
]

const mockTags = ['solar', 'pricing', 'contract', 'installation']

const mockUserId = '048ccf06-50f0-47ff-9877-deffde376067'

export default function UploadTestPage() {
  return (
    <main className="p-10">
      <UploadForm 
        categories={mockCategories} 
        allTags={mockTags} 
        userId={mockUserId} 
      />
    </main>
  )
}
