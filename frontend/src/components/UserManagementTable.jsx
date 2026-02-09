import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

/**
 * Users Table Component
 * Displays all users with actions
 */
function UserManagementTable({ onEdit, onDelete, onResetPassword, onViewDetails }) {
  const [selectedUsers, setSelectedUsers] = useState([]);

  // Mock users data - Security: Replace with authenticated API call
  const users = [
    {
      id: 'USR-001',
      name: 'John Anderson',
      email: 'john.anderson@agency.safeg.gov',
      role: 'Road Observer',
      status: 'active',
      lastActive: '2 hours ago',
      joinDate: '2024-01-15',
      avatar: 'JA'
    },
    {
      id: 'USR-002',
      name: 'Sarah Mitchell',
      email: 'sarah.mitchell@agency.safeg.gov',
      role: 'Emergency Dispatcher',
      status: 'active',
      lastActive: '5 hours ago',
      joinDate: '2024-01-20',
      avatar: 'SM'
    },
    {
      id: 'USR-003',
      name: 'Mike Johnson',
      email: 'mike.johnson@agency.safeg.gov',
      role: 'Data Analyst',
      status: 'active',
      lastActive: '1 day ago',
      joinDate: '2024-02-01',
      avatar: 'MJ'
    },
    {
      id: 'USR-004',
      name: 'Emily Davis',
      email: 'emily.davis@agency.safeg.gov',
      role: 'Road Observer',
      status: 'inactive',
      lastActive: '3 days ago',
      joinDate: '2024-01-10',
      avatar: 'ED'
    },
    {
      id: 'USR-005',
      name: 'David Chen',
      email: 'david.chen@agency.safeg.gov',
      role: 'System Administrator',
      status: 'active',
      lastActive: '30 minutes ago',
      joinDate: '2023-12-15',
      avatar: 'DC'
    }
  ];


  return (
    <div className="mt-6 bg-white rounded-xl border border-safe-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full table-fixed justify-content-between">
          <thead className="bg-safe-bg border-b border-safe-border">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-safe-text-dark tracking-wider">
                Name
                <FontAwesomeIcon icon="sort" className="pl-2  text-xs text-safe-text-gray/50" />
              </th>
              <th className="px-4 py-4 text-left text-xs font-bold text-safe-text-dark  tracking-wider">
                Role
                <FontAwesomeIcon icon="sort" className="pl-2  text-xs text-safe-text-gray/50" />
              </th>
              <th className="px-4 py-4 text-left text-xs font-bold text-safe-text-dark tracking-wider">
                Status
                <FontAwesomeIcon icon="sort" className="pl-2  text-xs text-safe-text-gray/50" />
              </th>
              <th className="px-4 py-4 text-left text-xs font-bold text-safe-text-dark  tracking-wider">
                Last Active
                <FontAwesomeIcon icon="sort" className="pl-2  text-xs text-safe-text-gray/50" />
              </th>
              <th className="px-4 py-4 text-left text-xs font-bold text-safe-text-dark  tracking-wider">
                Created
                <FontAwesomeIcon icon="sort" className="pl-2  text-xs text-safe-text-gray/50" />
              </th>
              <th className="px-4 py-4 text-left ml-auto text-xs font-bold text-safe-text-dark tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-safe-border">
            {users.map((user) => (
                <tr 
                    key={user.id} 
                    className="hover:bg-safe-bg/30 transition-colors"
                    onClick={() => onViewDetails && onViewDetails(user)}
                >

                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-safe-blue-btn text-white flex items-center justify-center font-semibold text-sm">
                      {user.avatar}
                    </div>
                    <div>
                      <p className="font-medium text-safe-text-dark">{user.name}</p>
                      <p className="text-xs text-safe-text-gray">{user.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon="shield" className="text-sm text-safe-blue/80" />
                    <span className="text-sm text-safe-text-dark">{user.role}</span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${
                    user.status === 'active' 
                      ? 'bg-safe-green/10 text-safe-green' 
                      : 'bg-safe-text-gray/10 text-safe-text-gray'
                  }`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div>
                    <p className="text-sm text-safe-text-dark">{user.lastActive}</p>
                    <p className="text-xs text-safe-text-gray flex items-center gap-1 mt-0.5">
                      <FontAwesomeIcon icon="calendar-check" className="regular text-xs" />
                      Joined {user.joinDate}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm text-safe-text-dark">{user.joinDate}</span>
                </td>
                <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center ml-auto gap-2">
                    <button
                      onClick={() => onEdit && onEdit(user)}
                      className="px-3 py-1.5 text-xs font-medium text-safe-text-dark bg-safe-bg hover:bg-safe-bg rounded-lg transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onEdit && onDeactivate(user)}
                      className="px-3 py-1.5 text-xs font-medium text-safe-text-dark bg-safe-bg hover:bg-safe-bg rounded-lg transition-colors"
                    >
                      Deactivate
                    </button>
                    <button
                      onClick={() => onResetPassword && onResetPassword(user)}
                      className="px-3 py-1.5 text-xs font-medium text-safe-text-dark bg-safe-bg hover:bg-safe-bg rounded-lg transition-colors"
                    >
                      Reset Password 
                    </button>
                    <button
                      onClick={() => onDelete && onDelete(user)}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-safe-danger hover:bg-safe-danger/90 rounded-lg transition-colors"
                    >
                      Delete Account
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default UserManagementTable;