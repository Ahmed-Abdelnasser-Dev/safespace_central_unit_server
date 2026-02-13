import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faExclamationTriangle, faBullseye, faHeartPulse } from '@fortawesome/free-solid-svg-icons';

function AiAnalysisCard({ aiData }) {
  const getSeverityColor = (severity) => {
    if (severity >= 4) return 'text-[#dc2626] bg-[#fee2e2]';
    if (severity >= 3) return 'text-[#ea580c] bg-[#fed7aa]';
    if (severity >= 2) return 'text-[#f59e0b] bg-[#fef3c7]';
    return 'text-[#16a34a] bg-[#dcfce7]';
  };

  const getInjuryRiskConfig = (risk) => {
    if (risk === 'high') return { color: '#dc2626', bg: '#fee2e2', label: 'High' };
    if (risk === 'medium') return { color: '#f97316', bg: '#fed7aa', label: 'Medium' };
    return { color: '#16a34a', bg: '#dcfce7', label: 'Low' };
  };

  return (
    <div className="space-y-[10px]">
      <div className="flex items-center gap-[8px]">
        <FontAwesomeIcon icon={faRobot} className="text-[#6366f1] text-[14px]" />
        <h4 className="font-bold text-[14px] sm:text-[15px] text-[#101828]">AI Analysis</h4>
      </div>
      {aiData && Object.keys(aiData).length > 0 ? (
        <div className="p-[16px] border-2 border-[#e0e7ff] rounded-[12px] bg-gradient-to-br from-[#f8faff] to-[#f0f4ff] space-y-[12px] shadow-sm">
          <div className="grid grid-cols-2 gap-[12px]">
            {/* Accident Type */}
            <div className="col-span-2 bg-white/80 rounded-[8px] p-[12px] border border-[#e5e7eb]">
              <div className="flex items-center gap-[8px] mb-[6px]">
                <FontAwesomeIcon icon={faExclamationTriangle} className="text-[#d63e4d] text-[12px]" />
                <span className="text-[11px] font-semibold text-[#6a7282] uppercase tracking-wide">Type</span>
              </div>
              <p className="text-[15px] font-bold text-[#101828]">{aiData.accidentType || 'Unknown'}</p>
            </div>

            {/* Severity */}
            <div className="bg-white/80 rounded-[8px] p-[12px] border border-[#e5e7eb]">
              <div className="flex items-center gap-[6px] mb-[6px]">
                <FontAwesomeIcon icon={faExclamationTriangle} className="text-[#ea580c] text-[11px]" />
                <span className="text-[10px] font-semibold text-[#6a7282] uppercase tracking-wide">Severity</span>
              </div>
              <div className="flex items-center gap-[6px]">
                <span className={`text-[18px] font-bold px-[8px] py-[2px] rounded-[6px] ${getSeverityColor(aiData.severity || 0)}`}>
                  {aiData.severity || 0}/5
                </span>
              </div>
            </div>

            {/* Confidence */}
            <div className="bg-white/80 rounded-[8px] p-[12px] border border-[#e5e7eb]">
              <div className="flex items-center gap-[6px] mb-[6px]">
                <FontAwesomeIcon icon={faBullseye} className="text-[#6366f1] text-[11px]" />
                <span className="text-[10px] font-semibold text-[#6a7282] uppercase tracking-wide">Confidence</span>
              </div>
              <div className="flex items-center gap-[6px]">
                <span className="text-[18px] font-bold text-[#101828]">
                  {((aiData.confidence || 0) * 100).toFixed(0)}%
                </span>
                <div className="flex-1 h-[6px] bg-[#e5e7eb] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] rounded-full transition-all"
                    style={{ width: `${((aiData.confidence || 0) * 100).toFixed(0)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Injury Risk */}
            {aiData.injuryRisk && (
              <div className="col-span-2 bg-white/80 rounded-[8px] p-[12px] border border-[#e5e7eb]">
                <div className="flex items-center gap-[8px] mb-[6px]">
                  <FontAwesomeIcon icon={faHeartPulse} className="text-[#dc2626] text-[12px]" />
                  <span className="text-[11px] font-semibold text-[#6a7282] uppercase tracking-wide">Injury Risk</span>
                </div>
                <div className="flex items-center gap-[8px]">
                  <span 
                    className="text-[15px] font-bold px-[12px] py-[4px] rounded-[6px] capitalize"
                    style={{ 
                      color: getInjuryRiskConfig(aiData.injuryRisk).color,
                      backgroundColor: getInjuryRiskConfig(aiData.injuryRisk).bg
                    }}
                  >
                    {getInjuryRiskConfig(aiData.injuryRisk).label} Risk
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-[20px] border-2 border-dashed border-[#e5e7eb] rounded-[12px] bg-[#fafafa] text-[13px] text-[#6a7282] flex items-center justify-center">
          <FontAwesomeIcon icon={faRobot} className="mr-[8px] text-[#9ca3af]" />
          No AI analysis available
        </div>
      )}
    </div>
  );
}

export default AiAnalysisCard;
