import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import CreateUserModal from './CreateUserModal';

/**
 * Search Bar for Activity Logs
 */

function UserActivityButtons() {

    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleCreateUser = (data) => {
        // 🔐 send data to backend here
        console.log('User created:', {
        ...data,
        password: '[REDACTED]',
        });
    };

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
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="relative px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2.5 text-white shadow-sm bg-safe-blue">
                    <FontAwesomeIcon icon="user-plus" />
                    Create New Account
                </button>
            </div>

            <CreateUserModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSubmit={handleCreateUser}
            />            
        </div>
    );
}

export default UserActivityButtons;