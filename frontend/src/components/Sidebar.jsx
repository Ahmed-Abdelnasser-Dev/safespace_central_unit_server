import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useNavigate } from 'react-router-dom';

function Sidebar({ activeIcon = 'chart-line' }) {
  const navigate = useNavigate();

  const navItems = [
    { icon: 'chart-line', label: 'Dashboard' },
    { icon: 'video', label: 'Camera' },
    { icon: 'book', label: 'Reports' },
    { icon: 'paper-plane', label: 'Messages' },
    { icon: 'bell', label: 'Alerts' },
    { icon: 'gear', label: 'Settings' },
  ];

  const logoSrc = '/src/assets/icons/logo.svg';

  return (
    <aside className="w-[74px] bg-safe-sidebar flex flex-col items-center py-6 gap-6">
      {/* Logo */}
      <div className="w-12 h-12 b</aside>g-safe-blue-btn rounded-xl flex items-center justify-center mb-4">
        <img src={logoSrc} alt="Logo" className="w-16 h-16 object-contain" />
      </div>

      {/* Navigation Icons */}
      <nav className="flex flex-col items-center gap-4 flex-1">
        {navItems.map((item) => (
          <button
            key={item.icon}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
              activeIcon === item.icon
                ? 'bg-safe-blue-btn text-white'
                : 'text-gray-400 hover:bg-safe-gray hover:text-white'
            }`}
            title={item.label}
          >
            <FontAwesomeIcon icon={item.icon} className="text-lg" />
          </button>
        ))}
      </nav>

      {/* User Avatar at Bottom */}
      <button 
        onClick={() => navigate('/profile')}
        className="w-12 h-12 rounded-xl bg-safe-gray flex items-center justify-center text-gray-300 hover:bg-safe-gray-light transition-colors"
        title="Profile"
      >
        <FontAwesomeIcon icon="circle-user" className="text-2xl" />
      </button>
    </aside>
  );
}

export default Sidebar;
