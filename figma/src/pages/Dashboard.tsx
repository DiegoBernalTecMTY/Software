import { useState, useEffect } from 'react';
import { Plus, Calendar as CalendarIcon, List, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { CitaCard } from '../components/CitaCard';
import { CitaForm } from '../components/CitaForm';
import { CompactCalendar } from '../components/CompactCalendar';
import { CommandComposer } from '../components/CommandComposer';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Skeleton } from '../components/ui/skeleton';
import type { Cita, CommandResponse } from '../utils/api';

interface DashboardProps {
  citas: Cita[];
  isLoading: boolean;
  onCreateCita: (data: Partial<Cita>) => Promise<void>;
  onUpdateCita: (id: string, data: Partial<Cita>) => Promise<void>;
  onDeleteCita: (id: string) => Promise<void>;
  onProcessCommand: (texto: string) => Promise<CommandResponse>;
  onRefresh: () => void;
  onNavigate: (page: string, params?: any) => void;
}

export function Dashboard({
  citas,
  isLoading,
  onCreateCita,
  onUpdateCita,
  onDeleteCita,
  onProcessCommand,
  onRefresh,
  onNavigate,
}: DashboardProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCita, setEditingCita] = useState<Cita | null>(null);
  const [showCommandCenter, setShowCommandCenter] = useState(false);

  const upcomingCitas = citas
    .filter((cita) => {
      const citaDateTime = new Date(`${cita.fecha}T${cita.hora_inicio}:00`);
      return citaDateTime > new Date();
    })
    .sort((a, b) => {
      const dateA = new Date(`${a.fecha}T${a.hora_inicio}:00`);
      const dateB = new Date(`${b.fecha}T${b.hora_inicio}:00`);
      return dateA.getTime() - dateB.getTime();
    })
    .slice(0, 5);

  const handleEdit = (cita: Cita) => {
    setEditingCita(cita);
  };

  const handleDelete = async (cita: Cita) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar la cita "${cita.titulo}"?`)) {
      try {
        await onDeleteCita(cita.objectId!);
        onRefresh();
      } catch (error) {
        console.error('Error deleting cita:', error);
      }
    }
  };

  const handleSubmitEdit = async (data: Partial<Cita>) => {
    if (editingCita?.objectId) {
      await onUpdateCita(editingCita.objectId, data);
      setEditingCita(null);
      onRefresh();
    }
  };

  const handleSubmitCreate = async (data: Partial<Cita>) => {
    await onCreateCita(data);
    setShowCreateForm(false);
    onRefresh();
  };

  const handleCommandConfirm = async (result: any) => {
    // If the command created a cita, refresh the list
    if (result && result.titulo) {
      await onCreateCita(result);
      onRefresh();
      setShowCommandCenter(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1200px] p-4 md:p-6">
        {/* Welcome section */}
        <div className="mb-6">
          <h1 className="mb-2">Panel Principal</h1>
          <p className="text-muted-foreground">
            Gestiona tus citas y agenda nuevas reuniones fácilmente
          </p>
        </div>

        {/* Quick actions */}
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <Button onClick={() => setShowCreateForm(true)} className="justify-start" size="lg">
            <Plus className="mr-2 h-5 w-5" />
            Crear cita
          </Button>
          <Button
            onClick={() => onNavigate('citas')}
            variant="outline"
            className="justify-start"
            size="lg"
          >
            <List className="mr-2 h-5 w-5" />
            Ver todas las citas
          </Button>
          <Button
            onClick={() => setShowCommandCenter(!showCommandCenter)}
            variant={showCommandCenter ? 'default' : 'outline'}
            className="justify-start"
            size="lg"
          >
            <Sparkles className="mr-2 h-5 w-5" />
            Centro de comandos
          </Button>
        </div>

        {/* Command center - conditional */}
        {showCommandCenter && (
          <div className="mb-6">
            <CommandComposer
              onProcess={onProcessCommand}
              onConfirm={handleCommandConfirm}
            />
          </div>
        )}

        {/* Main content grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left column - Upcoming appointments */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle>Próximas citas</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate('citas')}
                >
                  Ver todas
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : upcomingCitas.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingCitas.map((cita) => (
                      <CitaCard
                        key={cita.objectId}
                        cita={cita}
                        variant="compact"
                        onClick={(cita) => onNavigate('cita-detail', { cita })}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                ) : (
                  <Alert>
                    <CalendarIcon className="h-4 w-4" />
                    <AlertDescription>
                      Aún no tienes citas próximas. Usa "Crear cita" o escribe un comando como
                      "Agenda revisión dental para el martes".
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right column - Calendar */}
          <div className="lg:col-span-1">
            <CompactCalendar
              citas={citas}
              onDateClick={(date) => {
                // Navigate to citas list filtered by this date
                onNavigate('citas', { date: date.toISOString().split('T')[0] });
              }}
            />
          </div>
        </div>
      </div>

      {/* Create form modal */}
      <CitaForm
        open={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSubmit={handleSubmitCreate}
        mode="create"
      />

      {/* Edit form modal */}
      <CitaForm
        open={!!editingCita}
        onClose={() => setEditingCita(null)}
        onSubmit={handleSubmitEdit}
        initialData={editingCita}
        mode="edit"
      />
    </div>
  );
}
