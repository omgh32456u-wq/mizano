import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Sans_Arabic } from 'next/font/google'
import { AppProviders } from '@/components/shell/app-providers'
import './globals.css'

const plex = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plex-arabic',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Mizano',
  description: 'Mizano is a private, offline-friendly food and macro tracker with Egyptian foods and full Arabic and English support.',
  applicationName: 'Mizano',
  appleWebApp: { capable: true, title: 'Mizano', statusBarStyle: 'default' },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8f7f2' },
    { media: '(prefers-color-scheme: dark)', color: '#111a16' },
  ],
}

/** Applies saved language/theme before first paint to avoid a flash of the wrong direction or theme. */
const bootScript = `(function(){try{var p=JSON.parse(localStorage.getItem('tmm:prefs')||'{}');var l=p.locale==='ar'?'ar':'en';var t=p.theme||'system';var d=document.documentElement;d.lang=l;d.dir=l==='ar'?'rtl':'ltr';var k=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);if(k)d.classList.add('dark');d.style.colorScheme=k?'dark':'light';}catch(e){}})();`

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" dir="ltr" className={plex.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body className="min-h-dvh font-sans antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
