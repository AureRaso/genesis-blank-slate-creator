import { DailyReportData, ClassWithGaps, WaitlistEntry } from './types.ts';

/**
 * Generates a formatted WhatsApp message for daily reports
 */
export function generateDailyReportMessage(data: DailyReportData): string {
  const {
    report_type,
    trainer_name,
    report_date,
    response_rate,
    total_classes,
    total_participants,
    confirmed_participants,
    absent_participants,
    pending_participants,
    full_classes,
    total_waitlist
  } = data;

  const greeting = report_type === 'morning' ? '☀️' : '🌤️';
  const timeLabel = report_type === 'morning' ? 'DE LAS 10' : 'DE LAS 13';

  let message = `${greeting} *¡Buenos días, ${trainer_name}!*\n`;
  message += `🎾 *RESUMEN ${timeLabel}*\n`;
  message += `📅 ${formatDate(report_date)}\n\n`;

  // Statistics (SAME as TodayAttendancePage cards + additional metrics)
  message += `📊 *ESTADÍSTICAS DEL DÍA*\n`;
  message += `━━━━━━━━━━━━━━━━━━\n`;
  message += `🎾 Clases hoy: *${total_classes}*\n`;
  message += `👥 Total alumnos: *${total_participants}*\n`;
  message += `✅ Asistirán: *${confirmed_participants}*\n`;
  message += `❌ No asistirán: *${absent_participants}*\n`;
  message += `⏳ Pendientes: *${pending_participants}*\n`;
  message += `📈 Tasa de respuesta: *${Math.round(response_rate)}%*\n`;
  message += `🏆 Clases completas: *${full_classes}*\n`;

  // Only show waitlist if there are people waiting
  if (total_waitlist > 0) {
    message += `⏰ En lista de espera: *${total_waitlist}*\n`;
  }

  message += `\n`;

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
  let text = `${emoji} *Clase ${classInfo.name} - ${classInfo.time}*\n`;
  text += `👤 Entrenador: ${classInfo.trainer_name}\n`;

  // Show occupation and gaps
  const huecosText = classInfo.gaps === 1 ? '1 hueco' : `${classInfo.gaps} huecos`;
  text += `📊 Ocupación: ${classInfo.current_participants}/${classInfo.max_participants} (${huecosText})\n`;

  // Show rejections
  if (classInfo.rejections && classInfo.rejections.length > 0) {
    text += `\n🚫 Rechazos:\n`;
    classInfo.rejections.forEach(r => {
      const reason = r.reason ? ` - ${r.reason}` : '';
      text += `   • ${r.student_name}${reason}\n`;
    });
  }

  return text;
}

/**
 * Format waitlist entry
 */
function formatWaitlistEntry(entry: WaitlistEntry, position: number): string {
  const timeAgo = formatTimeAgo(entry.days_waiting, entry.hours_waiting);
  let text = `🔹 ${entry.student_name}\n`;
  text += `   Clase: ${entry.class_name} - ${entry.class_time}\n`;
  text += `   Esperando: ${timeAgo}\n\n`;
  return text;
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
 * Format date to Spanish format with day of week
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  const dayOfWeek = dayNames[date.getDay()];
  const day = date.getDate();
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();

  return `${dayOfWeek}, ${day} de ${month} ${year}`;
}

/**
 * Format time ago in Spanish
 */
function formatTimeAgo(days: number, hours: number): string {
  if (days > 0) {
    const daysText = days === 1 ? '1 día' : `${days} días`;
    const hoursInDay = hours % 24;
    if (hoursInDay > 0) {
      const hoursText = hoursInDay === 1 ? '1 hora' : `${hoursInDay} horas`;
      return `${daysText} ${hoursText}`;
    }
    return daysText;
  }
  if (hours > 0) {
    return hours === 1 ? '1 hora' : `${hours} horas`;
  }
  return 'menos de 1 hora';
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
