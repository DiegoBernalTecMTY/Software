import { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner@2.0.3';
import { Header } from './components/Header';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { CitasList } from './pages/CitasList';
import { CitaDetail } from './pages/CitaDetail';
import { Settings } from './pages/Settings';
import api, { getUserData, type Usuario, type Cita } from './utils/api';

type Page = 'login' | 'register' | 'dashboard' | 'citas' | 'cita-detail' | 'settings';

interface PageState {
  current: Page;
  params?: any;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  const [pageState, setPageState] = useState<PageState>({ current: 'login' });
  const [citas, setCitas] = useState<Cita[]>([]);
  const [isLoadingCitas, setIsLoadingCitas] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    const user = getUserData();
    if (user) {
      setCurrentUser(user);
      setPageState({ current: 'dashboard' });
      loadCitas();
    }
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
    setPageState({ current: 'login' });
    toast.success('Sesión cerrada');
  };

  const handleNavigate = (page: string, params?: any) => {
    setPageState({ current: page as Page, params });
  };

  const handleCreateCita = async (data: Partial<Cita>) => {
    await api.citas.create(data as any);
    toast.success(`Cita creada — ${data.fecha}, ${data.hora_inicio}`);
  };

  const handleUpdateCita = async (id: string, data: Partial<Cita>) => {
    await api.citas.update(id, data);
    toast.success('Cita actualizada correctamente');
  };

  const handleDeleteCita = async (id: string) => {
    await api.citas.delete(id);
    toast.success('Cita eliminada');
  };

  const handleProcessCommand = async (texto: string) => {
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
          />
        );
      }
      return (
        <Login
          onLogin={handleLogin}
          onNavigateToRegister={() => setPageState({ current: 'register' })}
        />
      );
    }

    switch (pageState.current) {
      case 'dashboard':
        return (
          <Dashboard
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
          />
        );

      default:
        return (
          <Dashboard
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
    }
  };

  return (
    <div className="min-h-screen">
      {currentUser && (
        <Header user={currentUser} onNavigate={handleNavigate} onLogout={handleLogout} />
      )}
      {renderPage()}
      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}
