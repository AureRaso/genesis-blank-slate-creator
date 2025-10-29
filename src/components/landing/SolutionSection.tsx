import { CheckCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const SolutionSection = () => {
  const features = [
    {
      role: "Profesores",
      description: "Gestión de clases, asistencia y comunicación directa por WhatsApp",
      benefits: [
        "Pasa lista en segundos",
        "Comunica con alumnos sin cambiar de app",
        "Ve tu horario completo de un vistazo"
      ]
    },
    {
      role: "Entrenadores",
      description: "Visión global de la academia: horarios, pagos y rendimiento",
      benefits: [
        "Control total de asistencia y recuperaciones",
        "Dashboard con métricas en tiempo real",
        "Gestión automatizada de pagos"
      ]
    },
    {
      role: "Jugadores",
      description: "Calendario personal, notificaciones y comunicación fluida",
      benefits: [
        "Recibe avisos de cambios al instante",
        "Gestiona tus recuperaciones fácilmente",
        "Mantente conectado con tu academia"
      ]
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-playtomic-orange/5 to-white">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-playtomic-orange/10 border border-playtomic-orange/20 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-playtomic-orange" />
              <span className="text-sm font-medium text-playtomic-orange">
                Nuestro ingrediente secreto
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-playtomic-dark mb-4">
              Una plataforma, todo bajo control
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Reduce a la mitad las horas de gestión, mejorando la experiencia de
              jugadores, entrenadores y responsables
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100"
              >
                <div className="mb-4">
                  <h3 className="text-2xl font-bold text-playtomic-dark mb-2">
                    {feature.role}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {feature.description}
                  </p>
                </div>
                <ul className="space-y-3">
                  {feature.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-playtomic-orange flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Key Differentiator */}
          <div className="bg-playtomic-orange/10 border-2 border-playtomic-orange/20 rounded-2xl p-8 text-center">
            <p className="text-lg text-playtomic-dark font-medium mb-2">
              A diferencia de herramientas genéricas como Playtomic
            </p>
            <p className="text-xl font-bold text-playtomic-orange">
              Padelock entiende las dinámicas reales de una academia
            </p>
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <Button
              size="lg"
              className="bg-playtomic-orange hover:bg-playtomic-orange/90"
              onClick={() => document.getElementById('producto')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Descubre cómo funciona
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SolutionSection;
