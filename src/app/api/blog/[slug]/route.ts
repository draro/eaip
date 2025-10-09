import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import BlogPost from '@/models/BlogPost';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await connectDB();

    const post = await BlogPost.findOne({
      slug: params.slug,
      status: 'published'
    });

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Blog post not found' },
        { status: 404 }
      );
    }

    post.views += 1;
    await post.save();

    return NextResponse.json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch blog post' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
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
    const updateData = { ...body };

    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.views;

    const post = await BlogPost.findOneAndUpdate(
      { slug: params.slug },
      updateData,
      { new: true, runValidators: true }
    );

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Blog post not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: post,
      message: 'Blog post updated successfully'
    });
  } catch (error) {
    console.error('Error updating blog post:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update blog post' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
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

    const post = await BlogPost.findOneAndDelete({ slug: params.slug });

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Blog post not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Blog post deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete blog post' },
      { status: 500 }
    );
  }
}
