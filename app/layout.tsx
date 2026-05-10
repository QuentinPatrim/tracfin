import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'
import type { Metadata } from 'next'

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
      <html lang="fr">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}