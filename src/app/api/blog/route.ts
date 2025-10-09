import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import BlogPost from '@/models/BlogPost';

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');
    const tag = searchParams.get('tag');
    const status = searchParams.get('status') || 'published';
    const search = searchParams.get('search');

    const query: any = { status };

    if (category) {
      query.category = category;
    }

    if (tag) {
      query.tags = tag;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      BlogPost.find(query)
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-content')
        .lean(),
      BlogPost.countDocuments(query)
    ]);

    const categories = await BlogPost.distinct('category', { status: 'published' });
    const tags = await BlogPost.distinct('tags', { status: 'published' });

    return NextResponse.json({
      success: true,
      data: {
        posts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        categories,
        tags
      }
    });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch blog posts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key');
    const expectedApiKey = process.env.BLOG_API_KEY;

    if (!expectedApiKey || apiKey !== expectedApiKey) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Invalid API key' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();

    if (!body.title || !body.content) {
      return NextResponse.json(
        { success: false, error: 'Title and content are required' },
        { status: 400 }
      );
    }

    let slug = body.slug;
    if (!slug) {
      slug = generateSlug(body.title);

      const existingPost = await BlogPost.findOne({ slug });
      if (existingPost) {
        slug = `${slug}-${Date.now()}`;
      }
    }

    const postData = {
      title: body.title,
      slug,
      excerpt: body.excerpt || body.content.substring(0, 200) + '...',
      content: body.content,
      author: {
        name: body.author?.name || 'eAIP Team',
        email: body.author?.email,
        avatar: body.author?.avatar
      },
      category: body.category || 'General',
      tags: body.tags || [],
      featuredImage: body.featuredImage,
      publishedAt: body.publishedAt ? new Date(body.publishedAt) : new Date(),
      status: body.status || 'published',
      seo: {
        metaTitle: body.seo?.metaTitle || body.title,
        metaDescription: body.seo?.metaDescription || body.excerpt,
        keywords: body.seo?.keywords || body.tags || [],
        canonicalUrl: body.seo?.canonicalUrl
      },
      organization: body.organizationId
    };

    const post = await BlogPost.create(postData);

    return NextResponse.json({
      success: true,
      data: post,
      message: 'Blog post created successfully'
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating blog post:', error);

    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'A post with this slug already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create blog post' },
      { status: 500 }
    );
  }
}
