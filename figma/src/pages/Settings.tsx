import { useState, useEffect } from 'react';
import { User, Save, Calendar, CheckCircle2, Link2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Separator } from '../components/ui/separator';
import { toast } from 'sonner@2.0.3';
import type { Usuario } from '../utils/api';

interface SettingsProps {
  user: Usuario;
  onUpdateUser: (id: string, data: Partial<Usuario>) => Promise<void>;
  onRefreshUser: () => void;
}

export function Settings({ user, onUpdateUser, onRefreshUser }: SettingsProps) {
  const [formData, setFormData] = useState({
    nombre: user.nombre || '',
    email: user.email || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Calendar integration states
  const [googleConnected, setGoogleConnected] = useState(false);
  const [outlookConnected, setOutlookConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState<'google' | 'outlook' | null>(null);

  useEffect(() => {
    setFormData({
      nombre: user.nombre || '',
      email: user.email || '',
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
    if (formData.nombre === user.nombre && formData.email === user.email) {
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setSuccessMessage(null);
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
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

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[800px] p-4 md:p-6">
        <div className="mb-6">
          <h1 className="mb-2">Configuración</h1>
          <p className="text-muted-foreground">
            Gestiona tu perfil y preferencias de cuenta
          </p>
        </div>

        {/* Profile settings */}
        <Card>
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
