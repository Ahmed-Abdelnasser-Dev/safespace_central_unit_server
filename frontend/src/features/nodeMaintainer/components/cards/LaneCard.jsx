/**
 * Reusable Lane Card Component
 * 
 * Displays individual lane with status icon, name, and type
 * Used in RoadConfigTab
 * 
 * @component
 * @param {Object} lane - Lane data object with id, name, type, status
 * @param {Function} onStatusChange - Callback when status changes
 * @param {Function} onDelete - Callback when delete is clicked
 */

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCircleCheck, 
  faCircleXmark, 
  faArrowRight, 
  faArrowLeft 
} from '@fortawesome/free-solid-svg-icons';

function LaneCard({ lane, onStatusChange, onDelete }) {
  const statusConfig = {
    open: { icon: faCircleCheck, color: '#22c55e', bg: '#e8f5e9', label: 'Open' },
    blocked: { icon: faCircleXmark, color: '#d63e4d', bg: '#fee2e2', label: 'Blocked' },
    right: { icon: faArrowRight, color: '#247cff', bg: '#e3f2fd', label: 'Right' },
    left: { icon: faArrowLeft, color: '#247cff', bg: '#e3f2fd', label: 'Left' },
  };

  const status = statusConfig[lane.status] || statusConfig.open;

  return (
    <div className="p-[12px] border border-[#e5e7eb] rounded-[8px] bg-[#f7f8f9] hover:shadow-sm transition-shadow duration-200">
      {/* Lane Header */}
      <div className="flex items-center justify-between mb-[8px]">
        <div className="flex items-center gap-[8px] flex-1 min-w-0">
          <span 
            className="font-bold text-[#101828] truncate"
            style={{ 
              fontSize: 'clamp(12px, 1.3vw, 14px)',
              fontFamily: 'Arimo, sans-serif'
            }}
          >
            {lane.name}
          </span>
        </div>
        <span 
          className="text-xs font-medium px-[6px] py-[2px] rounded-[3px] flex-shrink-0 ml-[8px]"
          style={{
            fontSize: 'clamp(10px, 1vw, 11px)',
            backgroundColor: status.bg,
            color: status.color,
            fontFamily: 'Arimo, sans-serif'
          }}
        >
          {status.label}
        </span>
      </div>

      {/* Lane Type */}
      <p 
        className="text-[#6a7282] mb-[10px] truncate"
        style={{ 
          fontSize: 'clamp(11px, 1.2vw, 12px)',
          fontFamily: 'Arimo, sans-serif'
        }}
      >
        Type: {lane.type || 'Standard'}
      </p>

      {/* Status Options */}
      <div className="flex flex-wrap gap-[6px]">
        {Object.entries(statusConfig).map(([statusKey, statusInfo]) => (
          <button
            key={statusKey}
            onClick={() => onStatusChange(lane.id, statusKey)}
            className={`flex items-center gap-[4px] px-[8px] py-[4px] rounded-[4px] transition-all duration-200 ${
              lane.status === statusKey
                ? 'bg-white border-2 border-[#247cff]'
                : 'bg-[#eff0f1] border border-[#d0d5dd] hover:bg-[#e8e9ea]'
            }`}
            style={{ fontSize: 'clamp(9px, 1vw, 10px)', fontFamily: 'Arimo, sans-serif' }}
          >
            <FontAwesomeIcon 
              icon={statusInfo.icon} 
              style={{ 
                width: 'clamp(10px, 1.2vw, 12px)',
                height: 'clamp(10px, 1.2vw, 12px)',
                color: statusInfo.color
              }}
            />
            <span className={lane.status === statusKey ? 'font-bold text-[#247cff]' : 'text-[#6a7282]'}>
              {statusInfo.label}
            </span>
          </button>
        ))}
      </div>

      {/* Delete Button */}
      <button
        onClick={() => onDelete(lane.id)}
        className="mt-[8px] w-full px-[10px] py-[6px] bg-[#fee2e2] text-[#d63e4d] rounded-[4px] font-medium transition-all duration-200 hover:bg-[#fccfcf]"
        style={{ fontSize: 'clamp(10px, 1vw, 11px)', fontFamily: 'Arimo, sans-serif' }}
      >
        <FontAwesomeIcon icon="trash" className="mr-[4px]" />
        Delete
      </button>
    </div>
  );
}

export default LaneCard;
