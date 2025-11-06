import { DailyReportData, ClassWithGaps, WaitlistEntry } from './types.ts';

/**
 * Generates a formatted WhatsApp message for daily reports
 */
export function generateDailyReportMessage(data: DailyReportData): string {
  const { report_type, trainer_name, report_date, response_rate } = data;

  const greeting = report_type === 'morning' ? '☀️' : '🌤️';
  const timeLabel = report_type === 'morning' ? 'DE LAS 10' : 'DE LAS 13';

  let message = `${greeting} *¡Buenos días, ${trainer_name}!*\n`;
  message += `🎾 *RESUMEN ${timeLabel}*\n`;
  message += `📅 ${formatDate(report_date)}\n\n`;
  message += `✅ Tasa de respuesta: ${Math.round(response_rate)}%\n\n`;

  // Classes with gaps
  if (data.classes_with_gaps.length > 0) {
    message += `━━━━━━━━━━━━━━━━━━\n`;
    message += `🔴 *CLASES CON HUECOS*\n`;
    message += `━━━━━━━━━━━━━━━━━━\n\n`;

    data.classes_with_gaps.forEach((classInfo) => {
      message += formatClassWithGaps(classInfo);
      message += `\n`;
    });
  }

  // Waitlist
  if (data.waitlist.length > 0) {
    message += `━━━━━━━━━━━━━━━━━━\n`;
    message += `⏳ *LISTAS DE ESPERA*\n`;
    message += `━━━━━━━━━━━━━━━━━━\n\n`;

    data.waitlist.slice(0, 10).forEach((entry, index) => {
      message += formatWaitlistEntry(entry, index + 1);
    });

    if (data.waitlist.length > 10) {
      message += `\n_...y ${data.waitlist.length - 10} más en espera_\n`;
    }
    message += `\n`;
  }

  // Suggested actions
  if (data.urgent_actions.length > 0) {
    message += `━━━━━━━━━━━━━━━━━━\n`;
    message += `💡 *ACCIONES SUGERIDAS*\n`;
    message += `━━━━━━━━━━━━━━━━━━\n\n`;

    data.urgent_actions.forEach((action) => {
      message += `• ${action}\n`;
    });
  }

  // Footer
  message += `\n━━━━━━━━━━━━━━━━━━\n`;
  message += `🤖 _Reporte automático generado a las ${getCurrentTime()}_`;

  return message;
}

/**
 * Format class with gaps information
 */
function formatClassWithGaps(classInfo: ClassWithGaps): string {
  const emoji = getTimeEmoji(classInfo.time);
  let text = `${emoji} Clase ${classInfo.time} - ${classInfo.name} - ${classInfo.trainer_name}\n`;

  // Show gaps
  if (classInfo.gaps > 0) {
    const plural = classInfo.gaps === 1 ? 'plaza' : 'plazas';
    text += `   • Huecos: ${classInfo.gaps} ${plural} (${classInfo.current_participants}/${classInfo.max_participants})\n`;
  }

  // Show rejections
  if (classInfo.rejections && classInfo.rejections.length > 0) {
    const names = classInfo.rejections.map(r => r.student_name).join(', ');
    text += `   • Rechazos: ${names}\n`;
  }

  return text;
}

/**
 * Format waitlist entry
 */
function formatWaitlistEntry(entry: WaitlistEntry, position: number): string {
  const timeAgo = formatTimeAgo(entry.days_waiting, entry.hours_waiting);
  return `${position}. ${entry.student_name} (${entry.day_of_week} ${entry.class_time} - ${timeAgo})\n`;
}

/**
 * Get emoji for time of day
 */
function getTimeEmoji(time: string): string {
  const hour = parseInt(time.split(':')[0]);

  if (hour >= 6 && hour < 12) return '🌅';
  if (hour >= 12 && hour < 14) return '☀️';
  if (hour >= 14 && hour < 18) return '🌤️';
  if (hour >= 18 && hour < 21) return '🌆';
  return '🌙';
}

/**
 * Format date to Spanish format
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  };
  return date.toLocaleDateString('es-ES', options);
}

/**
 * Format time ago in Spanish
 */
function formatTimeAgo(days: number, hours: number): string {
  if (days > 0) {
    return days === 1 ? 'hace 1 día' : `hace ${days} días`;
  }
  if (hours > 0) {
    return hours === 1 ? 'hace 1 hora' : `hace ${hours} horas`;
  }
  return 'hace menos de 1 hora';
}

/**
 * Get current time formatted
 */
function getCurrentTime(): string {
  const now = new Date();
  return now.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Madrid'
  });
}

/**
 * Generate suggested actions based on report data
 */
export function generateSuggestedActions(data: DailyReportData): string[] {
  const actions: string[] = [];

  // Waitlist actions
  data.waitlist.forEach((entry) => {
    if (entry.days_waiting >= 2) {
      actions.push(`Contactar a ${entry.student_name} - lleva ${entry.days_waiting} días en espera`);
    }
  });

  // Classes with many gaps
  data.classes_with_gaps.forEach((classInfo) => {
    if (classInfo.gaps >= 3) {
      actions.push(`Clase ${classInfo.time} necesita ${classInfo.gaps} confirmaciones urgentes`);
    } else if (classInfo.gaps === 2) {
      actions.push(`Clase ${classInfo.time} tiene 2 plazas libres - buscar suplentes`);
    }
  });

  // Low response rate
  if (data.response_rate < 70) {
    actions.push(`⚠️ Tasa de respuesta baja (${Math.round(data.response_rate)}%) - enviar recordatorios`);
  }

  // Classes with rejections
  const classesWithRejections = data.classes_with_gaps.filter(
    c => c.rejections && c.rejections.length > 0
  );
  if (classesWithRejections.length > 0) {
    actions.push(`Revisar motivos de rechazo en ${classesWithRejections.length} clase(s)`);
  }

  return actions;
}
