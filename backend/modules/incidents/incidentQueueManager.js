const { prisma } = require('../../utils/prisma');

class IncidentQueueManager {
  constructor(io) {
    this.io = io;
    this.clients = new Map();
  }

  handleNewConnection(socket, user) {
    // user could be an object { id, role } from JWT
    this.clients.set(socket.id, {
      isBusy: false,
      userId: user.id || user,
      currentIncidentId: null,
      socket: socket
    });
    
    // As soon as they connect, see if there are any pending incidents
    this.assignNextIncidentToClient(socket.id);
  }

  handleDisconnect(socketId) {
    const client = this.clients.get(socketId);
    if (client && client.currentIncidentId) {
      // If disconnected while reviewing, release the incident back to queue
      prisma.incident.update({
        where: { id: client.currentIncidentId },
        data: { status: 'pending', assignedToUserId: null }
      }).catch(err => console.error("Error releasing incident:", err));
    }
    this.clients.delete(socketId);
  }

  markClientIdle(socketId) {
    const client = this.clients.get(socketId);
    if (client) {
      client.isBusy = false;
      client.currentIncidentId = null;
      this.assignNextIncidentToClient(socketId);
    }
  }

  async assignNextIncidentToClient(socketId) {
    const client = this.clients.get(socketId);
    if (!client || client.isBusy) return;

    try {
      // Find highest priority pending incident
      const pendingIncident = await prisma.incident.findFirst({
        where: { status: 'pending' },
        orderBy: [
          { severityLevel: 'desc' },
          { createdAt: 'asc' }
        ]
      });

      if (pendingIncident) {
        // Mark as assigned
        const updated = await prisma.incident.update({
          where: { id: pendingIncident.id },
          data: { status: 'assigned', assignedToUserId: client.userId },
          include: { node: true }
        });

        client.isBusy = true;
        client.currentIncidentId = updated.id;
        
        const laneCount = updated.node.defaultLaneCount || 4;
        const laneDefaults = updated.node.lanes || [];
        const roadRulesLanes = updated.node.roadRules?.lanes || [];
        const defaultsToUse = laneDefaults.length ? laneDefaults : roadRulesLanes;
        const defaultLaneConfiguration = defaultsToUse.length > 0
          ? defaultsToUse.map((lane, index) => ({
              lane: lane.id || index + 1,
              name: lane.name || `Lane ${index + 1}`,
              state: (lane.status || 'open').toLowerCase(),
              type: lane.type || 'Standard'
            }))
          : Array.from({ length: laneCount }, (_, index) => ({
              lane: index + 1,
              name: `Lane ${index + 1}`,
              state: 'open',
              type: 'Standard'
            }));

        const dashboardPayload = {
          incidentId: updated.incidentId,
          dbIncidentId: updated.id,
          nodeId: updated.nodeId,
          latitude: updated.latitude || 0,
          longitude: updated.longitude || 0,
          lanNumber: updated.lanNumber || 1,
          locationName: updated.node.streetName || `Node ${updated.nodeId}`,
          mediaList: updated.mediaUrls || [],
          timestamp: updated.createdAt,
          accidentPolygon: updated.accidentPolygon || null,
          nodePolygons: updated.node.lanePolygons || [],
          node: {
            name: updated.node.name || `Node ${updated.nodeId}`,
            defaultSpeedLimit: updated.originalSpeedLimit || updated.node.speedLimit || 80,
            defaultLaneCount: laneCount,
            defaultLaneConfiguration,
          },
          ai: {
            severity: updated.severityLevel,
            confidence: 0.95,
            accidentType: 'Unknown',
            vehicleCount: 1,
            injuryRisk: 'Medium',
            recommendations: [],
            mode: 'QUEUE_RECOVERY'
          },
          decision: {
            blockedLanes: updated.blockedLanes || [],
            laneConfiguration: updated.laneConfiguration || '',
            speedLimit: updated.adjustedSpeedLimit || updated.originalSpeedLimit || 40,
            originalSpeedLimit: updated.originalSpeedLimit || 80,
            speedReduction: (updated.originalSpeedLimit || 80) - (updated.adjustedSpeedLimit || updated.originalSpeedLimit || 80),
            actions: ['MONITOR_SITUATION'],
            influencedByAI: true
          },
          severity: updated.severityLevel >= 4 ? 'CRITICAL' : updated.severityLevel >= 3 ? 'HIGH' : 'MODERATE'
        };

        client.socket.emit('incident-assigned', dashboardPayload);
      }
    } catch (err) {
      console.error("[QueueManager] Error assigning incident:", err);
    }
  }

  async queueAndAssignIncident(dashboardPayload, dbIncidentId) {
    // Find the first idle client
    let idleClient = null;
    for (const [socketId, client] of this.clients.entries()) {
      if (!client.isBusy) {
        idleClient = client;
        break;
      }
    }

    if (idleClient) {
      try {
        await prisma.incident.update({
          where: { id: dbIncidentId },
          data: { status: 'assigned', assignedToUserId: idleClient.userId }
        });
        idleClient.isBusy = true;
        idleClient.currentIncidentId = dbIncidentId;
        idleClient.socket.emit('incident-assigned', dashboardPayload);
      } catch (err) {
         console.error("[QueueManager] Error assigning specific incident:", err);
      }
    } else {
      console.log(`[IncidentQueueManager] No idle clients to assign incident ${dbIncidentId}`);
    }
  }
}

let instance = null;

module.exports = {
  IncidentQueueManager,
  initialize: (io) => {
    if (!instance) instance = new IncidentQueueManager(io);
    return instance;
  },
  getInstance: () => {
    if (!instance) throw new Error("IncidentQueueManager not initialized");
    return instance;
  }
};
