import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, GraduationCap, Zap, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FloatingCreateButton() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleCreateClass = () => {
    navigate("/dashboard/scheduled-classes/new");
    setIsOpen(false);
  };

  const handleBulkCreate = () => {
    navigate("/dashboard/scheduled-classes/bulk/new");
    setIsOpen(false);
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Floating buttons container */}
      <div className="fixed bottom-20 right-4 z-50 md:hidden flex flex-col items-end gap-3">
        {/* Action buttons - only show when open */}
        {isOpen && (
          <div className="flex flex-col items-end gap-3 animate-in slide-in-from-bottom-2 fade-in duration-200">
            {/* Bulk Create Button */}
            <div className="flex items-center gap-3">
              <span className="bg-gray-900 text-white text-sm px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
                Creación masiva
              </span>
              <Button
                onClick={handleBulkCreate}
                size="lg"
                className="h-12 w-12 rounded-full shadow-lg bg-gradient-to-r from-primary/90 to-orange-500/90 hover:from-primary hover:to-orange-500"
              >
                <Zap className="h-5 w-5" />
              </Button>
            </div>

            {/* Create Class Button */}
            <div className="flex items-center gap-3">
              <span className="bg-gray-900 text-white text-sm px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
                Crear Clase
              </span>
              <Button
                onClick={handleCreateClass}
                size="lg"
                className="h-12 w-12 rounded-full shadow-lg bg-gradient-to-r from-primary/90 to-orange-600/90 hover:from-primary hover:to-orange-600"
              >
                <GraduationCap className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}

        {/* Main FAB */}
        <Button
          onClick={() => setIsOpen(!isOpen)}
          size="lg"
          className={cn(
            "h-14 w-14 rounded-full shadow-xl transition-all duration-200",
            isOpen
              ? "bg-gray-700 hover:bg-gray-800 rotate-45"
              : "bg-primary hover:bg-primary/90"
          )}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </>
  );
}
