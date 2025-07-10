// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { Inter } from 'next/font/google'
import { Providers } from '@/providers/providers'
import AppHeightHandler from '@/components/AppHeightHandler'
import PWAHandler from '@/components/PWAHandler'
import AuthLoadingHandler from '@/components/AuthLoadingHandler'
import PWAInstallPrompt from '@/components/PWAInstallPrompt'

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
    url: "https://plpconnect.com",
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
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />

        {/* Android: Link to Manifest & Set Theme Color */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />

      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col ${inter.className}`}
        style={{
          backgroundColor: '#000000',
          // overflow: 'hidden' // Let CSS handle this based on pwa-mode
        }}
      >
        <Providers>
          {/* Client-side components to handle PWA and auth */}
          <AppHeightHandler />
          <PWAHandler />
          <AuthLoadingHandler />
          <PWAInstallPrompt />
          <main id="pwa-main-content" className="w-full bg-black text-black"> 
            {children}
          </main>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
