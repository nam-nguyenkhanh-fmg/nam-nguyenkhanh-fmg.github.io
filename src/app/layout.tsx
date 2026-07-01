import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const viewport = {
  themeColor: '#000000',
}

export const metadata = {
  title: 'FMG Tools - Your Comprehensive Toolkit',
  description: 'FMG Tools provides a collection of useful utilities and resources to help developers and professionals streamline their workflow.',
  keywords: 'tools, productivity, development, utilities, FMG',
  authors: [{ name: 'FMG Tools Team' }],
  creator: 'FMG Tools',
  publisher: 'FMG Tools',
  robots: 'index, follow',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'FMG Tools',
  },
  openGraph: {
    title: 'FMG Tools - Your Comprehensive Toolkit',
    description: 'FMG Tools provides a collection of useful utilities and resources to help developers and professionals streamline their workflow.',
    url: 'https://nam-nguyenkhanh-fmg.github.io/fmg.tools',
    siteName: 'FMG Tools',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}