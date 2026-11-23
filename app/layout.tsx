import { ClerkProvider } from '@clerk/nextjs'
import { Instrument_Sans, Instrument_Serif, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import type { Metadata } from 'next'
import CookieNotice from '@/components/legal/CookieNotice'

// Identité « Registre » (voir DESIGN.md) : texte et interface en Instrument Sans,
// grands titres en Instrument Serif, vraies données en JetBrains Mono.
const sans = Instrument_Sans({
  subsets: ['latin'],
  axes: ['wdth'],
  variable: '--font-sans-face',
  display: 'swap',
})

const serif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-serif-face',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://klaris-app.fr'
const SITE_DESC =
  'Klaris aide les agences immobilières à tenir leurs dossiers LCB-FT : fiche client remplie en ligne, niveau de vigilance, conservation cinq ans, attestation horodatée. Dossiers hébergés en Union européenne.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Klaris — Conformité LCB-FT pour agences immobilières',
  description: SITE_DESC,
  applicationName: 'Klaris',
  keywords: [
    'LCB-FT', 'KYC', 'conformité', 'agent immobilier', 'TRACFIN', 'DGCCRF',
    'attestation', 'lutte anti-blanchiment', 'vigilance', 'RGPD',
  ],
  authors: [{ name: 'Klaris' }],
  creator: 'Klaris',
  publisher: 'Klaris',
  alternates: { canonical: '/' },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: SITE_URL,
    siteName: 'Klaris',
    title: 'Klaris — Conformité LCB-FT, sans stress',
    description: SITE_DESC,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Klaris — Conformité LCB-FT, sans stress',
    description: SITE_DESC,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="fr" className={`${sans.variable} ${serif.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
        <body>
          {/* Thème public clair/sombre appliqué avant le premier rendu (anti-FOUC).
              Défaut = préférence système ; sinon choix mémorisé. N'affecte que les
              pages publiques (.klaris-public) ; le dashboard reste inchangé. */}
          <script
            dangerouslySetInnerHTML={{
              __html:
                "(function(){try{var t=localStorage.getItem('klaris-theme');var d=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;var r=(t==='light'||t==='dark')?t:(d?'dark':'light');document.documentElement.setAttribute('data-theme',r);}catch(e){document.documentElement.setAttribute('data-theme','light');}})();",
            }}
          />
          {/* Données structurées (SEO / rich results) */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@graph': [
                  {
                    '@type': 'Organization',
                    name: 'Klaris',
                    url: SITE_URL,
                    description: SITE_DESC,
                    areaServed: 'FR',
                  },
                  {
                    '@type': 'WebSite',
                    name: 'Klaris',
                    url: SITE_URL,
                    inLanguage: 'fr-FR',
                  },
                  {
                    '@type': 'SoftwareApplication',
                    name: 'Klaris',
                    applicationCategory: 'BusinessApplication',
                    operatingSystem: 'Web',
                    description: SITE_DESC,
                    offers: { '@type': 'Offer', priceCurrency: 'EUR', category: 'SaaS' },
                  },
                ],
              }),
            }}
          />
          {children}
          <CookieNotice />
        </body>
      </html>
    </ClerkProvider>
  )
}
