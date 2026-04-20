const { describe, it, expect, beforeEach } = require('@jest/globals');

// Mock Prisma
jest.mock('../utils/prisma', () => ({
  prisma: {
    incident: {
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    }
  }
}));

// Mock Logger
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }
}));

// Mock MobileAppNotificationService
jest.mock('../utils/mobileAppNotificationService', () => {
  return jest.fn().mockImplementation(() => ({
    sendNotification: jest.fn()
  }));
});

// Mock AI Service
jest.mock('../modules/ai/ai.service', () => ({
  analyzeAccident: jest.fn().mockResolvedValue({ severity: 'HIGH', details: 'Car crash' })
}));

// Mock Decision Service
jest.mock('../modules/decision/decision.service', () => ({
  applyLogic: jest.fn().mockReturnValue({ speedLimit: 30, display: 'ACCIDENT AHEAD' })
}));

const { prisma } = require('../utils/prisma');
const { IncidentQueueManager } = require('../modules/incidents/incidentQueueManager');
const { processAccidentDetection } = require('../modules/incidents/incident.service');

describe('IncidentQueueManager', () => {
  let ioMock;
  let manager;
  
  beforeEach(() => {
    ioMock = { emit: jest.fn() };
    manager = new IncidentQueueManager(ioMock);
    jest.clearAllMocks();
  });

  it('should queue and assign incident if idle client exists', async () => {
    const socketMock = { id: 'socket1', emit: jest.fn() };
    
    // Mock that we don't have pending incidents to assign on connection
    prisma.incident.findFirst.mockResolvedValueOnce(null);
    manager.handleNewConnection(socketMock, { id: 'user1' });
    
    expect(manager.clients.get('socket1').isBusy).toBe(false);

    // Now test queueAndAssignIncident
    const payload = { data: 'test-dashboard-payload' };
    await manager.queueAndAssignIncident(payload, 'incident-123');

    // It should have assigned to user1
    expect(prisma.incident.update).toHaveBeenCalledWith({
      where: { id: 'incident-123' },
      data: { status: 'assigned', assignedToUserId: 'user1' }
    });
    
    const assignedClient = manager.clients.get('socket1');
    expect(assignedClient.isBusy).toBe(true);
    expect(assignedClient.currentIncidentId).toBe('incident-123');
    expect(socketMock.emit).toHaveBeenCalledWith('incident-assigned', payload);
  });

  it('should leave it unassigned if no idle clients', async () => {
    const payload = { data: 'test-dashboard-payload' };
    await manager.queueAndAssignIncident(payload, 'incident-123');

    // We didn't connect any clients, so it should not assign
    expect(prisma.incident.update).not.toHaveBeenCalled();
  });
});

describe('Incident Service - Deduplication Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should deduplicate incident if a recent pending/assigned incident exists for the same node', async () => {
    const existingIncident = {
      id: 'db-id-123',
      incidentId: 'INCIDENT_NODE_123',
      mediaUrls: []
    };
    
    // Mock findFirst returning the existing incident
    prisma.incident.findFirst.mockResolvedValueOnce(existingIncident);
    prisma.incident.update.mockResolvedValueOnce({ 
      ...existingIncident, 
      mediaUrls: [{ url: '/uploads/incidents/test.mp4', type: 'video' }] 
    });

    const mockIo = { emit: jest.fn() };
    const incidentData = {
      lat: '12.34',
      long: '56.78',
      lanNumber: 1,
      nodeId: 'node-1',
      mediaPaths: ['test.mp4']
    };

    const result = await processAccidentDetection(incidentData, mockIo);

    // Ensure findFirst checked for the existing incident
    expect(prisma.incident.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          nodeId: 'node-1',
          status: { in: ['pending', 'assigned'] }
        })
      })
    );

    // Ensure it updated the media array instead of creating a new incident record
    expect(prisma.incident.update).toHaveBeenCalledWith({
      where: { id: 'db-id-123' },
      data: {
        mediaUrls: [{ url: '/uploads/incidents/test.mp4', type: 'video' }]
      }
    });

    expect(prisma.incident.create).not.toHaveBeenCalled();
    expect(result.deduplicated).toBe(true);
    expect(result.incidentId).toBe('INCIDENT_NODE_123');
  });
});
