/**
 * Node Maintainer Sidebar - Pixel Perfect Figma Design
 * 
 * Exact specifications from Figma design
 * - Background: #101828
 * - Border: #364153
 * - Active Button: #247cff, 49.548px × 49.548px, rounded-[14.452px]
 * - Inactive Button: #141d2d, 49.548px × 49.548px, rounded-[14.452px]
 * 
 * @component
 */

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

// Navigation Data
const navItems = [
  { id: 'node-maintainer', icon: 'layer-group', active: true },
  { id: 'dashboard', icon: 'gauge-high', active: false },
  { id: 'map', icon: 'map', active: false },
  { id: 'alerts', icon: 'triangle-exclamation', active: false },
  { id: 'settings', icon: 'gear', active: false },
];

export default function NodeMaintainerSidebar() {
  return (
    <div 
      className="bg-[#101828] border-r border-[#364153] flex flex-col items-center py-[30px] px-[10px] h-full shrink-0 shadow-sm"
      style={{ width: '72px' }}
    >
      {/* Logo */}
      <div className="mb-[67px]">
        <div 
          className="bg-[#247cff] rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow duration-200"
          style={{ width: '49.548px', height: '49.462px' }}
        >
          <svg 
            width="30" 
            height="30" 
            viewBox="0 0 30 30" 
            fill="none"
            className="text-white"
          >
            <path
              d="M15 3L3 9v6c0 7.5 5.25 14.5 12 16.5 6.75-2 12-9 12-16.5V9L15 3z"
              fill="currentColor"
            />
          </svg>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex flex-col gap-[20px] mb-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`rounded-[14.452px] w-[49.548px] h-[49.548px] flex items-center justify-center transition-all duration-200 ${
              item.active 
                ? 'bg-[#247cff] shadow-md' 
                : 'bg-[#141d2d] hover:bg-[#1a2635] hover:shadow-sm'
            }`}
          >
            <FontAwesomeIcon 
              icon={item.icon} 
              className="text-white" 
              style={{ width: '16.516px', height: '16.516px' }}
            />
          </button>
        ))}
      </div>

      {/* Account Button */}
      <button className="bg-[#141d2d] hover:bg-[#1a2635] rounded-[14.452px] w-[49.548px] h-[49.548px] flex items-center justify-center transition-all duration-200 mt-auto hover:shadow-sm">
        <FontAwesomeIcon 
          icon="user" 
          className="text-white" 
          style={{ width: '16.516px', height: '16.516px' }}
        />
      </button>
    </div>
  );
}
