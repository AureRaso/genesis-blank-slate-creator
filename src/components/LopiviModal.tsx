import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LOPIVI_PROTOCOL } from "@/constants/lopiviProtocol";
import { Shield, AlertCircle } from "lucide-react";

interface LopiviModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const LopiviModal = ({ open, onOpenChange }: LopiviModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Shield className="h-6 w-6 text-blue-600" />
            {LOPIVI_PROTOCOL.title}
          </DialogTitle>
          <DialogDescription className="flex flex-col gap-1 pt-2">
            <span className="text-sm">
              Versión: {LOPIVI_PROTOCOL.version} | Última actualización: {LOPIVI_PROTOCOL.lastUpdated}
            </span>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Resumen */}
            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-r-lg">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-900 leading-relaxed">
                  {LOPIVI_PROTOCOL.summary}
                </p>
              </div>
            </div>

            {/* Secciones */}
            {LOPIVI_PROTOCOL.sections.map((section, index) => (
              <div key={index} className="space-y-3">
                <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">
                  {section.title}
                </h3>
                <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line pl-2">
                  {section.content}
                </div>
              </div>
            ))}

            {/* Declaración de Aceptación */}
            <div className="bg-slate-50 border-2 border-slate-200 p-5 rounded-lg mt-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-3">
                Declaración de Aceptación
              </h3>
              <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line mb-4">
                {LOPIVI_PROTOCOL.acceptance.text}
              </div>
              <p className="text-xs text-slate-500 font-medium border-t pt-3">
                Base legal: {LOPIVI_PROTOCOL.acceptance.legalBasis}
              </p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
