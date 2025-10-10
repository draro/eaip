import { MetadataRoute } from "next";
import connectDB from "@/lib/mongodb";
import Organization from "@/models/Organization";
import AIPDocument from "@/models/AIPDocument";
import BlogPost from "@/models/BlogPost";

export const dynamic = "force-dynamic";
export const revalidate = 3600; // Revalidate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    await connectDB();

    const baseUrl = "https://eaip.flyclim.com";

    const sitemapEntries: MetadataRoute.Sitemap = [];

    // Add main website pages (public, no authentication required)
    const mainPages = [
      { url: baseUrl, priority: 1.0, changeFrequency: "daily" as const },
      {
        url: `${baseUrl}/about`,
        priority: 0.8,
        changeFrequency: "monthly" as const,
      },
      {
        url: `${baseUrl}/contact`,
        priority: 0.7,
        changeFrequency: "monthly" as const,
      },
      {
        url: `${baseUrl}/features/overview`,
        priority: 0.9,
        changeFrequency: "weekly" as const,
      },
      {
        url: `${baseUrl}/features/document-management`,
        priority: 0.8,
        changeFrequency: "weekly" as const,
      },
      {
        url: `${baseUrl}/features/notam-management`,
        priority: 0.8,
        changeFrequency: "weekly" as const,
      },
      {
        url: `${baseUrl}/features/compliance`,
        priority: 0.8,
        changeFrequency: "weekly" as const,
      },
      {
        url: `${baseUrl}/features/workflow`,
        priority: 0.8,
        changeFrequency: "weekly" as const,
      },
      {
        url: `${baseUrl}/features/export`,
        priority: 0.8,
        changeFrequency: "weekly" as const,
      },
      {
        url: `${baseUrl}/features/version-control`,
        priority: 0.8,
        changeFrequency: "weekly" as const,
      },
      {
        url: `${baseUrl}/blog`,
        priority: 0.9,
        changeFrequency: "daily" as const,
      },
    ];

    mainPages.forEach((page) => {
      sitemapEntries.push({
        url: page.url,
        lastModified: new Date(),
        changeFrequency: page.changeFrequency,
        priority: page.priority,
      });
    });

    // Add blog posts
    const blogPosts = await BlogPost.find({
      status: "published",
    })
      .select("slug updatedAt")
      .sort({ publishedAt: -1 })
      .lean();

    for (const post of blogPosts) {
      sitemapEntries.push({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: post.updatedAt || new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }

    // Get all organizations with custom domains
    const organizations = await Organization.find({
      customDomain: { $exists: true, $ne: null },
      isActive: true,
    })
      .select("customDomain domain updatedAt")
      .lean();

    for (const org of organizations) {
      const orgDomain = org.customDomain as string;

      // Add organization homepage with custom domain
      sitemapEntries.push({
        url: `https://${orgDomain}`,
        lastModified: org.updatedAt || new Date(),
        changeFrequency: "weekly",
        priority: 1.0,
      });

      // Get all published documents for this organization
      const documents = await AIPDocument.find({
        organizationId: org._id,
        status: "published",
      })
        .select("_id title updatedAt")
        .lean();

      // Add each document page with custom domain
      for (const doc of documents) {
        sitemapEntries.push({
          url: `https://${orgDomain}/${doc._id}`,
          lastModified: doc.updatedAt || new Date(),
          changeFrequency: "monthly",
          priority: 0.8,
        });
      }
    }

    // Also add organizations accessible via subdomain/path
    const orgsByDomain = await Organization.find({
      domain: { $exists: true, $ne: null },
      "settings.enablePublicAccess": true,
    })
      .select("domain updatedAt")
      .lean();

    for (const org of orgsByDomain) {
      sitemapEntries.push({
        url: `${baseUrl}/public/${org.domain}`,
        lastModified: org.updatedAt || new Date(),
        changeFrequency: "weekly",
        priority: 0.9,
      });

      // Get documents for this organization
      const documents = await AIPDocument.find({
        organizationId: org._id,
        status: "published",
      })
        .select("_id updatedAt")
        .lean();

      for (const doc of documents) {
        sitemapEntries.push({
          url: `${baseUrl}/public/${org.domain}/${doc._id}`,
          lastModified: doc.updatedAt || new Date(),
          changeFrequency: "monthly",
          priority: 0.7,
        });
      }
    }

    return sitemapEntries;
  } catch (error) {
    console.error("Error generating sitemap:", error);

    // Return empty array on error
    return [];
  }
}
