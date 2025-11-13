import { Shield, Smartphone, Bell, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";

const FeaturesHighlightSection = () => {
  const { t } = useTranslation();

  const features = [
    {
      icon: Shield,
      title: t("landing.features.lopiviTitle"),
      description: t("landing.features.lopiviDesc")
    },
    {
      icon: Smartphone,
      title: t("landing.features.simpleTitle"),
      description: t("landing.features.simpleDesc")
    },
    {
      icon: Bell,
      title: t("landing.features.notificationsTitle"),
      description: t("landing.features.notificationsDesc")
    },
    {
      icon: Globe,
      title: t("landing.features.webappTitle"),
      description: t("landing.features.webappDesc")
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-playtomic-dark">
              {t("landing.features.title")}
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              {t("landing.features.subtitle")}
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
