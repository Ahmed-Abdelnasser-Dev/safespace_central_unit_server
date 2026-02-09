import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link, useNavigate } from 'react-router-dom';


/**
 * Search Bar for users management
 */

function UserManagementAllUser() {
    return (
        <div>
          {/* navigation buttons */}
          <div>
              {/* Buttons */}
              <div className="mt-6 flex gap-2">
                <button className="px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2.5 text-white shadow-sm bg-safe-blue">
                    User Management
                </button>
                <button className="px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2.5 text-safe-text-gray shadow-sm bg-safe-white">
                    <Link to="/activity-logs">Activity Logs</Link>
                </button>
              </div>
          </div>
          <div className='flex pt-6 '>
            <div className="flex items-center gap-4">
                {/* Search Bar */}
                <div className="relative">
                    <FontAwesomeIcon icon="magnifying-glass" className="absolute left-4 top-1/2 -translate-y-1/2 text-safe-text-gray text-sm"/>
                    <input
                    type="text"
                    placeholder="Search by name, email or ID..."
                    className="pl-11 pr-4 py-2.5 w-[340px] rounded-lg border border-safe-border text-sm text-safe-text-dark placeholder:text-safe-text-gray focus:outline-none focus:ring-2 focus:ring-safe-blue-btn/20 focus:border-safe-blue-btn"
                    />
                </div>

                {/* Drop Downs */}
                <button className="text-sm pl-3 py-2.5 w-[150px] rounded-lg border bg-safe-white border-safe-border flex items-center justify-start text-safe-text-gray hover:bg-safe-bg transition-colors">
                   All Roles <FontAwesomeIcon icon="angle-down" className="text-sm flex-1" />
                </button>

                <button className="text-sm pl-3 py-2.5 w-[150px] rounded-lg border bg-safe-white border-safe-border flex items-center justify-start text-safe-text-gray hover:bg-safe-bg transition-colors">
                   All Status <FontAwesomeIcon icon="angle-down" className="text-sm flex-1" />
                </button>
            </div>
            
            <div className='ml-auto'>
                {/* Create new Account */}
                <button className="relative px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2.5 text-white shadow-sm bg-safe-blue">
                    <FontAwesomeIcon icon="user-plus" />
                    Create New Account
                </button>
            </div>
          </div>
        </div>
    );
}

export default UserManagementAllUser;