import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import { Home } from 'lucide-react';
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
      <div className="bg-white min-h-screen">
        <header className="border-b border-slate-200">
          <div className="container mx-auto px-4 md:px-8 lg:max-w-6xl py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-slate-900">Team Directory</h1>
              <Link 
                href="/home" 
                className="p-2 rounded-md text-slate-800 hover:bg-slate-100 transition-colors"
                title="Home"
              >
                <Home className="h-5 w-5" />
                <span className="sr-only">Home</span>
              </Link>
            </div>
          </div>
        </header>
        <main className="pb-12">
          {children}
        </main>
      </div>
    </div>
  );
} 