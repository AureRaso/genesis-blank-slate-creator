import { TrendingUp, Users, Building2, Zap } from "lucide-react";

const WhyNowSection = () => {
  const stats = [
    {
      icon: Building2,
      number: "4.500",
      label: "Clubes en España",
      description: "Un mercado en constante crecimiento"
    },
    {
      icon: TrendingUp,
      number: "9",
      label: "Clubes nuevos al día",
      description: "El sector no para de crecer"
    },
    {
      icon: Users,
      number: "30M",
      label: "Jugadores globales",
      description: "El pádel es un fenómeno mundial"
    },
    {
      icon: Zap,
      number: "4h",
      label: "Ahorradas al día",
      description: "Con Padelock vs métodos manuales"
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-playtomic-dark mb-4">
              ¿Por qué ahora?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              El pádel está en su mejor momento y las academias necesitan herramientas profesionales para seguir creciendo
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className="text-center p-6 rounded-2xl bg-gradient-to-br from-playtomic-orange/5 to-white border border-playtomic-orange/10 hover:shadow-lg transition-all duration-300"
                >
                  <div className="w-16 h-16 bg-playtomic-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-playtomic-orange" />
                  </div>
                  <div className="text-4xl font-bold text-playtomic-dark mb-2">
                    {stat.number}
                  </div>
                  <div className="text-lg font-semibold text-gray-700 mb-1">
                    {stat.label}
                  </div>
                  <p className="text-sm text-gray-500">
                    {stat.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Bottom Message */}
          <div className="mt-16 text-center">
            <div className="inline-block bg-playtomic-orange/10 border-2 border-playtomic-orange/20 rounded-2xl p-8">
              <p className="text-xl text-playtomic-dark font-medium">
                Las academias que <span className="text-playtomic-orange font-bold">se digitalizan ahora</span> están ganando una ventaja competitiva decisiva
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyNowSection;
