import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import CreateUserModal from './CreateUserModal';
import { userAPI } from '../services/api';

/**
 * Search Bar for Activity Logs
 */

function UserActivityButtons() {

    const [isModalOpen, setIsModalOpen] = useState(false);

    const [createdUserPassword, setCreatedUserPassword] = useState(null);
    const [createdUserEmail, setCreatedUserEmail] = useState('');

    const handleCreateUser = async (data) => {
        try {
            const result = await userAPI.createUser(data);
            setIsModalOpen(false);
            if (result && result.tempPassword) {
                setCreatedUserEmail(result.email || data.email);
                setCreatedUserPassword(result.tempPassword);
            } else {
                alert('User created successfully');
            }
        } catch (error) {
            console.error('Failed to create user:', error);
            alert(error.response?.data?.message || 'Failed to create user');
        }
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

            {/* Temp Password Reveal Modal */}
            {createdUserPassword && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-8">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-safe-green/10 flex items-center justify-center flex-shrink-0">
                                <FontAwesomeIcon icon="user-check" className="text-safe-green" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-safe-text-dark">User Created Successfully</h3>
                                <p className="text-xs text-safe-text-gray">Share this temporary password with the user securely</p>
                            </div>
                        </div>
                        <div className="bg-safe-bg rounded-lg p-4 mb-4">
                            <p className="text-xs text-safe-text-gray mb-1">Email</p>
                            <p className="text-sm font-medium text-safe-text-dark">{createdUserEmail}</p>
                        </div>
                        <div className="bg-safe-bg rounded-lg p-4 mb-5">
                            <p className="text-xs text-safe-text-gray mb-1">Temporary Password</p>
                            <div className="flex items-center justify-between gap-3">
                                <code className="text-sm font-mono font-bold text-safe-text-dark break-all">{createdUserPassword}</code>
                                <button
                                    onClick={() => { navigator.clipboard.writeText(createdUserPassword); alert('Password copied!'); }}
                                    className="flex-shrink-0 px-3 py-1.5 text-xs font-medium bg-safe-blue-btn text-white rounded-lg hover:bg-safe-blue-btn/90 transition-colors"
                                >
                                    <FontAwesomeIcon icon="copy" className="mr-1" />Copy
                                </button>
                            </div>
                        </div>
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-5">
                            <p className="text-xs text-yellow-800">
                                <FontAwesomeIcon icon="triangle-exclamation" className="mr-1" />
                                This password will not be shown again. The user must change it on first login.
                            </p>
                        </div>
                        <button
                            onClick={() => { setCreatedUserPassword(null); setCreatedUserEmail(''); }}
                            className="w-full px-4 py-2.5 text-sm font-medium text-white bg-safe-blue-btn hover:bg-safe-blue-btn/90 rounded-lg transition-colors"
                        >
                            I've Saved the Password
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default UserActivityButtons;