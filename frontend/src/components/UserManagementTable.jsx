import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import UsersTable from './ui/UsersTable';
import EditUserModal from './EditUserModal';

/**
 * User Management Table
 * Displays all users with actions using base Table component
 */
function UserManagementTable({ onEdit, onDelete, onDeactivate, onResetPassword, onViewDetails }) {
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
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

  // Define table columns
  const columns = [
    {
      key: 'name',
      label: 'Name',
      sortable: true
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true
    },
    {
      key: 'lastActive',
      label: 'Last Active',
      sortable: true
    },
    {
      key: 'created',
      label: 'Created',
      sortable: true
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      stopPropagation: true,
      headerClass: 'text-right'
    }
  ];

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setSelectedUser(null);
    setIsModalOpen(false);
  };

  const handleModalSubmit = (updatedUser) => {
    console.log('Updated user:', updatedUser);
    handleModalClose();
  };

  // Custom cell renderer
  const renderCell = (user, column) => {
    switch (column.key) {
      case 'name':
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-safe-blue-btn text-white flex items-center justify-center font-semibold text-sm">
              {user.avatar}
            </div>
            <div>
              <p className="font-medium text-safe-text-dark">{user.name}</p>
              <p className="text-xs text-safe-text-gray">{user.id}</p>
            </div>
          </div>
        );

      case 'role':
        return (
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon="shield" className="text-sm text-safe-blue/80" />
            <span className="text-sm text-safe-text-dark">{user.role}</span>
          </div>
        );

      case 'status':
        return (
          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${
            user.status === 'active' 
              ? 'bg-safe-green/10 text-safe-green' 
              : 'bg-safe-text-gray/10 text-safe-text-gray'
          }`}>
            {user.status}
          </span>
        );

      case 'lastActive':
        return (
          <div>
            <p className="text-sm text-safe-text-dark">{user.lastActive}</p>
            <p className="text-xs text-safe-text-gray flex items-center gap-1 mt-0.5">
              <FontAwesomeIcon icon="calendar-check" className="text-xs" />
              Joined {user.joinDate}
            </p>
          </div>
        );

      case 'created':
        return <span className="text-sm text-safe-text-dark">{user.joinDate}</span>;

      case 'actions':
        return (
          <div className={`flex items-center gap-2 ${
          column.key === 'actions' ? 'justify-end' : ''}`}>
            <button
              onClick={() => handleEditClick(user)}
              className="px-3 py-1.5 text-xs font-medium text-safe-text-dark bg-safe-bg hover:bg-safe-border/50 rounded-lg transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => onDeactivate && onDeactivate(user)}
              className="px-3 py-1.5 text-xs font-medium text-safe-text-dark bg-safe-bg hover:bg-safe-border/50 rounded-lg transition-colors"
            >
              Deactivate
            </button>
            <button
              onClick={() => onResetPassword && onResetPassword(user)}
              className="px-3 py-1.5 text-xs font-medium text-safe-text-dark bg-safe-bg hover:bg-safe-border/50 rounded-lg transition-colors"
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
        );

      default:
        return user[column.key];
    }
  };

  return (
    <>
      <UsersTable
        columns={columns}
        data={users}
        onRowClick={onViewDetails}
        renderCell={renderCell}
      />
      <EditUserModal
        isOpen={isModalOpen}
        userData={selectedUser}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
      />  
    </>

  );
}

export default UserManagementTable;