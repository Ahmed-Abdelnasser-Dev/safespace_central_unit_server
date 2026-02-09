/**
 * Reusable Node Info Section Component
 * 
 * Displays node information (install date, heartbeat, IP, coordinates)
 * as key-value pairs in rows
 * 
 * @component
 * @param {Object} node - Node data object
 */

import InfoRow from '../ui/InfoRow';
import SectionHeader from '../layout/SectionHeader';

function NodeInfoSection({ node }) {
  if (!node) return null;

  return (
    <>
      <SectionHeader title="Node Information" showDivider={true} />
      
      <div className="space-y-[0px]">
        <InfoRow 
          label="Install Date" 
          value={node.installDate ? new Date(node.installDate).toLocaleDateString() : 'N/A'}
        />
        <InfoRow 
          label="Heartbeat" 
          value={`${node.heartbeat || 0}ms`}
        />
        <InfoRow 
          label="IP Address" 
          value={node.ipAddress || 'N/A'}
        />
        <InfoRow 
          label="Latitude" 
          value={node.coordinates?.latitude?.toFixed(6) || 'N/A'}
        />
        <InfoRow 
          label="Longitude" 
          value={node.coordinates?.longitude?.toFixed(6) || 'N/A'}
        />
      </div>
    </>
  );
}

export default NodeInfoSection;
