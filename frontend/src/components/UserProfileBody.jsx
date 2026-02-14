import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateUserProfile, fetchCurrentUser } from '../features/auth/authSlice';
import { userAPI } from '../services/api';
import { formatEgyptianPhone, formatEgyptianNID } from '../utils/egyptianValidation';
import EditPersonalInfoModal from './EditPersonalInfoModal';
import EditAccountInfoModal from './EditAccountInfoModal';
import ChangePasswordModal from './ChangePasswordModal';

/**
 * Profile Screen Component - EXACT ORIGINAL UI WITH REAL DATA
 * Manage and update profile data
 * Security: Sensitive fields (National ID) read-only, changes validated server-side
 */
function Profile({ onLogout }) {
  const dispatch = useDispatch();
  const { user, loading } = useSelector((state) => state.auth);
  
  const [isPersonalModalOpen, setIsPersonalModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Check if user is admin
  const isAdmin = user?.role?.name === 'admin';

  // Handle profile photo update
  // const handlePhotoUpload = async (event) => {
  //   const file = event.target.files[0];
  //   if (!file) return;

  //   if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
  //     alert('Please upload a valid image file (JPEG, PNG, or WebP)');
  //     return;
  //   }

  //   if (file.size > 5 * 1024 * 1024) {
  //     alert('File size must be less than 5MB');
  //     return;
  //   }

  //   try {
  //     await userAPI.updatePhoto(file);
  //     await dispatch(fetchCurrentUser()).unwrap();
  //     alert('Profile photo updated successfully');
  //   } catch (error) {
  //     console.error('Photo upload error:', error);
  //     alert('Failed to update profile photo');
  //   }
  // };

    const handlePhotoUpload = async (event) => {
      const file = event.target.files[0];
      if (!file) return;
  
      // Validate file type and size
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        alert('Please upload a valid image file (JPEG, PNG, or WebP)');
        return;
      }
  
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
  
      try {
        const updatedUser = await userAPI.updatePhoto(file);
        dispatch(fetchCurrentUser());
        alert('Profile photo updated successfully');
      } catch (error) {
        console.error('Photo upload error:', error);
        alert('Failed to update profile photo');
      }
    };

  // Handle personal info submit
  const handlePersonalInfoSubmit = async (updatedData) => {
    try {
      await dispatch(updateUserProfile(updatedData)).unwrap();
      alert('Personal information updated successfully');
      setIsPersonalModalOpen(false);
      await dispatch(fetchCurrentUser()).unwrap();
    } catch (error) {
      alert(error || 'Failed to update personal information');
    }
  };

  // Handle account info submit (admin only)
  const handleAccountInfoSubmit = async (updatedData) => {
    try {
      await userAPI.updateMe(updatedData);
      alert('Account information updated successfully');
      setIsAccountModalOpen(false);
      await dispatch(fetchCurrentUser()).unwrap();
    } catch (error) {
      alert(error?.response?.data?.message || 'Failed to update account information');
    }
  };

  // Loading state
  if (loading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center bg-safe-bg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-safe-blue-btn mx-auto mb-4"></div>
          <p className="text-safe-text-gray">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Prepare profile data from user object
  const profile = {
    fullName: user.fullName || 'Not set',
    username: user.username || user.email?.split('@')[0] || 'user',
    avatar: user.fullName ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : user.email?.[0]?.toUpperCase() || 'U',
    role: user.role?.name || 'User',
    location: user.officeLocation || 'Not set',
    email: user.email,
    phone: user.phone ? formatEgyptianPhone(user.phone) : 'Not set',
    memberSince: user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown',
    // Personal Info
    phoneNumber: user.phone ? formatEgyptianPhone(user.phone) : 'Not set',
    birthDate: user.birthdate ? new Date(user.birthdate).toLocaleDateString() : 'Not set',
    gender: user.gender || 'Not set',
    department: user.department || 'Not set',
    officeLocation: user.officeLocation || 'Not set',
    address: user.address || 'Not set',
    // Account Info
    userId: user.employeeId || user.id,
    nationalId: user.nationalId ? formatEgyptianNID(user.nationalId) : 'Not set',
  };

  // Recent activity - REAL DATA
  const recentActivity = [
    {
      id: 1,
      icon: 'circle-user',
      iconColor: 'text-safe-green',
      iconBg: 'bg-safe-white',
      title: 'Logged in',
      subtitle: user.lastLoginAt 
        ? `${new Date(user.lastLoginAt).toLocaleString()} • ${profile.officeLocation}`
        : 'No login history'
    },
    {
      id: 2,
      icon: 'pen-to-square',
      iconColor: 'text-safe-blue-btn',
      iconBg: 'bg-safe-white',
      title: 'Updated profile information',
      subtitle: user.updatedAt && user.createdAt && new Date(user.updatedAt) > new Date(user.createdAt)
        ? `${new Date(user.updatedAt).toLocaleString()} • ${profile.officeLocation}`
        : 'No updates yet'
    },
    {
      id: 3,
      icon: 'lock',
      iconColor: 'text-safe-accent',
      iconBg: 'bg-safe-white',
      title: 'Password changed',
      subtitle: user.passwordChangedAt
        ? `${new Date(user.passwordChangedAt).toLocaleDateString()} • ${profile.officeLocation}`
        : user.mustChangePassword
          ? 'Password change required'
          : 'Default password'
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-safe-bg p-7 space-y-5">

      {/* ── Profile Hero Card ── */}
      <div className="bg-white rounded-xl border border-safe-border p-7">
        <div className="flex items-start justify-between">
          {/* Left: Avatar + Info */}
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-safe-blue-btn text-white flex items-center justify-center font-bold text-3xl flex-shrink-0">
              {profile.avatar}
            </div>

            {/* Info */}
            <div className="pt-1">
              <h2 className="text-2xl font-bold text-safe-text-dark">{profile.fullName}</h2>
              <p className="text-sm text-safe-text-gray mt-0.5">@{profile.username}</p>

              {/* Role & Location */}
              <div className="flex items-center gap-4 mt-3">
                <span className="flex items-center gap-1.5 text-sm text-safe-text-gray">
                  <FontAwesomeIcon icon="shield" className="text-safe-blue-btn/70 text-xs" />
                  {profile.role}
                </span>
                <span className="text-safe-text-gray/40">•</span>
                <span className="flex items-center gap-1.5 text-sm text-safe-text-gray">
                  <FontAwesomeIcon icon="map-pin" className="text-safe-text-gray text-xs" />
                  {profile.location}
                </span>
              </div>

              {/* Email & Phone */}
              <div className="flex items-center gap-5 mt-2.5">
                <span className="flex items-center gap-1.5 text-sm text-safe-text-gray">
                  <FontAwesomeIcon icon="envelope" className="text-xs text-safe-text-gray/60" />
                  {profile.email}
                </span>
                <span className="text-safe-text-gray/40">•</span>
                <span className="flex items-center gap-1.5 text-sm text-safe-text-gray">
                  <FontAwesomeIcon icon="phone" className="text-xs text-safe-text-gray/60" />
                  {profile.phone}
                </span>
              </div>

              {/* Member Since */}
              <p className="flex items-center gap-1.5 text-sm text-safe-text-gray mt-2">
                <FontAwesomeIcon icon="calendar" className="text-xs text-safe-text-gray/60" />
                Member since {profile.memberSince}
              </p>
            </div>
          </div>

          {/* Edit Image Button */}
          <label className="flex items-center gap-2 px-4 py-2 bg-safe-blue-btn text-white text-sm font-medium rounded-lg hover:bg-safe-blue-btn/90 transition-colors cursor-pointer">
            <FontAwesomeIcon icon="pen-to-square" className="text-xs" />
            Edit Image
            <input 
              type="file" 
              className="hidden" 
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoUpload}
            />
          </label>
        </div>
      </div>

      {/* ── Middle Row: Personal Info + Account Info ── */}
      <div className="grid grid-cols-2 gap-5">

        {/* Personal Information */}
        <div className="bg-white rounded-xl border border-safe-border p-7">
          <div className="mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-safe-text-dark">Personal Information</h3>
                <p className="text-xs text-safe-text-gray mt-0.5">Editable by the User</p>
              </div>
              <button 
                onClick={() => setIsPersonalModalOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 bg-safe-blue-btn text-white text-xs font-medium rounded-lg hover:bg-safe-blue-btn/90 transition-colors">
                <FontAwesomeIcon icon="pen-to-square" className="text-[10px]" />
                Edit
              </button>
            </div>
            <div className="border-b border-safe-border" />
          </div>

          <div className="space-y-4">
            <InfoRow icon="circle-user"  label="Full Name"       value={profile.fullName}       bold />
            <InfoRow icon="circle-user"  label="Username"        value={profile.username}       bold />
            <InfoRow icon="phone"        label="Phone Number"    value={profile.phoneNumber}    bold />
            <InfoRow icon="cake-candles" label="Birth Date"      value={profile.birthDate}      bold />
            <InfoRow icon="venus-mars"   label="Gender"          value={profile.gender}         bold />
            <InfoRow icon="building"     label="Department"      value={profile.department}     bold />
            <InfoRow icon="map-pin"      label="Office Location" value={profile.officeLocation} bold />
            <InfoRow icon="location-dot" label="Address"         value={profile.address}        bold />
          </div>
        </div>

        {/* Account Information */}
        <div className="bg-white rounded-xl border border-safe-border p-7">
          <div className="mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-safe-text-dark">Account Information</h3>
                <p className="text-xs text-safe-text-gray mt-0.5">Editable only by Admin</p>
              </div>
              {isAdmin && (
                <button 
                  onClick={() => setIsAccountModalOpen(true)}
                  className="flex items-center gap-2 px-3.5 py-2 bg-safe-blue-btn text-white text-xs font-medium rounded-lg hover:bg-safe-blue-btn/90 transition-colors">
                  <FontAwesomeIcon icon="pen-to-square" className="text-[10px]" />
                  Edit
                </button>
              )}
            </div>
            <div className="border-b border-safe-border" />
          </div>

          <div className="space-y-4">
            <InfoRow icon="circle-user" label="User ID"        value={profile.userId}    bold />
            <InfoRow icon="envelope"    label="Email Address"  value={profile.email}     bold />
            {/* Security: National ID displayed as-is, editing restricted to admin */}
            <InfoRow icon="id-badge"      label="National ID"    value={profile.nationalId} bold />
            <InfoRow icon="shield-halved" label="Role"         value={profile.role}      bold />
          </div>
        </div>
      </div>

      {/* ── Bottom Row: Recent Activity + Security & Settings ── */}
      <div className="grid grid-cols-2 gap-5">

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-safe-border p-7">
          <h3 className="text-base font-bold text-safe-text-dark mb-4">Recent Activity</h3>
          <div className="border-b border-safe-border mb-5" />

          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center gap-4 p-4 border bg-safe-bg rounded-lg">
                <div className={`w-9 h-9 rounded-lg ${activity.iconBg} ${activity.iconColor} flex items-center justify-center flex-shrink-0`}>
                  <FontAwesomeIcon icon={activity.icon} className="text-sm" />
                </div>
                <div>
                  <p className="text-sm font-medium text-safe-text-dark">{activity.title}</p>
                  <p className="text-xs text-safe-text-gray mt-0.5">{activity.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security & Settings */}
        <div className="bg-white rounded-xl border border-safe-border p-7">
          <h3 className="text-base font-bold text-safe-text-dark mb-4">Security & Settings</h3>
          <div className="border-b border-safe-border mb-5" />

          <div className="space-y-3">
            {/* Change Password */}
            <button 
              onClick={() => setIsPasswordModalOpen(true)}
              className="w-full flex items-center gap-4 p-4 border bg-safe-bg rounded-lg hover:bg-safe-bg transition-colors text-left group">
              <div className="w-9 h-9 rounded-lg bg-safe-white  text-safe-blue-btn flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon icon="lock" className="text-sm" />
              </div>
              <div>
                <p className="text-sm font-medium text-safe-text-dark">Change Password</p>
                <p className="text-xs text-safe-text-gray mt-0.5">Update your account password</p>
              </div>
              <FontAwesomeIcon icon="chevron-right" className="text-safe-text-gray text-xs ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            {/* Logout */}
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-4 p-4 border border-safe-danger/30 rounded-lg hover:bg-safe-danger/5 transition-colors text-left group"
            >
              <div className="w-9 h-9 rounded-lg bg-safe-danger/10 text-safe-danger flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon icon="arrow-right-from-bracket" className="text-sm" />
              </div>
              <div>
                <p className="text-sm font-medium text-safe-danger">Logout</p>
                <p className="text-xs text-safe-text-gray mt-0.5">Sign out of your account</p>
              </div>
              <FontAwesomeIcon icon="chevron-right" className="text-safe-danger text-xs ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        </div>
      </div>

      {/* Personal Info Modal */}
      <EditPersonalInfoModal
        isOpen={isPersonalModalOpen}
        onClose={() => setIsPersonalModalOpen(false)}
        userData={user}
        onSubmit={handlePersonalInfoSubmit}
      />

      {/* Account Info Modal */}
      <EditAccountInfoModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        userData={user}
        onSubmit={handleAccountInfoSubmit}
        isAdmin={isAdmin}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />

    </div>
  );
}

/* ── Reusable Info Row ── */
function InfoRow({ icon, label, value, bold = false }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="flex items-center gap-2.5 text-sm text-safe-text-gray">
        <FontAwesomeIcon icon={icon} className="text-xs w-3.5 text-safe-text-gray/70" />
        {label}
      </span>
      <span className={`text-sm text-safe-text-dark text-right ${bold ? 'font-semibold' : ''}`}>
        {value}
      </span>
    </div>
  );
}

export default Profile;