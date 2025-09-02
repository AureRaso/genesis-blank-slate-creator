import { Check, Star, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const plans = [
  {
    name: "Básico",
    description: "Perfecto para clubes pequeños que empiezan",
    price: "49",
    period: "mes",
    badge: null,
    features: [
      "Hasta 2 entrenadores",
      "Gestión de clases básica",
      "Notificaciones WhatsApp",
      "Dashboard administrativo",
      "Pagos con Stripe",
      "Soporte por email"
    ],
    cta: "Empezar Gratis",
    popular: false,
  },
  {
    name: "Profesional",
    description: "La opción más popular para clubes en crecimiento",
    price: "99",
    period: "mes",
    badge: "Más Popular",
    features: [
      "Hasta 10 entrenadores",
      "Gestión avanzada de clases",
      "WhatsApp + grupos automáticos",
      "Analytics y reportes",
      "Múltiples pistas",
      "Sistema de descuentos",
      "Soporte prioritario",
      "Integración calendario"
    ],
    cta: "Probar 30 días gratis",
    popular: true,
  },
  {
    name: "Enterprise",
    description: "Solución completa para grandes clubes",
    price: "199",
    period: "mes",
    badge: "Completo",
    features: [
      "Entrenadores ilimitados",
      "Funcionalidades completas",
      "WhatsApp Business API",
      "Reportes personalizados",
      "Múltiples ubicaciones",
      "Branding personalizado",
      "Soporte 24/7",
      "Onboarding personalizado",
      "Integraciones personalizadas"
    ],
    cta: "Contactar Ventas",
    popular: false,
  },
];

export const PricingSection = () => {
  const scrollToContact = () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="pricing" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Planes que se adaptan a tu club
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Elige el plan perfecto para el tamaño de tu negocio. Todos incluyen prueba gratuita de 30 días.
          </p>
          
          <div className="inline-flex items-center space-x-2 bg-muted rounded-full p-1">
            <Badge variant="secondary" className="bg-primary text-primary-foreground">
              <Zap className="h-3 w-3 mr-1" />
              30 días gratis
            </Badge>
            <span className="text-sm px-3">Sin permanencia • Cancela cuando quieras</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`relative transition-all duration-300 hover:shadow-xl ${
                plan.popular 
                  ? 'border-primary shadow-lg scale-105 lg:scale-110' 
                  : 'hover:scale-105'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge 
                    className={`${
                      plan.popular 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-accent text-accent-foreground'
                    }`}
                  >
                    {plan.popular && <Star className="h-3 w-3 mr-1" />}
                    {plan.badge}
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-8">
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold">{plan.name}</h3>
                  <p className="text-muted-foreground">{plan.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex items-baseline justify-center space-x-1">
                      <span className="text-4xl font-bold">{plan.price}€</span>
                      <span className="text-muted-foreground">/{plan.period}</span>
                    </div>
                    {plan.popular && (
                      <div className="text-sm text-muted-foreground">
                        <span className="line-through">149€</span>
                        <span className="text-primary font-semibold ml-2">Ahorra 33%</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center space-x-3">
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button 
                  className={`w-full ${
                    plan.popular 
                      ? 'bg-primary hover:bg-primary/90 text-primary-foreground' 
                      : ''
                  }`}
                  variant={plan.popular ? 'default' : 'outline'}
                  size="lg"
                  onClick={scrollToContact}
                >
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-16 text-center space-y-6">
          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="space-y-2">
              <div className="font-semibold">✅ Setup incluido</div>
              <div className="text-sm text-muted-foreground">Configuración completa sin costo adicional</div>
            </div>
            <div className="space-y-2">
              <div className="font-semibold">📱 Apps incluidas</div>
              <div className="text-sm text-muted-foreground">Versiones móviles para entrenadores y jugadores</div>
            </div>
            <div className="space-y-2">
              <div className="font-semibold">🔒 Datos seguros</div>
              <div className="text-sm text-muted-foreground">Certificación SSL y backup automático</div>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            ¿Necesitas algo personalizado? 
            <button 
              onClick={scrollToContact}
              className="text-primary hover:underline ml-1"
            >
              Hablemos
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};