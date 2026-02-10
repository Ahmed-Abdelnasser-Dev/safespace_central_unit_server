const axios = require('axios');

class MobileAppNotificationService {
  constructor(serverUrl) {
    this.serverUrl = serverUrl;
  }

  /**
   * Notify the Mobile App Server about an accident
   * @param {Object} data - { centralUnitAccidentId, occurredAt, location: { lat, lng } }
   * @returns {Promise<Object>} - Response from Mobile App Server
   */
  async notifyAccident({ centralUnitAccidentId, occurredAt, location }) {
    if (!centralUnitAccidentId || typeof centralUnitAccidentId !== 'string') {
      throw new Error('centralUnitAccidentId is required');
    }
    if (!occurredAt || typeof occurredAt !== 'string') {
      throw new Error('occurredAt is required and must be an ISO 8601 string');
    }
    // Basic ISO date validation
    if (isNaN(Date.parse(occurredAt))) {
      throw new Error('occurredAt must be a valid ISO 8601 datetime string');
    }
    if (!location || typeof location !== 'object') {
      throw new Error('location is required');
    }
    const { lat, lng } = location;
    if (typeof lat !== 'number' || lat < -90 || lat > 90) {
      throw new Error('location.lat must be between -90 and 90');
    }
    if (typeof lng !== 'number' || lng < -180 || lng > 180) {
      throw new Error('location.lng must be between -180 and 180');
    }

    const body = { centralUnitAccidentId, occurredAt, location: { lat, lng } };

    try {
      const response = await axios.post(
        `${this.serverUrl}/central-unit/receive-accident-from-central-unit`,
        body,
        { headers: { 'Content-Type': 'application/json' } }
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to notify Mobile App Server');
    }
  }
}

module.exports = MobileAppNotificationService;
