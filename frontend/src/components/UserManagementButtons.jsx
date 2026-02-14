import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { userAPI } from '../services/api';
import CreateUserModal from './CreateUserModal';

/**
 * Search Bar and filters for users management
 */

function UserManagementButtons({ onSearch, onRoleFilter, onStatusFilter, currentFilters = {} }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showRoleDropdown, setShowRoleDropdown] = useState(false);
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);

    const roles = [
        { value: 'all', label: 'All Roles' },
        { value: 'admin', label: 'Admin' },
        { value: 'emergency_dispatcher', label: 'Emergency Dispatcher' },
        { value: 'road_observer', label: 'Road Observer' },
        { value: 'node_maintenance_crew', label: 'Node Maintenance Crew' }
    ];
    const statuses = [
        { value: 'all', label: 'All Status' },
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' }
    ];

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        
        // Debounce search - call parent after user stops typing
        if (window.searchTimeout) clearTimeout(window.searchTimeout);
        window.searchTimeout = setTimeout(() => {
            onSearch(value);
        }, 500);
    };

    const handleCreateUser = async (data) => {
        try {
            await userAPI.createUser(data);
            alert('User created successfully');
            setIsModalOpen(false);
            // Refresh the users list by triggering a search with empty string
            onSearch('');
        } catch (error) {
            console.error('Failed to create user:', error);
            alert(error.response?.data?.message || 'Failed to create user');
        }
    };

    const getRoleLabel = () => {
        if (!currentFilters.role || currentFilters.role === 'all') return 'All Roles';
        const role = roles.find(r => r.value === currentFilters.role);
        return role ? role.label : 'All Roles';
    };

    const getStatusLabel = () => {
        const status = statuses.find(s => s.value === currentFilters.status);
        return status ? status.label : 'All Status';
    };

    return (
        <div>
          {/* navigation buttons */}
          <div>
              {/* Buttons */}
              <div className="mt-6 flex gap-2">
                <button className="px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2.5 text-white shadow-sm bg-safe-blue">
                    User Management
                </button>
                <Link 
                    to="/activity-logs"
                    className="px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2.5 text-safe-text-gray shadow-sm bg-safe-white hover:bg-safe-bg transition-colors"
                >
                    Activity Logs
                </Link>
              </div>
          </div>
          
          <div className='flex pt-6 '>
            <div className="flex items-center gap-4">
                {/* Search Bar */}
                <div className="relative">
                    <FontAwesomeIcon 
                        icon="magnifying-glass" 
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-safe-text-gray text-sm"
                    />
                    <input
                        type="text"
                        placeholder="Search by name, email or ID..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="pl-11 pr-4 py-2.5 w-[340px] rounded-lg border border-safe-border text-sm text-safe-text-dark placeholder:text-safe-text-gray focus:outline-none focus:ring-2 focus:ring-safe-blue-btn/20 focus:border-safe-blue-btn"
                    />
                </div>

                {/* Role Dropdown */}
                <div className="relative">
                    <button 
                        onClick={() => {
                            setShowRoleDropdown(!showRoleDropdown);
                            setShowStatusDropdown(false);
                        }}
                        className="text-sm pl-3 py-2.5 w-[150px] rounded-lg border bg-safe-white border-safe-border flex items-center justify-between text-safe-text-gray hover:bg-safe-bg transition-colors"
                    >
                        {getRoleLabel()} 
                        <FontAwesomeIcon icon="angle-down" className="text-sm" />
                    </button>
                    {showRoleDropdown && (
                        <div className="absolute top-full mt-1 w-[200px] bg-white border border-safe-border rounded-lg shadow-lg z-10">
                            {roles.map((role) => (
                                <button
                                    key={role.value}
                                    onClick={() => {
                                        onRoleFilter(role.value);
                                        setShowRoleDropdown(false);
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm text-safe-text-gray hover:bg-safe-bg transition-colors first:rounded-t-lg last:rounded-b-lg"
                                >
                                    {role.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Status Dropdown */}
                <div className="relative">
                    <button 
                        onClick={() => {
                            setShowStatusDropdown(!showStatusDropdown);
                            setShowRoleDropdown(false);
                        }}
                        className="text-sm pl-3 py-2.5 w-[150px] rounded-lg border bg-safe-white border-safe-border flex items-center justify-between text-safe-text-gray hover:bg-safe-bg transition-colors"
                    >
                        {getStatusLabel()} 
                        <FontAwesomeIcon icon="angle-down" className="text-sm" />
                    </button>
                    {showStatusDropdown && (
                        <div className="absolute top-full mt-1 w-[150px] bg-white border border-safe-border rounded-lg shadow-lg z-10">
                            {statuses.map((status) => (
                                <button
                                    key={status.value}
                                    onClick={() => {
                                        onStatusFilter(status.value);
                                        setShowStatusDropdown(false);
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm text-safe-text-gray hover:bg-safe-bg transition-colors first:rounded-t-lg last:rounded-b-lg"
                                >
                                    {status.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            
            <div className='ml-auto'>
                {/* Create new Account */}
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="relative px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2.5 text-white shadow-sm bg-safe-blue hover:bg-safe-blue/90 transition-colors"
                >
                    <FontAwesomeIcon icon="user-plus" />
                    Create New Account
                </button>
            </div>
          </div>

            <CreateUserModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleCreateUser}
            />
        </div>
    );
}

export default UserManagementButtons;