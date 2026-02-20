import { useState, useMemo } from "react";
import { ArrowLeft, Check, Loader2, Search, Users, Ticket, X, Clock } from "lucide-react";
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
  const [filterAssigned, setFilterAssigned] = useState<"all" | "assigned" | "unassigned">("all");
  const [filterUserType, setFilterUserType] = useState<"all" | "minors" | "parents" | "players">("all");
  const [filterWeeklyHours, setFilterWeeklyHours] = useState<string>("all");

  // Check if any filter is active (excluding search)
  const hasActiveFilters = filterAssigned !== "all" || filterUserType !== "all" || filterWeeklyHours !== "all";

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm("");
    setFilterAssigned("all");
    setFilterUserType("all");
    setFilterWeeklyHours("all");
  };

  // Helper function to determine user type based on email prefix
  const getUserType = (email: string): "minors" | "parents" | "players" => {
    const emailLower = email.toLowerCase();
    if (emailLower.startsWith("child")) return "minors";
    if (emailLower.startsWith("guardian")) return "parents";
    return "players";
  };

  // Get selected template details
  const selectedTemplate = useMemo(() => {
    return templates?.find((t) => t.id === selectedTemplateId) || null;
  }, [templates, selectedTemplateId]);

  // Calculate available weekly hours options based on students data
  const availableHoursOptions = useMemo(() => {
    if (!students || students.length === 0) return [];

    const hoursSet = new Set<number>();
    students.forEach(student => {
      const roundedHours = Math.round(student.weekly_hours * 2) / 2;
      hoursSet.add(roundedHours);
    });

    const uniqueHours = Array.from(hoursSet).sort((a, b) => a - b);
    const options: { value: string; label: string; min: number; max: number }[] = [];

    uniqueHours.forEach(hours => {
      if (hours === 0) {
        options.push({ value: "0", label: t("paymentRates.assign.step2.filterHoursNone"), min: 0, max: 0 });
      } else {
        options.push({
          value: hours.toString(),
          label: `${hours}h`,
          min: hours - 0.25,
          max: hours + 0.25
        });
      }
    });

    return options;
  }, [students, t]);

  // Filter students
  const filteredStudents = useMemo(() => {
    if (!students) return [];

    return students.filter((student) => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        student.full_name.toLowerCase().includes(searchLower) ||
        student.email.toLowerCase().includes(searchLower);

      // Assignment filter (rate assignment status)
      let matchesAssignment = true;
      if (filterAssigned === "assigned") {
        matchesAssignment = !!student.current_assignment;
      } else if (filterAssigned === "unassigned") {
        matchesAssignment = !student.current_assignment;
      }

      // User type filter
      let matchesUserType = true;
      if (filterUserType !== "all") {
        matchesUserType = getUserType(student.email) === filterUserType;
      }

      // Weekly hours filter
      let matchesWeeklyHours = true;
      if (filterWeeklyHours !== "all") {
        const hours = student.weekly_hours;
        const option = availableHoursOptions.find(opt => opt.value === filterWeeklyHours);
        if (option) {
          if (option.value === "0") {
            matchesWeeklyHours = hours === 0;
          } else {
            matchesWeeklyHours = hours >= option.min && hours <= option.max;
          }
        }
      }

      return matchesSearch && matchesAssignment && matchesUserType && matchesWeeklyHours;
    });
  }, [students, searchTerm, filterAssigned, filterUserType, filterWeeklyHours, availableHoursOptions]);

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

          {/* Filters */}
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
                  <SelectItem value="all">{t("paymentRates.assign.step2.filterAll")}</SelectItem>
                  <SelectItem value="assigned">{t("paymentRates.assign.step2.filterAssigned")}</SelectItem>
                  <SelectItem value="unassigned">{t("paymentRates.assign.step2.filterUnassigned")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* User Type Filter Chips */}
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-500 mr-1 self-center">
                {t("paymentRates.assign.step2.filterByType")}:
              </span>
              <Button
                variant={filterUserType === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterUserType("all")}
                className="h-7 text-xs"
              >
                {t("paymentRates.assign.step2.filterTypeAll")}
              </Button>
              <Button
                variant={filterUserType === "players" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterUserType("players")}
                className="h-7 text-xs"
              >
                {t("paymentRates.assign.step2.filterTypePlayers")}
              </Button>
              <Button
                variant={filterUserType === "minors" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterUserType("minors")}
                className="h-7 text-xs"
              >
                {t("paymentRates.assign.step2.filterTypeMinors")}
              </Button>
              <Button
                variant={filterUserType === "parents" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterUserType("parents")}
                className="h-7 text-xs"
              >
                {t("paymentRates.assign.step2.filterTypeParents")}
              </Button>
            </div>

            {/* Weekly Hours Filter Chips */}
            {availableHoursOptions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-gray-500 mr-1 self-center">
                  {t("paymentRates.assign.step2.filterByHours")}:
                </span>
                <Button
                  variant={filterWeeklyHours === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterWeeklyHours("all")}
                  className="h-7 text-xs"
                >
                  {t("paymentRates.assign.step2.filterHoursAll")}
                </Button>
                {availableHoursOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={filterWeeklyHours === option.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterWeeklyHours(option.value)}
                    className="h-7 text-xs"
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            )}

            {/* Results counter and clear filters */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <span className="text-sm text-gray-500">
                {t("assignBonos.step2.showingResults", {
                  filtered: filteredStudents.length,
                  total: students?.length || 0,
                })}
              </span>
              {(hasActiveFilters || searchTerm) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-gray-500 hover:text-gray-700 h-7 text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  {t("paymentRates.assign.step2.clearFilters")}
                </Button>
              )}
            </div>
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
                    <TableHead className="text-center">{t("paymentRates.assign.step2.tableWeeklyHours")}</TableHead>
                    <TableHead>{t("paymentRates.assign.step2.tableCurrentRate")}</TableHead>
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
                          <div>
                            <p className="font-medium">{student.full_name}</p>
                            <p className="text-xs text-gray-500 hidden sm:block">{student.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-gray-400" />
                          <span className={`text-sm font-medium ${student.weekly_hours === 0 ? 'text-gray-400' : 'text-gray-700'}`}>
                            {student.weekly_hours}h
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {student.current_assignment ? (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 w-fit">
                            {student.current_assignment.payment_rate?.name || t("paymentRates.assign.step2.rateAssigned")}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-50 text-gray-500 w-fit">
                            {t("paymentRates.assign.step2.noRate")}
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
