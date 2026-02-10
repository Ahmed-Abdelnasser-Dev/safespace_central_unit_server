/**
 * Reusable Action Button Group Component
 * 
 * Displays multiple action buttons (Save, Cancel, Reset, etc.)
 * with consistent styling and spacing
 * 
 * @component
 * @param {Array} buttons - Array of button objects
 *   - label: string, button text
 *   - onClick: function, click handler
 *   - icon?: string, FontAwesome icon name
 *   - variant?: 'primary' | 'secondary' | 'danger' (default: 'secondary')
 *   - disabled?: boolean
 * @param {string} className - Additional CSS classes
 */

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import PrimaryButton from '../forms/PrimaryButton';

function ActionButtonGroup({ buttons, className = '' }) {
  const getVariantStyles = (variant) => {
    switch (variant) {
      case 'primary':
        return 'bg-[#247cff] text-white hover:bg-[#1a5dcc]';
      case 'danger':
        return 'bg-[#d63e4d] text-white hover:bg-[#b82c3a]';
      case 'secondary':
      default:
        return 'bg-[#f7f8f9] text-[#101828] border border-[#e5e7eb] hover:bg-[#e8e9ea]';
    }
  };

  return (
    <div className={`flex gap-[10px] sm:gap-[12px] md:gap-[14px] flex-wrap justify-end ${className}`}>
      {buttons.map((button, index) => (
        <button
          key={index}
          onClick={button.onClick}
          disabled={button.disabled}
          className={`px-[12px] sm:px-[14px] md:px-[16px] py-[8px] sm:py-[9px] md:py-[10px] rounded-[6px] font-medium transition-all duration-200 flex items-center gap-[6px] ${
            button.disabled
              ? 'bg-[#e5e7eb] text-[#99a1af] cursor-not-allowed'
              : getVariantStyles(button.variant)
          }`}
          style={{ 
            fontSize: 'clamp(11px, 1.2vw, 12px)',
            fontFamily: 'Arimo, sans-serif'
          }}
        >
          {button.icon && (
            <FontAwesomeIcon 
              icon={button.icon} 
              style={{
                width: 'clamp(12px, 1.3vw, 14px)',
                height: 'clamp(12px, 1.3vw, 14px)'
              }}
            />
          )}
          {button.label}
        </button>
      ))}
    </div>
  );
}

export default ActionButtonGroup;
