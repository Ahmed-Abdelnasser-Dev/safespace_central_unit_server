import Sidebar from '../components/Sidebar.jsx';
import MapHeader from '../components/MapHeader.jsx';
import FilterTabs from '../components/FilterTabs.jsx';
import MapView from '../components/MapView.jsx';
import { useState } from 'react';
import AccidentDialog from '../features/incidents/components/AccidentDialog.jsx';
import NodesList from '../components/NodesList.jsx';
import KPICards from '../components/KPICards.jsx';

function MapOverview() {
  const [showAccident, setShowAccident] = useState(false);
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
                {/* Temporary demo trigger button */}
                <button
                  onClick={() => setShowAccident(true)}
                  className="absolute top-6 left-6 z-10 bg-safe-danger text-white text-xs px-3 py-2 rounded-lg shadow-card hover:bg-safe-danger/90"
                >
                  Simulate Accident
                </button>
                <AccidentDialog
                  open={showAccident}
                  onClose={() => setShowAccident(false)}
                  onConfirm={(actions) => {
                    // Placeholder: integrate with backend confirmation endpoint
                    console.log('Confirmed actions:', actions);
                  }}
                  incident={{
                    timestamp: Date.now(),
                    latitude: 40.7128,
                    longitude: -74.0060,
                    lanes: ['Lane 2', 'Emergency Lane', 'Lane 3'],
                    locationName: 'Highway A1, Exit 23B'
                  }}
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
