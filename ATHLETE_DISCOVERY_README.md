# Athlete Discovery System

## Overview

The AthleteAI platform now includes a comprehensive athlete discovery system that scrapes data from major recruiting websites (Rivals.com, 247Sports.com, Hudl.com) to find and highlight top athletic prospects. This system provides automated athlete discovery, data normalization, and intelligent highlighting based on performance metrics and recruiting data.

## Features

### 🔍 **Automated Web Scraping**
- **Multi-source scraping** from Rivals.com, 247Sports.com, and Hudl.com
- **Rate limiting** to respect website terms of service
- **Error handling** with graceful degradation
- **Resume capability** for interrupted scraping sessions

### 📊 **Data Processing & Normalization**
- **Position standardization** (QB, RB, WR, TE, OL, DL, LB, CB, S, K, P)
- **Height/weight normalization** with consistent formatting
- **Rating scale conversion** (handles different rating systems)
- **Duplicate detection** and deduplication
- **Data validation** and cleaning

### ⭐ **Intelligent Athlete Highlighting**
- **Automated scoring** based on multiple factors:
  - Recruiting ratings from multiple sources
  - Star ratings and rankings
  - Video highlight presence
  - Social media activity
  - Achievements and awards
- **Manual highlighting** for custom selections
- **Highlight categories**: Top Rated, Rising Star, High Potential, Viral Highlight

### 🎥 **Video Highlight Integration**
- **Hudl.com integration** for highlight videos
- **Automated highlight discovery** for top prospects
- **Video metadata** extraction (duration, views, titles)
- **Platform support** for multiple video sources

### 📱 **Social Media Integration**
- **Profile linking** for Twitter, Instagram, and other platforms
- **Social presence scoring** in highlight calculations
- **Automated social media discovery** (future enhancement)

## API Endpoints

### Scraping Endpoints

#### `GET /api/v1/discovery/scrape`
Scrape athletes from recruiting sites.

**Query Parameters:**
- `sport` (string): Sport to scrape (default: 'football')
- `year` (number): Recruiting class year (default: current year)
- `location` (string): Location filter for Hudl scraping
- `limit` (number): Maximum athletes to return (default: 100)
- `includeHighlights` (boolean): Include highlight video scraping

**Response:**
```json
{
  "success": true,
  "message": "Successfully scraped and saved 25 athletes",
  "data": {
    "athletes": [...],
    "metadata": {
      "totalFound": 150,
      "normalized": 145,
      "unique": 140,
      "saved": 25,
      "duration": 4500
    }
  }
}
```

#### `GET /api/v1/discovery/highlighted`
Get all highlighted athletes.

**Query Parameters:**
- `limit` (number): Maximum results (default: 20)
- `sortBy` (string): Sort field (default: 'highlightScore')
- `sortOrder` (string): Sort order ('asc' or 'desc')
- `reason` (string): Filter by highlight reason
- `minScore` (number): Minimum highlight score

#### `POST /api/v1/discovery/auto-highlight`
Automatically highlight top athletes based on criteria.

**Request Body:**
```json
{
  "criteria": {
    "minRating": 80,
    "minStars": 3,
    "hasHighlights": true
  },
  "limit": 25
}
```

#### `POST /api/v1/discovery/:id/highlight`
Highlight a specific athlete.

**Request Body:**
```json
{
  "reason": "top_rated",
  "score": 85
}
```

#### `DELETE /api/v1/discovery/:id/highlight`
Remove highlight from an athlete.

#### `GET /api/v1/discovery/:id/highlights`
Get video highlights for an athlete.

#### `PUT /api/v1/discovery/:id/social-media`
Update athlete social media profiles.

**Request Body:**
```json
{
  "socialMedia": {
    "twitter": "https://twitter.com/username",
    "instagram": "https://instagram.com/username",
    "hudl": "https://www.hudl.com/profile/username"
  }
}
```

#### `GET /api/v1/discovery/stats/scraping`
Get scraping statistics and health metrics.

## Database Schema Extensions

### Enhanced Player Model

The player model has been extended with new fields:

```javascript
{
  // ... existing fields ...

  // Recruiting data from scraping
  recruitingData: {
    source: {
      type: String,
      enum: ['rivals.com', '247sports.com', 'hudl.com', 'manual']
    },
    sourceUrl: String,
    rating: Number,
    location: String,
    recruitingClass: Number,
    sport: { type: String, default: 'football' },
    scrapedAt: Date,
    lastUpdated: Date,
  },

  // Video highlights
  highlights: [{
    title: String,
    url: String,
    thumbnail: String,
    duration: String,
    views: Number,
    platform: {
      type: String,
      enum: ['hudl', 'youtube', 'twitter', 'other'],
      default: 'hudl'
    },
    uploadedAt: Date,
  }],

  // Social media profiles
  socialMedia: {
    twitter: String,
    instagram: String,
    hudl: String,
    rivals: String,
    sports247: String,
  },

  // Highlight flags
  isHighlighted: { type: Boolean, default: false },
  highlightReason: {
    type: String,
    enum: ['top_rated', 'rising_star', 'high_potential', 'viral_highlight', 'scout_interest', 'manual']
  },
  highlightScore: { type: Number, default: 0, min: 0, max: 100 },
}
```

## Usage Examples

### Basic Athlete Scraping

```javascript
// Scrape football athletes from 2025 recruiting class
const response = await fetch('/api/v1/discovery/scrape?sport=football&year=2025&limit=50', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});

const data = await response.json();
console.log(`Found ${data.data.metadata.totalFound} athletes`);
```

### Auto-Highlight Top Prospects

```javascript
const response = await fetch('/api/v1/discovery/auto-highlight', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  },
  body: JSON.stringify({
    criteria: {
      minRating: 85,
      minStars: 4,
      hasHighlights: true
    },
    limit: 20
  })
});
```

### Get Highlighted Athletes

```javascript
const response = await fetch('/api/v1/discovery/highlighted?sortBy=highlightScore&limit=10', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});

const data = await response.json();
const topAthletes = data.data;
```

## Rate Limiting & Ethics

### Rate Limiting Configuration

```javascript
const RATE_LIMITS = {
  'rivals.com': { requests: 10, period: 60000 },    // 10 requests per minute
  '247sports.com': { requests: 15, period: 60000 }, // 15 requests per minute
  'hudl.com': { requests: 20, period: 60000 },      // 20 requests per minute
};
```

### Ethical Scraping Practices

- **Respect robots.txt** and website terms of service
- **Rate limiting** to avoid overwhelming servers
- **User agent rotation** to appear as legitimate traffic
- **Error handling** with exponential backoff
- **Data freshness** checks to avoid unnecessary scraping
- **Caching** of results to reduce server load

## Highlight Scoring Algorithm

The highlight score is calculated based on multiple factors:

```javascript
const score = Math.min(100, Math.max(0,
  (recruitingRating * 0.4) +           // 40% weight
  (stars * 10 * 0.2) +                 // 20% weight
  (highlightsCount * 5 * 0.15) +       // 15% weight
  (socialMediaCount * 2 * 0.15) +      // 15% weight
  (achievementsCount * 3 * 0.1)        // 10% weight
));
```

## Frontend Integration

### React Component Usage

```jsx
import AthleteDiscovery from './components/AthleteDiscovery';

function App() {
  return (
    <div className="App">
      <AthleteDiscovery />
    </div>
  );
}
```

### Component Features

- **Tabbed interface** for different views (Discover, Highlighted, Statistics)
- **Real-time scraping** with progress indicators
- **Interactive athlete cards** with highlight/unhighlight actions
- **Filter controls** for sport, year, location, and limits
- **Statistics dashboard** showing scraping metrics and database stats
- **Responsive design** for mobile and desktop

## Testing

### Run Discovery Tests

```bash
npm run test:discovery
```

### Test Coverage

- **Data normalization** and validation
- **Deduplication algorithms**
- **Rate limiting** functionality
- **Error handling** and edge cases
- **Performance** with large datasets
- **Integration scenarios** with mixed data sources

## Monitoring & Analytics

### Scraping Metrics

- **Success rates** by source
- **Response times** and performance
- **Error rates** and failure patterns
- **Data quality** metrics
- **Rate limiting** status

### Athlete Analytics

- **Top prospects** by various metrics
- **Source reliability** comparison
- **Geographic distribution** of athletes
- **Position distribution** analysis
- **Rating correlations** between sources

## Future Enhancements

### Planned Features

1. **Machine Learning Integration**
   - Predictive analytics for athlete potential
   - Automated highlight detection from videos
   - Performance trend analysis

2. **Advanced Filtering**
   - Geographic radius searches
   - Performance metric comparisons
   - Social media engagement analysis

3. **Real-time Updates**
   - WebSocket notifications for new prospects
   - Automated background scraping
   - Real-time highlight score updates

4. **Multi-sport Support**
   - Basketball, baseball, soccer recruiting data
   - Sport-specific metrics and scoring
   - Cross-sport athlete comparisons

5. **Integration APIs**
   - NCAA database integration
   - High school association data
   - Professional league pipelines

## Troubleshooting

### Common Issues

1. **Rate Limiting Errors**
   - Wait for rate limit reset
   - Reduce scraping frequency
   - Check rate limiting configuration

2. **Data Quality Issues**
   - Review normalization rules
   - Update scraping selectors
   - Check source website changes

3. **Performance Problems**
   - Implement result caching
   - Use pagination for large datasets
   - Optimize database queries

### Debug Mode

Enable detailed logging:

```bash
LOG_LEVEL=debug
```

This provides verbose output for troubleshooting scraping issues.

## Legal & Compliance

### Terms of Service Compliance

- **Respect website ToS** and robots.txt
- **Fair use** data collection practices
- **Attribution** to data sources
- **User consent** for data usage
- **Data retention** policies

### Data Privacy

- **PII minimization** in stored data
- **Anonymization** of sensitive information
- **GDPR compliance** for EU data
- **Data deletion** capabilities
- **Audit trails** for data access

## Contributing

### Development Guidelines

1. **Test all changes** before committing
2. **Update documentation** for new features
3. **Follow rate limiting** best practices
4. **Handle errors gracefully**
5. **Maintain data quality** standards

### Code Standards

- **ESLint configuration** for consistent code style
- **JSDoc comments** for all functions
- **Error handling** with proper logging
- **Type checking** where applicable
- **Performance optimization** considerations

This athlete discovery system transforms AthleteAI into a comprehensive recruiting intelligence platform, providing scouts and coaches with powerful tools to identify and track top athletic talent across multiple data sources.
