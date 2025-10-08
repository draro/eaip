import { MetadataRoute } from 'next';
import connectDB from '@/lib/mongodb';
import Organization from '@/models/Organization';
import AIPDocument from '@/models/AIPDocument';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    await connectDB();

    const sitemapEntries: MetadataRoute.Sitemap = [];

    // Get all organizations with custom domains
    const organizations = await Organization.find({
      customDomain: { $exists: true, $ne: null, $ne: '' },
      isActive: true
    }).select('customDomain domain updatedAt').lean();

    for (const org of organizations) {
      const orgDomain = org.customDomain as string;

      // Add organization homepage with custom domain
      sitemapEntries.push({
        url: `https://${orgDomain}`,
        lastModified: org.updatedAt || new Date(),
        changeFrequency: 'weekly',
        priority: 1.0,
      });

      // Get all published documents for this organization
      const documents = await AIPDocument.find({
        organizationId: org._id,
        status: 'published',
      })
        .select('_id title updatedAt')
        .lean();

      // Add each document page with custom domain
      for (const doc of documents) {
        sitemapEntries.push({
          url: `https://${orgDomain}/${doc._id}`,
          lastModified: doc.updatedAt || new Date(),
          changeFrequency: 'monthly',
          priority: 0.8,
        });
      }
    }

    // Also add organizations accessible via subdomain/path
    const orgsByDomain = await Organization.find({
      domain: { $exists: true, $ne: null, $ne: '' },
      'settings.enablePublicAccess': true,
    }).select('domain updatedAt').lean();

    const baseUrl = process.env.NEXTAUTH_URL || 'https://eaip.flyclim.com';

    for (const org of orgsByDomain) {
      sitemapEntries.push({
        url: `${baseUrl}/public/${org.domain}`,
        lastModified: org.updatedAt || new Date(),
        changeFrequency: 'weekly',
        priority: 0.9,
      });

      // Get documents for this organization
      const documents = await AIPDocument.find({
        organizationId: org._id,
        status: 'published',
      })
        .select('_id updatedAt')
        .lean();

      for (const doc of documents) {
        sitemapEntries.push({
          url: `${baseUrl}/public/${org.domain}/${doc._id}`,
          lastModified: doc.updatedAt || new Date(),
          changeFrequency: 'monthly',
          priority: 0.7,
        });
      }
    }

    return sitemapEntries;
  } catch (error) {
    console.error('Error generating sitemap:', error);

    // Return empty array on error
    return [];
  }
}
