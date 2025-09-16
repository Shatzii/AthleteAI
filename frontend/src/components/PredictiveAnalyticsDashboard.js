// Predictive Analytics Dashboard Component
// Advanced analytics interface with performance predictions and insights

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { TrendingUp, AlertTriangle, Target, Users, Activity, Zap } from 'lucide-react';
import api from '../services/api';

const PredictiveAnalyticsDashboard = ({ athleteId }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState(12);

  useEffect(() => {
    loadDashboardData();
  }, [athleteId, timeframe]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/analytics/predictive/dashboard/${athleteId}?timeframe=${timeframe}`);

      if (response.data.success) {
        setDashboardData(response.data.data);
      } else {
        setError('Failed to load dashboard data');
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
          <span className="text-red-800">{error}</span>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const { athlete, performanceTrajectory, injuryRisk, comparativeAnalysis, summary } = dashboardData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Predictive Analytics Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              {athlete.name} • {athlete.position} • Age {athlete.age}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(parseInt(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={6}>6 Months</option>
              <option value={12}>12 Months</option>
              <option value={24}>24 Months</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard
          title="Overall Health Score"
          value={summary.overallHealth}
          icon={<Activity className="h-6 w-6" />}
          color="blue"
          suffix="/100"
        />
        <SummaryCard
          title="Injury Risk Level"
          value={injuryRisk.riskLevel.toUpperCase()}
          icon={<AlertTriangle className="h-6 w-6" />}
          color={injuryRisk.riskLevel === 'high' ? 'red' : injuryRisk.riskLevel === 'medium' ? 'yellow' : 'green'}
        />
        <SummaryCard
          title="Predicted Improvement"
          value={`+${summary.predictedImprovement.toFixed(1)}`}
          icon={<TrendingUp className="h-6 w-6" />}
          color="green"
          suffix=" pts"
        />
        <SummaryCard
          title="Performance Percentile"
          value={Math.round(Object.values(summary.percentileRankings).reduce((a, b) => a + b, 0) / Object.values(summary.percentileRankings).length)}
          icon={<Target className="h-6 w-6" />}
          color="purple"
          suffix="th"
        />
      </div>

      {/* Performance Trajectory Chart */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center mb-4">
          <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Performance Trajectory</h2>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={performanceTrajectory.trajectory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                label={{ value: 'Months', position: 'insideBottom', offset: -5 }}
              />
              <YAxis
                label={{ value: 'Performance Score', angle: -90, position: 'insideLeft' }}
                domain={[0, 100]}
              />
              <Tooltip
                formatter={(value, name) => [value.toFixed(1), 'Predicted Performance']}
                labelFormatter={(label) => `Month ${label}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="predictedPerformance"
                stroke="#2563eb"
                strokeWidth={2}
                dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                name="Predicted Performance"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {performanceTrajectory.insights.map((insight, index) => (
            <InsightCard key={index} insight={insight} />
          ))}
        </div>
      </div>

      {/* Injury Risk Assessment */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center mb-4">
          <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Injury Risk Assessment</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Risk Level Visualization */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Risk Probability</h3>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className={`h-4 rounded-full ${
                      injuryRisk.riskLevel === 'high' ? 'bg-red-500' :
                      injuryRisk.riskLevel === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${injuryRisk.probability * 100}%` }}
                  ></div>
                </div>
              </div>
              <span className="text-lg font-semibold text-gray-900">
                {(injuryRisk.probability * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Risk Factors */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Key Risk Factors</h3>
            <div className="space-y-2">
              {injuryRisk.riskFactors.map((factor, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{factor.factor}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    factor.severity === 'high' ? 'bg-red-100 text-red-800' :
                    factor.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {factor.severity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Recommendations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {injuryRisk.recommendations.map((rec, index) => (
              <RecommendationCard key={index} recommendation={rec} />
            ))}
          </div>
        </div>
      </div>

      {/* Comparative Analysis */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center mb-4">
          <Users className="h-5 w-5 text-purple-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Comparative Analysis</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Radar Chart */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Performance Profile</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={Object.entries(comparativeAnalysis.percentileRankings).map(([key, value]) => ({
                  subject: key.charAt(0).toUpperCase() + key.slice(1),
                  value: value
                }))}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis domain={[0, 100]} />
                  <Radar
                    name="Percentile Rank"
                    dataKey="value"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Similar Athletes */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Similar Athletes</h3>
            <div className="space-y-3">
              {comparativeAnalysis.similarAthletes.map((athlete, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{athlete.name}</p>
                    <p className="text-sm text-gray-600">
                      {athlete.similarity}% similarity
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full"
                        style={{ width: `${athlete.similarity}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Strengths and Improvements */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Strengths</h3>
            <div className="space-y-2">
              {comparativeAnalysis.strengths.map((strength, index) => (
                <div key={index} className="flex items-center p-2 bg-green-50 rounded">
                  <Zap className="h-4 w-4 text-green-600 mr-2" />
                  <span className="text-sm text-green-800">{strength.description}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Areas for Improvement</h3>
            <div className="space-y-2">
              {comparativeAnalysis.improvementAreas.map((area, index) => (
                <div key={index} className="flex items-center p-2 bg-yellow-50 rounded">
                  <Target className="h-4 w-4 text-yellow-600 mr-2" />
                  <span className="text-sm text-yellow-800">{area.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Summary Card Component
const SummaryCard = ({ title, value, icon, color, suffix = '' }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600'
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">
            {value}{suffix}
          </p>
        </div>
      </div>
    </div>
  );
};

// Insight Card Component
const InsightCard = ({ insight }) => {
  const colorClasses = {
    positive: 'bg-green-50 border-green-200 text-green-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800'
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[insight.type]}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {insight.type === 'positive' && <TrendingUp className="h-5 w-5" />}
          {insight.type === 'info' && <Activity className="h-5 w-5" />}
          {insight.type === 'warning' && <AlertTriangle className="h-5 w-5" />}
        </div>
        <div className="ml-3">
          <h4 className="text-sm font-medium">{insight.title}</h4>
          <p className="text-sm mt-1">{insight.description}</p>
        </div>
      </div>
    </div>
  );
};

// Recommendation Card Component
const RecommendationCard = ({ recommendation }) => {
  const priorityColors = {
    critical: 'bg-red-100 text-red-800 border-red-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-gray-100 text-gray-800 border-gray-200'
  };

  return (
    <div className={`p-3 rounded-lg border ${priorityColors[recommendation.priority]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="text-sm font-medium">{recommendation.title}</h4>
          <p className="text-xs mt-1">{recommendation.description}</p>
        </div>
        <span className="text-xs font-medium px-2 py-1 rounded-full bg-white bg-opacity-50">
          {recommendation.priority}
        </span>
      </div>
    </div>
  );
};

export default PredictiveAnalyticsDashboard;