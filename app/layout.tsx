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

export const metadata: Metadata = {
  title: 'Klaris — Conformité LCB-FT pour agences immobilières',
  description: 'Générez des fiches KYC sécurisées et obtenez un score de risque LCB-FT automatique pour chaque transaction. Hébergement en France, conforme RGPD.',
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
          {children}
          <CookieNotice />
        </body>
      </html>
    </ClerkProvider>
  )
}
