import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Smartphone, LogIn, Calendar, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import padelockLogo from "@/assets/padelock-logo-red.png";

export const LandingHero = () => {
  const navigate = useNavigate();
  
  const scrollToContact = (event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    console.log('Button clicked: Scrolling to contact section...');
    
    setTimeout(() => {
      const contactSection = document.getElementById('contact');
      console.log('Contact section found:', !!contactSection);
      
      if (contactSection) {
        // Try scrollIntoView first
        try {
          contactSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
          console.log('ScrollIntoView executed successfully');
        } catch (error) {
          // Fallback to window.scrollTo
          console.warn('ScrollIntoView failed, using fallback:', error);
          const rect = contactSection.getBoundingClientRect();
          const scrollTop = window.pageYOffset + rect.top - 100;
          window.scrollTo({
            top: scrollTop,
            behavior: 'smooth'
          });
        }
      } else {
        console.error('Contact section not found in DOM');
      }
    }, 500);
  };
  
  const scrollToDemo = (event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    console.log('Button clicked: Scrolling to workflow section...');
    
    setTimeout(() => {
      const workflowSection = document.getElementById('workflow');
      console.log('Workflow section found:', !!workflowSection);
      
      if (workflowSection) {
        // Try scrollIntoView first
        try {
          workflowSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
          console.log('ScrollIntoView executed successfully');
        } catch (error) {
          // Fallback to window.scrollTo
          console.warn('ScrollIntoView failed, using fallback:', error);
          const rect = workflowSection.getBoundingClientRect();
          const scrollTop = window.pageYOffset + rect.top - 100;
          window.scrollTo({
            top: scrollTop,
            behavior: 'smooth'
          });
        }
      } else {
        console.error('Workflow section not found in DOM');
      }
    }, 500);
  };
  
  const goToAuth = (event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    console.log('Button clicked: Navigating to auth...');
    
    try {
      navigate('/auth');
      console.log('Navigation executed successfully');
    } catch (error) {
      console.warn('Navigate failed, using fallback:', error);
      window.location.href = '/auth';
    }
  };
  
  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5 py-8 lg:py-12">
      <div className="container max-w-7xl mx-auto px-4 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center w-full min-h-[600px]">
          {/* Left Column - Content */}
          <div className="flex flex-col justify-center space-y-6">
            {/* Logo */}
            <div className="mb-0">
              <img 
                src={padelockLogo} 
                alt="PadeLock Logo" 
                className="h-[100px] lg:h-[80px] w-auto"
              />
            </div>
            
            {/* Title and Description */}
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-5xl font-bold leading-tight text-foreground">
                Digitaliza tu academia de pádel
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
                Software pensado por y para academias de padel, entrenadores y clientes. Ahorra tiempo y dinero en tu academia.
              </p>
            </div>

            {/* Key Features List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                <div className="w-3 h-3 bg-primary rounded-full flex-shrink-0"></div>
                <span className="text-sm font-medium">Gestión avanzada de clases</span>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                <div className="w-3 h-3 bg-primary rounded-full flex-shrink-0"></div>
                <span className="text-sm font-medium">Panel para entrenadores</span>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                <div className="w-3 h-3 bg-primary rounded-full flex-shrink-0"></div>
                <span className="text-sm font-medium">Sistema de listas de espera</span>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                <div className="w-3 h-3 bg-primary rounded-full flex-shrink-0"></div>
                <span className="text-sm font-medium">Pagos integrados seguros</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 relative z-20">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 relative z-10 pointer-events-auto" 
                onClick={(e) => scrollToContact(e)}
              >
                Solicitar Demo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                onClick={(e) => scrollToDemo(e)} 
                className="border-2 relative z-10 pointer-events-auto"
              >
                <Play className="mr-2 h-4 w-4" />
                Ver Funcionalidades
              </Button>
            </div>
            
            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground pt-2">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Datos seguros y encriptados</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Implementación en 24h</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Soporte prioritario</span>
              </div>
            </div>
          </div>

          {/* Right Column - Visual */}
          <div className="relative w-full max-w-full">
            <div className="relative mx-auto max-w-md lg:max-w-lg w-full">
              {/* Main Dashboard Card */}
              <div className="relative z-10 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="bg-card rounded-2xl p-5 shadow-2xl border border-border/50">
                  <div className="bg-gradient-to-br from-primary/15 to-accent/15 rounded-xl p-6 space-y-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <span className="font-semibold">Dashboard Admin</span>
                      </div>
                      <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">Hoy</div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="bg-background/80 rounded-xl p-4 border">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="text-sm font-medium">Clase Avanzada - Pista 2</div>
                            <div className="text-xs text-muted-foreground mt-1">10:00 - 11:30 • 6/8 plazas</div>
                          </div>
                          <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Activa</div>
                        </div>
                      </div>
                      
                      <div className="bg-background/80 rounded-xl p-4 border">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="text-sm font-medium">Nuevas solicitudes</div>
                            <div className="text-xs text-muted-foreground mt-1">3 alumnos en lista de espera</div>
                          </div>
                          <Button variant="outline" size="sm" className="h-7 text-xs">
                            Gestionar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Stats Card */}
              <div className="absolute -bottom-6 -right-6 z-20 bg-card rounded-xl p-4 shadow-lg border border-border/50 w-40">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-green-100 rounded-lg">
                    <Users className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Alumnos</div>
                    <div className="font-bold text-lg">124</div>
                  </div>
                </div>
              </div>

              {/* Mobile App Preview */}
              <div className="absolute -top-8 -right-8 z-0 transform -rotate-6 hover:-rotate-3 transition-transform duration-500">
                <div className="bg-card rounded-2xl p-3 shadow-xl border border-border/50 scale-90">
                  <div className="bg-gradient-to-br from-accent/15 to-primary/15 rounded-lg p-4 space-y-3">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-accent/10 rounded-lg">
                        <Smartphone className="h-4 w-4 text-accent" />
                      </div>
                      <span className="text-sm font-semibold">App Entrenador</span>
                    </div>
                    <div className="space-y-2">
                      <div className="bg-background/70 rounded-lg p-2">
                        <div className="text-xs font-medium">Próxima clase: 12:00</div>
                      </div>
                      <div className="bg-background/70 rounded-lg p-2">
                        <div className="text-xs">2 plazas disponibles</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Background Elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse-slow"></div>
      </div>
    </section>
  );
};