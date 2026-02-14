import Sidebar from "../components/Sidebar";
import UserManagementHeader from "../components/UserManagementHeader";
import UserManagementCards from "../components/UserManagementCards";
import UserActivityButtons from "../components/UserActivityButtons";
import UserActivityTable from "../components/UserActivityTable"




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

              <div className="flex-1 overflow-y-auto mt-6 mx-7" >
                {/* Cards */}
                <UserManagementCards />
                
                {/* Buttons */}
                <UserActivityButtons />

               {/* Activiy Logs Table */}
               <UserActivityTable />

              </div>
          </div>
      </div>
    );
}

export default AdminActivityLogs;