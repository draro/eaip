import { Metadata } from 'next';
import { notFound } from 'next/navigation';

type Props = {
  params: { domain: string };
  children: React.ReactNode;
};

// Generate dynamic metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { domain } = params;

  try {
    // Fetch organization data for metadata
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/organizations/by-domain?domain=${domain}`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      return {
        title: 'eAIP Not Found',
        description: 'Electronic Aeronautical Information Publication',
      };
    }

    const data = await response.json();
    const org = data.organization;

    return {
      title: `${org.name} - Electronic AIP | Aviation Information`,
      description: `Official electronic Aeronautical Information Publication (eAIP) for ${org.name}. Access current and archived AIP documents, NOTAMs, supplements, and aviation charts for ${org.country}. ICAO ${org.icaoCode || 'compliant'} aeronautical information.`,
      keywords: [
        'eAIP',
        'electronic AIP',
        'Aeronautical Information Publication',
        'aviation',
        'NOTAM',
        'aeronautical charts',
        'flight planning',
        'aviation information',
        'AIRAC',
        org.name,
        org.country,
        org.icaoCode,
        'ICAO Annex 15',
        'air navigation',
        'airspace',
        'airports',
        'aviation safety'
      ].filter(Boolean),
      authors: [{ name: org.name }],
      creator: org.name,
      publisher: org.name,
      formatDetection: {
        email: false,
        address: false,
        telephone: false,
      },
      openGraph: {
        title: `${org.name} - Electronic AIP`,
        description: `Official electronic Aeronautical Information Publication (eAIP) for ${org.name}. ICAO compliant aviation information.`,
        url: `${baseUrl}/public/${domain}`,
        siteName: `${org.name} eAIP`,
        locale: org.settings?.language || 'en_US',
        type: 'website',
        images: org.branding?.logoUrl ? [
          {
            url: org.branding.logoUrl,
            width: 1200,
            height: 630,
            alt: `${org.name} Logo`,
          }
        ] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${org.name} - Electronic AIP`,
        description: `Official eAIP for ${org.name}. ICAO compliant aeronautical information.`,
        images: org.branding?.logoUrl ? [org.branding.logoUrl] : [],
      },
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
      alternates: {
        canonical: `${baseUrl}/public/${domain}`,
      },
      other: {
        'aviation-authority': org.name,
        'icao-code': org.icaoCode || '',
        'country': org.country,
        'document-type': 'eAIP',
        'compliance': 'ICAO Annex 15',
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Electronic AIP',
      description: 'Electronic Aeronautical Information Publication',
    };
  }
}

export default function PublicDomainLayout({ children }: Props) {
  return <>{children}</>;
}
