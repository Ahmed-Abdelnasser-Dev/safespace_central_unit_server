/**
 * Redux Store Configuration
 * 
 * Configures the Redux Toolkit store with all feature slices.
 * This is the central state management hub for the application.
 * 
 * @module app/store
 */

import { configureStore } from '@reduxjs/toolkit';
import nodesReducer from '../features/nodeMaintainer/nodesSlice.js';

export const store = configureStore({
  reducer: {
    nodes: nodesReducer,
  },
});

export default store;
