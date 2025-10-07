import { MetadataRoute } from 'next';
import connectDB from '@/lib/mongodb';
import Organization from '@/models/Organization';
import AIPDocument from '@/models/AIPDocument';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  try {
    await connectDB();

    // Get all organizations with public domains
    const organizations = await Organization.find({
      'settings.enablePublicAccess': true,
      domain: { $exists: true, $ne: '' }
    }).select('domain updatedAt').lean();

    // Get all published documents
    const documents = await AIPDocument.find({
      status: 'published'
    })
      .populate('organization', 'domain')
      .select('_id updatedAt organization')
      .lean();

    const sitemapEntries: MetadataRoute.Sitemap = [
      // Root
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      },
    ];

    // Add organization pages
    organizations.forEach((org: any) => {
      sitemapEntries.push({
        url: `${baseUrl}/public/${org.domain}`,
        lastModified: org.updatedAt || new Date(),
        changeFrequency: 'weekly',
        priority: 0.9,
      });
    });

    // Add document pages
    documents.forEach((doc: any) => {
      if (doc.organization?.domain) {
        sitemapEntries.push({
          url: `${baseUrl}/public/${doc.organization.domain}/${doc._id}`,
          lastModified: doc.updatedAt || new Date(),
          changeFrequency: 'monthly',
          priority: 0.8,
        });
      }
    });

    return sitemapEntries;
  } catch (error) {
    console.error('Error generating sitemap:', error);

    // Return minimal sitemap on error
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      },
    ];
  }
}
