import { ArrowRight, UserCheck, Bell, CreditCard, CheckCircle, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const workflowSteps = [
  {
    icon: UserCheck,
    title: "Entrenador crea clase",
    description: "El entrenador programa una nueva clase desde su app móvil o dashboard",
    color: "bg-blue-500",
  },
  {
    icon: Users,
    title: "Sistema gestiona inscripciones",
    description: "La plataforma controla automáticamente las plazas disponibles y lista de espera",
    color: "bg-purple-500",
  },
  {
    icon: Bell,
    title: "WhatsApp notifica disponibilidad",
    description: "Cuando se libera una plaza, se envía automáticamente un mensaje por WhatsApp",
    color: "bg-green-500",
  },
  {
    icon: CheckCircle,
    title: "Estudiantes se inscriben",
    description: "Los jugadores hacen clic en el enlace y se inscriben directamente",
    color: "bg-orange-500",
  },
  {
    icon: CreditCard,
    title: "Pago automatizado",
    description: "El sistema procesa el pago de forma segura con Stripe",
    color: "bg-red-500",
  },
  {
    icon: CheckCircle,
    title: "Confirmación WhatsApp",
    description: "Se envía confirmación automática de la reserva por WhatsApp",
    color: "bg-primary",
  },
];

export const WorkflowDiagram = () => {
  return (
    <section id="workflow" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            ¿Cómo funciona PadelLock?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Automatización completa desde la creación de clases hasta la confirmación de pagos
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Mobile Layout */}
          <div className="lg:hidden space-y-6">
            {workflowSteps.map((step, index) => (
              <div key={index} className="relative">
                <Card className="border-l-4 border-l-primary/20">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className={`p-3 rounded-lg ${step.color} text-white flex-shrink-0`}>
                        <step.icon className="h-6 w-6" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <span className="bg-primary text-primary-foreground text-sm font-bold px-2 py-1 rounded">
                            {index + 1}
                          </span>
                          <h3 className="font-semibold">{step.title}</h3>
                        </div>
                        <p className="text-muted-foreground text-sm">{step.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                {index < workflowSteps.length - 1 && (
                  <div className="flex justify-center my-4">
                    <ArrowRight className="h-6 w-6 text-primary rotate-90" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop Layout */}
          <div className="hidden lg:block">
            <div className="grid grid-cols-3 gap-8">
              {/* First Row */}
              {workflowSteps.slice(0, 3).map((step, index) => (
                <div key={index} className="relative">
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6 text-center space-y-4">
                      <div className={`w-16 h-16 ${step.color} rounded-full flex items-center justify-center mx-auto`}>
                        <step.icon className="h-8 w-8 text-white" />
                      </div>
                      <div className="space-y-2">
                        <div className="bg-primary text-primary-foreground text-sm font-bold px-3 py-1 rounded-full inline-block">
                          Paso {index + 1}
                        </div>
                        <h3 className="font-semibold text-lg">{step.title}</h3>
                        <p className="text-muted-foreground text-sm">{step.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                  {index < 2 && (
                    <ArrowRight className="absolute top-1/2 -right-4 transform -translate-y-1/2 h-8 w-8 text-primary" />
                  )}
                </div>
              ))}
            </div>

            {/* Arrow Down */}
            <div className="flex justify-center my-8">
              <ArrowRight className="h-8 w-8 text-primary rotate-90" />
            </div>

            {/* Second Row */}
            <div className="grid grid-cols-3 gap-8">
              {workflowSteps.slice(3).reverse().map((step, index) => {
                const originalIndex = workflowSteps.length - index - 1;
                return (
                  <div key={originalIndex} className="relative">
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6 text-center space-y-4">
                        <div className={`w-16 h-16 ${step.color} rounded-full flex items-center justify-center mx-auto`}>
                          <step.icon className="h-8 w-8 text-white" />
                        </div>
                        <div className="space-y-2">
                          <div className="bg-primary text-primary-foreground text-sm font-bold px-3 py-1 rounded-full inline-block">
                            Paso {originalIndex + 1}
                          </div>
                          <h3 className="font-semibold text-lg">{step.title}</h3>
                          <p className="text-muted-foreground text-sm">{step.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                    {index < 2 && (
                      <ArrowRight className="absolute top-1/2 -left-4 transform -translate-y-1/2 rotate-180 h-8 w-8 text-primary" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* WhatsApp Integration Highlight */}
        <div className="mt-16 text-center">
          <Card className="bg-gradient-to-r from-green-500/10 to-green-600/10 border-green-200">
            <CardContent className="p-8">
              <div className="flex items-center justify-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <Bell className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold">Automatización WhatsApp</h3>
              </div>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Todos los avisos son completamente automáticos. Tus clientes reciben notificaciones instantáneas 
                cuando se libera una plaza, con enlaces directos para inscribirse en segundos.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};