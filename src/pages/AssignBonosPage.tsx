import { useState, useMemo } from "react";
import { ArrowLeft, Check, Loader2, Search, Users, Ticket, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
import { useActiveBonoTemplates, BonoTemplate } from "@/hooks/useBonoTemplates";
import { useBulkAssignBono } from "@/hooks/useStudentBonos";
import { useStudentsWithAssignments } from "@/hooks/useRateAssignments";
import { useClubs } from "@/hooks/useClubs";
import { formatCurrency } from "@/lib/currency";

export default function AssignBonosPage() {
  const { t } = useTranslation();
  const { data: templates, isLoading: templatesLoading } = useActiveBonoTemplates();
  const { data: students, isLoading: studentsLoading } = useStudentsWithAssignments();
  const { data: clubs } = useClubs();
  const bulkAssign = useBulkAssignBono();

  const clubCurrency = clubs?.[0]?.currency || 'EUR';

  // Form state
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");

  // Get selected template details
  const selectedTemplate = useMemo(() => {
    return templates?.find((t) => t.id === selectedTemplateId) || null;
  }, [templates, selectedTemplateId]);

  // Filter students by search
  const filteredStudents = useMemo(() => {
    if (!students) return [];

    if (!searchTerm) return students;

    const searchLower = searchTerm.toLowerCase();
    return students.filter((student) =>
      student.full_name.toLowerCase().includes(searchLower) ||
      student.email.toLowerCase().includes(searchLower)
    );
  }, [students, searchTerm]);

  // Selection helpers
  const filteredSelectionState = useMemo(() => {
    if (filteredStudents.length === 0) return { allSelected: false, someSelected: false, selectedCount: 0 };

    const selectedInFiltered = filteredStudents.filter(s => selectedStudents.has(s.id));
    const selectedCount = selectedInFiltered.length;
    const allSelected = selectedCount === filteredStudents.length;
    const someSelected = selectedCount > 0 && !allSelected;

    return { allSelected, someSelected, selectedCount };
  }, [filteredStudents, selectedStudents]);

  const handleSelectAll = (checked: boolean) => {
    const newSelected = new Set(selectedStudents);
    if (checked) {
      filteredStudents.forEach(s => newSelected.add(s.id));
    } else {
      filteredStudents.forEach(s => newSelected.delete(s.id));
    }
    setSelectedStudents(newSelected);
  };

  const handleSelectStudent = (studentId: string, checked: boolean) => {
    const newSelected = new Set(selectedStudents);
    if (checked) {
      newSelected.add(studentId);
    } else {
      newSelected.delete(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const handleAssign = async () => {
    if (!selectedTemplateId || selectedStudents.size === 0) return;

    await bulkAssign.mutateAsync({
      bonoTemplateId: selectedTemplateId,
      studentEnrollmentIds: Array.from(selectedStudents),
    });

    // Reset selection
    setSelectedStudents(new Set());
  };

  const formatValidity = (days: number | null) => {
    if (!days) return t("bonoTemplates.table.noExpiry");
    if (days >= 365) {
      const years = Math.floor(days / 365);
      return `${years} ${years === 1 ? t("bonoTemplates.table.year") : t("bonoTemplates.table.years")}`;
    }
    if (days >= 30) {
      const months = Math.floor(days / 30);
      return `${months} ${months === 1 ? t("bonoTemplates.table.month") : t("bonoTemplates.table.months")}`;
    }
    return `${days} ${t("bonoTemplates.table.days")}`;
  };

  const isLoading = templatesLoading || studentsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button asChild variant="ghost" size="icon">
          <Link to="/dashboard/bono-templates">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("assignBonos.title")}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {t("assignBonos.subtitle")}
          </p>
        </div>
      </div>

      {/* Step 1: Select Template */}
      <Card className="p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
            1
          </div>
          <h2 className="text-lg font-semibold">{t("assignBonos.step1.title")}</h2>
        </div>

        {templates && templates.length > 0 ? (
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>{t("assignBonos.step1.templateLabel")}</Label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue placeholder={t("assignBonos.step1.templatePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} - {template.total_classes} {t("bonoTemplates.table.classesUnit")} - {formatCurrency(template.price, clubCurrency)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTemplate && (
              <div className="p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-center gap-4 flex-wrap text-sm">
                  <div>
                    <span className="text-gray-500">{t("assignBonos.step1.classes")}:</span>{" "}
                    <strong>{selectedTemplate.total_classes}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500">{t("assignBonos.step1.price")}:</span>{" "}
                    <strong>{formatCurrency(selectedTemplate.price, clubCurrency)}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500">{t("assignBonos.step1.pricePerClass")}:</span>{" "}
                    <strong>{formatCurrency(selectedTemplate.price / selectedTemplate.total_classes, clubCurrency)}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500">{t("assignBonos.step1.validity")}:</span>{" "}
                    <strong>{formatValidity(selectedTemplate.validity_days)}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Ticket className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">
              {t("assignBonos.step1.noActiveTemplates")}
            </p>
            <Button asChild>
              <Link to="/dashboard/bono-templates">{t("assignBonos.step1.goToTemplates")}</Link>
            </Button>
          </div>
        )}
      </Card>

      {/* Step 2: Select Students */}
      {selectedTemplateId && (
        <Card className="p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
                2
              </div>
              <h2 className="text-lg font-semibold">{t("assignBonos.step2.title")}</h2>
              {selectedStudents.size > 0 && (
                <Badge className="ml-2 bg-primary">
                  {t("assignBonos.step2.selectedCount", { count: selectedStudents.size })}
                </Badge>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="flex flex-col gap-3 mb-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t("assignBonos.step2.searchPlaceholder")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchTerm("")}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-3 w-3 mr-1" />
                  {t("assignBonos.step2.clearSearch")}
                </Button>
              )}
            </div>

            <span className="text-sm text-gray-500">
              {t("assignBonos.step2.showingResults", {
                filtered: filteredStudents.length,
                total: students?.length || 0,
              })}
            </span>
          </div>

          {/* Students Table */}
          {filteredStudents.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={
                            filteredSelectionState.allSelected
                              ? true
                              : filteredSelectionState.someSelected
                              ? "indeterminate"
                              : false
                          }
                          onCheckedChange={handleSelectAll}
                        />
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          ({filteredStudents.length})
                        </span>
                      </div>
                    </TableHead>
                    <TableHead>{t("assignBonos.step2.tableStudent")}</TableHead>
                    <TableHead>{t("assignBonos.step2.tableEmail")}</TableHead>
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
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 hidden sm:flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {student.full_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <p className="font-medium">{student.full_name}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-500 text-sm">
                        {student.email}
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
                  ? t("assignBonos.step2.noStudentsFound")
                  : t("assignBonos.step2.noStudentsRegistered")}
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Step 3: Confirm */}
      {selectedTemplateId && selectedStudents.size > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
              3
            </div>
            <h2 className="text-lg font-semibold">{t("assignBonos.step3.title")}</h2>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500">{t("assignBonos.step3.template")}</p>
                <p className="font-medium">{selectedTemplate?.name}</p>
              </div>
              <div>
                <p className="text-gray-500">{t("assignBonos.step3.students")}</p>
                <p className="font-medium">{selectedStudents.size}</p>
              </div>
              <div>
                <p className="text-gray-500">{t("assignBonos.step3.totalPrice")}</p>
                <p className="font-medium">
                  {selectedTemplate
                    ? formatCurrency(selectedTemplate.price * selectedStudents.size, clubCurrency)
                    : "-"}
                </p>
              </div>
              <div>
                <p className="text-gray-500">{t("assignBonos.step3.validity")}</p>
                <p className="font-medium">
                  {selectedTemplate ? formatValidity(selectedTemplate.validity_days) : "-"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setSelectedStudents(new Set())}
            >
              {t("assignBonos.step3.cancel")}
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
              {t("assignBonos.step3.assign")}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
