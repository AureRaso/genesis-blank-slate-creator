/**
 * useClubValueReport
 *
 * Hook para obtener todos los datos necesarios para generar el informe
 * de valor PDF de un club específico. Recibe clubId + rango de fechas.
 *
 * IMPORTANTE: Solo debe usarse en el panel de Owner.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// --- INTERFACES ---

export interface ClubReportParams {
  clubId: string;
  dateFrom: string; // 'yyyy-MM-dd'
  dateTo: string;
}

export interface ClubReportData {
  club: {
    name: string;
    address: string | null;
    phone: string | null;
    courtCount: number | null;
  };
  dateRange: { from: string; to: string };
  generatedAt: string;

  summary: {
    totalClasses: number;
    activeClasses: number;
    averageOccupancy: number;
    uniqueStudents: number;
    totalEnrollments: number;
    substitutionsCompleted: number;
    waitlistRequests: number;
    activeTrainers: number;
  };

  occupancy: {
    classBreakdown: Array<{
      className: string;
      maxParticipants: number;
      actualParticipants: number;
      occupancyPercent: number;
    }>;
    averageOccupancy: number;
    byDayOfWeek: Array<{
      day: string;
      avgOccupancy: number;
      classCount: number;
    }>;
  };

  absencesAndSubstitutions: {
    totalAbsences: number;
    waitlistTotal: number;
    waitlistAccepted: number;
    waitlistRejected: number;
    waitlistPending: number;
    waitlistExpired: number;
    substitutionCount: number;
    joinedFromWaitlistCount: number;
    recoveredValue: number;
    avgPricePerClass: number;
  };

  students: {
    activeStudents: number;
    newStudentsInPeriod: number;
    levelDistribution: Array<{ level: string; count: number }>;
    topStudentsByClasses: Array<{ name: string; classCount: number }>;
  };

  trainers: Array<{
    name: string;
    totalClasses: number;
    uniqueStudents: number;
    avgOccupancy: number;
    isPrimary: boolean;
  }>;

  platformAverages: {
    avgOccupancy: number;
    avgStudentsPerClub: number;
    avgWaitlistConversion: number;
    avgTrainersPerClub: number;
  };
}

// --- HELPERS ---

const PAGE_SIZE = 1000;
const CHUNK_SIZE = 50;

async function fetchAllRows<T>(
  tableName: string,
  columns: string,
  filters?: (query: any) => any
): Promise<T[]> {
  let allData: T[] = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    let query = supabase
      .from(tableName)
      .select(columns)
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (filters) {
      query = filters(query);
    }

    const { data, error } = await query;
    if (error) {
      console.warn(`Error fetching ${tableName} page ${page}:`, error);
      break;
    }
    if (!data || data.length < PAGE_SIZE) hasMore = false;
    allData = [...allData, ...(data || [])];
    page++;
  }

  return allData;
}

async function fetchChunkedIn<T>(
  tableName: string,
  columns: string,
  filterColumn: string,
  filterValues: string[],
  additionalFilters?: (query: any) => any
): Promise<T[]> {
  if (filterValues.length === 0) return [];
  let allData: T[] = [];

  for (let i = 0; i < filterValues.length; i += CHUNK_SIZE) {
    const chunk = filterValues.slice(i, i + CHUNK_SIZE);
    const data = await fetchAllRows<T>(tableName, columns, (q) => {
      let query = q.in(filterColumn, chunk);
      if (additionalFilters) query = additionalFilters(query);
      return query;
    });
    allData = [...allData, ...data];
  }

  return allData;
}

// --- HOOK ---

export const useClubValueReport = (params: ClubReportParams | null) => {
  return useQuery({
    queryKey: ["club-value-report", params?.clubId, params?.dateFrom, params?.dateTo],
    queryFn: async (): Promise<ClubReportData> => {
      if (!params) throw new Error("No params");
      const { clubId, dateFrom, dateTo } = params;

      // 1. Club info
      const { data: club } = await supabase
        .from("clubs")
        .select("name, address, phone, court_count")
        .eq("id", clubId)
        .single();

      if (!club) throw new Error("Club not found");

      // 2. All classes for this club overlapping with date range
      const allClasses = await fetchAllRows<{
        id: string;
        name: string;
        max_participants: number;
        is_active: boolean;
        is_open: boolean;
        start_date: string;
        end_date: string | null;
        start_time: string;
        days_of_week: string[] | null;
        monthly_price: number | null;
        trainer_profile_id: string | null;
        trainer_profile_id_2: string | null;
      }>(
        "programmed_classes",
        "id, name, max_participants, is_active, is_open, start_date, end_date, start_time, days_of_week, monthly_price, trainer_profile_id, trainer_profile_id_2",
        (q) => q.eq("club_id", clubId).lte("start_date", dateTo)
      );

      // Filter classes that overlap with dateRange (end_date >= dateFrom or end_date is null)
      const rangeClasses = allClasses.filter(
        (c) => !c.end_date || c.end_date >= dateFrom
      );

      const classIds = rangeClasses.map((c) => c.id);

      // 3. All participants for these classes
      const allParticipants = await fetchChunkedIn<{
        id: string;
        class_id: string;
        student_enrollment_id: string;
        status: string;
        is_substitute: boolean;
        joined_from_waitlist_at: string | null;
      }>(
        "class_participants",
        "id, class_id, student_enrollment_id, status, is_substitute, joined_from_waitlist_at",
        "class_id",
        classIds
      );

      // 4. Attendance confirmations in date range
      const participantIds = allParticipants.map((p) => p.id);
      const allConfirmations = await fetchChunkedIn<{
        class_participant_id: string;
        scheduled_date: string;
        absence_confirmed: boolean;
      }>(
        "class_attendance_confirmations",
        "class_participant_id, scheduled_date, absence_confirmed",
        "class_participant_id",
        participantIds,
        (q) => q.gte("scheduled_date", dateFrom).lte("scheduled_date", dateTo)
      );

      // 5. Waitlist
      const allWaitlist = await fetchChunkedIn<{
        id: string;
        class_id: string;
        class_date: string;
        status: string;
      }>(
        "class_waitlist",
        "id, class_id, class_date, status",
        "class_id",
        classIds,
        (q) => q.gte("class_date", dateFrom).lte("class_date", dateTo)
      );

      // 6. Student enrollments
      const allEnrollments = await fetchAllRows<{
        id: string;
        full_name: string;
        level: string | null;
        status: string;
        created_at: string;
      }>(
        "student_enrollments",
        "id, full_name, level, status, created_at",
        (q) => q.eq("club_id", clubId)
      );

      // 7. Trainer profiles
      const trainerIdSet = new Set<string>();
      rangeClasses.forEach((c) => {
        if (c.trainer_profile_id) trainerIdSet.add(c.trainer_profile_id);
        if (c.trainer_profile_id_2) trainerIdSet.add(c.trainer_profile_id_2);
      });
      const trainerIdsArr = Array.from(trainerIdSet);

      let trainerProfiles: Array<{ id: string; full_name: string | null }> = [];
      if (trainerIdsArr.length > 0) {
        const { data } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", trainerIdsArr);
        trainerProfiles = data || [];
      }
      const trainerNameMap = new Map(trainerProfiles.map((t) => [t.id, t.full_name || "Sin nombre"]));

      // --- DATA PROCESSING ---

      const activeParticipants = allParticipants.filter((p) => p.status === "active");

      // Occupancy per class (aggregate unique classes by name + time)
      const classMap = new Map<
        string,
        { name: string; maxP: number; actualP: number; classCount: number; days: Set<string> }
      >();
      rangeClasses.forEach((c) => {
        const key = `${c.name}|${c.start_time}`;
        const existing = classMap.get(key);
        const participants = activeParticipants.filter((p) => p.class_id === c.id).length;
        if (existing) {
          existing.actualP += participants;
          existing.classCount += 1;
          (c.days_of_week || []).forEach((d) => existing.days.add(d));
        } else {
          classMap.set(key, {
            name: c.name,
            maxP: c.max_participants || 4,
            actualP: participants,
            classCount: 1,
            days: new Set(c.days_of_week || []),
          });
        }
      });

      const classBreakdown = Array.from(classMap.values())
        .map((c) => ({
          className: c.name,
          maxParticipants: c.maxP,
          actualParticipants: Math.round(c.actualP / c.classCount),
          occupancyPercent:
            c.maxP > 0
              ? Math.round(((c.actualP / c.classCount) / c.maxP) * 1000) / 10
              : 0,
        }))
        .sort((a, b) => b.occupancyPercent - a.occupancyPercent);

      // Average occupancy
      const totalOccRatio = rangeClasses.reduce((sum, c) => {
        const pts = activeParticipants.filter((p) => p.class_id === c.id).length;
        const max = c.max_participants || 4;
        return sum + pts / max;
      }, 0);
      const averageOccupancy =
        rangeClasses.length > 0
          ? Math.round((totalOccRatio / rangeClasses.length) * 1000) / 10
          : 0;

      // Occupancy by day of week
      const dayStats = new Map<string, { totalOcc: number; count: number }>();
      const DAYS_ORDER = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];
      rangeClasses.forEach((c) => {
        const pts = activeParticipants.filter((p) => p.class_id === c.id).length;
        const max = c.max_participants || 4;
        const occ = (pts / max) * 100;
        (c.days_of_week || []).forEach((day) => {
          const d = dayStats.get(day) || { totalOcc: 0, count: 0 };
          d.totalOcc += occ;
          d.count += 1;
          dayStats.set(day, d);
        });
      });
      const byDayOfWeek = DAYS_ORDER.filter((d) => dayStats.has(d)).map((day) => {
        const d = dayStats.get(day)!;
        return {
          day,
          avgOccupancy: Math.round((d.totalOcc / d.count) * 10) / 10,
          classCount: d.count,
        };
      });

      // Absences
      const totalAbsences = allConfirmations.filter((c) => c.absence_confirmed).length;

      // Waitlist
      const waitlistAccepted = allWaitlist.filter((w) => w.status === "accepted").length;
      const waitlistRejected = allWaitlist.filter((w) => w.status === "rejected").length;
      const waitlistPending = allWaitlist.filter((w) => w.status === "pending").length;
      const waitlistExpired = allWaitlist.filter((w) => w.status === "expired").length;

      // Substitutions
      const substitutionCount = activeParticipants.filter((p) => p.is_substitute).length;
      const joinedFromWaitlistCount = activeParticipants.filter(
        (p) => p.joined_from_waitlist_at
      ).length;

      // Recovered value
      const classesWithPrice = rangeClasses.filter((c) => c.monthly_price && c.monthly_price > 0);
      const avgPricePerClass =
        classesWithPrice.length > 0
          ? classesWithPrice.reduce((s, c) => s + (c.monthly_price || 0), 0) /
            classesWithPrice.length
          : 0;
      // Estimate per-class value: monthly_price / 4 weeks ≈ per class session
      const perSessionPrice = avgPricePerClass > 0 ? avgPricePerClass / 4 : 0;
      const recoveredValue = joinedFromWaitlistCount * perSessionPrice;

      // Students
      const activeStudents = allEnrollments.filter((e) => e.status === "active").length;
      const newStudentsInPeriod = allEnrollments.filter(
        (e) => e.created_at >= dateFrom && e.created_at <= dateTo + "T23:59:59"
      ).length;

      const levelMap = new Map<string, number>();
      allEnrollments
        .filter((e) => e.status === "active")
        .forEach((e) => {
          const lvl = e.level || "Sin nivel";
          levelMap.set(lvl, (levelMap.get(lvl) || 0) + 1);
        });
      const levelDistribution = Array.from(levelMap.entries())
        .map(([level, count]) => ({ level, count }))
        .sort((a, b) => b.count - a.count);

      // Top students by class count
      const studentClassCount = new Map<string, number>();
      activeParticipants.forEach((p) => {
        studentClassCount.set(
          p.student_enrollment_id,
          (studentClassCount.get(p.student_enrollment_id) || 0) + 1
        );
      });
      const enrollmentNameMap = new Map(allEnrollments.map((e) => [e.id, e.full_name]));
      const topStudentsByClasses = Array.from(studentClassCount.entries())
        .map(([id, count]) => ({
          name: enrollmentNameMap.get(id) || "Desconocido",
          classCount: count,
        }))
        .sort((a, b) => b.classCount - a.classCount)
        .slice(0, 10);

      // Unique students
      const uniqueStudents = new Set(activeParticipants.map((p) => p.student_enrollment_id)).size;

      // Trainer metrics
      const trainerStats = new Map<
        string,
        { classes: Set<string>; students: Set<string>; totalOcc: number; occCount: number; isPrimary: boolean }
      >();
      rangeClasses.forEach((c) => {
        const pts = activeParticipants.filter((p) => p.class_id === c.id);
        const occ = c.max_participants > 0 ? (pts.length / c.max_participants) * 100 : 0;
        const studentIds = pts.map((p) => p.student_enrollment_id);

        if (c.trainer_profile_id) {
          const t = trainerStats.get(c.trainer_profile_id) || {
            classes: new Set(),
            students: new Set(),
            totalOcc: 0,
            occCount: 0,
            isPrimary: true,
          };
          t.classes.add(c.id);
          studentIds.forEach((s) => t.students.add(s));
          t.totalOcc += occ;
          t.occCount += 1;
          t.isPrimary = true;
          trainerStats.set(c.trainer_profile_id, t);
        }
        if (c.trainer_profile_id_2) {
          const t = trainerStats.get(c.trainer_profile_id_2) || {
            classes: new Set(),
            students: new Set(),
            totalOcc: 0,
            occCount: 0,
            isPrimary: false,
          };
          t.classes.add(c.id);
          studentIds.forEach((s) => t.students.add(s));
          t.totalOcc += occ;
          t.occCount += 1;
          trainerStats.set(c.trainer_profile_id_2, t);
        }
      });

      const trainers = Array.from(trainerStats.entries())
        .map(([id, t]) => ({
          name: trainerNameMap.get(id) || "Sin nombre",
          totalClasses: t.classes.size,
          uniqueStudents: t.students.size,
          avgOccupancy: t.occCount > 0 ? Math.round((t.totalOcc / t.occCount) * 10) / 10 : 0,
          isPrimary: t.isPrimary,
        }))
        .sort((a, b) => b.totalClasses - a.totalClasses);

      // 8. Platform averages (lightweight global queries)
      const { count: globalClassesCount } = await supabase
        .from("programmed_classes")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      const { count: globalParticipantsCount } = await supabase
        .from("class_participants")
        .select("*", { count: "exact", head: true });

      const { count: globalClubsCount } = await supabase
        .from("clubs")
        .select("*", { count: "exact", head: true });

      const { count: globalStudentsCount } = await supabase
        .from("student_enrollments")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      const { count: globalTrainersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "trainer");

      const { count: globalWaitlistAccepted } = await supabase
        .from("class_waitlist")
        .select("*", { count: "exact", head: true })
        .eq("status", "accepted");

      const { count: globalWaitlistTotal } = await supabase
        .from("class_waitlist")
        .select("*", { count: "exact", head: true });

      const clubCount = globalClubsCount || 1;
      const platformAvgOccupancy =
        (globalClassesCount || 0) > 0 && (globalParticipantsCount || 0) > 0
          ? Math.round(((globalParticipantsCount || 0) / ((globalClassesCount || 1) * 4)) * 1000) / 10
          : 0;

      return {
        club: {
          name: club.name,
          address: club.address || null,
          phone: club.phone || null,
          courtCount: club.court_count || null,
        },
        dateRange: { from: dateFrom, to: dateTo },
        generatedAt: new Date().toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }),

        summary: {
          totalClasses: rangeClasses.length,
          activeClasses: rangeClasses.filter((c) => c.is_active).length,
          averageOccupancy,
          uniqueStudents,
          totalEnrollments: activeParticipants.length,
          substitutionsCompleted: substitutionCount,
          waitlistRequests: allWaitlist.length,
          activeTrainers: trainerIdSet.size,
        },

        occupancy: {
          classBreakdown,
          averageOccupancy,
          byDayOfWeek,
        },

        absencesAndSubstitutions: {
          totalAbsences,
          waitlistTotal: allWaitlist.length,
          waitlistAccepted,
          waitlistRejected,
          waitlistPending,
          waitlistExpired,
          substitutionCount,
          joinedFromWaitlistCount,
          recoveredValue: Math.round(recoveredValue * 100) / 100,
          avgPricePerClass: Math.round(perSessionPrice * 100) / 100,
        },

        students: {
          activeStudents,
          newStudentsInPeriod,
          levelDistribution,
          topStudentsByClasses,
        },

        trainers,

        platformAverages: {
          avgOccupancy: platformAvgOccupancy,
          avgStudentsPerClub:
            Math.round(((globalStudentsCount || 0) / clubCount) * 10) / 10,
          avgWaitlistConversion:
            (globalWaitlistTotal || 0) > 0
              ? Math.round(((globalWaitlistAccepted || 0) / (globalWaitlistTotal || 1)) * 1000) / 10
              : 0,
          avgTrainersPerClub:
            Math.round(((globalTrainersCount || 0) / clubCount) * 10) / 10,
        },
      };
    },
    enabled: !!params,
    retry: false,
    staleTime: 30000,
  });
};
