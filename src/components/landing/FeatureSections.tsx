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
    <section id="features">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Todo lo que necesitas para tu club
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Una plataforma completa que centraliza la gestión, automatiza procesos y mejora 
            la experiencia para administradores, entrenadores y jugadores.
          </p>
        </div>

        <div className="grid gap-6 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-l-4 border-l-primary hover:border-l-primary/80 overflow-hidden">
              <CardContent className="p-0">
                <div className="grid lg:grid-cols-5 gap-6 items-start">
                  <div className="lg:col-span-2 bg-gradient-to-br from-primary/5 to-accent/5 p-6 h-full">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                          <feature.icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold">{feature.title}</h3>
                        </div>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="lg:col-span-3 p-6">
                    <div className="grid sm:grid-cols-2 gap-3">
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
        <div className="mt-16 grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card className="text-center border-0 shadow-lg bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-6">
              <div className="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2">Ahorro de Tiempo</h3>
              <p className="text-muted-foreground text-sm">
                Automatiza procesos administrativos y dedica más tiempo a lo importante.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border-0 shadow-lg bg-gradient-to-br from-accent/5 to-accent/10">
            <CardContent className="p-6">
              <div className="w-12 h-12 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-lg font-bold mb-2">Gestión Centralizada</h3>
              <p className="text-muted-foreground text-sm">
                Todo en un solo lugar: clubes, entrenadores, alumnos y pagos.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border-0 shadow-lg bg-gradient-to-br from-primary/5 to-accent/10">
            <CardContent className="p-6">
              <div className="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2">Implementación Rápida</h3>
              <p className="text-muted-foreground text-sm">
                Configuración completa en menos de 24 horas sin interrupciones.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};