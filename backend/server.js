/**
 * Safe Space Central Unit - Server Entry Point
 * Restored file: handles port availability and graceful shutdown.
 */

require('dotenv').config();
const net = require('net');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { Server } = require('socket.io');
const app = require('./app');
const { logger } = require('./utils/logger');
const wsManager = require('./utils/websocketManager');
const { startHeartbeatMonitor } = require('./modules/nodes/node.service');

const PORT = parseInt(process.env.PORT, 10) || 5000;
const HOST = process.env.HOST || '0.0.0.0';
const NODE_ENV = process.env.NODE_ENV || 'development';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4000';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : [FRONTEND_URL, 'http://192.168.10.0/24']; 

// Create HTTP server and Socket.IO instance
const server = http.createServer(app);
const io = new Server(server, {
  transports: ['polling', 'websocket'],
  allowEIO3: true,
  serveClient: false,
  polling: {
    maxHttpBufferSize: 1e6,
  },
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) {
        logger.info('🔌 Socket.IO: Allowing connection with no origin');
        return callback(null, true);
      }
      
      // Check if origin is allowed
      const isAllowed = ALLOWED_ORIGINS.some(allowed => {
        if (allowed.includes('/')) {
          // Subnet notation - allow any IP in range
          return origin.includes('192.168.10.') || origin.includes('192.168.1.') || origin === FRONTEND_URL;
        }
        return origin === allowed;
      });
      
      if (isAllowed) {
        logger.info(`🔌 Socket.IO: Allowing origin ${origin}`);
        callback(null, true);
      } else {
        logger.warn(`🔌 Socket.IO: Blocked origin ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  },
});

// Make io accessible to app
app.set('io', io);

// Initialize WebSocket manager for node connections
wsManager.initialize(server);
wsManager.startHealthCheck();

// Start background heartbeat monitor for HTTP heartbeat endpoints
startHeartbeatMonitor();

// Socket.IO connection handler (for dashboard clients)
io.on('connection', (socket) => {
  logger.info(`✅ Dashboard client connected: ${socket.id}`);

  /**
   * Validate and parse base64 media payload.
   * @param {string|object} item
   * @returns {{ buffer: Buffer, mime: string, ext: string }}
   */
  const parseBase64MediaItem = (item) => {
    if (typeof item === 'string') {
      const match = item.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) {
        throw new Error('Invalid media string: expected data URL');
      }
      const mime = match[1];
      const base64Data = match[2];
      const buffer = Buffer.from(base64Data, 'base64');
      const ext = mimeToExt(mime);
      return { buffer, mime, ext };
    }

    if (!item || typeof item !== 'object') {
      throw new Error('Invalid media item: expected object');
    }

    const mime = item.mime || item.type;
    const base64Data = item.data;
    if (!mime || !base64Data) {
      throw new Error('Invalid media item: missing mime or data');
    }
    const buffer = Buffer.from(base64Data, 'base64');
    const ext = mimeToExt(mime);
    return { buffer, mime, ext };
  };

  /**
   * Map MIME to file extension.
   * @param {string} mime
   * @returns {string}
   */
  const mimeToExt = (mime) => {
    switch (mime) {
      case 'image/jpeg':
        return 'jpg';
      case 'image/png':
        return 'png';
      case 'image/gif':
        return 'gif';
      case 'video/mp4':
        return 'mp4';
      case 'video/webm':
        return 'webm';
      case 'video/quicktime':
        return 'mov';
      default:
        throw new Error(`Unsupported media type: ${mime}`);
    }
  };

  /**
   * Validate file signature to prevent spoofed uploads.
   * @param {Buffer} buffer
   * @param {string} mime
   * @returns {boolean}
   */
  const isValidMagicNumber = (buffer, mime) => {
    if (!buffer || buffer.length < 12) return false;
    if (mime === 'image/jpeg') {
      return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    }
    if (mime === 'image/png') {
      return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
    }
    if (mime === 'image/gif') {
      return buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38;
    }
    if (mime === 'video/mp4' || mime === 'video/quicktime') {
      return buffer.slice(4, 8).toString('ascii') === 'ftyp';
    }
    if (mime === 'video/webm') {
      return buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3;
    }
    return false;
  };

  /**
   * Persist socket media to disk and return file paths.
   * @param {Array} media
   * @param {string|number} nodeId
   * @returns {Promise<string[]>}
   */
  const persistSocketMedia = async (media, nodeId) => {
    const uploadsDir = path.join(__dirname, 'uploads', 'incidents');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const MAX_SIZE_BYTES = 10 * 1024 * 1024;
    const savedPaths = [];

    for (let i = 0; i < media.length; i += 1) {
      const { buffer, mime, ext } = parseBase64MediaItem(media[i]);
      if (buffer.length > MAX_SIZE_BYTES) {
        throw new Error('Media file exceeds 10MB limit');
      }
      if (!isValidMagicNumber(buffer, mime)) {
        throw new Error('Invalid media signature');
      }

      const filename = `node${nodeId}_${Date.now()}_${i}.${ext}`;
      const filePath = path.join(uploadsDir, filename);
      await fs.promises.writeFile(filePath, buffer);
      savedPaths.push(filePath);
    }

    return savedPaths;
  };

  // Listen for accident detection from nodes (Socket.IO)
  socket.on('node_accident_detected', async (payload, ack) => {
    try {
      if (!payload || typeof payload !== 'object') {
        throw new Error('Invalid payload');
      }

      const { lat, long, lanNumber, nodeId, accidentPolygon, media } = payload;
      if (!lat || !long || !lanNumber || !nodeId || !accidentPolygon) {
        throw new Error('Missing required fields: lat, long, lanNumber, nodeId, accidentPolygon');
      }

      const parsedLanNumber = parseInt(lanNumber, 10);
      if (Number.isNaN(parsedLanNumber)) {
        throw new Error('lanNumber must be a valid integer');
      }

      let parsedAccidentPolygon;
      try {
        parsedAccidentPolygon = typeof accidentPolygon === 'string'
          ? JSON.parse(accidentPolygon)
          : accidentPolygon;
      } catch (error) {
        throw new Error('accidentPolygon must be valid JSON');
      }

      if (!Array.isArray(media) || media.length === 0) {
        throw new Error('At least one media item is required');
      }

      const mediaPaths = await persistSocketMedia(media, nodeId);
      const incidentService = require('./modules/incidents/incident.service');
      const result = await incidentService.processAccidentDetection({
        lat,
        long,
        lanNumber: parsedLanNumber,
        nodeId,
        mediaPaths,
        accidentPolygon: parsedAccidentPolygon,
      }, io);

      if (typeof ack === 'function') {
        ack({
          success: true,
          incidentId: result.incidentId,
          status: 'PENDING_ADMIN_CONFIRMATION',
        });
      }
    } catch (err) {
      logger.error('Error handling node_accident_detected:', err.message || err);
      if (typeof ack === 'function') {
        ack({ success: false, error: err.message || 'Unknown error' });
      }
    }
  });

  // Listen for admin accident response from dashboard
  socket.on('admin_accident_response', async (data) => {
    try {
      // Validate required fields
      if (!data || typeof data !== 'object' || !data.incidentId) {
        logger.warn('Invalid admin_accident_response payload received');
        return;
      }
      // Always add timestamp if not present
      if (!data.timestamp) {
        data.timestamp = new Date().toISOString();
      }
      // Log and relay to node (broadcast or emit to specific node if needed)
      logger.info(`Relaying admin_accident_response for incident ${data.incidentId}: ${JSON.stringify(data)}`);
      // For now, broadcast to all connected nodes (customize as needed)
      io.emit('admin_accident_response', data);

      // After relaying, process the admin decision (triggers Mobile App Server notification)
      const { incidentId, nodeId, isAccident, speedLimit, laneStates, blockedLanes, timestamp } = data;
      
      logger.info(`📋 Admin Response Data Extracted:`, {
        incidentId,
        nodeId,
        isAccident,
        speedLimit,
        laneStatesCount: Array.isArray(laneStates) ? laneStates.length : 'NOT_ARRAY',
        laneStates,
        blockedLanes,
        timestamp
      });
      if (isAccident) {
        // Use the same logic as the REST endpoint for confirmed accidents
        const incidentService = require('./modules/incidents/incident.service');
        await incidentService.processAccidentDecision({
          incidentId,
          nodeId,
          status: 'CONFIRMED',
          actions: [], // You can map laneStates/speedLimit to actions if needed
          message: 'Confirmed via dashboard',
        });
      } else {
        // Optionally handle rejection
        const incidentService = require('./modules/incidents/incident.service');
        await incidentService.processAccidentDecision({
          incidentId,
          nodeId,
          status: 'REJECTED',
          actions: [],
          message: 'Rejected via dashboard',
        });
      }

      // Send final decision back to the node via WebSocket manager
      const normalizedLaneStates = Array.isArray(laneStates) ? laneStates : [];
      const laneStatusList = normalizedLaneStates.map((state, index) => ({
        lane: index + 1,
        status: state,
      }));

      logger.info(`🚀 Building decision payload for incident ${incidentId}: ${JSON.stringify({
        isAccident,
        speedLimit,
        laneStates: normalizedLaneStates,
        lanes: laneStatusList
      })}`);

      const decisionPayload = isAccident
        ? {
            incidentId,
            status: 'CONFIRMED',
            message: 'Apply updated road configuration',
            speedLimit: Number(speedLimit),
            laneStates: normalizedLaneStates,
            lanes: laneStatusList,
            timestamp: timestamp || new Date().toISOString(),
          }
        : {
            incidentId,
            status: 'REJECTED',
            message: 'No accident',
            speedLimit: Number(speedLimit),
            laneStates: normalizedLaneStates,
            lanes: laneStatusList,
            timestamp: timestamp || new Date().toISOString(),
          };

      logger.info(`📤 Sending decision to node ${nodeId}`);
      wsManager.sendCommandToNode(nodeId, {
        commandId: 'accident-decision',
        data: decisionPayload,
      });
    } catch (err) {
      logger.error('Error handling admin_accident_response:', err);
    }
  });

  socket.on('disconnect', () => {
    logger.info(`Dashboard client disconnected: ${socket.id}`);
  });
});

function ensurePortAvailable(port) {
  return new Promise((resolve, reject) => {
    const tester = net
      .createServer()
      .once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          reject(new Error(`Port ${port} is already in use.`));
        } else {
          reject(err);
        }
      })
      .once('listening', () => {
        tester.close(() => resolve());
      })
      .listen(port);
  });
}

ensurePortAvailable(PORT)
  .then(() => {
    server
      .listen(PORT, HOST, () => {
        logger.info('Safe Space Central Unit is running');
        logger.info(`Environment: ${NODE_ENV}`);
        logger.info(`Server listening on ${HOST}:${PORT}`);
        logger.info(`Frontend URL configured: ${FRONTEND_URL}`);
        logger.info(`API endpoint: http://localhost:5000/api`);
        logger.info(`Accepting connections from LAN subnet`);
      })
      .on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          logger.error(`Failed to bind port ${PORT}. It is in use.`);
          logger.error('Resolve by freeing the port or setting PORT in .env to a free port.');
        } else {
          logger.error(`Server error: ${err.message}`);
        }
        process.exit(1);
      });

    process.on('unhandledRejection', (err) => {
      logger.error('UNHANDLED REJECTION! Shutting down...');
      logger.error(err.name, err.message);
      server.close(() => {
        process.exit(1);
      });
    });

    process.on('SIGTERM', () => {
      logger.info('SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        logger.info('Process terminated.');
      });
    });
  })
  .catch((err) => {
    logger.error(err.message);
    logger.error('Tip: Run `lsof -i :5000` to find the process and kill it, or change PORT in .env');
    process.exit(1);
  });
