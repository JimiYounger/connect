// my-app/src/app/(auth)/admin/dashboards/layout.tsx

import { ReactNode } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface DashboardsLayoutProps {
  children: ReactNode;
  params: any;
}

export default function DashboardsLayout({ children }: DashboardsLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-muted/40 border-b">
        <div className="container mx-auto py-2">
          <nav className="flex text-sm text-muted-foreground">
            <ol className="flex items-center space-x-1">
              <li>
                <Link 
                  href="/admin" 
                  className="hover:text-foreground transition-colors"
                >
                  Admin
                </Link>
              </li>
              <li className="flex items-center">
                <ChevronRight className="h-4 w-4 mx-1" />
                <Link 
                  href="/admin/dashboards" 
                  className="hover:text-foreground transition-colors"
                >
                  Dashboards
                </Link>
              </li>
            </ol>
          </nav>
        </div>
      </div>
      
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
} 