/**
 * Safe Space Monitoring Dashboard - Main Application Component
 *
 * This is the root component of the React application.
 * It sets up routing, global state management, and real-time connections.
 *
 * @module App
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import MapOverview from './screens/MapOverview.jsx';
import Dashboard from './screens/Dashboard.jsx';
import SystemTest from './screens/SystemTest.jsx';
import SignIn from './screens/SignIn.jsx';
import TwoFactorAuth from './screens/TwoFactorAuth.jsx';
import YouAreAllSet from './screens/YouAreAllSet.jsx';
import ForgotPassword from './screens/ForgotPassword.jsx';
import CheckYourEmail from './screens/CheckYourEmail.jsx';
import UsersManagement from './screens/UsersManagement.jsx';
import ActivityLogs from './screens/ActivityLogs.jsx';
import UserProfile from './screens/UserProfile.jsx';
import NodeMaintainerDashboard from './screens/NodeMaintainerDashboard.jsx';
import './App.css';

function App() {
  // In development mode, allow direct access to node-maintainer without auth
  const isDev = import.meta.env.DEV;

  // Authentication state
  const { isAuthenticated } = useSelector((state) => state.auth);

  return (
    <BrowserRouter>
      <Routes>
        {/* Development: Direct access to Node Maintainer */}
        {isDev && <Route path="/node-maintainer" element={<NodeMaintainerDashboard />} />}

        {/* Main app */}
        <Route
            path="/"
            element={
              isAuthenticated ? (
                <ProtectedRoute>
                  <MapOverview />
                </ProtectedRoute>
              ) : (
                <Navigate to="/sign-in" replace />
              )
            }
        />

        <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
        />
        
        <Route path="/system-test" element={<SystemTest />} />
        {/* {!isDev && <Route path="/node-maintainer" element={<NodeMaintainerDashboard />} />} */}

        {!isDev && (
          <Route
            path="/node-maintainer"
            element={
              <ProtectedRoute>
                <NodeMaintainerDashboard />
              </ProtectedRoute>
            }
          />
        )}

        {/* Auth flow */}
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/two-factor" element={<TwoFactorAuth />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/check-email" element={<CheckYourEmail />} />
        <Route path="/all-set" element={<YouAreAllSet />} />

        {/* User Management */}
        <Route
          path="/user-management"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UsersManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/activity-logs"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ActivityLogs />
            </ProtectedRoute>
          }
        />

        {/* User Profile */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/sign-in" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
