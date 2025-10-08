'use client';

import { useEffect } from 'react';

interface Organization {
  name: string;
  country: string;
  icaoCode?: string;
  contact: {
    email: string;
    website?: string;
  };
  branding: {
    logoUrl?: string;
  };
}

interface Document {
  _id: string;
  title: string;
  documentType: string;
  country: string;
  airacCycle: string;
  effectiveDate: string;
  metadata?: {
    authority: string;
    language: string;
  };
  sections?: any[];
}

interface Props {
  organization: Organization;
  document?: Document;
  domain: string;
}

export default function SEOStructuredData({ organization, document, domain }: Props) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const baseUrl = window.location.origin;
    const addedScripts: HTMLScriptElement[] = [];

    // Organization Schema
    const organizationSchema = {
      '@context': 'https://schema.org',
      '@type': 'GovernmentOrganization',
      name: organization.name,
      description: `Official aviation authority providing electronic Aeronautical Information Publication (eAIP) for ${organization.country}`,
      url: `${baseUrl}/public/${domain}`,
      email: organization.contact.email,
      ...(organization.contact.website && { sameAs: [organization.contact.website] }),
      ...(organization.branding.logoUrl && {
        logo: {
          '@type': 'ImageObject',
          url: organization.branding.logoUrl,
          width: '250',
          height: '250',
        },
      }),
      address: {
        '@type': 'PostalAddress',
        addressCountry: organization.country,
      },
      ...(organization.icaoCode && {
        identifier: {
          '@type': 'PropertyValue',
          propertyID: 'ICAO Code',
          value: organization.icaoCode,
        },
      }),
    };

    // Website Schema
    const websiteSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: `${organization.name} eAIP`,
      description: `Electronic Aeronautical Information Publication for ${organization.country}`,
      url: `${baseUrl}/public/${domain}`,
      publisher: {
        '@type': 'GovernmentOrganization',
        name: organization.name,
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${baseUrl}/public/${domain}?search={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
      about: {
        '@type': 'Thing',
        name: 'Aeronautical Information',
        description: 'Official aviation navigation and safety information',
      },
    };

    // Breadcrumb Schema
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: baseUrl,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: `${organization.name} eAIP`,
          item: `${baseUrl}/public/${domain}`,
        },
        ...(document
          ? [
              {
                '@type': 'ListItem',
                position: 3,
                name: document.title,
                item: `${baseUrl}/public/${domain}/${document._id}`,
              },
            ]
          : []),
      ],
    };

    // Document Schema (if document is provided)
    let documentSchema = null;
    if (document) {
      documentSchema = {
        '@context': 'https://schema.org',
        '@type': 'GovernmentService',
        name: document.title,
        description: `${document.documentType} - Aeronautical Information Publication document for ${document.country}`,
        url: `${baseUrl}/public/${domain}/${document._id}`,
        provider: {
          '@type': 'GovernmentOrganization',
          name: organization.name,
        },
        serviceType: document.documentType,
        areaServed: {
          '@type': 'Country',
          name: document.country,
        },
        availableLanguage: document.metadata?.language || 'en',
        datePublished: document.effectiveDate,
        isAccessibleForFree: true,
        ...(document.sections &&
          document.sections.length > 0 && {
            hasPart: document.sections.slice(0, 10).map((section: any, index: number) => ({
              '@type': 'WebPageElement',
              name: section.title,
              position: index + 1,
            })),
          }),
        keywords: [
          'eAIP',
          'aeronautical information',
          document.documentType,
          'AIRAC ' + document.airacCycle,
          organization.name,
          document.country,
          'ICAO',
          'aviation',
          'flight planning',
        ].join(', '),
        inLanguage: document.metadata?.language || 'en',
        about: {
          '@type': 'Thing',
          name: 'Aviation Safety and Navigation',
          description: 'Official aeronautical information for flight planning and air navigation',
        },
      };

      // FAQ Schema if document has sections
      if (document.sections && document.sections.length > 0) {
        const faqSchema = {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: document.sections.slice(0, 5).map((section: any) => ({
            '@type': 'Question',
            name: section.title,
            acceptedAnswer: {
              '@type': 'Answer',
              text: section.content ? section.content.substring(0, 500) : section.title,
            },
          })),
        };

        // Inject FAQ schema
        const faqScript = window.document.createElement('script');
        faqScript.type = 'application/ld+json';
        faqScript.text = JSON.stringify(faqSchema);
        faqScript.setAttribute('data-component', 'seo-structured-data');
        window.document.head.appendChild(faqScript);
        addedScripts.push(faqScript);
      }
    }

    // Inject all schemas
    const schemas = [organizationSchema, websiteSchema, breadcrumbSchema, documentSchema].filter(Boolean);

    schemas.forEach((schema) => {
      const script = window.document.createElement('script');
      script.type = 'application/ld+json';
      script.text = JSON.stringify(schema);
      script.setAttribute('data-component', 'seo-structured-data');
      window.document.head.appendChild(script);
      addedScripts.push(script);
    });

    // Cleanup function
    return () => {
      try {
        addedScripts.forEach((script) => {
          if (script && script.parentNode) {
            script.parentNode.removeChild(script);
          }
        });
      } catch (error) {
        console.debug('SEOStructuredData cleanup error (safe to ignore):', error);
      }
    };
  }, [organization, document, domain]);

  return null; // This component doesn't render anything
}
