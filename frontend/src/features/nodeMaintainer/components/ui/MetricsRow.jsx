/**
 * Reusable Metrics Row Component
 * 
 * Displays CPU, Temperature, and Network metrics in a single row
 * Used in NodeCard health display
 * 
 * @component
 * @param {number} cpu - CPU percentage
 * @param {number} temperature - Temperature in Celsius
 * @param {number} network - Network percentage
 * @param {string} className - Additional CSS classes
 */

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

function MetricsRow({ cpu, temperature, network, className = '' }) {
  return (
    <div className={`flex items-center gap-[14px] flex-wrap ${className}`}>
      {/* CPU */}
      <div className="flex items-center gap-[4px]">
        <FontAwesomeIcon 
          icon="microchip" 
          className="text-[#6a7282] flex-shrink-0" 
          style={{ 
            width: 'clamp(9px, 1.2vw, 11px)',
            height: 'clamp(9px, 1.2vw, 11px)'
          }}
        />
        <span 
          className="text-[#6a7282] whitespace-nowrap"
          style={{ 
            fontSize: 'clamp(10px, 1.1vw, 12px)',
            lineHeight: '12.428px',
            fontFamily: 'Arimo, sans-serif'
          }}
        >
          {cpu}%
        </span>
      </div>

      {/* Temperature */}
      <div className="flex items-center gap-[4px]">
        <FontAwesomeIcon 
          icon="temperature-half" 
          className="text-[#6a7282] flex-shrink-0" 
          style={{ 
            width: 'clamp(9px, 1.2vw, 11px)',
            height: 'clamp(9px, 1.2vw, 11px)'
          }}
        />
        <span 
          className="text-[#6a7282] whitespace-nowrap"
          style={{ 
            fontSize: 'clamp(10px, 1.1vw, 12px)',
            lineHeight: '12.428px',
            fontFamily: 'Arimo, sans-serif'
          }}
        >
          {temperature}°C
        </span>
      </div>

      {/* Network */}
      <div className="flex items-center gap-[4px]">
        <FontAwesomeIcon 
          icon="wifi" 
          className="text-[#6a7282] flex-shrink-0" 
          style={{ 
            width: 'clamp(9px, 1.2vw, 11px)',
            height: 'clamp(9px, 1.2vw, 11px)'
          }}
        />
        <span 
          className="text-[#6a7282] whitespace-nowrap"
          style={{ 
            fontSize: 'clamp(10px, 1.1vw, 12px)',
            lineHeight: '12.428px',
            fontFamily: 'Arimo, sans-serif'
          }}
        >
          {network}%
        </span>
      </div>
    </div>
  );
}

export default MetricsRow;
