import type { Metadata } from "next";
import SessionProvider from "@/components/providers/SessionProvider";
import "./globals.css";
import "../styles/eaip.css";


const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://eaip.flyclim.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'eAIP Platform - Electronic Aeronautical Information Publication Management',
    template: '%s | eAIP Platform'
  },
  description: 'Professional ICAO Annex 15 & EUROCONTROL Spec 3.0 compliant eAIP management platform for Civil Aviation Authorities. Secure, scalable solution for creating, managing, and publishing aeronautical information publications.',
  keywords: [
    'eAIP', 'electronic AIP', 'Aeronautical Information Publication',
    'ICAO Annex 15', 'EUROCONTROL Specification 3.0', 'NOTAM',
    'Civil Aviation', 'Aviation Authority', 'AIP Management',
    'AIRAC Cycle', 'Aviation Compliance', 'Document Management',
    'Aviation Software', 'ANS Provider', 'Flight Information'
  ],
  authors: [{ name: 'FlyClim', url: 'https://flyclim.com' }],
  creator: 'FlyClim',
  publisher: 'FlyClim',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'eAIP Platform',
    title: 'eAIP Platform - Electronic Aeronautical Information Publication Management',
    description: 'Professional ICAO Annex 15 & EUROCONTROL Spec 3.0 compliant eAIP management platform for Civil Aviation Authorities.',
    images: [
      {
        url: '/icon-192.png',
        width: 192,
        height: 192,
        alt: 'eAIP Platform Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'eAIP Platform - Electronic Aeronautical Information Publication Management',
    description: 'Professional ICAO Annex 15 & EUROCONTROL compliant eAIP management platform.',
    images: ['/icon-192.png'],
    creator: '@flyclim',
  },
  alternates: {
    canonical: siteUrl,
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
  verification: {
    google: '621deeb84ab9b3fe',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'eAIP Platform',
              url: siteUrl,
              description: 'Professional electronic AIP management platform for Civil Aviation Authorities',
              applicationCategory: 'BusinessApplication',
              operatingSystem: 'Web',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
              },
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.8',
                ratingCount: '47',
                bestRating: '5',
                worstRating: '1',
              },
              featureList: [
                'ICAO Annex 15 Compliance',
                'EUROCONTROL Spec 3.0 Support',
                'NOTAM Management',
                'Multi-format Export',
                'Version Control',
                'Workflow Management',
                'Multi-tenant Architecture',
              ],
            }),
          }}
        />
      </head>
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}