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
    title: "Alumnos se inscriben",
    description: "Los jugadores hacen clic en el enlace y se inscriben directamente",
    color: "bg-orange-500",
  },
  {
    icon: CreditCard,
    title: "Gestión de pagos",
    description: "Los alumnos realizan el pago según el método habitual del club",
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
    <section id="workflow">
      <div className="container max-w-7xl mx-auto px-4 w-full">
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
              <div key={index}>
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
              </div>
            ))}
          </div>

          {/* Desktop Layout */}
          <div className="hidden lg:block">
            <div className="grid grid-cols-3 gap-8">
              {/* First Row */}
              {workflowSteps.slice(0, 3).map((step, index) => (
                <div key={index}>
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
                </div>
              ))}
            </div>

            <div className="my-8"></div>

            {/* Second Row - Steps 4, 5, 6 */}
            <div className="grid grid-cols-3 gap-8">
              {workflowSteps.slice(3).map((step, index) => {
                const stepIndex = index + 3;
                return (
                  <div key={stepIndex}>
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6 text-center space-y-4">
                        <div className={`w-16 h-16 ${step.color} rounded-full flex items-center justify-center mx-auto`}>
                          <step.icon className="h-8 w-8 text-white" />
                        </div>
                        <div className="space-y-2">
                          <div className="bg-primary text-primary-foreground text-sm font-bold px-3 py-1 rounded-full inline-block">
                            Paso {stepIndex + 1}
                          </div>
                          <h3 className="font-semibold text-lg">{step.title}</h3>
                          <p className="text-muted-foreground text-sm">{step.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};