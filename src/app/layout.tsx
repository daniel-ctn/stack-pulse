import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
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
const description =
  'Daily AI-powered summaries of the latest framework and library releases. Follow the tools you use, and never miss a breaking change.'

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: 'StackPulse — Every release. One feed.',
    template: '%s · StackPulse',
  },
  description,
  applicationName: 'StackPulse',
  keywords: [
    'github releases',
    'changelog',
    'dependency updates',
    'developer tools',
    'release notes',
    'ai summaries',
  ],
  authors: [{ name: 'StackPulse' }],
  openGraph: {
    title: 'StackPulse — Every release. One feed.',
    description,
    url: appUrl,
    siteName: 'StackPulse',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StackPulse — Every release. One feed.',
    description,
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
