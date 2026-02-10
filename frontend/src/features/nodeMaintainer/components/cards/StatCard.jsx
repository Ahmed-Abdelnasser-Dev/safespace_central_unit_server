/**
 * Reusable Stat Card Component
 * 
 * Displays a statistic with value, label, and optional trend
 * Lightweight version of MetricCard without progress bar
 * 
 * @component
 * @param {string} label - Stat label
 * @param {string|number} value - Stat value
 * @param {string} unit - Unit of measurement
 * @param {string} icon - FontAwesome icon name
 * @param {string} color - Icon color (hex)
 * @param {string} trend - Trend indicator (+5%, -3%, etc.)
 * @param {string} trendColor - Trend text color
 */

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

function StatCard({ label, value, unit, icon, color = '#247cff', trend = null, trendColor = null }) {
  return (
    <div className="p-[12px] bg-white rounded-[8px] border border-[#e5e7eb] hover:shadow-sm transition-shadow duration-200">
      {/* Label and Icon */}
      <div className="flex items-center justify-between mb-[8px]">
        <span 
          className="text-[#6a7282] font-normal"
          style={{ 
            fontSize: 'clamp(11px, 1.2vw, 12px)',
            fontFamily: 'Arimo, sans-serif'
          }}
        >
          {label}
        </span>
        {icon && (
          <FontAwesomeIcon 
            icon={icon} 
            style={{ 
              color,
              width: 'clamp(14px, 1.8vw, 16px)',
              height: 'clamp(14px, 1.8vw, 16px)'
            }}
          />
        )}
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-[4px]">
        <span 
          className="font-bold"
          style={{ 
            fontSize: 'clamp(16px, 2.2vw, 20px)',
            color,
            fontFamily: 'Arimo, sans-serif'
          }}
        >
          {value}
        </span>
        <span 
          className="text-[#6a7282]"
          style={{ 
            fontSize: 'clamp(10px, 1vw, 11px)',
            fontFamily: 'Arimo, sans-serif'
          }}
        >
          {unit}
        </span>
        {trend && (
          <span 
            className="ml-auto font-bold"
            style={{ 
              fontSize: 'clamp(10px, 1vw, 11px)',
              color: trendColor || '#22c55e',
              fontFamily: 'Arimo, sans-serif'
            }}
          >
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}

export default StatCard;
