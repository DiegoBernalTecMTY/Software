import { useState } from 'react';
import { Calendar, LogOut, Settings, User } from 'lucide-react';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import type { Usuario } from '../utils/api';

interface HeaderProps {
  user: Usuario | null;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export function Header({ user, onNavigate, onLogout }: HeaderProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full"
                  aria-label="Menú de usuario"
                  // Temporary debug hook: log clicks to help diagnose dropdown issues
                  onClick={() => console.debug('Header avatar clicked')}
                  data-testid="header-avatar-button"
                >
                  <Avatar className="h-10 w-10 border-2 border-primary/20">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(user.nombre)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onNavigate('dashboard')}
                  className="cursor-pointer"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  <span>Panel principal</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onNavigate('settings')}
                  className="cursor-pointer"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configuración</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    // Ask for confirmation before logging out
                    // Use a simple confirm dialog to avoid adding extra UI dependencies
                    const ok = window.confirm('¿Cerrar sesión?');
                    if (ok) onLogout();
                  }}
                  className="cursor-pointer text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </header>
  );
}
