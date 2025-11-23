/**
 * Safe Space Monitoring Dashboard - Main Application Component
 * 
 * This is the root component of the React application.
 * It sets up routing, global state management, and real-time connections.
 * 
 * @module App
 */

import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [backendStatus, setBackendStatus] = useState({
    connected: false,
    loading: true,
    message: 'Checking connection...',
    environment: '',
    version: '',
    serverTime: '',
    uptime: 0,
  });

  const [testResults, setTestResults] = useState({
    healthCheck: '⏳ Pending',
    apiTest: '⏳ Pending',
  });

  useEffect(() => {
    testBackendConnection();
  }, []);

  const testBackendConnection = async () => {
    setBackendStatus((prev) => ({ ...prev, loading: true }));
    setTestResults({ healthCheck: '⏳ Testing...', apiTest: '⏳ Testing...' });

    // Test 1: Health Check
    try {
      const healthRes = await fetch('/api/health');
      const healthData = await healthRes.json();
      
      if (healthData.status === 'success') {
        setTestResults((prev) => ({ ...prev, healthCheck: '✅ Passed' }));
        setBackendStatus({
          connected: true,
          loading: false,
          message: healthData.message,
          environment: healthData.environment,
          version: healthData.version,
          serverTime: healthData.timestamp,
          uptime: 0,
        });
      }
    } catch (err) {
      console.error('Health check failed:', err);
      setTestResults((prev) => ({ ...prev, healthCheck: '❌ Failed' }));
      setBackendStatus({
        connected: false,
        loading: false,
        message: 'Backend is offline',
        environment: '',
        version: '',
        serverTime: '',
        uptime: 0,
      });
      return;
    }

    // Test 2: API Test
    try {
      const testRes = await fetch('/api/test');
      const testData = await testRes.json();
      
      if (testData.status === 'success') {
        setTestResults((prev) => ({ ...prev, apiTest: '✅ Passed' }));
        setBackendStatus((prev) => ({
          ...prev,
          serverTime: testData.data.serverTime,
          uptime: Math.floor(testData.data.uptime),
        }));
      }
    } catch (err) {
      console.error('API test failed:', err);
      setTestResults((prev) => ({ ...prev, apiTest: '❌ Failed' }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🛡️</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold">Safe Space</h1>
                <p className="text-xs text-gray-400">Central Monitoring Unit</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  backendStatus.connected ? 'bg-green-500' : 'bg-red-500'
                } animate-pulse`}
              ></div>
              <span className="text-sm text-gray-300">
                {backendStatus.connected ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-5xl mx-auto">
          {/* System Overview Card */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 mb-8 border border-gray-700">
            <h2 className="text-3xl font-bold mb-2 text-blue-400">
              System Test Dashboard
            </h2>
            <p className="text-gray-400 mb-8">
              Testing connection between Frontend (React + Vite) and Backend (Node.js + Express)
            </p>

            {/* Status Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Backend Status */}
              <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-semibold mb-4 text-blue-300">
                  Backend Status
                </h3>
                {backendStatus.loading ? (
                  <div className="text-center text-gray-400 py-4">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                    <p className="mt-2">Connecting...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Connection:</span>
                      <span
                        className={`font-semibold ${
                          backendStatus.connected ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {backendStatus.connected ? '✅ Connected' : '❌ Disconnected'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Version:</span>
                      <span className="text-white">{backendStatus.version || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Environment:</span>
                      <span className="text-white capitalize">
                        {backendStatus.environment || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Uptime:</span>
                      <span className="text-white">
                        {backendStatus.uptime > 0 ? `${backendStatus.uptime}s` : 'N/A'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Test Results */}
              <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-semibold mb-4 text-blue-300">
                  Connection Tests
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Health Check:</span>
                    <span className="font-mono text-sm">{testResults.healthCheck}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">API Endpoint:</span>
                    <span className="font-mono text-sm">{testResults.apiTest}</span>
                  </div>
                  <button
                    onClick={testBackendConnection}
                    className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    🔄 Re-test Connection
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Technology Stack */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Frontend Card */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-bold mb-4 text-blue-400">Frontend Stack</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-center space-x-2">
                  <span className="text-blue-500">▸</span>
                  <span>React 18</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-blue-500">▸</span>
                  <span>Vite (Build Tool)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-blue-500">▸</span>
                  <span>Tailwind CSS</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-blue-500">▸</span>
                  <span>Redux Toolkit (Planned)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-blue-500">▸</span>
                  <span>Socket.IO Client (Planned)</span>
                </li>
              </ul>
            </div>

            {/* Backend Card */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-bold mb-4 text-blue-400">Backend Stack</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-center space-x-2">
                  <span className="text-green-500">▸</span>
                  <span>Node.js (LTS)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-green-500">▸</span>
                  <span>Express.js</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-green-500">▸</span>
                  <span>Winston (Logger)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-green-500">▸</span>
                  <span>Zod (Validation)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-green-500">▸</span>
                  <span>MQTT + Socket.IO (Planned)</span>
                </li>
              </ul>
            </div>
          </div>

          {/* System Info */}
          <div className="mt-6 bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-3 text-gray-300">System Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Server Time:</span>
                <p className="text-gray-300 font-mono text-xs mt-1">
                  {backendStatus.serverTime || 'N/A'}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Frontend URL:</span>
                <p className="text-gray-300 font-mono text-xs mt-1">
                  http://localhost:3000
                </p>
              </div>
              <div>
                <span className="text-gray-500">Backend URL:</span>
                <p className="text-gray-300 font-mono text-xs mt-1">
                  http://localhost:5000
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800/50 backdrop-blur-sm border-t border-gray-700 mt-12">
        <div className="container mx-auto px-6 py-6 text-center text-gray-400 text-sm">
          <p>Safe Space - AI-Powered Real-Time Accident Detection and Prevention</p>
          <p className="mt-2 text-xs">
            3-Tier Distributed Architecture: Detection Layer → Central Unit → End User Layer
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
