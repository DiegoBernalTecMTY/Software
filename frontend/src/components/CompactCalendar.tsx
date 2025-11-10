import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import type { Cita } from '../utils/api';

interface CompactCalendarProps {
  citas: Cita[];
  onDateClick?: (date: Date) => void;
}

export function CompactCalendar({ citas, onDateClick }: CompactCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getCitasForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return citas.filter((cita) => cita.fecha === dateStr);
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year
    );
  };

  const weekDays = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle>
          {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
        </CardTitle>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" onClick={previousMonth} className="h-8 w-8 p-0">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Mes anterior</span>
          </Button>
          <Button variant="outline" size="sm" onClick={nextMonth} className="h-8 w-8 p-0">
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Mes siguiente</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1">
          {/* Week day headers */}
          {weekDays.map((day) => (
            <div
              key={day}
              className="flex h-8 items-center justify-center text-xs font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}

          {/* Empty cells for days before month starts */}
          {Array.from({ length: startingDayOfWeek }).map((_, index) => (
            <div key={`empty-${index}`} className="h-10" />
          ))}

          {/* Calendar days */}
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1;
            const date = new Date(year, month, day);
            const citasForDay = getCitasForDate(date);
            const hasEvents = citasForDay.length > 0;
            const today = isToday(day);

            return (
              <button
                key={day}
                onClick={() => onDateClick?.(date)}
                className={`
                  relative flex h-10 flex-col items-center justify-center rounded-md text-sm
                  transition-colors hover:bg-primary/10
                  ${today ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}
                  ${hasEvents && !today ? 'font-semibold' : ''}
                `}
              >
                <span>{day}</span>
                {hasEvents && !today && (
                  <div className="absolute bottom-1 flex gap-0.5">
                    {citasForDay.slice(0, 3).map((_, i) => (
                      <div key={i} className="h-1 w-1 rounded-full bg-primary" />
                    ))}
                  </div>
                )}
                {hasEvents && today && (
                  <Badge className="absolute -right-1 -top-1 h-4 w-4 rounded-full p-0 text-[10px]">
                    {citasForDay.length}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-3 border-t pt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-full bg-primary" />
            <span>Hoy</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-1 w-1 rounded-full bg-primary" />
            <span>Tiene citas</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
