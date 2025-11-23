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
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MapOverview />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/system-test" element={<SystemTest />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
