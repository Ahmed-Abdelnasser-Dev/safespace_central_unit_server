/**
 * Centralized API configuration
 *
 * Single source of truth for API base URLs across the frontend.
 * Uses VITE_API_URL from environment, falling back to localhost for development.
 *
 * @module lib/apiConfig
 */

const raw = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/** Full API URL including /api path, e.g. "http://localhost:5000/api" */
export const API_URL = raw;

/** Server root without /api suffix, e.g. "http://localhost:5000" */
export const API_BASE_URL = raw.replace(/\/api\/?$/, '');
