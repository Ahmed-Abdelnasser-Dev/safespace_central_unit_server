/**
 * Reusable Tab Content Wrapper Component
 * 
 * Provides consistent padding and spacing for all tab content
 * Ensures uniform layout across all tabs
 * 
 * @component
 * @param {React.ReactNode} children - Tab content
 * @param {string} className - Additional CSS classes
 */

function TabContentWrapper({ children, className = '' }) {
  return (
    <div 
      className={`p-[12px] sm:p-[14px] md:p-[16px] lg:p-[18px] xl:p-[20px] space-y-[14px] sm:space-y-[16px] md:space-y-[18px] lg:space-y-[20px] overflow-y-auto flex-1 ${className}`}
    >
      {children}
    </div>
  );
}

export default TabContentWrapper;
