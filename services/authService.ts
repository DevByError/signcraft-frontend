/**
 * Authentication Service
 * Handles user authentication with the backend
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    msg?: string | string[];
    authtoken?: string;
    userId?: string;
    email?: string;
    username?: string;
    role?: string;
  };
}

/**
 * 1. Login user
 */
export const login = async (credentials: LoginRequest): Promise<AuthResponse> => {
  console.log('🔐 [AUTH_SERVICE] Attempting login for:', credentials.email);

  try {
    const response = await fetch(`${API_BASE}/accounts/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // ✅ Critical: Sends/Receives cookies
      body: JSON.stringify(credentials),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      // Restore error formatting from old code
      if (result.data?.msg && Array.isArray(result.data.msg)) {
        result.data.msg = result.data.msg.join(', ');
      }
      return result;
    }

    return result;
  } catch (error) {
    console.error('❌ [AUTH_SERVICE] Network error:', error);
    return { success: false, data: { msg: 'Network error. Please check your connection.' } };
  }
};

/**
 * 2. Verify Session (The Fix)
 * Calls backend to see if HttpOnly cookie is valid
 */
export const verifySession = async (): Promise<UserProfile | null> => {
  try {
    const response = await fetch(`${API_BASE}/accounts/profile`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // ✅ Critical: Sends the HttpOnly cookie
    });

    // If 401, simply return null (not logged in)
    if (response.status === 401 || response.status === 403) {
      return null;
    }

    const result = await response.json();

    if (response.ok && result.success && result.data) {
      return {
        id: result.data.userId,
        email: result.data.email,
        name: result.data.username,
        role: result.data.role || 'designer'
      };
    }
    return null;
  } catch (error) {
    return null;
  }
};

/**
 * 3. Logout
 */
export const logout = async (): Promise<{ success: boolean; msg?: string }> => {
  try {
    await fetch(`${API_BASE}/accounts/logout`, {
      method: 'GET',
      credentials: 'include',
    });
    localStorage.removeItem('user_cache'); // Clear cache
    return { success: true };
  } catch (error) {
    return { success: false, msg: 'Logout failed' };
  }
};

/** 
 * 4. Get user from LocalStorage (Sync fallback for UI flickering)
 */
export const getUser = (): UserProfile | null => {
  const u = localStorage.getItem('user_cache');
  return u ? JSON.parse(u) : null;
};

// -------------------- Legacy Helpers (Kept for compatibility) --------------------

/** 
 * Get stored JWT token
 * Returns null because we now use HttpOnly cookies.
 * Kept so other files calling this don't crash.
 */
export const getToken = (): string | null => {
  return null;
};

/** 
 * Build auth headers 
 * Adjusted to just return Content-Type, since Auth is now handled by Cookies
 */
export const getAuthHeaders = (extra?: Record<string, string>) => {
  return Object.assign({ 'Content-Type': 'application/json' }, extra || {});
};

/** 
 * Wrapper around fetch
 * ✅ UPDATED: Forces credentials: 'include' so your other API calls (designs, playlists) works
 */
export const authFetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
  // We don't need to manually inject Bearer token anymore
  // But we MUST ensure credentials are set to 'include'
  const merged: RequestInit = Object.assign({}, init, {
    credentials: 'include',
    headers: Object.assign({}, init.headers || {}, { 'Content-Type': 'application/json' })
  });

  return fetch(input, merged);
};

export default {
  login,
  logout,
  verifySession,
  getUser,
  getToken,
  getAuthHeaders,
  authFetch,
};