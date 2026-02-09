import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link, useNavigate } from 'react-router-dom';


/**
 * Search Bar for users management
 */

function UserActivityButtons() {
    return (
        
        <div className="flex mt-6">
           {/* Buttons */}

          <div className="flex gap-2">
              <button className="px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2.5 text-safe-text-gray shadow-sm bg-safe-white">
                  <Link to="/user-management">User Management</Link>
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
    );
}

export default UserActivityButtons;