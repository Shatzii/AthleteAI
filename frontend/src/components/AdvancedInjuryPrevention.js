// Advanced Injury Prevention Component
// Enhanced injury prevention with computer vision analysis and rehabilitation planning

import React, { useState, useRef, useCallback } from 'react';
import { Camera, Upload, Activity, TrendingUp, AlertTriangle, CheckCircle, Clock, Target, Zap, Shield } from 'lucide-react';
import api from '../services/api';

const AdvancedInjuryPrevention = ({ athleteId, athlete }) => {
  const [activeTab, setActiveTab] = useState('analysis');
  const [analysisResults, setAnalysisResults] = useState(null);
  const [rehabPlan, setRehabPlan] = useState(null);
  const [preventiveProgram, setPreventiveProgram] = useState(null);
  const [loadAnalysis, setLoadAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Movement Analysis Tab
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    await analyzeMovement(file, {
      exerciseType: 'general',
      bodyPart: 'full_body',
      angle: 'front',
      athleteLevel: 'intermediate'
    });
  };

  const handleCameraCapture = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    await analyzeMovement(file, {
      exerciseType: 'general',
      bodyPart: 'full_body',
      angle: 'front',
      athleteLevel: 'intermediate'
    });
  };

  const analyzeMovement = async (file, metadata) => {
    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      Object.keys(metadata).forEach(key => {
        formData.append(key, metadata[key]);
      });

      const response = await api.post('/injury-prevention/analyze-movement', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setAnalysisResults(response.data.data);
      }
    } catch (error) {
      console.error('Error analyzing movement:', error);
      alert('Failed to analyze movement pattern');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Rehabilitation Planning Tab
  const generateRehabPlan = async (injuryRisks) => {
    setIsGenerating(true);
    try {
      const response = await api.post('/injury-prevention/rehabilitation-plan', {
        athleteId,
        injuryRisks
      });

      if (response.data.success) {
        setRehabPlan(response.data.data);
      }
    } catch (error) {
      console.error('Error generating rehab plan:', error);
      alert('Failed to generate rehabilitation plan');
    } finally {
      setIsGenerating(false);
    }
  };

  // Preventive Program Tab
  const generatePreventiveProgram = async (riskFactors) => {
    setIsGenerating(true);
    try {
      const response = await api.post('/injury-prevention/preventive-program', {
        athleteId,
        riskFactors
      });

      if (response.data.success) {
        setPreventiveProgram(response.data.data);
      }
    } catch (error) {
      console.error('Error generating preventive program:', error);
      alert('Failed to generate preventive program');
    } finally {
      setIsGenerating(false);
    }
  };

  // Training Load Analysis Tab
  const analyzeTrainingLoad = async (sessions) => {
    setIsGenerating(true);
    try {
      const response = await api.post('/injury-prevention/analyze-load', {
        athleteId,
        sessions
      });

      if (response.data.success) {
        setLoadAnalysis(response.data.data);
      }
    } catch (error) {
      console.error('Error analyzing training load:', error);
      alert('Failed to analyze training load');
    } finally {
      setIsGenerating(false);
    }
  };

  const getRiskColor = (risk) => {
    switch (risk.toLowerCase()) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'moderate': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getFormQualityIcon = (quality) => {
    switch (quality) {
      case 'excellent': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'good': return <CheckCircle className="h-5 w-5 text-blue-600" />;
      case 'fair': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'poor': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default: return <Activity className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Shield className="h-8 w-8 text-blue-600 mr-3" />
              Advanced Injury Prevention
            </h1>
            <p className="text-gray-600 mt-1">
              AI-powered movement analysis and personalized rehabilitation planning
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Athlete</p>
            <p className="font-semibold text-gray-900">{athlete?.name || 'Unknown Athlete'}</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-lg">
        <div className="border-b border-gray-200">
          <nav className="flex">
            {[
              { id: 'analysis', label: 'Movement Analysis', icon: Camera },
              { id: 'rehab', label: 'Rehabilitation', icon: Activity },
              { id: 'prevention', label: 'Prevention Program', icon: Shield },
              { id: 'load', label: 'Training Load', icon: TrendingUp }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-6 py-4 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-5 w-5 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Movement Analysis Tab */}
          {activeTab === 'analysis' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Movement Pattern Analysis
                </h2>
                <p className="text-gray-600 mb-6">
                  Upload or capture an image of your movement for AI-powered analysis
                </p>

                <div className="flex justify-center space-x-4 mb-6">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Upload className="h-5 w-5 mr-2" />
                    Upload Image
                  </button>
                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <Camera className="h-5 w-5 mr-2" />
                    Take Photo
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleCameraCapture}
                  className="hidden"
                />
              </div>

              {isAnalyzing && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-4">Analyzing movement pattern...</p>
                </div>
              )}

              {analysisResults && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis Results</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="flex items-center mb-3">
                        {getFormQualityIcon(analysisResults.analysis?.formQuality)}
                        <span className="ml-2 font-medium text-gray-900">Form Quality</span>
                      </div>
                      <p className="text-gray-600 capitalize">
                        {analysisResults.analysis?.formQuality || 'Unknown'}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center mb-3">
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                        <span className="ml-2 font-medium text-gray-900">Risk Level</span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(analysisResults.riskLevel)}`}>
                        {analysisResults.riskLevel?.toUpperCase() || 'UNKNOWN'}
                      </span>
                    </div>
                  </div>

                  {analysisResults.analysis?.biomechanicalIssues?.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-medium text-gray-900 mb-3">Biomechanical Issues</h4>
                      <ul className="list-disc list-inside space-y-1 text-gray-600">
                        {analysisResults.analysis.biomechanicalIssues.map((issue, index) => (
                          <li key={index}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysisResults.recommendations?.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-medium text-gray-900 mb-3">Recommendations</h4>
                      <ul className="list-disc list-inside space-y-1 text-gray-600">
                        {analysisResults.recommendations.map((rec, index) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Rehabilitation Tab */}
          {activeTab === 'rehab' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Rehabilitation Planning
                </h2>
                <p className="text-gray-600 mb-6">
                  Create personalized rehabilitation plans based on injury risks
                </p>

                <button
                  onClick={() => generateRehabPlan(['knee_pain', 'shoulder_imbalance'])}
                  disabled={isGenerating}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isGenerating ? 'Generating...' : 'Generate Rehab Plan'}
                </button>
              </div>

              {rehabPlan && (
                <div className="space-y-6">
                  {rehabPlan.phases?.map((phase, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">{phase.name}</h3>
                        <span className="text-sm text-gray-500 flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {phase.duration}
                        </span>
                      </div>

                      <p className="text-gray-600 mb-4">{phase.focus}</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Exercises</h4>
                          <ul className="list-disc list-inside space-y-1 text-gray-600">
                            {phase.exercises?.map((exercise, i) => (
                              <li key={i}>{exercise}</li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Precautions</h4>
                          <ul className="list-disc list-inside space-y-1 text-gray-600">
                            {phase.precautions?.map((precaution, i) => (
                              <li key={i}>{precaution}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Prevention Program Tab */}
          {activeTab === 'prevention' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Preventive Training Program
                </h2>
                <p className="text-gray-600 mb-6">
                  Generate customized programs to prevent injuries and enhance performance
                </p>

                <button
                  onClick={() => generatePreventiveProgram(['knee_stability', 'core_strength'])}
                  disabled={isGenerating}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isGenerating ? 'Generating...' : 'Generate Program'}
                </button>
              </div>

              {preventiveProgram && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">{preventiveProgram.focus}</h3>
                    <span className="text-sm text-gray-500">
                      {preventiveProgram.duration} • {preventiveProgram.sessionsPerWeek}x per week
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                        <Target className="h-5 w-5 mr-2 text-blue-600" />
                        Warm-up
                      </h4>
                      <ul className="space-y-1 text-gray-600">
                        {preventiveProgram.components?.warmUp?.map((item, i) => (
                          <li key={i} className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                        <Zap className="h-5 w-5 mr-2 text-orange-600" />
                        Main Exercises
                      </h4>
                      <ul className="space-y-1 text-gray-600">
                        {preventiveProgram.components?.mainExercises?.map((item, i) => (
                          <li key={i} className="flex items-center">
                            <Activity className="h-4 w-4 text-blue-600 mr-2" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                        <Shield className="h-5 w-5 mr-2 text-green-600" />
                        Cool-down
                      </h4>
                      <ul className="space-y-1 text-gray-600">
                        {preventiveProgram.components?.coolDown?.map((item, i) => (
                          <li key={i} className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-3">Progression Plan</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {Object.entries(preventiveProgram.progression || {}).map(([phase, details]) => (
                        <div key={phase} className="bg-gray-50 rounded-lg p-4">
                          <h5 className="font-medium text-gray-900 capitalize">{phase.replace('_', ' ')}</h5>
                          <p className="text-sm text-gray-600 mt-1">{details.focus}</p>
                          <p className="text-xs text-gray-500 mt-2">{details.intensity}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Training Load Tab */}
          {activeTab === 'load' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Training Load Analysis
                </h2>
                <p className="text-gray-600 mb-6">
                  Analyze training load patterns and recovery needs
                </p>

                <button
                  onClick={() => analyzeTrainingLoad([
                    { date: '2024-01-01', trainingLoad: 100 },
                    { date: '2024-01-02', trainingLoad: 120 },
                    { date: '2024-01-03', trainingLoad: 90 }
                  ])}
                  disabled={isGenerating}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isGenerating ? 'Analyzing...' : 'Analyze Load'}
                </button>
              </div>

              {loadAnalysis && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Load Status</h3>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Acute Load (7 days)</span>
                        <span className="font-semibold">{loadAnalysis.currentLoad?.acute || 0}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Chronic Load (28 days)</span>
                        <span className="font-semibold">{loadAnalysis.currentLoad?.chronic || 0}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Acute:Chronic Ratio</span>
                        <span className={`font-semibold ${loadAnalysis.currentLoad?.ratio > 1.5 ? 'text-red-600' : 'text-green-600'}`}>
                          {(loadAnalysis.currentLoad?.ratio || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recovery Assessment</h3>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Recovery Level</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          loadAnalysis.recoveryNeeds?.level === 'high' ? 'bg-red-100 text-red-800' :
                          loadAnalysis.recoveryNeeds?.level === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {loadAnalysis.recoveryNeeds?.level || 'normal'}
                        </span>
                      </div>

                      <div>
                        <span className="text-gray-600 block mb-2">Recommended Duration</span>
                        <span className="font-semibold">{loadAnalysis.recoveryNeeds?.duration || 'standard'}</span>
                      </div>
                    </div>
                  </div>

                  {loadAnalysis.recommendations?.length > 0 && (
                    <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-blue-900 mb-4">Recommendations</h3>
                      <ul className="space-y-2">
                        {loadAnalysis.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start">
                            <CheckCircle className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                            <span className="text-blue-800">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvancedInjuryPrevention;