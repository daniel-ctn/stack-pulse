import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const title = 'StackPulse — AI-summarised GitHub releases for the libraries you ship with'
const description =
  'Track GitHub releases for React, Next.js, Tailwind, Drizzle, and any other library. StackPulse turns every changelog into a scannable AI digest — breaking changes flagged, new features highlighted, code snippets included.'

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: title,
    template: '%s · StackPulse',
  },
  description,
  applicationName: 'StackPulse',
  generator: 'Next.js',
  category: 'developer tools',
  keywords: [
    'github releases',
    'github release tracker',
    'changelog summary',
    'ai changelog',
    'release notes',
    'dependency updates',
    'library updates',
    'framework releases',
    'breaking changes',
    'developer tools',
    'open source release notes',
    'react release notes',
    'next.js release notes',
    'package updates',
  ],
  authors: [{ name: 'Daniel', url: 'https://github.com/daniel-ctn' }],
  creator: 'Daniel',
  publisher: 'StackPulse',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title,
    description,
    url: appUrl,
    siteName: 'StackPulse',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    creator: '@daniel_ctn',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
