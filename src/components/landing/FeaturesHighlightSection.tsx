import { Shield, Smartphone, Bell, Globe } from "lucide-react";

const FeaturesHighlightSection = () => {
  const features = [
    {
      icon: Shield,
      title: "Cumplimos con la LOPIVI",
      description: "Padelock está desarrollado conforme a la Ley Orgánica de Protección Integral a la Infancia y la Adolescencia frente a la Violencia (LOPIVI). Esto garantiza que el entorno digital en el que trabajan los menores es seguro, responsable y cumple con toda la normativa vigente."
    },
    {
      icon: Smartphone,
      title: "Sencillo para todos",
      description: "No hace falta ser experto en tecnología. La interfaz de Padelock está pensada para que cualquier persona pueda usarla sin complicaciones, desde el primer momento. Todo se entiende a la primera: claro, directo y sin pasos innecesarios."
    },
    {
      icon: Bell,
      title: "Notificaciones en tiempo real",
      description: "Recibe avisos instantáneos por WhatsApp y correo electrónico para mantenerte siempre informado. Tanto si eres responsable, monitor o familiar, estarás al tanto de cada actualización sin necesidad de entrar en la plataforma."
    },
    {
      icon: Globe,
      title: "Sin descargas, sin complicaciones",
      description: "Padelock es una WebApp, por lo que no necesitas descargar ni instalar nada. Simplemente accede desde cualquier dispositivo a través de un enlace seguro y disfruta de todas las funcionalidades al instante. Funciona igual de bien en móvil, tablet u ordenador."
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-playtomic-dark">
              Más que una plataforma de gestión
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              Padelock integra seguridad, simplicidad y tecnología de vanguardia para ofrecerte una experiencia completa
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-2xl p-8 border border-gray-100 hover:shadow-xl hover:border-playtomic-orange/50 transition-all duration-300 shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-playtomic-orange rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-3 text-playtomic-dark">
                        {feature.title}
                      </h3>
                      <p className="text-gray-700 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesHighlightSection;
