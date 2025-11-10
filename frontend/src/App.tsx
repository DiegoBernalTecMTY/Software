import { useState, useEffect } from 'react'
import { Toaster, toast } from 'sonner'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Landing } from './pages/Landing'
import { Dashboard } from './pages/Dashboard'
import api, { getUserData, type Usuario, type Cita } from './utils/api'

type Page = 'landing' | 'login' | 'register' | 'dashboard' | 'citas' | 'cita-detail' | 'settings'

interface PageState { current: Page; params?: any }

export default function App() {
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null)
  const [pageState, setPageState] = useState<PageState>({ current: 'landing' })
  const [citas, setCitas] = useState<Cita[]>([])
  const [isLoadingCitas, setIsLoadingCitas] = useState(false)

  useEffect(() => {
    const user = getUserData()
    if (user) {
      setCurrentUser(user)
      setPageState({ current: 'dashboard' })
      loadCitas()
    }
  }, [])

  useEffect(() => {
    if (currentUser) loadCitas()
  }, [currentUser])

  const loadCitas = async () => {
    setIsLoadingCitas(true)
    try {
      const data = await api.citas.list()
      setCitas(data)
    } catch (error: any) {
      console.error('Error loading citas:', error)
      toast.error(error.message || 'Error al cargar las citas')
    } finally {
      setIsLoadingCitas(false)
    }
  }

  const handleLogin = async (email: string, password: string) => {
    const response = await api.auth.login({ login: email, password })
    setCurrentUser({ objectId: response.objectId, email: response.email, nombre: response.nombre })
    setPageState({ current: 'dashboard' })
    toast.success(`¡Bienvenido, ${response.nombre}!`)
  }

  const handleRegister = async (nombre: string, email: string, password: string) => {
    await api.auth.register({ email, password, nombre })
    toast.success('Cuenta creada. Por favor inicia sesión.')
    setPageState({ current: 'login' })
  }

  const handleLogout = async () => {
    try { await api.auth.logout() } catch (e) { console.error(e) }
    setCurrentUser(null)
    setCitas([])
    setPageState({ current: 'login' })
    toast.success('Sesión cerrada')
  }

  const handleCreateCita = async (data: Partial<Cita>) => {
    await api.citas.create(data as any)
    toast.success(`Cita creada — ${data.fecha}, ${data.hora_inicio}`)
    await loadCitas()
  }

  const handleUpdateCita = async (id: string, data: Partial<Cita>) => {
    await api.citas.update(id, data)
    toast.success('Cita actualizada correctamente')
    await loadCitas()
  }

  const handleDeleteCita = async (id: string) => {
    await api.citas.delete(id)
    toast.success('Cita eliminada')
    await loadCitas()
  }

  const handleProcessCommand = async (texto: string) => {
    return await api.command.process(texto)
  }

  if (!currentUser) {
    if (pageState.current === 'register')
      return <Register onRegister={handleRegister} onNavigateToLogin={() => setPageState({ current: 'login' })} />
    if (pageState.current === 'login')
      return <Login onLogin={handleLogin} onNavigateToRegister={() => setPageState({ current: 'register' })} />
    // default: landing page
    return (
      <Landing
        onNavigateToLogin={() => setPageState({ current: 'login' })}
        onNavigateToRegister={() => setPageState({ current: 'register' })}
      />
    )
  }

  return (
    <div>
      <Dashboard
        user={currentUser}
        citas={citas}
        isLoading={isLoadingCitas}
        onCreateCita={handleCreateCita}
        onUpdateCita={handleUpdateCita}
        onDeleteCita={handleDeleteCita}
        onProcessCommand={handleProcessCommand}
        onLogout={handleLogout}
      />
      <Toaster position="top-right" />
    </div>
  )
}
