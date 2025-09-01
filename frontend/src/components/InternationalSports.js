import React, { useState, useEffect } from 'react';
import { getArticles } from '../utils/api';
import './InternationalSports.css';

const InternationalSports = () => {
  const [articles, setArticles] = useState([]);
  const [featuredArticle, setFeaturedArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchArticles();
  }, [selectedCategory]);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const category = selectedCategory === 'all' ? 'international' : selectedCategory;
      const data = await getArticles({
        category: category,
        status: 'published',
        limit: 20
      });

      // Set featured article (first article)
      if (data.articles && data.articles.length > 0) {
        setFeaturedArticle(data.articles[0]);
        setArticles(data.articles.slice(1));
      } else {
        setArticles([]);
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
      // For demo purposes, show sample articles
      setArticles(getSampleArticles());
    } finally {
      setLoading(false);
    }
  };

  const getSampleArticles = () => [
    {
      _id: '1',
      title: 'Brazilian Football Revolution: Neymar\'s Legacy and Future Stars',
      excerpt: 'Exploring how Brazilian football continues to dominate global soccer with emerging talents and tactical innovations.',
      category: 'football',
      author: { username: 'Sports Analyst' },
      publishedAt: new Date('2025-09-01'),
      featuredImage: '/api/placeholder/400/250',
      views: 1250,
      tags: ['Brazil', 'Neymar', 'Youth Development']
    },
    {
      _id: '2',
      title: 'European Basketball League Expansion: New Markets, New Challenges',
      excerpt: 'Analysis of how European basketball is expanding into new international markets and adapting to global competition.',
      category: 'basketball',
      author: { username: 'Euro Sports' },
      publishedAt: new Date('2025-08-28'),
      featuredImage: '/api/placeholder/400/250',
      views: 890,
      tags: ['Europe', 'Expansion', 'Global Basketball']
    },
    {
      _id: '3',
      title: 'Asian Baseball\'s Rise: From Japan to the World Stage',
      excerpt: 'The growing influence of Asian baseball and its impact on international baseball development.',
      category: 'baseball',
      author: { username: 'Baseball Insider' },
      publishedAt: new Date('2025-08-25'),
      featuredImage: '/api/placeholder/400/250',
      views: 675,
      tags: ['Asia', 'Japan', 'International Baseball']
    }
  ];

  const categories = [
    { value: 'all', label: 'All International Sports', icon: '🌍' },
    { value: 'football', label: 'International Football', icon: '⚽' },
    { value: 'basketball', label: 'Global Basketball', icon: '🏀' },
    { value: 'baseball', label: 'World Baseball', icon: '⚾' },
    { value: 'tennis', label: 'International Tennis', icon: '🎾' },
    { value: 'other', label: 'Other Sports', icon: '🏆' }
  ];

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="international-sports-loading">
        <div className="loading-spinner"></div>
        <p>Loading international sports coverage...</p>
      </div>
    );
  }

  return (
    <div className="international-sports">
      {/* Hero Section */}
      <section className="sports-hero">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title">International Sports Hub</h1>
          <p className="hero-subtitle">
            Global coverage of international athletics, emerging talents, and cross-cultural sports phenomena
          </p>
          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-number">50+</span>
              <span className="stat-label">Countries Covered</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">200+</span>
              <span className="stat-label">Athletes Featured</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">15</span>
              <span className="stat-label">Sports Disciplines</span>
            </div>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="category-filter">
        <div className="filter-container">
          <h2>Explore by Sport</h2>
          <div className="category-buttons">
            {categories.map(category => (
              <button
                key={category.value}
                className={`category-btn ${selectedCategory === category.value ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category.value)}
              >
                <span className="category-icon">{category.icon}</span>
                <span className="category-label">{category.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Article */}
      {featuredArticle && (
        <section className="featured-article">
          <div className="featured-container">
            <div className="featured-image">
              <img
                src={featuredArticle.featuredImage || '/api/placeholder/800/400'}
                alt={featuredArticle.title}
                onError={(e) => {
                  e.target.src = '/api/placeholder/800/400';
                }}
              />
              <div className="featured-badge">Featured</div>
            </div>
            <div className="featured-content">
              <div className="article-meta">
                <span className="article-category">{featuredArticle.category}</span>
                <span className="article-date">{formatDate(featuredArticle.publishedAt)}</span>
                <span className="article-views">{featuredArticle.views} views</span>
              </div>
              <h2 className="featured-title">{featuredArticle.title}</h2>
              <p className="featured-excerpt">{featuredArticle.excerpt}</p>
              <div className="article-tags">
                {featuredArticle.tags?.map(tag => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
              <div className="article-author">
                <span>By {featuredArticle.author?.username || 'Sports Writer'}</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Articles Grid */}
      <section className="articles-section">
        <div className="articles-container">
          <h2 className="section-title">Latest International Coverage</h2>
          <div className="articles-grid">
            {articles.map(article => (
              <article key={article._id} className="article-card">
                <div className="article-image">
                  <img
                    src={article.featuredImage || '/api/placeholder/400/250'}
                    alt={article.title}
                    onError={(e) => {
                      e.target.src = '/api/placeholder/400/250';
                    }}
                  />
                  <div className="article-category-badge">{article.category}</div>
                </div>
                <div className="article-content">
                  <div className="article-meta">
                    <span className="article-date">{formatDate(article.publishedAt)}</span>
                    <span className="article-views">{article.views} views</span>
                  </div>
                  <h3 className="article-title">{article.title}</h3>
                  <p className="article-excerpt">{article.excerpt}</p>
                  <div className="article-tags">
                    {article.tags?.slice(0, 3).map(tag => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                  </div>
                  <div className="article-author">
                    <span>By {article.author?.username || 'Sports Writer'}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="newsletter-section">
        <div className="newsletter-container">
          <div className="newsletter-content">
            <h2>Stay Updated on International Sports</h2>
            <p>Get the latest coverage of global athletics, emerging talents, and international competitions delivered to your inbox.</p>
            <div className="newsletter-form">
              <input
                type="email"
                placeholder="Enter your email address"
                className="newsletter-input"
              />
              <button className="newsletter-btn">Subscribe</button>
            </div>
          </div>
          <div className="newsletter-image">
            <div className="image-placeholder">
              <span>🌍</span>
              <p>Global Sports Network</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default InternationalSports;
