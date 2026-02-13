import Sidebar from '../components/Sidebar.jsx';
import MapHeader from '../components/MapHeader.jsx';
import FilterTabs from '../components/FilterTabs.jsx';
import MapView from '../components/MapView.jsx';
import { useState, useEffect } from 'react';
import AccidentDialog from '../features/incidents/components/AccidentDialog.jsx';
import NodesList from '../components/NodesList.jsx';
import KPICards from '../components/KPICards.jsx';
import { initSocket, onAccidentDetected, offAccidentDetected, getSocket } from '../services/socketService.js';

function MapOverview() {
  const [showAccident, setShowAccident] = useState(false);
  const [currentIncident, setCurrentIncident] = useState(null);
  const [decisionNotification, setDecisionNotification] = useState(null);

  useEffect(() => {
    // Initialize socket connection
    initSocket();

    // Listen for real-time accident events
    const handleAccident = (incidentData) => {
      console.log('🚨 New accident detected:', incidentData);
      // Only show dialog if this is a new incident
      if (!currentIncident || incidentData.incidentId !== currentIncident.incidentId) {
        setCurrentIncident(incidentData);
        setShowAccident(true);
      }
    };

    // Listen for decision confirmation from admin
    const handleDecisionConfirmed = (decisionData) => {
      console.log('✅ Decision confirmed:', decisionData);
      setDecisionNotification(decisionData);
      
      // Auto-hide notification after 5 seconds
      const timer = setTimeout(() => {
        setDecisionNotification(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    };

    onAccidentDetected(handleAccident);
    const socket = getSocket();
    socket.on('decision-confirmed', handleDecisionConfirmed);

    // Cleanup
    return () => {
      offAccidentDetected(handleAccident);
      socket.off('decision-confirmed', handleDecisionConfirmed);
    };
    // Add currentIncident to dependencies to always check for duplicates
  }, [currentIncident]);

  return (
    <div className="flex h-screen bg-safe-bg overflow-hidden">
      {/* Sidebar on the left */}
      <Sidebar activeIcon="chart-line" />
      
      {/* Main content area on the right */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header at the top */}
        <MapHeader />
        
        {/* Decision Notification Toast */}
        {decisionNotification && (
          <div className="fixed top-4 right-4 z-40 animate-fadeIn">
            <div className={`px-6 py-4 rounded-lg shadow-lg border-l-4 text-white ${
              decisionNotification.status === 'CONFIRMED' 
                ? 'bg-green-600 border-green-400' 
                : decisionNotification.status === 'MODIFIED'
                ? 'bg-blue-600 border-blue-400'
                : 'bg-red-600 border-red-400'
            }`}>
              <div className="flex items-center gap-3">
                <div className="text-2xl">
                  {decisionNotification.status === 'CONFIRMED' ? '✅' : 
                   decisionNotification.status === 'MODIFIED' ? '✏️' : '❌'}
                </div>
                <div>
                  <p className="font-bold text-sm">Decision {decisionNotification.status}</p>
                  <p className="text-xs opacity-90">{decisionNotification.message}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Content area below header */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left section: Buttons, Map, State blocks */}
          <div className="flex-1 flex flex-col h-full">
            <div className="flex-shrink-0">
              <FilterTabs activeTab="call-emergency" />
            </div>

            <div className="flex-1 flex flex-col relative min-h-0 p-4 gap-4">
              <div className="flex-1 ">
                <MapView />
                <AccidentDialog
                  open={showAccident}
                  onClose={() => setShowAccident(false)}
                  onDecision={(decision) => {
                    console.log('✅ Decision response:', decision);
                    setShowAccident(false);
                    setCurrentIncident(null);
                  }}
                  incident={currentIncident}
                />
              </div>

              <div className="flex-shrink-0">
                <KPICards />
              </div>
            </div>
          </div>
          
          {/* Right section: Connected and Disconnected nodes */}
          <NodesList />
        </div>
      </div>
    </div>
  );
}

export default MapOverview;
