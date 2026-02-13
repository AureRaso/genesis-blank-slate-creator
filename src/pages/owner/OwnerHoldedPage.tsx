import OwnerLayout from "@/components/OwnerLayout";
import { HoldedPendingInvoices } from "@/components/HoldedPendingInvoices";

export const OwnerHoldedPage = () => {
  return (
    <OwnerLayout>
      <div className="flex flex-col gap-4 sm:gap-6 p-3 sm:p-4 lg:p-6">
        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
            Facturación Holded
          </h1>
          <p className="text-sm sm:text-base text-gray-500">
            Gestiona las facturas sincronizadas con Holded de todos los clubes
          </p>
        </div>
        <HoldedPendingInvoices />
      </div>
    </OwnerLayout>
  );
};

export default OwnerHoldedPage;