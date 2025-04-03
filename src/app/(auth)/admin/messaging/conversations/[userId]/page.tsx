// src/app/(auth)/admin/messaging/conversations/[userId]/page.tsx

import { ConversationPageClient } from './client'

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params
  return <ConversationPageClient userId={userId} />
}