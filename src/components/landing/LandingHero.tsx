import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Smartphone, Monitor, LogIn, Calendar, Users, CreditCard, BarChart3, Clock, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const LandingHero = () => {
  const navigate = useNavigate();
  
  const scrollToContact = () => {
    document.getElementById('contact')?.scrollIntoView({
      behavior: 'smooth'
    });
  };
  
  const scrollToDemo = () => {
    document.getElementById('workflow')?.scrollIntoView({
      behavior: 'smooth'
    });
  };
  
  const goToAuth = () => {
    navigate('/auth');
  };
  
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5 py-20 lg:py-32">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Column - Content */}
          <div className="space-y-8">
            <div className="space-y-6">
              <div className="inline-flex items-center rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary mb-2">
                <span className="mr-2">🎾</span> La plataforma todo-en-uno para clubes de pádel
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  PadeLock
                </span>
                <br />
                <span className="text-foreground">Digitaliza tu club de pádel</span>
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-lg leading-relaxed">
                La solución integral para gestionar clubes, entrenadores y jugadores. 
                Optimiza la organización de clases, gestiona alumnos y simplifica los pagos.
              </p>
            </div>

            {/* Key Features List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25" onClick={scrollToContact}>
                Solicitar Demo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg" onClick={scrollToDemo} className="border-2">
                <Play className="mr-2 h-4 w-4" />
                Ver Funcionalidades
              </Button>
              <Button variant="ghost" size="lg" onClick={goToAuth} className="text-primary hover:text-primary/80">
                <LogIn className="mr-2 h-4 w-4" />
                Acceder al Panel
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground pt-4">
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
          <div className="relative">
            <div className="relative mx-auto max-w-md lg:max-w-lg">
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

import { Building2, GraduationCap, User, CreditCard, BarChart3, Clock, Shield, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Building2,
    title: "Gestión Completa del Club",
    description: "Administra todos los aspectos de tu club desde un único panel centralizado.",
    items: [
      "Control de múltiples pistas y ubicaciones",
      "Gestión de horarios y disponibilidad",
      "Sistema de precios flexible y descuentos",
      "Estadísticas y reportes en tiempo real",
      "Dashboard administrativo completo"
    ]
  },
  {
    icon: GraduationCap,
    title: "Panel para Entrenadores",
    description: "Herramientas especializadas para que los entrenadores gestionen sus clases eficientemente.",
    items: [
      "Dashboard personal para cada entrenador",
      "Creación de clases programadas y recurrentes",
      "Gestión de grupos por niveles",
      "Calendario interactivo con drag & drop",
      "Control de inscripciones y listas de espera"
    ]
  },
  {
    icon: User,
    title: "Experiencia para Jugadores",
    description: "Interfaz simplificada para que los jugadores gestionen sus reservas y clases.",
    items: [
      "Dashboard personal del jugador",
      "Inscripción sencilla a clases disponibles",
      "Visualización del calendario del club",
      "Sistema de reservas automático",
      "Historial completo de clases"
    ]
  },
  {
    icon: CreditCard,
    title: "Sistema de Pagos",
    description: "Gestión flexible de pagos y control financiero integrado.",
    items: [
      "Múltiples métodos de pago",
      "Configuración de precios por clase",
      "Sistema de descuentos y promociones",
      "Gestión de abonos y paquetes",
      "Control de transacciones y validaciones"
    ]
  },
  {
    icon: BarChart3,
    title: "Analíticas y Reportes",
    description: "Toma decisiones basadas en datos con reportes detallados de tu club.",
    items: [
      "Métricas de ocupación y rendimiento",
      "Estadísticas financieras",
      "Seguimiento de progreso de alumnos",
      "Reportes personalizables",
      "Exportación de datos"
    ]
  }
];

export const FeatureSections = () => {
  return (
    <section id="features" className="py-20 bg-muted/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Todo lo que necesitas para tu club
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Una plataforma completa que centraliza la gestión, automatiza procesos y mejora 
            la experiencia para administradores, entrenadores y jugadores.
          </p>
        </div>

        <div className="grid gap-8 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-l-4 border-l-primary hover:border-l-primary/80 overflow-hidden">
              <CardContent className="p-0">
                <div className="grid lg:grid-cols-5 gap-8 items-start">
                  <div className="lg:col-span-2 bg-gradient-to-br from-primary/5 to-accent/5 p-8 h-full">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                          <feature.icon className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold">{feature.title}</h3>
                        </div>
                      </div>
                      <p className="text-muted-foreground text-lg leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="lg:col-span-3 p-8">
                    <div className="grid sm:grid-cols-2 gap-4">
                      {feature.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30">
                          <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2"></div>
                          <span className="text-sm">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Benefits */}
        <div className="mt-20 grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="text-center border-0 shadow-lg bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-8">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <Clock className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Ahorro de Tiempo</h3>
              <p className="text-muted-foreground">
                Automatiza procesos administrativos y dedica más tiempo a lo importante.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border-0 shadow-lg bg-gradient-to-br from-accent/5 to-accent/10">
            <CardContent className="p-8">
              <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-6">
                <Shield className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-3">Gestión Centralizada</h3>
              <p className="text-muted-foreground">
                Todo en un solo lugar: clubes, entrenadores, alumnos y pagos.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border-0 shadow-lg bg-gradient-to-br from-primary/5 to-accent/10">
            <CardContent className="p-8">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Implementación Rápida</h3>
              <p className="text-muted-foreground">
                Configuración completa en menos de 24 horas sin interrupciones.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

import { Calendar, UserCheck, Users, CreditCard, CheckCircle, Bell } from "lucide-react";

const workflowSteps = [
  {
    icon: UserCheck,
    title: "Creación de Clases",
    description: "Los entrenadores programan clases desde su panel personal",
    color: "bg-blue-500",
  },
  {
    icon: Calendar,
    title: "Gestión de Disponibilidad",
    description: "El sistema controla automáticamente las plazas disponibles",
    color: "bg-purple-500",
  },
  {
    icon: Users,
    title: "Inscripción de Alumnos",
    description: "Los jugadores se apuntan a clases desde su dashboard",
    color: "bg-green-500",
  },
  {
    icon: CreditCard,
    title: "Procesamiento de Pagos",
    description: "Sistema seguro de gestión de transacciones y validaciones",
    color: "bg-orange-500",
  },
  {
    icon: CheckCircle,
    title: "Confirmación Automática",
    description: "Notificaciones instantáneas para todas las partes",
    color: "bg-primary",
  }
];

export const WorkflowDiagram = () => {
  return (
    <section id="workflow" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Flujo de trabajo integrado
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Un proceso optimizado que conecta administradores, entrenadores y jugadores en una sola plataforma
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Desktop Layout */}
          <div className="hidden lg:flex justify-center items-start mb-16">
            {workflowSteps.map((step, index) => (
              <div key={index} className="flex flex-col items-center mx-2" style={{ width: "18%" }}>
                <div className={`w-20 h-20 ${step.color} rounded-2xl flex items-center justify-center mx-auto shadow-lg`}>
                  <step.icon className="h-10 w-10 text-white" />
                </div>
                <div className="mt-6 text-center">
                  <div className="bg-primary text-primary-foreground text-sm font-bold px-3 py-1 rounded-full inline-block mb-3">
                    Paso {index + 1}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-tight">{step.description}</p>
                </div>
                
                {index < workflowSteps.length - 1 && (
                  <div className="flex-grow mt-10">
                    <div className="h-0.5 w-full bg-gradient-to-r from-primary to-accent/50 relative">
                      <div className="absolute -right-2 -top-1.5 w-3 h-3 rounded-full bg-primary"></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Mobile Layout */}
          <div className="lg:hidden space-y-8">
            {workflowSteps.map((step, index) => (
              <div key={index} className="flex items-start space-x-6">
                <div className="flex flex-col items-center">
                  <div className={`w-14 h-14 ${step.color} rounded-xl flex items-center justify-center flex-shrink-0 shadow-md`}>
                    <step.icon className="h-7 w-7 text-white" />
                  </div>
                  {index < workflowSteps.length - 1 && (
                    <div className="h-12 w-0.5 bg-gradient-to-b from-primary to-accent/50 my-2"></div>
                  )}
                </div>
                
                <div className="space-y-2 pt-1">
                  <div className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full inline-block">
                    Paso {index + 1}
                  </div>
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="text-muted-foreground text-sm">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Integration Highlight */}
        <div className="mt-20 text-center max-w-4xl mx-auto">
          <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20 shadow-lg">
            <CardContent className="p-10">
              <div className="flex items-center justify-center space-x-4 mb-6">
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                  <Bell className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">Sistema de Notificaciones</h3>
              </div>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Mantén a todos informados con notificaciones automáticas. Entrenadores y jugadores 
                reciben alertas importantes sobre clases, plazas disponibles y confirmaciones.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};