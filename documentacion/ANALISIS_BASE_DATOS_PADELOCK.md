# ESTRUCTURA COMPLETA DE LA BASE DE DATOS - PADELOCK

## INDICE

1. [Sistema de Autenticacion y Usuarios](#1-sistema-de-autenticacion-y-usuarios)
2. [Sistema de Clubes](#2-sistema-de-clubes)
3. [Sistema de Clases y Programacion](#3-sistema-de-clases-y-programacion)
4. [Sistema de Inscripciones](#4-sistema-de-inscripciones)
5. [Sistema de Asistencia](#5-sistema-de-asistencia)
6. [Sistema de Lista de Espera](#6-sistema-de-lista-de-espera)
7. [Sistema de Pagos](#7-sistema-de-pagos)
8. [Sistema de Ligas y Torneos](#8-sistema-de-ligas-y-torneos)
9. [Sistema de Promociones](#9-sistema-de-promociones)
10. [Sistema de Scoring y Reportes](#10-sistema-de-scoring-y-reportes)
11. [Sistema de WhatsApp](#11-sistema-de-whatsapp)
12. [Sistema LOPIVI](#12-sistema-lopivi-proteccion-de-menores)
13. [Sistema de Suscripciones Stripe](#13-sistema-de-suscripciones-stripe)
14. [Funciones SQL](#14-funciones-sql-importantes)
15. [Jobs Programados CRON](#15-jobs-programados-cron)
16. [Diagrama de Relaciones](#16-diagrama-de-relaciones-principales)
17. [Resumen Estadistico](#17-resumen-estadistico)

---

## 1. SISTEMA DE AUTENTICACION Y USUARIOS

### 1.1 Tabla: profiles

**Proposito:** Almacena los perfiles de todos los usuarios del sistema.

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | UUID (PK) | ID del usuario (coincide con auth.users) |
| full_name | TEXT | Nombre completo |
| email | TEXT | Correo electronico |
| phone | TEXT | Telefono |
| level | INTEGER | Nivel de juego (1-7) |
| role | TEXT | Rol del usuario |
| club_id | UUID (FK) | Club al que pertenece |
| created_at | TIMESTAMPTZ | Fecha de creacion |
| updated_at | TIMESTAMPTZ | Ultima actualizacion |

**Roles disponibles:**
- **owner:** Super administrador del sistema
- **admin:** Administrador de club(es)
- **trainer:** Profesor/entrenador
- **player:** Jugador/alumno
- **guardian:** Padre/madre/tutor de menores

---

### 1.2 Tabla: account_dependents

**Proposito:** Gestiona relaciones padre-hijo (guardians con menores).

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | UUID (PK) | Identificador unico |
| guardian_profile_id | UUID (FK -> profiles) | ID del padre/tutor |
| dependent_profile_id | UUID (FK -> profiles) | ID del hijo/menor |
| relationship_type | TEXT | Tipo: 'child', 'ward', etc. |
| birth_date | DATE | Fecha de nacimiento del menor |
| created_at | TIMESTAMPTZ | Fecha de creacion |

---

### 1.3 Tabla: account_deletion_logs

**Proposito:** Auditoria de cuentas eliminadas.

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | UUID (PK) | Identificador unico |
| user_id | UUID | ID del usuario eliminado |
| email | TEXT | Email del usuario eliminado |
| reason | TEXT | Motivo de eliminacion |
| deleted_at | TIMESTAMPTZ | Fecha de eliminacion |

---

## 2. SISTEMA DE CLUBES

### 2.1 Tabla: clubs

**Proposito:** Academias/clubes de padel.

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | UUID (PK) | Identificador unico |
| name | TEXT | Nombre del club |
| description | TEXT | Descripcion |
| address | TEXT | Direccion |
| phone | TEXT | Telefono |
| email | TEXT | Email de contacto |
| logo_url | TEXT | URL del logo |
| status | TEXT | Estado: 'active', 'inactive', 'suspended' |
| created_by_profile_id | UUID (FK -> profiles) | Administrador que creo el club |
| is_subscription_active | BOOLEAN | Si la suscripcion esta activa |
| enable_scoring_reports | BOOLEAN | Habilitar sistema de scoring |
| lopivi_delegate_name | TEXT | Nombre del Delegado LOPIVI |
| lopivi_delegate_email | TEXT | Email del Delegado LOPIVI |
| lopivi_delegate_phone | TEXT | Telefono del Delegado LOPIVI |
| lopivi_delegate_updated_at | TIMESTAMPTZ | Ultima actualizacion delegado |
| created_at | TIMESTAMPTZ | Fecha de creacion |
| updated_at | TIMESTAMPTZ | Ultima actualizacion |

---

### 2.2 Tabla: trainer_clubs

**Proposito:** Relacion N:N entre entrenadores y clubes.

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | UUID (PK) | Identificador unico |
| trainer_profile_id | UUID (FK -> profiles) | ID del entrenador |
| club_id | UUID (FK -> clubs) | ID del club |
| created_at | TIMESTAMPTZ | Fecha de asignacion |

---

### 2.3 Tabla: trainers

**Proposito:** Informacion adicional de entrenadores.

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | UUID (PK) | Identificador unico |
| profile_id | UUID (FK -> profiles) | Perfil del entrenador |
| specialty | TEXT | Especialidad |
| photo_url | TEXT | URL de foto |
| is_active | BOOLEAN | Si esta activo |
| created_at | TIMESTAMPTZ | Fecha de creacion |
| updated_at | TIMESTAMPTZ | Ultima actualizacion |

---

## 3. SISTEMA DE CLASES Y PROGRAMACION

### 3.1 Tabla: programmed_classes

**Proposito:** Clases programadas/recurrentes.

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | UUID (PK) | Identificador unico |
| name | TEXT | Nombre de la clase |
| level_from | INTEGER | Nivel minimo |
| level_to | INTEGER | Nivel maximo |
| custom_level | TEXT | Nivel personalizado |
| duration_minutes | INTEGER | Duracion en minutos |
| start_time | TIME | Hora de inicio |
| days_of_week | TEXT[] | Dias: ['monday', 'wednesday'] |
| start_date | DATE | Fecha de inicio |
| end_date | DATE | Fecha de fin |
| recurrence_type | TEXT | Tipo de recurrencia |
| trainer_profile_id | UUID (FK -> profiles) | Entrenador asignado |
| club_id | UUID (FK -> clubs) | Club |
| court_number | INTEGER | Numero de pista |
| group_id | UUID | ID de grupo (si aplica) |
| is_active | BOOLEAN | Si esta activa |
| is_open | BOOLEAN | Si acepta inscripciones abiertas |
| max_participants | INTEGER | Maximo de participantes (default: 8) |
| monthly_price | DECIMAL | Precio mensual |
| created_by | UUID (FK -> profiles) | Quien la creo |
| created_at | TIMESTAMPTZ | Fecha de creacion |
| updated_at | TIMESTAMPTZ | Ultima actualizacion |

---

### 3.2 Tabla: cancelled_classes

**Proposito:** Cancelaciones de clases especificas por fecha.

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | UUID (PK) | Identificador unico |
| programmed_class_id | UUID (FK -> programmed_classes) | Clase cancelada |
| cancelled_date | DATE | Fecha especifica cancelada |
| cancelled_by | UUID (FK -> profiles) | Quien la cancelo |
| cancelled_at | TIMESTAMPTZ | Cuando se cancelo |
| cancellation_reason | TEXT | Motivo |
| created_at | TIMESTAMPTZ | Fecha de creacion |

**Constraint:** UNIQUE(programmed_class_id, cancelled_date)

---

### 3.3 Tabla: class_groups

**Proposito:** Grupos de clases (para organizar series).

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | UUID (PK) | Identificador unico |
| name | TEXT | Nombre del grupo |
| club_id | UUID (FK -> clubs) | Club |
| created_at | TIMESTAMPTZ | Fecha de creacion |

---

## 4. SISTEMA DE INSCRIPCIONES

### 4.1 Tabla: student_enrollments

**Proposito:** Inscripciones de alumnos en la academia.

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | UUID (PK) | Identificador unico |
| trainer_profile_id | UUID (FK -> profiles) | Entrenador asignado |
| club_id | UUID (FK -> clubs) | Club |
| created_by_profile_id | UUID (FK -> profiles) | Quien creo la inscripcion |
| student_profile_id | UUID (FK -> profiles) | Perfil del estudiante (si existe) |
| full_name | TEXT | Nombre completo |
| email | TEXT | Email |
| phone | TEXT | Telefono |
| level | INTEGER | Nivel de juego |
| weekly_days | TEXT[] | Dias preferidos |
| preferred_times | TEXT[] | Horarios preferidos |
| enrollment_period | TEXT | Periodo: 'mensual', 'trimestral', 'anual' |
| enrollment_date | DATE | Fecha de inscripcion |
| expected_end_date | DATE | Fecha esperada de fin |
| course | TEXT | Curso/temporada |
| discount_1 | DECIMAL | Descuento 1 (%) |
| discount_2 | DECIMAL | Descuento 2 (%) |
| first_payment | DECIMAL | Primer pago |
| payment_method | TEXT | Metodo de pago |
| observations | TEXT | Observaciones |
| status | TEXT | Estado: 'active', 'inactive', 'pending' |
| created_at | TIMESTAMPTZ | Fecha de creacion |
| updated_at | TIMESTAMPTZ | Ultima actualizacion |

---

### 4.2 Tabla: enrollment_forms

**Proposito:** Formularios de inscripcion con enlace unico.

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | UUID (PK) | Identificador unico |
| token | TEXT (UNIQUE) | Token unico para el enlace |
| trainer_profile_id | UUID (FK -> profiles) | Entrenador |
| club_id | UUID (FK -> clubs) | Club |
| student_data | JSONB | Datos del estudiante |
| expires_at | TIMESTAMPTZ | Fecha de expiracion |
| status | TEXT | Estado: 'pending', 'completed', 'expired' |
| completed_at | TIMESTAMPTZ | Cuando se completo |
| created_at | TIMESTAMPTZ | Fecha de creacion |
| updated_at | TIMESTAMPTZ | Ultima actualizacion |

---

### 4.3 Tabla: class_participants

**Proposito:** Participantes en clases programadas.

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | UUID (PK) | Identificador unico |
| class_id | UUID (FK -> programmed_classes) | Clase |
| student_enrollment_id | UUID (FK -> student_enrollments) | Inscripcion |
| status | TEXT | Estado: 'active', 'inactive', 'pending' |
| discount_1 | DECIMAL | Descuento 1 |
| discount_2 | DECIMAL | Descuento 2 |
| payment_status | TEXT | Estado pago: 'pending', 'paid', 'overdue' |
| payment_verified | BOOLEAN | Si el pago esta verificado |
| amount_paid | DECIMAL | Cantidad pagada |
| total_amount_due | DECIMAL | Total a pagar |
| payment_method | TEXT | Metodo de pago |
| payment_notes | TEXT | Notas de pago |
| payment_type | TEXT | Tipo de pago |
| payment_date | DATE | Fecha de pago |
| months_paid | INTEGER[] | Meses pagados |
| total_months | INTEGER | Total de meses |
| attendance_confirmed_for_date | DATE | Fecha de asistencia confirmada |
| attendance_confirmed_at | TIMESTAMPTZ | Cuando se confirmo |
| absence_confirmed | BOOLEAN | Si confirmo ausencia |
| absence_reason | TEXT | Motivo de ausencia |
| absence_confirmed_at | TIMESTAMPTZ | Cuando confirmo ausencia |
| confirmed_by_trainer | BOOLEAN | Si lo confirmo el entrenador |
| created_at | TIMESTAMPTZ | Fecha de creacion |
| updated_at | TIMESTAMPTZ | Ultima actualizacion |

---

## 5. SISTEMA DE ASISTENCIA

### 5.1 Tabla: class_attendance_confirmations

**Proposito:** Confirmaciones de asistencia por fecha especifica (sistema nuevo).

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | UUID (PK) | Identificador unico |
| class_participant_id | UUID (FK -> class_participants) | Participante |
| scheduled_date | DATE | Fecha de la sesion |
| attendance_confirmed | BOOLEAN | Confirmo asistencia |
| attendance_confirmed_at | TIMESTAMPTZ | Cuando confirmo |
| absence_confirmed | BOOLEAN | Confirmo ausencia |
| absence_reason | TEXT | Motivo de ausencia |
| absence_confirmed_at | TIMESTAMPTZ | Cuando confirmo ausencia |
| absence_locked | BOOLEAN | Si la ausencia esta bloqueada (no puede cambiar) |
| confirmed_by_trainer | BOOLEAN | Si lo confirmo el entrenador |
| created_at | TIMESTAMPTZ | Fecha de creacion |
| updated_at | TIMESTAMPTZ | Ultima actualizacion |

**Constraint:** UNIQUE(class_participant_id, scheduled_date)

---

### 5.2 Tabla: attendance_history

**Proposito:** Auditoria de todos los cambios de asistencia.

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | UUID (PK) | Identificador unico |
| class_participant_id | UUID (FK -> class_participants) | Participante |
| scheduled_date | DATE | Fecha de la clase |
| action_type | TEXT | Tipo de accion (ver valores abajo) |
| changed_by | UUID (FK -> profiles) | Quien hizo el cambio |
| changed_by_role | TEXT | Rol de quien cambio |
| previous_attendance_confirmed | BOOLEAN | Estado anterior |
| previous_absence_confirmed | BOOLEAN | Estado anterior |
| previous_absence_reason | TEXT | Motivo anterior |
| new_attendance_confirmed | BOOLEAN | Nuevo estado |
| new_absence_confirmed | BOOLEAN | Nuevo estado |
| new_absence_reason | TEXT | Nuevo motivo |
| notes | TEXT | Notas adicionales |
| created_at | TIMESTAMPTZ | Fecha del cambio |

**Valores de action_type:**
- 'marked_present' - Marcado como presente
- 'marked_absent' - Marcado como ausente
- 'cancelled_absence' - Ausencia cancelada
- 'confirmed_attendance' - Asistencia confirmada

**Valores de changed_by_role:**
- 'player' - Jugador
- 'trainer' - Entrenador
- 'admin' - Administrador
- 'system' - Sistema automatico

---

## 6. SISTEMA DE LISTA DE ESPERA

### 6.1 Tabla: waitlists

**Proposito:** Lista de espera para clases llenas.

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | UUID (PK) | Identificador unico |
| class_id | UUID (FK -> programmed_classes) | Clase |
| user_id | UUID (FK -> profiles) | Usuario en espera |
| position | INTEGER | Posicion en la cola |
| status | TEXT | Estado (ver valores abajo) |
| joined_at | TIMESTAMPTZ | Cuando se unio |
| notified_at | TIMESTAMPTZ | Cuando fue notificado |
| expires_at | TIMESTAMPTZ | Cuando expira la oferta |
| created_at | TIMESTAMPTZ | Fecha de creacion |
| updated_at | TIMESTAMPTZ | Ultima actualizacion |

**Valores de status:**
- 'waiting' - Esperando
- 'notified' - Notificado de plaza disponible
- 'accepted' - Acepto la plaza
- 'skipped' - Rechazo/paso
- 'expired' - Expiro la oferta

---

### 6.2 Tabla: enrollment_requests

**Proposito:** Solicitudes de inscripcion en clases desde la app.

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | UUID (PK) | Identificador unico |
| class_id | UUID (FK -> programmed_classes) | Clase solicitada |
| student_enrollment_id | UUID (FK -> student_enrollments) | Inscripcion |
| status | TEXT | 'pending', 'approved', 'rejected' |
| notes | TEXT | Notas |
| created_at | TIMESTAMPTZ | Fecha de solicitud |
| updated_at | TIMESTAMPTZ | Ultima actualizacion |

---

## 7. SISTEMA DE PAGOS (EN DESARROLLO)

### 7.1 Tabla: monthly_payments

**Proposito:** Control de pagos mensuales por alumno.

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | UUID (PK) | Identificador unico |
| student_enrollment_id | UUID (FK -> student_enrollments) | Inscripcion |
| month | INTEGER | Mes (1-12) |
| year | INTEGER | Ano |
| price_per_class | DECIMAL | Precio por clase |
| total_classes | INTEGER | Total de clases |
| total_amount | DECIMAL | Monto total |
| classes_details | JSONB | Detalles de las clases |
| status | TEXT | Estado del pago |
| payment_method | TEXT | Metodo de pago |
| marked_paid_at | TIMESTAMPTZ | Cuando el alumno marco como pagado |
| verified_paid_at | TIMESTAMPTZ | Cuando el admin verifico |
| verified_by | UUID (FK -> profiles) | Quien verifico |
| rejected_at | TIMESTAMPTZ | Cuando fue rechazado |
| rejected_by | UUID (FK -> profiles) | Quien rechazo |
| rejection_reason | TEXT | Motivo de rechazo |
| notes | TEXT | Notas |
| created_at | TIMESTAMPTZ | Fecha de creacion |
| updated_at | TIMESTAMPTZ | Ultima actualizacion |

**Valores de status:**
- 'pendiente' - Pendiente de pago
- 'en_revision' - Alumno marco como pagado, pendiente verificacion
- 'pagado' - Pago verificado por admin

**Valores de payment_method:**
- 'efectivo' - Efectivo
- 'bizum' - Bizum
- 'transferencia' - Transferencia bancaria
- 'tarjeta' - Tarjeta de credito/debito

---

## 8. SISTEMA DE LIGAS Y TORNEOS (OCULTO)

### 8.1 Tabla: leagues

**Proposito:** Ligas/torneos de padel.

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | UUID (PK) | Identificador unico |
| name | TEXT | Nombre de la liga |
| description | TEXT | Descripcion |
| club_id | UUID (FK -> clubs) | Club organizador |
| start_date | DATE | Fecha de inicio |
| end_date | DATE | Fecha de fin |
| status | TEXT | Estado de la liga |
| max_teams | INTEGER | Maximo de equipos |
| registration_deadline | DATE | Limite de inscripcion |
| rules | TEXT | Reglas |
| prize_info | TEXT | Informacion de premios |
| created_at | TIMESTAMPTZ | Fecha de creacion |

---

### 8.2 Tabla: teams

**Proposito:** Parejas para ligas.

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | UUID (PK) | Identificador unico |
| name | TEXT | Nombre del equipo |
| player1_id | UUID (FK -> profiles) | Jugador 1 |
| player2_id | UUID (FK -> profiles) | Jugador 2 |
| league_id | UUID (FK -> leagues) | Liga |
| created_at | TIMESTAMPTZ | Fecha de creacion |

---

### 8.3 Tabla: matches

**Proposito:** Partidos de liga.

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | UUID (PK) | Identificador unico |
| league_id | UUID (FK -> leagues) | Liga |
| team1_id | UUID (FK -> teams) | Equipo 1 |
| team2_id | UUID (FK -> teams) | Equipo 2 |
| round | INTEGER | Ronda/jornada |
| status | TEXT | 'pending', 'in_progress', 'completed' |
| scheduled_date | DATE | Fecha programada |
| scheduled_time | TIME | Hora programada |
| court_number | INTEGER | Numero de pista |
| winner_team_id | UUID (FK -> teams) | Equipo ganador |
| created_at | TIMESTAMPTZ | Fecha de creacion |

---

### 8.4 Tabla: match_results

**Proposito:** Resultados de partidos (sets).

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | UUID (PK) | Identificador unico |
| match_id | UUID (FK -> matches) | Partido |
| set_number | INTEGER | Numero de set |
| team1_score | INTEGER | Puntuacion equipo 1 |
| team2_score | INTEGER | Puntuacion equipo 2 |
| submitted_by | UUID (FK -> profiles) | Quien envio el resultado |
| approved_by | UUID (FK -> profiles) | Quien aprobo |
| status | TEXT | Estado de aprobacion |
| created_at | TIMESTAMPTZ | Fecha de creacion |

---

### 8.5 Tabla: league_players

**Proposito:** Jugadores inscritos en ligas.

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | UUID (PK) | Identificador unico |
| league_id | UUID (FK -> leagues) | Liga |
| player_id | UUID (FK -> profiles) | Jugador |
| team_id | UUID (FK -> teams) | Equipo (opcional) |
| status | TEXT | Estado de inscripcion |
| created_at | TIMESTAMPTZ | Fecha de inscripcion |

---

## 9. SISTEMA DE PROMOCIONES

### 9.1 Tabla: promotions

**Proposito:** Promociones y ofertas de clubes.

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | UUID (PK) | Identificador unico |
| club_id | UUID (FK -> clubs) | Club |
| title | TEXT | Titulo de la promocion |
| description | TEXT | Descripcion |
| discount_percentage | DECIMAL | Porcentaje de descuento |
| discount_amount | DECIMAL | Cantidad fija de descuento |
| start_date | DATE | Fecha de inicio |
| end_date | DATE | Fecha de fin |
| is_active | BOOLEAN | Si esta activa |
| terms | TEXT | Terminos y condiciones |
| created_by | UUID (FK -> profiles) | Quien la creo |
| created_at | TIMESTAMPTZ | Fecha de creacion |
| updated_at | TIMESTAMPTZ | Ultima actualizacion |

---

## 10. SISTEMA DE SCORING Y REPORTES

### 10.1 Tabla: student_attendance_scores

**Proposito:** Puntuacion de asistencia (0-100 puntos).

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | UUID (PK) | Identificador unico |
| student_enrollment_id | UUID (FK, UNIQUE) | Inscripcion |
| score | INTEGER | Score 0-100 |
| score_category | TEXT | Categoria del score |
| total_classes | INTEGER | Total de clases |
| total_confirmed_attendance | INTEGER | Asistencias confirmadas |
| total_confirmed_absence | INTEGER | Ausencias confirmadas |
| total_no_response | INTEGER | Sin respuesta |
| actually_attended_when_confirmed | INTEGER | Asistio cuando confirmo |
| no_show_when_confirmed | INTEGER | CRITICO: Confirmo pero no vino |
| attended_without_confirmation | INTEGER | Asistio sin confirmar |
| absent_without_confirmation | INTEGER | Ausente sin confirmar |
| classes_cancelled_by_academy | INTEGER | Clases canceladas por la academia |
| is_in_fixed_class | BOOLEAN | Si esta en clase fija |
| recent_streak_type | TEXT | Tipo de racha reciente |
| recent_failures | INTEGER | Fallos en ultimas 3 clases |
| score_fulfillment | DECIMAL | Puntos por cumplimiento (max 40) |
| score_communication | DECIMAL | Puntos por comunicacion (max 30) |
| score_cancellation | DECIMAL | Puntos por cancelaciones (max 20) |
| score_stability_bonus | DECIMAL | Bonus estabilidad (max 10) |
| score_penalties | DECIMAL | Penalizaciones |
| last_calculated_at | TIMESTAMPTZ | Ultima vez calculado |
| calculation_method | TEXT | Metodo de calculo |
| created_at | TIMESTAMPTZ | Fecha de creacion |
| updated_at | TIMESTAMPTZ | Ultima actualizacion |

**Valores de score_category:**
- 'excellent' - Excelente (>= 90 puntos)
- 'good' - Bueno (>= 75 puntos)
- 'regular' - Regular (>= 60 puntos)
- 'problematic' - Problematico (< 60 puntos)

**Valores de recent_streak_type:**
- 'positive' - Racha positiva
- 'negative' - Racha negativa
- 'neutral' - Neutral
- 'unknown' - Desconocido

---

### 10.2 Tabla: student_attendance_score_history

**Proposito:** Historial de evolucion de scores.

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | UUID (PK) | Identificador unico |
| student_enrollment_id | UUID (FK -> student_enrollments) | Inscripcion |
| score | INTEGER | Score en ese momento |
| score_category | TEXT | Categoria en ese momento |
| total_classes | INTEGER | Total de clases |
| no_show_when_confirmed | INTEGER | No-shows hasta ese momento |
| recorded_at | TIMESTAMPTZ | Cuando se registro |
| created_at | TIMESTAMPTZ | Fecha de creacion |

---

### 10.3 Tabla: student_score_notifications

**Proposito:** Alertas automaticas por problemas de asistencia.

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | UUID (PK) | Identificador unico |
| student_enrollment_id | UUID (FK -> student_enrollments) | Inscripcion |
| notification_type | TEXT | Tipo de notificacion |
| severity | TEXT | Severidad |
| title | TEXT | Titulo de la notificacion |
| message | TEXT | Mensaje |
| action_plan | TEXT | Plan de accion sugerido |
| score_at_notification | INTEGER | Score cuando se genero |
| no_shows_at_notification | INTEGER | No-shows cuando se genero |
| recent_failures_at_notification | INTEGER | Fallos recientes |
| is_read | BOOLEAN | Si fue leida |
| is_resolved | BOOLEAN | Si fue resuelta |
| resolved_at | TIMESTAMPTZ | Cuando se resolvio |
| resolved_by | UUID (FK -> profiles) | Quien la resolvio |
| resolution_notes | TEXT | Notas de resolucion |
| sent_to_trainer | BOOLEAN | Si se envio al entrenador |
| sent_to_student | BOOLEAN | Si se envio al alumno |
| sent_at | TIMESTAMPTZ | Cuando se envio |
| created_at | TIMESTAMPTZ | Fecha de creacion |
| updated_at | TIMESTAMPTZ | Ultima actualizacion |

**Valores de notification_type:**
- 'negative_streak' - Racha negativa
- 'low_score' - Score bajo
- 'multiple_no_shows' - Multiples no-shows
- 'monthly_report' - Reporte mensual

**Valores de severity:**
- 'info' - Informativo
- 'warning' - Advertencia
- 'critical' - Critico

---

### 10.4 Tabla: monthly_attendance_reports

**Proposito:** Reportes mensuales consolidados por club.

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | UUID (PK) | Identificador unico |
| club_id | UUID (FK -> clubs) | Club |
| report_month | INTEGER | Mes (1-12) |
| report_year | INTEGER | Ano |
| total_students | INTEGER | Total de alumnos |
| students_excellent | INTEGER | Alumnos excelentes |
| students_good | INTEGER | Alumnos buenos |
| students_regular | INTEGER | Alumnos regulares |
| students_problematic | INTEGER | Alumnos problematicos |
| total_classes_month | INTEGER | Total clases del mes |
| total_no_shows_month | INTEGER | Total no-shows |
| total_confirmations_month | INTEGER | Total confirmaciones |
| average_score | DECIMAL | Score promedio |
| average_attendance_rate | DECIMAL | Tasa de asistencia promedio |
| top_students | JSONB | Top estudiantes |
| problematic_students | JSONB | Estudiantes problematicos |
| recommendations | TEXT | Recomendaciones |
| generated_at | TIMESTAMPTZ | Cuando se genero |
| sent_to_trainers | BOOLEAN | Si se envio a entrenadores |
| sent_at | TIMESTAMPTZ | Cuando se envio |
| created_at | TIMESTAMPTZ | Fecha de creacion |

**Constraint:** UNIQUE(club_id, report_month, report_year)

**Estructura de top_students (JSONB):**
```json
[
  {"id": "uuid", "name": "string", "score": 95},
  {"id": "uuid", "name": "string", "score": 92}
]
```

**Estructura de problematic_students (JSONB):**
```json
[
  {"id": "uuid", "name": "string", "score": 45, "issues": ["multiple_no_shows", "low_score"]}
]
```

---

## 11. SISTEMA DE WHATSAPP

### 11.1 Tabla: whatsapp_report_groups

**Proposito:** Configuracion de grupos WhatsApp para reportes.

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | UUID (PK) | Identificador unico |
| club_id | UUID (FK -> clubs, UNIQUE) | Club |
| group_name | TEXT | Nombre del grupo |
| whatsapp_group_id | TEXT | ID del grupo WhatsApp |
| is_active | BOOLEAN | Si esta activo |
| send_morning_report | BOOLEAN | Enviar reporte matutino |
| send_afternoon_report | BOOLEAN | Enviar reporte vespertino |
| morning_report_time | TIME | Hora reporte matutino (default: 10:00) |
| afternoon_report_time | TIME | Hora reporte vespertino (default: 13:00) |
| timezone | TEXT | Zona horaria (default: 'Europe/Madrid') |
| created_at | TIMESTAMPTZ | Fecha de creacion |
| updated_at | TIMESTAMPTZ | Ultima actualizacion |

**Formato de whatsapp_group_id:**
- Ejemplo: "34666777888-1234567890@g.us"

---

## 12. SISTEMA LOPIVI (PROTECCION DE MENORES)

### 12.1 Tabla: lopivi_consents

**Proposito:** Consentimientos LOPIVI de usuarios.

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | UUID (PK) | Identificador unico |
| user_id | UUID (FK -> profiles) | Usuario |
| consent_given | BOOLEAN | Si dio consentimiento |
| consent_date | TIMESTAMPTZ | Fecha del consentimiento |
| ip_address | TEXT | IP del usuario |
| user_agent | TEXT | User agent del navegador |
| document_version | TEXT | Version del documento aceptado |
| created_at | TIMESTAMPTZ | Fecha de creacion |
| updated_at | TIMESTAMPTZ | Ultima actualizacion |

---

### 12.2 Tabla: lopivi_reports

**Proposito:** Reportes de incidencias LOPIVI.

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | UUID (PK) | Identificador unico |
| club_id | UUID (FK -> clubs) | Club afectado |
| reporter_profile_id | UUID (FK -> profiles) | Perfil del denunciante |
| reporter_name | TEXT | Nombre del denunciante |
| reporter_email | TEXT | Email del denunciante |
| reporter_phone | TEXT | Telefono del denunciante |
| reporter_relationship | TEXT | Relacion con el menor |
| incident_type | TEXT | Tipo de incidente |
| incident_date | DATE | Fecha del incidente |
| incident_description | TEXT | Descripcion del incidente |
| people_involved | TEXT | Personas involucradas |
| witnesses | TEXT | Testigos |
| status | TEXT | Estado del reporte |
| admin_notes | TEXT | Notas del administrador |
| resolution_notes | TEXT | Notas de resolucion |
| resolved_at | TIMESTAMPTZ | Cuando se resolvio |
| resolved_by_profile_id | UUID (FK -> profiles) | Quien lo resolvio |
| created_at | TIMESTAMPTZ | Fecha de creacion |
| updated_at | TIMESTAMPTZ | Ultima actualizacion |

**Valores de reporter_relationship:**
- padre/madre
- tutor
- alumno
- testigo
- otro

**Valores de status:**
- 'pending' - Pendiente
- 'in_review' - En revision
- 'resolved' - Resuelto
- 'dismissed' - Desestimado

---

## 13. SISTEMA DE SUSCRIPCIONES (STRIPE)

### 13.1 Tabla: club_subscriptions

**Proposito:** Suscripciones de Stripe por club.

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | UUID (PK) | Identificador unico |
| club_id | UUID (FK -> clubs) | Club |
| stripe_customer_id | TEXT | ID del cliente en Stripe |
| stripe_subscription_id | TEXT (UNIQUE) | ID de la suscripcion en Stripe |
| stripe_price_id | TEXT | ID del precio en Stripe |
| status | TEXT | Estado de la suscripcion |
| current_period_start | TIMESTAMPTZ | Inicio del periodo actual |
| current_period_end | TIMESTAMPTZ | Fin del periodo actual |
| cancel_at_period_end | BOOLEAN | Si se cancela al final del periodo |
| canceled_at | TIMESTAMPTZ | Cuando se cancelo |
| cancellation_reason | TEXT | Motivo de cancelacion |
| cancellation_requested_at | TIMESTAMPTZ | Cuando se solicito cancelacion |
| created_at | TIMESTAMPTZ | Fecha de creacion |
| updated_at | TIMESTAMPTZ | Ultima actualizacion |

**Valores de status:**
- 'pending' - Pendiente
- 'active' - Activa
- 'canceled' - Cancelada
- 'past_due' - Pago vencido
- 'trialing' - En periodo de prueba

---

## 14. FUNCIONES SQL IMPORTANTES

### 14.1 Funciones de Reportes

| Funcion | Proposito |
|---------|-----------|
| trigger_daily_reports(report_type TEXT) | Dispara reportes diarios WhatsApp ('morning' o 'afternoon') |
| trigger_attendance_reminders() | Envia recordatorios 24h antes de clases |

### 14.2 Funciones de Scoring

| Funcion | Proposito |
|---------|-----------|
| get_score_category(score INTEGER) | Convierte score numerico a categoria |
| create_score_notification() | Trigger para crear alertas automaticas |
| generate_action_plan(enrollment_id, type) | Genera plan de accion personalizado |

### 14.3 Funciones de Metricas

| Funcion | Proposito |
|---------|-----------|
| get_student_behavior_metrics(enrollment_id, class_id) | Calcula metricas de comportamiento |
| get_student_classes_today(email TEXT) | Obtiene clases del estudiante para hoy |

### 14.4 Funciones de Asistencia

| Funcion | Proposito |
|---------|-----------|
| mark_absence_from_whatsapp(participation_id) | Marca ausencia desde WhatsApp |
| ensure_attendance_record(participant_id, date) | Asegura que existe registro de asistencia |
| log_attendance_change() | Trigger de auditoria de asistencia |

### 14.5 Funciones de Actualizacion

| Funcion | Proposito |
|---------|-----------|
| update_student_attendance_scores_updated_at() | Actualiza timestamp en scores |
| update_notifications_updated_at() | Actualiza timestamp en notificaciones |
| update_club_subscriptions_updated_at() | Actualiza timestamp en suscripciones |

---

## 15. JOBS PROGRAMADOS (CRON)

| Job | Horario | Funcion | Descripcion |
|-----|---------|---------|-------------|
| whatsapp-morning-reports | 10:00 AM diario | trigger_daily_reports('morning') | Reportes matutinos de clases del dia |
| whatsapp-afternoon-reports | 1:00 PM diario | trigger_daily_reports('afternoon') | Reportes vespertinos de clases del dia |
| attendance-reminders-30min | Cada 30 minutos | trigger_attendance_reminders() | Recordatorios de asistencia a alumnos |

---

## 16. DIAGRAMA DE RELACIONES PRINCIPALES

```
                              +------------------+
                              |    profiles      |
                              |   (usuarios)     |
                              +--------+---------+
                                       |
           +---------------------------+---------------------------+
           |                           |                           |
           v                           v                           v
   +---------------+          +---------------+          +------------------+
   |    clubs      |          |   trainers    |          |   account_       |
   |  (academias)  |          | (entrenadores)|          |  dependents      |
   +-------+-------+          +---------------+          |  (guardians)     |
           |                                              +------------------+
           |
           +------------------------------------------------------+
           |                                                      |
           v                                                      v
   +---------------+                                     +---------------+
   | trainer_clubs |                                     |   leagues     |
   |   (N:N)       |                                     |   (ligas)     |
   +---------------+                                     +-------+-------+
           |                                                      |
           |                                                      v
           |                                             +---------------+
           v                                             |    teams      |
   +--------------------+                                |  (parejas)    |
   | student_enrollments|                                +-------+-------+
   |   (inscripciones)  |                                        |
   +---------+----------+                                        v
             |                                           +---------------+
             |                                           |   matches     |
             +------------------------+                  |  (partidos)   |
             |                        |                  +---------------+
             v                        v
   +--------------------+   +---------------------+
   | programmed_classes |   |  monthly_payments   |
   | (clases programa.) |   |  (pagos mensuales)  |
   +---------+----------+   +---------------------+
             |
             v
   +--------------------+
   | class_participants |-------------+
   |  (participantes)   |             |
   +---------+----------+             |
             |                        v
             |            +----------------------------+
             |            | class_attendance_          |
             |            | confirmations              |
             |            | (asistencia por fecha)     |
             |            +----------------------------+
             |
             v
   +-------------------------+
   | student_attendance_     |
   | scores (scoring)        |
   +-------------------------+
```

---

## 17. RESUMEN ESTADISTICO

| Categoria | Cantidad |
|-----------|----------|
| Tablas principales | 25+ |
| Funciones SQL | 13 |
| Triggers | 5 |
| Jobs CRON | 3 |
| RLS Policies | 50+ |
| Indices | 40+ |

---

## APENDICE A: TRIGGERS ACTIVOS

| Nombre | Tabla | Evento | Funcion |
|--------|-------|--------|---------|
| update_student_attendance_scores_timestamp | student_attendance_scores | BEFORE UPDATE | update_student_attendance_scores_updated_at() |
| trigger_create_score_notification | student_attendance_scores | AFTER INSERT OR UPDATE | create_score_notification() |
| update_notifications_timestamp | student_score_notifications | BEFORE UPDATE | update_notifications_updated_at() |
| update_club_subscriptions_updated_at | club_subscriptions | BEFORE UPDATE | update_club_subscriptions_updated_at() |
| trigger_log_attendance_change | class_participants | AFTER UPDATE | log_attendance_change() |

---

