import React, { useState, useEffect } from 'react';
import { getCampaigns } from '../utils/api';
import './MarketingDashboard.css';

const MarketingDashboard = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalBudget: 0,
    totalSpent: 0,
    totalImpressions: 0,
    totalClicks: 0,
    totalConversions: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const data = await getCampaigns();

      setCampaigns(data.campaigns || []);

      // Calculate stats
      const campaignStats = (data.campaigns || []).reduce((acc, campaign) => {
        acc.totalCampaigns++;
        if (campaign.status === 'active') acc.activeCampaigns++;
        acc.totalBudget += campaign.budget?.allocated || 0;
        acc.totalSpent += campaign.budget?.spent || 0;
        acc.totalImpressions += campaign.metrics?.impressions || 0;
        acc.totalClicks += campaign.metrics?.clicks || 0;
        acc.totalConversions += campaign.metrics?.conversions || 0;
        return acc;
      }, {
        totalCampaigns: 0,
        activeCampaigns: 0,
        totalBudget: 0,
        totalSpent: 0,
        totalImpressions: 0,
        totalClicks: 0,
        totalConversions: 0
      });

      setStats(campaignStats);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  if (loading) {
    return (
      <div className="marketing-loading">
        <div className="loading-spinner"></div>
        <p>Loading marketing dashboard...</p>
      </div>
    );
  }

  return (
    <div className="marketing-dashboard">
      <div className="marketing-header">
        <h1>Marketing Dashboard</h1>
        <p className="marketing-subtitle">Track campaign performance and reach potential customers</p>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">📊</div>
          <div className="metric-content">
            <h3>{stats.totalCampaigns}</h3>
            <p>Total Campaigns</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🎯</div>
          <div className="metric-content">
            <h3>{stats.activeCampaigns}</h3>
            <p>Active Campaigns</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">💰</div>
          <div className="metric-content">
            <h3>{formatCurrency(stats.totalBudget)}</h3>
            <p>Total Budget</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📈</div>
          <div className="metric-content">
            <h3>{formatCurrency(stats.totalSpent)}</h3>
            <p>Total Spent</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">👁️</div>
          <div className="metric-content">
            <h3>{formatNumber(stats.totalImpressions)}</h3>
            <p>Total Impressions</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🖱️</div>
          <div className="metric-content">
            <h3>{formatNumber(stats.totalClicks)}</h3>
            <p>Total Clicks</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🎯</div>
          <div className="metric-content">
            <h3>{stats.totalConversions}</h3>
            <p>Conversions</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📊</div>
          <div className="metric-content">
            <h3>
              {stats.totalClicks > 0
                ? ((stats.totalConversions / stats.totalClicks) * 100).toFixed(1)
                : 0}%
            </h3>
            <p>Conversion Rate</p>
          </div>
        </div>
      </div>

      {/* Campaign Performance */}
      <div className="campaigns-section">
        <h2>Campaign Performance</h2>
        <div className="campaigns-table">
          <div className="table-header">
            <div className="col-title">Campaign</div>
            <div className="col-status">Status</div>
            <div className="col-budget">Budget</div>
            <div className="col-impressions">Impressions</div>
            <div className="col-clicks">Clicks</div>
            <div className="col-conversions">Conversions</div>
            <div className="col-roi">ROI</div>
          </div>

          {campaigns.length === 0 ? (
            <div className="no-campaigns">
              <p>No campaigns found. Create your first marketing campaign!</p>
            </div>
          ) : (
            campaigns.map(campaign => (
              <div key={campaign._id} className="table-row">
                <div className="col-title">
                  <h4>{campaign.title}</h4>
                  <p>{campaign.type} • {campaign.targetAudience}</p>
                </div>
                <div className="col-status">
                  <span className={`status-badge status-${campaign.status}`}>
                    {campaign.status}
                  </span>
                </div>
                <div className="col-budget">
                  <p>{formatCurrency(campaign.budget?.spent || 0)}</p>
                  <small>of {formatCurrency(campaign.budget?.allocated || 0)}</small>
                </div>
                <div className="col-impressions">
                  {formatNumber(campaign.metrics?.impressions || 0)}
                </div>
                <div className="col-clicks">
                  {formatNumber(campaign.metrics?.clicks || 0)}
                </div>
                <div className="col-conversions">
                  {campaign.metrics?.conversions || 0}
                </div>
                <div className="col-roi">
                  {campaign.budget?.spent > 0
                    ? ((campaign.metrics?.revenue || 0) / campaign.budget.spent * 100).toFixed(1)
                    : 0}%
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Marketing Tools */}
      <div className="marketing-tools">
        <h2>Marketing Tools</h2>
        <div className="tools-grid">
          <div className="tool-card">
            <div className="tool-icon">📧</div>
            <h3>Email Campaigns</h3>
            <p>Create and send targeted email campaigns to reach potential customers.</p>
            <button className="tool-btn">Create Email</button>
          </div>

          <div className="tool-card">
            <div className="tool-icon">📱</div>
            <h3>Social Media</h3>
            <p>Manage social media campaigns and track engagement across platforms.</p>
            <button className="tool-btn">Social Hub</button>
          </div>

          <div className="tool-card">
            <div className="tool-icon">🎯</div>
            <h3>Lead Generation</h3>
            <p>Capture and nurture leads from website visitors and campaign responses.</p>
            <button className="tool-btn">View Leads</button>
          </div>

          <div className="tool-card">
            <div className="tool-icon">📊</div>
            <h3>Analytics</h3>
            <p>Detailed analytics and reporting for all marketing activities.</p>
            <button className="tool-btn">View Reports</button>
          </div>
        </div>
      </div>

      {/* Target Audience Insights */}
      <div className="audience-insights">
        <h2>Target Audience Insights</h2>
        <div className="insights-grid">
          <div className="insight-card">
            <h3>🎓 Student Athletes</h3>
            <p>High school and college athletes seeking performance improvement</p>
            <div className="insight-stats">
              <span>Primary Target</span>
              <span>65% of user base</span>
            </div>
          </div>

          <div className="insight-card">
            <h3>👨‍🏫 Coaches</h3>
            <p>High school and club coaches managing team performance</p>
            <div className="insight-stats">
              <span>Secondary Target</span>
              <span>25% of user base</span>
            </div>
          </div>

          <div className="insight-card">
            <h3>👨‍👩‍👧‍👦 Parents</h3>
            <p>Parents supporting their children's athletic development</p>
            <div className="insight-stats">
              <span>Growing Segment</span>
              <span>10% of user base</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketingDashboard;
