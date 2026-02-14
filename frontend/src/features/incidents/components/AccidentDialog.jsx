import React, { useEffect, useMemo, useState } from 'react';
import Modal from '../../../components/ui/Modal.jsx';
import Card from '../../../components/ui/Card.jsx';
import Button from '../../../components/ui/Button.jsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faArrowRight, faCircleCheck, faCircleXmark } from '@fortawesome/free-solid-svg-icons';
import AccidentDialogHeader from './layout/AccidentDialogHeader.jsx';
import AiAnalysisCard from './cards/AiAnalysisCard.jsx';
import DecisionCard from './cards/DecisionCard.jsx';
import OverridePanel from './override/OverridePanel.jsx';
import MediaCarousel from './media/MediaCarousel.jsx';
import AccidentPolygonDialog from './media/AccidentPolygonDialog.jsx';
import { emitAdminAccidentResponse } from '../../../services/socketService.js';

/**
 * AccidentDialog – Displays incoming accident with AI Analysis and Decision Results
 * 
 * Flow: Node → AI Module → Decision Module → Dashboard (this component) → Admin Decision → Node
 * 
 * @param {object} props
 * @param {boolean} props.open
 * @param {function} props.onClose
 * @param {function} props.onDecision
 * @param {object} props.incident
 */
function AccidentDialog({ open, onClose, incident, onDecision }) {
  const [polygonDialogOpen, setPolygonDialogOpen] = useState(false);
  // Initialize with AI Decision module's recommendations (not node defaults)
  const initialSpeedLimit = incident?.decision?.speedLimit
    || incident?.node?.defaultSpeedLimit
    || incident?.speedLimit
    || 40;
  const initialLaneCount = incident?.node?.defaultLaneCount
    || incident?.node?.defaultLaneConfiguration?.length
    || (incident?.decision?.laneConfiguration ? incident.decision.laneConfiguration.split(',').length : 3);
  const initialLaneConfig = Array.from({ length: initialLaneCount }, (_, index) => {
    // Prioritize AI decision over node defaults
    if (incident?.decision?.laneConfiguration) {
      return incident.decision.laneConfiguration.split(',')[index]?.trim().toLowerCase() || 'open';
    }
    const nodeDefault = incident?.node?.defaultLaneConfiguration?.[index]?.state;
    if (nodeDefault) {
      return nodeDefault.toLowerCase();
    }
    return 'open';
  });
  const initialActions = incident?.decision?.actions || ['REDUCE_SPEED_LIMIT'];
  
  const [selected, setSelected] = useState(initialActions);
  const [speedLimit, setSpeedLimit] = useState(initialSpeedLimit);
  const [laneConfiguration, setLaneConfiguration] = useState(initialLaneConfig);
  const [decisionType, setDecisionType] = useState('CONFIRMED');
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [tempSpeedLimit, setTempSpeedLimit] = useState(initialSpeedLimit);
  const [tempLaneConfig, setTempLaneConfig] = useState(initialLaneConfig);
  const [allLanesState, setAllLanesState] = useState('open');
  const [laneOverrideMode, setLaneOverrideMode] = useState('per');

  // Update state when incident changes
  useEffect(() => {
    if (incident) {
      const laneCount = incident?.node?.defaultLaneCount
        || incident?.node?.defaultLaneConfiguration?.length
        || (incident?.decision?.laneConfiguration ? incident.decision.laneConfiguration.split(',').length : 3);
      const parsedConfig = incident.decision?.laneConfiguration
        ? incident.decision.laneConfiguration.split(',').map(s => s.trim().toLowerCase())
        : [];
      // Prioritize AI decision over node defaults
      const configStates = Array.from({ length: laneCount }, (_, idx) => {
        if (parsedConfig[idx]) {
          return parsedConfig[idx];
        }
        const nodeDefault = incident?.node?.defaultLaneConfiguration?.[idx]?.state;
        return nodeDefault ? nodeDefault.toLowerCase() : 'open';
      });
      const configState = configStates[0] || 'open';
      // Use AI decision speedLimit as the initial final decision
      const aiSpeedLimit = incident.decision?.speedLimit || incident?.node?.defaultSpeedLimit || 40;
      setSpeedLimit(aiSpeedLimit);
      setLaneConfiguration(configStates);
      setSelected(incident.decision?.actions || []);
      setDecisionType('CONFIRMED');
      setTempSpeedLimit(aiSpeedLimit);
      setTempLaneConfig(configStates);
      setAllLanesState(configState || 'open');
      setLaneOverrideMode('per');
      setOverrideOpen(false);
    }
  }, [incident, initialLaneCount]);

  useMemo(() => ({ aiData: incident?.ai || {}, decisionData: incident?.decision || {} }), [incident]);

  const handleConfirm = async () => {
    try {
      const hasModifications = 
        speedLimit !== initialSpeedLimit || 
        JSON.stringify(laneConfiguration) !== JSON.stringify(initialLaneConfig) ||
        JSON.stringify(selected) !== JSON.stringify(initialActions);

      const finalDecisionType = hasModifications ? 'MODIFIED' : 'CONFIRMED';

      const blockedLanes = laneConfiguration
        .map((state, idx) => (state === 'blocked' ? idx + 1 : null))
        .filter(Boolean);

      // Ensure laneConfiguration is a proper array
      const finalLaneConfiguration = Array.isArray(laneConfiguration) ? laneConfiguration : [];

      // Ensure accidentPolygon includes baseWidth/baseHeight
      let accidentPolygon = incident?.accidentPolygon;
      if (accidentPolygon) {
        // Try to get image resolution from mediaList
        const image = incident?.mediaList?.find(m => m.type === 'image');
        if (image && (!accidentPolygon.baseWidth || !accidentPolygon.baseHeight)) {
          // If image metadata is available, set baseWidth/baseHeight
          // Assume image object has width/height properties (if not, fallback to 640)
          accidentPolygon = {
            ...accidentPolygon,
            baseWidth: image.width || 640,
            baseHeight: image.height || 640
          };
        }
      }

      const response = {
        incidentId: incident?.incidentId || '',
        nodeId: incident?.nodeId,
        isAccident: true,
        status: finalDecisionType,
        actions: selected,
        speedLimit: Number(speedLimit),
        blockedLanes,
        laneStates: finalLaneConfiguration,
        laneConfiguration: finalLaneConfiguration.join(','),
        accidentPolygon,
        message: `Admin ${finalDecisionType.toLowerCase()} - ${selected.length} actions`,
        timestamp: new Date().toISOString(),
      };

      console.log('📤 Sending admin confirmation:', {
        incidentId: response.incidentId,
        status: response.status,
        speedLimit: response.speedLimit,
        laneStatesLength: response.laneStates.length,
        laneStates: response.laneStates,
        accidentPolygon: response.accidentPolygon
      });

      emitAdminAccidentResponse(response);
      console.log('✅ Admin decision sent via socket');
      onDecision?.(response);
    } catch (e) {
      console.error('Confirm error', e);
      alert(`Error: ${e.message}`);
    } finally {
      onClose?.();
    }
  };

  const handleCancel = async () => {
    try {
      const response = {
        incidentId: incident?.incidentId || '',
        nodeId: incident?.nodeId,
        isAccident: false,
        status: 'REJECTED',
        actions: [],
        message: 'Admin rejected incident',
        timestamp: new Date().toISOString(),
      };

      emitAdminAccidentResponse(response);
      console.log('✅ Admin rejection sent via socket');
      onDecision?.(response);
    } catch (e) {
      console.error('Reject error', e);
      alert(`Error: ${e.message}`);
    } finally {
      onClose?.();
    }
  };

  const handleSaveOverride = () => {
    const defaultLaneCount = nodeData.defaultLaneCount
      || nodeData.defaultLaneConfiguration?.length
      || tempLaneConfig.length
      || 3;
    const finalLanes = laneOverrideMode === 'all'
      ? Array(defaultLaneCount).fill(allLanesState)
      : tempLaneConfig.slice(0, defaultLaneCount);
    setSpeedLimit(tempSpeedLimit);
    setLaneConfiguration(finalLanes);
    setDecisionType('MODIFIED');
    setOverrideOpen(false);
  };

  const handleCancelOverride = () => {
    setTempSpeedLimit(speedLimit);
    setTempLaneConfig(laneConfiguration);
    setOverrideOpen(false);
  };

  const timeString = incident?.timestamp ? new Date(incident.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString();
  
  // Extract AI analysis data
  const aiData = incident?.ai || {};
  const decisionData = incident?.decision || {};
  const nodeData = incident?.node || {};
  
  // Debug logging
  console.log('🔍 AccidentDialog Debug:', {
    nodeData,
    defaultLaneCount: nodeData.defaultLaneCount,
    defaultLaneConfigLength: nodeData.defaultLaneConfiguration?.length,
    fullNodeData: incident?.node
  });
  
  // Get actual values from node or decision data
  const defaultSpeedLimit = nodeData.defaultSpeedLimit || decisionData.originalSpeedLimit || 80;
  const defaultLaneCount = nodeData.defaultLaneCount
    || nodeData.defaultLaneConfiguration?.length
    || (decisionData.laneConfiguration ? decisionData.laneConfiguration.split(',').length : initialLaneCount || 3);
  
  console.log('🔍 Calculated defaultLaneCount:', defaultLaneCount);
  
  const laneNames = Array.from({ length: defaultLaneCount }, (_, index) => {
    const nodeName = nodeData.defaultLaneConfiguration?.[index]?.name;
    return nodeName || `Lane ${index + 1}`;
  });
  
  // Parse lane configuration (e.g., "open,blocked,right,left")
  const laneConfigStr = decisionData.laneConfiguration || '';
  const parsedDecisionConfig = laneConfigStr
    ? laneConfigStr.split(',').map(s => s.trim().toLowerCase())
    : [];
  const laneConfigStates = Array.from(
    { length: defaultLaneCount },
    (_, idx) => parsedDecisionConfig[idx] || 'open'
  );

  const originalLaneStates = Array.from({ length: defaultLaneCount }, (_, idx) => {
    const nodeDefault = nodeData.defaultLaneConfiguration?.[idx]?.state;
    return nodeDefault ? nodeDefault.toLowerCase() : 'open';
  });
  
  // Lane status configuration matching node maintainer design
  const statusConfig = {
    open: { icon: faCircleCheck, color: '#22c55e', bg: '#dcfce7', label: 'Open' },
    blocked: { icon: faCircleXmark, color: '#d63e4d', bg: '#fee2e2', label: 'Blocked' },
    right: { icon: faArrowRight, color: '#247cff', bg: '#dbeafe', label: 'Right' },
    left: { icon: faArrowLeft, color: '#247cff', bg: '#dbeafe', label: 'Left' },
  };

  return (
    <Modal open={open} onClose={onClose} size="2xl">
      <Card className="overflow-hidden flex flex-col max-h-[90vh]">
        <AccidentDialogHeader incident={incident} timeString={timeString} />

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto px-[20px] py-[16px] space-y-[16px] bg-[#fafafa]">
          
          {/* Top Row: Image + Override */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-[16px]">
            <div>
              <div className="bg-[#e5e7eb] rounded-[8px] overflow-hidden border border-[#d1d5db] relative max-w-[640px] mx-auto" style={{ aspectRatio: '1 / 1', minHeight: '320px', maxHeight: '640px' }}>
                <MediaCarousel 
                  mediaList={incident?.mediaList || []}
                  accidentPolygon={incident?.accidentPolygon}
                  nodePolygons={incident?.nodePolygons || []}
                />
                <button
                  className="absolute top-2 right-2 z-20 bg-white/80 hover:bg-white text-safe-blue border border-safe-border rounded px-3 py-1 text-xs font-semibold shadow transition"
                  onClick={() => setPolygonDialogOpen(true)}
                  title="View Polygons"
                >
                  <FontAwesomeIcon icon="draw-polygon" className="mr-1" />
                  View Polygons
                </button>
                <AccidentPolygonDialog
                  open={polygonDialogOpen}
                  onClose={() => setPolygonDialogOpen(false)}
                  accidentPolygon={incident?.accidentPolygon}
                  nodePolygons={incident?.nodePolygons || []}
                  imageUrl={incident?.mediaList?.[0]?.url || ''}
                />
              </div>
            </div>

            <OverridePanel
              overrideOpen={overrideOpen}
              setOverrideOpen={setOverrideOpen}
              defaultLaneCount={defaultLaneCount}
              laneNames={laneNames}
              tempLaneConfig={tempLaneConfig}
              setTempLaneConfig={setTempLaneConfig}
              laneConfigStates={laneConfigStates}
              statusConfig={statusConfig}
              tempSpeedLimit={tempSpeedLimit}
              setTempSpeedLimit={setTempSpeedLimit}
              defaultSpeedLimit={defaultSpeedLimit}
              handleSaveOverride={handleSaveOverride}
              handleCancelOverride={handleCancelOverride}
            />
          </div>

          {/* AI Analysis */}
          <AiAnalysisCard aiData={aiData} />
          
          {/* Decision Comparison */}
          <DecisionCard
            originalSpeedLimit={defaultSpeedLimit}
            newSpeedLimit={decisionData.speedLimit || defaultSpeedLimit}
            originalLaneStates={originalLaneStates}
            newLaneStates={laneConfigStates}
            laneNames={laneNames}
            statusConfig={statusConfig}
            finalSpeedLimit={speedLimit}
            finalLaneStates={laneConfiguration}
          />
        </div>

        {/* Footer */}
        <Modal.Footer className="flex-shrink-0 border-t-2 border-[#e5e7eb] bg-white px-[20px] py-[16px] gap-[12px]">
          <Button 
            variant="secondary" 
            onClick={handleCancel}
            className="flex items-center justify-center gap-[8px] px-[20px] py-[10px] rounded-[6px] font-bold text-[13px] border-[#e5e7eb] hover:bg-[#f9fafb]"
          >
            <FontAwesomeIcon icon="ban" style={{ width: '14px', height: '14px' }} />
            Reject
          </Button>
          <Button 
            variant="primary" 
            onClick={handleConfirm}
            className="flex items-center justify-center gap-[8px] px-[20px] py-[10px] rounded-[6px] font-bold text-[13px] bg-[#16a34a] hover:bg-[#15803d]"
          >
            <FontAwesomeIcon icon="check" style={{ width: '14px', height: '14px' }} />
            Confirm & Send
          </Button>
        </Modal.Footer>
      </Card>
    </Modal>
  );
}

// Helper functions to format action names
function formatActionTitle(action) {
  return action
    .split('_')
    .map(w => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ');
}

function formatActionDescription(action) {
  const descriptions = {
    'DISPATCH_EMERGENCY_SERVICES': 'Immediately dispatch ambulance and fire department',
    'NOTIFY_EMERGENCY_SERVICES': 'Alert emergency services to standby',
    'CLOSE_ALL_AFFECTED_LANES': 'Block all lanes impacted by accident',
    'CLOSE_ACCIDENT_LANE': 'Close only the lane where accident occurred',
    'REDUCE_SPEED_LIMIT_50_PERCENT': 'Reduce speed limit by 50%',
    'REDUCE_SPEED_LIMIT_30_PERCENT': 'Reduce speed limit by 30%',
    'REDUCE_SPEED_LIMIT_20_PERCENT': 'Reduce speed limit by 20%',
    'MONITOR_SITUATION': 'Continue monitoring without immediate action',
    'PRIORITY_AMBULANCE': 'Request priority ambulance dispatch',
    'FIRE_DEPARTMENT_ALERT': 'Alert fire department for possible hazards',
    'CLEAR_MULTIPLE_LANES': 'Coordinate clearing of multiple lanes',
    'TOW_SERVICES_REQUIRED': 'Request tow truck services',
    'CLOSE_LANES': 'Close affected lanes to traffic',
    'REDUCE_SPEED_LIMIT': 'Reduce speed limit in area',
    'ALERT_EMERGENCY_SERVICES': 'Contact emergency services',
    'DISPLAY_MERGE_SIGNS': 'Show lane merge instructions on signs',
  };
  return descriptions[action] || 'Execute this action';
}

export default AccidentDialog;
