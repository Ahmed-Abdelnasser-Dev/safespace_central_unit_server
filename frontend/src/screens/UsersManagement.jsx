import Sidebar from "../components/Sidebar";
import UserManagementHeader from "../components/UserManagementHeader";
import UserManagementCards from "../components/UserManagementCards";
import UserManagementButtons from"../components/UserManagementButtons";
import UserManagementTable from "../components/UserManagementTable";


function AdminUsersManagement() {

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

            {/* Main Body */}
            <div className="flex-shrink-0 mt-6 mx-7" >
                {/* Cards */}
                <UserManagementCards />
                
                {/* Search Bar and Dropdowns */}
                <UserManagementButtons />

                {/* Users Table */}
                <UserManagementTable />
              </div>
          </div>
      </div>
    );
}

export default AdminUsersManagement;