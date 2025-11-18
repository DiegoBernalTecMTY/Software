import { useState, useEffect } from 'react';
import { Plus, Search, Calendar, LayoutGrid, List as ListIcon, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { CitaCard } from '../components/CitaCard';
import { CitaForm } from '../components/CitaForm';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Skeleton } from '../components/ui/skeleton';
import { Confetti } from '../components/Confetti';
import type { Cita } from '../utils/api';

interface CitasListProps {
  citas: Cita[];
  isLoading: boolean;
  initialDate?: string;
  onCreateCita: (data: Partial<Cita>) => Promise<void>;
  onUpdateCita: (id: string, data: Partial<Cita>) => Promise<void>;
  onDeleteCita: (id: string) => Promise<void>;
  onRefresh: () => void;
  onNavigate: (page: string, params?: any) => void;
}

export function CitasList({
  citas,
  isLoading,
  initialDate,
  onCreateCita,
  onUpdateCita,
  onDeleteCita,
  onRefresh,
  onNavigate,
}: CitasListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState(initialDate || '');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCita, setEditingCita] = useState<Cita | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredCitas = citas.filter((cita) => {
    const matchesSearch =
      searchQuery === '' ||
      cita.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cita.lugar?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cita.descripcion?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDate = dateFilter === '' || cita.fecha === dateFilter;

    return matchesSearch && matchesDate;
  });

  const sortedCitas = [...filteredCitas].sort((a, b) => {
    const dateA = new Date(`${a.fecha}T${a.hora_inicio}:00`);
    const dateB = new Date(`${b.fecha}T${b.hora_inicio}:00`);
    return dateB.getTime() - dateA.getTime();
  });

  const handleEdit = (cita: Cita) => {
    setEditingCita(cita);
  };

  const handleDelete = async (cita: Cita) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar la cita "${cita.titulo}"?`)) {
      try {
        setDeletingId(cita.objectId!);
        // Pequeño delay para mostrar la animación
        setTimeout(async () => {
          await onDeleteCita(cita.objectId!);
          setDeletingId(null);
          onRefresh();
        }, 300);
      } catch (error) {
        console.error('Error deleting cita:', error);
        setDeletingId(null);
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
    setShowConfetti(true);
    onRefresh();
  };

  return (
    <>
      <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-[1200px] p-4 md:p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate('dashboard')}
              className="mb-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al inicio
            </Button>
          </div>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="mb-2">Mis Citas</h1>
              <p className="text-muted-foreground">
                Visualiza y gestiona todas tus citas
              </p>
            </div>
            <Button onClick={() => setShowCreateForm(true)} size="lg">
              <Plus className="mr-2 h-5 w-5" />
              Nueva cita
            </Button>
          </div>
        </div>

        {/* Filters and view controls */}
        <div className="mb-6 flex flex-col gap-3 rounded-lg border bg-card p-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por título, lugar o descripción..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-[rgb(0,0,0)]"
            />
          </div>
          <div className="flex gap-2">
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full md:w-auto text-[rgb(0,0,0)]"
            />
            {dateFilter && (
              <Button
                variant="outline"
                onClick={() => setDateFilter('')}
                size="sm"
              >
                Limpiar
              </Button>
            )}
          </div>
          <div className="flex gap-1 rounded-lg border p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="px-3"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="px-3"
            >
              <ListIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Results count */}
        <div className="mb-4 text-sm text-muted-foreground">
          {filteredCitas.length === citas.length
            ? `${citas.length} ${citas.length === 1 ? 'cita' : 'citas'} en total`
            : `${filteredCitas.length} de ${citas.length} ${citas.length === 1 ? 'cita' : 'citas'}`}
        </div>

        {/* Citas list/grid */}
        {isLoading ? (
          <div className={viewMode === 'grid' ? 'grid gap-4 md:grid-cols-2' : 'space-y-3'}>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        ) : sortedCitas.length > 0 ? (
          <div className={viewMode === 'grid' ? 'grid gap-4 md:grid-cols-2' : 'space-y-3'}>
            {sortedCitas.map((cita) => (
              <div
                key={cita.objectId}
                className={`animate-scale-in ${
                  deletingId === cita.objectId ? 'animate-scale-out' : ''
                }`}
              >
                <CitaCard
                  cita={cita}
                  variant={viewMode === 'list' ? 'compact' : 'default'}
                  onClick={(cita) => onNavigate('cita-detail', { cita })}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              </div>
            ))}
          </div>
        ) : (
          <Alert>
            <Calendar className="h-4 w-4" />
            <AlertDescription>
              {searchQuery || dateFilter
                ? 'No se encontraron citas con los filtros aplicados.'
                : 'Aún no tienes citas. Crea tu primera cita usando el botón "Nueva cita".'}
            </AlertDescription>
          </Alert>
        )}
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
    </>
  );
}
