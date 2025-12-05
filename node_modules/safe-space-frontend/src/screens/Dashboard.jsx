import LayoutContainer from '../components/LayoutContainer.jsx';
import GridSection from '../components/GridSection.jsx';
import DashboardCard from '../components/DashboardCard.jsx';
import StatBlock from '../components/StatBlock.jsx';
import ChartWrapper from '../components/ChartWrapper.jsx';
import '../icons.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link } from 'react-router-dom';

function Dashboard() {
  // Placeholder data
  const statsTop = [
    { label: 'Active Users', value: 1289, trend: 4.2, positive: true, icon: 'users' },
    { label: 'Incidents Today', value: 7, trend: 12.5, positive: false, icon: 'bell' },
    { label: 'System Health', value: 'Operational', trend: 0.0, positive: true, icon: 'gauge-high' },
    { label: 'Alerts (24h)', value: 23, trend: 5.6, positive: false, icon: 'bell' },
  ];

  const performance = [
    { label: 'API Latency (ms)', value: 124, trend: 3.1, positive: true },
    { label: 'Message Queue Lag', value: 'Normal', trend: 0.0, positive: true },
    { label: 'Uptime (days)', value: 12, trend: 1.2, positive: true },
    { label: 'Geo Events/min', value: 341, trend: 8.3, positive: true },
  ];

  return (
    <div className="min-h-screen bg-safe-dark text-white">
      <header className="bg-safe-gray border-b border-safe-gray-light/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-safe-blue rounded-lg flex items-center justify-center shadow-card">
              <FontAwesomeIcon icon="shield" className="text-xl" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Safe Space Dashboard</h1>
              <p className="text-[11px] text-gray-400">Central Monitoring Unit</p>
            </div>
          </div>
          <nav className="flex items-center gap-6 text-sm">
            <Link to="/" className="text-gray-300 hover:text-white transition-colors">Map Overview</Link>
            <Link to="/dashboard" className="text-safe-blue transition-colors">Dashboard</Link>
            <Link to="/system-test" className="text-gray-300 hover:text-white transition-colors">System Test</Link>
          </nav>
        </div>
      </header>
      <LayoutContainer>
      <div className="flex flex-col gap-10">
        {/* Header Section */}
        <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">Dashboard Overview</h2>
            <p className="text-xs text-gray-400">Real-time monitoring summary and key system indicators.</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-2 bg-safe-gray-light/50 px-3 py-2 rounded-lg border border-safe-gray-light">
              <FontAwesomeIcon icon="circle" className="text-safe-success text-[10px]" />
              Live
            </span>
            <button className="px-4 py-2 rounded-lg bg-safe-blue hover:bg-safe-blue-light text-white font-medium text-xs transition-colors">Refresh Data</button>
          </div>
        </section>

        {/* KPI Grid */}
        <GridSection>
          {statsTop.map((s, idx) => (
            <div key={idx} className="col-span-12 sm:col-span-6 lg:col-span-3">
              <DashboardCard title={s.label} icon={s.icon}>
                <div className="flex items-end justify-between">
                  <span className="text-2xl font-bold">{s.value}</span>
                  <div className={`text-[11px] flex items-center gap-1 ${s.positive ? 'text-safe-success' : 'text-safe-danger'}`}>
                    <FontAwesomeIcon icon={s.positive ? 'arrow-up' : 'arrow-down'} />
                    {s.trend}%
                  </div>
                </div>
              </DashboardCard>
            </div>
          ))}
        </GridSection>

        {/* Charts & Performance */}
        <GridSection>
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
            <DashboardCard title="User Activity" icon="chart-line">
              <ChartWrapper title="User Activity (24h)" />
            </DashboardCard>
            <DashboardCard title="Alert Frequency" icon="chart-line">
              <ChartWrapper title="Alerts per Hour" />
            </DashboardCard>
          </div>
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
            <DashboardCard title="Performance" icon="gauge-high">
              <div className="flex flex-col gap-4">
                {performance.map((p, i) => (
                  <StatBlock key={i} label={p.label} value={p.value} trend={p.trend} positive={p.positive} />
                ))}
              </div>
            </DashboardCard>
            <DashboardCard title="Recent Alerts" icon="bell">
              <ul className="space-y-2 text-[11px] text-gray-300">
                <li className="flex justify-between"><span>High vibration detected</span><span className="text-safe-danger">Critical</span></li>
                <li className="flex justify-between"><span>Geo-fence breach zone 3</span><span className="text-safe-accent">Warning</span></li>
                <li className="flex justify-between"><span>Camera feed restarted</span><span className="text-safe-info">Info</span></li>
              </ul>
            </DashboardCard>
          </div>
        </GridSection>
      </div>
    </LayoutContainer>
    <footer className="bg-safe-gray-light border-t border-safe-gray/60 mt-12">
      <div className="max-w-7xl mx-auto px-6 py-6 text-center text-gray-400 text-xs">
        Safe Space - AI-Powered Real-Time Accident Detection & Prevention
      </div>
    </footer>
    </div>
  );
}

export default Dashboard;
