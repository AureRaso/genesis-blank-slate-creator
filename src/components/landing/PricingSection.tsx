import { Check, Star, Zap, Clock, Shield, Smartphone, Users, Calendar, CreditCard, BarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const pricingTiers = [
  {
    clubs: "1-10",
    price: "50",
    description: "Perfecto para comenzar",
    isPopular: true
  },
  {
    clubs: "11-25",
    price: "75",
    description: "Para clubs en crecimiento",
    isPopular: false
  },
  {
    clubs: "26-50",
    price: "100",
    description: "Para múltiples ubicaciones",
    isPopular: false
  },
  {
    clubs: "51+",
    price: "150",
    description: "Para grandes redes",
    isPopular: false
  }
];

const features = [
  "Clubs ilimitados en tu plan",
  "Entrenadores ilimitados",
  "Gestión completa de clases y horarios",
  "Panel para jugadores y entrenadores",
  "Sistema de listas de espera automático",
  "Pagos integrados con Stripe",
  "Apps móviles nativas",
  "Reportes y analytics avanzados",
  "Notificaciones por WhatsApp",
  "Soporte técnico incluido",
  "Almacenamiento en la nube",
  "Configuración y migración gratuita"
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
            <CreditCard className="h-4 w-4 mr-2" /> Un solo plan, precios escalados
          </div>
          
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Un plan completo para todos
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
            Precio escalado según el número de clubs que gestiones. 
            Todas las funcionalidades incluidas desde el primer día.
          </p>
          
          <div className="inline-flex items-center space-x-2 bg-muted/50 rounded-full px-4 py-2 border">
            <Badge variant="secondary" className="bg-primary text-primary-foreground">
              <Zap className="h-3 w-3 mr-1" />
              30 días gratis
            </Badge>
            <span className="text-sm">Sin permanencia • Cancela cuando quieras</span>
          </div>
        </div>

        {/* Pricing Tiers */}
        <div className="max-w-5xl mx-auto mb-16">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-4">Precios por número de clubs</h3>
            <p className="text-muted-foreground">Todas las funcionalidades incluidas en todos los niveles</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pricingTiers.map((tier, index) => (
              <Card 
                key={index} 
                className={`relative transition-all duration-300 hover:shadow-xl text-center ${tier.isPopular ? 'border-2 border-primary shadow-lg' : 'border border-border'}`}
              >
                {tier.isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-3 py-1">
                      <Star className="h-3 w-3 mr-1" />
                      Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="pb-4 pt-8">
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold">{tier.clubs} clubs</h3>
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
                    className={`w-full ${tier.isPopular ? 'bg-primary hover:bg-primary/90' : 'bg-secondary hover:bg-secondary/90'}`} 
                    onClick={scrollToContact}
                  >
                    Comenzar
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Single Plan Features */}
        <div className="max-w-4xl mx-auto mb-16">
          <Card className="border-2 border-primary/20 shadow-lg">
            <CardHeader className="text-center pb-6">
              <h3 className="text-2xl font-bold">Todo incluido en tu plan</h3>
              <p className="text-muted-foreground">Funcionalidades completas sin restricciones</p>
            </CardHeader>
            
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
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

        {/* Pricing Scale Explanation */}
        <div className="mt-16 bg-card rounded-2xl border shadow-sm p-8 max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-center mb-8">Escala de precios</h3>
          <div className="space-y-6">
            <p className="text-center text-muted-foreground">
              Paga solo por lo que necesitas. El precio se calcula mensualmente según el número de clubs que gestiones.
            </p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">💰 Precios transparentes</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>1-10 clubs:</span>
                    <span className="font-medium">€50/mes total</span>
                  </div>
                  <div className="flex justify-between">
                    <span>11-25 clubs:</span>
                    <span className="font-medium">€75/mes total</span>
                  </div>
                  <div className="flex justify-between">
                    <span>26-50 clubs:</span>
                    <span className="font-medium">€100/mes total</span>
                  </div>
                  <div className="flex justify-between">
                    <span>51+ clubs:</span>
                    <span className="font-medium">€150/mes total</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">✨ Siempre incluido</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div>• Clubs ilimitados en tu nivel</div>
                  <div>• Entrenadores ilimitados</div>
                  <div>• Todas las funcionalidades</div>
                  <div>• Apps móviles</div>
                  <div>• Soporte técnico</div>
                  <div>• Sin costes por transacción</div>
                </div>
              </div>
            </div>
            
            <div className="text-center pt-4 border-t border-border/50">
              <p className="text-sm text-muted-foreground">
                El precio se ajusta automáticamente cada mes según el número de clubs activos que tengas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};