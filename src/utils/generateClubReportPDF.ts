/**
 * generateClubReportPDF
 *
 * Genera un PDF profesional de 7 páginas con el informe de valor de un club.
 * Usa jspdf + jspdf-autotable.
 *
 * Páginas:
 * 1. Portada (logo, nombre club, rango fechas)
 * 2. Resumen Ejecutivo (8 métricas clave)
 * 3. Análisis de Ocupación (tabla + barras por día)
 * 4. Ausencias y Sustituciones (funnel waitlist + valor recuperado)
 * 5. Alumnos (distribución nivel + top 10)
 * 6. Entrenadores (tabla actividad)
 * 7. Conclusiones (insights + comparativa plataforma)
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { ClubReportData } from "@/hooks/useClubValueReport";
import PadeLockLogo from "@/assets/PadeLock_D5Red.png";

// --- COLORS ---
const BRAND_ORANGE = [255, 87, 34]; // #FF5722
const DARK_BG = [30, 41, 59]; // slate-800
const LIGHT_GRAY = [241, 245, 249]; // slate-100
const MID_GRAY = [148, 163, 184]; // slate-400
const DARK_TEXT = [15, 23, 42]; // slate-900
const WHITE = [255, 255, 255];
const GREEN = [34, 197, 94];
const RED = [239, 68, 68];
const BLUE = [59, 130, 246];
const AMBER = [245, 158, 11];

const PAGE_W = 210; // A4 width
const PAGE_H = 297; // A4 height
const MARGIN = 20;
const CONTENT_W = PAGE_W - MARGIN * 2;

// --- HELPERS ---

function addFooter(doc: jsPDF, pageNum: number, totalPages: number) {
  const y = PAGE_H - 12;
  doc.setFontSize(8);
  doc.setTextColor(...MID_GRAY);
  doc.text(`Página ${pageNum} de ${totalPages}`, PAGE_W / 2, y, { align: "center" });
  doc.text("PadeLock - Informe de Valor", MARGIN, y);
  doc.text("Confidencial", PAGE_W - MARGIN, y, { align: "right" });
}

function addSectionTitle(doc: jsPDF, title: string, y: number): number {
  // Orange line
  doc.setDrawColor(...BRAND_ORANGE);
  doc.setLineWidth(2);
  doc.line(MARGIN, y, MARGIN + 40, y);

  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK_TEXT);
  doc.text(title, MARGIN, y + 12);

  return y + 22;
}

function drawMetricCard(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value: string,
  color: number[]
) {
  // Card background
  doc.setFillColor(...LIGHT_GRAY);
  doc.roundedRect(x, y, w, h, 2, 2, "F");

  // Left accent
  doc.setFillColor(...color);
  doc.rect(x, y, 3, h, "F");

  // Value
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK_TEXT);
  doc.text(value, x + 10, y + h / 2 - 2);

  // Label
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MID_GRAY);
  doc.text(label, x + 10, y + h / 2 + 8);
}

function drawHorizontalBar(
  doc: jsPDF,
  x: number,
  y: number,
  maxW: number,
  h: number,
  percent: number,
  color: number[]
) {
  // Background
  doc.setFillColor(226, 232, 240); // slate-200
  doc.roundedRect(x, y, maxW, h, 1, 1, "F");

  // Fill
  const fillW = Math.min(maxW, (percent / 100) * maxW);
  if (fillW > 0) {
    doc.setFillColor(...color);
    doc.roundedRect(x, y, fillW, h, 1, 1, "F");
  }
}

function formatEUR(value: number): string {
  return value.toLocaleString("es-ES", { style: "currency", currency: "EUR", minimumFractionDigits: 0 });
}

async function loadImageAsBase64(src: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve("");
    img.src = src;
  });
}

// --- PAGE GENERATORS ---

async function pageCover(doc: jsPDF, data: ClubReportData, logoBase64: string) {
  // Full background
  doc.setFillColor(...DARK_BG);
  doc.rect(0, 0, PAGE_W, PAGE_H, "F");

  // Logo
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, "PNG", PAGE_W / 2 - 30, 50, 60, 40);
    } catch { /* skip if logo fails */ }
  }

  // Club name
  doc.setFontSize(32);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...WHITE);
  doc.text(data.club.name, PAGE_W / 2, 120, { align: "center" });

  // Divider line
  doc.setDrawColor(...BRAND_ORANGE);
  doc.setLineWidth(2);
  doc.line(PAGE_W / 2 - 40, 135, PAGE_W / 2 + 40, 135);

  // Title
  doc.setFontSize(24);
  doc.setFont("helvetica", "normal");
  doc.text("Informe de Valor", PAGE_W / 2, 155, { align: "center" });

  // Date range
  doc.setFontSize(14);
  doc.setTextColor(...MID_GRAY);
  const fromFormatted = new Date(data.dateRange.from).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const toFormatted = new Date(data.dateRange.to).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  doc.text(`${fromFormatted} — ${toFormatted}`, PAGE_W / 2, 172, { align: "center" });

  // Club details
  let detailY = 200;
  doc.setFontSize(10);
  doc.setTextColor(203, 213, 225); // slate-300

  if (data.club.address) {
    doc.text(data.club.address, PAGE_W / 2, detailY, { align: "center" });
    detailY += 10;
  }
  if (data.club.phone) {
    doc.text(`Tel: ${data.club.phone}`, PAGE_W / 2, detailY, { align: "center" });
    detailY += 10;
  }
  if (data.club.courtCount) {
    doc.text(`${data.club.courtCount} pistas`, PAGE_W / 2, detailY, { align: "center" });
  }

  // Generated date
  doc.setFontSize(8);
  doc.setTextColor(...MID_GRAY);
  doc.text(`Generado el ${data.generatedAt}`, PAGE_W / 2, PAGE_H - 30, { align: "center" });

  // Branding
  doc.setFontSize(10);
  doc.setTextColor(...BRAND_ORANGE);
  doc.text("PadeLock", PAGE_W / 2, PAGE_H - 20, { align: "center" });
}

function pageExecutiveSummary(doc: jsPDF, data: ClubReportData) {
  let y = 30;
  y = addSectionTitle(doc, "Resumen Ejecutivo", y);
  y += 5;

  const cardW = (CONTENT_W - 10) / 2;
  const cardH = 28;
  const gap = 8;

  const metrics = [
    { label: "Total Clases Programadas", value: String(data.summary.totalClasses), color: BRAND_ORANGE },
    { label: "Clases Activas", value: String(data.summary.activeClasses), color: GREEN },
    { label: "Ocupación Media", value: `${data.summary.averageOccupancy}%`, color: BLUE },
    { label: "Alumnos Únicos", value: String(data.summary.uniqueStudents), color: DARK_BG },
    { label: "Inscripciones Totales", value: String(data.summary.totalEnrollments), color: AMBER },
    { label: "Sustituciones Realizadas", value: String(data.summary.substitutionsCompleted), color: GREEN },
    { label: "Solicitudes Waitlist", value: String(data.summary.waitlistRequests), color: BLUE },
    { label: "Entrenadores Activos", value: String(data.summary.activeTrainers), color: BRAND_ORANGE },
  ];

  metrics.forEach((m, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = MARGIN + col * (cardW + 10);
    const cardY = y + row * (cardH + gap);
    drawMetricCard(doc, x, cardY, cardW, cardH, m.label, m.value, m.color);
  });

  y += 4 * (cardH + gap) + 10;

  // Insight box
  doc.setFillColor(255, 247, 237); // orange-50
  doc.roundedRect(MARGIN, y, CONTENT_W, 40, 3, 3, "F");
  doc.setDrawColor(...BRAND_ORANGE);
  doc.setLineWidth(0.5);
  doc.roundedRect(MARGIN, y, CONTENT_W, 40, 3, 3, "S");

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRAND_ORANGE);
  doc.text("Dato destacado", MARGIN + 8, y + 12);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...DARK_TEXT);
  doc.setFontSize(9);

  const highlightText = data.absencesAndSubstitutions.recoveredValue > 0
    ? `Gracias a la gestión automática de listas de espera y sustituciones, tu club ha recuperado un valor estimado de ${formatEUR(data.absencesAndSubstitutions.recoveredValue)} en plazas que habrían quedado vacías.`
    : `Tu club gestiona ${data.summary.totalClasses} clases con una ocupación media del ${data.summary.averageOccupancy}%. PadeLock automatiza la gestión de ausencias y listas de espera para maximizar tu ocupación.`;

  doc.text(highlightText, MARGIN + 8, y + 24, {
    maxWidth: CONTENT_W - 16,
  });
}

function pageOccupancy(doc: jsPDF, data: ClubReportData) {
  let y = 30;
  y = addSectionTitle(doc, "Análisis de Ocupación", y);
  y += 5;

  // Average occupancy highlight
  doc.setFillColor(...LIGHT_GRAY);
  doc.roundedRect(MARGIN, y, CONTENT_W, 20, 2, 2, "F");
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK_TEXT);
  doc.text(`Ocupación Media: ${data.occupancy.averageOccupancy}%`, MARGIN + 10, y + 13);
  drawHorizontalBar(doc, MARGIN + CONTENT_W / 2, y + 6, CONTENT_W / 2 - 10, 8, data.occupancy.averageOccupancy, BRAND_ORANGE);
  y += 28;

  // Class breakdown table
  const tableRows = data.occupancy.classBreakdown.slice(0, 20).map((c) => [
    c.className,
    String(c.maxParticipants),
    String(c.actualParticipants),
    `${c.occupancyPercent}%`,
  ]);

  if (tableRows.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [["Clase", "Plazas", "Inscritos", "Ocupación"]],
      body: tableRows,
      margin: { left: MARGIN, right: MARGIN },
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: {
        fillColor: DARK_BG,
        textColor: WHITE,
        fontStyle: "bold",
      },
      columnStyles: {
        0: { cellWidth: "auto" },
        1: { cellWidth: 22, halign: "center" },
        2: { cellWidth: 22, halign: "center" },
        3: { cellWidth: 25, halign: "center" },
      },
      alternateRowStyles: { fillColor: LIGHT_GRAY },
      didParseCell: (hookData) => {
        if (hookData.section === "body" && hookData.column.index === 3) {
          const val = parseFloat(String(hookData.cell.raw));
          if (val >= 80) hookData.cell.styles.textColor = GREEN;
          else if (val >= 50) hookData.cell.styles.textColor = AMBER;
          else hookData.cell.styles.textColor = RED;
          hookData.cell.styles.fontStyle = "bold";
        }
      },
    });
    y = (doc as any).lastAutoTable.finalY + 15;
  }

  // Occupancy by day of week
  if (data.occupancy.byDayOfWeek.length > 0 && y < PAGE_H - 80) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK_TEXT);
    doc.text("Ocupación por Día de la Semana", MARGIN, y);
    y += 10;

    const barMaxW = CONTENT_W - 70;
    data.occupancy.byDayOfWeek.forEach((d) => {
      if (y > PAGE_H - 30) return;
      const dayLabel = d.day.charAt(0).toUpperCase() + d.day.slice(1);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...DARK_TEXT);
      doc.text(dayLabel, MARGIN, y + 5);

      drawHorizontalBar(doc, MARGIN + 45, y, barMaxW, 7, d.avgOccupancy, BRAND_ORANGE);

      doc.setFontSize(8);
      doc.setTextColor(...MID_GRAY);
      doc.text(`${d.avgOccupancy}% (${d.classCount} clases)`, MARGIN + 45 + barMaxW + 2, y + 5);

      y += 12;
    });
  }
}

function pageAbsencesSubstitutions(doc: jsPDF, data: ClubReportData) {
  let y = 30;
  y = addSectionTitle(doc, "Ausencias y Sustituciones", y);
  y += 5;

  const d = data.absencesAndSubstitutions;

  // Absences card
  doc.setFillColor(...LIGHT_GRAY);
  doc.roundedRect(MARGIN, y, CONTENT_W, 22, 2, 2, "F");
  doc.setFillColor(...RED);
  doc.rect(MARGIN, y, 3, 22, "F");
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK_TEXT);
  doc.text(`${d.totalAbsences} ausencias confirmadas`, MARGIN + 10, y + 14);
  y += 30;

  // Waitlist funnel
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK_TEXT);
  doc.text("Embudo de Listas de Espera", MARGIN, y);
  y += 12;

  const funnelData = [
    { label: "Total solicitudes", value: d.waitlistTotal, color: BLUE },
    { label: "Aceptadas", value: d.waitlistAccepted, color: GREEN },
    { label: "Rechazadas", value: d.waitlistRejected, color: RED },
    { label: "Pendientes", value: d.waitlistPending, color: AMBER },
    { label: "Expiradas", value: d.waitlistExpired, color: MID_GRAY },
  ];

  const funnelBarMax = CONTENT_W - 80;
  const maxVal = Math.max(d.waitlistTotal, 1);

  funnelData.forEach((item) => {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DARK_TEXT);
    doc.text(item.label, MARGIN, y + 6);

    const barW = (item.value / maxVal) * funnelBarMax;
    drawHorizontalBar(doc, MARGIN + 55, y, funnelBarMax, 8, (item.value / maxVal) * 100, item.color);

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...item.color);
    doc.text(String(item.value), MARGIN + 55 + funnelBarMax + 3, y + 6);

    y += 14;
  });

  y += 10;

  // Substitutions stats
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK_TEXT);
  doc.text("Sustituciones", MARGIN, y);
  y += 10;

  const substW = (CONTENT_W - 10) / 2;

  // Card: Substitutions completed
  drawMetricCard(doc, MARGIN, y, substW, 28, "Sustitutos en clases activas", String(d.substitutionCount), GREEN);

  // Card: Joined from waitlist
  drawMetricCard(doc, MARGIN + substW + 10, y, substW, 28, "Entraron desde lista de espera", String(d.joinedFromWaitlistCount), BLUE);

  y += 40;

  // RECOVERED VALUE - Featured box
  doc.setFillColor(240, 253, 244); // green-50
  doc.roundedRect(MARGIN, y, CONTENT_W, 45, 3, 3, "F");
  doc.setDrawColor(...GREEN);
  doc.setLineWidth(1.5);
  doc.roundedRect(MARGIN, y, CONTENT_W, 45, 3, 3, "S");

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...GREEN);
  doc.text("VALOR RECUPERADO", MARGIN + 10, y + 14);

  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK_TEXT);
  doc.text(formatEUR(d.recoveredValue), MARGIN + 10, y + 32);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MID_GRAY);
  doc.text(
    `Estimación basada en ${d.joinedFromWaitlistCount} alumnos de waitlist × ${formatEUR(d.avgPricePerClass)}/sesión`,
    MARGIN + 10,
    y + 40
  );

  // Right side - explanation
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...DARK_TEXT);
  const explainX = MARGIN + CONTENT_W / 2 + 10;
  doc.text(
    "Este valor representa las plazas que se\nhabrían perdido sin gestión automatizada\nde ausencias y listas de espera.",
    explainX,
    y + 14,
    { maxWidth: CONTENT_W / 2 - 20 }
  );
}

function pageStudents(doc: jsPDF, data: ClubReportData) {
  let y = 30;
  y = addSectionTitle(doc, "Análisis de Alumnos", y);
  y += 5;

  const cardW = (CONTENT_W - 10) / 2;

  // Active / New students
  drawMetricCard(doc, MARGIN, y, cardW, 28, "Alumnos activos", String(data.students.activeStudents), BLUE);
  drawMetricCard(doc, MARGIN + cardW + 10, y, cardW, 28, "Nuevos en el periodo", String(data.students.newStudentsInPeriod), GREEN);
  y += 38;

  // Level distribution
  if (data.students.levelDistribution.length > 0) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK_TEXT);
    doc.text("Distribución por Nivel", MARGIN, y);
    y += 8;

    const levelRows = data.students.levelDistribution.map((l) => [
      l.level,
      String(l.count),
      `${data.students.activeStudents > 0 ? Math.round((l.count / data.students.activeStudents) * 100) : 0}%`,
    ]);

    autoTable(doc, {
      startY: y,
      head: [["Nivel", "Alumnos", "% del Total"]],
      body: levelRows,
      margin: { left: MARGIN, right: MARGIN },
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: {
        fillColor: DARK_BG,
        textColor: WHITE,
        fontStyle: "bold",
      },
      columnStyles: {
        0: { cellWidth: "auto" },
        1: { cellWidth: 30, halign: "center" },
        2: { cellWidth: 30, halign: "center" },
      },
      alternateRowStyles: { fillColor: LIGHT_GRAY },
    });
    y = (doc as any).lastAutoTable.finalY + 15;
  }

  // Top 10 students
  if (data.students.topStudentsByClasses.length > 0) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK_TEXT);
    doc.text("Top 10 Alumnos por Participación", MARGIN, y);
    y += 8;

    const topRows = data.students.topStudentsByClasses.map((s, i) => [
      `${i + 1}`,
      s.name,
      String(s.classCount),
    ]);

    autoTable(doc, {
      startY: y,
      head: [["#", "Alumno", "Clases"]],
      body: topRows,
      margin: { left: MARGIN, right: MARGIN },
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: {
        fillColor: DARK_BG,
        textColor: WHITE,
        fontStyle: "bold",
      },
      columnStyles: {
        0: { cellWidth: 15, halign: "center" },
        1: { cellWidth: "auto" },
        2: { cellWidth: 25, halign: "center" },
      },
      alternateRowStyles: { fillColor: LIGHT_GRAY },
      didParseCell: (hookData) => {
        if (hookData.section === "body" && hookData.column.index === 0) {
          const rank = parseInt(String(hookData.cell.raw));
          if (rank <= 3) {
            hookData.cell.styles.textColor = BRAND_ORANGE;
            hookData.cell.styles.fontStyle = "bold";
          }
        }
      },
    });
  }
}

function pageTrainers(doc: jsPDF, data: ClubReportData) {
  let y = 30;
  y = addSectionTitle(doc, "Actividad de Entrenadores", y);
  y += 5;

  if (data.trainers.length === 0) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MID_GRAY);
    doc.text("No hay entrenadores con actividad en el periodo seleccionado.", MARGIN, y);
    return;
  }

  // Summary
  doc.setFillColor(...LIGHT_GRAY);
  doc.roundedRect(MARGIN, y, CONTENT_W, 20, 2, 2, "F");
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK_TEXT);
  doc.text(`${data.trainers.length} entrenadores activos`, MARGIN + 10, y + 13);
  y += 28;

  // Trainer table
  const trainerRows = data.trainers.map((t) => [
    t.name,
    String(t.totalClasses),
    String(t.uniqueStudents),
    `${t.avgOccupancy}%`,
    t.isPrimary ? "Principal" : "Secundario",
  ]);

  autoTable(doc, {
    startY: y,
    head: [["Entrenador", "Clases", "Alumnos", "Ocupación", "Rol"]],
    body: trainerRows,
    margin: { left: MARGIN, right: MARGIN },
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: {
      fillColor: DARK_BG,
      textColor: WHITE,
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { cellWidth: 22, halign: "center" },
      2: { cellWidth: 22, halign: "center" },
      3: { cellWidth: 25, halign: "center" },
      4: { cellWidth: 28, halign: "center" },
    },
    alternateRowStyles: { fillColor: LIGHT_GRAY },
    didParseCell: (hookData) => {
      if (hookData.section === "body" && hookData.column.index === 3) {
        const val = parseFloat(String(hookData.cell.raw));
        if (val >= 80) hookData.cell.styles.textColor = GREEN;
        else if (val >= 50) hookData.cell.styles.textColor = AMBER;
        else hookData.cell.styles.textColor = RED;
        hookData.cell.styles.fontStyle = "bold";
      }
      if (hookData.section === "body" && hookData.column.index === 4) {
        if (hookData.cell.raw === "Principal") {
          hookData.cell.styles.textColor = BRAND_ORANGE;
          hookData.cell.styles.fontStyle = "bold";
        }
      }
    },
  });

  y = (doc as any).lastAutoTable.finalY + 20;

  // Best trainer highlight
  if (data.trainers.length > 0 && y < PAGE_H - 50) {
    const best = data.trainers.reduce((a, b) => (a.avgOccupancy > b.avgOccupancy ? a : b));

    doc.setFillColor(255, 247, 237); // orange-50
    doc.roundedRect(MARGIN, y, CONTENT_W, 30, 3, 3, "F");
    doc.setDrawColor(...BRAND_ORANGE);
    doc.setLineWidth(0.5);
    doc.roundedRect(MARGIN, y, CONTENT_W, 30, 3, 3, "S");

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BRAND_ORANGE);
    doc.text("Entrenador destacado", MARGIN + 8, y + 12);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DARK_TEXT);
    doc.text(
      `${best.name} lidera con ${best.avgOccupancy}% de ocupación media en ${best.totalClasses} clases con ${best.uniqueStudents} alumnos.`,
      MARGIN + 8,
      y + 23
    );
  }
}

function pageConclusions(doc: jsPDF, data: ClubReportData) {
  let y = 30;
  y = addSectionTitle(doc, "Conclusiones y Comparativa", y);
  y += 5;

  // Auto-generated insights
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK_TEXT);
  doc.text("Insights del Periodo", MARGIN, y);
  y += 10;

  const insights: string[] = [];

  // Occupancy insight
  if (data.occupancy.averageOccupancy >= 80) {
    insights.push(`Excelente ocupación del ${data.occupancy.averageOccupancy}%. Tus clases están prácticamente llenas.`);
  } else if (data.occupancy.averageOccupancy >= 60) {
    insights.push(`Buena ocupación del ${data.occupancy.averageOccupancy}%. Hay margen para optimizar algunas clases.`);
  } else {
    insights.push(`Ocupación del ${data.occupancy.averageOccupancy}%. Hay oportunidad de mejorar el llenado de clases.`);
  }

  // Waitlist insight
  if (data.absencesAndSubstitutions.waitlistTotal > 0) {
    const convRate = data.absencesAndSubstitutions.waitlistTotal > 0
      ? Math.round((data.absencesAndSubstitutions.waitlistAccepted / data.absencesAndSubstitutions.waitlistTotal) * 100)
      : 0;
    insights.push(`Lista de espera activa: ${data.absencesAndSubstitutions.waitlistTotal} solicitudes con ${convRate}% de conversión.`);
  } else {
    insights.push("Sin actividad en lista de espera en este periodo.");
  }

  // Substitution insight
  if (data.absencesAndSubstitutions.substitutionCount > 0) {
    insights.push(`${data.absencesAndSubstitutions.substitutionCount} sustituciones activas aseguran que las plazas vacantes se cubren.`);
  }

  // Recovery insight
  if (data.absencesAndSubstitutions.recoveredValue > 0) {
    insights.push(`Valor recuperado estimado: ${formatEUR(data.absencesAndSubstitutions.recoveredValue)} gracias a la gestión automatizada.`);
  }

  // Students insight
  if (data.students.newStudentsInPeriod > 0) {
    insights.push(`${data.students.newStudentsInPeriod} nuevos alumnos se incorporaron durante el periodo.`);
  }

  // Platform comparison
  const occDiff = data.occupancy.averageOccupancy - data.platformAverages.avgOccupancy;
  if (occDiff > 0) {
    insights.push(`Tu ocupación está ${Math.abs(occDiff).toFixed(1)}pp por encima de la media de la plataforma.`);
  } else if (occDiff < 0) {
    insights.push(`Tu ocupación está ${Math.abs(occDiff).toFixed(1)}pp por debajo de la media. Hay potencial de mejora.`);
  }

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...DARK_TEXT);

  insights.forEach((insight) => {
    if (y > PAGE_H - 100) return;

    // Bullet
    doc.setFillColor(...BRAND_ORANGE);
    doc.circle(MARGIN + 3, y - 1, 1.5, "F");

    doc.text(insight, MARGIN + 10, y, { maxWidth: CONTENT_W - 10 });
    y += 12;
  });

  y += 10;

  // Platform comparison table
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK_TEXT);
  doc.text("Comparativa con la Plataforma", MARGIN, y);
  y += 8;

  const compRows = [
    [
      "Ocupación media",
      `${data.occupancy.averageOccupancy}%`,
      `${data.platformAverages.avgOccupancy}%`,
      data.occupancy.averageOccupancy >= data.platformAverages.avgOccupancy ? "Por encima" : "Por debajo",
    ],
    [
      "Alumnos activos",
      String(data.students.activeStudents),
      String(Math.round(data.platformAverages.avgStudentsPerClub)),
      data.students.activeStudents >= data.platformAverages.avgStudentsPerClub ? "Por encima" : "Por debajo",
    ],
    [
      "Conversión waitlist",
      data.absencesAndSubstitutions.waitlistTotal > 0
        ? `${Math.round((data.absencesAndSubstitutions.waitlistAccepted / data.absencesAndSubstitutions.waitlistTotal) * 100)}%`
        : "N/A",
      `${data.platformAverages.avgWaitlistConversion}%`,
      "-",
    ],
    [
      "Entrenadores",
      String(data.trainers.length),
      String(Math.round(data.platformAverages.avgTrainersPerClub)),
      data.trainers.length >= data.platformAverages.avgTrainersPerClub ? "Por encima" : "Por debajo",
    ],
  ];

  autoTable(doc, {
    startY: y,
    head: [["Métrica", "Tu Club", "Media Plataforma", "Posición"]],
    body: compRows,
    margin: { left: MARGIN, right: MARGIN },
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: {
      fillColor: DARK_BG,
      textColor: WHITE,
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { cellWidth: 30, halign: "center", fontStyle: "bold" },
      2: { cellWidth: 35, halign: "center" },
      3: { cellWidth: 30, halign: "center" },
    },
    alternateRowStyles: { fillColor: LIGHT_GRAY },
    didParseCell: (hookData) => {
      if (hookData.section === "body" && hookData.column.index === 3) {
        const val = String(hookData.cell.raw);
        if (val === "Por encima") {
          hookData.cell.styles.textColor = GREEN;
          hookData.cell.styles.fontStyle = "bold";
        } else if (val === "Por debajo") {
          hookData.cell.styles.textColor = RED;
          hookData.cell.styles.fontStyle = "bold";
        }
      }
    },
  });

  y = (doc as any).lastAutoTable.finalY + 15;

  // Closing message
  if (y < PAGE_H - 50) {
    doc.setFillColor(...DARK_BG);
    doc.roundedRect(MARGIN, y, CONTENT_W, 35, 3, 3, "F");

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...WHITE);
    doc.text("PadeLock trabaja para maximizar el valor de tu club", MARGIN + 10, y + 14);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(203, 213, 225);
    doc.text(
      "Automatización de ausencias, listas de espera, sustituciones, control de pagos y comunicación con alumnos.",
      MARGIN + 10,
      y + 25,
      { maxWidth: CONTENT_W - 20 }
    );
  }
}

// --- MAIN EXPORT ---

export async function generateClubReportPDF(data: ClubReportData): Promise<void> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const TOTAL_PAGES = 7;

  // Load logo
  let logoBase64 = "";
  try {
    logoBase64 = await loadImageAsBase64(PadeLockLogo);
  } catch { /* skip logo */ }

  // Page 1: Cover
  await pageCover(doc, data, logoBase64);
  addFooter(doc, 1, TOTAL_PAGES);

  // Page 2: Executive Summary
  doc.addPage();
  pageExecutiveSummary(doc, data);
  addFooter(doc, 2, TOTAL_PAGES);

  // Page 3: Occupancy
  doc.addPage();
  pageOccupancy(doc, data);
  addFooter(doc, 3, TOTAL_PAGES);

  // Page 4: Absences & Substitutions
  doc.addPage();
  pageAbsencesSubstitutions(doc, data);
  addFooter(doc, 4, TOTAL_PAGES);

  // Page 5: Students
  doc.addPage();
  pageStudents(doc, data);
  addFooter(doc, 5, TOTAL_PAGES);

  // Page 6: Trainers
  doc.addPage();
  pageTrainers(doc, data);
  addFooter(doc, 6, TOTAL_PAGES);

  // Page 7: Conclusions
  doc.addPage();
  pageConclusions(doc, data);
  addFooter(doc, 7, TOTAL_PAGES);

  // Download
  const fileName = `Informe_${data.club.name.replace(/\s+/g, "_")}_${data.dateRange.from}_${data.dateRange.to}.pdf`;
  doc.save(fileName);
}
