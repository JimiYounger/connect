import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../../globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Team Directory',
  description: 'Find and connect with team members across all departments',
  applicationName: 'Connect',
};

export default function ContactsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${inter.className} bg-background text-foreground min-h-screen`}>
      <div className="bg-white">
        <header className="border-b">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-xl font-bold text-primary">Team Directory</h1>
          </div>
        </header>
        <main className="min-h-[calc(100vh-65px)]">
          {children}
        </main>
      </div>
    </div>
  );
} 