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
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'FMG Tools',
  },
  openGraph: {
    title: 'FMG Tools - Your Comprehensive Toolkit',
    description: 'FMG Tools provides a collection of useful utilities and resources to help developers and professionals streamline their workflow.',
    url: 'https://nam-nguyenkhanh-fmg.github.io',
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
      <body className={inter.className}>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(reg) {
                    console.log('SW registered: ', reg.scope);
                  }).catch(function(err) {
                    console.log('SW registration failed: ', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}