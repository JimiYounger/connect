import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'PureLightTV | Connect by Purelight',
  description: 'Watch the latest videos from PureLightTV showcase - exclusive content for Purelight team members.',
  openGraph: {
    title: 'PureLightTV | Connect by Purelight',
    description: 'Watch the latest videos from PureLightTV showcase - exclusive content for Purelight team members.',
    type: 'website',
    siteName: 'Connect by Purelight'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PureLightTV | Connect by Purelight',
    description: 'Watch the latest videos from PureLightTV showcase - exclusive content for Purelight team members.'
  }
}

export default function PureLightTVLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}