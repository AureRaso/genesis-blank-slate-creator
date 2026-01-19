import { useState, useMemo } from "react";
import { ArrowLeft, Check, Loader2, Search, Users, Calendar, Euro } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useActivePaymentRates, PaymentRate } from "@/hooks/usePaymentRates";
import {
  useStudentsWithAssignments,
  useBulkAssignRate,
  StudentWithAssignment,
} from "@/hooks/useRateAssignments";

const PERIODICITY_LABELS: Record<string, string> = {
  mensual: "Mensual",
  trimestral: "Trimestral",
  semestral: "Semestral",
  anual: "Anual",
};

export default function AssignRatesPage() {
  const { data: rates, isLoading: ratesLoading } = useActivePaymentRates();
  const { data: students, isLoading: studentsLoading } = useStudentsWithAssignments();
  const bulkAssign = useBulkAssignRate();

  // Form state
  const [selectedRateId, setSelectedRateId] = useState<string>("");
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAssigned, setFilterAssigned] = useState<"all" | "assigned" | "unassigned">("all");

  // Get selected rate details
  const selectedRate = useMemo(() => {
    return rates?.find((r) => r.id === selectedRateId) || null;
  }, [rates, selectedRateId]);

  // Filter students
  const filteredStudents = useMemo(() => {
    if (!students) return [];

    return students.filter((student) => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        student.full_name.toLowerCase().includes(searchLower) ||
        student.email.toLowerCase().includes(searchLower);

      // Assignment filter
      let matchesAssignment = true;
      if (filterAssigned === "assigned") {
        matchesAssignment = !!student.current_assignment;
      } else if (filterAssigned === "unassigned") {
        matchesAssignment = !student.current_assignment;
      }

      return matchesSearch && matchesAssignment;
    });
  }, [students, searchTerm, filterAssigned]);

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = filteredStudents.map((s) => s.id);
      setSelectedStudents(new Set(allIds));
    } else {
      setSelectedStudents(new Set());
    }
  };

  // Handle individual selection
  const handleSelectStudent = (studentId: string, checked: boolean) => {
    const newSelected = new Set(selectedStudents);
    if (checked) {
      newSelected.add(studentId);
    } else {
      newSelected.delete(studentId);
    }
    setSelectedStudents(newSelected);
  };

  // Handle submit
  const handleAssign = async () => {
    if (!selectedRateId || selectedStudents.size === 0) return;

    await bulkAssign.mutateAsync({
      student_enrollment_ids: Array.from(selectedStudents),
      payment_rate_id: selectedRateId,
      start_date: startDate,
      end_date: endDate || null,
    });

    // Reset selection
    setSelectedStudents(new Set());
  };

  const isLoading = ratesLoading || studentsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const formatPrice = (rate: PaymentRate) => {
    if (rate.rate_type === "fija" && rate.fixed_price) {
      return `${rate.fixed_price.toFixed(2)} €`;
    }
    if (rate.rate_type === "por_clase" && rate.price_per_class) {
      return `${rate.price_per_class.toFixed(2)} € / clase`;
    }
    return "-";
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button asChild variant="ghost" size="icon">
          <Link to="/dashboard/payment-rates">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Asignar Tarifas</h1>
          <p className="text-gray-500 text-sm mt-1">
            Selecciona una tarifa y asígnala a múltiples alumnos
          </p>
        </div>
      </div>

      {/* Step 1: Select Rate */}
      <Card className="p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
            1
          </div>
          <h2 className="text-lg font-semibold">Seleccionar Tarifa</h2>
        </div>

        {rates && rates.length > 0 ? (
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Tarifa a asignar *</Label>
              <Select value={selectedRateId} onValueChange={setSelectedRateId}>
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue placeholder="Selecciona una tarifa..." />
                </SelectTrigger>
                <SelectContent>
                  {rates.map((rate) => (
                    <SelectItem key={rate.id} value={rate.id}>
                      {rate.name} - {formatPrice(rate)} ({PERIODICITY_LABELS[rate.periodicity]})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedRate && (
              <div className="p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Euro className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      <strong>Precio:</strong> {formatPrice(selectedRate)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      <strong>Periodicidad:</strong>{" "}
                      {PERIODICITY_LABELS[selectedRate.periodicity]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      <strong>Día de cobro:</strong> {selectedRate.billing_day}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4 max-w-md">
              <div className="grid gap-2">
                <Label htmlFor="start_date">Fecha Inicio *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="end_date">Fecha Fin (opcional)</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Euro className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">
              No hay tarifas activas. Crea una tarifa primero.
            </p>
            <Button asChild>
              <Link to="/dashboard/payment-rates">Ir a Tarifas</Link>
            </Button>
          </div>
        )}
      </Card>

      {/* Step 2: Select Students */}
      {selectedRateId && (
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
              2
            </div>
            <h2 className="text-lg font-semibold">Seleccionar Alumnos</h2>
            {selectedStudents.size > 0 && (
              <Badge className="ml-2 bg-primary">
                {selectedStudents.size} seleccionados
              </Badge>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={filterAssigned}
              onValueChange={(v: "all" | "assigned" | "unassigned") =>
                setFilterAssigned(v)
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="assigned">Con tarifa</SelectItem>
                <SelectItem value="unassigned">Sin tarifa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Students Table */}
          {filteredStudents.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={
                          filteredStudents.length > 0 &&
                          filteredStudents.every((s) => selectedStudents.has(s.id))
                        }
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Alumno</TableHead>
                    <TableHead>Tarifa Actual</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedStudents.has(student.id)}
                          onCheckedChange={(checked) =>
                            handleSelectStudent(student.id, checked as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {student.full_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{student.full_name}</p>
                            <p className="text-xs text-gray-500">{student.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {student.current_assignment ? (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                            {student.current_assignment.payment_rate?.name || "Tarifa asignada"}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-50 text-gray-500">
                            Sin tarifa
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 border rounded-lg border-dashed">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm
                  ? "No se encontraron alumnos con ese criterio"
                  : "No hay alumnos registrados"}
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Step 3: Confirm */}
      {selectedRateId && selectedStudents.size > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
              3
            </div>
            <h2 className="text-lg font-semibold">Confirmar Asignación</h2>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Tarifa</p>
                <p className="font-medium">{selectedRate?.name}</p>
              </div>
              <div>
                <p className="text-gray-500">Alumnos</p>
                <p className="font-medium">{selectedStudents.size}</p>
              </div>
              <div>
                <p className="text-gray-500">Fecha Inicio</p>
                <p className="font-medium">
                  {new Date(startDate).toLocaleDateString("es-ES")}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Fecha Fin</p>
                <p className="font-medium">
                  {endDate
                    ? new Date(endDate).toLocaleDateString("es-ES")
                    : "Indefinido"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setSelectedStudents(new Set())}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAssign}
              disabled={bulkAssign.isPending}
            >
              {bulkAssign.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Asignar Tarifa
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
