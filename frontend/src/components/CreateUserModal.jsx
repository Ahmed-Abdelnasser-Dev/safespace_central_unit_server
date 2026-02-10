import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';


/**
 * Create New User Modal
 * Security: All inputs validated, passwords handled securely
 */
function CreateUserModal({ isOpen, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    userId: '',
    email: '',
    nationalId: '',
    role: '',
    password: ''
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  // Security: Generate secure random password
  const generatePassword = () => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    
    for (let i = 0; i < 16; i++) {
      password += charset[array[i] % charset.length];
    }
    
    setFormData({ ...formData, password });
  };

  // Security: Validate email format
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Security: Validate user ID format
  const validateUserId = (userId) => {
    const userIdRegex = /^USR-\d{3}$/;
    return userIdRegex.test(userId);
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  // Security: Comprehensive form validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.userId) {
      newErrors.userId = 'User ID is required';
    } else if (!validateUserId(formData.userId)) {
      newErrors.userId = 'User ID must be in format USR-XXX';
    }

    if (!formData.email) {
      newErrors.email = 'Email address is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.nationalId) {
      newErrors.nationalId = 'National ID is required';
    } else if (formData.nationalId.length !== 14) {
      newErrors.nationalId = 'National ID must be 14 digits';
    }

    if (!formData.role) {
      newErrors.role = 'Role is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 12) {
      newErrors.password = 'Password must be at least 12 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Security: In production, send data over HTTPS with proper authentication
      console.log('Creating user with validated data:', {
        ...formData,
        password: '[REDACTED]' // Never log actual passwords
      });
      
      if (onSubmit) {
        onSubmit(formData);
      }
      
      handleClose();
    }
  };

  const handleClose = () => {
    // Clear sensitive data when closing
    setFormData({
      userId: '',
      email: '',
      nationalId: '',
      role: '',
      password: ''
    });
    setErrors({});
    setShowPassword(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 animate-slideUp">
        {/* Modal Header */}
        <div className="px-8 py-6 border-b border-safe-border">
          <h2 className="text-xl font-bold text-safe-text-dark">Create New User</h2>
          <p className="text-sm text-safe-text-gray mt-1">Create new user account</p>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit}>
          <div className="px-8 py-6 space-y-5 max-h-[60vh] overflow-y-auto">
            {/* User ID */}
            <div>
              <label className="block text-sm font-medium text-safe-text-dark mb-2">
                User ID 
              </label>
              <input
                type="text"
                value={formData.userId}
                onChange={(e) => handleInputChange('userId', e.target.value)}
                placeholder="USR-001"
                className={`w-full px-4 py-2.5 bg-safe-bg border rounded-lg text-safe-text-dark placeholder-safe-text-gray/50 focus:outline-none focus:ring-2 focus:ring-safe-blue-btn/30 transition-colors ${
                  errors.userId ? 'border-safe-danger' : 'border-safe-border'
                }`}
              />
              {errors.userId && (
                <p className="mt-1.5 text-xs text-safe-danger flex items-center gap-1">
                  <FontAwesomeIcon icon="exclamation-triangle" className="text-[10px]" />
                  {errors.userId}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-safe-text-dark mb-2">
                Email Address 
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="john.anderson@agency.safeg.gov"
                  className={`w-full px-4 py-2.5 bg-safe-bg border rounded-lg text-safe-text-dark placeholder-safe-text-gray/50 focus:outline-none focus:ring-2 focus:ring-safe-blue-btn/30 transition-colors ${
                    errors.email ? 'border-safe-danger' : 'border-safe-border'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-safe-danger flex items-center gap-1">
                  <FontAwesomeIcon icon="exclamation-triangle" className="text-[10px]" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* National ID */}
            <div>
              <label className="block text-sm font-medium text-safe-text-dark mb-2">
                National ID 
              </label>
              <input
                type="text"
                value={formData.nationalId}
                onChange={(e) => handleInputChange('nationalId', e.target.value)}
                placeholder="12345678901234"
                maxLength={14}
                className={`w-full px-4 py-2.5 bg-safe-bg rounded-lg text-safe-text-dark placeholder-safe-text-gray/50 focus:outline-none focus:ring-2 focus:ring-safe-blue-btn/30 transition-colors ${
                  errors.nationalId ? 'border-safe-danger' : 'border-safe-border'
                }`}
              />
              {errors.nationalId && (
                <p className="mt-1.5 text-xs text-safe-danger flex items-center gap-1">
                  <FontAwesomeIcon icon="exclamation-triangle" className="text-[10px]" />
                  {errors.nationalId}
                </p>
              )}
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-safe-text-dark mb-2">
                Role 
              </label>
              <select
                value={formData.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
                className={`w-full px-4 py-2.5 bg-safe-bg border rounded-lg text-safe-text-dark focus:outline-none focus:ring-2 focus:ring-safe-blue-btn/30 transition-colors cursor-pointer ${
                  errors.role ? 'border-safe-danger' : 'border-safe-border'
                }`}
              >
                <option value="">Select role...</option>
                <option value="admin">System Administrator</option>
                <option value="dispatcher">Emergency Dispatcher</option>
                <option value="road_observer">Road Observer</option>
                <option value="analyst">Data Analyst</option>
              </select>
              {errors.role && (
                <p className="mt-1.5 text-xs text-safe-danger flex items-center gap-1">
                  <FontAwesomeIcon icon="exclamation-triangle" className="text-[10px]" />
                  {errors.role}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-safe-text-dark mb-2">
                Generate Password 
              </label>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Click generate to create secure password"
                    readOnly
                    className={`w-full pl-10 pr-10 py-2.5 bg-safe-bg border rounded-lg text-safe-text-dark focus:outline-none focus:ring-2 focus:ring-safe-blue-btn/30 transition-colors ${
                      errors.password ? 'border-safe-danger' : 'border-safe-border'
                    }`}
                  />
                  {formData.password && (
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-safe-text-gray hover:text-safe-text-dark transition-colors"
                    >
                      <FontAwesomeIcon icon={showPassword ? 'eye-slash' : 'eye'} className="text-sm" />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={generatePassword}
                  className="px-4 py-2.5 bg-safe-bg border-safe-border text-safe-text-dark font-medium rounded-lg hover:bg-safe-bg transition-colors"
                >
                  Generate Password
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-safe-danger flex items-center gap-1">
                  <FontAwesomeIcon icon="exclamation-triangle" className="text-[10px]" />
                  {errors.password}
                </p>
              )}
              {formData.password && !errors.password && (
                <div className="mt-3 p-3 bg-safe-green/10 border border-safe-green/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <FontAwesomeIcon icon="shield-halved" className="text-safe-green mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-safe-green mb-1">Secure Password Generated</p>
                      <p className="text-xs text-safe-text-gray">
                        Make sure to copy this password and send it securely to the user. It won't be shown again.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-8 py-5 bg-safe-bg/40 border-t border-safe-border rounded-b-xl flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 text-sm font-medium text-safe-text-dark bg-white border border-safe-border hover:bg-safe-bg rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2.5 text-sm font-medium text-white bg-safe-blue-btn hover:bg-safe-blue-btn/90 rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              <FontAwesomeIcon icon="user-plus" />
              Create User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateUserModal;