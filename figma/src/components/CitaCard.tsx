import { Calendar, Clock, MapPin, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Badge } from './ui/badge';
import type { Cita } from '../utils/api';

interface CitaCardProps {
  cita: Cita;
  onEdit?: (cita: Cita) => void;
  onDelete?: (cita: Cita) => void;
  onClick?: (cita: Cita) => void;
  variant?: 'default' | 'compact';
}

export function CitaCard({ cita, onEdit, onDelete, onClick, variant = 'default' }: CitaCardProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const isUpcoming = (dateStr: string, timeStr: string) => {
    const citaDateTime = new Date(`${dateStr}T${timeStr}:00`);
    return citaDateTime > new Date();
  };

  const isPast = (dateStr: string, timeStr: string) => {
    const citaDateTime = new Date(`${dateStr}T${timeStr}:00`);
    return citaDateTime < new Date();
  };

  const upcoming = isUpcoming(cita.fecha, cita.hora_inicio);
  const past = isPast(cita.fecha, cita.hora_inicio);

  if (variant === 'compact') {
    return (
      <div
        onClick={() => onClick?.(cita)}
        className="group flex cursor-pointer items-start gap-3 rounded-xl border border-primary/20 dark:border-primary/30 bg-white dark:bg-slate-800 p-3 shadow-sm transition-all hover:border-primary hover:shadow-lg hover:scale-[1.02]"
      >
        <div className="flex flex-col items-center rounded-lg gradient-primary px-2.5 py-1.5 shadow-md shadow-glow-primary">
          <span className="text-xs font-medium text-white/90">
            {new Date(cita.fecha + 'T00:00:00').toLocaleDateString('es-ES', { month: 'short' })}
          </span>
          <span className="font-bold text-white text-lg leading-tight">
            {new Date(cita.fecha + 'T00:00:00').getDate()}
          </span>
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-foreground dark:text-cyan-50 group-hover:text-primary dark:group-hover:text-cyan-300 transition-all">{cita.titulo}</h4>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground dark:text-slate-300">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {cita.hora_inicio}
            </span>
            {cita.lugar && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {cita.lugar}
              </span>
            )}
          </div>
        </div>
        {(upcoming || past) && (
          <Badge variant={upcoming ? 'default' : 'secondary'} className={`text-xs font-medium ${upcoming ? 'gradient-success text-white' : 'dark:bg-slate-700 dark:text-slate-300'}`}>
            {upcoming ? 'Próxima' : 'Pasada'}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className="group transition-all hover:border-primary hover:shadow-xl hover:scale-[1.02] border-primary/20 dark:border-primary/30 bg-gradient-to-br from-white to-primary/5 dark:from-slate-800 dark:to-slate-800/50">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex-1">
          <h3
            onClick={() => onClick?.(cita)}
            className="cursor-pointer font-bold text-foreground dark:text-cyan-50 group-hover:text-primary dark:group-hover:text-cyan-300 transition-all"
          >
            {cita.titulo}
          </h3>
          <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground dark:text-slate-300">
            <span className="flex items-center gap-1 font-medium">
              <div className="rounded-md gradient-primary p-0.5 shadow-sm">
                <Calendar className="h-3.5 w-3.5 text-white" />
              </div>
              {formatDate(cita.fecha)}
            </span>
            <span className="flex items-center gap-1 font-medium">
              <div className="rounded-md gradient-secondary p-0.5 shadow-sm">
                <Clock className="h-3.5 w-3.5 text-white" />
              </div>
              {cita.hora_inicio}
            </span>
          </div>
        </div>
        {(onEdit || onDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Opciones</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(cita)} className="cursor-pointer">
                  <Edit className="mr-2 h-4 w-4" />
                  <span>Editar</span>
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(cita)}
                  className="cursor-pointer text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Eliminar</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>
      <CardContent>
        {cita.lugar && (
          <div className="mb-2 flex items-center gap-1 text-sm text-muted-foreground dark:text-slate-300">
            <MapPin className="h-4 w-4" />
            {cita.lugar}
          </div>
        )}
        {cita.descripcion && <p className="text-sm text-muted-foreground dark:text-slate-300 leading-relaxed">{cita.descripcion}</p>}
        <div className="mt-3 flex gap-2">
          {upcoming && (
            <Badge variant="default" className="text-xs font-semibold gradient-success text-white shadow-sm">
              Próxima
            </Badge>
          )}
          {past && (
            <Badge variant="secondary" className="text-xs font-medium dark:bg-slate-700 dark:text-slate-300">
              Pasada
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
