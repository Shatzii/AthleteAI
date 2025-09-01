# Go4It Sports Platform - CMS Documentation

## Overview

The Go4It Sports Platform now includes a comprehensive Content Management System (CMS) that serves as both an admin dashboard and marketing hub. The CMS enables content creation, media management, campaign tracking, and international sports journalism.

## Features

### 🏆 Admin Dashboard
- **Content Management**: Create, edit, and publish articles, pages, and media
- **Marketing Hub**: Manage marketing campaigns and track performance
- **Analytics**: Monitor site metrics and campaign effectiveness
- **User Management**: Admin-level user controls and permissions

### 📝 Content Management
- **Articles**: Create sports journalism content with SEO optimization
- **Pages**: Build static pages with customizable templates
- **Media Library**: Upload and manage images, videos, and documents
- **Categories**: Organize content by sport (Football, Basketball, Baseball, etc.)

### 📢 Marketing Tools
- **Campaign Management**: Create and track marketing campaigns
- **Performance Analytics**: Monitor campaign ROI and engagement
- **Targeted Content**: Reach specific audiences (students, coaches, parents)
- **Budget Tracking**: Monitor campaign spending and effectiveness

### 🌍 International Sports Journalism
- **Global Coverage**: Dedicated section for international sports news
- **Multi-Sport Focus**: Football, basketball, baseball, tennis, and more
- **SEO Optimized**: Content designed for search engine visibility
- **Newsletter Integration**: Email subscription for sports updates

## Getting Started

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Seed Initial Data
```bash
npm run seed:cms
```

### 3. Start the Backend
```bash
npm start
```

### 4. Start the Frontend
```bash
cd ../frontend
npm start
```

## API Endpoints

### Articles
- `GET /api/articles` - Get all published articles
- `GET /api/articles/:slug` - Get single article by slug
- `POST /api/articles` - Create new article (admin only)
- `PUT /api/articles/:id` - Update article (admin only)
- `DELETE /api/articles/:id` - Delete article (admin only)

### Pages
- `GET /api/pages` - Get all published pages
- `GET /api/pages/:slug` - Get single page by slug
- `POST /api/pages` - Create new page (admin only)
- `PUT /api/pages/:id` - Update page (admin only)
- `DELETE /api/pages/:id` - Delete page (admin only)

### Media
- `GET /api/media` - Get all media files
- `POST /api/media/upload` - Upload new media file
- `PUT /api/media/:id` - Update media metadata
- `DELETE /api/media/:id` - Delete media file

### Campaigns
- `GET /api/campaigns` - Get all campaigns (admin only)
- `POST /api/campaigns` - Create new campaign (admin only)
- `PUT /api/campaigns/:id` - Update campaign (admin only)
- `DELETE /api/campaigns/:id` - Delete campaign (admin only)

## User Roles

### Admin Users
- Full access to CMS features
- Create, edit, and delete all content
- Manage campaigns and marketing
- Access to analytics and reporting
- User management capabilities

### Regular Users
- Read access to published content
- Comment on articles
- Like and share content
- Subscribe to newsletters

## Content Types

### Articles
- **Title**: SEO-optimized headline
- **Content**: Rich text with formatting
- **Category**: Sport-specific categorization
- **Tags**: Keyword tagging for search
- **SEO Fields**: Meta title, description, keywords
- **Featured Image**: Hero image for the article
- **Status**: Draft, Published, Archived

### Pages
- **Templates**: Default, Landing, About, Contact, Marketing
- **Sections**: Modular content blocks
- **SEO Optimization**: Meta tags and structured data
- **Custom Layouts**: Flexible page building

### Media Files
- **File Upload**: Support for images, videos, documents
- **Metadata**: Alt text, captions, categories
- **Thumbnails**: Auto-generated image previews
- **CDN Integration**: Optimized file delivery

### Marketing Campaigns
- **Campaign Types**: Newsletter, Social, Email, Webinar, Event, Partnership
- **Target Audience**: Students, Coaches, Parents, Schools, All
- **Budget Tracking**: Allocated vs. spent amounts
- **Performance Metrics**: Impressions, clicks, conversions, ROI
- **Scheduling**: Start/end dates and time zones

## International Sports Section

The `/international-sports` route features:
- **Global Coverage**: News from Brazil, Europe, Asia, and beyond
- **Category Filtering**: Filter by sport and region
- **Featured Articles**: Prominent placement for breaking news
- **Newsletter Signup**: Email subscriptions for updates
- **SEO Optimization**: Search-friendly content structure

## Security Features

- **Authentication**: JWT-based user authentication
- **Authorization**: Role-based access control
- **File Upload Security**: Type validation and size limits
- **Input Sanitization**: XSS protection and data validation
- **Rate Limiting**: API request throttling

## Analytics & Reporting

- **Content Performance**: Article views, engagement metrics
- **Campaign Analytics**: ROI, conversion rates, audience reach
- **User Behavior**: Popular content, traffic sources
- **SEO Performance**: Search rankings and organic traffic

## Future Enhancements

- **Advanced Editor**: Rich text editor with media embedding
- **Workflow Management**: Content approval processes
- **Multi-language Support**: International content localization
- **API Integrations**: Social media, email marketing, analytics
- **Advanced Analytics**: Machine learning-powered insights

## Support

For technical support or feature requests, please contact the development team or create an issue in the project repository.
