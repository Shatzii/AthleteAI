// API Ecosystem Developer Platform Component
// Third-party API management and integration interface

import React, { useState, useEffect } from 'react';
import { Key, Webhook, FileText, BarChart3, Settings, Plus, Trash2, Copy, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import api from '../services/api';

const APIEcosystem = () => {
  const [activeTab, setActiveTab] = useState('keys');
  const [apiKeys, setApiKeys] = useState([]);
  const [documentation, setDocumentation] = useState(null);
  const [webhookEvents, setWebhookEvents] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form states
  const [newKeyForm, setNewKeyForm] = useState({
    name: '',
    owner: '',
    permissions: [],
    rateLimit: 100,
    description: ''
  });

  const [webhookForm, setWebhookForm] = useState({
    event: '',
    url: '',
    apiKey: ''
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      // Load API keys
      const keysResponse = await api.get('/ecosystem/keys');
      if (keysResponse.data.success) {
        setApiKeys(keysResponse.data.data);
      }

      // Load documentation
      const docsResponse = await api.get('/ecosystem/docs/v2');
      if (docsResponse.data.success) {
        setDocumentation(docsResponse.data.data);
      }

      // Load webhook events
      const eventsResponse = await api.get('/ecosystem/webhooks/events');
      if (eventsResponse.data.success) {
        setWebhookEvents(eventsResponse.data.data.events);
      }

      // Load permissions
      const permissionsResponse = await api.get('/ecosystem/permissions');
      if (permissionsResponse.data.success) {
        setPermissions(permissionsResponse.data.data.permissions);
      }

      // Load stats
      const statsResponse = await api.get('/ecosystem/stats');
      if (statsResponse.data.success) {
        setStats(statsResponse.data.data);
      }

    } catch (err) {
      console.error('Error loading initial data:', err);
      setError('Failed to load developer platform data');
    } finally {
      setLoading(false);
    }
  };

  const generateAPIKey = async () => {
    try {
      const response = await api.post('/ecosystem/keys/generate', newKeyForm);

      if (response.data.success) {
        setApiKeys(prev => [...prev, {
          ...response.data.data,
          usage: { requests: 0, rateLimited: 0 },
          active: true,
          lastUsed: null
        }]);

        // Reset form
        setNewKeyForm({
          name: '',
          owner: '',
          permissions: [],
          rateLimit: 100,
          description: ''
        });

        alert('API key generated successfully! Keep this key secure.');
      }
    } catch (err) {
      console.error('Error generating API key:', err);
      setError('Failed to generate API key');
    }
  };

  const deactivateAPIKey = async (keyId) => {
    if (!confirm('Are you sure you want to deactivate this API key? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/ecosystem/keys/${keyId}`);
      setApiKeys(prev => prev.map(key =>
        key.id === keyId ? { ...key, active: false } : key
      ));
    } catch (err) {
      console.error('Error deactivating API key:', err);
      setError('Failed to deactivate API key');
    }
  };

  const registerWebhook = async () => {
    try {
      const response = await api.post('/ecosystem/webhooks/register', webhookForm);

      if (response.data.success) {
        alert('Webhook registered successfully!');
        setWebhookForm({
          event: '',
          url: '',
          apiKey: ''
        });
      }
    } catch (err) {
      console.error('Error registering webhook:', err);
      setError('Failed to register webhook');
    }
  };

  const testWebhook = async () => {
    try {
      const response = await api.post('/ecosystem/webhooks/test', webhookForm);

      if (response.data.success) {
        alert('Test webhook delivered successfully!');
      } else {
        alert(`Test webhook failed: ${response.data.message}`);
      }
    } catch (err) {
      console.error('Error testing webhook:', err);
      setError('Failed to test webhook');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // Could add a toast notification here
  };

  const togglePermission = (permission) => {
    setNewKeyForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="api-ecosystem-container max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Settings className="h-8 w-8 text-blue-600 mr-3" />
              API Ecosystem
            </h1>
            <p className="text-gray-600 mt-1">
              Developer platform for third-party integrations
            </p>
          </div>

          {stats && (
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.activeKeys}</div>
                <div className="text-sm text-blue-600">Active Keys</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.totalRequests}</div>
                <div className="text-sm text-green-600">Total Requests</div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{stats.registeredWebhooks}</div>
                <div className="text-sm text-purple-600">Webhooks</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="flex">
            {[
              { id: 'keys', label: 'API Keys', icon: Key },
              { id: 'docs', label: 'Documentation', icon: FileText },
              { id: 'webhooks', label: 'Webhooks', icon: Webhook },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-6 py-4 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
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
          {/* API Keys Tab */}
          {activeTab === 'keys' && (
            <div className="space-y-6">
              {/* Generate New Key */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Plus className="h-5 w-5 mr-2" />
                  Generate New API Key
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Application Name
                    </label>
                    <input
                      type="text"
                      value={newKeyForm.name}
                      onChange={(e) => setNewKeyForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="My App"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Owner Email
                    </label>
                    <input
                      type="email"
                      value={newKeyForm.owner}
                      onChange={(e) => setNewKeyForm(prev => ({ ...prev, owner: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="developer@example.com"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Permissions
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {permissions.flatMap(scope =>
                      scope.permissions.map(permission => (
                        <label key={permission} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={newKeyForm.permissions.includes(permission)}
                            onChange={() => togglePermission(permission)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{permission}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rate Limit (requests/hour)
                    </label>
                    <input
                      type="number"
                      value={newKeyForm.rateLimit}
                      onChange={(e) => setNewKeyForm(prev => ({ ...prev, rateLimit: parseInt(e.target.value) }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                      max="10000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description (optional)
                    </label>
                    <input
                      type="text"
                      value={newKeyForm.description}
                      onChange={(e) => setNewKeyForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Brief description of your application"
                    />
                  </div>
                </div>

                <button
                  onClick={generateAPIKey}
                  disabled={!newKeyForm.name || !newKeyForm.owner || newKeyForm.permissions.length === 0}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Generate API Key
                </button>
              </div>

              {/* Existing Keys */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Your API Keys</h2>

                <div className="space-y-4">
                  {apiKeys.map(key => (
                    <div key={key.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-medium text-gray-900">{key.name}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            key.active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {key.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>

                        {key.active && (
                          <button
                            onClick={() => deactivateAPIKey(key.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                        <div>
                          <span className="text-sm text-gray-500">Key ID:</span>
                          <p className="font-mono text-sm">{key.id}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Rate Limit:</span>
                          <p className="text-sm">{key.rateLimit} req/hour</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Requests:</span>
                          <p className="text-sm">{key.usage?.requests || 0}</p>
                        </div>
                      </div>

                      <div className="mb-3">
                        <span className="text-sm text-gray-500">Permissions:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {key.permissions.map(permission => (
                            <span key={permission} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                              {permission}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">API Key:</span>
                        <code className="flex-1 bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                          {key.key}
                        </code>
                        <button
                          onClick={() => copyToClipboard(key.key)}
                          className="text-gray-600 hover:text-gray-800"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {apiKeys.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No API keys generated yet. Create your first key above.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Documentation Tab */}
          {activeTab === 'docs' && documentation && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">API Documentation</h2>
                <select className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="v2">Version 2.0</option>
                  <option value="v1">Version 1.0</option>
                </select>
              </div>

              {/* Authentication */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">Authentication</h3>
                <p className="text-blue-800 text-sm mb-2">
                  Include your API key in the request header:
                </p>
                <code className="block bg-blue-100 px-3 py-2 rounded text-sm">
                  X-API-Key: your_api_key_here
                </code>
              </div>

              {/* Endpoints */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Available Endpoints</h3>
                <div className="space-y-4">
                  {documentation.endpoints.map(endpoint => (
                    <div key={endpoint.name} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{endpoint.name}</h4>
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                          {endpoint.url}
                        </code>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">{endpoint.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {endpoint.methods.map(method => (
                          <span key={method} className={`px-2 py-1 rounded text-xs font-medium ${
                            method === 'GET' ? 'bg-green-100 text-green-800' :
                            method === 'POST' ? 'bg-blue-100 text-blue-800' :
                            method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {method}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rate Limiting */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-medium text-yellow-900 mb-2">Rate Limiting</h3>
                <p className="text-yellow-800 text-sm">
                  API requests are rate limited per API key. Default limit is 100 requests per hour.
                  Higher limits are available upon request.
                </p>
              </div>
            </div>
          )}

          {/* Webhooks Tab */}
          {activeTab === 'webhooks' && (
            <div className="space-y-6">
              {/* Register Webhook */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Plus className="h-5 w-5 mr-2" />
                  Register Webhook
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event
                    </label>
                    <select
                      value={webhookForm.event}
                      onChange={(e) => setWebhookForm(prev => ({ ...prev, event: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select an event</option>
                      {webhookEvents.map(event => (
                        <option key={event.name} value={event.name}>
                          {event.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Webhook URL
                    </label>
                    <input
                      type="url"
                      value={webhookForm.url}
                      onChange={(e) => setWebhookForm(prev => ({ ...prev, url: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://your-app.com/webhook"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      API Key
                    </label>
                    <input
                      type="text"
                      value={webhookForm.apiKey}
                      onChange={(e) => setWebhookForm(prev => ({ ...prev, apiKey: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Your API key"
                    />
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={registerWebhook}
                    disabled={!webhookForm.event || !webhookForm.url || !webhookForm.apiKey}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Register Webhook
                  </button>

                  <button
                    onClick={testWebhook}
                    disabled={!webhookForm.event || !webhookForm.url || !webhookForm.apiKey}
                    className="bg-gray-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Test Webhook
                  </button>
                </div>
              </div>

              {/* Available Events */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Events</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {webhookEvents.map(event => (
                    <div key={event.name} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-2">{event.name}</h3>
                      <p className="text-gray-600 text-sm">{event.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && stats && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">API Analytics</h2>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Key className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Active Keys</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.activeKeys}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <BarChart3 className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Requests</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalRequests}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <AlertCircle className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Rate Limited</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.rateLimited}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Webhook className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Webhooks</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.registeredWebhooks}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Logs */}
              {stats.recentLogs && stats.recentLogs.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Recent API Requests</h3>
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Timestamp
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Method
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Endpoint
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              API Key
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {stats.recentLogs.map(log => (
                            <tr key={log.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {new Date(log.timestamp).toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  log.method === 'GET' ? 'bg-green-100 text-green-800' :
                                  log.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                                  log.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {log.method}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {log.endpoint}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  log.status >= 200 && log.status < 300 ? 'bg-green-100 text-green-800' :
                                  log.status >= 400 ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {log.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                                {log.apiKey ? `${log.apiKey.substring(0, 8)}...` : 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default APIEcosystem;