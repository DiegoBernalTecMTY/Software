import { Bell, Calendar, Clock, MapPin, ChevronRight } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import type { Cita } from '../utils/api';

interface NotificationsPanelProps {
  citas: Cita[];
  onNavigate: (page: string, params?: any) => void;
}

export function NotificationsPanel({ citas, onNavigate }: NotificationsPanelProps) {
  // Filter citas that have active notifications
  const citasConNotificacion = citas.filter(
    (cita) => cita.notificacion?.activa
  );

  // Sort by date and time (upcoming first)
  const sortedCitas = [...citasConNotificacion].sort((a, b) => {
    const dateTimeA = new Date(`${a.fecha}T${a.hora_inicio}:00`);
    const dateTimeB = new Date(`${b.fecha}T${b.hora_inicio}:00`);
    return dateTimeA.getTime() - dateTimeB.getTime();
  });

  // Separate into upcoming and past
  const now = new Date();
  const upcomingCitas = sortedCitas.filter((cita) => {
    const citaDateTime = new Date(`${cita.fecha}T${cita.hora_inicio}:00`);
    return citaDateTime >= now;
  });

  const pastCitas = sortedCitas.filter((cita) => {
    const citaDateTime = new Date(`${cita.fecha}T${cita.hora_inicio}:00`);
    return citaDateTime < now;
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoy';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Mañana';
    } else {
      return date.toLocaleDateString('es-ES', { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short' 
      });
    }
  };

  const getTimeUntil = (fecha: string, hora: string) => {
    const citaDateTime = new Date(`${fecha}T${hora}:00`);
    const now = new Date();
    const diffMs = citaDateTime.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `En ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`;
    } else if (diffHours > 0) {
      return `En ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
    } else if (diffMins > 0) {
      return `En ${diffMins} ${diffMins === 1 ? 'minuto' : 'minutos'}`;
    } else {
      return 'Muy pronto';
    }
  };

  return (
    <div className="flex h-full flex-col border-l border-primary/20 bg-white/40 dark:bg-slate-900/60 backdrop-blur-lg">
      {/* Header */}
      <div className="border-b border-primary/20 bg-white/60 dark:bg-slate-900/80 backdrop-blur-lg px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg gradient-secondary p-1.5 shadow-md">
              <Bell className="h-3.5 w-3.5 text-white" />
            </div>
            <h2 className="font-bold text-foreground">Notificaciones</h2>
          </div>
          {citasConNotificacion.length > 0 && (
            <Badge variant="secondary" className="rounded-full gradient-primary text-white font-semibold shadow-sm">
              {citasConNotificacion.length}
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {citasConNotificacion.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full gradient-secondary shadow-lg animate-float">
                <Bell className="h-8 w-8 text-white" />
              </div>
              <p className="text-sm font-medium text-foreground">
                No tienes notificaciones activas
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Las citas con recordatorio aparecerán aquí
              </p>
            </div>
          ) : (
            <>
              {/* Upcoming notifications */}
              {upcomingCitas.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Próximas
                  </h3>
                  {upcomingCitas.map((cita) => (
                    <Card
                      key={cita.objectId}
                      className="group cursor-pointer transition-all hover:shadow-xl hover:border-primary hover:scale-[1.02] border-primary/20 bg-gradient-to-br from-white to-primary/5 dark:from-slate-800 dark:to-slate-800/50 dark:border-primary/30"
                      onClick={() =>
                        onNavigate('cita-detail', { cita })
                      }
                    >
                      <div className="p-3 space-y-2">
                        {/* Header with time until */}
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-sm text-foreground dark:text-cyan-50 line-clamp-1 group-hover:text-primary dark:group-hover:text-cyan-300 transition-all">
                            {cita.titulo}
                          </h4>
                          <Badge 
                            variant="outline" 
                            className="shrink-0 text-xs border-primary/30 text-primary font-semibold gradient-success text-white shadow-sm"
                          >
                            {getTimeUntil(cita.fecha, cita.hora_inicio)}
                          </Badge>
                        </div>

                        {/* Date and time */}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground dark:text-slate-300">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(cita.fecha)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{cita.hora_inicio}</span>
                          </div>
                        </div>

                        {/* Location */}
                        {cita.lugar && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground dark:text-slate-300">
                            <MapPin className="h-3 w-3" />
                            <span className="line-clamp-1">{cita.lugar}</span>
                          </div>
                        )}

                        {/* Notification message */}
                        {cita.notificacion?.mensaje && (
                          <div className="mt-2 pt-2 border-t dark:border-slate-700">
                            <p className="text-xs text-muted-foreground dark:text-slate-400 italic">
                              {cita.notificacion.mensaje}
                            </p>
                          </div>
                        )}

                        {/* View details arrow */}
                        <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <ChevronRight className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* Past notifications */}
              {pastCitas.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-medium text-muted-foreground dark:text-slate-400 uppercase tracking-wider">
                    Anteriores
                  </h3>
                  {pastCitas.map((cita) => (
                    <Card
                      key={cita.objectId}
                      className="group cursor-pointer opacity-60 transition-all hover:opacity-100 hover:shadow-md dark:bg-slate-800/50 dark:border-slate-700"
                      onClick={() =>
                        onNavigate('cita-detail', { cita })
                      }
                    >
                      <div className="p-3 space-y-2">
                        <h4 className="font-medium text-sm text-foreground dark:text-slate-200 line-clamp-1">
                          {cita.titulo}
                        </h4>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground dark:text-slate-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(cita.fecha)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{cita.hora_inicio}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>

      {/* Footer action */}
      <div className="border-t bg-card px-4 py-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate('citas')}
          className="w-full justify-between text-xs"
        >
          <span>Ver todas las citas</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
