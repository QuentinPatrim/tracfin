import { ClerkProvider } from '@clerk/nextjs'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import type { Metadata } from 'next'
import CookieNotice from '@/components/legal/CookieNotice'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://klaris-app.fr'
const SITE_DESC =
  'Klaris est la plateforme française de conformité LCB-FT pour les professionnels assujettis. Fiches KYC sécurisées, scoring de risque automatique, conservation 5 ans, attestations opposables. Hébergement souverain UE, conforme RGPD.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Klaris — Conformité LCB-FT pour agences immobilières',
  description: SITE_DESC,
  applicationName: 'Klaris',
  keywords: [
    'LCB-FT', 'KYC', 'conformité', 'agent immobilier', 'TRACFIN', 'DGCCRF',
    'attestation de conformité', 'lutte anti-blanchiment', 'vigilance', 'RGPD', 'souveraineté',
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
      <html lang="fr" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
        <body>
          {/* Thème public clair/sombre appliqué avant le premier rendu (anti-FOUC).
              Défaut = préférence système ; sinon choix mémorisé. N'affecte que les
              pages publiques (.klaris-public) ; le dashboard reste inchangé. */}
          <script
            dangerouslySetInnerHTML={{
              __html:
                "(function(){try{var t=localStorage.getItem('klaris-theme');var d=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;var r=(t==='light'||t==='dark')?t:(d?'dark':'light');document.documentElement.setAttribute('data-theme',r);}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();",
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
