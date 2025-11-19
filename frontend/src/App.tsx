import { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { ThemeProvider } from './utils/theme';
import { Header } from './components/Header';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { AppDashboard } from './pages/AppDashboard';
import { CitasList } from './pages/CitasList';
import { CitaDetail } from './pages/CitaDetail';
import { Settings } from './pages/Settings';
import api, { getUserData, type Usuario, type Cita, setSessionId, getSessionId } from './utils/api';

type Page = 'landing' | 'login' | 'register' | 'dashboard' | 'app-dashboard' | 'citas' | 'cita-detail' | 'settings';

interface PageState {
  current: Page;
  params?: any;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  const [pageState, setPageState] = useState<PageState>({ current: 'landing' });
  const [citas, setCitas] = useState<Cita[]>([]);
  const [isLoadingCitas, setIsLoadingCitas] = useState(false);

  // Initialize session on mount
  useEffect(() => {
    const initializeSession = async () => {
      try {
        // Check if we have an existing session ID
        let sessionId = getSessionId();
        
        // If not, create a new session
        if (!sessionId) {
          const { session_id } = await api.command.createSession();
          setSessionId(session_id);
        }
      } catch (error) {
        console.error('Error initializing session:', error);
        // Session initialization failure is not critical
      }
    };
    
    initializeSession();
  }, []);

  // Check for existing user session on mount
  useEffect(() => {
    const user = getUserData();
    if (user) {
      setCurrentUser(user);
      setPageState({ current: 'dashboard' });
      loadCitas();
    }
  }, []);

  // Listen for global agent responses and refresh citas list
  useEffect(() => {
    const handler = (e: any) => {
      // allow backend changes to settle briefly
      setTimeout(() => {
        void loadCitas();
      }, 300);
    };
    window.addEventListener('agent:response', handler as EventListener);
    return () => window.removeEventListener('agent:response', handler as EventListener);
  }, []);

  // Load citas when user logs in
  useEffect(() => {
    if (currentUser) {
      loadCitas();
    }
  }, [currentUser]);

  const loadCitas = async () => {
    setIsLoadingCitas(true);
    try {
      const data = await api.citas.list();
      setCitas(data);
    } catch (error: any) {
      console.error('Error loading citas:', error);
      // Don't show error toast on initial load if no citas
      if (error.code !== 404) {
        toast.error('Error al cargar las citas');
      }
    } finally {
      setIsLoadingCitas(false);
    }
  };

  

  const handleLogin = async (email: string, password: string) => {
    const response = await api.auth.login({ login: email, password });
    setCurrentUser({
      objectId: response.objectId,
      email: response.email,
      nombre: response.nombre,
    });
    setPageState({ current: 'dashboard' });
    toast.success(`¡Bienvenido, ${response.nombre}!`);
  };

  const handleRegister = async (nombre: string, email: string, password: string) => {
    await api.auth.register({ email, password, nombre });
    toast.success('Cuenta creada exitosamente. Por favor, inicia sesión.');
    setPageState({ current: 'login' });
  };

  const handleLogout = async () => {
    try {
      await api.auth.logout();
    } catch (error) {
      console.error('Error during logout:', error);
    }
    setCurrentUser(null);
    setCitas([]);
    setPageState({ current: 'landing' });
    toast.success('Sesión cerrada');
  };

  const handleNavigate = (page: string, params?: any) => {
    setPageState({ current: page as Page, params });
  };

  const handleCreateCita = async (data: Partial<Cita>) => {
    // Create the cita, then optionally create a linked notification
    const created = await api.citas.create(data as any);

    try {
      if (data.notificacion && data.notificacion.activa && created.objectId) {
        const minutos = data.notificacion.tiempo_anticipacion ?? 60;
        const scheduleDate = new Date(`${created.fecha}T${created.hora_inicio}:00`);
        scheduleDate.setMinutes(scheduleDate.getMinutes() - minutos);

        await api.notificaciones.create({
          citaObjectId: created.objectId,
          schedule_at: scheduleDate.toISOString(),
          reminder_offset: minutos,
          message: data.notificacion.mensaje || '',
          channel: 'in_app',
        } as any);
      }
    } catch (e) {
      console.error('Error creating notification for cita:', e);
    }

    toast.success(`Cita creada — ${created.fecha}, ${created.hora_inicio}`);
  };

  const handleUpdateCita = async (id: string, data: Partial<Cita>) => {
    // Update the cita first
    const updated = await api.citas.update(id, data);

    try {
      // Remove any existing notifications for this cita (simpler than update)
      const existing = await api.notificaciones.list(`citaObjectId = '${id}'`);
      for (const n of existing) {
        if (n.objectId) {
          await api.notificaciones.delete(n.objectId);
        }
      }

      // If notification is active in the updated data, create a new one
      if (data.notificacion && data.notificacion.activa && updated.objectId) {
        const minutos = data.notificacion.tiempo_anticipacion ?? 60;
        const scheduleDate = new Date(`${updated.fecha}T${updated.hora_inicio}:00`);
        scheduleDate.setMinutes(scheduleDate.getMinutes() - minutos);

        await api.notificaciones.create({
          citaObjectId: updated.objectId,
          schedule_at: scheduleDate.toISOString(),
          reminder_offset: minutos,
          message: data.notificacion.mensaje || '',
          channel: 'in_app',
        } as any);
      }
    } catch (e) {
      console.error('Error syncing notifications for updated cita:', e);
    }

    toast.success('Cita actualizada correctamente');
  };

  const handleDeleteCita = async (id: string) => {
    try {
      // Delete all notifications linked to this cita first
      const existing = await api.notificaciones.list(`citaObjectId = '${id}'`);
      for (const n of existing) {
        if (n.objectId) {
          await api.notificaciones.delete(n.objectId);
        }
      }
    } catch (e) {
      console.error('Error deleting notifications for cita:', e);
    }

    await api.citas.delete(id);
    toast.success('Cita eliminada');
  };

  const handleProcessCommand = async (texto: string) => {
    // support optional confirm flag: if caller passes confirm as second arg,
    // forward to backend to perform execution when requested.
    // TypeScript callers may call handleProcessCommand(texto) or
    // handleProcessCommand(texto, true)
    const anyArgs: any = arguments;
    const confirm = anyArgs && anyArgs.length > 1 ? Boolean(anyArgs[1]) : false;
    if (confirm) {
      return await api.command.processWithConfirm(texto, true);
    }
    return await api.command.process(texto);
  };

  const handleUpdateUser = async (id: string, data: Partial<Usuario>) => {
    await api.auth.updateUser(id, data);
  };

  const refreshUser = () => {
    const user = getUserData();
    if (user) {
      setCurrentUser(user);
    }
  };

  // Render current page
  const renderPage = () => {
    if (!currentUser) {
      if (pageState.current === 'register') {
        return (
          <Register
            onRegister={handleRegister}
            onNavigateToLogin={() => setPageState({ current: 'login' })}
            onNavigateBack={() => setPageState({ current: 'landing' })}
          />
        );
      }
      if (pageState.current === 'login') {
        return (
          <Login
            onLogin={handleLogin}
            onNavigateToRegister={() => setPageState({ current: 'register' })}
            onNavigateBack={() => setPageState({ current: 'landing' })}
          />
        );
      }
      return (
        <Landing
          onNavigateToLogin={() => setPageState({ current: 'login' })}
        />
      );
    }

    switch (pageState.current) {
      case 'dashboard':
        return (
          <Dashboard
            citas={citas}
            onProcessCommand={handleProcessCommand}
            onNavigate={handleNavigate}
            userName={currentUser.nombre}
          />
        );

      case 'app-dashboard':
        return (
          <AppDashboard
            citas={citas}
            isLoading={isLoadingCitas}
            onCreateCita={handleCreateCita}
            onUpdateCita={handleUpdateCita}
            onDeleteCita={handleDeleteCita}
            onProcessCommand={handleProcessCommand}
            onRefresh={loadCitas}
            onNavigate={handleNavigate}
          />
        );

      case 'citas':
        return (
          <CitasList
            citas={citas}
            isLoading={isLoadingCitas}
            initialDate={pageState.params?.date}
            onCreateCita={handleCreateCita}
            onUpdateCita={handleUpdateCita}
            onDeleteCita={handleDeleteCita}
            onRefresh={loadCitas}
            onNavigate={handleNavigate}
          />
        );

      case 'cita-detail':
        return (
          <CitaDetail
            cita={pageState.params?.cita}
            onBack={() => setPageState({ current: 'dashboard' })}
            onUpdateCita={handleUpdateCita}
            onDeleteCita={handleDeleteCita}
            onRefresh={loadCitas}
          />
        );

      case 'settings':
        return (
          <Settings
            user={currentUser}
            onUpdateUser={handleUpdateUser}
            onRefreshUser={refreshUser}
            onNavigate={handleNavigate}
          />
        );

      default:
        return (
          <Dashboard
            citas={citas}
            onProcessCommand={handleProcessCommand}
            onNavigate={handleNavigate}
            userName={currentUser.nombre}
          />
        );
    }
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen">
        {currentUser && (
          <Header user={currentUser} onNavigate={handleNavigate} onLogout={handleLogout} />
        )}
        {renderPage()}
        <Toaster position="top-right" richColors closeButton />
      </div>
    </ThemeProvider>
  );
}
