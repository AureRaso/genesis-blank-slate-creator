import { Clock, TrendingUp, MessageCircle, Shield, Smartphone, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const benefits = [
  {
    icon: Clock,
    title: "Ahorro de tiempo",
    description: "Automatización completa elimina tareas manuales repetitivas",
    metric: "80% menos tiempo administrativo",
    color: "text-blue-500",
  },
  {
    icon: TrendingUp,
    title: "Mayor ocupación",
    description: "Sistema de lista de espera optimiza el llenado de clases",
    metric: "25% más ocupación promedio",
    color: "text-green-500",
  },
  {
    icon: MessageCircle,
    title: "Comunicación directa",
    description: "WhatsApp integrado mantiene conexión constante con clientes",
    metric: "95% tasa de apertura mensajes",
    color: "text-emerald-500",
  },
  {
    icon: Shield,
    title: "Gestión profesional",
    description: "Paneles especializados para cada tipo de usuario",
    metric: "100% control centralizado",
    color: "text-purple-500",
  },
  {
    icon: Smartphone,
    title: "Multi-dispositivo",
    description: "Acceso completo desde móvil, tablet y ordenador",
    metric: "Disponible 24/7",
    color: "text-orange-500",
  },
  {
    icon: Zap,
    title: "Setup rápido",
    description: "Configuración completa en menos de 24 horas",
    metric: "Listo en 1 día",
    color: "text-primary",
  },
];

export const BenefitsSection = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            ¿Por qué elegir PadelLock?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Beneficios reales y medibles que transforman la gestión de tu club de pádel
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {benefits.map((benefit, index) => (
            <Card key={index} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <CardContent className="p-6 text-center space-y-4">
                <div className={`w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center group-hover:scale-110 transition-transform ${benefit.color}`}>
                  <benefit.icon className="h-8 w-8" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </div>

                <div className="pt-2">
                  <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${benefit.color} bg-current/10`}>
                    {benefit.metric}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Key Statistics */}
        <div className="mt-20">
          <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">Resultados que hablan por sí solos</h3>
                <p className="text-muted-foreground">Métricas reales de clubes que ya usan PadelLock</p>
              </div>
              
              <div className="grid md:grid-cols-4 gap-8 text-center">
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-primary">+25%</div>
                  <div className="text-sm text-muted-foreground">Ocupación de clases</div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-green-500">-80%</div>
                  <div className="text-sm text-muted-foreground">Tiempo administrativo</div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-blue-500">95%</div>
                  <div className="text-sm text-muted-foreground">Satisfacción clientes</div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-purple-500">24h</div>
                  <div className="text-sm text-muted-foreground">Setup completo</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};