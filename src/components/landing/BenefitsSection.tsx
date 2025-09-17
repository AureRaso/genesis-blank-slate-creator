import { Clock, TrendingUp, MessageCircle, Shield, Smartphone, Zap, Users, Calendar, CreditCard, BarChart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
const benefits = [{
  icon: Clock,
  title: "Ahorro de tiempo",
  description: "Automatización completa que elimina tareas manuales repetitivas",
  metric: "80% menos tiempo administrativo",
  color: "text-blue-500",
  bgColor: "bg-blue-500/10"
}, {
  icon: TrendingUp,
  title: "Mayor ocupación",
  description: "Sistema de lista de espera optimiza el llenado de clases",
  metric: "25% más ocupación promedio",
  color: "text-green-500",
  bgColor: "bg-green-500/10"
}, {
  icon: Users,
  title: "Gestión centralizada",
  description: "Control completo de clubes, entrenadores y alumnos en una plataforma",
  metric: "100% integrado",
  color: "text-purple-500",
  bgColor: "bg-purple-500/10"
}, {
  icon: Shield,
  title: "Seguridad garantizada",
  description: "Protección de datos y transacciones con encriptación avanzada",
  metric: "Datos 100% seguros",
  color: "text-amber-500",
  bgColor: "bg-amber-500/10"
}, {
  icon: Smartphone,
  title: "Multi-dispositivo",
  description: "Acceso completo desde móvil, tablet y ordenador",
  metric: "Disponible 24/7",
  color: "text-orange-500",
  bgColor: "bg-orange-500/10"
}, {
  icon: Zap,
  title: "Implementación rápida",
  description: "Configuración completa en menos de 24 horas",
  metric: "Funcionando en 1 día",
  color: "text-primary",
  bgColor: "bg-primary/10"
}];
export const BenefitsSection = () => {
  return <section className="py-2 bg-gradient-to-b from-background to-muted/30 w-full">
      <div className="container max-w-7xl mx-auto px-4 w-full">
        <div className="text-center mb-16">
          <div className="inline-flex items-center rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary mb-6">
            <Zap className="h-4 w-4 mr-2" /> Beneficios medibles
          </div>
          
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            ¿Por qué elegir PadeLock?
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">Resultados tangibles que transforman la gestión de tu academia de pádel y mejoran la experiencia para todos</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {benefits.map((benefit, index) => <Card key={index} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 bg-gradient-to-br from-card to-card/90 shadow-md">
              <CardContent className="p-6 space-y-5">
                <div className={`w-16 h-16 mx-auto rounded-2xl ${benefit.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <benefit.icon className={`h-8 w-8 ${benefit.color}`} />
                </div>
                
                <div className="space-y-3 text-center">
                  <h3 className="text-xl font-bold">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </div>

                <div className="pt-3">
                  <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${benefit.color} ${benefit.bgColor} border ${benefit.color}/20`}>
                    {benefit.metric}
                  </div>
                </div>
              </CardContent>
            </Card>)}
        </div>

        {/* Key Statistics */}
        <div className="mt-20">
          <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20 shadow-lg overflow-hidden">
            <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
            <CardContent className="p-10 relative">
              <div className="text-center mb-10">
                <h3 className="text-3xl font-bold mb-4">Resultados que transforman clubes</h3>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Métricas reales de clubes que ya utilizan PadeLock para su gestión diaria
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
                <div className="space-y-3">
                  <div className="text-4xl font-bold text-primary bg-primary/10 p-4 rounded-2xl inline-block">+25%</div>
                  <div className="text-sm text-muted-foreground font-medium">Ocupación de clases</div>
                </div>
                <div className="space-y-3">
                  <div className="text-4xl font-bold text-green-500 bg-green-500/10 p-4 rounded-2xl inline-block">-80%</div>
                  <div className="text-sm text-muted-foreground font-medium">Tiempo administrativo</div>
                </div>
                <div className="space-y-3">
                  <div className="text-4xl font-bold text-blue-500 bg-blue-500/10 p-4 rounded-2xl inline-block">95%</div>
                  <div className="text-sm text-muted-foreground font-medium">Satisfacción clientes</div>
                </div>
                <div className="space-y-3">
                  <div className="text-4xl font-bold text-purple-500 bg-purple-500/10 p-4 rounded-2xl inline-block">24h</div>
                  <div className="text-sm text-muted-foreground font-medium">Implementación completa</div>
                </div>
              </div>

              {/* Additional metrics bar */}
              <div className="mt-12 pt-8 border-t border-border/50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">500+</div>
                    <div className="text-sm text-muted-foreground">Clases gestionadas semanalmente</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">"PadeLock ha transformado completamente la gestión de nuestra academia. Ahora dedicamos más tiempo a entrenar y menos a administrar."</div>
                    <div className="text-sm text-muted-foreground">Disponibilidad del sistema</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">3min</div>
                    <div className="text-sm text-muted-foreground">Tiempo promedio de inscripción</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Testimonial snippet */}
        <div className="mt-16 text-center max-w-3xl mx-auto">
          <blockquote className="text-xl italic text-muted-foreground leading-relaxed">
            "PadeLock ha transformado completamente la gestión de nuestro club. 
            Ahora dedicamos más tiempo a entrenar y menos a administrar."
          </blockquote>
          <div className="mt-6">
            <div className="font-semibold">Carlos Martínez</div>
            <div className="text-sm text-muted-foreground">Director, Club Pádel Premium</div>
          </div>
        </div>
      </div>
    </section>;
};