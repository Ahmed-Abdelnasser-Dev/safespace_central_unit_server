import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

function OverridePanel({
  overrideOpen,
  setOverrideOpen,
  defaultLaneCount,
  laneNames,
  tempLaneConfig,
  setTempLaneConfig,
  laneConfigStates,
  statusConfig,
  tempSpeedLimit,
  setTempSpeedLimit,
  defaultSpeedLimit,
  handleSaveOverride,
  handleCancelOverride
}) {
  return (
    <div className="space-y-[8px]">
      <h4 className="font-bold text-[13px] sm:text-[14px] text-[#6a7282] uppercase tracking-[0.4px]">Override Configuration</h4>
      <div className="border-2 border-[#f97316] rounded-[8px] overflow-hidden bg-[#fffbeb]">
        <div className="w-full flex items-center justify-between px-[12px] py-[10px] bg-[#fed7aa] font-bold text-[13px] sm:text-[14px]">
          <span className="flex items-center gap-[8px] text-[#92400e]">
            <FontAwesomeIcon icon="exclamation" style={{ color: '#ea580c', width: '12px', height: '12px' }} />
            Override
          </span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={overrideOpen}
              onChange={e => setOverrideOpen(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-[36px] h-[18px] bg-[#e5e7eb] rounded-full peer peer-checked:bg-[#247cff] transition-colors"></div>
            <div className="absolute left-[2px] top-[2px] w-[14px] h-[14px] bg-white rounded-full transition-transform peer-checked:translate-x-[18px]"></div>
          </label>
        </div>

        {overrideOpen && (
          <div className="border-t border-[#fed7aa] p-[12px] space-y-[12px] bg-white">
            <div className="space-y-[10px]">
              {Array.from({ length: defaultLaneCount }).map((_, idx) => {
                const currentState = tempLaneConfig[idx] || laneConfigStates[idx] || 'open';
                const states = ['open', 'blocked', 'left', 'right'];

                return (
                  <div key={idx} className="space-y-[6px]">
                    <label className="font-bold text-[11px] sm:text-[12px] text-[#101828] block">{laneNames[idx] || `Lane ${idx + 1}`}</label>
                    <div className="grid grid-cols-4 gap-[4px]">
                      {states.map(state => {
                        const config = statusConfig[state];
                        return (
                          <button
                            key={state}
                            onClick={() => {
                              const nextConfig = [...tempLaneConfig];
                              nextConfig[idx] = state;
                              setTempLaneConfig(nextConfig);
                            }}
                            className={`py-[6px] rounded-[6px] text-[10px] sm:text-[11px] font-bold transition-all flex flex-col items-center justify-center gap-[3px] border ${
                              currentState === state
                                ? 'border-2 border-[#247cff] text-white'
                                : 'bg-[#f7f8f9] border border-[#d0d5dd] text-[#6a7282] hover:bg-[#e8e9ea]'
                            }`}
                            style={{
                              backgroundColor: currentState === state ? config.color : undefined
                            }}
                          >
                            <FontAwesomeIcon
                              icon={config.icon}
                              style={{ width: '12px', height: '12px' }}
                            />
                            <span>{config.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-[6px] border-t border-[#e5e7eb] pt-[10px]">
              <div className="flex justify-between items-center">
                <label className="font-bold text-[12px] sm:text-[13px] text-[#101828]">New Speed Limit</label>
                <span className="px-[8px] py-[2px] rounded-[3px] font-bold text-[11px] bg-[#fee2e2] text-[#d63e4d]">{tempSpeedLimit} km/h</span>
              </div>
              <input
                type="range"
                min="20"
                max="200"
                step="5"
                value={tempSpeedLimit}
                onChange={e => setTempSpeedLimit(parseInt(e.target.value))}
                className="w-full accent-[#247cff] cursor-pointer"
              />
              <p className="text-[11px] text-[#6a7282]">Default: {defaultSpeedLimit} km/h</p>
            </div>

            <div className="flex gap-[8px] pt-[8px] border-t border-[#e5e7eb]">
              <button
                onClick={handleSaveOverride}
                className="flex-1 px-[12px] py-[8px] bg-[#247cff] text-white rounded-[6px] font-bold text-[12px] sm:text-[13px] hover:bg-[#1a5dcc] transition-colors flex items-center justify-center gap-[6px]"
              >
                <FontAwesomeIcon icon="save" style={{ width: '12px', height: '12px' }} />
                Save
              </button>
              <button
                onClick={handleCancelOverride}
                className="flex-1 px-[12px] py-[8px] bg-[#f7f8f9] text-[#101828] rounded-[6px] font-bold text-[12px] sm:text-[13px] border border-[#e5e7eb] hover:bg-[#e8e9ea] transition-colors flex items-center justify-center gap-[6px]"
              >
                <FontAwesomeIcon icon="times" style={{ width: '12px', height: '12px' }} />
                Cancel
              </button>
            </div>
          </div>
        )}

        {!overrideOpen && (
          <div className="border-t border-[#fed7aa] p-[12px] bg-white">
            <div className="text-[12px] text-[#6a7282]">Override is off. Toggle to edit lane states and speed.</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default OverridePanel;
