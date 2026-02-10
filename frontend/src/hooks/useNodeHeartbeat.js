/**
 * Node Heartbeat Listener Hook
 * 
 * Connects Socket.IO heartbeat events to Redux state.
 * Automatically updates node health and status in real-time.
 * 
 * NOTE: This hook should be called at the root App level to persist across navigation.
 * 
 * @module hooks/useNodeHeartbeat
 */

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { onNodeHeartbeat, offNodeHeartbeat } from '../services/socketService';
import { updateNodeFromHeartbeat } from '../features/nodeMaintainer/nodesSlice';

/**
 * Hook to listen for node heartbeats and update Redux state
 * 
 * This hook sets up a permanent Socket.IO listener that persists across navigation.
 * Each heartbeat received updates the node's last seen time and health metrics.
 */
export function useNodeHeartbeat() {
  const dispatch = useDispatch();

  useEffect(() => {
    const handleHeartbeat = (data) => {
      const { nodeId, status, health, timestamp } = data;
      console.log(
        `📡 Heartbeat from ${nodeId}: status=${status}, lastBeat=${new Date(timestamp).toLocaleTimeString()}`
      );

      // Dispatch action to update node state with heartbeat data
      dispatch(updateNodeFromHeartbeat(data));
    };

    // Subscribe to heartbeat events from Socket.IO
    onNodeHeartbeat(handleHeartbeat);

    // Log connection status
    console.log('✅ Node heartbeat listener activated');

    // Cleanup: Remove listener on unmount
    return () => {
      offNodeHeartbeat(handleHeartbeat);
      console.log('❌ Node heartbeat listener deactivated');
    };
  }, [dispatch]);
}

