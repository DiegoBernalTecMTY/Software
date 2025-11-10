import { Calendar, Clock, MessageSquare, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

interface LandingProps {
  onNavigateToLogin: () => void;
}

export function Landing({ onNavigateToLogin }: LandingProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header with Login Button */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg">
              <Calendar className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-semibold text-foreground">Agente de Citas</h1>
              <p className="text-xs text-muted-foreground">Inteligente y personal</p>
            </div>
          </div>
          <Button onClick={onNavigateToLogin} className="gap-2">
            Iniciar sesión
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-background"></div>
        
        <div className="container relative mx-auto px-4 py-16 md:py-24 lg:py-32">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Left column - Content */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm text-primary">Gestión inteligente de citas</span>
              </div>
              
              <h2 className="text-foreground">
                Tu asistente personal para organizar citas
              </h2>
              
              <p className="text-lg text-muted-foreground">
                Nuestro agente inteligente simplifica la gestión de tus citas con comandos en lenguaje natural, 
                recordatorios inteligentes y una interfaz diseñada para ahorrar tu tiempo.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button onClick={onNavigateToLogin} size="lg" className="gap-2">
                  Comenzar ahora
                  <ArrowRight className="h-5 w-5" />
                </Button>
                <Button onClick={onNavigateToLogin} size="lg" variant="outline" className="gap-2">
                  Ver demo
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 pt-8">
                <div>
                  <div className="font-semibold text-foreground">100%</div>
                  <div className="text-sm text-muted-foreground">Gratis</div>
                </div>
                <div>
                  <div className="font-semibold text-foreground">24/7</div>
                  <div className="text-sm text-muted-foreground">Disponible</div>
                </div>
                <div>
                  <div className="font-semibold text-foreground">Rápido</div>
                  <div className="text-sm text-muted-foreground">Y seguro</div>
                </div>
              </div>
            </div>

            {/* Right column - Image */}
            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-primary/20 to-secondary/20 blur-3xl"></div>
              <div className="relative overflow-hidden rounded-2xl border border-border shadow-2xl">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1758691461932-d0aa0ebf6b31?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBtZWV0aW5nJTIwYXBwb2ludG1lbnR8ZW58MXx8fHwxNzYyNzMyNDA1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Gestión profesional de citas"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-background py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h3 className="mb-3 text-foreground">
              Todo lo que necesitas para gestionar tus citas
            </h3>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Herramientas intuitivas y potentes para que nunca pierdas una cita importante
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <Card className="border-border/50 transition-all hover:border-primary/30 hover:shadow-lg">
              <CardContent className="p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <h4 className="mb-2 text-foreground">Comandos en lenguaje natural</h4>
                <p className="text-sm text-muted-foreground">
                  Crea y gestiona citas escribiendo como hablas: "Reunión con María mañana a las 3pm"
                </p>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="border-border/50 transition-all hover:border-primary/30 hover:shadow-lg">
              <CardContent className="p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10">
                  <Calendar className="h-6 w-6 text-secondary" />
                </div>
                <h4 className="mb-2 text-foreground">Calendario inteligente</h4>
                <p className="text-sm text-muted-foreground">
                  Visualiza todas tus citas en un calendario interactivo con vista mensual y diaria
                </p>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="border-border/50 transition-all hover:border-primary/30 hover:shadow-lg">
              <CardContent className="p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <h4 className="mb-2 text-foreground">Recordatorios automáticos</h4>
                <p className="text-sm text-muted-foreground">
                  Nunca olvides una cita con notificaciones personalizadas y recordatorios inteligentes
                </p>
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card className="border-border/50 transition-all hover:border-primary/30 hover:shadow-lg">
              <CardContent className="p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10">
                  <CheckCircle2 className="h-6 w-6 text-secondary" />
                </div>
                <h4 className="mb-2 text-foreground">Gestión completa</h4>
                <p className="text-sm text-muted-foreground">
                  Crea, edita, completa y elimina citas con un sistema intuitivo de gestión
                </p>
              </CardContent>
            </Card>

            {/* Feature 5 */}
            <Card className="border-border/50 transition-all hover:border-primary/30 hover:shadow-lg">
              <CardContent className="p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h4 className="mb-2 text-foreground">Interfaz moderna</h4>
                <p className="text-sm text-muted-foreground">
                  Diseño limpio y profesional, optimizado para todos tus dispositivos
                </p>
              </CardContent>
            </Card>

            {/* Feature 6 */}
            <Card className="border-border/50 transition-all hover:border-primary/30 hover:shadow-lg">
              <CardContent className="p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10">
                  <Clock className="h-6 w-6 text-secondary" />
                </div>
                <h4 className="mb-2 text-foreground">Acceso instantáneo</h4>
                <p className="text-sm text-muted-foreground">
                  Consulta tus citas desde cualquier lugar con sincronización en tiempo real
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How it works Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-background to-primary/5 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h3 className="mb-3 text-foreground">
              Comienza en segundos
            </h3>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Solo tres pasos para empezar a organizar tu tiempo de manera eficiente
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Step 1 */}
            <div className="relative">
              <div className="absolute -left-4 -top-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                1
              </div>
              <Card className="pt-8">
                <CardContent className="p-6">
                  <h4 className="mb-2 text-foreground">Crea tu cuenta</h4>
                  <p className="text-sm text-muted-foreground">
                    Regístrate en menos de un minuto con tu correo electrónico
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="absolute -left-4 -top-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-primary-foreground shadow-lg">
                2
              </div>
              <Card className="pt-8">
                <CardContent className="p-6">
                  <h4 className="mb-2 text-foreground">Agrega tus citas</h4>
                  <p className="text-sm text-muted-foreground">
                    Usa comandos naturales o el formulario tradicional para crear citas
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="absolute -left-4 -top-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                3
              </div>
              <Card className="pt-8">
                <CardContent className="p-6">
                  <h4 className="mb-2 text-foreground">Mantente organizado</h4>
                  <p className="text-sm text-muted-foreground">
                    Gestiona tu tiempo con recordatorios y vistas personalizadas
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h3 className="mb-4 text-white">
            ¿Listo para tomar el control de tu agenda?
          </h3>
          <p className="mb-8 text-lg text-white/95">
            Únete y transforma la manera en que organizas tu tiempo
          </p>
          <Button
            onClick={onNavigateToLogin}
            size="lg"
            variant="secondary"
            className="gap-2 bg-white text-primary hover:bg-white/90"
          >
            Comenzar gratis ahora
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Calendar className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-medium text-foreground">Agente inteligente para agendar citas personales</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 Agente de Citas. Organiza tu tiempo con inteligencia.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
