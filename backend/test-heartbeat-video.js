#!/usr/bin/env node

/**
 * Test Script: Node Heartbeat & Live Camera Feed
 * 
 * This script simulates a detection node sending:
 * - Registration message
 * - Periodic heartbeat messages (every 5 seconds)
 * - Periodic video frames (every 1 second)
 * 
 * Usage: node test-heartbeat-video.js
 * Press Ctrl+C to stop
 */

const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================
const WS_URL = 'ws://localhost:5000/ws/nodes';
const NODE_ID = 'safe-space-node-001';
const TOKEN = 'dev-safe-space-token-001';

// Timing configuration (in milliseconds)
const HEARTBEAT_INTERVAL = 5000;  // Send heartbeat every 5 seconds
const VIDEO_FRAME_INTERVAL = 1000; // Send video frame every 1 second

// Test image path (optional - will generate sample frame if not found)
const TEST_IMAGE_PATH = '/home/nasser/Downloads/test-image.jpg';

// ============================================================================
// GLOBAL STATE
// ============================================================================
let wsConnection = null;
let heartbeatTimer = null;
let videoFrameTimer = null;
let frameCounter = 0;
let uptimeStartTime = Date.now();
let testFrameBase64 = null;

// Simulated health metrics
let healthMetrics = {
  cpu: 15,
  temperature: 45,
  memory: 30,
  network: 85,
  storage: 60,
  currentFps: 25,
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Load test image and convert to base64
 */
function loadTestImage() {
  try {
    if (fs.existsSync(TEST_IMAGE_PATH)) {
      const imageBuffer = fs.readFileSync(TEST_IMAGE_PATH);
      const base64Image = imageBuffer.toString('base64');
      console.log(`📸 Loaded test image: ${(imageBuffer.length / 1024).toFixed(2)} KB`);
      return base64Image;
    } else {
      console.log('⚠️  Test image not found, will generate sample frames');
      return null;
    }
  } catch (error) {
    console.error('❌ Error loading test image:', error.message);
    return null;
  }
}

/**
 * Generate a sample video frame (very small base64 string for testing)
 * In real scenario, this would be a JPEG frame from the camera
 */
function generateSampleFrame() {
  if (testFrameBase64) {
    return testFrameBase64;
  }
  
  // Create a minimal base64 string to simulate frame data
  // In production, this would be actual camera frame data
  const sampleData = `frame-${frameCounter}-timestamp-${Date.now()}`;
  return Buffer.from(sampleData).toString('base64');
}

/**
 * Simulate health metrics variation
 */
function updateHealthMetrics() {
  healthMetrics.cpu = Math.max(10, Math.min(95, healthMetrics.cpu + (Math.random() - 0.5) * 5));
  healthMetrics.temperature = Math.max(35, Math.min(85, healthMetrics.temperature + (Math.random() - 0.5) * 2));
  healthMetrics.memory = Math.max(20, Math.min(80, healthMetrics.memory + (Math.random() - 0.5) * 3));
  healthMetrics.network = Math.max(50, Math.min(100, healthMetrics.network + (Math.random() - 0.5) * 10));
  healthMetrics.storage = Math.max(40, Math.min(90, healthMetrics.storage + (Math.random() - 0.5) * 1));
}

/**
 * Get current uptime in seconds
 */
function getUptimeSeconds() {
  return Math.floor((Date.now() - uptimeStartTime) / 1000);
}

/**
 * Format timestamp for display
 */
function formatTime(isoString) {
  return new Date(isoString).toLocaleTimeString();
}

// ============================================================================
// WEBSOCKET MESSAGE HANDLERS
// ============================================================================

/**
 * Send node registration message
 */
function sendRegistration() {
  const message = {
    type: 'register',
    nodeId: NODE_ID,
    token: TOKEN,
    timestamp: new Date().toISOString(),
  };
  
  console.log('\n📝 Registering node...');
  wsConnection.send(JSON.stringify(message));
}

/**
 * Send heartbeat message
 */
function sendHeartbeat() {
  updateHealthMetrics();
  
  const message = {
    type: 'heartbeat',
    nodeId: NODE_ID,
    timestamp: new Date().toISOString(),
    status: 'online',
    uptimeSec: getUptimeSeconds(),
    health: {
      cpu: Math.round(healthMetrics.cpu * 10) / 10,
      temperature: Math.round(healthMetrics.temperature * 10) / 10,
      memory: Math.round(healthMetrics.memory * 10) / 10,
      network: Math.round(healthMetrics.network * 10) / 10,
      storage: Math.round(healthMetrics.storage * 10) / 10,
      currentFps: healthMetrics.currentFps,
    },
    firmwareVersion: '2.1.0',
    modelVersion: '1.5.3',
  };
  
  console.log(`\n💓 Sending heartbeat #${Math.floor(getUptimeSeconds() / 5)}`);
  console.log(`   Status: ${message.status} | Uptime: ${message.uptimeSec}s`);
  console.log(`   CPU: ${message.health.cpu}% | Temp: ${message.health.temperature}°C | Mem: ${message.health.memory}%`);
  
  wsConnection.send(JSON.stringify(message));
}

/**
 * Send video frame
 */
function sendVideoFrame() {
  frameCounter++;
  
  const frameData = generateSampleFrame();
  
  const message = {
    type: 'video_frame',
    nodeId: NODE_ID,
    frameData: frameData, // Base64 encoded frame
    timestamp: new Date().toISOString(),
    frameId: `frame-${frameCounter}`,
  };
  
  const dataSize = testFrameBase64 
    ? (testFrameBase64.length / 1024).toFixed(2) 
    : (frameData.length / 1024).toFixed(2);
  
  console.log(`📹 Sending frame #${frameCounter} (${dataSize} KB)`);
  
  wsConnection.send(JSON.stringify(message));
}

/**
 * Handle incoming WebSocket messages
 */
function handleMessage(data) {
  try {
    const message = JSON.parse(data.toString());
    
    switch (message.type) {
      case 'registered':
        console.log('✅ Node registered successfully');
        console.log(`   Node ID: ${message.nodeId}`);
        console.log(`   Time: ${formatTime(message.timestamp)}`);
        console.log(`   Message: ${message.message}`);
        
        // Start sending heartbeats and video frames
        startPeriodicMessages();
        break;
      
      case 'heartbeat_ack':
        console.log(`✅ Heartbeat acknowledged`);
        console.log(`   Next heartbeat in ${message.nextHeartbeatSec}s`);
        break;
      
      case 'command':
        console.log('\n🎯 COMMAND RECEIVED FROM SERVER:');
        console.log(JSON.stringify(message, null, 2));
        break;
      
      case 'error':
        console.error(`\n❌ Error from server: ${message.message}`);
        break;
      
      default:
        console.log(`\n📨 Message received (${message.type}):`);
        console.log(JSON.stringify(message, null, 2));
    }
  } catch (error) {
    console.error('❌ Error parsing message:', error.message);
  }
}

// ============================================================================
// PERIODIC MESSAGE SENDERS
// ============================================================================

/**
 * Start sending periodic heartbeats and video frames
 */
function startPeriodicMessages() {
  console.log('\n🚀 Starting periodic messages...');
  console.log(`   Heartbeat interval: ${HEARTBEAT_INTERVAL / 1000}s`);
  console.log(`   Video frame interval: ${VIDEO_FRAME_INTERVAL / 1000}s`);
  
  // Send first heartbeat immediately
  sendHeartbeat();
  
  // Send first video frame immediately
  sendVideoFrame();
  
  // Schedule periodic heartbeats
  heartbeatTimer = setInterval(() => {
    if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
      sendHeartbeat();
    }
  }, HEARTBEAT_INTERVAL);
  
  // Schedule periodic video frames
  videoFrameTimer = setInterval(() => {
    if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
      sendVideoFrame();
    }
  }, VIDEO_FRAME_INTERVAL);
}

/**
 * Stop all periodic messages
 */
function stopPeriodicMessages() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
  
  if (videoFrameTimer) {
    clearInterval(videoFrameTimer);
    videoFrameTimer = null;
  }
  
  console.log('\n⏹️  Stopped periodic messages');
}

// ============================================================================
// WEBSOCKET CONNECTION MANAGEMENT
// ============================================================================

/**
 * Connect to WebSocket server
 */
function connect() {
  const url = `${WS_URL}?client=node&token=${TOKEN}`;
  
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  NODE HEARTBEAT & VIDEO FEED TEST                         ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\n🔌 Connecting to WebSocket at ${url}...`);
  
  wsConnection = new WebSocket(url);
  
  wsConnection.on('open', () => {
    console.log('✅ WebSocket connected');
    sendRegistration();
  });
  
  wsConnection.on('message', handleMessage);
  
  wsConnection.on('close', () => {
    console.log('\n🔌 WebSocket disconnected');
    stopPeriodicMessages();
  });
  
  wsConnection.on('error', (error) => {
    console.error('\n❌ WebSocket error:', error.message);
  });
}

/**
 * Graceful shutdown
 */
function cleanup() {
  console.log('\n\n🛑 Shutting down...');
  
  stopPeriodicMessages();
  
  if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
    wsConnection.close();
  }
  
  console.log('✅ Cleanup complete');
  process.exit(0);
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

// Handle Ctrl+C
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Load test image
testFrameBase64 = loadTestImage();

// Start test
connect();
