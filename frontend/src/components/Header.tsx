import { useState } from 'react';
import { Calendar, LogOut, Settings, User } from 'lucide-react';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Separator } from './ui/separator';
import type { Usuario } from '../utils/api';

interface HeaderProps {
  user: Usuario | null;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export function Header({ user, onNavigate, onLogout }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleNavigate = (page: string) => {
    setIsOpen(false);
    onNavigate(page);
  };

  const handleLogout = () => {
    setIsOpen(false);
    onLogout();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 md:px-6">
        {/* Logo and App Name */}
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2 transition-opacity hover:opacity-80"
          aria-label="Ir al inicio"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Calendar className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-foreground">Agente de Citas</span>
            <span className="text-xs text-muted-foreground">Inteligente y personal</span>
          </div>
        </button>

        {/* Right side - User menu */}
        {user && (
          <div className="flex items-center gap-3">
            {/* User info - hidden on mobile */}
            <div className="hidden flex-col items-end md:flex">
              <span className="text-sm font-medium text-foreground">{user.nombre}</span>
              <span className="text-xs text-muted-foreground">{user.email}</span>
            </div>

            {/* User dropdown menu */}
            <Popover open={isOpen} onOpenChange={setIsOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full"
                  aria-label="Menú de usuario"
                >
                  <Avatar className="h-10 w-10 border-2 border-primary/20">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(user.nombre)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-0" align="end" sideOffset={8}>
                <div className="p-2">
                  <div className="px-2 py-1.5 text-sm font-medium">Mi Cuenta</div>
                  <Separator className="my-1" />
                  <button
                    onClick={() => handleNavigate('dashboard')}
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent focus:bg-accent"
                  >
                    <Calendar className="h-4 w-4" />
                    <span>Panel principal</span>
                  </button>
                  <button
                    onClick={() => handleNavigate('settings')}
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent focus:bg-accent"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Configuración</span>
                  </button>
                  <Separator className="my-1" />
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive outline-none transition-colors hover:bg-destructive/10 focus:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Cerrar sesión</span>
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>
    </header>
  );
}
