import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Semantic Search Test',
  description: 'Test the document semantic search component in isolation',
};

export default function SemanticSearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="light bg-background text-foreground min-h-screen" data-theme="light">
      {children}
    </div>
  );
} 