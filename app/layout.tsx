import type { Metadata } from 'next'
import { DM_Sans } from 'next/font/google'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'SubTrack – Subscription Manager',
  description: 'Track and manage your subscriptions',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={dmSans.variable}>
      <body
        className={dmSans.className}
        style={{ background: '#F4F3F0', margin: 0, padding: 0 }}
      >
        {children}
      </body>
    </html>
  )
}
