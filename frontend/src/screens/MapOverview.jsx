import Sidebar from '../components/Sidebar.jsx';
import MapHeader from '../components/MapHeader.jsx';
import FilterTabs from '../components/FilterTabs.jsx';
import MapView from '../components/MapView.jsx';
import { useState, useEffect } from 'react';
import AccidentDialog from '../features/incidents/components/AccidentDialog.jsx';
import NodesList from '../components/NodesList.jsx';
import KPICards from '../components/KPICards.jsx';
import { initSocket, onAccidentDetected, offAccidentDetected } from '../services/socketService.js';

function MapOverview() {
  const [showAccident, setShowAccident] = useState(false);
  const [currentIncident, setCurrentIncident] = useState(null);

  useEffect(() => {
    // Initialize socket connection
    initSocket();

    // Listen for real-time accident events
    const handleAccident = (incidentData) => {
      console.log('🚨 New accident detected:', incidentData);
      setCurrentIncident(incidentData);
      setShowAccident(true);
    };

    onAccidentDetected(handleAccident);

    // Cleanup
    return () => {
      offAccidentDetected(handleAccident);
    };
  }, []);

  return (
    <div className="flex h-screen bg-safe-bg overflow-hidden">
      {/* Sidebar on the left */}
      <Sidebar activeIcon="chart-line" />
      
      {/* Main content area on the right */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header at the top */}
        <MapHeader />
        
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
