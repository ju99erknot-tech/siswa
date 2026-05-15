import type { Metadata } from 'next'
import Providers from '@/components/providers/Providers'
import './globals.css'

const schoolName = process.env.NEXT_PUBLIC_SCHOOL_NAME || 'SDN 02 CIBADAK'

export const metadata: Metadata = {
  title: `Portal Kesiswaan — ${schoolName}`,
  description: `Sistem Informasi Kesiswaan Digital ${schoolName}`,
  icons: { icon: process.env.NEXT_PUBLIC_SCHOOL_LOGO_URL || '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="dark" style={{ colorScheme: 'dark' }} data-scroll-behavior="smooth">
      <body className="font-sans antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
