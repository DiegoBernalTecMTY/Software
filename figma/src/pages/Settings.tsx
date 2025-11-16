import { useState, useEffect } from 'react';
import { User, Save, Calendar, CheckCircle2, Link2, ArrowLeft, Brain, Sparkles, Lock, Eye, EyeOff, Moon, Sun } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Separator } from '../components/ui/separator';
import { Switch } from '../components/ui/switch';
import { toast } from 'sonner@2.0.3';
import type { Usuario } from '../utils/api';
import { authApi } from '../utils/api';
import { useTheme } from '../utils/theme';

interface SettingsProps {
  user: Usuario;
  onUpdateUser: (id: string, data: Partial<Usuario>) => Promise<void>;
  onRefreshUser: () => void;
  onNavigate?: (page: string) => void;
}

export function Settings({ user, onUpdateUser, onRefreshUser, onNavigate }: SettingsProps) {
  const { theme, toggleTheme } = useTheme();
  const [formData, setFormData] = useState({
    nombre: user.nombre || '',
    email: user.email || '',
    instrucciones_agente: user.instrucciones_agente || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Password change states
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccessMessage, setPasswordSuccessMessage] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Calendar integration states
  const [googleConnected, setGoogleConnected] = useState(false);
  const [outlookConnected, setOutlookConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState<'google' | 'outlook' | null>(null);

  useEffect(() => {
    setFormData({
      nombre: user.nombre || '',
      email: user.email || '',
      instrucciones_agente: user.instrucciones_agente || '',
    });
  }, [user]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El correo electrónico es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Correo electrónico inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);

    if (!validateForm()) {
      return;
    }

    // Check if anything changed
    if (
      formData.nombre === user.nombre && 
      formData.email === user.email &&
      formData.instrucciones_agente === (user.instrucciones_agente || '')
    ) {
      setSuccessMessage('No hay cambios para guardar');
      return;
    }

    setIsSubmitting(true);

    try {
      await onUpdateUser(user.objectId!, formData);
      setSuccessMessage('Perfil actualizado correctamente');
      onRefreshUser();
    } catch (err: any) {
      setErrors({
        submit: err.message || 'Error al actualizar el perfil',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const fieldName = e.target.name;
    const fieldValue = e.target.value;
    
    setFormData((prev) => ({ 
      ...prev, 
      [fieldName]: fieldValue 
    }));
    
    setSuccessMessage(null);
    
    // Clear error for this field
    if (errors[fieldName]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const handleConnectGoogle = async () => {
    setIsConnecting('google');
    try {
      // Mock OAuth flow - in production, this would open OAuth window
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setGoogleConnected(true);
      toast.success('Google Calendar conectado exitosamente');
    } catch (error) {
      toast.error('Error al conectar con Google Calendar');
    } finally {
      setIsConnecting(null);
    }
  };

  const handleDisconnectGoogle = () => {
    setGoogleConnected(false);
    toast.success('Google Calendar desconectado');
  };

  const handleConnectOutlook = async () => {
    setIsConnecting('outlook');
    try {
      // Mock OAuth flow - in production, this would open OAuth window
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setOutlookConnected(true);
      toast.success('Outlook Calendar conectado exitosamente');
    } catch (error) {
      toast.error('Error al conectar con Outlook Calendar');
    } finally {
      setIsConnecting(null);
    }
  };

  const handleDisconnectOutlook = () => {
    setOutlookConnected(false);
    toast.success('Outlook Calendar desconectado');
  };

  const validatePasswordForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'La contraseña actual es obligatoria';
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = 'La nueva contraseña es obligatoria';
    } else if (passwordData.newPassword.length < 8) {
      newErrors.newPassword = 'La contraseña debe tener al menos 8 caracteres';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordData.newPassword)) {
      newErrors.newPassword = 'Debe incluir mayúsculas, minúsculas y números';
    }

    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Confirma tu nueva contraseña';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    if (passwordData.currentPassword && passwordData.newPassword === passwordData.currentPassword) {
      newErrors.newPassword = 'La nueva contraseña debe ser diferente a la actual';
    }

    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fieldName = e.target.name;
    const fieldValue = e.target.value;
    
    setPasswordData((prev) => ({ 
      ...prev, 
      [fieldName]: fieldValue 
    }));
    
    setPasswordSuccessMessage(null);
    
    // Clear error for this field
    if (passwordErrors[fieldName]) {
      setPasswordErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccessMessage(null);

    if (!validatePasswordForm()) {
      return;
    }

    setIsChangingPassword(true);

    try {
      await authApi.changePassword(
        user.objectId!,
        passwordData.currentPassword,
        passwordData.newPassword
      );
      
      // Reset form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      setPasswordSuccessMessage('Contraseña actualizada correctamente');
      toast.success('Contraseña actualizada correctamente');
    } catch (err: any) {
      setPasswordErrors({
        submit: err.message || 'Error al cambiar la contraseña. Verifica que tu contraseña actual sea correcta.',
      });
      toast.error('Error al cambiar la contraseña');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[800px] p-4 md:p-6">
        <div className="mb-6">
          {onNavigate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate('dashboard')}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al inicio
            </Button>
          )}
          <h1 className="mb-2">Configuración</h1>
          <p className="text-muted-foreground">
            Gestiona tu perfil y preferencias de cuenta
          </p>
        </div>

        {/* Appearance settings */}
        <Card className="animate-scale-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {theme === 'dark' ? (
                <Moon className="h-5 w-5 text-primary" />
              ) : (
                <Sun className="h-5 w-5 text-primary" />
              )}
              Apariencia
            </CardTitle>
            <CardDescription>
              Personaliza cómo se ve la aplicación
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="theme-toggle">Modo oscuro</Label>
                <p className="text-sm text-muted-foreground">
                  Activa el tema oscuro con colores vibrantes
                </p>
              </div>
              <Switch
                id="theme-toggle"
                checked={theme === 'dark'}
                onCheckedChange={toggleTheme}
              />
            </div>
          </CardContent>
        </Card>

        {/* Profile settings */}
        <Card className="animate-scale-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Perfil de usuario
            </CardTitle>
            <CardDescription>
              Actualiza tu información personal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre completo</Label>
                  <Input
                    id="nombre"
                    name="nombre"
                    placeholder="Juan Pérez"
                    value={formData.nombre}
                    onChange={handleChange}
                    className={errors.nombre ? 'border-destructive' : ''}
                    disabled={isSubmitting}
                  />
                  {errors.nombre && (
                    <p className="text-xs text-destructive">{errors.nombre}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    className={errors.email ? 'border-destructive' : ''}
                    disabled={isSubmitting}
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email}</p>
                  )}
                </div>
              </div>

              {errors.submit && (
                <Alert variant="destructive">
                  <AlertDescription>{errors.submit}</AlertDescription>
                </Alert>
              )}

              {successMessage && (
                <Alert className="border-success bg-success/10 text-success">
                  <AlertDescription>{successMessage}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* AI Agent Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Instrucciones para el Agente
            </CardTitle>
            <CardDescription>
              Enseña al agente tus preferencias y reglas para crear citas más inteligentes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="instrucciones_agente">
                  Preferencias y reglas personales
                </Label>
                <Textarea
                  id="instrucciones_agente"
                  name="instrucciones_agente"
                  placeholder={`Ejemplo:\n\n• Siempre prefiero las citas por la mañana, entre 9am y 12pm\n• Los lunes tengo reunión de equipo a las 10am, no agendar nada a esa hora\n• Necesito 15 minutos de buffer entre citas consecutivas\n• Las citas médicas deben ser en el Hospital Central\n• Recordatorios: 1 hora antes para citas médicas, 30 min para las demás\n• No agendar citas los viernes por la tarde\n• Reuniones de trabajo preferiblemente en la oficina del centro`}
                  value={formData.instrucciones_agente}
                  onChange={handleChange}
                  rows={12}
                  className="resize-none font-mono text-sm"
                  disabled={isSubmitting}
                />
                <div className="flex items-start gap-2 rounded-lg bg-primary/5 p-3 text-xs">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div className="space-y-1">
                    <p className="font-medium text-primary">
                      ¿Cómo usar las instrucciones?
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                      El agente utilizará estas instrucciones para hacer sugerencias más personalizadas
                      cuando crees o modifiques citas. Puedes incluir horarios preferidos, lugares
                      frecuentes, tiempos de recordatorio, restricciones de disponibilidad, y cualquier
                      otra regla que quieras que el agente conozca.
                    </p>
                  </div>
                </div>
              </div>

              {errors.submit && (
                <Alert variant="destructive">
                  <AlertDescription>{errors.submit}</AlertDescription>
                </Alert>
              )}

              {successMessage && (
                <Alert className="border-success bg-success/10 text-success">
                  <AlertDescription>{successMessage}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSubmitting ? 'Guardando...' : 'Guardar instrucciones'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Cambiar contraseña
            </CardTitle>
            <CardDescription>
              Actualiza tu contraseña para mantener tu cuenta segura
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {/* Current Password */}
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Contraseña actual</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    placeholder="Ingresa tu contraseña actual"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className={passwordErrors.currentPassword ? 'border-destructive pr-10' : 'pr-10'}
                    disabled={isChangingPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {passwordErrors.currentPassword && (
                  <p className="text-xs text-destructive">{passwordErrors.currentPassword}</p>
                )}
              </div>

              <Separator />

              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nueva contraseña</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Mínimo 8 caracteres"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className={passwordErrors.newPassword ? 'border-destructive pr-10' : 'pr-10'}
                    disabled={isChangingPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {passwordErrors.newPassword && (
                  <p className="text-xs text-destructive">{passwordErrors.newPassword}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Repite tu nueva contraseña"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className={passwordErrors.confirmPassword ? 'border-destructive pr-10' : 'pr-10'}
                    disabled={isChangingPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {passwordErrors.confirmPassword && (
                  <p className="text-xs text-destructive">{passwordErrors.confirmPassword}</p>
                )}
              </div>

              {/* Password requirements hint */}
              <Alert>
                <AlertDescription className="text-xs">
                  La contraseña debe tener al menos 8 caracteres e incluir mayúsculas, minúsculas y números.
                </AlertDescription>
              </Alert>

              {passwordErrors.submit && (
                <Alert variant="destructive">
                  <AlertDescription>{passwordErrors.submit}</AlertDescription>
                </Alert>
              )}

              {passwordSuccessMessage && (
                <Alert className="border-success bg-success/10 text-success">
                  <AlertDescription>{passwordSuccessMessage}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end">
                <Button type="submit" disabled={isChangingPassword}>
                  <Save className="mr-2 h-4 w-4" />
                  {isChangingPassword ? 'Actualizando...' : 'Actualizar contraseña'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Calendar Integrations */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Integraciones de calendario
            </CardTitle>
            <CardDescription>
              Conecta tus calendarios para sincronizar automáticamente tus citas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Google Calendar */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">Google Calendar</p>
                    {googleConnected && (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {googleConnected
                      ? 'Conectado y sincronizando'
                      : 'Sincroniza tus citas con Google Calendar'}
                  </p>
                </div>
              </div>
              {googleConnected ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnectGoogle}
                  disabled={isConnecting !== null}
                >
                  Desconectar
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleConnectGoogle}
                  disabled={isConnecting !== null}
                  className="gap-2"
                >
                  <Link2 className="h-4 w-4" />
                  {isConnecting === 'google' ? 'Conectando...' : 'Conectar'}
                </Button>
              )}
            </div>

            {/* Outlook Calendar */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0078D4]">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">Outlook Calendar</p>
                    {outlookConnected && (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {outlookConnected
                      ? 'Conectado y sincronizando'
                      : 'Sincroniza tus citas con Outlook Calendar'}
                  </p>
                </div>
              </div>
              {outlookConnected ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnectOutlook}
                  disabled={isConnecting !== null}
                >
                  Desconectar
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleConnectOutlook}
                  disabled={isConnecting !== null}
                  className="gap-2"
                >
                  <Link2 className="h-4 w-4" />
                  {isConnecting === 'outlook' ? 'Conectando...' : 'Conectar'}
                </Button>
              )}
            </div>

            <Alert>
              <AlertDescription className="text-sm">
                Las citas creadas en esta aplicación se sincronizarán automáticamente con los
                calendarios conectados.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Account info */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Información de cuenta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID de usuario:</span>
                <span className="font-mono text-xs">{user.objectId}</span>
              </div>
              {user.created && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cuenta creada:</span>
                  <span>
                    {new Date(user.created).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
