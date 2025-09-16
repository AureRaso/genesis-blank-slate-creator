import { Check, Star, Zap, Clock, Shield, Smartphone, Users, Calendar, CreditCard, BarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const pricingTiers = [
  {
    range: "1-10 clubes",
    price: "50",
    description: "Primeros pasos",
    isActive: true
  },
  {
    range: "11-50 clubes", 
    price: "100",
    description: "Crecimiento",
    isActive: false
  },
  {
    range: "51+ clubes",
    price: "200",
    description: "Expansión",
    isActive: false
  }
];

const allFeatures = [
  "Gestión completa de clases y horarios",
  "Panel para jugadores y entrenadores",
  "Sistema de reservas automático",
  "Notificaciones automáticas por WhatsApp",
  "Pagos integrados con Stripe",
  "Apps móviles nativas",
  "Sistema de listas de espera inteligente",
  "Reportes y analytics avanzados",
  "Soporte técnico incluido",
  "Configuración y migración gratuita",
  "Almacenamiento en la nube",
  "Entrenadores ilimitados"
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
            <CreditCard className="h-4 w-4 mr-2" /> Precio escalado según crecimiento
          </div>
          
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Un precio que crece contigo
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
            Todas las funcionalidades incluidas desde el primer día. 
            Solo pagas más a medida que creces y tenemos más clientes.
          </p>
          
          <div className="inline-flex items-center space-x-2 bg-muted/50 rounded-full px-4 py-2 border">
            <Badge variant="secondary" className="bg-primary text-primary-foreground">
              <Zap className="h-3 w-3 mr-1" />
              30 días gratis
            </Badge>
            <span className="text-sm">Sin permanencia • Cancela cuando quieras</span>
          </div>
        </div>

        {/* Pricing Path */}
        <div className="max-w-6xl mx-auto mb-16">
          <div className="relative">
            {/* Connection Line */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/20 via-primary/50 to-primary/20 transform -translate-y-1/2"></div>
            
            {/* Pricing Tiers */}
            <div className="grid md:grid-cols-3 gap-8 relative z-10">
              {pricingTiers.map((tier, index) => (
                <Card 
                  key={index} 
                  className={`relative transition-all duration-300 hover:shadow-xl text-center ${tier.isActive ? 'border-2 border-primary shadow-lg bg-primary/5' : 'border border-border bg-background'}`}
                >
                  {/* Step Number */}
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${tier.isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      {index + 1}
                    </div>
                  </div>
                  
                  <CardHeader className="pb-4 pt-8">
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold">{tier.range}</h3>
                      <p className="text-sm text-muted-foreground">{tier.description}</p>
                      
                      <div className="space-y-1">
                        <div className="flex items-baseline justify-center space-x-1">
                          <span className="text-3xl font-bold">€{tier.price}</span>
                          <span className="text-sm text-muted-foreground">/mes total</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <Button 
                      className={`w-full ${tier.isActive ? 'bg-primary hover:bg-primary/90' : 'bg-secondary hover:bg-secondary/90'}`}
                      onClick={scrollToContact}
                    >
                      Comenzar
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* All Features Included */}
        <div className="max-w-4xl mx-auto mb-16">
          <Card className="border-2 border-primary/20 shadow-lg">
            <CardHeader className="text-center pb-6">
              <h3 className="text-2xl font-bold">Todas las funcionalidades incluidas</h3>
              <p className="text-muted-foreground">Sin restricciones en ningún nivel de precio</p>
            </CardHeader>
            
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
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