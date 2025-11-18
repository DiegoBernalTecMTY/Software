import { Bell, Calendar, Clock, MapPin, ChevronRight, Trash2 } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import type { Cita, Notificacion } from '../utils/api';
import api from '../utils/api';
import { useEffect, useState } from 'react';

interface NotificationsPanelProps {
  citas?: Cita[];
  onNavigate: (page: string, params?: any) => void;
}

export function NotificationsPanel({ citas = [], onNavigate }: NotificationsPanelProps) {
  const [notifs, setNotifs] = useState<Notificacion[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const loadNotifs = async () => {
    setLoading(true);
    try {
      // By default fetch notifications for current user; backend should filter by owner via user-token header
      const data = await api.notificaciones.list();

      // For each notification, attempt to fetch cita to enrich UI (best-effort)
      const enriched = await Promise.all(
        data.map(async (n) => {
          try {
            const c = await api.citas.get(n.citaObjectId);
            return { ...n, cita: c } as any;
          } catch (e) {
            return n as any;
          }
        })
      );

      setNotifs(enriched as any);
    } catch (e) {
      console.error('Error loading notificaciones:', e);
      setNotifs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadNotifs();
  }, []);

  // Sort by schedule or cita date/time (upcoming first)
  const now = new Date();
  const items = (notifs || []).map((n) => {
    // Prefer notification schedule_at, fallback to linked cita fecha/hora
    const schedule = n.schedule_at ? new Date(n.schedule_at) : (n as any).cita ? new Date(`${(n as any).cita.fecha}T${(n as any).cita.hora_inicio}:00`) : null;
    return { n, schedule };
  });

  const upcomingItems = items.filter((it) => it.schedule && it.schedule >= now).sort((a, b) => (a.schedule!.getTime() - b.schedule!.getTime()));
  const pastItems = items.filter((it) => it.schedule && it.schedule < now).sort((a, b) => (b.schedule!.getTime() - a.schedule!.getTime()));

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

  const handleDelete = async (id?: string) => {
    if (!id) return;
    try {
      await api.notificaciones.delete(id);
      setNotifs((prev) => prev ? prev.filter((p) => p.objectId !== id) : prev);
    } catch (e) {
      console.error('Error deleting notification', e);
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
          {(notifs && notifs.length > 0) && (
            <Badge variant="secondary" className="rounded-full gradient-primary text-white font-semibold shadow-sm">
              {notifs.length}
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {(!notifs || notifs.length === 0) ? (
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
              {upcomingItems.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Próximas
                  </h3>
                  {upcomingItems.map(({ n, schedule }) => (
                    <Card
                      key={n.objectId}
                      className="group transition-all hover:shadow-xl hover:border-primary hover:scale-[1.02] border-primary/20 bg-gradient-to-br from-white to-primary/5 dark:from-slate-800 dark:to-slate-800/50 dark:border-primary/30"
                    >
                      <div className="p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1" onClick={() => (n as any).cita ? onNavigate('cita-detail', { cita: (n as any).cita }) : null}>
                            <h4 className="font-semibold text-sm text-foreground dark:text-cyan-50 line-clamp-1 group-hover:text-primary dark:group-hover:text-cyan-300 transition-all">
                              {(n as any).cita?.titulo || `Cita ${n.citaObjectId}`}
                            </h4>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground dark:text-slate-300">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{schedule ? schedule.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }) : 'Fecha'}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{schedule ? schedule.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                              </div>
                            </div>
                            {n.message && (
                              <div className="mt-2 pt-2 border-t dark:border-slate-700">
                                <p className="text-xs text-muted-foreground dark:text-slate-400 italic">
                                  {n.message}
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="ml-3 flex flex-col items-end gap-2">
                            <Badge variant="outline" className="shrink-0 text-xs border-primary/30 text-primary font-semibold gradient-success text-white shadow-sm">
                              {getTimeUntil(schedule ? schedule.toISOString().slice(0,10) : '', schedule ? schedule.toTimeString().slice(0,5) : '')}
                            </Badge>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(n.objectId)} title="Eliminar notificación">
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* Past notifications */}
              {pastItems.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-medium text-muted-foreground dark:text-slate-400 uppercase tracking-wider">
                    Anteriores
                  </h3>
                  {pastItems.map(({ n, schedule }) => (
                    <Card key={n.objectId} className="group opacity-60 transition-all hover:opacity-100 hover:shadow-md dark:bg-slate-800/50 dark:border-slate-700">
                      <div className="p-3 space-y-2">
                        <div className="flex items-start justify-between">
                          <div onClick={() => (n as any).cita ? onNavigate('cita-detail', { cita: (n as any).cita }) : null}>
                            <h4 className="font-medium text-sm text-foreground dark:text-slate-200 line-clamp-1">
                              {(n as any).cita?.titulo || `Cita ${n.citaObjectId}`}
                            </h4>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground dark:text-slate-400">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{schedule ? schedule.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }) : ''}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{schedule ? schedule.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                              </div>
                            </div>
                          </div>

                          <Button variant="ghost" size="icon" onClick={() => handleDelete(n.objectId)} title="Eliminar notificación">
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
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
