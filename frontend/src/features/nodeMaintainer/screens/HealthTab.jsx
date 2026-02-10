/**
 * Health Tab Screen
 * 
 * Displays node health metrics and historical charts
 * 
 * @component
 */

import { useSelector } from 'react-redux';
import { selectSelectedNode } from '../nodesSlice';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrochip, faTemperatureHalf, faWifi, faDatabase } from '@fortawesome/free-solid-svg-icons';
import MetricCard from '../components/cards/MetricCard';
import SectionHeader from '../components/layout/SectionHeader';
import { fontFamily } from '../styles/typography';

function HealthTab() {
  const node = useSelector(selectSelectedNode);

  if (!node) return <div className="p-[16px] text-[#6a7282]" style={{ fontFamily: 'Arimo, sans-serif' }}>Select a node</div>;

  return (
    <div className="p-[20px] space-y-[20px]">
      {/* Health Metrics Cards with Progress Bars */}
      <div className="grid grid-cols-2 gap-[14px]">
        <MetricCard
          label="CPU"
          value={node.health.cpu}
          unit="%"
          icon={faMicrochip}
          color="#3b82f6"
        />
        <MetricCard
          label="Temperature"
          value={node.health.temperature}
          unit="°C"
          icon={faTemperatureHalf}
          color="#f97316"
        />
        <MetricCard
          label="Network"
          value={node.health.network}
          unit="%"
          icon={faWifi}
          color="#22c55e"
        />
        <MetricCard
          label="Storage"
          value={node.health.storage}
          unit="%"
          icon={faDatabase}
          color="#a78bfa"
        />
      </div>

      {/* History Section - Line Charts */}
      <SectionHeader title="Historical Data" showDivider={true} />

      <div className="space-y-[20px]">
        <div className="rounded-[8px] border border-[#e5e7eb] bg-[#f7f8f9] px-[12px] py-[14px] text-[#6a7282]">
          <span style={{ fontSize: 'clamp(12px, 1.2vw, 14px)', fontFamily }}>
            No historical data yet
          </span>
        </div>
      </div>

      
    </div>
  );
}

export default HealthTab;
