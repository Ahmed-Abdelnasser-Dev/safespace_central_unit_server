import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useSelector } from 'react-redux';
import { authAPI } from '../services/api';

/**
 * Change Password Modal
 * Allows users to update their password with validation
 */
function ChangePasswordModal({ isOpen, onClose, isMandatory = false }) {
  const { user } = useSelector((state) => state.auth);  // Get user from Redux
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const validatePassword = (password) => {
    const errors = [];
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*]/.test(password)) {
      errors.push('Password must contain at least one special character (!@#$%^&*)');
    }
    return errors;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = {};

    // Validate current password
    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    // Validate new password
    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else {
      const passwordErrors = validatePassword(formData.newPassword);
      if (passwordErrors.length > 0) {
        newErrors.newPassword = passwordErrors[0]; // Show first error
      }
    }

    // Validate confirm password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Check if new password is same as current
    if (formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Submit password change
    setIsSubmitting(true);
    try {
      // Pass userId explicitly
      await authAPI.changePassword(user.id, formData.currentPassword, formData.newPassword);
      alert('Password changed successfully!');
      handleClose();
    } catch (error) {
      console.error('Password change error:', error);
      if (error.response?.status === 401) {
        setErrors({ currentPassword: 'Current password is incorrect' });
      } else {
        alert(error.response?.data?.message || 'Failed to change password');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setErrors({});
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    onClose();
  };

  // Password strength indicator
  const getPasswordStrength = (password) => {
    const errors = validatePassword(password);
    if (!password) return { strength: 0, label: '', color: '' };
    if (errors.length === 0) return { strength: 100, label: 'Strong', color: 'text-safe-green' };
    if (errors.length <= 2) return { strength: 60, label: 'Medium', color: 'text-yellow-500' };
    return { strength: 30, label: 'Weak', color: 'text-safe-danger' };
  };

  const passwordStrength = getPasswordStrength(formData.newPassword);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-safe-text-dark">Change Password</h3>
            <p className="text-xs text-safe-text-gray mt-1">
              {isMandatory ? 'You must set a new password to continue' : 'Update your account password'}
            </p>
          </div>
          {!isMandatory && (
            <button 
              onClick={handleClose}
              className="text-safe-text-gray hover:text-safe-text-dark transition-colors"
            >
              <FontAwesomeIcon icon="xmark" className="text-xl" />
            </button>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Current Password */}
          <div>
            <label className="text-xs font-medium text-safe-text-dark block mb-1.5">
              Current Password *
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={formData.currentPassword}
                onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                className={`w-full px-3 py-2 pr-10 text-sm rounded-lg border ${
                  errors.currentPassword ? 'border-red-500' : 'border-safe-border'
                } focus:outline-none focus:ring-2 focus:ring-safe-blue-btn/20`}
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-safe-text-gray hover:text-safe-text-dark"
              >
                <FontAwesomeIcon icon={showCurrentPassword ? 'eye-slash' : 'eye'} className="text-sm" />
              </button>
            </div>
            {errors.currentPassword && (
              <p className="text-xs text-red-600 mt-1">{errors.currentPassword}</p>
            )}
          </div>

          {/* New Password */}
          <div>
            <label className="text-xs font-medium text-safe-text-dark block mb-1.5">
              New Password *
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={(e) => handleInputChange('newPassword', e.target.value)}
                className={`w-full px-3 py-2 pr-10 text-sm rounded-lg border ${
                  errors.newPassword ? 'border-red-500' : 'border-safe-border'
                } focus:outline-none focus:ring-2 focus:ring-safe-blue-btn/20`}
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-safe-text-gray hover:text-safe-text-dark"
              >
                <FontAwesomeIcon icon={showNewPassword ? 'eye-slash' : 'eye'} className="text-sm" />
              </button>
            </div>
            
            {/* Password Strength Indicator */}
            {formData.newPassword && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-safe-text-gray">Password Strength:</span>
                  <span className={`text-xs font-medium ${passwordStrength.color}`}>
                    {passwordStrength.label}
                  </span>
                </div>
                <div className="h-1.5 bg-safe-border rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      passwordStrength.strength === 100 ? 'bg-safe-green' :
                      passwordStrength.strength >= 60 ? 'bg-yellow-500' : 'bg-safe-danger'
                    }`}
                    style={{ width: `${passwordStrength.strength}%` }}
                  />
                </div>
              </div>
            )}

            {errors.newPassword && (
              <p className="text-xs text-red-600 mt-1">{errors.newPassword}</p>
            )}

            {/* Password Requirements */}
            <div className="mt-2 p-3 bg-safe-bg rounded-lg">
              <p className="text-xs font-medium text-safe-text-dark mb-2">Password must contain:</p>
              <ul className="space-y-1">
                <PasswordRequirement 
                  met={formData.newPassword.length >= 8}
                  text="At least 8 characters"
                />
                <PasswordRequirement 
                  met={/[A-Z]/.test(formData.newPassword)}
                  text="One uppercase letter"
                />
                <PasswordRequirement 
                  met={/[a-z]/.test(formData.newPassword)}
                  text="One lowercase letter"
                />
                <PasswordRequirement 
                  met={/[0-9]/.test(formData.newPassword)}
                  text="One number"
                />
                <PasswordRequirement 
                  met={/[!@#$%^&*]/.test(formData.newPassword)}
                  text="One special character (!@#$%^&*)"
                />
              </ul>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-xs font-medium text-safe-text-dark block mb-1.5">
              Confirm New Password *
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className={`w-full px-3 py-2 pr-10 text-sm rounded-lg border ${
                  errors.confirmPassword ? 'border-red-500' : 'border-safe-border'
                } focus:outline-none focus:ring-2 focus:ring-safe-blue-btn/20`}
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-safe-text-gray hover:text-safe-text-dark"
              >
                <FontAwesomeIcon icon={showConfirmPassword ? 'eye-slash' : 'eye'} className="text-sm" />
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-red-600 mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            {!isMandatory && (
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-safe-text-dark bg-safe-bg rounded-lg hover:bg-safe-border/50 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-safe-blue-btn rounded-lg hover:bg-safe-blue-btn/90 transition-colors disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Password requirement component
function PasswordRequirement({ met, text }) {
  return (
    <li className="flex items-center gap-2 text-xs">
      <FontAwesomeIcon 
        icon={met ? 'check-circle' : 'circle'} 
        className={`text-xs ${met ? 'text-safe-green' : 'text-safe-text-gray'}`}
      />
      <span className={met ? 'text-safe-green' : 'text-safe-text-gray'}>{text}</span>
    </li>
  );
}

export default ChangePasswordModal;