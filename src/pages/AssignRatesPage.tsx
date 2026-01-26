import { useState, useMemo } from "react";
import { ArrowLeft, Check, Loader2, Search, Users, Calendar, Euro, Clock, X, Sparkles, Zap } from "lucide-react";
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
import { useActivePaymentRates, PaymentRate } from "@/hooks/usePaymentRates";
import {
  useStudentsWithAssignments,
  useBulkAssignRate,
  StudentWithAssignment,
} from "@/hooks/useRateAssignments";

export default function AssignRatesPage() {
  const { t, i18n } = useTranslation();
  const { data: rates, isLoading: ratesLoading } = useActivePaymentRates();
  const { data: students, isLoading: studentsLoading } = useStudentsWithAssignments();
  const bulkAssign = useBulkAssignRate();

  // Get translated periodicity label
  const getPeriodicityLabel = (periodicity: string) => {
    return t(`paymentRates.assign.periodicity.${periodicity}`, periodicity);
  };

  // Form state
  const [selectedRateId, setSelectedRateId] = useState<string>("");
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAssigned, setFilterAssigned] = useState<"all" | "assigned" | "unassigned">("all");
  const [filterUserType, setFilterUserType] = useState<"all" | "minors" | "parents" | "players">("all");
  const [filterWeeklyHours, setFilterWeeklyHours] = useState<"all" | "0" | "1-2" | "3-4" | "5+">("all");

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

      // User type filter
      let matchesUserType = true;
      if (filterUserType !== "all") {
        matchesUserType = getUserType(student.email) === filterUserType;
      }

      // Weekly hours filter
      let matchesWeeklyHours = true;
      if (filterWeeklyHours !== "all") {
        const hours = student.weekly_hours;
        switch (filterWeeklyHours) {
          case "0":
            matchesWeeklyHours = hours === 0;
            break;
          case "1-2":
            matchesWeeklyHours = hours > 0 && hours <= 2;
            break;
          case "3-4":
            matchesWeeklyHours = hours > 2 && hours <= 4;
            break;
          case "5+":
            matchesWeeklyHours = hours > 4;
            break;
        }
      }

      return matchesSearch && matchesAssignment && matchesUserType && matchesWeeklyHours;
    });
  }, [students, searchTerm, filterAssigned, filterUserType, filterWeeklyHours]);

  // ============================================================
  // AUTO-SUGGESTION FEATURE (isolated for easy removal)
  // ============================================================

  // Extract hours range from rate name (e.g., "Tarifa 1h" -> { min: 0.5, max: 1.5 })
  const extractHoursFromRateName = (rateName: string): { min: number; max: number } | null => {
    // Match patterns like "1h", "2h", "1.5h", "1-2h", "1 hora", "2 horas"
    const singleHourMatch = rateName.match(/(\d+(?:\.\d+)?)\s*h(?:ora)?s?\b/i);
    const rangeMatch = rateName.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*h/i);

    if (rangeMatch) {
      const minHours = parseFloat(rangeMatch[1]);
      const maxHours = parseFloat(rangeMatch[2]);
      return { min: minHours, max: maxHours };
    }

    if (singleHourMatch) {
      const hours = parseFloat(singleHourMatch[1]);
      // Create a range around the value (±0.5h tolerance)
      return { min: Math.max(0, hours - 0.5), max: hours + 0.5 };
    }

    return null;
  };

  // Find suggested rate for a student based on their weekly hours
  const getSuggestedRate = (weeklyHours: number): PaymentRate | null => {
    if (!rates || rates.length === 0 || weeklyHours === 0) return null;

    for (const rate of rates) {
      const hoursRange = extractHoursFromRateName(rate.name);
      if (hoursRange && weeklyHours >= hoursRange.min && weeklyHours <= hoursRange.max) {
        return rate;
      }
    }

    return null;
  };

  // Get filtered students with suggestions
  const filteredStudentsWithSuggestions = useMemo(() => {
    return filteredStudents.map(student => ({
      ...student,
      suggestedRate: getSuggestedRate(student.weekly_hours),
    }));
  }, [filteredStudents, rates]);

  // Count students without rate but with suggestion (for bulk action)
  const studentsWithSuggestionsNoRate = useMemo(() => {
    if (!students || !rates) return [];
    return students
      .filter(s => !s.current_assignment)
      .map(s => ({ ...s, suggestedRate: getSuggestedRate(s.weekly_hours) }))
      .filter(s => s.suggestedRate);
  }, [students, rates]);

  // Handle bulk assign suggested rates
  const handleAssignSuggested = async () => {
    if (studentsWithSuggestionsNoRate.length === 0) return;

    // Group students by suggested rate
    const studentsByRate = new Map<string, string[]>();
    studentsWithSuggestionsNoRate.forEach(student => {
      if (student.suggestedRate) {
        const rateId = student.suggestedRate.id;
        const existing = studentsByRate.get(rateId) || [];
        existing.push(student.id);
        studentsByRate.set(rateId, existing);
      }
    });

    // Assign each group
    for (const [rateId, studentIds] of studentsByRate) {
      await bulkAssign.mutateAsync({
        student_enrollment_ids: studentIds,
        payment_rate_id: rateId,
        start_date: startDate,
        end_date: endDate || null,
      });
    }
  };
  // ============================================================
  // END AUTO-SUGGESTION FEATURE
  // ============================================================

  // Calculate selection state for filtered students
  const filteredSelectionState = useMemo(() => {
    if (filteredStudents.length === 0) return { allSelected: false, someSelected: false, selectedCount: 0 };

    const selectedInFiltered = filteredStudents.filter(s => selectedStudents.has(s.id));
    const selectedCount = selectedInFiltered.length;
    const allSelected = selectedCount === filteredStudents.length;
    const someSelected = selectedCount > 0 && !allSelected;

    return { allSelected, someSelected, selectedCount };
  }, [filteredStudents, selectedStudents]);

  // Handle select all - only affects filtered students, preserves other selections
  const handleSelectAll = (checked: boolean) => {
    const newSelected = new Set(selectedStudents);

    if (checked) {
      // Add all filtered students to selection
      filteredStudents.forEach(s => newSelected.add(s.id));
    } else {
      // Remove only filtered students from selection
      filteredStudents.forEach(s => newSelected.delete(s.id));
    }

    setSelectedStudents(newSelected);
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
      return `${rate.price_per_class.toFixed(2)} € ${t("paymentRates.assign.pricePerClass")}`;
    }
    return "-";
  };

  // Get locale for date formatting
  const dateLocale = i18n.language === "en" ? "en-US" : i18n.language === "it" ? "it-IT" : "es-ES";

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
          <h1 className="text-2xl font-bold text-gray-900">{t("paymentRates.assign.title")}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {t("paymentRates.assign.subtitle")}
          </p>
        </div>
      </div>

      {/* Step 1: Select Rate */}
      <Card className="p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
            1
          </div>
          <h2 className="text-lg font-semibold">{t("paymentRates.assign.step1.title")}</h2>
        </div>

        {rates && rates.length > 0 ? (
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>{t("paymentRates.assign.step1.rateLabel")}</Label>
              <Select value={selectedRateId} onValueChange={setSelectedRateId}>
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue placeholder={t("paymentRates.assign.step1.ratePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {rates.map((rate) => (
                    <SelectItem key={rate.id} value={rate.id}>
                      {rate.name} - {formatPrice(rate)} ({getPeriodicityLabel(rate.periodicity)})
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
                      <strong>{t("paymentRates.assign.step1.price")}:</strong> {formatPrice(selectedRate)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      <strong>{t("paymentRates.assign.step1.periodicity")}:</strong>{" "}
                      {getPeriodicityLabel(selectedRate.periodicity)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      <strong>{t("paymentRates.assign.step1.billingDay")}:</strong> {selectedRate.billing_day}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4 max-w-md">
              <div className="grid gap-2">
                <Label htmlFor="start_date">{t("paymentRates.assign.step1.startDate")}</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="end_date">{t("paymentRates.assign.step1.endDate")}</Label>
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
              {t("paymentRates.assign.step1.noActiveRates")}
            </p>
            <Button asChild>
              <Link to="/dashboard/payment-rates">{t("paymentRates.assign.step1.goToRates")}</Link>
            </Button>
          </div>
        )}
      </Card>

      {/* Step 2: Select Students */}
      {selectedRateId && (
        <Card className="p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
                2
              </div>
              <h2 className="text-lg font-semibold">{t("paymentRates.assign.step2.title")}</h2>
              {selectedStudents.size > 0 && (
                <Badge className="ml-2 bg-primary">
                  {t("paymentRates.assign.step2.selectedCount", { count: selectedStudents.size })}
                </Badge>
              )}
            </div>
            {/* Auto-suggestion bulk action button */}
            {studentsWithSuggestionsNoRate.length > 0 && (
              <Button
                onClick={handleAssignSuggested}
                disabled={bulkAssign.isPending}
                variant="outline"
                className="bg-violet-50 border-violet-200 text-violet-700 hover:bg-violet-100 hover:text-violet-800"
              >
                {bulkAssign.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Zap className="h-4 w-4 mr-2" />
                )}
                {t("paymentRates.assign.step2.assignSuggested", { count: studentsWithSuggestionsNoRate.length })}
              </Button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-3 mb-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t("paymentRates.assign.step2.searchPlaceholder")}
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
              <Button
                variant={filterWeeklyHours === "0" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterWeeklyHours("0")}
                className="h-7 text-xs"
              >
                {t("paymentRates.assign.step2.filterHoursNone")}
              </Button>
              <Button
                variant={filterWeeklyHours === "1-2" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterWeeklyHours("1-2")}
                className="h-7 text-xs"
              >
                1-2h
              </Button>
              <Button
                variant={filterWeeklyHours === "3-4" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterWeeklyHours("3-4")}
                className="h-7 text-xs"
              >
                3-4h
              </Button>
              <Button
                variant={filterWeeklyHours === "5+" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterWeeklyHours("5+")}
                className="h-7 text-xs"
              >
                5h+
              </Button>
            </div>

            {/* Results counter and clear filters */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <span className="text-sm text-gray-500">
                {t("paymentRates.assign.step2.showingResults", {
                  filtered: filteredStudents.length,
                  total: students?.length || 0
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
                    <TableHead>{t("paymentRates.assign.step2.tableStudent")}</TableHead>
                    <TableHead className="text-center">{t("paymentRates.assign.step2.tableWeeklyHours")}</TableHead>
                    <TableHead>{t("paymentRates.assign.step2.tableCurrentRate")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudentsWithSuggestions.map((student) => (
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
                        <div className="flex flex-col gap-1">
                          {student.current_assignment ? (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 w-fit">
                              {student.current_assignment.payment_rate?.name || t("paymentRates.assign.step2.rateAssigned")}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-50 text-gray-500 w-fit">
                              {t("paymentRates.assign.step2.noRate")}
                            </Badge>
                          )}
                          {/* Suggestion badge - only show if no current assignment and has suggestion */}
                          {!student.current_assignment && student.suggestedRate && (
                            <Badge
                              variant="outline"
                              className="bg-violet-50 text-violet-700 border-violet-200 w-fit text-xs"
                            >
                              <Sparkles className="h-3 w-3 mr-1" />
                              {t("paymentRates.assign.step2.suggested")}: {student.suggestedRate.name}
                            </Badge>
                          )}
                        </div>
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
                  ? t("paymentRates.assign.step2.noStudentsFound")
                  : t("paymentRates.assign.step2.noStudentsRegistered")}
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
            <h2 className="text-lg font-semibold">{t("paymentRates.assign.step3.title")}</h2>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500">{t("paymentRates.assign.step3.rate")}</p>
                <p className="font-medium">{selectedRate?.name}</p>
              </div>
              <div>
                <p className="text-gray-500">{t("paymentRates.assign.step3.students")}</p>
                <p className="font-medium">{selectedStudents.size}</p>
              </div>
              <div>
                <p className="text-gray-500">{t("paymentRates.assign.step3.startDate")}</p>
                <p className="font-medium">
                  {new Date(startDate).toLocaleDateString(dateLocale)}
                </p>
              </div>
              <div>
                <p className="text-gray-500">{t("paymentRates.assign.step3.endDate")}</p>
                <p className="font-medium">
                  {endDate
                    ? new Date(endDate).toLocaleDateString(dateLocale)
                    : t("paymentRates.assign.step3.indefinite")}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setSelectedStudents(new Set())}
            >
              {t("paymentRates.assign.step3.cancel")}
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
              {t("paymentRates.assign.step3.assign")}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
