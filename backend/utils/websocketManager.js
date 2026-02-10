/**
 * WebSocket Manager for Node Connections
 * 
 * Manages bidirectional real-time communication with Detection Nodes:
 * - Node registration and authentication
 * - Heartbeat monitoring
 * - Video frame streaming
 * - Incident reporting
 * - Configuration updates
 * 
 * @module utils/websocketManager
 */

const WebSocket = require('ws');
const { logger } = require('./logger');
const { prisma } = require('./prisma');

class WebSocketManager {
  constructor() {
    this.wss = null;
    this.nodeConnections = new Map(); // nodeId -> WebSocket
    this.dashboardClients = new Set(); // Dashboard WebSocket clients
  }

  /**
   * Initialize WebSocket server
   * @param {http.Server} server - HTTP server instance
   */
  initialize(server) {
    this.wss = new WebSocket.Server({ 
      server,
      path: '/ws/nodes'
    });

    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });

    logger.info('WebSocket server initialized at /ws/nodes');
  }

  /**
   * Handle new WebSocket connection
   */
  handleConnection(ws, req) {
    const clientType = this.identifyClient(req);
    
    logger.info(`New WebSocket connection: ${clientType}`);

    ws.isAlive = true;
    ws.clientType = clientType;

    // Heartbeat ping/pong
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        await this.handleMessage(ws, message);
      } catch (error) {
        logger.error('WebSocket message error:', error);
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: error.message 
        }));
      }
    });

    ws.on('close', () => {
      this.handleDisconnect(ws);
    });

    ws.on('error', (error) => {
      logger.error('WebSocket error:', error);
    });
  }

  /**
   * Identify client type from request
   */
  identifyClient(req) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    const clientType = url.searchParams.get('client');
    
    // Dashboard clients connect with client=dashboard
    if (clientType === 'dashboard') {
      return 'dashboard';
    }
    
    // Detection nodes connect with token
    return 'node';
  }

  /**
   * Handle incoming WebSocket messages
   */
  async handleMessage(ws, message) {
    const { type, nodeId } = message;

    switch (type) {
      case 'register':
        await this.handleNodeRegistration(ws, message);
        break;

      case 'heartbeat':
        await this.handleHeartbeat(ws, message);
        break;

      case 'incident':
        await this.handleIncident(ws, message);
        break;

      case 'video_frame':
        await this.handleVideoFrame(ws, message);
        break;

      case 'dashboard_subscribe':
        this.handleDashboardSubscribe(ws, message);
        break;

      default:
        logger.warn(`Unknown message type: ${type}`);
    }
  }

  /**
   * Handle node registration
   */
  async handleNodeRegistration(ws, message) {
    const { nodeId, token, timestamp } = message;

    // Verify node exists in database
    const node = await prisma.node.findUnique({
      where: { nodeId }
    });

    if (!node) {
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Node not registered in database' 
      }));
      ws.close();
      return;
    }

    // Store connection
    this.nodeConnections.set(nodeId, ws);
    ws.nodeId = nodeId;
    ws.clientType = 'node';

    logger.info(`Node ${nodeId} registered via WebSocket`);

    // Send acknowledgment
    ws.send(JSON.stringify({
      type: 'registered',
      nodeId,
      timestamp: new Date().toISOString(),
      message: 'Successfully registered'
    }));

    // Notify dashboards
    this.broadcastToDashboards({
      type: 'node_connected',
      nodeId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle heartbeat from node
   */
  async handleHeartbeat(ws, message) {
    const { nodeId, timestamp, status, uptimeSec, health, firmwareVersion, modelVersion } = message;

    // Update database
    await prisma.node.update({
      where: { nodeId },
      data: {
        status,
        lastHeartbeat: new Date(timestamp),
        lastUpdate: new Date(),
        uptimeSec,
        health,
        firmwareVersion: firmwareVersion || undefined,
        modelVersion: modelVersion || undefined,
      },
    });

    logger.debug(`Heartbeat from ${nodeId}: status=${status}, cpu=${health.cpu}%`);

    // Broadcast to dashboards
    this.broadcastToDashboards({
      type: 'node_heartbeat',
      nodeId,
      status,
      health,
      timestamp,
      uptimeSec,
      firmwareVersion,
      modelVersion,
    });

    // Send acknowledgment
    ws.send(JSON.stringify({
      type: 'heartbeat_ack',
      nodeId,
      timestamp: new Date().toISOString(),
      nextHeartbeatSec: 30,
    }));
  }

  /**
   * Handle incident report from node
   */
  async handleIncident(ws, message) {
    const { nodeId, timestamp, location, severity, confidence, incidentType, laneId, metadata } = message;

    logger.warn(`Incident reported by ${nodeId}: type=${incidentType}, severity=${severity}, confidence=${confidence}`);

    // Broadcast to dashboards immediately
    this.broadcastToDashboards({
      type: 'incident',
      nodeId,
      timestamp,
      location,
      severity,
      confidence,
      incidentType,
      laneId,
      metadata,
    });

    // Send acknowledgment
    ws.send(JSON.stringify({
      type: 'incident_ack',
      nodeId,
      timestamp: new Date().toISOString(),
      message: 'Incident received'
    }));
  }

  /**
   * Handle video frame from node
   */
  async handleVideoFrame(ws, message) {
    const { nodeId, frameData, timestamp, frameId } = message;

    // Broadcast frame to dashboards watching this node
    this.broadcastToDashboards({
      type: 'video_frame',
      nodeId,
      frameData, // Base64 encoded JPEG
      timestamp,
      frameId,
    });
  }

  /**
   * Handle dashboard client subscribing to node feeds
   */
  handleDashboardSubscribe(ws, message) {
    const { nodeIds } = message; // Array of node IDs to subscribe to
    
    ws.clientType = 'dashboard';
    ws.subscribedNodes = new Set(nodeIds || []);
    this.dashboardClients.add(ws);

    logger.info(`Dashboard client subscribed to ${nodeIds?.length || 0} nodes`);

    ws.send(JSON.stringify({
      type: 'subscribed',
      nodeIds,
      timestamp: new Date().toISOString()
    }));
  }

  /**
   * Broadcast message to all dashboard clients
   */
  broadcastToDashboards(message) {
    const payload = JSON.stringify(message);
    
    this.dashboardClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        // If dashboard has subscribed to specific nodes, filter
        if (client.subscribedNodes && client.subscribedNodes.size > 0) {
          if (message.nodeId && client.subscribedNodes.has(message.nodeId)) {
            client.send(payload);
          }
        } else {
          // Send to all if no specific subscription
          client.send(payload);
        }
      }
    });
  }

  /**
   * Send command to specific node
   */
  sendCommandToNode(nodeId, command) {
    const ws = this.nodeConnections.get(nodeId);
    
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'command',
        commandId: command.commandId || 'update-config',
        data: command.data,
        timestamp: new Date().toISOString()
      }));
      
      logger.info(`Command sent to node ${nodeId}`);
      return true;
    }
    
    logger.warn(`Cannot send command: Node ${nodeId} not connected`);
    return false;
  }

  /**
   * Handle client disconnect
   */
  handleDisconnect(ws) {
    if (ws.clientType === 'node' && ws.nodeId) {
      logger.info(`Node ${ws.nodeId} disconnected`);
      this.nodeConnections.delete(ws.nodeId);
      
      // Notify dashboards
      this.broadcastToDashboards({
        type: 'node_disconnected',
        nodeId: ws.nodeId,
        timestamp: new Date().toISOString()
      });
    } else if (ws.clientType === 'dashboard') {
      logger.info('Dashboard client disconnected');
      this.dashboardClients.delete(ws);
    }
  }

  /**
   * Start connection health check interval
   */
  startHealthCheck() {
    const interval = setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (!ws.isAlive) {
          logger.warn('Terminating inactive WebSocket connection');
          return ws.terminate();
        }

        ws.isAlive = false;
        ws.ping();
      });
    }, 30000); // Check every 30 seconds

    this.wss.on('close', () => {
      clearInterval(interval);
    });

    logger.info('WebSocket health check started');
  }

  /**
   * Get active node connections
   */
  getActiveNodes() {
    return Array.from(this.nodeConnections.keys());
  }

  /**
   * Check if node is connected
   */
  isNodeConnected(nodeId) {
    const ws = this.nodeConnections.get(nodeId);
    return ws && ws.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
const wsManager = new WebSocketManager();

module.exports = wsManager;
