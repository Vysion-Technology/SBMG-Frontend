import axios from 'axios';

// Configure your API base URL
// In production (Vercel), use the proxied endpoint
// In development, use the direct backend URL
const API_BASE_URL = import.meta.env.VITE_API_URL ||
  // (import.meta.env.PROD ? '/api/v1' : 'http://139.59.34.99:8000/api/v1');
  (import.meta.env.PROD ? '/api/v1' : 'https://sbmg.techvysion.com/api/v1');

// Base URL for public media assets
export const MEDIA_BASE_URL = import.meta.env.PROD
  ? '/api/v1/public/media'
  : 'https://sbmg.techvysion.com/api/v1/public/media';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================================================
// GLOBAL SECURITY INTERCEPTOR (XSS & File Upload Protection)
// ============================================================================
const validatePayload = (data) => {
  if (!data) return;

  const containsHTML = (str) => typeof str === 'string' && /[<>]/.test(str);

  // Scenario A: Handle FormData (File Uploads & Mixed Forms)
  if (data instanceof FormData) {
    for (let [key, value] of data.entries()) {
      // 1. Check Text Fields for XSS
      if (typeof value === 'string' && containsHTML(value)) {
        alert(`Security Alert: HTML tags (<, >) and scripts are not allowed`)
        throw new Error(`Security Alert: HTML tags (<, >) and scripts are not allowed in "${key}".`);
      }
      
      // 2. Check File Uploads (Size, Type, Double-Extensions)
      if (value instanceof File) {
        // Size Check (5MB)
        if (value.size > 5 * 1024 * 1024) {
          alert(`Security Alert: File "${value.name}" exceeds the 5MB limit.`)
          throw new Error(`Security Alert: File "${value.name}" exceeds the 5MB limit.`);
        }
        
        // Double-Extension & Null Byte Check
        const fileName = value.name;
        const fileParts = fileName.split('.');
        if (fileParts.length > 2 || fileName.includes('%00')) {
          alert(`Security Alert: File "${fileName}" has an invalid format or double extension.`)
          throw new Error(`Security Alert: File "${fileName}" has an invalid format or double extension.`);
        }
        
        // MIME Type Check (Whitelist)
        const validMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
        if (!validMimeTypes.includes(value.type)) {
          alert(`Security Alert: File type "${value.type}" is not allowed.`)
          throw new Error(`Security Alert: File type "${value.type}" is not allowed.`);
        }
      }
    }
  } 
  // Scenario B: Handle Standard JSON Objects
  else if (typeof data === 'object') {
    const checkObject = (obj) => {
      for (let key in obj) {
        if (typeof obj[key] === 'string' && containsHTML(obj[key])) {
          alert("Security Alert: HTML tags (<, >) and scripts are not allowed")
          throw new Error(`Security Alert: HTML tags (<, >) and scripts are not allowed in "${key}".`);
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          checkObject(obj[key]); // Recursive check for nested JSON
        }
      }
    };
    checkObject(data);
  }
};

apiClient.interceptors.request.use(
  (config) => {
    // Only intercept data-mutating requests for security validation
    if (['post', 'put', 'patch'].includes(config.method?.toLowerCase())) {
      try {
        validatePayload(config.data);
      } catch (error) {
        // Reject the request BEFORE it leaves the browser
        return Promise.reject(error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
// ============================================================================


// Add request interceptor for authentication
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // console.log('🔐 Adding Bearer token to request headers');
      // console.log('🔐 Request headers:', {
      //   'Content-Type': config.headers['Content-Type'],
      //   'Authorization': config.headers.Authorization ? 'Bearer [TOKEN]' : 'Not set'
      // });
    } else {
      console.warn('⚠️ No access token found in localStorage');
    }
    // When sending FormData, do not set Content-Type so the browser sets
    // multipart/form-data with the correct boundary (fixes 405 on some servers)
    if (config.data && config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for handling token refresh and 401 errors
apiClient.interceptors.response.use(
  (response) => {
    // Check for X-Refresh-Token in the response headers
    const refreshToken = response.headers['x-refresh-token'];
    if (refreshToken) {
      console.log('🔄 Received new access token via X-Refresh-Token header');
      localStorage.setItem('access_token', refreshToken);
      // The next request will pick up the new token from localStorage via the request interceptor
    }
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('⚠️ Session expired or unauthorized (401). Clearing session...');
      // Clear all stored auth data
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      localStorage.removeItem('userRole');
      localStorage.removeItem('rememberMe');
      
      // Force redirect to login page if not already there
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
        window.alert("session expired!")
      }
    }
    return Promise.reject(error);
  }
);

// API functions
export const authAPI = {
  getPublicKey: () => apiClient.get('/auth/public-key'),
  login: (credentials) => apiClient.post('/auth/login', credentials),
  getMe: () => apiClient.get('/auth/me'),
  logout: () => apiClient.post('/auth/logout'),
};

export const dashboardAPI = {
  getCEOData: () => apiClient.get('/dashboard/ceo'),
  getBDOData: () => apiClient.get('/dashboard/bdo'),
  getVDOData: () => apiClient.get('/dashboard/vdo'),
};

export const schemesAPI = {
  getSchemes: (params = {}) => {
    const queryParams = new URLSearchParams({
      skip: params.skip || 0,
      limit: params.limit || 100
    });
    // Only add active parameter if it's explicitly provided (not undefined)
    if (params.active !== undefined) {
      queryParams.append('active', params.active);
    }
    return apiClient.get(`/schemes/?${queryParams}`);
  },
  createScheme: (schemeData) => {
    return apiClient.post('/schemes/', schemeData);
  },
  updateScheme: (schemeId, schemeData) => {
    return apiClient.put(`/schemes/${schemeId}`, schemeData);
  },
  deleteScheme: (schemeId) => {
    return apiClient.delete(`/schemes/${schemeId}`);
  },
  uploadSchemeMedia: (schemeId, mediaFile) => {
    const formData = new FormData();
    formData.append('media', mediaFile);
    return apiClient.post(`/schemes/${schemeId}/media`, formData);
  },
};

export const eventsAPI = {
  getEvents: (params = {}) => {
    const queryParams = new URLSearchParams({
      skip: params.skip || 0,
      limit: params.limit || 100
    });
    // Only add active parameter if it's explicitly provided (not undefined)
    if (params.active !== undefined) {
      queryParams.append('active', params.active);
    }
    return apiClient.get(`/events/?${queryParams}`);
  },
  createEvent: (eventData) => {
    return apiClient.post('/events/', eventData);
  },
  updateEvent: (eventId, eventData) => {
    return apiClient.put(`/events/${eventId}`, eventData);
  },
  deleteEvent: (eventId) => {
    return apiClient.delete(`/events/${eventId}`);
  },
  uploadEventMedia: (eventId, mediaFile) => {
    const formData = new FormData();
    formData.append('media', mediaFile);
    return apiClient.post(`/events/${eventId}/media`, formData);
  },
};

export const noticesAPI = {
  getTypes: () => apiClient.get('/notices/types'),
  createNotice: (payload) => apiClient.post('/notices/', payload),
};

export const vehiclesAPI = {
  // Get vehicles by location using IDs
  getVehiclesByLocation: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.district_id) queryParams.append('district_id', params.district_id);
    if (params.block_id) queryParams.append('block_id', params.block_id);
    if (params.gp_id) queryParams.append('gp_id', params.gp_id);
    return apiClient.get(`/gps/vehicles?${queryParams}`);
  },
  // Get vehicles list (for counts) - GET /gps/vehicles-list
  getVehiclesList: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.district_id != null) queryParams.append('district_id', params.district_id);
    if (params.block_id != null) queryParams.append('block_id', params.block_id);
    if (params.gp_id != null) queryParams.append('gp_id', params.gp_id);
    return apiClient.get(`/gps/vehicles-list?${queryParams.toString()}`);
  },

  // Get vehicle details (if endpoint exists)
  getVehicleDetails: (vehicleId, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.month) queryParams.append('month', params.month);
    if (params.year) queryParams.append('year', params.year);
    return apiClient.get(`/gps/vehicles/${vehicleId}/details?${queryParams}`);
  },

  // Add vehicle with gp_id, vehicle_no, imei, and name
  addVehicle: (vehicleData) => {
    return apiClient.post('/gps/vehicles', {
      gp_id: vehicleData.gp_id,
      vehicle_no: vehicleData.vehicle_no,
      imei: vehicleData.imei,
      name: vehicleData.name || ''
    });
  },

  // Update vehicle (gp_id, vehicle_no, imei, name)
  updateVehicle: (vehicleId, vehicleData) => {
    return apiClient.put(`/gps/vehicles/${vehicleId}`, {
      gp_id: vehicleData.gp_id,
      vehicle_no: vehicleData.vehicle_no,
      imei: vehicleData.imei,
      name: vehicleData.name || ''
    });
  },

  // Delete vehicle
  deleteVehicle: (vehicleId) => {
    return apiClient.delete(`/gps/vehicles/${vehicleId}`);
  },
};

export const annualSurveysAPI = {
  getSurvey: (id) => apiClient.get(`/annual-surveys/${id}`),
  addsurvey: (data) => apiClient.post('/annual-surveys/fill', data),
  updateSurvey: (id, data) => apiClient.put(`/annual-surveys/${id}`, data),
  listSurveys: (params = {}) => {
    const q = new URLSearchParams();
    if (params.skip != null) q.append('skip', params.skip);
    if (params.limit != null) q.append('limit', params.limit);
    if (params.district_id != null) q.append('district_id', params.district_id);
    if (params.gp_id != null) q.append('gp_id', params.gp_id);
    if (params.fy_id != null) q.append('fy_id', params.fy_id);
    if (params.block_id != null) q.append('block_id', params.block_id);
    return apiClient.get(`/annual-surveys/?${q.toString()}`);
  },
  analyticsState: (params = {}) => apiClient.get('/annual-surveys/analytics/state', { params }),
  analyticsDistrict: (districtId, params = {}) =>
    apiClient.get(`/annual-surveys/analytics/district/${districtId}`, { params }),
  analyticsBlock: (blockId, params = {}) =>
    apiClient.get(`/annual-surveys/analytics/block/${blockId}`, { params }),
  analyticsGP: (gpId, params = {}) =>
    apiClient.get(`/annual-surveys/analytics/gp/${gpId}`, { params }),
};


export const feedbackAPI = {
  // Get feedback statistics
  getStats: () => apiClient.get('/feedback/stats/summary'),

  // Get all feedbacks (authority users only)
  getFeedbacks: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.feedback_source) queryParams.append('feedback_source', params.feedback_source);
    if (params.skip !== undefined) queryParams.append('skip', params.skip);
    if (params.limit !== undefined) queryParams.append('limit', 100);
    return apiClient.get(`/feedback/?${queryParams.toString()}`);
  },

  // Get feedback by ID (authority users only)
  getFeedbackById: (feedbackId) => apiClient.get(`/feedback/${feedbackId}`),

  // Get authenticated user's own feedback
  getMyFeedback: () => apiClient.get('/feedback/my'),

  // Create new feedback
  createFeedback: (feedbackData) => {
    return apiClient.post('/feedback/', {
      comment: feedbackData.comment,
      rating: feedbackData.rating
    });
  },

  // Update authenticated user's own feedback
  updateMyFeedback: (feedbackData) => {
    return apiClient.put('/feedback/my', {
      comment: feedbackData.comment,
      rating: feedbackData.rating
    });
  },
};

export const villagesAPI = {
  // Get villages (optionally by gp_id)
  getVillages: (gp_id) => {
    return apiClient.get('/geography/villages', {
      params: { gp_id }
    });
  },

  // Create village
  createVillage: (villageData) => {
    return apiClient.post('/geography/villages', {
      name: villageData.name,
      gp_id: villageData.gp_id,
      description: villageData.description || ''
    });
  },
};

// Attendance API
export const attendanceAPI = {
  analytics: (params = {}) => apiClient.get('/attendance/analytics', { params }),
  overview: (params = {}) => apiClient.get('/attendance/overview', { params }),
  daySummary: (params = {}) => apiClient.get('/attendance/day-summary', { params }),
};

// Inspections API
export const inspectionsAPI = {
  analytics: (params = {}) => apiClient.get('/inspections/analytics', { params }),
  performanceReport: (params = {}) => apiClient.get('/inspections/performance-report', { params }),
};

// Contractor Analytics API
export const contractorAnalyticsAPI = {
  getState: () => apiClient.get('/contractor-analytics/analytics/state'),
  getDistrict: (districtId) => apiClient.get(`/contractor-analytics/analytics/district/${districtId}`),
  getBlock: (blockId) => apiClient.get(`/contractor-analytics/analytics/block/${blockId}`),
  getGP: (gpId) => apiClient.get(`/contractor-analytics/analytics/gp/${gpId}`),
};

export default apiClient;
