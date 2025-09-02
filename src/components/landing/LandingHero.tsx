import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Smartphone, Monitor } from "lucide-react";

export const LandingHero = () => {
  const scrollToContact = () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToDemo = () => {
    document.getElementById('workflow')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/5 py-20 lg:py-32">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  PadelLock
                </span>
                <br />
                <span className="text-foreground">
                  La Plataforma Completa para Gestión de Clubes de Pádel
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-lg">
                Automatiza tu club, gestiona clases y mantén a tus clientes informados vía WhatsApp. 
                La solución integral que necesitas para hacer crecer tu negocio.
              </p>
            </div>

            {/* Key Features List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-sm">Notificaciones WhatsApp automáticas</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-sm">App para entrenadores</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-sm">Gestión de listas de espera</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-sm">Pagos online seguros</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={scrollToContact}
              >
                Solicitar Demo Gratuita
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={scrollToDemo}
              >
                <Play className="mr-2 h-4 w-4" />
                Ver Cómo Funciona
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Datos seguros</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Setup en 24h</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Soporte 24/7</span>
              </div>
            </div>
          </div>

          {/* Right Column - Visual */}
          <div className="relative">
            <div className="relative mx-auto max-w-md lg:max-w-lg">
              {/* Phone Mockup */}
              <div className="relative z-10 transform rotate-6 hover:rotate-3 transition-transform duration-300">
                <div className="bg-card rounded-3xl p-4 shadow-2xl border">
                  <div className="bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center space-x-3">
                      <Smartphone className="h-6 w-6 text-primary" />
                      <span className="font-semibold">App Entrenador</span>
                    </div>
                    <div className="space-y-3">
                      <div className="bg-background/80 rounded-lg p-3">
                        <div className="text-sm font-medium">Clase de Pádel - Nivel 3</div>
                        <div className="text-xs text-muted-foreground">4/8 participantes</div>
                      </div>
                      <div className="bg-background/80 rounded-lg p-3">
                        <div className="text-sm font-medium">🟢 Plaza disponible</div>
                        <div className="text-xs text-muted-foreground">Notificar por WhatsApp</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Desktop Mockup */}
              <div className="absolute -top-8 -right-4 z-0 transform -rotate-12 hover:-rotate-6 transition-transform duration-300">
                <div className="bg-card rounded-lg p-3 shadow-xl border scale-75">
                  <div className="bg-gradient-to-br from-accent/20 to-primary/20 rounded p-4 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Monitor className="h-4 w-4 text-accent" />
                      <span className="text-sm font-semibold">Panel Admin</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <div className="bg-background/60 rounded h-3"></div>
                      <div className="bg-background/60 rounded h-3"></div>
                      <div className="bg-primary/40 rounded h-3"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating WhatsApp notification */}
              <div className="absolute -bottom-4 -left-4 z-20 animate-pulse">
                <div className="bg-green-500 rounded-full p-3 shadow-lg">
                  <div className="text-white text-xs font-bold">WhatsApp</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Background Elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
      </div>
    </section>
  );
};