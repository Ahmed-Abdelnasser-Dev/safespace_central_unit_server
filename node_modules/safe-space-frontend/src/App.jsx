/**
 * Safe Space Monitoring Dashboard - Main Application Component
 *
 * This is the root component of the React application.
 * It sets up routing, global state management, and real-time connections.
 *
 * @module App
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MapOverview from './screens/MapOverview.jsx';
import Dashboard from './screens/Dashboard.jsx';
import SystemTest from './screens/SystemTest.jsx';
import SignIn from './screens/SignIn.jsx';
import TwoFactorAuth from './screens/TwoFactorAuth.jsx';
import YouAreAllSet from './screens/YouAreAllSet.jsx';
import ForgotPassword from './screens/ForgotPassword.jsx';
import CheckYourEmail from './screens/CheckYourEmail.jsx';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Main app */}
        <Route path="/" element={<MapOverview />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/system-test" element={<SystemTest />} />

        {/* Auth flow */}
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/two-factor" element={<TwoFactorAuth />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/check-email" element={<CheckYourEmail />} />
        <Route path="/you-are-all-set" element={<YouAreAllSet />} />

        {/* Fallback */}
        <Route path="*" element={<SignIn />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
