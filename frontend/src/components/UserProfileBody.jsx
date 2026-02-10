import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import EditPersonalInfoModal from './EditPersonalInfoModal';
import EditAccountInfoModal from './EditAccountInfoModal';
import { useState } from 'react';


/**
 * Profile Screen Component
 * Manage and update profile data
 * Security: Sensitive fields (National ID) read-only, changes validated server-side
 */
function Profile({ onLogout }) {

  const [isPersonalModalOpen, setIsPersonalModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);


  // Mock profile data - Security: Replace with authenticated API call
  const profile = {
    fullName: 'John Anderson',
    username: 'john.anderson',
    avatar: 'JA',
    role: 'System Admin',
    location: 'New York Regional Office',
    email: 'john.anderson@highway-safety.gov',
    phone: '+1-555-0100',
    memberSince: 'January 15, 2024',
    // Personal Info
    phoneNumber: '+1-555-0100',
    birthDate: 'March 15, 1985',
    gender: 'Male',
    department: 'Operations Management',
    officeLocation: 'New York Regional Office',
    address: '123 Main Street, Apt 4B, New York, NY 10001',
    // Account Info (read-only)
    userId: 'USR-001',
    nationalId: '1234567890123',
  };

  const recentActivity = [
    {
      id: 1,
      icon: 'circle-user',
      iconColor: 'text-safe-green',
      iconBg: 'bg-safe-white',
      title: 'Logged in',
      subtitle: '2 hours ago • New York Office'
    },
    {
      id: 2,
      icon: 'pen-to-square',
      iconColor: 'text-safe-blue-btn',
      iconBg: 'bg-safe-white',
      title: 'Updated profile information',
      subtitle: 'Yesterday at 3:42 PM • New York Office'
    },
    {
      id: 3,
      icon: 'lock',
      iconColor: 'text-safe-accent',
      iconBg: 'bg-safe-white',
      title: 'Password changed',
      subtitle: '5 days ago • New York Office'
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
          <button className="flex items-center gap-2 px-4 py-2 bg-safe-blue-btn text-white text-sm font-medium rounded-lg hover:bg-safe-blue-btn/90 transition-colors">
            <FontAwesomeIcon icon="pen-to-square" className="text-xs" />
            Edit Image
          </button>
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
              <button 
                onClick={() => setIsAccountModalOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 bg-safe-blue-btn text-white text-xs font-medium rounded-lg hover:bg-safe-blue-btn/90 transition-colors">
                <FontAwesomeIcon icon="pen-to-square" className="text-[10px]" />
                Edit
              </button>
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
            <button className="w-full flex items-center gap-4 p-4 border bg-safe-bg rounded-lg hover:bg-safe-bg transition-colors text-left group">
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
        userData={profile}
        onSubmit={(updatedData) => {
            console.log('Personal info updated:', updatedData);
        }}
        />

        {/* Account Info Modal */}
        <EditAccountInfoModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        userData={profile}
        onSubmit={(updatedData) => {
            console.log('Account info updated:', updatedData);
        }}
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