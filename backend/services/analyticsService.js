const { logger } = require('../utils/logger');

// Advanced analytics and insights service
class AnalyticsService {
    constructor() {
        this.analyticsData = new Map();
        this.trends = new Map();
        this.predictions = new Map();
        this.performanceMetrics = new Map();
    }

    // Calculate comprehensive athlete analytics
    calculateAthleteAnalytics(athleteData, historicalData = []) {
        const analytics = {
            athleteId: athleteData.id || athleteData.name,
            calculatedAt: new Date(),
            performance: this.calculatePerformanceMetrics(athleteData, historicalData),
            trends: this.calculateTrends(historicalData),
            predictions: this.generatePredictions(athleteData, historicalData),
            comparisons: this.calculatePeerComparisons(athleteData),
            insights: this.generateInsights(athleteData, historicalData),
            recommendations: this.generateRecommendations(athleteData)
        };

        this.analyticsData.set(analytics.athleteId, analytics);
        return analytics;
    }

    // Calculate performance metrics
    calculatePerformanceMetrics(athleteData, historicalData) {
        const current = athleteData.stats || {};
        const metrics = {
            overallScore: 0,
            improvementRate: 0,
            consistencyScore: 0,
            peakPerformance: {},
            recentForm: {},
            strengths: [],
            weaknesses: []
        };

        // Calculate overall performance score
        const statWeights = {
            passingYards: 0.15,
            rushingYards: 0.15,
            receivingYards: 0.15,
            touchdowns: 0.20,
            tackles: 0.10,
            sacks: 0.10,
            interceptions: 0.10,
            longJump: 0.20,
            highJump: 0.15,
            time_100m: 0.25,
            time_200m: 0.20,
            time_400m: 0.15
        };

        let weightedScore = 0;
        let totalWeight = 0;

        Object.keys(statWeights).forEach(stat => {
            if (current[stat] !== undefined) {
                const normalizedValue = this.normalizeStat(stat, current[stat]);
                weightedScore += normalizedValue * statWeights[stat];
                totalWeight += statWeights[stat];
            }
        });

        metrics.overallScore = totalWeight > 0 ? (weightedScore / totalWeight) * 100 : 0;

        // Calculate improvement rate
        if (historicalData.length > 1) {
            const recent = historicalData.slice(-3);
            const older = historicalData.slice(0, -3);

            if (recent.length > 0 && older.length > 0) {
                const recentAvg = this.averageStats(recent);
                const olderAvg = this.averageStats(older);
                metrics.improvementRate = this.calculateImprovementRate(recentAvg, olderAvg);
            }
        }

        // Calculate consistency score
        if (historicalData.length >= 5) {
            metrics.consistencyScore = this.calculateConsistencyScore(historicalData);
        }

        // Identify peak performance
        metrics.peakPerformance = this.findPeakPerformance(historicalData);

        // Analyze recent form
        metrics.recentForm = this.analyzeRecentForm(historicalData.slice(-5));

        // Identify strengths and weaknesses
        const { strengths, weaknesses } = this.identifyStrengthsAndWeaknesses(current);
        metrics.strengths = strengths;
        metrics.weaknesses = weaknesses;

        return metrics;
    }

    // Normalize stat values for comparison
    normalizeStat(statName, value) {
        const normalizationRules = {
            passingYards: { min: 0, max: 5000, ideal: 3000 },
            rushingYards: { min: 0, max: 2000, ideal: 1200 },
            receivingYards: { min: 0, max: 1500, ideal: 800 },
            touchdowns: { min: 0, max: 50, ideal: 25 },
            tackles: { min: 0, max: 150, ideal: 75 },
            sacks: { min: 0, max: 20, ideal: 8 },
            interceptions: { min: 0, max: 10, ideal: 2 },
            longJump: { min: 0, max: 30, ideal: 22 },
            highJump: { min: 0, max: 10, ideal: 6 },
            time_100m: { min: 20, max: 10, ideal: 11 }, // Lower time is better
            time_200m: { min: 40, max: 20, ideal: 23 },
            time_400m: { min: 80, max: 45, ideal: 52 }
        };

        const rule = normalizationRules[statName];
        if (!rule) return Math.min(value / 100, 1); // Default normalization

        if (statName.includes('time_')) {
            // For times, lower is better
            const range = rule.max - rule.min;
            const distanceFromMax = rule.max - value;
            return Math.max(0, Math.min(distanceFromMax / range, 1));
        } else {
            // For other stats, higher is better
            const range = rule.max - rule.min;
            const normalized = (value - rule.min) / range;
            return Math.max(0, Math.min(normalized, 1));
        }
    }

    // Calculate average stats across multiple data points
    averageStats(dataPoints) {
        const averages = {};
        const statCounts = {};

        dataPoints.forEach(point => {
            if (point.stats) {
                Object.entries(point.stats).forEach(([stat, value]) => {
                    if (typeof value === 'number') {
                        averages[stat] = (averages[stat] || 0) + value;
                        statCounts[stat] = (statCounts[stat] || 0) + 1;
                    }
                });
            }
        });

        Object.keys(averages).forEach(stat => {
            averages[stat] /= statCounts[stat];
        });

        return averages;
    }

    // Calculate improvement rate
    calculateImprovementRate(recent, older) {
        let totalImprovement = 0;
        let statCount = 0;

        Object.keys(recent).forEach(stat => {
            if (older[stat] && older[stat] > 0) {
                const improvement = (recent[stat] - older[stat]) / older[stat];
                totalImprovement += improvement;
                statCount++;
            }
        });

        return statCount > 0 ? (totalImprovement / statCount) * 100 : 0;
    }

    // Calculate consistency score
    calculateConsistencyScore(historicalData) {
        const stats = {};
        const coefficients = {};

        // Collect all stat values over time
        historicalData.forEach(point => {
            if (point.stats) {
                Object.entries(point.stats).forEach(([stat, value]) => {
                    if (typeof value === 'number') {
                        if (!stats[stat]) stats[stat] = [];
                        stats[stat].push(value);
                    }
                });
            }
        });

        // Calculate coefficient of variation for each stat
        Object.entries(stats).forEach(([stat, values]) => {
            if (values.length >= 3) {
                const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
                const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
                const stdDev = Math.sqrt(variance);
                coefficients[stat] = mean > 0 ? (stdDev / mean) : 0;
            }
        });

        // Average consistency score (lower coefficient = more consistent = higher score)
        const avgCoefficient = Object.values(coefficients).reduce((sum, coef) => sum + coef, 0) / Object.values(coefficients).length;
        return Math.max(0, (1 - avgCoefficient) * 100);
    }

    // Find peak performance periods
    findPeakPerformance(historicalData) {
        if (historicalData.length < 3) return {};

        let peakStats = {};
        let peakDate = null;
        let maxScore = 0;

        historicalData.forEach(point => {
            if (point.stats) {
                const score = this.calculateOverallScore(point.stats);
                if (score > maxScore) {
                    maxScore = score;
                    peakStats = { ...point.stats };
                    peakDate = point.date || point.createdAt;
                }
            }
        });

        return {
            stats: peakStats,
            date: peakDate,
            score: maxScore
        };
    }

    // Calculate overall score for a set of stats
    calculateOverallScore(stats) {
        const weights = {
            passingYards: 0.15, rushingYards: 0.15, receivingYards: 0.15,
            touchdowns: 0.20, tackles: 0.10, sacks: 0.10, interceptions: 0.10,
            longJump: 0.20, highJump: 0.15, time_100m: 0.25, time_200m: 0.20, time_400m: 0.15
        };

        let score = 0;
        let totalWeight = 0;

        Object.entries(weights).forEach(([stat, weight]) => {
            if (stats[stat] !== undefined) {
                const normalized = this.normalizeStat(stat, stats[stat]);
                score += normalized * weight;
                totalWeight += weight;
            }
        });

        return totalWeight > 0 ? (score / totalWeight) * 100 : 0;
    }

    // Analyze recent form
    analyzeRecentForm(recentData) {
        if (recentData.length === 0) return { trend: 'insufficient_data' };

        const scores = recentData.map(point => this.calculateOverallScore(point.stats || {}));
        const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

        // Calculate trend
        let trend = 'stable';
        if (scores.length >= 3) {
            const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
            const secondHalf = scores.slice(Math.floor(scores.length / 2));

            const firstAvg = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length;
            const secondAvg = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length;

            const change = ((secondAvg - firstAvg) / firstAvg) * 100;
            if (change > 5) trend = 'improving';
            else if (change < -5) trend = 'declining';
        }

        return {
            averageScore: avgScore,
            trend,
            dataPoints: scores.length,
            volatility: this.calculateVolatility(scores)
        };
    }

    // Calculate volatility (standard deviation of scores)
    calculateVolatility(scores) {
        if (scores.length < 2) return 0;

        const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
        return Math.sqrt(variance);
    }

    // Identify strengths and weaknesses
    identifyStrengthsAndWeaknesses(stats) {
        const strengths = [];
        const weaknesses = [];

        const benchmarks = {
            passingYards: 2500, rushingYards: 1000, receivingYards: 600,
            touchdowns: 20, tackles: 60, sacks: 5, interceptions: 2,
            longJump: 20, highJump: 5.5, time_100m: 12, time_200m: 25, time_400m: 55
        };

        Object.entries(benchmarks).forEach(([stat, benchmark]) => {
            if (stats[stat] !== undefined) {
                const isBetter = stat.includes('time_') ?
                    stats[stat] < benchmark : stats[stat] > benchmark;

                if (isBetter) {
                    strengths.push(stat);
                } else if (stats[stat] < benchmark * 0.7) {
                    weaknesses.push(stat);
                }
            }
        });

        return { strengths, weaknesses };
    }

    // Calculate trends over time
    calculateTrends(historicalData) {
        if (historicalData.length < 3) return {};

        const trends = {
            overall: 'stable',
            stats: {},
            seasonality: {},
            correlations: {}
        };

        // Overall trend
        const scores = historicalData.map(point => this.calculateOverallScore(point.stats || {}));
        const trend = this.calculateLinearTrend(scores);
        trends.overall = trend > 0.5 ? 'improving' : trend < -0.5 ? 'declining' : 'stable';

        // Individual stat trends
        const statTrends = {};
        Object.keys(historicalData[0]?.stats || {}).forEach(stat => {
            const values = historicalData.map(point => point.stats?.[stat]).filter(val => val !== undefined);
            if (values.length >= 3) {
                statTrends[stat] = this.calculateLinearTrend(values);
            }
        });
        trends.stats = statTrends;

        return trends;
    }

    // Calculate linear trend (slope)
    calculateLinearTrend(values) {
        if (values.length < 2) return 0;

        const n = values.length;
        const x = Array.from({ length: n }, (_, i) => i);
        const y = values;

        const sumX = x.reduce((sum, val) => sum + val, 0);
        const sumY = y.reduce((sum, val) => sum + val, 0);
        const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
        const sumXX = x.reduce((sum, val) => sum + val * val, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        return slope;
    }

    // Generate performance predictions
    generatePredictions(athleteData, historicalData) {
        if (historicalData.length < 5) return {};

        const predictions = {
            nextSeason: {},
            confidence: 0,
            riskFactors: []
        };

        // Predict next season performance
        Object.keys(athleteData.stats || {}).forEach(stat => {
            const values = historicalData.map(point => point.stats?.[stat]).filter(val => val !== undefined);
            if (values.length >= 3) {
                const trend = this.calculateLinearTrend(values);
                const current = values[values.length - 1];
                const prediction = current + trend * values.length;

                predictions.nextSeason[stat] = Math.max(0, prediction);
            }
        });

        // Calculate prediction confidence
        const dataPoints = historicalData.length;
        const consistency = this.calculateConsistencyScore(historicalData);
        predictions.confidence = Math.min(dataPoints * 10 + consistency * 0.5, 95);

        // Identify risk factors
        if (dataPoints < 10) predictions.riskFactors.push('Limited historical data');
        if (consistency < 60) predictions.riskFactors.push('Inconsistent performance');
        if (this.calculateVolatility(historicalData.map(point => this.calculateOverallScore(point.stats || {}))) > 15) {
            predictions.riskFactors.push('High performance volatility');
        }

        return predictions;
    }

    // Calculate peer comparisons
    calculatePeerComparisons(athleteData) {
        // This would compare against similar athletes
        // For now, return placeholder
        return {
            percentile: 75,
            betterThan: 75,
            similarAthletes: [],
            positionRank: 12
        };
    }

    // Generate insights
    generateInsights(athleteData, historicalData) {
        const insights = [];

        const performance = this.calculatePerformanceMetrics(athleteData, historicalData);

        if (performance.improvementRate > 10) {
            insights.push({
                type: 'positive',
                title: 'Strong Improvement Trend',
                description: `Performance has improved by ${performance.improvementRate.toFixed(1)}% recently`,
                impact: 'high'
            });
        }

        if (performance.consistencyScore > 80) {
            insights.push({
                type: 'positive',
                title: 'Highly Consistent',
                description: 'Demonstrates consistent performance across multiple events',
                impact: 'high'
            });
        }

        if (performance.recentForm.trend === 'improving') {
            insights.push({
                type: 'positive',
                title: 'Improving Form',
                description: 'Recent performances show an upward trend',
                impact: 'medium'
            });
        }

        if (performance.weaknesses.length > 0) {
            insights.push({
                type: 'warning',
                title: 'Areas for Improvement',
                description: `Focus on improving: ${performance.weaknesses.join(', ')}`,
                impact: 'medium'
            });
        }

        return insights;
    }

    // Generate recommendations
    generateRecommendations(athleteData) {
        const recommendations = [];
        const performance = this.calculatePerformanceMetrics(athleteData);

        if (performance.consistencyScore < 70) {
            recommendations.push({
                type: 'training',
                title: 'Improve Consistency',
                description: 'Focus on consistent training and performance in practice',
                priority: 'high'
            });
        }

        if (performance.weaknesses.includes('time_100m') || performance.weaknesses.includes('time_200m')) {
            recommendations.push({
                type: 'training',
                title: 'Speed Training',
                description: 'Incorporate sprint training and plyometrics',
                priority: 'high'
            });
        }

        if (performance.strengths.length > 2) {
            recommendations.push({
                type: 'strategy',
                title: 'Leverage Strengths',
                description: `Build strategy around: ${performance.strengths.join(', ')}`,
                priority: 'medium'
            });
        }

        return recommendations;
    }

    // Get analytics for athlete
    getAthleteAnalytics(athleteId) {
        return this.analyticsData.get(athleteId);
    }

    // Get analytics summary for dashboard
    getAnalyticsSummary() {
        const analytics = Array.from(this.analyticsData.values());

        if (analytics.length === 0) return {};

        const summary = {
            totalAthletes: analytics.length,
            averagePerformanceScore: analytics.reduce((sum, a) => sum + a.performance.overallScore, 0) / analytics.length,
            improvingAthletes: analytics.filter(a => a.performance.improvementRate > 5).length,
            consistentAthletes: analytics.filter(a => a.performance.consistencyScore > 80).length,
            topInsights: this.getTopInsights(analytics),
            performanceDistribution: this.calculatePerformanceDistribution(analytics)
        };

        return summary;
    }

    // Get top insights across all athletes
    getTopInsights(analytics) {
        const allInsights = analytics.flatMap(a => a.insights);
        const insightCounts = {};

        allInsights.forEach(insight => {
            const key = `${insight.type}_${insight.title}`;
            insightCounts[key] = (insightCounts[key] || 0) + 1;
        });

        return Object.entries(insightCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([key, count]) => ({ insight: key, count }));
    }

    // Calculate performance distribution
    calculatePerformanceDistribution(analytics) {
        const distribution = {
            excellent: 0, // 90-100
            good: 0,      // 75-89
            average: 0,   // 60-74
            below: 0      // 0-59
        };

        analytics.forEach(a => {
            const score = a.performance.overallScore;
            if (score >= 90) distribution.excellent++;
            else if (score >= 75) distribution.good++;
            else if (score >= 60) distribution.average++;
            else distribution.below++;
        });

        return distribution;
    }

    // Export analytics data
    exportAnalytics(format = 'json') {
        const data = {
            exportedAt: new Date(),
            analytics: Array.from(this.analyticsData.values()),
            summary: this.getAnalyticsSummary()
        };

        if (format === 'csv') {
            // Convert to CSV format
            return this.convertToCSV(data.analytics);
        }

        return data;
    }

    // Convert analytics to CSV
    convertToCSV(analytics) {
        const headers = ['athleteId', 'overallScore', 'improvementRate', 'consistencyScore', 'trend'];
        const rows = analytics.map(a => [
            a.athleteId,
            a.performance.overallScore.toFixed(2),
            a.performance.improvementRate.toFixed(2),
            a.performance.consistencyScore.toFixed(2),
            a.trends.overall
        ]);

        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
}

module.exports = AnalyticsService;
