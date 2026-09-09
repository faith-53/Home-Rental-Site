const API = "https://home-rental-site.onrender.com";

const getToken = () => localStorage.getItem('token');

export const api = {
  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      ...options.headers,
    };
    
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const url = `${API}${endpoint}`;
      console.log('Making request to:', url, options);
      
      const response = await fetch(url, { 
        ...options, 
        headers,
        credentials: 'include',
        cache: 'no-store'
      });
      
      console.log('Response status:', response.status);
      
      // Try to parse JSON, but handle cases where response might be empty
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = text ? { message: text } : {};
      }

      if (!response.ok) {
        // Create a plain Error object with no extra properties
        const error = new Error(data?.message || `Request failed with status ${response.status}`);
        error.status = response.status;
        error.data = data;
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      
      // If it's already our error object, just rethrow it
      if (error.status) {
        throw error;
      }
      
      // Otherwise, create a new error without any Express references
      const newError = new Error(error.message || 'Network error');
      newError.status = 0;
      newError.data = { message: error.message };
      throw newError;
    }
  },

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },
  
  post(endpoint, body) {
    return this.request(endpoint, { 
      method: 'POST', 
      body: JSON.stringify(body)
    });
  },
  
  put(endpoint, body) {
    return this.request(endpoint, { 
      method: 'PUT', 
      body: JSON.stringify(body) 
    });
  },
  
  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
};
