// Institutional Partnerships Component
// White-label solutions and institutional management

import React, { useState, useEffect } from 'react';
import { Building, Users, Settings, Palette, BarChart3, Key, Shield, Globe, Upload, Download, Plus, Edit, Trash2 } from 'lucide-react';
import api from '../services/api';

const InstitutionalPartnerships = ({ user }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [institutions, setInstitutions] = useState([]);
  const [currentInstitution, setCurrentInstitution] = useState(null);
  const [whiteLabelConfig, setWhiteLabelConfig] = useState(null);
  const [teams, setTeams] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Form states
  const [newInstitution, setNewInstitution] = useState({
    name: '',
    type: 'university',
    domain: '',
    primarySport: 'football',
    address: {},
    contactInfo: {},
    subscriptionPlan: 'basic',
    maxUsers: 100,
    maxTeams: 10,
    whiteLabelEnabled: false
  });

  const [whiteLabelForm, setWhiteLabelForm] = useState({
    primaryColor: '#3B82F6',
    secondaryColor: '#1F2937',
    logoUrl: '',
    faviconUrl: '',
    customDomain: '',
    appName: '',
    tagline: '',
    supportEmail: ''
  });

  useEffect(() => {
    if (user?.role === 'admin') {
      loadInstitutions();
    } else if (user?.institutionId) {
      loadInstitutionDetails(user.institutionId);
    }
  }, [user]);

  const loadInstitutions = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/institutions');
      if (response.data.success) {
        setInstitutions(response.data.data);
      }
    } catch (error) {
      console.error('Error loading institutions:', error);
      alert('Failed to load institutions');
    } finally {
      setIsLoading(false);
    }
  };

  const loadInstitutionDetails = async (institutionId) => {
    setIsLoading(true);
    try {
      const [instResponse, teamsResponse, analyticsResponse] = await Promise.all([
        api.get(`/institutions/${institutionId}`),
        api.get(`/institutions/${institutionId}/teams`),
        api.get(`/institutions/${institutionId}/analytics`)
      ]);

      if (instResponse.data.success) {
        setCurrentInstitution(instResponse.data.data);
        setWhiteLabelConfig(instResponse.data.data.whiteLabelConfig);
      }

      if (teamsResponse.data.success) {
        setTeams(teamsResponse.data.data);
      }

      if (analyticsResponse.data.success) {
        setAnalytics(analyticsResponse.data.data);
      }
    } catch (error) {
      console.error('Error loading institution details:', error);
      alert('Failed to load institution details');
    } finally {
      setIsLoading(false);
    }
  };

  const createInstitution = async () => {
    setIsLoading(true);
    try {
      const response = await api.post('/institutions', newInstitution);
      if (response.data.success) {
        alert('Institution created successfully!');
        setShowCreateForm(false);
        setNewInstitution({
          name: '',
          type: 'university',
          domain: '',
          primarySport: 'football',
          address: {},
          contactInfo: {},
          subscriptionPlan: 'basic',
          maxUsers: 100,
          maxTeams: 10,
          whiteLabelEnabled: false
        });
        loadInstitutions();
      }
    } catch (error) {
      console.error('Error creating institution:', error);
      alert('Failed to create institution');
    } finally {
      setIsLoading(false);
    }
  };

  const createWhiteLabelConfig = async () => {
    if (!currentInstitution) return;

    setIsLoading(true);
    try {
      const response = await api.post(`/institutions/${currentInstitution.id}/white-label`, whiteLabelForm);
      if (response.data.success) {
        alert('White-label configuration created successfully!');
        setWhiteLabelConfig(response.data.data);
      }
    } catch (error) {
      console.error('Error creating white-label config:', error);
      alert('Failed to create white-label configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const createTeam = async (teamData) => {
    if (!currentInstitution) return;

    setIsLoading(true);
    try {
      const response = await api.post(`/institutions/${currentInstitution.id}/teams`, teamData);
      if (response.data.success) {
        alert('Team created successfully!');
        loadInstitutionDetails(currentInstitution.id);
      }
    } catch (error) {
      console.error('Error creating team:', error);
      alert('Failed to create team');
    } finally {
      setIsLoading(false);
    }
  };

  const bulkImportAthletes = async (athletesData) => {
    if (!currentInstitution) return;

    setIsLoading(true);
    try {
      const response = await api.post(`/institutions/${currentInstitution.id}/athletes/bulk`, {
        athletes: athletesData
      });
      if (response.data.success) {
        alert(`Import completed: ${response.data.data.successful.length} successful, ${response.data.data.failed.length} failed`);
        loadInstitutionDetails(currentInstitution.id);
      }
    } catch (error) {
      console.error('Error importing athletes:', error);
      alert('Failed to import athletes');
    } finally {
      setIsLoading(false);
    }
  };

  const getInstitutionTypeIcon = (type) => {
    switch (type) {
      case 'university': return '🎓';
      case 'high_school': return '🏫';
      case 'club': return '⚽';
      case 'professional': return '🏆';
      default: return '🏢';
    }
  };

  const getSubscriptionBadgeColor = (plan) => {
    switch (plan) {
      case 'basic': return 'bg-gray-100 text-gray-800';
      case 'premium': return 'bg-blue-100 text-blue-800';
      case 'enterprise': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Building className="h-8 w-8 text-blue-600 mr-3" />
              Institutional Partnerships
            </h1>
            <p className="text-gray-600 mt-1">
              White-label solutions and institutional management platform
            </p>
          </div>

          {user?.role === 'admin' && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Institution
            </button>
          )}
        </div>
      </div>

      {/* Create Institution Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Institution</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Institution Name</label>
                  <input
                    type="text"
                    value={newInstitution.name}
                    onChange={(e) => setNewInstitution({...newInstitution, name: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter institution name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={newInstitution.type}
                    onChange={(e) => setNewInstitution({...newInstitution, type: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="university">University</option>
                    <option value="high_school">High School</option>
                    <option value="club">Sports Club</option>
                    <option value="professional">Professional Team</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Domain</label>
                  <input
                    type="text"
                    value={newInstitution.domain}
                    onChange={(e) => setNewInstitution({...newInstitution, domain: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="institution.edu"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Primary Sport</label>
                  <select
                    value={newInstitution.primarySport}
                    onChange={(e) => setNewInstitution({...newInstitution, primarySport: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="football">Football</option>
                    <option value="basketball">Basketball</option>
                    <option value="baseball">Baseball</option>
                    <option value="soccer">Soccer</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subscription Plan</label>
                  <select
                    value={newInstitution.subscriptionPlan}
                    onChange={(e) => setNewInstitution({...newInstitution, subscriptionPlan: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="basic">Basic</option>
                    <option value="premium">Premium</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Users</label>
                  <input
                    type="number"
                    value={newInstitution.maxUsers}
                    onChange={(e) => setNewInstitution({...newInstitution, maxUsers: parseInt(e.target.value)})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    max="10000"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="whiteLabelEnabled"
                  checked={newInstitution.whiteLabelEnabled}
                  onChange={(e) => setNewInstitution({...newInstitution, whiteLabelEnabled: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="whiteLabelEnabled" className="ml-2 text-sm text-gray-700">
                  Enable White-Label Features
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={createInstitution}
                disabled={isLoading || !newInstitution.name}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Creating...' : 'Create Institution'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin View - All Institutions */}
      {user?.role === 'admin' && (
        <div className="bg-white rounded-lg shadow-lg">
          {/* Navigation Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex items-center px-6 py-4 border-b-2 font-medium text-sm ${
                  activeTab === 'overview' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Building className="h-5 w-5 mr-2" />
                Institutions Overview
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600 mt-4">Loading institutions...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {institutions.map((institution) => (
                      <div key={institution.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            <span className="text-2xl mr-3">{getInstitutionTypeIcon(institution.type)}</span>
                            <div>
                              <h3 className="font-semibold text-gray-900">{institution.name}</h3>
                              <p className="text-sm text-gray-600 capitalize">{institution.type.replace('_', ' ')}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSubscriptionBadgeColor(institution.subscription?.plan)}`}>
                            {institution.subscription?.plan || 'basic'}
                          </span>
                        </div>

                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex justify-between">
                            <span>Users:</span>
                            <span>{institution.stats?.totalUsers || 0} / {institution.subscription?.maxUsers || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Teams:</span>
                            <span>{institution.stats?.totalTeams || 0} / {institution.subscription?.maxTeams || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Athletes:</span>
                            <span>{institution.stats?.totalAthletes || 0}</span>
                          </div>
                        </div>

                        <div className="mt-4 flex space-x-2">
                          <button
                            onClick={() => {
                              setCurrentInstitution(institution);
                              setActiveTab('manage');
                            }}
                            className="flex-1 text-xs bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700"
                          >
                            Manage
                          </button>
                          <button className="flex-1 text-xs bg-gray-200 text-gray-700 px-3 py-2 rounded hover:bg-gray-300">
                            Analytics
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Institution Management View */}
      {(user?.role === 'institution_admin' || currentInstitution) && (
        <div className="bg-white rounded-lg shadow-lg">
          {/* Navigation Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
                { id: 'teams', label: 'Teams', icon: Users },
                { id: 'branding', label: 'White Label', icon: Palette },
                { id: 'integrations', label: 'Integrations', icon: Settings },
                { id: 'api', label: 'API Access', icon: Key }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-6 py-4 border-b-2 font-medium text-sm ${
                    activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="h-5 w-5 mr-2" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && currentInstitution && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <div className="flex items-center">
                      <Users className="h-8 w-8 text-blue-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-blue-600">Total Users</p>
                        <p className="text-2xl font-bold text-blue-900">{currentInstitution.stats?.totalUsers || 0}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 p-6 rounded-lg">
                    <div className="flex items-center">
                      <Shield className="h-8 w-8 text-green-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-green-600">Active Teams</p>
                        <p className="text-2xl font-bold text-green-900">{currentInstitution.stats?.totalTeams || 0}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 p-6 rounded-lg">
                    <div className="flex items-center">
                      <BarChart3 className="h-8 w-8 text-purple-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-purple-600">Athletes</p>
                        <p className="text-2xl font-bold text-purple-900">{currentInstitution.stats?.totalAthletes || 0}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-orange-50 p-6 rounded-lg">
                    <div className="flex items-center">
                      <Globe className="h-8 w-8 text-orange-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-orange-600">Subscription</p>
                        <p className="text-2xl font-bold text-orange-900 capitalize">{currentInstitution.subscription?.plan || 'Basic'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {analytics && (
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Analytics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Team Performance</h4>
                        <p className="text-gray-600">Average win rate: {analytics.teamPerformance?.averageWinRate || 0}%</p>
                        <p className="text-gray-600">Active teams: {analytics.teamPerformance?.totalTeams || 0}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Athlete Engagement</h4>
                        <p className="text-gray-600">Active users: {analytics.athleteEngagement?.activeUsers || 0}</p>
                        <p className="text-gray-600">Session frequency: {analytics.athleteEngagement?.sessionFrequency || 0}x/week</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Teams Tab */}
            {activeTab === 'teams' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">Team Management</h2>
                  <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Team
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {teams.map((team) => (
                    <div key={team.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                      <h3 className="font-semibold text-gray-900 mb-2">{team.name}</h3>
                      <p className="text-sm text-gray-600 mb-4 capitalize">{team.sport} - {team.level}</p>

                      <div className="flex justify-between text-sm text-gray-600 mb-4">
                        <span>Athletes: {team.athletes?.length || 0}</span>
                        <span>Season: {team.season}</span>
                      </div>

                      <div className="flex space-x-2">
                        <button className="flex-1 text-xs bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700">
                          Manage
                        </button>
                        <button className="flex-1 text-xs bg-gray-200 text-gray-700 px-3 py-2 rounded hover:bg-gray-300">
                          Roster
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="font-semibold text-blue-900 mb-2">Bulk Athlete Import</h3>
                  <p className="text-blue-800 mb-4">Import multiple athletes at once using CSV or Excel files.</p>
                  <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <Upload className="h-4 w-4 mr-2" />
                    Import Athletes
                  </button>
                </div>
              </div>
            )}

            {/* White Label Tab */}
            {activeTab === 'branding' && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">White-Label Configuration</h2>
                  <p className="text-gray-600 mb-6">
                    Customize the platform appearance for your institution
                  </p>
                </div>

                {!whiteLabelConfig ? (
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Set Up White-Label Branding</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
                        <input
                          type="color"
                          value={whiteLabelForm.primaryColor}
                          onChange={(e) => setWhiteLabelForm({...whiteLabelForm, primaryColor: e.target.value})}
                          className="w-full h-10 border border-gray-300 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Color</label>
                        <input
                          type="color"
                          value={whiteLabelForm.secondaryColor}
                          onChange={(e) => setWhiteLabelForm({...whiteLabelForm, secondaryColor: e.target.value})}
                          className="w-full h-10 border border-gray-300 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">App Name</label>
                        <input
                          type="text"
                          value={whiteLabelForm.appName}
                          onChange={(e) => setWhiteLabelForm({...whiteLabelForm, appName: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Your Institution's App"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
                        <input
                          type="text"
                          value={whiteLabelForm.tagline}
                          onChange={(e) => setWhiteLabelForm({...whiteLabelForm, tagline: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Empowering athletes..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                        <input
                          type="url"
                          value={whiteLabelForm.logoUrl}
                          onChange={(e) => setWhiteLabelForm({...whiteLabelForm, logoUrl: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="https://..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Custom Domain</label>
                        <input
                          type="text"
                          value={whiteLabelForm.customDomain}
                          onChange={(e) => setWhiteLabelForm({...whiteLabelForm, customDomain: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="athletics.yourinstitution.edu"
                        />
                      </div>
                    </div>

                    <div className="mt-6 flex justify-center">
                      <button
                        onClick={createWhiteLabelConfig}
                        disabled={isLoading}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {isLoading ? 'Creating...' : 'Create White-Label Configuration'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <Shield className="h-6 w-6 text-green-600 mr-2" />
                      <h3 className="font-semibold text-green-900">White-Label Active</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-green-800">App Name: <span className="font-medium">{whiteLabelConfig.branding?.appName}</span></p>
                        <p className="text-sm text-green-800">Custom Domain: <span className="font-medium">{whiteLabelConfig.branding?.customDomain || 'Not configured'}</span></p>
                      </div>
                      <div>
                        <p className="text-sm text-green-800">Primary Color: <span className="font-medium">{whiteLabelConfig.branding?.primaryColor}</span></p>
                        <p className="text-sm text-green-800">Secondary Color: <span className="font-medium">{whiteLabelConfig.branding?.secondaryColor}</span></p>
                      </div>
                    </div>

                    <div className="mt-4 flex space-x-3">
                      <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                        Edit Configuration
                      </button>
                      <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">
                        Preview
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* API Access Tab */}
            {activeTab === 'api' && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">API Access & Integration</h2>
                  <p className="text-gray-600 mb-6">
                    Manage API credentials and integration settings
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <Key className="h-6 w-6 text-yellow-600 mr-2" />
                    <h3 className="font-semibold text-yellow-900">API Credentials</h3>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-yellow-800 mb-1">API Key</label>
                      <div className="flex items-center space-x-2">
                        <code className="flex-1 bg-yellow-100 px-3 py-2 rounded text-sm font-mono">
                          {currentInstitution?.apiCredentials?.apiKey || 'Not generated'}
                        </code>
                        <button className="px-3 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700">
                          Regenerate
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-yellow-800 mb-1">Webhook URL</label>
                      <code className="block bg-yellow-100 px-3 py-2 rounded text-sm font-mono">
                        {`${process.env.REACT_APP_API_URL}/api/v1/institutions/${currentInstitution?.id}/webhook`}
                      </code>
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-yellow-100 rounded">
                    <h4 className="font-medium text-yellow-900 mb-2">API Documentation</h4>
                    <p className="text-yellow-800 text-sm mb-3">
                      Access comprehensive API documentation and integration guides.
                    </p>
                    <button className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700">
                      View Documentation
                    </button>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="font-semibold text-blue-900 mb-4">Integration Options</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded border border-blue-300">
                      <h4 className="font-medium text-blue-900 mb-2">Learning Management System</h4>
                      <p className="text-blue-800 text-sm mb-3">Integrate with Canvas, Blackboard, or Moodle</p>
                      <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                        Configure
                      </button>
                    </div>

                    <div className="bg-white p-4 rounded border border-blue-300">
                      <h4 className="font-medium text-blue-900 mb-2">Student Information System</h4>
                      <p className="text-blue-800 text-sm mb-3">Connect with Banner, PeopleSoft, or custom SIS</p>
                      <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                        Configure
                      </button>
                    </div>

                    <div className="bg-white p-4 rounded border border-blue-300">
                      <h4 className="font-medium text-blue-900 mb-2">Athletic Management System</h4>
                      <p className="text-blue-800 text-sm mb-3">Sync with existing athletic software</p>
                      <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                        Configure
                      </button>
                    </div>

                    <div className="bg-white p-4 rounded border border-blue-300">
                      <h4 className="font-medium text-blue-900 mb-2">Custom Webhooks</h4>
                      <p className="text-blue-800 text-sm mb-3">Set up real-time data synchronization</p>
                      <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                        Configure
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InstitutionalPartnerships;