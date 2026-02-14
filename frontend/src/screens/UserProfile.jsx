import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logoutUser } from '../features/auth/authSlice';
import Sidebar from "../components/Sidebar";
import UserManagementHeader from "../components/UserManagementHeader";
import UserProfileBody from "../components/UserProfileBody"

/**
 * Profile Screen
 * Wraps Sidebar + Header + Profile component
 */

function UserProfile() {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Security: Clear all sensitive state and tokens on logout
    const handleLogout = async () => {
        try {
            await dispatch(logoutUser()).unwrap();
            navigate('/sign-in', { replace: true });
        } catch (error) {
            console.error('Logout error:', error);
            // Even if logout API fails, redirect to sign-in
            navigate('/sign-in', { replace: true });
        }
    };
    
    return (
      <div className="flex h-screen bg-safe-bg overflow-hidden">
          {/* Sidebar on the left */}
          <Sidebar activeIcon="chart-line" />
        
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header at the top */}
            <UserManagementHeader
              title="Profile"
              description="Manage and Update your Profile Information"
            />

            {/* Body */}
            <UserProfileBody onLogout={handleLogout} />

          </div>
      </div>
    );
}

export default UserProfile;
