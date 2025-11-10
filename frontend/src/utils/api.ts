/**
 * MNA API Client
 * Handles all API communication with the Backendless backend
 * via the Flask proxy at http://localhost:5000
 */

const API_BASE_URL = 'http://localhost:5000';

// Type definitions matching the API contract
export interface Usuario {
  objectId?: string;
  email: string;
  nombre: string;
  created?: string;
  updated?: string;
}

export interface Cita {
  objectId?: string;
  titulo: string;
  fecha: string; // YYYY-MM-DD
  hora_inicio: string; // HH:MM
  lugar: string;
  descripcion?: string;
  owner?: string;
  created?: string;
  updated?: string;
}

export interface LoginResponse {
  objectId: string;
  email: string;
  nombre: string;
  'user-token': string;
}

export interface CommandResponse {
  mensaje: string;
  resultado?: Cita | any;
}

export interface ApiError {
  code?: number;
  message: string;
}

/**
 * Get the stored auth token
 */
export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('user-token');
  }
  return null;
}

/**
 * Store auth token
 */
export function setAuthToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user-token', token);
  }
}

/**
 * Clear auth token
 */
export function clearAuthToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user-token');
    localStorage.removeItem('user-data');
  }
}

/**
 * Get stored user data
 */
export function getUserData(): Usuario | null {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem('user-data');
    return data ? JSON.parse(data) : null;
  }
  return null;
}

/**
 * Store user data
 */
export function setUserData(user: Usuario): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user-data', JSON.stringify(user));
  }
}

/**
 * Base fetch wrapper with auth header injection
 */
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['user-token'] = token;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        code: response.status,
        message: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
      } as ApiError;
    }

    return await response.json();
  } catch (error: any) {
    if (error.code) {
      throw error;
    }
    throw {
      code: 0,
      message: error.message || 'Error de conexión. Por favor, verifica tu conexión a internet.',
    } as ApiError;
  }
}

/**
 * Auth API
 */
export const authApi = {
  /**
   * Register a new user
   * POST /users/register
   */
  register: async (payload: {
    email: string;
    password: string;
    nombre: string;
  }): Promise<Usuario> => {
    return apiFetch<Usuario>('/users/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Login user
   * POST /users/login
   */
  login: async (payload: {
    login: string;
    password: string;
  }): Promise<LoginResponse> => {
    const response = await apiFetch<LoginResponse>('/users/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    
    // Store token and user data
    if (response['user-token']) {
      setAuthToken(response['user-token']);
      setUserData({
        objectId: response.objectId,
        email: response.email,
        nombre: response.nombre,
      });
    }
    
    return response;
  },

  /**
   * Logout user
   * GET /users/logout
   */
  logout: async (): Promise<void> => {
    await apiFetch<void>('/users/logout', {
      method: 'GET',
    });
    clearAuthToken();
  },

  /**
   * Update user profile
   * PUT /users/{id}
   */
  updateUser: async (id: string, payload: Partial<Usuario>): Promise<Usuario> => {
    const response = await apiFetch<Usuario>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    
    // Update stored user data
    const currentUser = getUserData();
    if (currentUser) {
      setUserData({ ...currentUser, ...response });
    }
    
    return response;
  },
};

// Helpers
function normalizeFecha(value: any): string {
  // Backend may return numeric timestamp (ms) or ISO string. Normalize to YYYY-MM-DD.
  if (!value && value !== 0) return '';
  const asNumber = typeof value === 'number' ? value : (typeof value === 'string' && /^\d+$/.test(value) ? parseInt(value, 10) : NaN);
  if (!Number.isNaN(asNumber)) {
    const d = new Date(asNumber);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  try {
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  } catch (e) {}
  return String(value);
}

/**
 * Citas API
 */
export const citasApi = {
  /**
   * Create a new cita
   * POST /data/Cita
   */
  create: async (payload: {
    titulo: string;
    fecha: string;
    hora_inicio: string;
    lugar: string;
    descripcion?: string;
  }): Promise<Cita> => {
    const res = await apiFetch<Cita>('/data/Cita', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res && (res as any).fecha) (res as any).fecha = normalizeFecha((res as any).fecha);
    return res;
  },

  /**
   * Get list of citas
   * GET /data/Cita?where=...
   */
  list: async (where?: string): Promise<Cita[]> => {
    // If caller provided a where clause, use it. Otherwise, restrict to current user's citas.
    let queryWhere = where;
    const currentUser = getUserData();
    if (!queryWhere) {
      if (currentUser && currentUser.objectId) {
        // Prefer filtering by ownerId which Backendless sets for the record owner.
        queryWhere = `ownerId='${currentUser.objectId}'`;
      } else {
        // No logged user -> return empty list rather than all citas
        return [];
      }
    }
    const queryParams = queryWhere ? `?where=${encodeURIComponent(queryWhere)}` : '';
    const res = await apiFetch<Cita[]>(`/data/Cita${queryParams}`, {
      method: 'GET',
    });
    if (Array.isArray(res)) {
      return res.map((c) => ({ ...c, fecha: normalizeFecha((c as any).fecha) }));
    }
    return res;
  },

  /**
   * Get a single cita by ID
   * GET /data/Cita/{id}
   */
  get: async (id: string): Promise<Cita> => {
    const res = await apiFetch<Cita>(`/data/Cita/${id}`, {
      method: 'GET',
    });
    if (res && (res as any).fecha) (res as any).fecha = normalizeFecha((res as any).fecha);
    return res;
  },

  /**
   * Update a cita
   * PUT /data/Cita/{id}
   */
  update: async (id: string, payload: Partial<Cita>): Promise<Cita> => {
    const res = await apiFetch<Cita>(`/data/Cita/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (res && (res as any).fecha) (res as any).fecha = normalizeFecha((res as any).fecha);
    return res;
  },

  /**
   * Delete a cita
   * DELETE /data/Cita/{id}
   */
  delete: async (id: string): Promise<void> => {
    return apiFetch<void>(`/data/Cita/${id}`, {
      method: 'DELETE',
    });
  },
};

/**
 * Command API (Natural Language Processing)
 */
export const commandApi = {
  /**
   * Process a natural language command
   * POST /data/Comando
   */
  process: async (texto: string): Promise<CommandResponse> => {
    return apiFetch<CommandResponse>('/data/Comando', {
      method: 'POST',
      body: JSON.stringify({ texto }),
    });
  },
};

export default {
  auth: authApi,
  citas: citasApi,
  command: commandApi,
};
