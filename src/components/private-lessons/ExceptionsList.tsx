import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PrivateLessonException, useDeleteException } from "@/hooks/usePrivateLessons";
import AddExceptionDialog from "./AddExceptionDialog";

interface ExceptionsListProps {
  exceptions: PrivateLessonException[];
  trainerProfileId: string;
  clubId: string;
}

const ExceptionsList = ({ exceptions, trainerProfileId, clubId }: ExceptionsListProps) => {
  const { t } = useTranslation();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const deleteMutation = useDeleteException();

  const typeLabels: Record<string, string> = {
    block_day: t("privateLessons.exceptions.blockDay", "Bloquear día"),
    extra_day: t("privateLessons.exceptions.extraDay", "Día extra"),
    vacation: t("privateLessons.exceptions.vacation", "Vacaciones"),
  };

  const typeBadgeVariants: Record<string, string> = {
    block_day: "bg-red-100 text-red-700",
    extra_day: "bg-green-100 text-green-700",
    vacation: "bg-purple-100 text-purple-700",
  };

  const formatDate = (date: string | null) => {
    if (!date) return "—";
    const [y, m, d] = date.split("-");
    return `${d}/${m}/${y}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t("privateLessons.exceptions.description", "Gestiona bloqueos, días extra y vacaciones.")}
        </p>
        <Button size="sm" onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-1" />
          {t("privateLessons.exceptions.add", "Añadir excepción")}
        </Button>
      </div>

      {exceptions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          {t("privateLessons.exceptions.noExceptions", "No hay excepciones configuradas.")}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("privateLessons.exceptions.type", "Tipo")}</TableHead>
                <TableHead>{t("privateLessons.exceptions.date", "Fecha(s)")}</TableHead>
                <TableHead>{t("privateLessons.exceptions.reason", "Motivo")}</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {exceptions.map((ex) => (
                <TableRow key={ex.id}>
                  <TableCell>
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${typeBadgeVariants[ex.exception_type] || ""}`}>
                      {typeLabels[ex.exception_type] || ex.exception_type}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">
                    {ex.exception_type === "vacation"
                      ? `${formatDate(ex.start_date)} — ${formatDate(ex.end_date)}`
                      : formatDate(ex.exception_date)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {ex.reason || "—"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-700"
                      onClick={() => deleteMutation.mutate(ex.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AddExceptionDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        trainerProfileId={trainerProfileId}
        clubId={clubId}
      />
    </div>
  );
};

export default ExceptionsList;