/**
 * Reusable Historical Charts Grid Component
 * 
 * Displays CPU and Temperature history charts in a responsive grid
 * Shows 1 column on small screens, 2 columns on larger screens
 * 
 * @component
 * @param {Array} cpuData - CPU history data array (5 values)
 * @param {Array} tempData - Temperature history data array (5 values)
 */

import LineChart from '../charts/LineChart';

function HistoricalChartsGrid({ cpuData, tempData }) {
  const timeLabels = ['-40s', '-30s', '-20s', '-10s', 'now'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-[16px] lg:gap-[20px]">
      <LineChart
        data={cpuData}
        color="#3b82f6"
        title="CPU History"
        timeLabels={timeLabels}
      />
      
      <LineChart
        data={tempData}
        color="#f97316"
        title="Temperature History"
        timeLabels={timeLabels}
      />
    </div>
  );
}

export default HistoricalChartsGrid;
