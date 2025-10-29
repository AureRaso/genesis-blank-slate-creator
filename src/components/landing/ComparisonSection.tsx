import { Check, X, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const ComparisonSection = () => {
  const features = [
    { category: "Gestión de Clases", feature: "Pasar lista digital", excel: false, playtomic: false, padelock: true },
    { category: "Gestión de Clases", feature: "Horarios personalizados por profesor", excel: "partial", playtomic: false, padelock: true },
    { category: "Gestión de Clases", feature: "Control de asistencia automático", excel: false, playtomic: false, padelock: true },
    { category: "Comunicación", feature: "WhatsApp integrado", excel: false, playtomic: false, padelock: true },
    { category: "Comunicación", feature: "Notificaciones automáticas", excel: false, playtomic: true, padelock: true },
    { category: "Recuperaciones", feature: "Sistema de lista de espera", excel: false, playtomic: false, padelock: true },
    { category: "Recuperaciones", feature: "Asignación automática por nivel", excel: false, playtomic: false, padelock: true },
    { category: "Gestión Administrativa", feature: "Control de pagos", excel: "partial", playtomic: true, padelock: true },
    { category: "Gestión Administrativa", feature: "Dashboard con métricas", excel: false, playtomic: "partial", padelock: true },
    { category: "Gestión Administrativa", feature: "Gestión multi-club", excel: false, playtomic: false, padelock: true },
    { category: "Experiencia", feature: "Diseñado para academias", excel: false, playtomic: false, padelock: true },
    { category: "Experiencia", feature: "Soporte incluido", excel: false, playtomic: "partial", padelock: true },
  ];

  const renderIcon = (value: boolean | string) => {
    if (value === true) {
      return <Check className="h-5 w-5 text-green-600 mx-auto" />;
    } else if (value === "partial") {
      return <Minus className="h-5 w-5 text-yellow-600 mx-auto" />;
    } else {
      return <X className="h-5 w-5 text-red-400 mx-auto" />;
    }
  };

  // Group features by category
  const groupedFeatures = features.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof features>);

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-playtomic-dark mb-4">
              ¿Por qué Padelock?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Playtomic es genial para reservas de pistas. Padelock está diseñado específicamente para gestionar academias.
            </p>
          </div>

          {/* Comparison Table */}
          <Card className="border-2 border-gray-200 overflow-hidden">
            <CardContent className="p-0">
              {/* Table Header */}
              <div className="grid grid-cols-4 bg-gray-50 border-b-2 border-gray-200">
                <div className="p-4 font-semibold text-gray-700">Funcionalidad</div>
                <div className="p-4 text-center font-semibold text-gray-700 border-l">Excel</div>
                <div className="p-4 text-center font-semibold text-gray-700 border-l">Playtomic</div>
                <div className="p-4 text-center font-semibold bg-playtomic-orange/10 text-playtomic-orange border-l-2 border-playtomic-orange/30">
                  Padelock
                </div>
              </div>

              {/* Table Body - Grouped by Category */}
              {Object.entries(groupedFeatures).map(([category, items], categoryIndex) => (
                <div key={category}>
                  {/* Category Header */}
                  <div className="bg-gray-100 px-4 py-2 font-semibold text-sm text-gray-600 border-b">
                    {category}
                  </div>

                  {/* Category Rows */}
                  {items.map((item, index) => (
                    <div
                      key={`${category}-${index}`}
                      className={`grid grid-cols-4 border-b ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                      }`}
                    >
                      <div className="p-4 text-sm text-gray-700">{item.feature}</div>
                      <div className="p-4 border-l flex items-center justify-center">
                        {renderIcon(item.excel)}
                      </div>
                      <div className="p-4 border-l flex items-center justify-center">
                        {renderIcon(item.playtomic)}
                      </div>
                      <div className="p-4 bg-playtomic-orange/5 border-l-2 border-playtomic-orange/30 flex items-center justify-center">
                        {renderIcon(item.padelock)}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Legend */}
          <div className="flex items-center justify-center gap-8 mt-8 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span>Incluido</span>
            </div>
            <div className="flex items-center gap-2">
              <Minus className="h-4 w-4 text-yellow-600" />
              <span>Parcial</span>
            </div>
            <div className="flex items-center gap-2">
              <X className="h-4 w-4 text-red-400" />
              <span>No disponible</span>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="mt-12 text-center">
            <div className="inline-block bg-playtomic-orange/10 border-2 border-playtomic-orange/20 rounded-2xl p-8">
              <p className="text-xl text-playtomic-dark font-medium mb-2">
                Padelock complementa perfectamente a Playtomic
              </p>
              <p className="text-gray-600">
                Usa Playtomic para reservas de pistas y Padelock para gestionar tu academia
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ComparisonSection;
