import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Calendar,
  Clock,
  Users,
  Loader2,
  BookOpen,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { type StudentScoreWithDetails } from "@/hooks/useStudentScoring";
import { type BulkBehaviorMetric } from "@/hooks/useBulkBehaviorMetrics";
import { type StudentEnrollment } from "@/hooks/useStudentEnrollments";
import {
  useStudentAttendanceHistory,
  type AttendanceStatus,
  type AttendanceHistoryEntry,
} from "@/hooks/useStudentAttendanceHistory";

interface StudentAttendanceHistoryModalProps {
  student: StudentEnrollment | null;
  score: StudentScoreWithDetails | null;
  behavior: BulkBehaviorMetric | null;
  isOpen: boolean;
  onClose: () => void;
}

const MONTHS = [
  { value: 1, label: "Ene" },
  { value: 2, label: "Feb" },
  { value: 3, label: "Mar" },
  { value: 4, label: "Abr" },
  { value: 5, label: "May" },
  { value: 6, label: "Jun" },
  { value: 7, label: "Jul" },
  { value: 8, label: "Ago" },
  { value: 9, label: "Sep" },
  { value: 10, label: "Oct" },
  { value: 11, label: "Nov" },
  { value: 12, label: "Dic" },
];

const STATUS_CONFIG: Record<AttendanceStatus, {
  label: string;
  borderColor: string;
  badgeClass: string;
  extraBadge?: string;
  extraBadgeClass?: string;
}> = {
  attended: {
    label: "attendanceHistory.status.attended",
    borderColor: "border-l-green-500",
    badgeClass: "bg-green-100 text-green-700 border-green-200",
  },
  absent_early: {
    label: "attendanceHistory.status.absentEarly",
    borderColor: "border-l-red-300",
    badgeClass: "bg-red-50 text-red-400 border-red-200",
  },
  absent_late: {
    label: "attendanceHistory.status.absentLate",
    borderColor: "border-l-red-600",
    badgeClass: "bg-red-100 text-red-700 border-red-300",
    extraBadge: "< 5H",
    extraBadgeClass: "bg-red-600 text-white border-red-700 text-[9px]",
  },
  cancelled_academy: {
    label: "attendanceHistory.status.cancelledAcademy",
    borderColor: "border-l-yellow-500",
    badgeClass: "bg-yellow-50 text-yellow-700 border-yellow-200",
  },
  substitute: {
    label: "attendanceHistory.status.substitute",
    borderColor: "border-l-blue-500",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    extraBadge: "SUSTITUTO",
    extraBadgeClass: "bg-blue-100 text-blue-600 border-blue-300 text-[9px]",
  },
  private_lesson: {
    label: "attendanceHistory.status.privateLesson",
    borderColor: "border-l-purple-500",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
  },
};

const StatusBadge = ({ status, studentCount, t }: {
  status: AttendanceStatus;
  studentCount?: number;
  t: (key: string, options?: any) => string;
}) => {
  const config = STATUS_CONFIG[status];
  return (
    <div className="flex items-center gap-1 flex-shrink-0">
      <Badge variant="outline" className={`text-xs px-2 py-0.5 ${config.badgeClass}`}>
        {t(config.label)}
      </Badge>
      {config.extraBadge && (
        <Badge variant="outline" className={`px-1.5 py-0 ${config.extraBadgeClass}`}>
          {config.extraBadge}
        </Badge>
      )}
      {status === 'private_lesson' && studentCount && (
        <Badge variant="outline" className="px-1.5 py-0 bg-purple-100 text-purple-600 border-purple-300 text-[9px]">
          {t('attendanceHistory.privateLessonBadge', { count: studentCount })}
        </Badge>
      )}
    </div>
  );
};

const AttendanceHistoryCard = ({ entry, t }: {
  entry: AttendanceHistoryEntry;
  t: (key: string, options?: any) => string;
}) => {
  const config = STATUS_CONFIG[entry.status];
  const formattedDate = (() => {
    try {
      return format(parseISO(entry.date), "d 'de' MMMM", { locale: es });
    } catch {
      return entry.date;
    }
  })();

  return (
    <Card className={`border-l-4 ${config.borderColor}`}>
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{entry.className}</p>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formattedDate}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {entry.startTime} - {entry.endTime}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <StatusBadge status={entry.status} studentCount={entry.studentCount} t={t} />
            {entry.type === 'group' && entry.studentCount > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                {entry.studentCount}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const StudentAttendanceHistoryModal = ({
  student,
  score,
  behavior,
  isOpen,
  onClose,
}: StudentAttendanceHistoryModalProps) => {
  const { t } = useTranslation();
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);

  const { data: entries = [], isLoading } = useStudentAttendanceHistory(
    student?.id,
    selectedYear,
    selectedMonth,
    isOpen
  );

  // KPIs
  const kpis = useMemo(() => {
    const groupEntries = entries.filter(e => e.type === 'group');
    const totalClasses = groupEntries.length;
    const attendedClasses = groupEntries.filter(e =>
      e.status === 'attended' || e.status === 'substitute'
    ).length;
    const rate = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0;
    const privateLessons = entries.filter(e => e.type === 'private').length;

    return { totalClasses, attendedClasses, rate, privateLessons };
  }, [entries]);

  // Summary badges
  const summaryBadges = useMemo(() => {
    const groupEntries = entries.filter(e => e.type === 'group');
    const attended = groupEntries.filter(e => e.status === 'attended' || e.status === 'substitute').length;
    const lateReject = groupEntries.filter(e => e.status === 'absent_late').length;
    const earlyReject = groupEntries.filter(e => e.status === 'absent_early').length;
    const cancelled = groupEntries.filter(e => e.status === 'cancelled_academy').length;
    return { attended, lateReject, earlyReject, cancelled };
  }, [entries]);

  // Rate color
  const rateColor = kpis.rate >= 75 ? 'text-green-600' :
    kpis.rate >= 50 ? 'text-yellow-600' : 'text-red-600';
  const rateBg = kpis.rate >= 75 ? 'bg-green-50 border-green-200' :
    kpis.rate >= 50 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200';

  // Year options (current year and previous 2 years)
  const yearOptions = Array.from({ length: 3 }, (_, i) => now.getFullYear() - i);

  // Enrollment info
  const enrollmentDate = student?.created_at
    ? format(parseISO(student.created_at), "MMM yyyy", { locale: es })
    : '';

  if (!student) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[95vh] p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="text-center text-base font-medium text-muted-foreground">
            {t('attendanceHistory.title')}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[calc(95vh-60px)]">
          <div className="p-4 space-y-4">
            {/* Student header */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary text-white text-lg font-bold flex-shrink-0">
                {student.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-lg truncate">{student.full_name}</p>
                <p className="text-sm text-muted-foreground">
                  {student.level ? `Nivel ${student.level}` : ''}
                  {enrollmentDate ? ` · ${t('attendanceHistory.since')} ${enrollmentDate}` : ''}
                </p>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-3 gap-2">
              <Card className="border">
                <CardContent className="p-3 text-center">
                  <div className="text-2xl font-bold">{kpis.totalClasses}</div>
                  <div className="text-xs text-muted-foreground">
                    {t('attendanceHistory.kpi.totalClasses')}
                  </div>
                </CardContent>
              </Card>
              <Card className="border border-green-200 bg-green-50">
                <CardContent className="p-3 text-center">
                  <div className="text-2xl font-bold text-green-600">{kpis.attendedClasses}</div>
                  <div className="text-xs text-green-600">
                    {t('attendanceHistory.kpi.attended')}
                  </div>
                </CardContent>
              </Card>
              <Card className={`border ${rateBg}`}>
                <CardContent className="p-3 text-center">
                  <div className={`text-2xl font-bold ${rateColor}`}>{kpis.rate}%</div>
                  <div className={`text-xs ${rateColor}`}>
                    {t('attendanceHistory.kpi.attendanceRate')}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Year / Month filter */}
            <div className="space-y-2">
              <Select
                value={String(selectedYear)}
                onValueChange={(v) => setSelectedYear(Number(v))}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map(y => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
                {MONTHS.map(m => (
                  <button
                    key={m.value}
                    onClick={() => setSelectedMonth(m.value)}
                    className={`
                      flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                      ${selectedMonth === m.value
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }
                    `}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary badges */}
            <div className="flex flex-wrap gap-2">
              {summaryBadges.attended > 0 && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1.5" />
                  {t('attendanceHistory.summaryAttended', { count: summaryBadges.attended })}
                </Badge>
              )}
              {summaryBadges.lateReject > 0 && (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1.5" />
                  {t('attendanceHistory.summaryLateReject', { count: summaryBadges.lateReject })}
                </Badge>
              )}
              {summaryBadges.earlyReject > 0 && (
                <Badge variant="outline" className="bg-red-50 text-red-400 border-red-200">
                  <span className="inline-block w-2 h-2 rounded-full bg-red-300 mr-1.5" />
                  {t('attendanceHistory.summaryEarlyReject', { count: summaryBadges.earlyReject })}
                </Badge>
              )}
              {summaryBadges.cancelled > 0 && (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                  <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 mr-1.5" />
                  {t('attendanceHistory.summaryCancelled', { count: summaryBadges.cancelled })}
                </Badge>
              )}
              {kpis.privateLessons > 0 && (
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  <span className="inline-block w-2 h-2 rounded-full bg-purple-500 mr-1.5" />
                  {kpis.privateLessons === 1
                    ? t('attendanceHistory.privateLessonsCount', { count: kpis.privateLessons })
                    : t('attendanceHistory.privateLessonsCountPlural', { count: kpis.privateLessons })
                  }
                </Badge>
              )}
            </div>

            {/* Class list */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">
                  {t('attendanceHistory.loading')}
                </span>
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">
                  {t('attendanceHistory.noClasses')}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {entries.map(entry => (
                  <AttendanceHistoryCard key={entry.id} entry={entry} t={t} />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
