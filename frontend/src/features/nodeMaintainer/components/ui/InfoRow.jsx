/**
 * Reusable Info Row Component
 * 
 * Displays a key-value pair in a horizontally aligned row
 * Used for displaying Node Information, Status, etc.
 * 
 * @component
 */

import { typography, fontFamily } from '../../styles/typography';

function InfoRow({ 
  label, 
  value, 
  valueStyle = {},
  className = '' 
}) {
  return (
    <div 
      className={`flex justify-between items-center gap-[8px] ${className}`}
      style={{
        paddingBottom: '8px',
      }}
    >
      <span
        className="text-[#6a7282] font-normal"
        style={{
          fontSize: 'clamp(12px, 1.2vw, 13px)',
          fontFamily,
        }}
      >
        {label}
      </span>
      <span
        className="font-bold text-[#101828] text-right"
        style={{
          fontSize: 'clamp(13px, 1.3vw, 16px)',
          fontFamily,
          ...valueStyle
        }}
      >
        {value}
      </span>
    </div>
  );
}

export default InfoRow;
