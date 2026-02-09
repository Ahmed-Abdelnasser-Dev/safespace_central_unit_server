/**
 * Safe Space Monitoring Dashboard - Application Entry Point
 * 
 * This file is the entry point for the React application.
 * It renders the root App component into the DOM.
 * 
 * @module main
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import store from './app/store.js';
import App from './App.jsx';
import './index.css';
import './icons.js';
import 'bootstrap-icons/font/bootstrap-icons.css';


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
