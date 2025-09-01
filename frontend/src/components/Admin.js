import React, { useState, useEffect } from 'react';
import { Link, Route, Switch, useRouteMatch } from 'react-router-dom';
import MarketingDashboard from './MarketingDashboard';
import { getArticles, getPages, getMedia, getCampaigns, getUserStats } from '../utils/api';
import './Admin.css';

const Admin = () => {
  const { path, url } = useRouteMatch();
  const [stats, setStats] = useState({
    articles: 0,
    pages: 0,
    media: 0,
    campaigns: 0,
    users: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const [articlesData, pagesData, mediaData, campaignsData, usersData] = await Promise.all([
        getArticles({ status: 'all', limit: 1 }),
        getPages({ admin: 'all' }),
        getMedia(),
        getCampaigns(token),
        getUserStats(token)
      ]);

      setStats({
        articles: articlesData.pagination?.total || 0,
        pages: pagesData.length || 0,
        media: mediaData.pagination?.total || 0,
        campaigns: campaignsData.pagination?.total || 0,
        users: usersData.totalUsers || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <Switch>
      <Route path={`${path}/marketing`}>
        <MarketingDashboard />
      </Route>
      <Route path={path}>
        <div className="admin-dashboard">
          <div className="admin-header">
            <h1>Admin Dashboard</h1>
            <p className="admin-subtitle">Manage your content and marketing campaigns</p>
          </div>

          <div className="admin-stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <h3>{stats.articles}</h3>
            <p>Articles</p>
          </div>
          <Link to={`${url}/articles`} className="stat-link">Manage</Link>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📄</div>
          <div className="stat-content">
            <h3>{stats.pages}</h3>
            <p>Pages</p>
          </div>
          <Link to={`${url}/pages`} className="stat-link">Manage</Link>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🖼️</div>
          <div className="stat-content">
            <h3>{stats.media}</h3>
            <p>Media Files</p>
          </div>
          <Link to={`${url}/media`} className="stat-link">Manage</Link>
        </div>

        <div className="stat-card">
          <div className="stat-icon">�</div>
          <div className="stat-content">
            <h3>Marketing</h3>
            <p>Dashboard</p>
          </div>
          <Link to={`${url}/marketing`} className="stat-link">View</Link>
        </div>
      </div>

      <div className="admin-quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <Link to={`${url}/articles/new`} className="btn btn-primary">
            <span className="btn-icon">✏️</span>
            New Article
          </Link>
          <Link to={`${url}/pages/new`} className="btn btn-secondary">
            <span className="btn-icon">📄</span>
            New Page
          </Link>
          <Link to={`${url}/media/upload`} className="btn btn-success">
            <span className="btn-icon">📤</span>
            Upload Media
          </Link>
          <Link to={`${url}/campaigns/new`} className="btn btn-warning">
            <span className="btn-icon">📢</span>
            New Campaign
          </Link>
          <Link to={`${url}/marketing`} className="btn btn-info">
            <span className="btn-icon">📊</span>
            Marketing Dashboard
          </Link>
        </div>
      </div>

      <div className="admin-recent-activity">
        <h2>Recent Activity</h2>
        <div className="activity-list">
          <div className="activity-item">
            <div className="activity-icon">📝</div>
            <div className="activity-content">
              <p>New article published: "International Football Trends 2025"</p>
              <span className="activity-time">2 hours ago</span>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon">📄</div>
            <div className="activity-content">
              <p>Page updated: "About Us"</p>
              <span className="activity-time">1 day ago</span>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon">📢</div>
            <div className="activity-content">
              <p>Campaign launched: "Student Athlete Recruitment"</p>
              <span className="activity-time">3 days ago</span>
            </div>
          </div>
        </div>
              </div>
      </div>
      </Route>
    </Switch>
  );
};

export default Admin;
