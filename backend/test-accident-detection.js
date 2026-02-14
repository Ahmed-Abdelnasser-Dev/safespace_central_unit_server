#!/usr/bin/env node

/**
 * Test Script: Accident Detection Socket.IO Event
 * 
 * Tests the node_accident_detected Socket.IO event that nodes emit
 * when they detect an accident.
 * 
 * Usage: node test-accident-detection.js
 */

const io = require('socket.io-client');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

// Configuration
const SERVER_URL = 'http://localhost:5000';
const WS_URL = 'ws://localhost:5000/ws/nodes';
const NODE_ID = 'safe-space-node-001';
const TOKEN = 'dev-safe-space-token-001';

// Test data: Accident polygon covering lanes 2 and 3 (from left)
const testPayload = {
  lat: 25.1234,
  long: 55.5678,
  lanNumber: 2,
  nodeId: NODE_ID,
  accidentPolygon: {
    points: [
      { x: 50, y: 50 },
      { x: 50, y: 100 },
      { x: 100, y: 100 },
      { x: 100, y: 50 },
    ],
    baseWidth: 640,
    baseHeight: 640
  },
  media: []
};

// Helper: Convert image to base64
function loadMediaAsBase64(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  Test image not found at ${filePath}`);
      console.warn('   Proceeding with empty media array');
      return null;
    }
    const data = fs.readFileSync(filePath);
    return `data:image/jpeg;base64,${data.toString('base64')}`;
  } catch (error) {
    console.warn(`⚠️  Failed to load image: ${error.message}`);
    return null;
  }
}

// Helper: Format timestamp
function getTimestamp() {
  return new Date().toISOString();
}

// Main test
async function runTest() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  ACCIDENT DETECTION TEST (Socket.IO + WebSocket)          ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log(`🔌 Connecting to Socket.IO at ${SERVER_URL}...`);

  const socketIO = io(SERVER_URL, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5
  });

  return new Promise((resolve) => {
    let wsConnected = false;
    let wsConnection = null;
    let incidentId = null;

    // Setup WebSocket listener
    function setupWebSocket() {
      console.log(`\n🔌 Connecting to WebSocket at ${WS_URL}?client=node&token=${TOKEN}...`);
      
      wsConnection = new WebSocket(`${WS_URL}?client=node&token=${TOKEN}`);

      wsConnection.on('open', () => {
        console.log('✅ WebSocket connected\n');
        wsConnected = true;
        // Registration logic removed as requested
      });

      wsConnection.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          console.log('\n📨 WebSocket message received:', message.type);

          if (message.type === 'command') {
            console.log('   Command ID:', message.commandId);
          }

          if (message.type === 'command' && message.commandId === 'accident-decision') {
            console.log('\n🎯 ADMIN DECISION RECEIVED!\n');
            const decision = message.data;
            console.log(JSON.stringify(decision, null, 2));

            if (decision.status === 'CONFIRMED') {
              console.log('\n✅ ACCIDENT CONFIRMED');
              console.log(`   Speed Limit: ${decision.speedLimit} km/h`);
              console.log(`   Lane States: ${decision.laneStates.join(', ')}`);
              if (decision.lanes && decision.lanes.length > 0) {
                console.log(`   Lanes to Update: ${decision.lanes.map(l => `Lane ${l.lane}=${l.status}`).join(', ')}`);
              } else {
                console.log(`   ⚠️  No lanes array in decision!`);
              }
            } else {
              console.log('\n❌ ACCIDENT REJECTED');
              console.log('   Road configuration returns to normal');
            }

            setTimeout(() => {
              wsConnection.close();
              socketIO.disconnect();
              resolve();
            }, 1000);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });

      wsConnection.on('error', (error) => {
        console.error('\n❌ WebSocket error:', error.message);
      });

      wsConnection.on('close', () => {
        console.log('\n👋 WebSocket disconnected\n');
      });
    }

    // Socket.IO connection
    socketIO.on('connect', () => {
      console.log('✅ Socket.IO connected\n');

      // Setup WebSocket in parallel
      setupWebSocket();

      // Try to load test image
      const imagePath = '/home/nasser/Downloads/test-image.jpg';
      const mediaItem = loadMediaAsBase64(imagePath);

      if (mediaItem) {
        testPayload.media = [mediaItem];
        console.log(`📸 Loaded media: 1 image (${(mediaItem.length / 1024).toFixed(2)} KB)\n`);
      }

      // Prepare payload
      console.log('📤 Sending accident detection event via Socket.IO...');
      console.log(`   Event: node_accident_detected`);
      console.log(`   NodeID: ${testPayload.nodeId}`);
      console.log(`   Location: (${testPayload.lat}, ${testPayload.long})`);
      console.log(`   Lane: ${testPayload.lanNumber}`);
      console.log(`   Polygon: 4-point rectangle (${testPayload.accidentPolygon.baseWidth}x${testPayload.accidentPolygon.baseHeight})`);
      console.log(`   Media items: ${testPayload.media.length}\n`);

      // Send event and wait for ACK
      socketIO.emit('node_accident_detected', testPayload, (response) => {
        console.log('📥 Received ACK response:\n');
        console.log(JSON.stringify(response, null, 2));

        if (response.success) {
          incidentId = response.incidentId;
          console.log(`\n✅ SUCCESS!`);
          console.log(`   Incident ID: ${response.incidentId}`);
          console.log(`   Status: ${response.status}`);
          console.log(`\n⏳ Waiting for admin response... (60 seconds timeout)`);
          console.log('   Go to the Dashboard and Confirm/Reject this incident to see the decision here!\n');
        } else {
          console.log(`\n❌ ERROR: ${response.message || 'Unknown error'}`);
          socketIO.disconnect();
          if (wsConnection) wsConnection.close();
          resolve();
        }
      });

      // Timeout after 60 seconds
      setTimeout(() => {
        if (socketIO.connected || wsConnected) {
          console.log('\n⏱️  Admin response timeout (60s). Disconnecting...');
          socketIO.disconnect();
          if (wsConnection) wsConnection.close();
          resolve();
        }
      }, 6000);
    });

    // Connection errors
    socketIO.on('connect_error', (error) => {
      console.error('\n❌ Socket.IO connection error:', error.message);
      console.error('   Make sure the backend server is running on port 5000');
      if (wsConnection) wsConnection.close();
      resolve();
    });

    socketIO.on('disconnect', () => {
      console.log('\n👋 Socket.IO disconnected\n');
    });
  });
}

// Run test
(async () => {
  try {
    await runTest();
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
})();
