# Blog API Documentation

Complete API documentation for automating blog posts from n8n or other workflow tools.

## Authentication

All write operations (POST, PUT, DELETE) require API key authentication.

Add the API key to your request headers:
```
x-api-key: your-secure-api-key-here
```

## Environment Setup

1. Generate a secure API key:
```bash
openssl rand -hex 32
```

2. Add to `.env` file:
```
BLOG_API_KEY=your-generated-api-key
```

## API Endpoints

### 1. Create Blog Post

**POST** `/api/blog`

Creates a new blog post.

#### Headers
```
Content-Type: application/json
x-api-key: your-api-key
```

#### Request Body
```json
{
  "title": "Understanding ICAO Annex 15 Compliance",
  "slug": "understanding-icao-annex-15-compliance",
  "excerpt": "Learn about the key requirements of ICAO Annex 15 for aeronautical information services.",
  "content": "<h2>Introduction</h2><p>Full HTML content here...</p>",
  "author": {
    "name": "John Smith",
    "email": "john@example.com",
    "avatar": "https://example.com/avatar.jpg"
  },
  "category": "Compliance",
  "tags": ["ICAO", "Compliance", "AIP", "Aviation"],
  "featuredImage": "https://example.com/image.jpg",
  "publishedAt": "2025-10-09T10:00:00Z",
  "status": "published",
  "seo": {
    "metaTitle": "ICAO Annex 15 Compliance Guide | eAIP",
    "metaDescription": "Complete guide to ICAO Annex 15 compliance requirements.",
    "keywords": ["ICAO", "Annex 15", "Compliance"],
    "canonicalUrl": "https://eaip.flyclim.com/blog/understanding-icao-annex-15-compliance"
  }
}
```

#### Required Fields
- `title` (string): Article title
- `content` (string): Full article content (HTML supported)

#### Optional Fields
- `slug` (string): URL-friendly identifier (auto-generated from title if not provided)
- `excerpt` (string): Short summary (auto-generated from content if not provided)
- `author` (object): Author information
  - `name` (string): Default: "eAIP Team"
  - `email` (string)
  - `avatar` (string): URL to avatar image
- `category` (string): Default: "General"
- `tags` (array of strings): Post tags
- `featuredImage` (string): URL to featured image
- `publishedAt` (string): ISO date string (default: current time)
- `status` (string): "draft" | "published" | "archived" (default: "published")
- `seo` (object): SEO metadata
  - `metaTitle` (string)
  - `metaDescription` (string)
  - `keywords` (array of strings)
  - `canonicalUrl` (string)

#### Response (201 Created)
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Understanding ICAO Annex 15 Compliance",
    "slug": "understanding-icao-annex-15-compliance",
    "excerpt": "Learn about the key requirements...",
    "content": "<h2>Introduction</h2><p>Full HTML content...</p>",
    "author": {
      "name": "John Smith",
      "email": "john@example.com"
    },
    "category": "Compliance",
    "tags": ["ICAO", "Compliance", "AIP"],
    "readingTime": 5,
    "views": 0,
    "publishedAt": "2025-10-09T10:00:00.000Z",
    "createdAt": "2025-10-09T10:00:00.000Z",
    "updatedAt": "2025-10-09T10:00:00.000Z"
  },
  "message": "Blog post created successfully"
}
```

#### Error Responses

**400 Bad Request** - Missing required fields
```json
{
  "success": false,
  "error": "Title and content are required"
}
```

**401 Unauthorized** - Invalid API key
```json
{
  "success": false,
  "error": "Unauthorized - Invalid API key"
}
```

**409 Conflict** - Slug already exists
```json
{
  "success": false,
  "error": "A post with this slug already exists"
}
```

### 2. List Blog Posts

**GET** `/api/blog`

Retrieve blog posts with pagination and filtering.

#### Query Parameters
- `page` (number): Page number (default: 1)
- `limit` (number): Posts per page (default: 10)
- `category` (string): Filter by category
- `tag` (string): Filter by tag
- `status` (string): Filter by status (default: "published")
- `search` (string): Search in title, excerpt, and content

#### Example
```
GET /api/blog?page=1&limit=10&category=Compliance&search=ICAO
```

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "title": "Understanding ICAO Annex 15 Compliance",
        "slug": "understanding-icao-annex-15-compliance",
        "excerpt": "Learn about the key requirements...",
        "author": {
          "name": "John Smith"
        },
        "category": "Compliance",
        "tags": ["ICAO", "Compliance"],
        "featuredImage": "https://example.com/image.jpg",
        "publishedAt": "2025-10-09T10:00:00.000Z",
        "readingTime": 5,
        "views": 150
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 45,
      "pages": 5
    },
    "categories": ["Compliance", "Technology", "Industry News"],
    "tags": ["ICAO", "AIP", "NOTAM", "AIRAC"]
  }
}
```

### 3. Get Single Blog Post

**GET** `/api/blog/{slug}`

Retrieve a single blog post by slug. Also increments view count.

#### Example
```
GET /api/blog/understanding-icao-annex-15-compliance
```

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Understanding ICAO Annex 15 Compliance",
    "slug": "understanding-icao-annex-15-compliance",
    "excerpt": "Learn about the key requirements...",
    "content": "<h2>Introduction</h2><p>Full HTML content...</p>",
    "author": {
      "name": "John Smith",
      "email": "john@example.com"
    },
    "category": "Compliance",
    "tags": ["ICAO", "Compliance", "AIP"],
    "publishedAt": "2025-10-09T10:00:00.000Z",
    "readingTime": 5,
    "views": 151
  }
}
```

### 4. Update Blog Post

**PUT** `/api/blog/{slug}`

Update an existing blog post.

#### Headers
```
Content-Type: application/json
x-api-key: your-api-key
```

#### Request Body
Same as create, only include fields to update:
```json
{
  "title": "Updated Title",
  "content": "<p>Updated content...</p>",
  "status": "published"
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "data": { /* updated post */ },
  "message": "Blog post updated successfully"
}
```

### 5. Delete Blog Post

**DELETE** `/api/blog/{slug}`

Delete a blog post.

#### Headers
```
x-api-key: your-api-key
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Blog post deleted successfully"
}
```

## n8n Workflow Example

### Daily Blog Post Automation

1. **Trigger**: Schedule (daily at 9:00 AM)
2. **HTTP Request Node**:
   - Method: POST
   - URL: `https://your-domain.com/api/blog`
   - Headers:
     - `Content-Type`: `application/json`
     - `x-api-key`: `{{ $env.BLOG_API_KEY }}`
   - Body:
   ```json
   {
     "title": "{{ $json.title }}",
     "content": "{{ $json.content }}",
     "excerpt": "{{ $json.excerpt }}",
     "category": "{{ $json.category }}",
     "tags": {{ $json.tags }},
     "featuredImage": "{{ $json.image }}",
     "author": {
       "name": "AI Writer",
       "email": "ai@example.com"
     }
   }
   ```

### AI-Generated Content Workflow

1. **Trigger**: Schedule or Webhook
2. **OpenAI/Claude Node**: Generate article content
3. **Code Node**: Format content as HTML
4. **HTTP Request Node**: POST to `/api/blog`
5. **Notification**: Send success/error notification

## Content Guidelines

### HTML Content
The `content` field accepts HTML. Recommended structure:
```html
<h2>Section Title</h2>
<p>Paragraph text with <strong>bold</strong> and <em>italic</em> formatting.</p>

<h3>Subsection</h3>
<ul>
  <li>List item 1</li>
  <li>List item 2</li>
</ul>

<blockquote>
  <p>Important quote or callout</p>
</blockquote>

<img src="https://example.com/image.jpg" alt="Description" />
```

### SEO Best Practices
- **Title**: 50-60 characters
- **Excerpt**: 150-160 characters
- **Meta Description**: 150-160 characters
- **Keywords**: 3-10 relevant keywords
- **Featured Image**: 1200x630px (16:9 ratio)

### Categories
Recommended categories:
- Compliance
- Technology
- Industry News
- Best Practices
- Product Updates
- Case Studies
- Tutorials

### Tags
Use specific, relevant tags:
- ICAO, EUROCONTROL
- AIP, NOTAM, AIRAC
- Aviation, Civil Aviation
- Document Management
- Version Control
- Workflow
- Automation

## Rate Limiting

No rate limiting is currently implemented. Consider implementing on your end:
- Recommended: Max 100 posts per day
- Burst limit: Max 10 posts per minute

## Testing

### cURL Example
```bash
curl -X POST https://your-domain.com/api/blog \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "title": "Test Article",
    "content": "<p>Test content</p>",
    "category": "Test",
    "tags": ["test"]
  }'
```

### Postman Collection
Import this configuration into Postman for easy testing:
- Base URL: `https://your-domain.com/api/blog`
- Authorization: API Key in header `x-api-key`

## Support

For issues or questions:
- Check server logs for detailed error messages
- Verify API key is correct
- Ensure all required fields are provided
- Validate JSON syntax
