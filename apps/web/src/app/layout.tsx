import type { Metadata } from 'next'

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
      <body style={{margin:0, padding:0, fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"}}>{children}</body>
    </html>
  )
}
