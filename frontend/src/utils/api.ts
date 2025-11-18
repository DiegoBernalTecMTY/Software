/**
 * MNA API Client
 * Connects to the Flask backend at http://localhost:5000
 * NO MOCK DATA - Always uses real backend
 */

// Configuration
const API_BASE_URL: string = (import.meta.env && import.meta.env.VITE_API_BASE) || 'http://localhost:5000';

// Disable mock data in frontend — always use real backend
const USE_MOCK_DATA = false;

// Declarations for optional mock objects (present in demo/figma code).
// Keeping these declarations prevents TypeScript compile errors when
// `USE_MOCK_DATA` branches exist but mock implementations are not included.
declare const mockApi: any;
declare const mockUser: any;
// Session management
let _currentSessionId: string | null = null;

export function setSessionId(sessionId: string | null) {
  _currentSessionId = sessionId;
  if (sessionId) {
    localStorage.setItem('mna_session_id', sessionId);
  } else {
    localStorage.removeItem('mna_session_id');
  }
}

export function getSessionId(): string | null {
  if (_currentSessionId) return _currentSessionId;
  _currentSessionId = localStorage.getItem('mna_session_id');
  return _currentSessionId;
}

// Type definitions matching the API contract
export interface Usuario {
  objectId?: string;
  email: string;
  nombre: string;
  instrucciones_agente?: string; // Reglas y hábitos personalizados para el agente IA
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
  notificacion?: {
    activa: boolean;
    mensaje?: string;
    tiempo_anticipacion?: number; // minutos antes de la cita
  };
  owner?: string;
  created?: string;
  updated?: string;
}

export interface Notificacion {
  objectId?: string;
  ownerId?: string;
  citaObjectId: string;
  channel?: 'in_app' | 'email' | 'push';
  schedule_at?: string; // ISO UTC
  reminder_offset?: number;
  message?: string;
  repeat?: any;
  sent?: boolean;
  sent_at?: string;
  attempts?: number;
  metadata?: any;
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
  exito: boolean;
  respuesta: string;
  mensaje?: string;
  resultado?: Cita | any;
  session_id?: string;
}

export interface ApiError {
  code?: number;
  message: string;
}

/**
 * Normalize a date value coming from the backend or mock data into
 * a canonical `YYYY-MM-DD` string the calendar expects.
 * Accepts: numeric timestamps (ms), numeric strings, ISO strings, or
 * already-correct `YYYY-MM-DD` strings.
 */
function normalizeFecha(value: any): string {
  if (value === null || value === undefined || value === '') return '';

  // number (ms since epoch)
  if (typeof value === 'number') {
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    return '';
  }

  // numeric string timestamp
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^\d+$/.test(trimmed)) {
      const n = parseInt(trimmed, 10);
      const d = new Date(n);
      if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    }

    // ISO-like string or full datetime
    const d2 = new Date(trimmed);
    if (!isNaN(d2.getTime())) return d2.toISOString().slice(0, 10);

    // Already YYYY-MM-DD?
    const m = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  }

  return '';
}

/**
 * Ensure a Cita object has a normalized `fecha` field.
 */
function normalizeCita(cita: Cita): Cita {
  return {
    ...cita,
    fecha: normalizeFecha((cita as any).fecha) || cita.fecha || '',
  };
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
  const headersObj: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Normalize options.headers (Headers | [string,string][] | Record<string,string>) into a plain object
  if (options.headers) {
    if (typeof Headers !== 'undefined' && options.headers instanceof Headers) {
      (options.headers as Headers).forEach((value, key) => {
        headersObj[key] = value;
      });
    } else if (Array.isArray(options.headers)) {
      (options.headers as [string, string][]).forEach(([k, v]) => {
        headersObj[k] = v;
      });
    } else {
      Object.assign(headersObj, options.headers as Record<string, string>);
    }
  }

  if (token) {
    headersObj['user-token'] = token;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: headersObj,
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
    if (USE_MOCK_DATA) {
      return mockApi.register(payload);
    }
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
    if (USE_MOCK_DATA) {
      const response = await mockApi.login(payload);
      setAuthToken(response['user-token']);
      setUserData({
        objectId: response.objectId,
        email: response.email,
        nombre: response.nombre,
        instrucciones_agente: mockUser?.instrucciones_agente,
      });
      return response;
    }
    
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
    if (USE_MOCK_DATA) {
      clearAuthToken();
      return;
    }
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
    if (USE_MOCK_DATA) {
      const response = await mockApi.updateUser(id, payload);
      const currentUser = getUserData();
      if (currentUser) {
        setUserData({ ...currentUser, ...response });
      }
      return response;
    }
    
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

  /**
   * Change user password
   * PUT /users/{id}/password
   */
  changePassword: async (
    id: string, 
    currentPassword: string, 
    newPassword: string
  ): Promise<{ message: string }> => {
    if (USE_MOCK_DATA) {
      return mockApi.changePassword();
    }
    return apiFetch<{ message: string }>(`/users/${id}/password`, {
      method: 'PUT',
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
    });
  },
};

/**
 * Citas API
 */
export const citasApi = {
  // Create a new cita
  create: async (payload: Partial<Cita>): Promise<Cita> => {
    if (USE_MOCK_DATA) {
      return mockApi.createCita(payload);
    }
    const resp = await apiFetch<Cita>(`/data/Cita`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeCita(resp);
  },

  /**
   * Get list of citas.
   * This is the MODIFIED function.
   * It now ALWAYS filters by the logged-in user's objectId and combines
   * any additional queries from the agent.
   */
  list: async (where?: string): Promise<Cita[]> => {
    if (USE_MOCK_DATA) {
      return mockApi.listCitas();
    }

    // 1. Get the current user's data from localStorage.
    const currentUser = getUserData();

    // 2. If there is no logged-in user, return an empty array to prevent data leaks.
    if (!currentUser || !currentUser.objectId) {
      console.warn("citasApi.list called without a logged-in user. Returning empty list.");
      return [];
    }

    // 3. ALWAYS start by creating the mandatory filter for the logged-in user.
    const ownerIdFilter = `ownerId = '${currentUser.objectId}'`;

    // 4. Combine it with any additional 'where' clause provided by the agent.
    let finalWhere = ownerIdFilter;
    if (where) {
      // If the agent wants to filter too, combine them with AND.
      finalWhere = `${ownerIdFilter} AND (${where})`;
    }

    // 5. Build the final query and make the API call.
    const queryParams = `?where=${encodeURIComponent(finalWhere)}`;
    const resp = await apiFetch<Cita[]>(`/data/Cita${queryParams}`, {
      method: 'GET',
    });
    return resp.map(normalizeCita);
  },

  /**
   * Get a single cita by ID
   * GET /data/Cita/{id}
   */
  get: async (id: string): Promise<Cita> => {
    if (USE_MOCK_DATA) {
      const c = await mockApi.getCita(id);
      return normalizeCita(c);
    }
    const resp = await apiFetch<Cita>(`/data/Cita/${id}`, {
      method: 'GET',
    });
    return normalizeCita(resp);
  },

  /**
   * Update a cita
   * PUT /data/Cita/{id}
   */
  update: async (id: string, payload: Partial<Cita>): Promise<Cita> => {
    if (USE_MOCK_DATA) {
      const c = await mockApi.updateCita(id, payload);
      return normalizeCita(c);
    }
    const resp = await apiFetch<Cita>(`/data/Cita/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return normalizeCita(resp);
  },

  /**
   * Delete a cita
   * DELETE /data/Cita/{id}
   */
  delete: async (id: string): Promise<void> => {
    if (USE_MOCK_DATA) {
      return mockApi.deleteCita(id);
    }
    return apiFetch<void>(`/data/Cita/${id}`, {
      method: 'DELETE',
    });
  },
};

/**
 * Notificaciones API
 */
export const notificacionesApi = {
  list: async (where?: string): Promise<Notificacion[]> => {
    if (USE_MOCK_DATA) {
      return mockApi.listNotificaciones();
    }
    const queryParams = where ? `?where=${encodeURIComponent(where)}` : '';
    return apiFetch<Notificacion[]>(`/data/notificaciones${queryParams}`, {
      method: 'GET',
    });
  },

  get: async (id: string): Promise<Notificacion> => {
    if (USE_MOCK_DATA) {
      return mockApi.getNotificacion(id);
    }
    return apiFetch<Notificacion>(`/data/notificaciones/${id}`, {
      method: 'GET',
    });
  },

  delete: async (id: string): Promise<void> => {
    if (USE_MOCK_DATA) {
      return mockApi.deleteNotificacion(id);
    }
    return apiFetch<void>(`/data/notificaciones/${id}`, {
      method: 'DELETE',
    });
  },
  /**
   * Create a new notification record
   * POST /data/notificaciones
   */
  create: async (payload: Partial<Notificacion>): Promise<Notificacion> => {
    if (USE_MOCK_DATA) {
      return mockApi.createNotificacion(payload);
    }
    return apiFetch<Notificacion>(`/data/notificaciones`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

/**
 * Command API (Natural Language Processing via AI Agent)
 */
export const commandApi = {
  /**
   * Process a natural language command via the new ai_agent with session management
   * POST /api/ai/text
   */
  process: async (texto: string): Promise<CommandResponse> => {
    const sessionId = getSessionId();
    const body: any = { text: texto };
    if (sessionId) {
      body.session_id = sessionId;
    }
    
    const response = await apiFetch<CommandResponse>('/api/ai/text', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    
    // Update session ID if returned from backend
    if (response.session_id) {
      setSessionId(response.session_id);
    }
    
    return response;
  },

  /**
   * Process a command and optionally request server-side execution (confirm=true)
   */
  processWithConfirm: async (texto: string, confirm: boolean = false): Promise<CommandResponse> => {
    const sessionId = getSessionId();
    const body: any = { text: texto, confirm };
    if (sessionId) {
      body.session_id = sessionId;
    }
    
    const response = await apiFetch<CommandResponse>('/api/ai/text', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    
    // Update session ID if returned from backend
    if (response.session_id) {
      setSessionId(response.session_id);
    }
    
    return response;
  },

  /**
   * Create a new conversation session
   */
  createSession: async (): Promise<{ session_id: string }> => {
    return apiFetch<{ session_id: string }>('/api/session/create', {
      method: 'POST',
    });
  },

  /**
   * Get session information
   */
  getSession: async (sessionId: string): Promise<any> => {
    return apiFetch<any>(`/api/session/${sessionId}`, {
      method: 'GET',
    });
  },

  /**
   * Get conversation history
   */
  getHistory: async (sessionId: string): Promise<any> => {
    return apiFetch<any>(`/api/session/${sessionId}/history`, {
      method: 'GET',
    });
  },
};

export default {
  auth: authApi,
  citas: citasApi,
  notificaciones: notificacionesApi,
  command: commandApi,
};
