import React, { useEffect, useMemo, useState } from 'react';
import Modal from '../../../components/ui/Modal.jsx';
import Card from '../../../components/ui/Card.jsx';
import Button from '../../../components/ui/Button.jsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faArrowRight, faCircleCheck, faCircleXmark } from '@fortawesome/free-solid-svg-icons';
import AccidentDialogHeader from './layout/AccidentDialogHeader.jsx';
import AiAnalysisCard from './cards/AiAnalysisCard.jsx';
import DecisionCard from './cards/DecisionCard.jsx';
import FinalDecisionCard from './cards/FinalDecisionCard.jsx';
import OverridePanel from './override/OverridePanel.jsx';
import MediaCarousel from './media/MediaCarousel.jsx';

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
  // Initialize with Decision module's recommendations
  const initialSpeedLimit = incident?.node?.defaultSpeedLimit
    || incident?.decision?.speedLimit
    || incident?.speedLimit
    || 40;
  const initialLaneCount = incident?.node?.defaultLaneCount
    || incident?.node?.defaultLaneConfiguration?.length
    || (incident?.decision?.laneConfiguration ? incident.decision.laneConfiguration.split(',').length : 3);
  const initialLaneConfig = Array.from({ length: initialLaneCount }, (_, index) => {
    const nodeDefault = incident?.node?.defaultLaneConfiguration?.[index]?.state;
    if (nodeDefault) {
      return nodeDefault.toLowerCase();
    }
    if (incident?.decision?.laneConfiguration) {
      return incident.decision.laneConfiguration.split(',')[index]?.trim().toLowerCase() || 'open';
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
      const configStates = Array.from({ length: laneCount }, (_, idx) => {
        const nodeDefault = incident?.node?.defaultLaneConfiguration?.[idx]?.state;
        return nodeDefault ? nodeDefault.toLowerCase() : (parsedConfig[idx] || 'open');
      });
      const configState = configStates[0] || 'open';
      setSpeedLimit(incident?.node?.defaultSpeedLimit || incident.decision?.speedLimit || 40);
      setLaneConfiguration(configStates);
      setSelected(incident.decision?.actions || []);
      setDecisionType('CONFIRMED');
      setTempSpeedLimit(incident?.node?.defaultSpeedLimit || incident.decision?.speedLimit || 40);
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

      const response = {
        incidentId: incident?.incidentId || '',
        nodeId: incident?.nodeId,
        status: finalDecisionType,
        actions: selected,
        speedLimit: Number(speedLimit),
        blockedLanes,
        laneConfiguration: laneConfiguration.join(','),
        message: `Admin ${finalDecisionType.toLowerCase()} - ${selected.length} actions`,
        timestamp: new Date().toISOString(),
      };
      
      // Send admin decision via HTTP to backend
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/accident-decision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(response),
      });
      
      if (!res.ok) {
        throw new Error(`Failed to send admin decision: ${res.status}`);
      }
      
      console.log('✅ Admin decision sent successfully');
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
        status: 'REJECTED',
        actions: [],
        message: 'Admin rejected incident',
        timestamp: new Date().toISOString(),
      };
      
      // Send admin rejection via HTTP to backend
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/accident-decision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(response),
      });
      
      if (!res.ok) {
        throw new Error(`Failed to send admin decision: ${res.status}`);
      }
      
      console.log('✅ Admin rejection sent successfully');
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
        <div className="flex-1 overflow-y-auto px-[16px] sm:px-[20px] py-[12px] sm:py-[16px] space-y-[14px] sm:space-y-[16px]">
          
          {/* Top Row: Image + Override */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-[12px] sm:gap-[16px]">
            <div className="space-y-[8px]">
              <h4 className="font-bold text-[13px] sm:text-[14px] text-[#6a7282] uppercase tracking-[0.4px]">Incident Scene</h4>
              <div className="aspect-video bg-[#e5e7eb] rounded-[8px] overflow-hidden shadow border border-[#d0d5dd]">
                <MediaCarousel 
                  mediaList={incident?.mediaList || []}
                  accidentPolygon={incident?.accidentPolygon}
                  nodePolygons={incident?.nodePolygons || []}
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

          {/* Bottom Row: AI + Decision */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-[12px] sm:gap-[16px]">
            <AiAnalysisCard aiData={aiData} />
            <DecisionCard
              originalSpeedLimit={defaultSpeedLimit}
              newSpeedLimit={decisionData.speedLimit || defaultSpeedLimit}
              originalLaneStates={originalLaneStates}
              newLaneStates={laneConfigStates}
              laneNames={laneNames}
              statusConfig={statusConfig}
            />
          </div>

          <FinalDecisionCard
            speedLimit={speedLimit}
            laneConfiguration={laneConfiguration}
            laneNames={laneNames}
            statusConfig={statusConfig}
          />

          {decisionType === 'MODIFIED' && (
            <div className="bg-[#fef3c7] border border-[#fcd34d] p-[10px] rounded-[8px] text-[12px]">
              <p className="font-bold text-[#92400e] flex items-center gap-[8px]">
                <FontAwesomeIcon icon="exclamation-triangle" style={{ width: '12px', height: '12px' }} />
                Changes will be submitted as MODIFIED
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <Modal.Footer className="flex-shrink-0 border-t border-[#e5e7eb] bg-[#f7f8f9] px-[16px] sm:px-[20px] py-[12px] sm:py-[14px] gap-[10px] sm:gap-[12px]">
          <Button 
            variant="secondary" 
            onClick={handleCancel}
            className="flex items-center justify-center gap-[6px] px-[12px] py-[8px] rounded-[6px] font-bold text-[12px] sm:text-[13px]"
          >
            <FontAwesomeIcon icon="ban" style={{ width: '12px', height: '12px' }} />
            Reject
          </Button>
          <Button 
            variant="primary" 
            onClick={handleConfirm}
            className="flex items-center justify-center gap-[6px] px-[12px] py-[8px] rounded-[6px] font-bold text-[12px] sm:text-[13px]"
          >
            <FontAwesomeIcon icon="check" style={{ width: '12px', height: '12px' }} />
            {decisionType === 'MODIFIED' ? 'Confirm (Modified)' : 'Confirm'}
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
