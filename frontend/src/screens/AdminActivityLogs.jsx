import Sidebar from "../components/Sidebar";
import UserManagementHeader from "../components/UserManagementHeader";
import UserManagementCards from "../components/UserManagementCards";
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';



function AdminActivityLogs() {

    return (
      <div className="flex h-screen bg-safe-bg overflow-hidden">
        {/* Sidebar on the left */}
        <Sidebar activeIcon="chart-line" />
        
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header at the top */}
            <UserManagementHeader
                title="System Administration"
                description="Manage users, Roles and System Settings"
            ></UserManagementHeader>

              {/* Cards */}
              <div className="flex-shrink-0 mt-6 mx-7" >
                <UserManagementCards />
                
                {/* Buttons */}
                <div className="flex mt-6">
                  <div className="flex gap-2">
                      <button className="px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2.5 text-safe-text-gray shadow-sm bg-safe-white">
                          <Link to="/admin-user-management">User Management</Link>
                      </button>
                      <button className="px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2.5 text-white shadow-sm bg-safe-blue">
                          Activity Logs
                      </button>
                  </div>

                  {/* Create new Account */}
                  <div className='ml-auto'>
                      <button className="relative px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2.5 text-white shadow-sm bg-safe-blue">
                        <FontAwesomeIcon icon="user-plus" />
                        Create New Account
                      </button>
                  </div>
                </div>

              </div>

              {/* Activiy Logs Table */}


          </div>
      </div>
    );
}

export default AdminActivityLogs;