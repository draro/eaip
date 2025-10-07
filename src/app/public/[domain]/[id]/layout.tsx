import { Metadata } from 'next';

type Props = {
  params: { domain: string; id: string };
  children: React.ReactNode;
};

// Generate dynamic metadata for each document
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { domain, id } = params;

  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    // Fetch document data
    const docResponse = await fetch(`${baseUrl}/api/public/${domain}/documents/${id}`, {
      next: { revalidate: 1800 } // Cache for 30 minutes
    });

    if (!docResponse.ok) {
      return {
        title: 'Document Not Found',
        description: 'The requested eAIP document could not be found.',
      };
    }

    const docData = await docResponse.json();
    const doc = docData.data.document;
    const org = docData.data.organization;

    // Build comprehensive description
    const description = `${doc.title} - Official ${doc.documentType} from ${org.name} eAIP. AIRAC Cycle ${doc.airacCycle}. ${doc.metadata?.authority || 'Official'} aeronautical information for ${doc.country}. Effective from ${new Date(doc.effectiveDate).toLocaleDateString()}.`;

    // Extract section titles for keywords
    const sectionKeywords = doc.sections?.slice(0, 10).map((s: any) => s.title) || [];

    return {
      title: `${doc.title} | ${org.name} eAIP`,
      description,
      keywords: [
        doc.title,
        doc.documentType,
        'eAIP',
        'electronic AIP',
        'aeronautical information',
        'AIRAC ' + doc.airacCycle,
        org.name,
        doc.country,
        doc.airport,
        'ICAO',
        'aviation',
        'flight planning',
        'air navigation',
        ...sectionKeywords
      ].filter(Boolean),
      authors: [{ name: org.name }],
      creator: org.name,
      publisher: org.name,
      openGraph: {
        title: doc.title,
        description,
        url: `${baseUrl}/public/${domain}/${id}`,
        siteName: `${org.name} eAIP`,
        type: 'article',
        publishedTime: doc.createdAt,
        modifiedTime: doc.updatedAt,
        locale: doc.metadata?.language || 'en_US',
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
        title: doc.title,
        description,
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
        canonical: `${baseUrl}/public/${domain}/${id}`,
      },
      other: {
        'aviation-authority': org.name,
        'document-type': doc.documentType,
        'airac-cycle': doc.airacCycle,
        'effective-date': doc.effectiveDate,
        'icao-code': org.icaoCode || '',
        'country': doc.country,
        'compliance': 'ICAO Annex 15',
      },
    };
  } catch (error) {
    console.error('Error generating document metadata:', error);
    return {
      title: 'eAIP Document',
      description: 'Electronic Aeronautical Information Publication Document',
    };
  }
}

export default function DocumentLayout({ children }: Props) {
  return <>{children}</>;
}
