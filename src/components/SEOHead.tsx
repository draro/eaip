import Head from 'next/head';

interface SEOHeadProps {
  title: string;
  description: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogType?: string;
  ogImage?: string;
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  structuredData?: Record<string, any>;
  noindex?: boolean;
  nofollow?: boolean;
  locale?: string;
  alternateLocales?: { locale: string; url: string }[];
}

export default function SEOHead({
  title,
  description,
  keywords = [],
  canonicalUrl,
  ogType = 'website',
  ogImage = '/icon-192.png',
  twitterCard = 'summary_large_image',
  author,
  publishedTime,
  modifiedTime,
  structuredData,
  noindex = false,
  nofollow = false,
  locale = 'en_US',
  alternateLocales = [],
}: SEOHeadProps) {
  const fullTitle = title.includes('eAIP') ? title : `${title} | eAIP Platform`;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://eaip.flyclim.com';
  const fullCanonicalUrl = canonicalUrl || siteUrl;
  const fullOgImage = ogImage.startsWith('http') ? ogImage : `${siteUrl}${ogImage}`;

  const robotsContent = [
    noindex ? 'noindex' : 'index',
    nofollow ? 'nofollow' : 'follow',
    'max-image-preview:large',
    'max-snippet:-1',
    'max-video-preview:-1',
  ].join(', ');

  const defaultStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'eAIP Platform',
    url: siteUrl,
    description: 'Professional electronic AIP management platform for Civil Aviation Authorities',
    publisher: {
      '@type': 'Organization',
      name: 'FlyClim',
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/icon-192.png`,
      },
    },
  };

  const combinedStructuredData = structuredData || defaultStructuredData;

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords.length > 0 && <meta name="keywords" content={keywords.join(', ')} />}
      {author && <meta name="author" content={author} />}
      <meta name="robots" content={robotsContent} />
      <meta name="googlebot" content={robotsContent} />
      <link rel="canonical" href={fullCanonicalUrl} />

      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={fullCanonicalUrl} />
      <meta property="og:image" content={fullOgImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content={locale} />
      <meta property="og:site_name" content="eAIP Platform" />
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}

      {alternateLocales.map((alt) => (
        <meta key={alt.locale} property="og:locale:alternate" content={alt.locale} />
      ))}

      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullOgImage} />
      <meta name="twitter:site" content="@flyclim" />
      <meta name="twitter:creator" content="@flyclim" />

      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      <meta name="theme-color" content="#1e3a8a" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="apple-mobile-web-app-title" content="eAIP" />
      <meta name="application-name" content="eAIP Platform" />
      <meta name="msapplication-TileColor" content="#1e3a8a" />

      <meta name="geo.region" content="IT" />
      <meta name="geo.placename" content="Italy" />
      <meta name="dcterms.type" content="Service" />
      <meta name="dcterms.audience" content="Civil Aviation Authorities" />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(combinedStructuredData) }}
      />

      <link rel="icon" href="/favicon.ico" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="manifest" href="/manifest.json" />
    </Head>
  );
}
