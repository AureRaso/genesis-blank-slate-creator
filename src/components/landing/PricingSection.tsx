import { Check, Star, Zap, Clock, Shield, Smartphone, Users, Calendar, CreditCard, BarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const plans = [
  {
    name: "Básico",
    description: "Perfecto para clubs pequeños que comienzan su digitalización",
    price: "49",
    period: "mes/club",
    badge: "Popular",
    features: [
      "1 club incluido",
      "Hasta 3 entrenadores",
      "Gestión de clases y horarios",
      "Panel para jugadores",
      "Sistema de listas de espera",
      "Pagos básicos",
      "Soporte por email",
      "5 GB almacenamiento"
    ],
    cta: "Comenzar prueba",
    popular: true
  },
  {
    name: "Profesional",
    description: "Ideal para clubs establecidos que buscan crecimiento",
    price: "89",
    period: "mes/club",
    badge: "Recomendado",
    features: [
      "Hasta 3 clubs",
      "Entrenadores ilimitados",
      "Gestión avanzada de clases",
      "App móvil para entrenadores",
      "Sistema de pagos completo",
      "Reportes y analytics",
      "Soporte prioritario",
      "15 GB almacenamiento",
      "Integraciones API"
    ],
    cta: "Comenzar prueba",
    popular: false
  },
  {
    name: "Enterprise",
    description: "Para academias y grupos con múltiples ubicaciones",
    price: "149",
    period: "mes/club",
    badge: "Personalizable",
    features: [
      "Clubs ilimitados",
      "Entrenadores ilimitados",
      "Gestión centralizada",
      "Apps nativas móviles",
      "Pagos avanzados y facturación",
      "Analytics avanzados",
      "Soporte 24/7 dedicado",
      "Almacenamiento ilimitado",
      "Personalización total",
      "Migración asistida"
    ],
    cta: "Contactar ventas",
    popular: false
  }
];

const includedFeatures = [
  {
    icon: Clock,
    title: "Setup incluido",
    description: "Configuración completa sin coste adicional"
  },
  {
    icon: Smartphone,
    title: "Apps móviles",
    description: "Para entrenadores y jugadores incluidas"
  },
  {
    icon: Shield,
    title: "Datos seguros",
    description: "Encriptación SSL y backups automáticos"
  },
  {
    icon: Users,
    title: "Soporte técnico",
    description: "Asistencia durante el proceso de implantación"
  }
];

export const PricingSection = () => {
  const scrollToContact = () => {
    document.getElementById('contact')?.scrollIntoView({
      behavior: 'smooth'
    });
  };

  return (
    <section id="pricing" className="py-20 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-flex items-center rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary mb-6">
            <CreditCard className="h-4 w-4 mr-2" /> Precios transparentes
          </div>
          
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Planes que se adaptan a tu club
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
            Elige el plan perfecto para el tamaño y necesidades de tu negocio. 
            Todos incluyen prueba gratuita de 30 días sin compromiso.
          </p>
          
          <div className="inline-flex items-center space-x-2 bg-muted/50 rounded-full px-4 py-2 border">
            <Badge variant="secondary" className="bg-primary text-primary-foreground">
              <Zap className="h-3 w-3 mr-1" />
              30 días gratis
            </Badge>
            <span className="text-sm">Sin permanencia • Cancela cuando quieras</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`relative transition-all duration-300 hover:shadow-xl ${plan.popular ? 'border-2 border-primary shadow-lg' : 'border border-border'} ${plan.name === "Enterprise" ? 'lg:mt-8' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-3 py-1">
                    <Star className="h-3 w-3 mr-1" />
                    {plan.badge}
                  </Badge>
                </div>
              )}
              
              {!plan.popular && plan.name === "Enterprise" && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge variant="outline" className="bg-background">
                    {plan.badge}
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-6 pt-8">
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold">{plan.name}</h3>
                  <p className="text-muted-foreground">{plan.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex items-baseline justify-center space-x-1">
                      <span className="text-4xl font-bold">€{plan.price}</span>
                      <span className="text-muted-foreground">/{plan.period}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start space-x-3">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button 
                  className={`w-full ${plan.popular ? 'bg-primary hover:bg-primary/90' : 'bg-secondary hover:bg-secondary/90'} text-primary-foreground`} 
                  size="lg" 
                  onClick={scrollToContact}
                >
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Included in all plans */}
        <div className="text-center mb-12">
          <h3 className="text-2xl font-bold mb-6">Incluido en todos los planes</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {includedFeatures.map((feature, index) => (
              <div key={index} className="flex flex-col items-center text-center p-4 rounded-lg bg-muted/30">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-3">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-semibold mb-1">{feature.title}</h4>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-12 text-center space-y-6 max-w-3xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-2 p-4 rounded-lg bg-muted/20">
              <div className="font-semibold">💳 Sin sorpresas</div>
              <div className="text-sm text-muted-foreground">Precios transparentes sin costes ocultos</div>
            </div>
            <div className="space-y-2 p-4 rounded-lg bg-muted/20">
              <div className="font-semibold">🔄 Migración gratuita</div>
              <div className="text-sm text-muted-foreground">Te ayudamos a importar tus datos actuales</div>
            </div>
          </div>

          <div className="pt-6 border-t border-border/50">
            <div className="text-sm text-muted-foreground">
              ¿Necesitas un plan personalizado o tienes preguntas? 
              <button onClick={scrollToContact} className="text-primary hover:underline font-medium ml-1">
                Contáctanos
              </button>
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="mt-16 bg-card rounded-2xl border shadow-sm p-6 max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-center mb-8">Comparativa de planes</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left pb-4">Características</th>
                  <th className="text-center pb-4">Básico</th>
                  <th className="text-center pb-4">Profesional</th>
                  <th className="text-center pb-4">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-3 font-medium">Número de clubs</td>
                  <td className="text-center py-3">1</td>
                  <td className="text-center py-3">Hasta 3</td>
                  <td className="text-center py-3">Ilimitados</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 font-medium">Entrenadores</td>
                  <td className="text-center py-3">3</td>
                  <td className="text-center py-3">Ilimitados</td>
                  <td className="text-center py-3">Ilimitados</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 font-medium">Soporte</td>
                  <td className="text-center py-3">Email</td>
                  <td className="text-center py-3">Prioritario</td>
                  <td className="text-center py-3">24/7 Dedicado</td>
                </tr>
                <tr>
                  <td className="py-3 font-medium">Almacenamiento</td>
                  <td className="text-center py-3">5 GB</td>
                  <td className="text-center py-3">15 GB</td>
                  <td className="text-center py-3">Ilimitado</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};