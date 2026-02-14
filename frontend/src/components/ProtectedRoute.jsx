/**
 * ProtectedRoute Component
 * Protects routes that require authentication and/or specific roles
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

/**
 * @param {Object} props
 * @param {React.ReactNode} props.children - Component to render if authorized
 * @param {string[]} props.allowedRoles - Array of role names that can access this route (optional)
 * @returns {React.ReactNode}
 */
function ProtectedRoute({ children, allowedRoles = null }) {
  const location = useLocation();
  const { isAuthenticated, user, loading } = useSelector((state) => state.auth);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-safe-bg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-safe-blue-btn mx-auto mb-4"></div>
          <p className="text-safe-text-gray">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to sign-in if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  // Check role-based access if allowedRoles is specified
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user.role?.name;
    
    if (!allowedRoles.includes(userRole)) {
      // User is authenticated but doesn't have required role
      // Redirect to dashboard or show unauthorized message
      return (
        <div className="flex items-center justify-center min-h-screen bg-safe-bg">
          <div className="text-center max-w-md p-8 bg-white rounded-lg shadow-lg">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="bi bi-shield-x text-3xl text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-safe-text-dark mb-2">Access Denied</h2>
            <p className="text-safe-text-gray mb-6">
              You don't have permission to access this page. 
              {allowedRoles.length === 1 && ` This page requires ${allowedRoles[0]} role.`}
            </p>
            <button
              onClick={() => window.history.back()}
              className="px-6 py-2 bg-safe-blue-btn text-white rounded-lg hover:bg-safe-blue-btn/90 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }
  }

  // User is authenticated and has required role (or no role check needed)
  return children;
}

export default ProtectedRoute;
