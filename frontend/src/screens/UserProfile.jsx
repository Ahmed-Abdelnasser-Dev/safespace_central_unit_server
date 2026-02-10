import { useNavigate } from 'react-router-dom';
import Sidebar from "../components/Sidebar";
import UserManagementHeader from "../components/UserManagementHeader";
import UserProfileBody from "../components/UserProfileBody"

/**
 * Profile Screen
 * Wraps Sidebar + Header + Profile component
 */

function UserProfile() {

    const navigate = useNavigate();

    // Security: Clear all sensitive state and tokens on logout
    const handleLogout = () => {
        // TODO: Call logout API endpoint, clear auth tokens
        // Example: await api.logout();
        // Clear in-memory auth state, do NOT use localStorage for tokens
        navigate('/signin');
    };
    
    return (
      <div className="flex h-screen bg-safe-bg overflow-hidden">
          {/* Sidebar on the left */}
          <Sidebar activeIcon="chart-line" />
        
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header at the top */}
            <UserManagementHeader
              title="Profile"
              description="Manage and Update you Profile Information"
            />

            {/* Body */}
            <UserProfileBody onLogout={handleLogout} />

          </div>
      </div>
    );
}

export default UserProfile;
