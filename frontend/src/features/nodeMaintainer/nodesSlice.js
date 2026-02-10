/**
 * Nodes Feature Slice
 * 
 * Redux Toolkit slice for managing node data, selection, and configuration state.
 * This handles the central state for all node-related operations.
 * 
 * @module features/nodeMaintainer/nodesSlice
 */

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  nodes: [
    {
      id: 'NODE-001',
      name: 'NODE-001',
      status: 'online',
      location: {
        latitude: 40.7128,
        longitude: -74.0060,
        address: 'Interstate 95, Mile Marker 145',
      },
      roadRules: {
        lanes: [
          {
            id: 1,
            name: 'Lane 1',
            type: 'Fast Lane',
            status: 'open', // 'open', 'blocked', 'right', 'left'
          },
          {
            id: 2,
            name: 'Lane 2',
            type: 'Middle Lane',
            status: 'right',
          },
          {
            id: 3,
            name: 'Lane 3',
            type: 'Slow Lane',
            status: 'left',
          },
        ],
        speedLimit: 120,
      },
      nodeSpecs: {
        cameraResolution: '1920x1080',
        frameRate: 30,
        ipAddress: '192.168.1.101',
        bandwidth: '100 Mbps',
        detectionSensitivity: 75,
        minObjectSize: 50,
      },
      health: {
        cpu: 35,
        temperature: 42,
        memory: 62,
        network: 98,
        storage: 62,
        currentFps: 30,
      },
      lanePolygons: [
        {
          id: 'poly-1',
          name: 'Lane 1',
          type: 'lane',
          points: [[40.7128, -74.0060], [40.7129, -74.0061], [40.7130, -74.0062]],
        },
        {
          id: 'poly-2',
          name: 'Lane 2',
          type: 'lane',
          points: [[40.7128, -74.0062], [40.7129, -74.0063], [40.7130, -74.0064]],
        },
      ],
      lastHeartbeat: '2024-01-15T10:30:00Z',
      lastUpdate: new Date().toISOString(),
    },
    {
      id: 'NODE-002',
      name: 'NODE-002',
      status: 'online',
      location: {
        latitude: 40.7200,
        longitude: -74.0100,
        address: 'Interstate 95, Mile 47',
      },
      roadRules: {
        lanes: [
          {
            id: 1,
            name: 'Lane 1',
            type: 'Fast Lane',
            status: 'open',
          },
          {
            id: 2,
            name: 'Lane 2',
            type: 'Middle Lane',
            status: 'blocked',
          },
        ],
        speedLimit: 100,
      },
      nodeSpecs: {
        cameraResolution: '1920x1080',
        frameRate: 30,
        ipAddress: '192.168.1.102',
        bandwidth: '100 Mbps',
        detectionSensitivity: 80,
        minObjectSize: 50,
      },
      health: {
        cpu: 45,
        temperature: 48,
        memory: 55,
        network: 92,
        storage: 58,
        currentFps: 28,
      },
      lanePolygons: [],
      lastHeartbeat: '2024-01-15T10:15:00Z',
      lastUpdate: new Date().toISOString(),
    },
    {
      id: 'NODE-003',
      name: 'NODE-003',
      status: 'offline',
      location: {
        latitude: 40.7300,
        longitude: -73.9950,
        address: 'Route 1, Section 4',
      },
      roadRules: {
        lanes: [
          {
            id: 1,
            name: 'Lane 1',
            type: 'Single Lane',
            status: 'blocked',
          },
        ],
        speedLimit: 80,
      },
      nodeSpecs: {
        cameraResolution: '1280x720',
        frameRate: 15,
        ipAddress: '192.168.1.103',
        bandwidth: '50 Mbps',
        detectionSensitivity: 60,
        minObjectSize: 100,
      },
      health: {
        cpu: 20,
        temperature: 35,
        memory: 40,
        network: 0,
        storage: 75,
        currentFps: 0,
      },
      lanePolygons: [],
      lastHeartbeat: '2024-01-14T18:45:00Z',
      lastUpdate: new Date().toISOString(),
    },
    {
      id: 'NODE-005',
      name: 'NODE-005',
      status: 'online',
      location: {
        latitude: 40.7400,
        longitude: -74.0200,
        address: 'Highway A1, Exit 23B',
      },
      roadRules: {
        lanes: [
          {
            id: 1,
            name: 'Lane 1',
            type: 'Exit Lane',
            status: 'right',
          },
          {
            id: 2,
            name: 'Lane 2',
            type: 'Main Lane',
            status: 'open',
          },
          {
            id: 3,
            name: 'Lane 3',
            type: 'Entry Lane',
            status: 'left',
          },
        ],
        speedLimit: 100,
      },
      nodeSpecs: {
        cameraResolution: '1920x1080',
        frameRate: 30,
        ipAddress: '192.168.1.105',
        bandwidth: '100 Mbps',
        detectionSensitivity: 75,
        minObjectSize: 50,
      },
      health: {
        cpu: 28,
        temperature: 40,
        memory: 50,
        network: 95,
        storage: 45,
        currentFps: 30,
      },
      lanePolygons: [],
      lastHeartbeat: '2024-01-15T10:25:00Z',
      lastUpdate: new Date().toISOString(),
    },
  ],
  selectedNodeId: 'NODE-001',
  currentTab: 'overview', // 'overview', 'roadConfig', 'nodeConfig', 'health', 'polygons'
  isLoading: false,
  error: null,
};

const nodesSlice = createSlice({
  name: 'nodes',
  initialState,
  reducers: {
    selectNode(state, action) {
      state.selectedNodeId = action.payload;
      state.currentTab = 'overview'; // Reset to overview when selecting a new node
    },

    setCurrentTab(state, action) {
      state.currentTab = action.payload;
    },

    updateNodeRoadRules(state, action) {
      const { nodeId, roadRules } = action.payload;
      const node = state.nodes.find(n => n.id === nodeId);
      if (node) {
        node.roadRules = { ...node.roadRules, ...roadRules };
      }
    },

    updateNodeSpecs(state, action) {
      const { nodeId, specs } = action.payload;
      const node = state.nodes.find(n => n.id === nodeId);
      if (node) {
        node.nodeSpecs = { ...node.nodeSpecs, ...specs };
      }
    },

    updateLaneStatus(state, action) {
      const { nodeId, laneId, status } = action.payload;
      const node = state.nodes.find(n => n.id === nodeId);
      if (node) {
        const lane = node.roadRules.lanes.find(l => l.id === laneId);
        if (lane) {
          lane.status = status;
        }
      }
    },

    addLane(state, action) {
      const { nodeId, lane } = action.payload;
      const node = state.nodes.find(n => n.id === nodeId);
      if (node) {
        node.roadRules.lanes.push(lane);
      }
    },

    removeLane(state, action) {
      const { nodeId, laneId } = action.payload;
      const node = state.nodes.find(n => n.id === nodeId);
      if (node) {
        node.roadRules.lanes = node.roadRules.lanes.filter(l => l.id !== laneId);
      }
    },

    addLanePolygon(state, action) {
      const { nodeId, polygon } = action.payload;
      const node = state.nodes.find(n => n.id === nodeId);
      if (node) {
        node.lanePolygons.push(polygon);
      }
    },

    updateLanePolygon(state, action) {
      const { nodeId, polygonId, polygon } = action.payload;
      const node = state.nodes.find(n => n.id === nodeId);
      if (node) {
        const idx = node.lanePolygons.findIndex(p => p.id === polygonId);
        if (idx !== -1) {
          node.lanePolygons[idx] = polygon;
        }
      }
    },

    deleteLanePolygon(state, action) {
      const { nodeId, polygonId } = action.payload;
      const node = state.nodes.find(n => n.id === nodeId);
      if (node) {
        node.lanePolygons = node.lanePolygons.filter(p => p.id !== polygonId);
      }
    },

    updateNodeHealth(state, action) {
      const { nodeId, health } = action.payload;
      const node = state.nodes.find(n => n.id === nodeId);
      if (node) {
        node.health = { ...node.health, ...health };
      }
    },

    setLoading(state, action) {
      state.isLoading = action.payload;
    },

    setError(state, action) {
      state.error = action.payload;
    },
  },
});

export const {
  selectNode,
  setCurrentTab,
  updateNodeRoadRules,
  updateNodeSpecs,
  updateLaneStatus,
  addLane,
  removeLane,
  addLanePolygon,
  updateLanePolygon,
  deleteLanePolygon,
  updateNodeHealth,
  setLoading,
  setError,
} = nodesSlice.actions;

// Selectors
export const selectAllNodes = (state) => state.nodes.nodes;
export const selectSelectedNodeId = (state) => state.nodes.selectedNodeId;
export const selectSelectedNode = (state) =>
  state.nodes.nodes.find(n => n.id === state.nodes.selectedNodeId);
export const selectCurrentTab = (state) => state.nodes.currentTab;
export const selectNodesLoading = (state) => state.nodes.isLoading;
export const selectNodesError = (state) => state.nodes.error;

export default nodesSlice.reducer;
