import { Wallet, Construction } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function PlayerPaymentsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Wallet className="h-8 w-8" />
          Mis Pagos
        </h1>
        <p className="text-gray-600 mt-2">Gestiona los pagos de tus clases mensuales</p>
      </div>

      <Card className="p-12 text-center">
        <Construction className="h-16 w-16 text-amber-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          Proximamente
        </h3>
        <p className="text-gray-500">
          Esta funcionalidad estara disponible muy pronto.
        </p>
        <p className="text-gray-400 text-sm mt-4">
          Estamos trabajando para ofrecerte la mejor experiencia de gestion de pagos.
        </p>
      </Card>
    </div>
  );
}
