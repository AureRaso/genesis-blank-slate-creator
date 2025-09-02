import { Building2, GraduationCap, Users, MessageCircle, CreditCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Building2,
    title: "Gestión Completa del Club",
    description: "Panel de administración centralizado para gestionar pistas, horarios, precios y obtener reportes en tiempo real.",
    items: [
      "Control de múltiples pistas",
      "Gestión de horarios y disponibilidad",
      "Sistema de precios y descuentos",
      "Estadísticas y reportes detallados",
      "Dashboard administrativo completo"
    ]
  },
  {
    icon: GraduationCap,
    title: "App para Entrenadores",
    description: "Herramientas especializadas para que los entrenadores gestionen sus clases de forma eficiente.",
    items: [
      "Dashboard personal para cada entrenador",
      "Creación de clases programadas",
      "Gestión de grupos por niveles",
      "Calendario con drag & drop",
      "Control de inscripciones y listas de espera"
    ]
  },
  {
    icon: Users,
    title: "App para Alumnos",
    description: "Experiencia simplificada para que los jugadores gestionen sus reservas y clases.",
    items: [
      "Dashboard personal del jugador",
      "Inscripción fácil a clases",
      "Vista de clases disponibles",
      "Sistema de reservas automático",
      "Historial de clases"
    ]
  },
  {
    icon: MessageCircle,
    title: "Notificaciones WhatsApp",
    description: "Comunicación automática con tus clientes cuando se liberan plazas o hay actualizaciones.",
    items: [
      "Notificaciones automáticas de plazas disponibles",
      "Enlaces de inscripción directa (24h válidos)",
      "Integración con grupos de WhatsApp",
      "Mensajes personalizados por club",
      "Confirmaciones de reserva automáticas"
    ]
  },
  {
    icon: CreditCard,
    title: "Control de Precios",
    description: "Gestión flexible de precios y descuentos adaptada a tu forma actual de cobro.",
    items: [
      "Configuración de precios por clase",
      "Sistema de descuentos y promociones",
      "Control de tarifas por nivel",
      "Gestión de abonos y paquetes",
      "Historial de inscripciones"
    ]
  }
];

export const FeatureSections = () => {
  return (
    <section id="features" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Todo lo que necesitas para gestionar tu club
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Una solución completa que automatiza procesos, mejora la comunicación y aumenta la satisfacción de tus clientes
          </p>
        </div>

        <div className="grid gap-8 max-w-4xl mx-auto">
          {features.map((feature, index) => (
            <Card key={index} className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary/20 hover:border-l-primary">
              <CardContent className="p-8">
                <div className="grid lg:grid-cols-2 gap-8 items-start">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
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
                  
                  <div className="space-y-3">
                    {feature.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
                        <span className="text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};