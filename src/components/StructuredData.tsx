'use client';

import Script from 'next/script';

interface OrganizationData {
  name: string;
  country: string;
  icaoCode?: string;
  branding?: {
    logoUrl?: string;
    primaryColor?: string;
  };
  contact?: {
    email?: string;
    website?: string;
  };
}

interface DocumentData {
  _id: string;
  title: string;
  documentType: string;
  effectiveDate: string;
  airacCycle?: string;
  metadata?: {
    authority?: string;
    language?: string;
  };
}

interface StructuredDataProps {
  type: 'organization' | 'document' | 'dataset';
  organization: OrganizationData;
  document?: DocumentData;
  url?: string;
}

export default function StructuredData({ type, organization, document, url }: StructuredDataProps) {
  const baseStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: organization.name,
    description: `Official aeronautical information authority for ${organization.country}`,
    url: url || '',
    logo: organization.branding?.logoUrl || '',
    contactPoint: {
      '@type': 'ContactPoint',
      email: organization.contact?.email || '',
      contactType: 'Aviation Information',
      areaServed: organization.country,
    },
    sameAs: organization.contact?.website ? [organization.contact.website] : [],
    identifier: organization.icaoCode || '',
  };

  let structuredData: any = baseStructuredData;

  if (type === 'document' && document) {
    structuredData = {
      '@context': 'https://schema.org',
      '@type': 'GovernmentService',
      name: document.title,
      description: `${document.documentType} for ${organization.country} - ${document.title}`,
      provider: {
        '@type': 'GovernmentOrganization',
        name: organization.name,
        areaServed: {
          '@type': 'Country',
          name: organization.country,
        },
      },
      serviceType: 'Aeronautical Information Publication',
      category: document.documentType,
      datePublished: document.effectiveDate,
      inLanguage: document.metadata?.language || 'en',
      url: url || '',
      audience: {
        '@type': 'Audience',
        audienceType: 'Aviation Professionals, Pilots, Flight Planners',
      },
      isAccessibleForFree: true,
      additionalProperty: [
        {
          '@type': 'PropertyValue',
          name: 'AIRAC Cycle',
          value: document.airacCycle || '',
        },
        {
          '@type': 'PropertyValue',
          name: 'Document Type',
          value: document.documentType,
        },
        {
          '@type': 'PropertyValue',
          name: 'Authority',
          value: document.metadata?.authority || organization.name,
        },
        {
          '@type': 'PropertyValue',
          name: 'ICAO Compliance',
          value: 'ICAO Annex 15',
        },
      ],
    };
  }

  if (type === 'dataset') {
    structuredData = {
      '@context': 'https://schema.org',
      '@type': 'Dataset',
      name: `${organization.name} Aeronautical Information Publications`,
      description: `Comprehensive collection of aeronautical information publications, NOTAMs, supplements, and aviation charts for ${organization.country}. ICAO Annex 15 compliant eAIP dataset.`,
      url: url || '',
      keywords: [
        'eAIP',
        'Aeronautical Information Publication',
        'NOTAM',
        'aviation',
        'AIRAC',
        organization.country,
        'ICAO',
      ],
      creator: {
        '@type': 'Organization',
        name: organization.name,
        identifier: organization.icaoCode || '',
      },
      publisher: {
        '@type': 'Organization',
        name: organization.name,
      },
      license: 'https://creativecommons.org/licenses/by/4.0/',
      isAccessibleForFree: true,
      dateModified: new Date().toISOString().split('T')[0],
    };
  }

  return (
    <Script
      id="structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      strategy="beforeInteractive"
    />
  );
}
