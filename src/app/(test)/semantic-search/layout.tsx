import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Document Search',
  description: 'Search for documents with natural language queries',
};

export default function SemanticSearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background text-foreground min-h-screen flex items-center justify-center">
      {children}
    </div>
  );
} 