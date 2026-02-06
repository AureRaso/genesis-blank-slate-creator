import { Smartphone, Bell, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";

const FeaturesHighlightSection = () => {
  const { t } = useTranslation();

  const features = [
    {
      icon: Smartphone,
      titleKey: "landing.features.simpleTitle",
      descKey: "landing.features.simpleDesc"
    },
    {
      icon: Bell,
      titleKey: "landing.features.notificationsTitle",
      descKey: "landing.features.notificationsDesc"
    },
    {
      icon: Globe,
      titleKey: "landing.features.webappTitle",
      descKey: "landing.features.webappDesc"
    }
  ];

  return (
    <section id="features" className="py-20 bg-gradient-to-br from-gray-50 to-white">
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
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-2xl p-8 border border-gray-100 hover:shadow-xl hover:border-playtomic-orange/50 transition-all duration-300 shadow-sm text-center"
                >
                  <div className="w-14 h-14 bg-playtomic-orange/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-7 h-7 text-playtomic-orange" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-playtomic-dark">
                    {t(feature.titleKey)}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {t(feature.descKey)}
                  </p>
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
