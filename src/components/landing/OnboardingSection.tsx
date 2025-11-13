import { Upload, Settings, Users, Coffee, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";

const OnboardingSection = () => {
  const steps = [
    {
      icon: Upload,
      title: "Envía tus cuadrantes",
      description: "En el formato que sea: Excel, PDF, imagen, notas, o cualquier archivo. No necesitas preparar nada especial ni organizar datos. Tal como lo tienes ahora, nos sirve."
    },
    {
      icon: Settings,
      title: "Nosotros configuramos todo",
      description: "Importamos tus cuadrantes, organizamos los horarios, preparamos los usuarios, configuramos roles y dejamos todo listo para funcionar. Tú no mueves un dedo."
    },
    {
      icon: Users,
      title: "Invitamos a tus alumnos",
      description: "Nos encargamos de invitar a todos tus alumnos a la plataforma, los guiamos paso a paso para que entren y les enseñamos cómo funciona la app. Sin complicaciones para ti ni para ellos."
    },
    {
      icon: Coffee,
      title: "Tú sigues con tu vida",
      description: "No dediques horas a aprender ni a configurar. Mientras preparamos todo, tú te enfocas en lo que realmente importa: dirigir tu academia y dar clases."
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-gray-900 via-playtomic-dark to-gray-900 text-white">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
              Onboarding sin esfuerzo
            </h2>
            <p className="text-xl text-gray-100 max-w-3xl mx-auto">
              El onboarding no requiere tiempo por tu parte. Nosotros nos encargamos del 100% de la configuración inicial y del acompañamiento a tus alumnos.
            </p>
          </div>

          {/* Steps Grid */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={index}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 hover:border-playtomic-orange/50 transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-playtomic-orange rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-3 text-white">
                        {step.title}
                      </h3>
                      <p className="text-gray-100 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Trial Guarantee Box */}
          <div className="bg-playtomic-orange/20 backdrop-blur-sm border-2 border-playtomic-orange rounded-2xl p-8 text-center">
            <div className="max-w-3xl mx-auto">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-playtomic-orange rounded-full mb-4">
                <Gift className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white">
                14 días de prueba gratuitos
              </h3>
              <p className="text-lg text-white mb-2 font-medium">
                Los 14 días de prueba empiezan solo cuando el 100% de tus alumnos están dentro de la plataforma.
              </p>
              <p className="text-gray-100">
                Garantizamos que empieces a probar Padelock en condiciones reales, con toda tu academia funcionando.
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <Button
              size="lg"
              className="bg-playtomic-orange hover:bg-playtomic-orange/90 text-white px-8"
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Comienza tu prueba gratuita
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OnboardingSection;
