import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  useAllStudentScores,
  useRecalculateAllScores,
  type ScoreCategory,
} from "@/hooks/useStudentScoring";
import StudentScoreCard, { getScoreCategoryDetails } from "@/components/StudentScoreCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RefreshCw,
  Filter,
  Search,
  TrendingUp,
  AlertTriangle,
  ArrowUpDown,
} from "lucide-react";

type SortField = "score" | "name" | "no_shows" | "recent_failures";
type SortDirection = "asc" | "desc";

const StudentScoresPage = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<ScoreCategory | "all">("all");
  const [showAlertOnly, setShowAlertOnly] = useState(false);
  const [sortField, setSortField] = useState<SortField>("score");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Queries
  const { data: studentScores, isLoading: loadingScores } = useAllStudentScores(profile?.club_id);
  const recalculateAll = useRecalculateAllScores();

  // Sorting logic
  const sortedAndFilteredScores = studentScores
    ?.filter((score) => {
      // Filtro por búsqueda
      const matchesSearch = searchTerm
        ? score.student_enrollment?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          score.student_enrollment?.email?.toLowerCase().includes(searchTerm.toLowerCase())
        : true;

      // Filtro por categoría
      const matchesCategory = filterCategory === "all" || score.score_category === filterCategory;

      // Filtro por alerta
      const hasAlert = score.recent_streak_type === "negative" || score.no_show_when_confirmed > 0;
      const matchesAlert = !showAlertOnly || hasAlert;

      return matchesSearch && matchesCategory && matchesAlert;
    })
    .sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "score":
          comparison = a.score - b.score;
          break;
        case "name":
          comparison = (a.student_enrollment?.full_name || "").localeCompare(
            b.student_enrollment?.full_name || ""
          );
          break;
        case "no_shows":
          comparison = a.no_show_when_confirmed - b.no_show_when_confirmed;
          break;
        case "recent_failures":
          comparison = a.recent_failures - b.recent_failures;
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const stats = {
    total: studentScores?.length || 0,
    excellent: studentScores?.filter((s) => s.score_category === "excellent").length || 0,
    good: studentScores?.filter((s) => s.score_category === "good").length || 0,
    regular: studentScores?.filter((s) => s.score_category === "regular").length || 0,
    problematic: studentScores?.filter((s) => s.score_category === "problematic").length || 0,
    withAlerts:
      studentScores?.filter(
        (s) => s.recent_streak_type === "negative" || s.no_show_when_confirmed > 0
      ).length || 0,
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Scores de Alumnos</h1>
          <p className="text-muted-foreground">
            Sistema de puntuación basado en comportamiento de asistencia
          </p>
        </div>
        <Button
          onClick={() => recalculateAll.mutate(profile?.club_id)}
          disabled={recalculateAll.isPending}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${recalculateAll.isPending ? "animate-spin" : ""}`} />
          Recalcular Todos
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Excelentes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{stats.excellent}</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Buenos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{stats.good}</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-800">Regulares</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600">{stats.regular}</p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-800">Problemáticos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{stats.problematic}</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-800 flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" />
              Alertas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-600">{stats.withAlerts}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros y Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Buscador */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-md"
              />
            </div>

            {/* Filtro por categoría */}
            <Select
              value={filterCategory}
              onValueChange={(value) => setFilterCategory(value as ScoreCategory | "all")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas las categorías" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                <SelectItem value="excellent">⭐ Excelentes (90+)</SelectItem>
                <SelectItem value="good">✓ Buenos (75-89)</SelectItem>
                <SelectItem value="regular">⚠️ Regulares (60-74)</SelectItem>
                <SelectItem value="problematic">🚫 Problemáticos (&lt;60)</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtro alerta */}
            <Button
              variant={showAlertOnly ? "default" : "outline"}
              onClick={() => setShowAlertOnly(!showAlertOnly)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              {showAlertOnly ? "Mostrando alertas" : "Solo alertas"}
            </Button>
          </div>

          {/* Sort buttons */}
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
            <span className="text-sm text-muted-foreground self-center">Ordenar por:</span>
            <Button
              variant={sortField === "score" ? "default" : "outline"}
              size="sm"
              onClick={() => handleSort("score")}
              className="gap-1"
            >
              Score
              {sortField === "score" && (
                <ArrowUpDown className="h-3 w-3" />
              )}
            </Button>
            <Button
              variant={sortField === "name" ? "default" : "outline"}
              size="sm"
              onClick={() => handleSort("name")}
              className="gap-1"
            >
              Nombre
              {sortField === "name" && (
                <ArrowUpDown className="h-3 w-3" />
              )}
            </Button>
            <Button
              variant={sortField === "no_shows" ? "default" : "outline"}
              size="sm"
              onClick={() => handleSort("no_shows")}
              className="gap-1"
            >
              No-shows
              {sortField === "no_shows" && (
                <ArrowUpDown className="h-3 w-3" />
              )}
            </Button>
            <Button
              variant={sortField === "recent_failures" ? "default" : "outline"}
              size="sm"
              onClick={() => handleSort("recent_failures")}
              className="gap-1"
            >
              Fallos recientes
              {sortField === "recent_failures" && (
                <ArrowUpDown className="h-3 w-3" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading state */}
      {loadingScores && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-playtomic-orange mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando scores...</p>
          </div>
        </div>
      )}

      {/* Lista de alumnos */}
      {!loadingScores && sortedAndFilteredScores && sortedAndFilteredScores.length > 0 ? (
        <div className="space-y-4">
          {sortedAndFilteredScores.map((score) => (
            <div
              key={score.id}
              onClick={() => navigate(`/dashboard/students/${score.student_enrollment_id}/score`)}
              className="cursor-pointer hover:shadow-lg transition-shadow"
            >
              <StudentScoreCard scoreData={score} compact={true} />
            </div>
          ))}
        </div>
      ) : !loadingScores && sortedAndFilteredScores && sortedAndFilteredScores.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Filter className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No se encontraron resultados</h3>
            <p className="text-sm text-muted-foreground text-center">
              Intenta ajustar los filtros de búsqueda
            </p>
          </CardContent>
        </Card>
      ) : (
        !loadingScores && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay scores calculados</h3>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Los scores se calculan automáticamente después de pasar lista
              </p>
              <Button onClick={() => recalculateAll.mutate(profile?.club_id)} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Calcular Scores
              </Button>
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
};

export default StudentScoresPage;
