import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBrain, faArrowRight, faGaugeHigh, faRoad, faCircleCheck } from '@fortawesome/free-solid-svg-icons';

function DecisionCard({
  originalSpeedLimit = 80,
  newSpeedLimit = 80,
  originalLaneStates = [],
  newLaneStates = [],
  laneNames = [],
  statusConfig = {}
}) {
  // Ensure all arrays are valid and same length
  const safeOriginalStates = Array.isArray(originalLaneStates) ? originalLaneStates : [];
  const safeNewStates = Array.isArray(newLaneStates) ? newLaneStates : [];
  const safeLaneNames = Array.isArray(laneNames) ? laneNames : [];
  const maxLength = Math.max(safeOriginalStates.length, safeNewStates.length, safeLaneNames.length);
  
  // Pad arrays to same length if needed
  const paddedOriginalStates = Array.from({ length: maxLength }, (_, i) => safeOriginalStates[i] || 'open');
  const paddedNewStates = Array.from({ length: maxLength }, (_, i) => safeNewStates[i] || 'open');
  const paddedLaneNames = Array.from({ length: maxLength }, (_, i) => safeLaneNames[i] || `Lane ${i + 1}`);
  
  const speedReduction = originalSpeedLimit - newSpeedLimit;
  const hasChanges = speedReduction > 0 || paddedOriginalStates.some((state, i) => state !== paddedNewStates[i]);
  
  // Return early if no data
  if (maxLength === 0) {
    return (
      <div className="space-y-[10px]">
        <div className="flex items-center gap-[8px]">
          <FontAwesomeIcon icon={faBrain} className="text-[#8b5cf6] text-[14px]" />
          <h4 className="font-bold text-[14px] sm:text-[15px] text-[#101828]">AI Decision</h4>
        </div>
        <div className="p-[16px] border-2 border-dashed border-[#e9d5ff] rounded-[12px] bg-[#fafafa] text-[13px] text-[#6a7282] flex items-center justify-center">
          No decision data available
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-[10px]">
      <div className="flex items-center gap-[8px]">
        <FontAwesomeIcon icon={faBrain} className="text-[#8b5cf6] text-[14px]" />
        <h4 className="font-bold text-[14px] sm:text-[15px] text-[#101828]">AI Decision</h4>
        {hasChanges && (
          <span className="ml-auto text-[10px] font-semibold px-[8px] py-[2px] rounded-full bg-[#fef3c7] text-[#d97706]">
            MODIFIED
          </span>
        )}
      </div>
      <div className="p-[16px] border-2 border-[#e9d5ff] rounded-[12px] bg-gradient-to-br from-[#faf5ff] to-[#f3e8ff] space-y-[16px] shadow-sm">
        {/* Speed Limit Comparison */}
        <div className="bg-white/80 rounded-[10px] p-[14px] border border-[#e5e7eb]">
          <div className="flex items-center gap-[8px] mb-[10px]">
            <FontAwesomeIcon icon={faGaugeHigh} className="text-[#6366f1] text-[12px]" />
            <span className="text-[11px] font-semibold text-[#6a7282] uppercase tracking-wide">Speed Limit</span>
          </div>
          <div className="flex items-center justify-between gap-[12px]">
            <div className="flex-1 text-center">
              <p className="text-[10px] text-[#6a7282] mb-[4px] uppercase tracking-wide">Before</p>
              <p className="text-[22px] font-bold text-[#101828]">{originalSpeedLimit}</p>
              <p className="text-[10px] text-[#6a7282]">km/h</p>
            </div>
            <div className="flex items-center justify-center">
              <FontAwesomeIcon icon={faArrowRight} className="text-[#9ca3af] text-[16px]" />
            </div>
            <div className="flex-1 text-center">
              <p className="text-[10px] text-[#6a7282] mb-[4px] uppercase tracking-wide">After</p>
              <p className={`text-[22px] font-bold ${
                speedReduction > 0 ? 'text-[#dc2626]' : 'text-[#16a34a]'
              }`}>{newSpeedLimit}</p>
              <p className="text-[10px] text-[#6a7282]">km/h</p>
            </div>
            
          </div>
        </div>

        {/* Lane Configuration Comparison */}
        <div className="bg-white/80 rounded-[10px] p-[14px] border border-[#e5e7eb]">
          <div className="flex items-center gap-[8px] mb-[12px]">
            <FontAwesomeIcon icon={faRoad} className="text-[#6366f1] text-[12px]" />
            <span className="text-[11px] font-semibold text-[#6a7282] uppercase tracking-wide">Lane Configuration</span>
          </div>
          
          <div className="space-y-[16px]">
            {/* Before */}
            <div>
              <p className="text-[10px] font-bold text-[#6a7282] mb-[8px] uppercase tracking-wide">Before</p>
              <div className="flex gap-[10px] justify-center flex-wrap">
                {paddedOriginalStates.map((state, i) => {
                  const config = statusConfig[state] || statusConfig.open || { icon: faCircleCheck, color: '#22c55e', bg: '#dcfce7' };
                  const hasChanged = state !== paddedNewStates[i];
                  return (
                    <div key={`orig-${i}`} className="text-center relative">
                      <div 
                        className={`flex items-center justify-center w-[44px] h-[44px] rounded-[8px] border-2 transition-all ${
                          hasChanged ? 'border-[#f59e0b] ring-2 ring-[#fef3c7]' : 'border-[#d0d5dd]'
                        }`}
                        style={{ backgroundColor: config.bg }}
                      >
                        <FontAwesomeIcon
                          icon={config.icon}
                          style={{
                            color: config.color,
                            width: '18px',
                            height: '18px'
                          }}
                        />
                      </div>
                      <p className="text-[10px] text-[#6a7282] mt-[4px] font-semibold">
                        {paddedLaneNames[i] || `L${i + 1}`}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Divider with arrow */}
            <div className="flex items-center justify-center">
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#d1d5db] to-transparent" />
              <FontAwesomeIcon icon={faArrowRight} className="mx-[12px] text-[#9ca3af] text-[14px]" />
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#d1d5db] to-transparent" />
            </div>

            {/* After */}
            <div>
              <p className="text-[10px] font-bold text-[#6a7282] mb-[8px] uppercase tracking-wide">After</p>
              <div className="flex gap-[10px] justify-center flex-wrap">
                {paddedNewStates.map((state, i) => {
                  const config = statusConfig[state] || statusConfig.open || { icon: faCircleCheck, color: '#22c55e', bg: '#dcfce7' };
                  const hasChanged = state !== paddedOriginalStates[i];
                  return (
                    <div key={`new-${i}`} className="text-center relative">
                      {hasChanged && (
                        <div className="absolute -top-[6px] -right-[6px] w-[14px] h-[14px] bg-[#f59e0b] rounded-full border-2 border-white z-10" />
                      )}
                      <div 
                        className={`flex items-center justify-center w-[44px] h-[44px] rounded-[8px] border-2 transition-all ${
                          hasChanged ? 'border-[#dc2626] ring-2 ring-[#fee2e2]' : 'border-[#d0d5dd]'
                        }`}
                        style={{ backgroundColor: config.bg }}
                      >
                        <FontAwesomeIcon
                          icon={config.icon}
                          style={{
                            color: config.color,
                            width: '18px',
                            height: '18px'
                          }}
                        />
                      </div>
                      <p className="text-[10px] text-[#6a7282] mt-[4px] font-semibold">
                        {paddedLaneNames[i] || `L${i + 1}`}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DecisionCard;
