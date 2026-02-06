import { Check, X, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

const ComparisonSection = () => {
  const { t } = useTranslation();

  const features = [
    { categoryKey: "landing.comparison.categories.classManagement", featureKey: "landing.comparison.features.digitalAttendance", excel: false, generic: false, padelock: true },
    { categoryKey: "landing.comparison.categories.classManagement", featureKey: "landing.comparison.features.customSchedules", excel: "partial", generic: false, padelock: true },
    { categoryKey: "landing.comparison.categories.classManagement", featureKey: "landing.comparison.features.automaticAttendance", excel: false, generic: false, padelock: true },
    { categoryKey: "landing.comparison.categories.communication", featureKey: "landing.comparison.features.integratedWhatsapp", excel: false, generic: false, padelock: true },
    { categoryKey: "landing.comparison.categories.communication", featureKey: "landing.comparison.features.automaticNotifications", excel: false, generic: true, padelock: true },
    { categoryKey: "landing.comparison.categories.recoveries", featureKey: "landing.comparison.features.waitlistSystem", excel: false, generic: false, padelock: true },
    { categoryKey: "landing.comparison.categories.recoveries", featureKey: "landing.comparison.features.automaticLevelAssignment", excel: false, generic: false, padelock: true },
    { categoryKey: "landing.comparison.categories.administrativeManagement", featureKey: "landing.comparison.features.paymentControl", excel: "partial", generic: true, padelock: true },
    { categoryKey: "landing.comparison.categories.administrativeManagement", featureKey: "landing.comparison.features.metricsDashboard", excel: false, generic: "partial", padelock: true },
    { categoryKey: "landing.comparison.categories.administrativeManagement", featureKey: "landing.comparison.features.multiClubManagement", excel: false, generic: false, padelock: true },
    { categoryKey: "landing.comparison.categories.experience", featureKey: "landing.comparison.features.designedForAcademies", excel: false, generic: false, padelock: true },
    { categoryKey: "landing.comparison.categories.experience", featureKey: "landing.comparison.features.supportIncluded", excel: false, generic: "partial", padelock: true },
  ];

  const renderIcon = (value: boolean | string) => {
    if (value === true) {
      return <Check className="h-4 w-4 md:h-5 md:w-5 text-green-600 mx-auto" />;
    } else if (value === "partial") {
      return <Minus className="h-4 w-4 md:h-5 md:w-5 text-yellow-600 mx-auto" />;
    } else {
      return <X className="h-4 w-4 md:h-5 md:w-5 text-red-400 mx-auto" />;
    }
  };

  // Group features by category
  const groupedFeatures = features.reduce((acc, item) => {
    if (!acc[item.categoryKey]) {
      acc[item.categoryKey] = [];
    }
    acc[item.categoryKey].push(item);
    return acc;
  }, {} as Record<string, typeof features>);

  return (
    <section id="comparison" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-playtomic-dark mb-4">
              {t("landing.comparison.title")}
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
              {t("landing.comparison.subtitle")}
            </p>
          </div>

          {/* Comparison Table */}
          <Card className="border-2 border-gray-200 overflow-hidden">
            <CardContent className="p-0">
              {/* Table Header */}
              <div className="grid grid-cols-4 bg-gray-50 border-b-2 border-gray-200">
                <div className="p-1.5 md:p-4 font-semibold text-[10px] md:text-sm text-gray-700 leading-tight">{t("landing.comparison.functionality")}</div>
                <div className="p-1.5 md:p-4 text-center font-semibold text-[10px] md:text-sm text-gray-700 border-l leading-tight">
                  <span className="hidden sm:inline">{t("landing.comparison.excelWhatsapp")}</span>
                  <span className="sm:hidden">Excel</span>
                </div>
                <div className="p-1.5 md:p-4 text-center font-semibold text-[10px] md:text-sm text-gray-700 border-l leading-tight">
                  <span className="hidden sm:inline">{t("landing.comparison.genericSoftware")}</span>
                  <span className="sm:hidden">Otro</span>
                </div>
                <div className="p-1.5 md:p-4 text-center font-semibold text-[10px] md:text-sm bg-playtomic-orange/10 text-playtomic-orange border-l-2 border-playtomic-orange/30 leading-tight">
                  <span className="hidden sm:inline">{t("landing.comparison.padelock")}</span>
                  <span className="sm:hidden">PL</span>
                </div>
              </div>

              {/* Table Body - Grouped by Category */}
              {Object.entries(groupedFeatures).map(([categoryKey, items], categoryIndex) => (
                <div key={categoryKey}>
                  {/* Category Header */}
                  <div className="bg-gray-100 px-1.5 md:px-4 py-1.5 md:py-2 font-semibold text-[10px] md:text-sm text-gray-600 border-b leading-tight">
                    {t(categoryKey)}
                  </div>

                  {/* Category Rows */}
                  {items.map((item, index) => (
                    <div
                      key={`${categoryKey}-${index}`}
                      className={`grid grid-cols-4 border-b ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                      }`}
                    >
                      <div className="p-1.5 md:p-4 text-[10px] md:text-sm text-gray-700 leading-tight flex items-center">{t(item.featureKey)}</div>
                      <div className="p-1 md:p-4 border-l flex items-center justify-center">
                        {renderIcon(item.excel)}
                      </div>
                      <div className="p-1 md:p-4 border-l flex items-center justify-center">
                        {renderIcon(item.generic)}
                      </div>
                      <div className="p-1 md:p-4 bg-playtomic-orange/5 border-l-2 border-playtomic-orange/30 flex items-center justify-center">
                        {renderIcon(item.padelock)}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 mt-8 text-xs md:text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span>{t("landing.comparison.legend.included")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Minus className="h-4 w-4 text-yellow-600" />
              <span>{t("landing.comparison.legend.partial")}</span>
            </div>
            <div className="flex items-center gap-2">
              <X className="h-4 w-4 text-red-400" />
              <span>{t("landing.comparison.legend.notAvailable")}</span>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="mt-12 text-center">
            <div className="inline-block bg-playtomic-orange/10 border-2 border-playtomic-orange/20 rounded-2xl p-6 md:p-8">
              <p className="text-lg md:text-xl text-playtomic-dark font-medium mb-2">
                {t("landing.comparison.cta.title")}
              </p>
              <p className="text-sm md:text-base text-gray-600">
                {t("landing.comparison.cta.subtitle")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ComparisonSection;
