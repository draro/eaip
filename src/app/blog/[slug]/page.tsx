'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import PublicNav from '@/components/PublicNav';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Clock,
  Eye,
  User,
  ArrowLeft,
  Share2,
  Tag
} from 'lucide-react';

interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: {
    name: string;
    email?: string;
    avatar?: string;
  };
  category: string;
  tags: string[];
  featuredImage?: string;
  publishedAt: string;
  readingTime: number;
  views: number;
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
}

export default function BlogPostPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchPost();
    }
  }, [slug]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/blog/${slug}`);
      const data = await response.json();

      if (data.success) {
        setPost(data.data);
      }
    } catch (error) {
      console.error('Error fetching blog post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share && post) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    }
  };

  if (loading) {
    return (
      <>
        <PublicNav />
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="animate-pulse">
              <div className="h-12 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-8"></div>
              <div className="h-96 bg-gray-200 rounded mb-8"></div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!post) {
    return (
      <>
        <PublicNav />
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Article Not Found</h1>
            <p className="text-gray-600 mb-8">The article you are looking for does not exist.</p>
            <Link href="/blog">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Blog
              </Button>
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PublicNav />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.title,
            description: post.excerpt,
            image: post.featuredImage,
            datePublished: post.publishedAt,
            author: {
              '@type': 'Person',
              name: post.author.name,
            },
            publisher: {
              '@type': 'Organization',
              name: 'eAIP Platform',
              logo: {
                '@type': 'ImageObject',
                url: `${window.location.origin}/icon-192.png`,
              },
            },
            keywords: post.tags.join(', '),
          }),
        }}
      />

      <div className="min-h-screen bg-gray-50">
        <article className="py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link href="/blog">
              <Button variant="ghost" className="mb-6">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Blog
              </Button>
            </Link>

            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              {post.featuredImage && (
                <div className="h-96 overflow-hidden">
                  <img
                    src={post.featuredImage}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="p-8">
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="secondary">{post.category}</Badge>
                </div>

                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  {post.title}
                </h1>

                <div className="flex items-center gap-6 text-gray-600 mb-8 pb-8 border-b">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    <span>{post.author.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    <span>{post.readingTime} min read</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    <span>{post.views} views</span>
                  </div>
                </div>

                <div
                  className="blog-content mb-8"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />

                <style jsx>{`
                  .blog-content {
                    line-height: 1.75;
                    color: #374151;
                  }

                  .blog-content :global(h1) {
                    font-size: 2.25rem;
                    font-weight: 800;
                    margin-top: 2rem;
                    margin-bottom: 1rem;
                    color: #111827;
                    line-height: 1.2;
                  }

                  .blog-content :global(h2) {
                    font-size: 1.875rem;
                    font-weight: 700;
                    margin-top: 2rem;
                    margin-bottom: 1rem;
                    color: #111827;
                    line-height: 1.3;
                  }

                  .blog-content :global(h3) {
                    font-size: 1.5rem;
                    font-weight: 600;
                    margin-top: 1.5rem;
                    margin-bottom: 0.75rem;
                    color: #1f2937;
                    line-height: 1.4;
                  }

                  .blog-content :global(h4) {
                    font-size: 1.25rem;
                    font-weight: 600;
                    margin-top: 1.5rem;
                    margin-bottom: 0.75rem;
                    color: #1f2937;
                  }

                  .blog-content :global(p) {
                    margin-bottom: 1.25rem;
                    font-size: 1.125rem;
                  }

                  .blog-content :global(ul),
                  .blog-content :global(ol) {
                    margin-bottom: 1.25rem;
                    margin-left: 1.5rem;
                    font-size: 1.125rem;
                  }

                  .blog-content :global(ul) {
                    list-style-type: disc;
                  }

                  .blog-content :global(ol) {
                    list-style-type: decimal;
                  }

                  .blog-content :global(li) {
                    margin-bottom: 0.5rem;
                    padding-left: 0.5rem;
                  }

                  .blog-content :global(li > ul),
                  .blog-content :global(li > ol) {
                    margin-top: 0.5rem;
                    margin-bottom: 0.5rem;
                  }

                  .blog-content :global(strong) {
                    font-weight: 600;
                    color: #111827;
                  }

                  .blog-content :global(em) {
                    font-style: italic;
                  }

                  .blog-content :global(a) {
                    color: #2563eb;
                    text-decoration: underline;
                  }

                  .blog-content :global(a:hover) {
                    color: #1d4ed8;
                  }

                  .blog-content :global(blockquote) {
                    border-left: 4px solid #2563eb;
                    padding-left: 1.5rem;
                    margin: 1.5rem 0;
                    font-style: italic;
                    color: #4b5563;
                    background-color: #f9fafb;
                    padding: 1rem 1.5rem;
                    border-radius: 0.25rem;
                  }

                  .blog-content :global(code) {
                    background-color: #f3f4f6;
                    padding: 0.25rem 0.5rem;
                    border-radius: 0.25rem;
                    font-family: ui-monospace, monospace;
                    font-size: 0.875em;
                    color: #ef4444;
                  }

                  .blog-content :global(pre) {
                    background-color: #1f2937;
                    color: #f9fafb;
                    padding: 1rem;
                    border-radius: 0.5rem;
                    overflow-x: auto;
                    margin-bottom: 1.25rem;
                  }

                  .blog-content :global(pre code) {
                    background-color: transparent;
                    padding: 0;
                    color: inherit;
                  }

                  .blog-content :global(img) {
                    max-width: 100%;
                    height: auto;
                    border-radius: 0.5rem;
                    margin: 1.5rem 0;
                  }

                  .blog-content :global(table) {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 1.25rem;
                  }

                  .blog-content :global(th),
                  .blog-content :global(td) {
                    border: 1px solid #e5e7eb;
                    padding: 0.75rem;
                    text-align: left;
                  }

                  .blog-content :global(th) {
                    background-color: #f9fafb;
                    font-weight: 600;
                  }

                  .blog-content :global(hr) {
                    border: none;
                    border-top: 1px solid #e5e7eb;
                    margin: 2rem 0;
                  }
                `}</style>

                {post.tags.length > 0 && (
                  <div className="flex items-start gap-3 mb-8 pb-8 border-b">
                    <Tag className="h-5 w-5 text-gray-500 mt-1" />
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {post.author.avatar && (
                      <img
                        src={post.author.avatar}
                        alt={post.author.name}
                        className="w-12 h-12 rounded-full"
                      />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{post.author.name}</p>
                      {post.author.email && (
                        <p className="text-sm text-gray-600">{post.author.email}</p>
                      )}
                    </div>
                  </div>

                  <Button onClick={handleShare} variant="outline">
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </article>
      </div>
    </>
  );
}
