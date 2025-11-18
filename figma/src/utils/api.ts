/**
 * MNA API Client
 * Handles all API communication with the Backendless backend
 * via the Flask proxy at http://localhost:5000
 * 
 * IMPORTANT: By default, this uses MOCK DATA for development/demo.
 * To connect to a real backend:
 * 1. Set USE_MOCK_DATA = false
 * 2. Ensure your backend is running at API_BASE_URL
 * 3. Verify all endpoints match the API specification
 */

// Configuration
const API_BASE_URL = 'http://localhost:5000';

// ============================================================
// MOCK MODE CONFIGURATION
// ============================================================
// Set to true: Use mock data (no backend needed - DEMO MODE)
// Set to false: Connect to real backend at API_BASE_URL
// ============================================================
const USE_MOCK_DATA = false;
// ============================================================

// Mock data storage (simulates a database)
let mockCitas: Cita[] = [
  {
    objectId: '1',
    titulo: 'Cita con dentista',
    fecha: '2025-11-20',
    hora_inicio: '10:00',
    lugar: 'Clínica Dental Centro',
    descripcion: 'Revisión anual y limpieza',
    notificacion: {
      activa: true,
      mensaje: 'Tu cita con el dentista es en 30 minutos',
      tiempo_anticipacion: 30,
    },
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  {
    objectId: '2',
    titulo: 'Reunión con equipo',
    fecha: '2025-11-18',
    hora_inicio: '14:00',
    lugar: 'Oficina - Sala de Juntas',
    descripcion: 'Planificación del proyecto Q1 2026',
    notificacion: {
      activa: true,
      mensaje: 'Reunión de equipo en 15 minutos',
      tiempo_anticipacion: 15,
    },
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  {
    objectId: '3',
    titulo: 'Cita médica general',
    fecha: '2025-11-25',
    hora_inicio: '09:30',
    lugar: 'Hospital Central',
    descripcion: 'Chequeo médico rutinario',
    notificacion: {
      activa: true,
      mensaje: 'Recordatorio: Cita médica en 1 hora',
      tiempo_anticipacion: 60,
    },
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
];

let mockUser: Usuario | null = {
  objectId: 'mock-user-123',
  email: 'usuario@demo.com',
  nombre: 'Usuario Demo',
  instrucciones_agente: '• Prefiero citas por la mañana entre 9am-12pm\n• Las citas médicas siempre en Hospital Central\n• Recordatorios de 1 hora para citas médicas\n• No agendar los viernes por la tarde',
  created: new Date().toISOString(),
  updated: new Date().toISOString(),
};

let mockToken = 'mock-token-' + Date.now();

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
 * Mock API Functions
 * These simulate backend operations for development/demo
 */
const mockDelay = () => new Promise(resolve => setTimeout(resolve, 300));

const mockApi = {
  // Auth operations
  register: async (payload: { email: string; password: string; nombre: string }): Promise<Usuario> => {
    await mockDelay();
    mockUser = {
      objectId: 'user-' + Date.now(),
      email: payload.email,
      nombre: payload.nombre,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    };
    mockToken = 'token-' + Date.now();
    return mockUser;
  },

  login: async (payload: { login: string; password: string }): Promise<LoginResponse> => {
    await mockDelay();
    if (!mockUser) {
      throw { code: 401, message: 'Usuario no encontrado' } as ApiError;
    }
    mockToken = 'token-' + Date.now();
    return {
      objectId: mockUser.objectId!,
      email: mockUser.email,
      nombre: mockUser.nombre,
      'user-token': mockToken,
    };
  },

  updateUser: async (id: string, payload: Partial<Usuario>): Promise<Usuario> => {
    await mockDelay();
    if (!mockUser) {
      throw { code: 404, message: 'Usuario no encontrado' } as ApiError;
    }
    mockUser = { ...mockUser, ...payload, updated: new Date().toISOString() };
    return mockUser;
  },

  changePassword: async (): Promise<{ message: string }> => {
    await mockDelay();
    return { message: 'Password updated successfully' };
  },

  // Citas operations
  createCita: async (payload: any): Promise<Cita> => {
    await mockDelay();
    const newCita: Cita = {
      ...payload,
      objectId: 'cita-' + Date.now(),
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    };
    mockCitas.push(newCita);
    return newCita;
  },

  listCitas: async (): Promise<Cita[]> => {
    await mockDelay();
    return [...mockCitas].sort((a, b) => {
      const dateA = new Date(a.fecha + 'T' + a.hora_inicio);
      const dateB = new Date(b.fecha + 'T' + b.hora_inicio);
      return dateA.getTime() - dateB.getTime();
    });
  },

  getCita: async (id: string): Promise<Cita> => {
    await mockDelay();
    const cita = mockCitas.find(c => c.objectId === id);
    if (!cita) {
      throw { code: 404, message: 'Cita no encontrada' } as ApiError;
    }
    return cita;
  },

  updateCita: async (id: string, payload: Partial<Cita>): Promise<Cita> => {
    await mockDelay();
    const index = mockCitas.findIndex(c => c.objectId === id);
    if (index === -1) {
      throw { code: 404, message: 'Cita no encontrada' } as ApiError;
    }
    mockCitas[index] = {
      ...mockCitas[index],
      ...payload,
      updated: new Date().toISOString(),
    };
    return mockCitas[index];
  },

  deleteCita: async (id: string): Promise<void> => {
    await mockDelay();
    const index = mockCitas.findIndex(c => c.objectId === id);
    if (index === -1) {
      throw { code: 404, message: 'Cita no encontrada' } as ApiError;
    }
    mockCitas.splice(index, 1);
  },

  // Command processing
  processCommand: async (texto: string): Promise<CommandResponse> => {
    await mockDelay();
    
    // Simple command parsing for demo
    const lower = texto.toLowerCase();
    
    // Parse date
    let fecha = new Date();
    if (lower.includes('mañana')) {
      fecha.setDate(fecha.getDate() + 1);
    } else if (lower.includes('próximo') || lower.includes('proximo')) {
      fecha.setDate(fecha.getDate() + 7);
    }
    
    // Parse time
    let hora = '10:00';
    const timeMatch = texto.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = timeMatch[2] || '00';
      const meridiem = timeMatch[3]?.toLowerCase();
      
      if (meridiem === 'pm' && hours < 12) hours += 12;
      if (meridiem === 'am' && hours === 12) hours = 0;
      
      hora = `${hours.toString().padStart(2, '0')}:${minutes}`;
    }
    
    // Extract title
    let titulo = 'Nueva cita';
    if (lower.includes('dentista')) titulo = 'Cita con dentista';
    else if (lower.includes('médico') || lower.includes('medico')) titulo = 'Cita médica';
    else if (lower.includes('reunión') || lower.includes('reunion')) titulo = 'Reunión';
    
    const resultado: Cita = {
      titulo,
      fecha: fecha.toISOString().split('T')[0],
      hora_inicio: hora,
      lugar: 'Por definir',
      descripcion: '',
    };
    
    return {
      exito: true,
      respuesta: `He interpretado tu comando. ¿Quieres crear esta cita?`,
      mensaje: `Cita "${titulo}" para el ${resultado.fecha} a las ${hora}`,
      resultado,
    };
  },
};

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
    if (USE_MOCK_DATA) {
      return mockApi.createCita(payload);
    }
    return apiFetch<Cita>('/data/Cita', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Get list of citas
   * GET /data/Cita?where=...
   */
  list: async (where?: string): Promise<Cita[]> => {
    if (USE_MOCK_DATA) {
      return mockApi.listCitas();
    }
    const queryParams = where ? `?where=${encodeURIComponent(where)}` : '';
    return apiFetch<Cita[]>(`/data/Cita${queryParams}`, {
      method: 'GET',
    });
  },

  /**
   * Get a single cita by ID
   * GET /data/Cita/{id}
   */
  get: async (id: string): Promise<Cita> => {
    if (USE_MOCK_DATA) {
      return mockApi.getCita(id);
    }
    return apiFetch<Cita>(`/data/Cita/${id}`, {
      method: 'GET',
    });
  },

  /**
   * Update a cita
   * PUT /data/Cita/{id}
   */
  update: async (id: string, payload: Partial<Cita>): Promise<Cita> => {
    if (USE_MOCK_DATA) {
      return mockApi.updateCita(id, payload);
    }
    return apiFetch<Cita>(`/data/Cita/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
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
 * Command API (Natural Language Processing)
 */
export const commandApi = {
  /**
   * Process a natural language command
   * POST /data/Comando
   */
  process: async (texto: string): Promise<CommandResponse> => {
    if (USE_MOCK_DATA) {
      return mockApi.processCommand(texto);
    }
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
