/**
 * Emit admin accident response to backend (to node)
 * @param {object} response - The response object to send
 */
export function emitAdminAccidentResponse(response) {
  const s = getSocket();
  s.emit('admin_accident_response', response);
}

/**
 * Listen for node heartbeat events
 * @param {Function} callback - handler for heartbeat data
 */
export function onNodeHeartbeat(callback) {
  const s = getSocket();
  s.on('node_heartbeat', callback);
}

/**
 * Remove node heartbeat listener
 * @param {Function} callback
 */
export function offNodeHeartbeat(callback) {
  const s = getSocket();
  s.off('node_heartbeat', callback);
}

/**
 * Listen for node config update events
 * @param {Function} callback - handler for config update data
 */
export function onNodeConfigUpdate(callback) {
  const s = getSocket();
  s.on('node_config_update', callback);
}

/**
 * Remove node config update listener
 * @param {Function} callback
 */
export function offNodeConfigUpdate(callback) {
  const s = getSocket();
  s.off('node_config_update', callback);
}
/**
 * Socket.IO Client Service
 * Manages real-time connection to backend for accident notifications
 */
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

let socket = null;

/**
 * Initialize Socket.IO connection
 */
export function initSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('✅ Connected to Safe Space Central Unit');
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from Central Unit');
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
    });
  }
  return socket;
}

/**
 * Get current socket instance
 */
export function getSocket() {
  if (!socket) {
    return initSocket();
  }
  return socket;
}

/**
 * Listen for accident detection events
 * @param {Function} callback - handler for accident data
 */
export function onAccidentDetected(callback) {
  const s = getSocket();
  s.on('accident-detected', callback);
}

/**
 * Remove accident detection listener
 * @param {Function} callback
 */
export function offAccidentDetected(callback) {
  const s = getSocket();
  s.off('accident-detected', callback);
}

/**
 * Disconnect socket
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
