import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import UsersTable from './UsersTable';

/**
 * Activity Logs Table
 * Displays system-wide activity logs using base Table component
 */
function ActivityLogsTable() {
  // Mock activity data - Security: Replace with authenticated API call
  const activityLogs = [
    {
      id: 1,
      user: 'John Anderson',
      userId: 'USR-001',
      action: 'User Login',
      status: 'login',
      timestamp: '2024-02-08 14:30:25',
      ip: '192.168.1.100',
      device: 'Chrome on Windows',
      details: 'Successful login from Chrome on Windows'
    },
    {
      id: 2,
      user: 'Sarah Mitchell',
      userId: 'USR-015',
      action: 'Created New Incident',
      status: 'success',
      timestamp: '2024-02-08 14:28:10',
      ip: '192.168.1.105',
      device: 'Chrome on Windows',
      details: 'Created incident #INC-5678'
    },
    {
      id: 3,
      user: 'Mike Johnson',
      userId: 'USR-023',
      action: 'Updated User Role',
      status: 'success',
      timestamp: '2024-02-08 14:15:42',
      ip: '192.168.1.110',
      device: 'Firefox on MacOS',
      details: 'Changed role for USR-042 from Observer to Dispatcher'
    },
    {
      id: 4,
      user: 'Anonymous',
      userId: null,
      action: 'Failed Login Attempt',
      status: 'failed',
      timestamp: '2024-02-08 14:10:33',
      ip: '203.45.67.89',
      device: 'Chrome on Windows',
      details: 'Invalid password for user USR-007'
    },
    {
      id: 5,
      user: 'Emma Davis',
      userId: 'USR-008',
      action: 'Downloaded Report',
      status: 'normal',
      timestamp: '2024-02-08 13:55:18',
      ip: '192.168.1.115',
      device: 'Safari on MacOS',
      details: 'Downloaded monthly safety report PDF'
    },
    {
      id: 6,
      user: 'David Chen',
      userId: 'USR-012',
      action: 'Modified System Settings',
      status: 'success',
      timestamp: '2024-02-08 13:42:05',
      ip: '192.168.1.120',
      device: 'Chrome on Windows',
      details: 'Updated notification threshold settings'
    },
    {
      id: 7,
      user: 'Anonymous',
      userId: null,
      action: 'Unauthorized Access Attempt',
      status: 'failed',
      timestamp: '2024-02-08 13:20:12',
      ip: '178.23.45.67',
      device: 'Unknown',
      details: 'Blocked attempt to access admin panel'
    },
  ];

  // Define table columns - NO STATUS COLUMN
  const columns = [
    {
      key: 'timestamp',
      label: 'Timestamp',
      sortable: true
    },
    {
      key: 'user',
      label: 'User',
      sortable: true
    },
    {
      key: 'action',
      label: 'Action',
      sortable: true
    },
    {
      key: 'details',
      label: 'Details',
      sortable: false
    },
    {
      key: 'ip',
      label: 'IP Address',
      sortable: false
    }
  ];

  // Helper function to get action color based on status
  const getActionColor = (status) => {
    const colors = {
      'success': 'text-safe-green bg-safe-green/10',
      'failed': 'text-safe-danger bg-safe-danger/10',
      'login': 'text-safe-blue-btn bg-safe-blue-btn/10',
      'normal': 'text-safe-text-gray bg-safe-text-gray/10'
    };
    return colors[status] || 'text-safe-text-dark';
  };

  // Custom cell renderer
  const renderCell = (log, column) => {
    switch (column.key) {
      case 'timestamp':
        return (
          <span className="flex items-center gap-2 text-sm">{log.timestamp}</span>
        );

      case 'user':
        return (
          <div>
            <p className="text-sm font-medium text-safe-text-dark">{log.user}</p>
            {log.userId && (
              <p className="text-xs text-safe-text-gray">{log.userId}</p>
            )}
          </div>
        );

      case 'action':
        return (
          <span className={`text-xs font-semibold items-center px-2.5 py-1 rounded-md   ${getActionColor(log.status)}`}>
            {log.action}
          </span>
        );

      case 'details':
        return <span className="text-sm">{log.details}</span>;

      case 'ip':
        return (
          <code className="text-xs font-mono">
            {log.ip}
          </code>
        );

      default:
        return log[column.key];
    }
  };

  return (
    <UsersTable
      columns={columns}
      data={activityLogs}
      renderCell={renderCell}
    />
  );
}

export default ActivityLogsTable;