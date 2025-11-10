import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Users, BarChart3, Calendar } from "lucide-react";

const ProductSection = () => {
  const [activeTab, setActiveTab] = useState("academia");

  const roles = [
    {
      id: "academia",
      title: "Academia",
      icon: BarChart3,
      description: "Control total de tu academia desde un solo panel",
      features: [
        "Dashboard con métricas en tiempo real de asistencia",
        "Control completo de pagos y facturación",
        "Visión global de todos los horarios y profesores",
        "Gestión automatizada de recuperaciones",
        "Informes detallados sobre rendimiento de la academia",
        "Asignación inteligente de alumnos por nivel"
      ],
      benefits: "Ahorra 4 horas diarias en tareas administrativas"
    },
    {
      id: "profesor",
      title: "Profesor",
      icon: Users,
      description: "Todo lo que necesitas para gestionar tus clases",
      features: [
        "Pasa lista en segundos con un solo clic",
        "Comunica con alumnos directamente por WhatsApp sin cambiar de app",
        "Ve tu horario completo de la semana de un vistazo",
        "Gestiona recuperaciones y lista de espera automáticamente",
        "Accede a la información de tus alumnos al instante"
      ],
      benefits: "Reduce el tiempo de gestión de 30 minutos a 2 minutos por clase"
    },
    {
      id: "jugador",
      title: "Jugador",
      icon: Calendar,
      description: "Tu academia siempre contigo, en tu móvil",
      features: [
        "Recibe notificaciones instantáneas de cambios en tus clases",
        "Calendario personal con todas tus clases",
        "Gestiona tus recuperaciones fácilmente",
        "Apúntate a lista de espera cuando hay baja",
        "Comunicación directa con tu profesor",
        "Consulta tu progreso y nivel"
      ],
      benefits: "Experiencia moderna y profesional que mejora la satisfacción"
    }
  ];

  return (
    <section id="producto" className="py-20 bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-playtomic-dark mb-4">
              Diseñado para cada rol
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Academias, profesores y jugadores tienen experiencias optimizadas para sus necesidades específicas
            </p>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8 h-auto p-1">
              {roles.map((role) => {
                const Icon = role.icon;
                return (
                  <TabsTrigger
                    key={role.id}
                    value={role.id}
                    className="flex flex-col items-center gap-2 py-4 data-[state=active]:bg-playtomic-orange data-[state=active]:text-white"
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-semibold">{role.title}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {roles.map((role) => {
              const Icon = role.icon;
              return (
                <TabsContent key={role.id} value={role.id}>
                  <Card className="border-2 border-playtomic-orange/20">
                    <CardContent className="p-8">
                      <div className="grid md:grid-cols-2 gap-8">
                        {/* Left Column - Features */}
                        <div>
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-playtomic-orange/10 rounded-lg flex items-center justify-center">
                              <Icon className="h-6 w-6 text-playtomic-orange" />
                            </div>
                            <div>
                              <h3 className="text-2xl font-bold text-playtomic-dark">
                                {role.title}
                              </h3>
                              <p className="text-gray-600">{role.description}</p>
                            </div>
                          </div>

                          <ul className="space-y-3 mt-6">
                            {role.features.map((feature, idx) => (
                              <li key={idx} className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-playtomic-orange flex-shrink-0 mt-0.5" />
                                <span className="text-gray-700">{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Right Column - Screenshot & Benefits */}
                        <div className="space-y-6">
                          {/* Screenshot */}
                          {role.id === "academia" ? (
                            <div className="rounded-xl overflow-hidden border-2 border-playtomic-orange/20 shadow-lg">
                              <img
                                src="/173shots_so.png"
                                alt="Vista de Academia - Dashboard de PadeLock"
                                className="w-full h-auto object-cover"
                              />
                            </div>
                          ) : role.id === "profesor" ? (
                            <div className="rounded-xl overflow-hidden border-2 border-playtomic-orange/20 shadow-lg">
                              <img
                                src="/992shots_so.png"
                                alt="Vista de Profesor - Clases Programadas de PadeLock"
                                className="w-full h-auto object-cover"
                              />
                            </div>
                          ) : (
                            <div className="rounded-xl overflow-hidden border-2 border-playtomic-orange/20 shadow-lg">
                              <img
                                src="/118shots_so.png"
                                alt="Vista de Profesor - Clases Programadas de PadeLock"
                                className="w-full h-auto object-cover"
                              />
                            </div>
                          )}

                          {/* Benefits Card */}
                          <div className="bg-playtomic-orange/10 rounded-xl p-6 border-2 border-playtomic-orange/20">
                            <h4 className="font-bold text-playtomic-dark mb-2">
                              💡 Beneficio clave
                            </h4>
                            <p className="text-gray-700">{role.benefits}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              );
            })}
          </Tabs>
        </div>
      </div>
    </section>
  );
};

export default ProductSection;
