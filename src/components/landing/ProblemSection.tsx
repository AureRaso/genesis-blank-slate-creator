import { AlertTriangle, Clock, TrendingDown, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

const ProblemSection = () => {
  const { t } = useTranslation();

  const problems = [
    {
      icon: Clock,
      titleKey: "landing.problem.problem1Title",
      descKey: "landing.problem.problem1Desc"
    },
    {
      icon: TrendingDown,
      titleKey: "landing.problem.problem2Title",
      descKey: "landing.problem.problem2Desc"
    },
    {
      icon: Users,
      titleKey: "landing.problem.problem3Title",
      descKey: "landing.problem.problem3Desc"
    },
    {
      icon: AlertTriangle,
      titleKey: "landing.problem.problem4Title",
      descKey: "landing.problem.problem4Desc"
    }
  ];

  return (
    <section id="problem" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-playtomic-dark mb-4">
              {t("landing.problem.title")}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t("landing.problem.subtitle")}
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
                        {t(problem.titleKey)}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {t(problem.descKey)}
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

export default ProblemSection;
