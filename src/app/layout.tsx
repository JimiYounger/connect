// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { Inter } from 'next/font/google'
import { Providers } from '@/providers/providers'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "Connect by Purelight",
  description: "Everything You Need In One Place",
  openGraph: {
    title: "Connect by Purelight",
    description: "Everything You Need In One Place",
    url: "https://www.plpconnect.com",
    images: [
      {
        url: "https://ucarecdn.com/43907444-0ddb-4271-a3ec-c28ab182b972/-/preview/1000x1000/",
        width: 1000,
        height: 1000,
        alt: "Connect Thumbnail",
      }
    ],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Connect by Purelight",
    description: "Everything You Need In One Place",
    images: [
      "https://ucarecdn.com/43907444-0ddb-4271-a3ec-c28ab182b972/-/preview/1000x1000/"
    ]
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* iOS: Custom Home Screen Icon & App Title */}
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <meta name="apple-mobile-web-app-title" content="Connect" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

        {/* Android: Link to Manifest & Set Theme Color */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#ffffff" />
        <style>{`
          .auth-loading { display: none; }
          .auth-content { opacity: 1; }
          .loading .auth-loading { display: block; }
          .loading .auth-content { opacity: 0; }
        `}</style>
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                // Check if we're in auth loading state
                if (localStorage.getItem('auth_loading') === 'true') {
                  document.body.classList.add('loading');
                }
                
                // Listen for page load to properly handle auth redirects
                window.addEventListener('load', function() {
                  // If we're on the dashboard page and we were in a loading state
                  if (window.location.pathname.includes('/dashboard') && localStorage.getItem('auth_loading') === 'true') {
                    // Clear the loading state
                    localStorage.removeItem('auth_loading');
                    document.body.classList.remove('loading');
                  }
                  
                  // If we're redirected to home with a ?error or ?redirectedFrom parameter
                  if (window.location.pathname === '/' && 
                      (window.location.search.includes('error') || window.location.search.includes('redirectedFrom'))) {
                    // Clear loading state as something went wrong
                    localStorage.removeItem('auth_loading');
                    document.body.classList.remove('loading');
                  }
                });
              } catch (e) {
                console.error('Auth loading script error:', e);
              }
            })();
          `
        }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col ${inter.className}`}
      >
        <Providers>
          <main className="flex-1 w-full min-h-screen bg-white text-black">
            {children}
          </main>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
