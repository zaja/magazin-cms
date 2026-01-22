# API Reference - Magazin CMS

## Base URL

```
http://localhost:3000/api
```

## Authentication

API koristi cookie-based autentikaciju za admin operacije. Javni endpoints ne zahtijevaju autentikaciju.

---

## Posts

### Get All Posts

```http
GET /api/posts
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 10, max: 50) |
| `category` | string | Filter by category slug |
| `tag` | string | Filter by tag slug |

**Response:**

```json
{
  "docs": [
    {
      "id": "123",
      "title": "Post Title",
      "slug": "post-title",
      "excerpt": "Short description...",
      "publishedAt": "2024-01-15T10:30:00.000Z",
      "readingTime": 5,
      "categories": [...],
      "tags": [...]
    }
  ],
  "totalDocs": 100,
  "totalPages": 10,
  "page": 1,
  "limit": 10,
  "hasNextPage": true,
  "hasPrevPage": false
}
```

### Get Single Post

```http
GET /api/posts/:slug
```

**Response:**

```json
{
  "id": "123",
  "title": "Post Title",
  "slug": "post-title",
  "excerpt": "Short description...",
  "content": {...},
  "heroImage": {...},
  "publishedAt": "2024-01-15T10:30:00.000Z",
  "readingTime": 5,
  "viewCount": 150,
  "allowComments": true,
  "categories": [...],
  "tags": [...],
  "authors": [...],
  "meta": {
    "title": "SEO Title",
    "description": "SEO Description",
    "image": {...}
  }
}
```

---

## Comments

### Get Comments for Post

```http
GET /api/comments?postId=:postId
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `postId` | string | Yes | Post ID |

**Response:**

```json
{
  "docs": [
    {
      "id": "456",
      "content": "Great article!",
      "author": {
        "name": "John Doe",
        "avatar": "https://gravatar.com/..."
      },
      "createdAt": "2024-01-15T12:00:00.000Z",
      "parentComment": null
    }
  ],
  "totalDocs": 5
}
```

### Submit Comment

```http
POST /api/comments
```

**Request Body:**

```json
{
  "postId": "123",
  "name": "John Doe",
  "email": "john@example.com",
  "website": "https://example.com",
  "content": "Great article!",
  "parentCommentId": null,
  "subscribedToReplies": false
}
```

**Response:**

```json
{
  "success": true,
  "message": "Your comment has been submitted and is pending approval.",
  "id": "789"
}
```

---

## Subscribe

### Subscribe to Newsletter

```http
POST /api/subscribe
```

**Request Body:**

```json
{
  "email": "user@example.com",
  "name": "John Doe"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Please check your email to confirm your subscription."
}
```

### Confirm Subscription

```http
GET /api/confirm-subscription?token=:token
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `token` | string | Yes | Confirmation token from email |

**Response:**

```json
{
  "success": true,
  "message": "Your subscription has been confirmed!"
}
```

### Unsubscribe

```http
GET /api/unsubscribe?token=:token
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `token` | string | Yes | Unsubscribe token from email |

**Response:**

```json
{
  "success": true,
  "message": "You have been unsubscribed successfully."
}
```

---

## Cron Endpoints

> **Note:** These endpoints require authentication via `Authorization: Bearer {CRON_SECRET}` header.

### Publish Scheduled Posts

```http
GET /api/cron/publish-scheduled
```

**Headers:**

```
Authorization: Bearer your_cron_secret
```

**Response:**

```json
{
  "success": true,
  "published": 3
}
```

### Cleanup Old Drafts

```http
GET /api/cron/cleanup-drafts
```

**Headers:**

```
Authorization: Bearer your_cron_secret
```

**Response:**

```json
{
  "success": true,
  "deleted": 5
}
```

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message here"
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| `200` | Success |
| `400` | Bad Request - Missing or invalid parameters |
| `401` | Unauthorized - Invalid or missing authentication |
| `404` | Not Found - Resource doesn't exist |
| `429` | Too Many Requests - Rate limit exceeded |
| `500` | Internal Server Error |

---

## Rate Limiting

API endpoints are rate limited to **100 requests per minute** per IP address.

When rate limit is exceeded:

```json
{
  "error": "Too many requests. Please try again later."
}
```

---

## Payload REST API

Za napredne operacije, Payload CMS pruža automatski generirane REST API endpoints:

```
GET    /api/:collection          # List all
GET    /api/:collection/:id      # Get by ID
POST   /api/:collection          # Create
PATCH  /api/:collection/:id      # Update
DELETE /api/:collection/:id      # Delete
```

### Primjeri

```bash
# Get all categories
curl http://localhost:3000/api/categories

# Get single page by ID
curl http://localhost:3000/api/pages/123

# Search posts
curl "http://localhost:3000/api/posts?where[title][contains]=tutorial"
```

Za više detalja pogledajte [Payload REST API dokumentaciju](https://payloadcms.com/docs/rest-api/overview).
