import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ReportIQ',
  description: 'Universal reporting intelligence layer',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
