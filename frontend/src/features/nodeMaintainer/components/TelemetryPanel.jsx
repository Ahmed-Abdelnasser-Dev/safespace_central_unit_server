/**
 * TelemetryPanel Component
 * Displays comprehensive node telemetry and health data
 */

import React from 'react';
import { AlertCircle, CheckCircle, BarChart3, Cpu, Thermometer, Wifi, HardDrive } from 'lucide-react';

/**
 * TelemetryPanel - Shows all node metrics and status
 * @param {Object} props - Component props
 * @param {Object} props.node - Node data with all telemetry
 * @param {boolean} props.updating - Whether data is being updated
 */
function TelemetryPanel({ node = {}, updating = false }) {
  if (!node || Object.keys(node).length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <p className="text-gray-500">No node data available</p>
      </div>
    );
  }

  const {
    status = 'offline',
    nodeId = 'N/A',
    name = 'Unknown',
    streetName = 'Unknown Street',
    ipAddress = 'N/A',
    videoFeedUrl = null,
    latitude = 0,
    longitude = 0,
    // Camera config
    frameRate = 0,
    resolution = 'N/A',
    sensitivity = 0,
    minObjectSize = 0,
    bandwidth = 0,
    // Telemetry
    cpu = 0,
    temperature = 0,
    memory = 0,
    network = 0,
    storage = 0,
    // Uptime/Version
    uptimeSec = 0,
    firmwareVersion = 'unknown',
    modelVersion = 'unknown',
    // Road/Lane
    laneStatus = 'unknown',
    speedLimit = 0,
    lanes = [],
  } = node;

  // Format uptime to human-readable format
  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Determine health status based on CPU/Temp
  const getHealthStatus = () => {
    if (status === 'offline') return { level: 'critical', text: 'Offline' };
    if (cpu > 90 || temperature > 80) return { level: 'critical', text: 'Critical' };
    if (cpu > 75 || temperature > 70) return { level: 'warning', text: 'Warning' };
    return { level: 'healthy', text: 'Healthy' };
  };

  const health = getHealthStatus();
  const healthColors = {
    healthy: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
    critical: 'bg-red-50 border-red-200',
  };
  const healthIconColors = {
    healthy: 'text-green-600',
    warning: 'text-yellow-600',
    critical: 'text-red-600',
  };

  return (
    <div className="space-y-6">
      {/* Health Status Overview */}
      <div className={`rounded-lg border-2 p-6 ${healthColors[health.level]}`}>
        <div className="flex items-center gap-3 mb-2">
          {health.level === 'healthy' ? (
            <CheckCircle className={`w-6 h-6 ${healthIconColors[health.level]}`} />
          ) : (
            <AlertCircle className={`w-6 h-6 ${healthIconColors[health.level]}`} />
          )}
          <div>
            <p className="text-sm font-medium text-gray-700">Node Health</p>
            <p className={`text-lg font-bold ${healthIconColors[health.level]}`}>
              {health.text} {updating && <span className="text-xs ml-2">(updating...)</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Basic Information */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Node ID</p>
          <p className="text-sm font-mono text-gray-900 truncate">{nodeId}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Node Name</p>
          <p className="text-sm font-medium text-gray-900">{name}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Street</p>
          <p className="text-sm font-medium text-gray-900">{streetName}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">IP Address</p>
          <p className="text-sm font-mono text-gray-900">{ipAddress}</p>
        </div>
      </div>

      {/* Location Coordinates */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Location</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-600 mb-1">Latitude</p>
            <p className="text-sm font-mono font-medium text-gray-900">{latitude.toFixed(6)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">Longitude</p>
            <p className="text-sm font-mono font-medium text-gray-900">{longitude.toFixed(6)}</p>
          </div>
        </div>
      </div>

      {/* System Metrics */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">System Metrics</h4>
        <div className="grid grid-cols-3 gap-3">
          {/* CPU */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="w-4 h-4 text-blue-600" />
              <p className="text-xs font-semibold text-gray-600">CPU</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{cpu.toFixed(1)}%</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className={`h-2 rounded-full ${cpu > 80 ? 'bg-red-500' : 'bg-blue-500'}`}
                style={{ width: `${Math.min(cpu, 100)}%` }}
              />
            </div>
          </div>

          {/* Temperature */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Thermometer className="w-4 h-4 text-orange-600" />
              <p className="text-xs font-semibold text-gray-600">Temp</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{temperature.toFixed(1)}°C</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className={`h-2 rounded-full ${temperature > 80 ? 'bg-red-500' : 'bg-orange-500'}`}
                style={{ width: `${Math.min((temperature / 100) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Memory */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-purple-600" />
              <p className="text-xs font-semibold text-gray-600">Memory</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{memory.toFixed(1)}%</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="h-2 rounded-full bg-purple-500"
                style={{ width: `${Math.min(memory, 100)}%` }}
              />
            </div>
          </div>

          {/* Network */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Wifi className="w-4 h-4 text-green-600" />
              <p className="text-xs font-semibold text-gray-600">Network</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{network.toFixed(1)}%</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="h-2 rounded-full bg-green-500"
                style={{ width: `${Math.min(network, 100)}%` }}
              />
            </div>
          </div>

          {/* Storage */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <HardDrive className="w-4 h-4 text-indigo-600" />
              <p className="text-xs font-semibold text-gray-600">Storage</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{storage.toFixed(1)}%</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className={`h-2 rounded-full ${storage > 80 ? 'bg-red-500' : 'bg-indigo-500'}`}
                style={{ width: `${Math.min(storage, 100)}%` }}
              />
            </div>
          </div>

          {/* Bandwidth */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-xs font-semibold text-gray-600 mb-2">Bandwidth</p>
            <p className="text-2xl font-bold text-gray-900">{bandwidth.toFixed(1)} Mbps</p>
            <p className="text-xs text-gray-500 mt-1">Current usage</p>
          </div>
        </div>
      </div>

      {/* Camera Configuration */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Camera Configuration</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Frame Rate</p>
            <p className="text-lg font-bold text-gray-900">{frameRate} FPS</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Resolution</p>
            <p className="text-lg font-bold text-gray-900">{resolution}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Sensitivity</p>
            <p className="text-lg font-bold text-gray-900">{(sensitivity * 100).toFixed(0)}%</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Min Object Size</p>
            <p className="text-lg font-bold text-gray-900">{minObjectSize} px</p>
          </div>
        </div>
      </div>

      {/* Road Configuration */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Road Configuration</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Speed Limit</p>
            <p className="text-lg font-bold text-gray-900">{speedLimit} km/h</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Lane Status</p>
            <p className="text-lg font-bold text-gray-900 capitalize">{laneStatus}</p>
          </div>
          <div className="col-span-2 bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Active Lanes</p>
            <div className="space-y-2">
              {Array.isArray(lanes) && lanes.length > 0 ? (
                lanes.map((lane, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{lane.name || `Lane ${lane.id || idx + 1}`}</span>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded ${
                        lane.status === 'open'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {lane.status || 'unknown'}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No lanes configured</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* System Information */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">System Information</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Uptime</p>
            <p className="text-lg font-bold text-gray-900">{formatUptime(uptimeSec)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Firmware</p>
            <p className="text-sm font-mono text-gray-900">{firmwareVersion}</p>
          </div>
          <div className="col-span-2 bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">AI Model</p>
            <p className="text-sm font-mono text-gray-900">{modelVersion}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TelemetryPanel;
