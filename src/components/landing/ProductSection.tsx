import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Users, BarChart3, Calendar } from "lucide-react";
import { useTranslation } from "react-i18next";

const ProductSection = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("academia");

  const roles = [
    {
      id: "academia",
      titleKey: "landing.product.academia.title",
      icon: BarChart3,
      descriptionKey: "landing.product.academia.description",
      featureKeys: [
        "landing.product.academia.features.0",
        "landing.product.academia.features.1",
        "landing.product.academia.features.2",
        "landing.product.academia.features.3",
        "landing.product.academia.features.4",
        "landing.product.academia.features.5"
      ],
      benefitsKey: "landing.product.academia.benefits"
    },
    {
      id: "profesor",
      titleKey: "landing.product.profesor.title",
      icon: Users,
      descriptionKey: "landing.product.profesor.description",
      featureKeys: [
        "landing.product.profesor.features.0",
        "landing.product.profesor.features.1",
        "landing.product.profesor.features.2",
        "landing.product.profesor.features.3",
        "landing.product.profesor.features.4"
      ],
      benefitsKey: "landing.product.profesor.benefits"
    },
    {
      id: "jugador",
      titleKey: "landing.product.jugador.title",
      icon: Calendar,
      descriptionKey: "landing.product.jugador.description",
      featureKeys: [
        "landing.product.jugador.features.0",
        "landing.product.jugador.features.1",
        "landing.product.jugador.features.2",
        "landing.product.jugador.features.3",
        "landing.product.jugador.features.4",
        "landing.product.jugador.features.5"
      ],
      benefitsKey: "landing.product.jugador.benefits"
    }
  ];

  return (
    <section id="producto" className="py-20 bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-playtomic-dark mb-4">
              {t("landing.product.title")}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t("landing.product.subtitle")}
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
                    <span className="font-semibold">{t(role.titleKey)}</span>
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
                                {t(role.titleKey)}
                              </h3>
                              <p className="text-gray-600">{t(role.descriptionKey)}</p>
                            </div>
                          </div>

                          <ul className="space-y-3 mt-6">
                            {role.featureKeys.map((featureKey, idx) => (
                              <li key={idx} className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-playtomic-orange flex-shrink-0 mt-0.5" />
                                <span className="text-gray-700">{t(featureKey)}</span>
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
                              {t("landing.product.benefitsHeading")}
                            </h4>
                            <p className="text-gray-700">{t(role.benefitsKey)}</p>
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
