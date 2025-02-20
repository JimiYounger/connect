// src/features/carousel/components/EditBannerForm.tsx

'use client'

import { useRouter } from 'next/navigation'
import { BannerForm } from './BannerForm'
import type { BannerFormDataWithId } from '../types'

interface EditBannerFormProps {
  initialData: Partial<BannerFormDataWithId> & { id: string }
}

export function EditBannerForm({ initialData }: EditBannerFormProps) {
  const router = useRouter()

  return (
    <BannerForm 
      initialData={initialData}
      mode="edit"
      onSuccess={() => router.push('/admin/carousel')}
    />
  )
} 