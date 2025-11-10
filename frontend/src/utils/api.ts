// Minimal API client based on api.yaml
const API_BASE_URL = (typeof window !== 'undefined' && localStorage.getItem('apiBase')) || 'http://localhost:5000'

export interface Usuario { objectId?: string; email: string; nombre: string }
export interface Cita { objectId?: string; titulo: string; fecha: string; hora_inicio: string; lugar?: string; descripcion?: string }
export interface LoginResponse { objectId: string; email: string; nombre: string; 'user-token': string }
export interface CommandResponse { mensaje: string; resultado?: Cita }

function getAuthToken(): string | null { if (typeof window !== 'undefined') return localStorage.getItem('user-token'); return null }
function setAuthToken(t: string) { if (typeof window !== 'undefined') localStorage.setItem('user-token', t) }
function setUserData(u: Usuario) { if (typeof window !== 'undefined') localStorage.setItem('user-data', JSON.stringify(u)) }
export function getUserData(): Usuario | null { if (typeof window !== 'undefined') { const d = localStorage.getItem('user-data'); return d ? JSON.parse(d) : null } return null }
function clearAuth() { if (typeof window !== 'undefined') { localStorage.removeItem('user-token'); localStorage.removeItem('user-data') } }

async function apiFetch<T>(endpoint: string, opts: RequestInit = {}): Promise<T> {
  const headers: Record<string,string> = { 'Content-Type': 'application/json', ...(opts.headers as any || {}) }
  const token = getAuthToken()
  if (token) headers['user-token'] = token
  const res = await fetch(`${API_BASE_URL}${endpoint}`, { ...opts, headers })
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new Error(`HTTP ${res.status} ${txt}`)
  }
  const text = await res.text()
  try { return JSON.parse(text) } catch { return text as unknown as T }
}

export const authApi = {
  register: async (payload: { email: string; password: string; nombre: string }) => apiFetch<Usuario>('/users/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: async (payload: { login: string; password: string }) => {
    const res = await apiFetch<LoginResponse>('/users/login', { method: 'POST', body: JSON.stringify(payload) })
    if (res['user-token']) setAuthToken(res['user-token'])
    setUserData({ objectId: res.objectId, email: res.email, nombre: res.nombre })
    return res
  },
  logout: async () => { await apiFetch('/users/logout', { method: 'GET' }); clearAuth() },
  updateUser: async (id: string, payload: Partial<Usuario>) => apiFetch<Usuario>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
}

export const citasApi = {
  create: async (payload: Partial<Cita>) => apiFetch<Cita>('/data/Cita', { method: 'POST', body: JSON.stringify(payload) }),
  list: async (where?: string) => apiFetch<Cita[]>(`/data/Cita${where ? '?where=' + encodeURIComponent(where) : ''}`),
  get: async (id: string) => apiFetch<Cita>(`/data/Cita/${id}`),
  update: async (id: string, payload: Partial<Cita>) => apiFetch<Cita>(`/data/Cita/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  delete: async (id: string) => apiFetch<void>(`/data/Cita/${id}`, { method: 'DELETE' })
}

export const commandApi = {
  process: async (texto: string) => apiFetch<CommandResponse>('/data/Comando', { method: 'POST', body: JSON.stringify({ texto }) })
}

export default { auth: authApi, citas: citasApi, command: commandApi }
