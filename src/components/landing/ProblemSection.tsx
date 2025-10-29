import { AlertTriangle, Clock, TrendingDown, Users } from "lucide-react";

const ProblemSection = () => {
  const problems = [
    {
      icon: Clock,
      title: "4 horas diarias perdidas",
      description: "Cuadrar horarios, controlar pagos y actualizar listas manualmente consume tiempo valioso que podrías dedicar a lo que realmente importa."
    },
    {
      icon: TrendingDown,
      title: "Descontrol total de cuentas",
      description: "Sin visibilidad clara sobre cuántos alumnos activos hay realmente ni cuánto se está ganando. Todo estimado, nada certero."
    },
    {
      icon: Users,
      title: "Clases desbalanceadas",
      description: "Falta de control en la asistencia y gestión de recuperaciones genera clases con números irregulares y experiencia inconsistente."
    },
    {
      icon: AlertTriangle,
      title: "Experiencia poco profesional",
      description: "Excel, WhatsApp y papel transmiten una imagen amateur que no refleja la calidad de tu academia ni el nivel de tus entrenadores."
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-playtomic-dark mb-4">
              ¿Te suena familiar?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              El 87% de las academias de pádel gestionan con Excel, WhatsApp y papel.
              El resultado: caos operativo y oportunidades perdidas.
            </p>
          </div>

          {/* Problems Grid */}
          <div className="grid md:grid-cols-2 gap-8">
            {problems.map((problem, index) => {
              const Icon = problem.icon;
              return (
                <div
                  key={index}
                  className="group p-8 rounded-2xl border-2 border-gray-100 hover:border-playtomic-orange/30 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                      <Icon className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-playtomic-dark mb-2">
                        {problem.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {problem.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom CTA */}
          <div className="mt-12 text-center">
            <p className="text-lg text-gray-700 font-medium">
              <span className="text-playtomic-orange">El Head of Coach</span> es quien más sufre esta situación.
              <br />
              Es hora de cambiar eso.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
