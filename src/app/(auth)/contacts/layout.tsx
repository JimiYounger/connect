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
    <div className={`${inter.className} bg-slate-50 text-foreground min-h-screen`}>
      <div className="bg-white">
        <header className="border-b border-slate-200">
          <div className="container mx-auto px-4 md:px-8 py-4">
            <h1 className="text-2xl font-bold text-slate-900">Team Directory</h1>
          </div>
        </header>
        <main>
          {children}
        </main>
      </div>
    </div>
  );
} 