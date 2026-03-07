import { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal.jsx';
import Card from '@/components/ui/Card.jsx';
import Button from '@/components/ui/Button.jsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faArrowRight, faCircleCheck, faCircleXmark } from '@fortawesome/free-solid-svg-icons';
import AccidentDialogHeader from './layout/AccidentDialogHeader.jsx';
import AiAnalysisCard from './cards/AiAnalysisCard.jsx';
import DecisionCard from './cards/DecisionCard.jsx';
import OverridePanel from './override/OverridePanel.jsx';
import AccidentMediaArea from './media/AccidentMediaArea.jsx';
import { emitAdminAccidentResponse } from '@/services/socketService.js';
import { showError } from '@/utils/toast';

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

      emitAdminAccidentResponse(response);
      onDecision?.(response);
    } catch (e) {
      console.error('Confirm error', e);
      showError(`Error: ${e.message}`);
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
      onDecision?.(response);
    } catch (e) {
      console.error('Reject error', e);
      showError(`Error: ${e.message}`);
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
  
  // Get actual values from node or decision data
  const defaultSpeedLimit = nodeData.defaultSpeedLimit || decisionData.originalSpeedLimit || 80;
  const defaultLaneCount = nodeData.defaultLaneCount
    || nodeData.defaultLaneConfiguration?.length
    || (decisionData.laneConfiguration ? decisionData.laneConfiguration.split(',').length : initialLaneCount || 3);
  
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
              <AccidentMediaArea incident={incident} />
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

export default AccidentDialog;
