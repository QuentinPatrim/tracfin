import { ClerkProvider } from '@clerk/nextjs'
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import type { Metadata, Viewport } from 'next'
import CookieNotice from '@/components/legal/CookieNotice'
import PwaRegister from '@/components/pwa/PwaRegister'

// Identité « Étiquette » (voir DESIGN.md) : une seule famille, Plus Jakarta Sans,
// du texte courant (400) aux grands titres (800). JetBrains Mono pour les vraies données.
const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans-face',
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
  // Installée sur l'écran d'accueil (voir app/manifest.ts) : plein écran sur iPhone.
  appleWebApp: { capable: true, title: 'Klaris', statusBarStyle: 'default' },
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

export const viewport: Viewport = {
  themeColor: '#F5F7FF',
  // L'app installée occupe tout l'écran ; les marges de sécurité (encoche, barre
  // d'accueil) sont gérées en CSS avec env(safe-area-inset-*).
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="fr" className={`${sans.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
        <body>
          {/* Identité claire uniquement : le thème est fixé à « light » avant le premier rendu.
              Défaut = préférence système ; sinon choix mémorisé. N'affecte que les
              pages publiques (.klaris-public) ; le dashboard reste inchangé. */}
          <script
            dangerouslySetInnerHTML={{
              __html:
                "document.documentElement.setAttribute('data-theme','light');",
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
          <PwaRegister />
        </body>
      </html>
    </ClerkProvider>
  )
}
