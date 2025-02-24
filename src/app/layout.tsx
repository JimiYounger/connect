// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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

export default async function RootLayout({
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
        <meta name="apple-mobile-web-app-title" content="Connect by Purelight" />
        <meta name="apple-mobile-web-app-capable" content="yes" />

        {/* Android: Link to Manifest & Set Theme Color */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#ffffff" />
        <style>{`
          .auth-loading { display: none; }
          .auth-content { opacity: 1; }
          .loading .auth-loading { display: block; }
          .loading .auth-content { opacity: 0; }
        `}</style>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <main className="flex-1 w-full min-h-screen bg-white text-black">
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}
