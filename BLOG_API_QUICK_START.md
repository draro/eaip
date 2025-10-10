# Blog API - Quick Start Guide

## Setup (5 minutes)

### 1. Generate API Key
```bash
openssl rand -hex 32
```
Copy the output (e.g., `a1b2c3d4e5f6...`)

### 2. Update .env File
```bash
# Add to .env
BLOG_API_KEY=your-generated-key-here
```

### 3. Restart Server
```bash
npm run build
npm start
```

## Test the API

### Option 1: Use Test Script
```bash
# Update API key in test-blog-api.sh
./test-blog-api.sh
```

### Option 2: Manual cURL Test
```bash
curl -X POST http://localhost:3000/api/blog \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key-here" \
  -d '{
    "title": "My First Blog Post",
    "content": "<h2>Hello World</h2><p>This is my first blog post.</p>",
    "category": "Test",
    "tags": ["test", "demo"]
  }'
```

## View Your Blog
Open browser: `http://localhost:3000/blog`

## HTML Content Formatting

Your content will be properly styled with:
- **Headings**: `<h1>`, `<h2>`, `<h3>`, `<h4>`
- **Paragraphs**: `<p>`
- **Lists**: `<ul>`, `<ol>`, `<li>`
- **Bold/Italic**: `<strong>`, `<em>`
- **Links**: `<a href="...">`
- **Blockquotes**: `<blockquote>`
- **Code**: `<code>`, `<pre>`
- **Images**: `<img src="..." alt="...">`
- **Tables**: `<table>`, `<th>`, `<td>`

### Example HTML Content
```html
<h2>Introduction to eAIP</h2>
<p>Electronic AIP (eAIP) systems are revolutionizing how Civil Aviation Authorities manage aeronautical information.</p>

<h3>Key Benefits</h3>
<ul>
  <li><strong>ICAO Compliance</strong>: Full Annex 15 compliance</li>
  <li><strong>Efficiency</strong>: 70% faster publication</li>
  <li><strong>Security</strong>: Enterprise-grade protection</li>
</ul>

<h3>Getting Started</h3>
<p>To implement eAIP in your organization:</p>
<ol>
  <li>Assess current AIP workflow</li>
  <li>Plan migration strategy</li>
  <li>Deploy multi-tenant platform</li>
  <li>Train staff and go live</li>
</ol>

<blockquote>
  <p>"The transition to eAIP improved our publication time by 70% while ensuring full ICAO compliance." - CAA Director</p>
</blockquote>

<h3>Conclusion</h3>
<p>Modern eAIP platforms provide the tools aviation authorities need to manage information efficiently and compliantly.</p>
```

## Minimum Required Fields

```json
{
  "title": "Your Title Here",
  "content": "<p>Your HTML content here</p>"
}
```

All other fields are optional and will be auto-generated.

## Auto-Generated Features

- **Slug**: Generated from title
- **Excerpt**: First 200 characters of content
- **Reading Time**: Calculated from word count
- **Published Date**: Current timestamp
- **SEO Metadata**: Generated from title/excerpt

## Common Use Cases

### 1. Daily Automated Posts (n8n)
Import `n8n-blog-workflow.json` into n8n

### 2. RSS Feed Import
```javascript
// n8n Code Node
const rssItems = $input.all();
const posts = rssItems.map(item => ({
  title: item.json.title,
  content: item.json.content,
  excerpt: item.json.description,
  publishedAt: item.json.pubDate,
  category: item.json.category || 'General',
  tags: item.json.tags || []
}));
return posts;
```

### 3. Manual Publishing
Use Postman or any HTTP client:
- URL: `POST http://your-domain.com/api/blog`
- Header: `x-api-key: your-key`
- Body: JSON with title and content

## Troubleshooting

### Issue: 401 Unauthorized
**Solution**: Check API key in request header matches .env file

### Issue: Content not showing formatting
**Solution**: Ensure content is valid HTML. The new styling will handle:
- All standard HTML tags
- Responsive images
- Professional typography
- Color-coded links
- Styled blockquotes and code blocks

### Issue: Slug already exists
**Solution**:
- Don't specify slug, let it auto-generate
- Or append timestamp: `slug: "my-post-" + Date.now()`

### Issue: Missing categories/tags
**Solution**: Categories and tags are auto-populated from published posts

## n8n Setup

1. **Import Workflow**: Upload `n8n-blog-workflow.json`
2. **Add API Key**: Set environment variable `BLOG_API_KEY`
3. **Configure OpenAI**: Add OpenAI credentials
4. **Update Domain**: Change URL to your domain
5. **Test**: Run workflow manually first
6. **Schedule**: Enable daily schedule

## API Reference

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/blog` | GET | No | List posts with pagination |
| `/api/blog` | POST | Yes | Create new post |
| `/api/blog/[slug]` | GET | No | Get single post |
| `/api/blog/[slug]` | PUT | Yes | Update post |
| `/api/blog/[slug]` | DELETE | Yes | Delete post |

## Complete Documentation

See `BLOG_API_DOCUMENTATION.md` for full API reference with all parameters and examples.

## Support

- Check server logs for detailed errors
- Verify MongoDB connection
- Test API key authentication
- Validate JSON syntax
- Check HTML content is properly formatted

## Next Steps

1. Set up your API key
2. Test with curl or test script
3. Import n8n workflow
4. Configure OpenAI for AI-generated content
5. Schedule daily posts
6. Monitor your blog at `/blog`

Your blog is now ready for automated content publishing! 🚀
