'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import PublicNav from '@/components/PublicNav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Clock,
  Eye,
  Search,
  ArrowRight,
  Tag,
  User
} from 'lucide-react';

interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  author: {
    name: string;
    avatar?: string;
  };
  category: string;
  tags: string[];
  featuredImage?: string;
  publishedAt: string;
  readingTime: number;
  views: number;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchPosts();
  }, [page, selectedCategory, search]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '9'
      });

      if (selectedCategory) {
        params.append('category', selectedCategory);
      }

      if (search) {
        params.append('search', search);
      }

      const response = await fetch(`/api/blog?${params}`);
      const data = await response.json();

      if (data.success) {
        setPosts(data.data.posts);
        setCategories(data.data.categories);
        setTags(data.data.tags);
        setTotalPages(data.data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching blog posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPosts();
  };

  return (
    <>
      <PublicNav />
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-5xl font-bold mb-6">
                Aviation Insights & Updates
              </h1>
              <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-8">
                Expert articles on eAIP management, ICAO compliance, aviation technology, and industry best practices
              </p>

              <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search articles..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10 bg-white text-gray-900"
                    />
                  </div>
                  <Button type="submit" variant="default">
                    Search
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col lg:flex-row gap-8">
            <aside className="lg:w-64 shrink-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <button
                      onClick={() => { setSelectedCategory(''); setPage(1); }}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        !selectedCategory ? 'bg-blue-100 text-blue-900 font-medium' : 'hover:bg-gray-100'
                      }`}
                    >
                      All Articles
                    </button>
                    {categories.map((category) => (
                      <button
                        key={category}
                        onClick={() => { setSelectedCategory(category); setPage(1); }}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                          selectedCategory === category ? 'bg-blue-100 text-blue-900 font-medium' : 'hover:bg-gray-100'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {tags.length > 0 && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Popular Tags</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {tags.slice(0, 12).map((tag) => (
                        <Badge key={tag} variant="secondary" className="cursor-pointer">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </aside>

            <main className="flex-1">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i} className="animate-pulse">
                      <div className="h-48 bg-gray-200"></div>
                      <CardHeader>
                        <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              ) : posts.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-gray-500 text-lg">No articles found</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {posts.map((post) => (
                      <Link key={post._id} href={`/blog/${post.slug}`}>
                        <Card className="h-full hover:shadow-xl transition-all duration-300 cursor-pointer group">
                          {post.featuredImage && (
                            <div className="h-48 overflow-hidden">
                              <img
                                src={post.featuredImage}
                                alt={post.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          )}
                          <CardHeader>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary">{post.category}</Badge>
                            </div>
                            <CardTitle className="text-xl group-hover:text-blue-600 transition-colors line-clamp-2">
                              {post.title}
                            </CardTitle>
                            <CardDescription className="line-clamp-3">
                              {post.excerpt}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center justify-between text-sm text-gray-500">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  <span>{post.readingTime} min</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Eye className="h-4 w-4" />
                                  <span>{post.views}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-4 text-sm text-gray-600">
                              <User className="h-4 w-4" />
                              <span>{post.author.name}</span>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-8">
                      <Button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        variant="outline"
                      >
                        Previous
                      </Button>
                      <div className="flex items-center gap-2">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                          <Button
                            key={p}
                            onClick={() => setPage(p)}
                            variant={page === p ? 'default' : 'outline'}
                            className="w-10"
                          >
                            {p}
                          </Button>
                        ))}
                      </div>
                      <Button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        variant="outline"
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              )}
            </main>
          </div>
        </div>
      </div>
    </>
  );
}
