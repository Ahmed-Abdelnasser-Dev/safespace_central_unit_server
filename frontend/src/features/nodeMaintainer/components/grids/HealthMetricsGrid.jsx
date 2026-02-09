/**
 * Reusable Health Metrics Grid Component
 * 
 * Displays a responsive grid of health metric cards
 * Shows CPU, Temperature, Network, and Storage in 2x2 grid (responsive columns)
 * 
 * @component
 * @param {Object} health - Health data object with cpu, temperature, network, storage
 */

import MetricCard from '../cards/MetricCard';
import { 
  faMicrochip, 
  faTemperatureHalf, 
  faWifi, 
  faDatabase 
} from '@fortawesome/free-solid-svg-icons';

function HealthMetricsGrid({ health }) {
  const metrics = [
    {
      label: 'CPU',
      value: health.cpu,
      unit: '%',
      icon: faMicrochip,
      color: '#3b82f6'
    },
    {
      label: 'Temperature',
      value: health.temperature,
      unit: '°C',
      icon: faTemperatureHalf,
      color: '#f97316'
    },
    {
      label: 'Network',
      value: health.network,
      unit: '%',
      icon: faWifi,
      color: '#22c55e'
    },
    {
      label: 'Storage',
      value: health.storage,
      unit: '%',
      icon: faDatabase,
      color: '#a78bfa'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-[12px] sm:gap-[13px] md:gap-[14px] lg:gap-[16px]">
      {metrics.map((metric, index) => (
        <MetricCard
          key={index}
          label={metric.label}
          value={metric.value}
          unit={metric.unit}
          icon={metric.icon}
          color={metric.color}
        />
      ))}
    </div>
  );
}

export default HealthMetricsGrid;
