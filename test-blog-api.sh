#!/bin/bash

# Test Blog API Script
# Usage: ./test-blog-api.sh

# Configuration
API_URL="http://localhost:3000/api/blog"
API_KEY="your-api-key-here"  # Update this with your actual API key

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Testing Blog API...${NC}\n"

# Test 1: Create a blog post
echo -e "${YELLOW}Test 1: Creating a blog post...${NC}"
CREATE_RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "title": "Test Article: ICAO Annex 15 Compliance",
    "content": "<h2>Introduction</h2><p>This is a test article about ICAO Annex 15 compliance.</p><h3>Key Points</h3><ul><li>Point 1: Safety is paramount</li><li>Point 2: Compliance is mandatory</li><li>Point 3: Quality assurance is essential</li></ul><h3>Conclusion</h3><p>Following ICAO standards ensures safe aviation operations worldwide.</p>",
    "excerpt": "A comprehensive guide to ICAO Annex 15 compliance for aviation authorities.",
    "category": "Compliance",
    "tags": ["ICAO", "Compliance", "AIP", "Aviation Safety"],
    "author": {
      "name": "Test User",
      "email": "test@example.com"
    },
    "status": "published",
    "seo": {
      "metaTitle": "ICAO Annex 15 Compliance Guide | eAIP Blog",
      "metaDescription": "Learn about ICAO Annex 15 compliance requirements for civil aviation authorities.",
      "keywords": ["ICAO", "Annex 15", "Compliance"]
    }
  }')

if echo "$CREATE_RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}✓ Blog post created successfully${NC}"
  SLUG=$(echo "$CREATE_RESPONSE" | grep -o '"slug":"[^"]*"' | cut -d'"' -f4)
  echo -e "  Slug: ${GREEN}$SLUG${NC}\n"
else
  echo -e "${RED}✗ Failed to create blog post${NC}"
  echo "$CREATE_RESPONSE"
  exit 1
fi

# Test 2: Get all blog posts
echo -e "${YELLOW}Test 2: Fetching all blog posts...${NC}"
LIST_RESPONSE=$(curl -s "$API_URL?page=1&limit=10")

if echo "$LIST_RESPONSE" | grep -q '"success":true'; then
  TOTAL=$(echo "$LIST_RESPONSE" | grep -o '"total":[0-9]*' | cut -d':' -f2)
  echo -e "${GREEN}✓ Blog posts retrieved successfully${NC}"
  echo -e "  Total posts: ${GREEN}$TOTAL${NC}\n"
else
  echo -e "${RED}✗ Failed to fetch blog posts${NC}"
  echo "$LIST_RESPONSE"
fi

# Test 3: Get single blog post
echo -e "${YELLOW}Test 3: Fetching single blog post by slug...${NC}"
if [ ! -z "$SLUG" ]; then
  SINGLE_RESPONSE=$(curl -s "$API_URL/$SLUG")

  if echo "$SINGLE_RESPONSE" | grep -q '"success":true'; then
    TITLE=$(echo "$SINGLE_RESPONSE" | grep -o '"title":"[^"]*"' | head -1 | cut -d'"' -f4)
    VIEWS=$(echo "$SINGLE_RESPONSE" | grep -o '"views":[0-9]*' | cut -d':' -f2)
    echo -e "${GREEN}✓ Blog post retrieved successfully${NC}"
    echo -e "  Title: ${GREEN}$TITLE${NC}"
    echo -e "  Views: ${GREEN}$VIEWS${NC}\n"
  else
    echo -e "${RED}✗ Failed to fetch blog post${NC}"
    echo "$SINGLE_RESPONSE"
  fi
else
  echo -e "${RED}✗ No slug available to test${NC}\n"
fi

# Test 4: Update blog post
echo -e "${YELLOW}Test 4: Updating blog post...${NC}"
if [ ! -z "$SLUG" ]; then
  UPDATE_RESPONSE=$(curl -s -X PUT "$API_URL/$SLUG" \
    -H "Content-Type: application/json" \
    -H "x-api-key: $API_KEY" \
    -d '{
      "title": "Updated: ICAO Annex 15 Compliance Guide",
      "content": "<h2>Updated Introduction</h2><p>This article has been updated with the latest information.</p>"
    }')

  if echo "$UPDATE_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ Blog post updated successfully${NC}\n"
  else
    echo -e "${RED}✗ Failed to update blog post${NC}"
    echo "$UPDATE_RESPONSE\n"
  fi
else
  echo -e "${RED}✗ No slug available to test${NC}\n"
fi

# Test 5: Search blog posts
echo -e "${YELLOW}Test 5: Searching blog posts...${NC}"
SEARCH_RESPONSE=$(curl -s "$API_URL?search=ICAO&limit=5")

if echo "$SEARCH_RESPONSE" | grep -q '"success":true'; then
  RESULTS=$(echo "$SEARCH_RESPONSE" | grep -o '"posts":\[[^]]*\]' | grep -o '{"_id"' | wc -l)
  echo -e "${GREEN}✓ Search completed successfully${NC}"
  echo -e "  Results found: ${GREEN}$RESULTS${NC}\n"
else
  echo -e "${RED}✗ Search failed${NC}"
  echo "$SEARCH_RESPONSE\n"
fi

# Test 6: Filter by category
echo -e "${YELLOW}Test 6: Filtering by category...${NC}"
FILTER_RESPONSE=$(curl -s "$API_URL?category=Compliance&limit=5")

if echo "$FILTER_RESPONSE" | grep -q '"success":true'; then
  CATEGORIES=$(echo "$FILTER_RESPONSE" | grep -o '"categories":\[[^]]*\]' | tr ',' '\n' | grep -o '"[^"]*"' | wc -l)
  echo -e "${GREEN}✓ Category filter working${NC}"
  echo -e "  Categories available: ${GREEN}$CATEGORIES${NC}\n"
else
  echo -e "${RED}✗ Category filter failed${NC}"
  echo "$FILTER_RESPONSE\n"
fi

# Test 7: Delete blog post (cleanup)
echo -e "${YELLOW}Test 7: Deleting test blog post...${NC}"
if [ ! -z "$SLUG" ]; then
  DELETE_RESPONSE=$(curl -s -X DELETE "$API_URL/$SLUG" \
    -H "x-api-key: $API_KEY")

  if echo "$DELETE_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ Blog post deleted successfully${NC}\n"
  else
    echo -e "${RED}✗ Failed to delete blog post${NC}"
    echo "$DELETE_RESPONSE\n"
  fi
else
  echo -e "${RED}✗ No slug available to test${NC}\n"
fi

# Summary
echo -e "${YELLOW}================================${NC}"
echo -e "${GREEN}All tests completed!${NC}"
echo -e "${YELLOW}================================${NC}\n"

echo -e "View your blog at: ${GREEN}http://localhost:3000/blog${NC}"
echo -e "API Documentation: ${GREEN}BLOG_API_DOCUMENTATION.md${NC}\n"
