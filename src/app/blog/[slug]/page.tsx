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
                  className="prose prose-lg max-w-none mb-8"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />

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
