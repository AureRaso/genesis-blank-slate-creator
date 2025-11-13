import { Upload, Settings, Users, Coffee, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

const OnboardingSection = () => {
  const { t } = useTranslation();

  const steps = [
    {
      icon: Upload,
      titleKey: "landing.onboarding.step1Title",
      descKey: "landing.onboarding.step1Desc"
    },
    {
      icon: Settings,
      titleKey: "landing.onboarding.step2Title",
      descKey: "landing.onboarding.step2Desc"
    },
    {
      icon: Users,
      titleKey: "landing.onboarding.step3Title",
      descKey: "landing.onboarding.step3Desc"
    },
    {
      icon: Coffee,
      titleKey: "landing.onboarding.step4Title",
      descKey: "landing.onboarding.step4Desc"
    }
  ];

  return (
    <section id="onboarding" className="py-20 bg-gradient-to-br from-gray-900 via-playtomic-dark to-gray-900 text-white">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
              {t("landing.onboarding.title")}
            </h2>
            <p className="text-xl text-gray-100 max-w-3xl mx-auto">
              {t("landing.onboarding.subtitle")}
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
                        {t(step.titleKey)}
                      </h3>
                      <p className="text-gray-100 leading-relaxed">
                        {t(step.descKey)}
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
                {t("landing.onboarding.trialTitle")}
              </h3>
              <p className="text-lg text-white mb-2 font-medium">
                {t("landing.onboarding.trialDesc1")}
              </p>
              <p className="text-gray-100">
                {t("landing.onboarding.trialDesc2")}
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
              {t("landing.onboarding.ctaButton")}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OnboardingSection;
