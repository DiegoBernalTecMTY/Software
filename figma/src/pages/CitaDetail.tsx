import { useState } from 'react';
import { ArrowLeft, Calendar, Clock, MapPin, Edit, Trash2, Share2, Bell } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { CitaForm } from '../components/CitaForm';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import type { Cita } from '../utils/api';

interface CitaDetailProps {
  cita: Cita;
  onBack: () => void;
  onUpdateCita: (id: string, data: Partial<Cita>) => Promise<void>;
  onDeleteCita: (id: string) => Promise<void>;
  onRefresh: () => void;
}

export function CitaDetail({
  cita,
  onBack,
  onUpdateCita,
  onDeleteCita,
  onRefresh,
}: CitaDetailProps) {
  const [showEditForm, setShowEditForm] = useState(false);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const isUpcoming = () => {
    const citaDateTime = new Date(`${cita.fecha}T${cita.hora_inicio}:00`);
    return citaDateTime > new Date();
  };

  const isPast = () => {
    const citaDateTime = new Date(`${cita.fecha}T${cita.hora_inicio}:00`);
    return citaDateTime < new Date();
  };

  const handleDelete = async () => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar la cita "${cita.titulo}"?`)) {
      try {
        await onDeleteCita(cita.objectId!);
        onBack();
      } catch (error) {
        console.error('Error deleting cita:', error);
      }
    }
  };

  const handleSubmitEdit = async (data: Partial<Cita>) => {
    if (cita.objectId) {
      await onUpdateCita(cita.objectId, data);
      setShowEditForm(false);
      onRefresh();
    }
  };

  const handleShare = () => {
    const shareText = `${cita.titulo}\n${formatDate(cita.fecha)} a las ${cita.hora_inicio}\n${cita.lugar}`;
    
    if (navigator.share) {
      navigator.share({
        title: cita.titulo,
        text: shareText,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(shareText).then(() => {
        alert('Detalles de la cita copiados al portapapeles');
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[800px] p-4 md:p-6">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="mb-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al inicio
        </Button>

        {/* Main card */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="flex-1">
                <CardTitle className="mb-3">{cita.titulo}</CardTitle>
                <div className="flex flex-wrap gap-2">
                  {isUpcoming() && (
                    <Badge variant="default">Próxima</Badge>
                  )}
                  {isPast() && (
                    <Badge variant="secondary">Pasada</Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share2 className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Compartir</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowEditForm(true)}>
                  <Edit className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Editar</span>
                </Button>
                <Button variant="outline" size="sm" onClick={handleDelete} className="text-destructive">
                  <Trash2 className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Eliminar</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Date and time */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fecha</p>
                  <p className="font-medium">{formatDate(cita.fecha)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Hora</p>
                  <p className="font-medium">{cita.hora_inicio}</p>
                </div>
              </div>

              {cita.lugar && (
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Lugar</p>
                    <p className="font-medium">{cita.lugar}</p>
                  </div>
                </div>
              )}
            </div>

            {cita.descripcion && (
              <>
                <Separator />
                <div>
                  <h3 className="mb-2">Descripción</h3>
                  <p className="text-muted-foreground">{cita.descripcion}</p>
                </div>
              </>
            )}

            {/* Metadata */}
            {(cita.created || cita.updated) && (
              <>
                <Separator />
                <div className="space-y-1 text-xs text-muted-foreground">
                  {cita.created && (
                    <p>
                      Creada: {new Date(cita.created).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  )}
                  {cita.updated && cita.updated !== cita.created && (
                    <p>
                      Última modificación: {new Date(cita.updated).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit form modal */}
      <CitaForm
        open={showEditForm}
        onClose={() => setShowEditForm(false)}
        onSubmit={handleSubmitEdit}
        initialData={cita}
        mode="edit"
      />
    </div>
  );
}
