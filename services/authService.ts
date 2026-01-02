/**
 * Authentication Service
 * Handles user authentication with the backend
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    msg: string | string[]; // Can be a string or array of validation errors
    authtoken?: string;
    userId?: string;
    email?: string;
    username?: string;
    role?: string;
  };
}

/**
 * Login user with email and password
 */
export const login = async (credentials: LoginRequest): Promise<AuthResponse> => {
  console.log('🔐 [AUTH_SERVICE] Attempting login for:', credentials.email);
  
  try {
    const response = await fetch(`${API_BASE}/accounts/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(credentials),
    });

    const result = await response.json();
    
    if (!response.ok || !result.success) {
      console.error('❌ [AUTH_SERVICE] Login failed:', {
        status: response.status,
        result
      });
      
      // Format error message (handle array of validation errors)
      if (result.data?.msg) {
        if (Array.isArray(result.data.msg)) {
          result.data.msg = result.data.msg.join(', ');
        }
      }
      
      return result;
    }

    console.log('✅ [AUTH_SERVICE] Login successful:', {
      success: result.success,
      hasToken: !!result.data?.authtoken,
      msg: result.data?.msg
    });

    return result;
  } catch (error) {
    console.error('❌ [AUTH_SERVICE] Network/Parse error:', error);
    return {
      success: false,
      data: {
        msg: error instanceof Error ? error.message : 'Network error. Please check your connection.',
      },
    };
  }
};



/**
 * Logout user (clear session)
 */
export const logout = async (): Promise<{ success: boolean; msg?: string }> => {
  try {
    // Optionally call backend logout endpoint if it exists
    // await fetch(`${API_BASE}/accounts/logout`, {
    //   method: 'GET',
    //   credentials: 'include',
    // });

    return { success: true };
  } catch (error) {
    console.error('❌ [AUTH_SERVICE] Logout error:', error);
    return {
      success: false,
      msg: error instanceof Error ? error.message : 'Failed to logout',
    };
  }
};

// -------------------- Auth helpers --------------------
/** Get stored JWT token (if any) */
export const getToken = (): string | null => {
  // Token is managed by the backend via HTTP-only cookies
  return null;
};

/** Get stored user object (if any) */
export const getUser = (): { id: string; email?: string; name?: string } | null => {
  // User data should be fetched from backend or managed by context
  return null;
};

/** Convenience: build auth headers */
export const getAuthHeaders = (extra?: Record<string, string>) => {
  const token = getToken();
  const headers: Record<string, string> = Object.assign({ 'Content-Type': 'application/json' }, extra || {});
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

/** Wrapper around fetch that injects Authorization header and default options */
export const authFetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
  const token = getToken();
  const headers = Object.assign({}, init.headers || {}, token ? { Authorization: `Bearer ${token}` } : {});

  const merged: RequestInit = Object.assign({}, init, { headers, credentials: init.credentials ?? 'include' });
  return fetch(input, merged);
};

export default {
  login,
  logout,
  getToken,
  getUser,
  getAuthHeaders,
  authFetch,
};
