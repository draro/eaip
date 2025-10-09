import { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://eaip.flyclim.com';

export const metadata: Metadata = {
  title: 'About eAIP Platform - ICAO Compliant Aviation Software',
  description: 'Learn about our ICAO Annex 15 & EUROCONTROL Spec 3.0 compliant eAIP platform. Trusted by Civil Aviation Authorities worldwide for secure aeronautical information management.',
  keywords: [
    'About eAIP',
    'Aviation Software Company',
    'ICAO Compliance',
    'EUROCONTROL Specification',
    'Civil Aviation Authority Solutions',
    'AIP Management System',
    'FlyClim',
  ],
  openGraph: {
    title: 'About eAIP Platform - ICAO Compliant Aviation Software',
    description: 'Professional ICAO Annex 15 & EUROCONTROL compliant eAIP management platform trusted by aviation authorities worldwide.',
    url: `${siteUrl}/about`,
    type: 'website',
    images: [
      {
        url: '/icon-192.png',
        width: 192,
        height: 192,
        alt: 'eAIP Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About eAIP Platform - ICAO Compliant Aviation Software',
    description: 'Professional ICAO & EUROCONTROL compliant eAIP management platform.',
    images: ['/icon-192.png'],
  },
  alternates: {
    canonical: `${siteUrl}/about`,
  },
};
