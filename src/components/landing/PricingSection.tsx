import { Check, Star, Zap, Clock, Shield, Smartphone, Users, Calendar, CreditCard, BarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const plans = [
  {
    name: "Starter",
    price: "50",
    description: "Para comenzar a digitalizar tu academia",
    features: [
      "Gestión completa de clases y horarios",
      "Panel para jugadores y entrenadores", 
      "Sistema de reservas automático",
      "Notificaciones por WhatsApp",
      "Pagos integrados con Stripe"
    ],
    isPopular: false
  },
  {
    name: "Professional", 
    price: "100",
    description: "La solución completa para tu academia",
    features: [
      "Todo lo del plan Starter",
      "Apps móviles nativas",
      "Reportes y analytics avanzados",
      "Sistema de listas de espera inteligente",
      "Soporte técnico prioritario"
    ],
    isPopular: true
  },
  {
    name: "Enterprise",
    price: "200", 
    description: "Para academias que buscan la excelencia",
    features: [
      "Todo lo del plan Professional",
      "Personalización completa de marca",
      "Integraciones API avanzadas",
      "Migración y configuración incluida",
      "Soporte 24/7 dedicado"
    ],
    isPopular: false
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
    <section id="pricing" className="py-2 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-flex items-center rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary mb-6">
            <CreditCard className="h-4 w-4 mr-2" /> Precios simples y transparentes
          </div>
          
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Elige el plan perfecto para ti
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
            Digitaliza tu academia de pádel con nuestras soluciones completas. 
            Todos los planes incluyen 30 días de prueba gratuita.
          </p>
          
          <div className="inline-flex items-center space-x-2 bg-muted/50 rounded-full px-4 py-2 border">
            <Badge variant="secondary" className="bg-primary text-primary-foreground">
              <Zap className="h-3 w-3 mr-1" />
              30 días gratis
            </Badge>
            <span className="text-sm">Sin permanencia • Cancela cuando quieras</span>
          </div>
        </div>

        {/* Pricing Plans */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`relative transition-all duration-300 hover:shadow-xl ${plan.isPopular ? 'border-2 border-primary shadow-lg scale-105' : 'border border-border'}`}
            >
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-3 py-1">
                    <Star className="h-3 w-3 mr-1" />
                    Más Popular
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
                      <span className="text-muted-foreground">/mes</span>
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
                  className={`w-full ${plan.isPopular ? 'bg-primary hover:bg-primary/90' : 'bg-secondary hover:bg-secondary/90'}`} 
                  size="lg"
                  onClick={scrollToContact}
                >
                  Comenzar prueba gratuita
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
      </div>
    </section>
  );
};