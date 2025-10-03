import { Link } from "react-router-dom";
import { FileText, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import padelockLogo from "@/assets/PadeLock_D5Red.png";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-playtomic-dark to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/landing" className="flex items-center gap-3">
              <img src={padelockLogo} alt="PadeLock" className="h-10 w-auto" />
            </Link>
            <Link to="/landing">
              <Button variant="ghost" className="text-slate-300 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="w-full px-4 md:px-8 lg:px-12 py-12">
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 md:p-12 lg:p-16 w-full">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-200">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-playtomic-orange/20 to-playtomic-orange/30 flex items-center justify-center">
              <FileText className="w-6 h-6 text-playtomic-orange" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-playtomic-dark to-slate-700 bg-clip-text text-transparent">
                Términos y Condiciones de Servicio
              </h1>
              <p className="text-sm text-slate-500 mt-1">Última actualización: Octubre 2025</p>
            </div>
          </div>

          {/* Content */}
          <div className="w-full">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-playtomic-dark mb-4">1. Aceptación de los Términos</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                Bienvenido a PadeLock. Al acceder o utilizar nuestra plataforma de gestión de clases de pádel, aceptas
                estar sujeto a estos Términos y Condiciones de Servicio ("Términos"). Si no estás de acuerdo con alguna
                parte de estos términos, no debes utilizar nuestros servicios.
              </p>
              <p className="text-slate-700 leading-relaxed">
                Estos Términos constituyen un acuerdo legal vinculante entre tú ("Usuario", "tú" o "tu") y PadeLock
                ("nosotros", "nuestro" o "la Plataforma").
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-playtomic-dark mb-4">2. Descripción del Servicio</h2>
              <p className="text-slate-700 leading-relaxed mb-3">
                PadeLock es una plataforma digital que proporciona servicios de gestión para clases de pádel, incluyendo:
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
                <li>Gestión de reservas y matriculación en clases</li>
                <li>Sistema de pagos y suscripciones mensuales</li>
                <li>Seguimiento de asistencia y progreso</li>
                <li>Comunicación entre entrenadores y estudiantes</li>
                <li>Gestión de clubs y entrenadores</li>
                <li>Panel de administración para clubs</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-playtomic-dark mb-4">3. Registro y Cuenta de Usuario</h2>

              <h3 className="text-xl font-semibold text-slate-800 mb-3 mt-6">3.1 Elegibilidad</h3>
              <p className="text-slate-700 leading-relaxed mb-4">
                Debes tener al menos 16 años para crear una cuenta. Si eres menor de 18 años, necesitas el consentimiento
                de un padre, madre o tutor legal.
              </p>

              <h3 className="text-xl font-semibold text-slate-800 mb-3 mt-6">3.2 Información de Registro</h3>
              <p className="text-slate-700 leading-relaxed mb-3">Al crear una cuenta, te comprometes a:</p>
              <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
                <li>Proporcionar información veraz, precisa, actual y completa</li>
                <li>Mantener y actualizar prontamente tu información</li>
                <li>Mantener la seguridad de tu contraseña</li>
                <li>Notificarnos inmediatamente sobre cualquier uso no autorizado de tu cuenta</li>
              </ul>

              <h3 className="text-xl font-semibold text-slate-800 mb-3 mt-6">3.3 Responsabilidad de la Cuenta</h3>
              <p className="text-slate-700 leading-relaxed">
                Eres responsable de todas las actividades que ocurran en tu cuenta. No debes compartir tu contraseña
                con terceros ni permitir que otros accedan a tu cuenta.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-playtomic-dark mb-4">4. Uso Aceptable</h2>

              <h3 className="text-xl font-semibold text-slate-800 mb-3 mt-6">4.1 Conductas Permitidas</h3>
              <p className="text-slate-700 leading-relaxed mb-3">Te está permitido:</p>
              <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
                <li>Utilizar la plataforma para gestionar tus clases de pádel</li>
                <li>Reservar y pagar clases y suscripciones</li>
                <li>Comunicarte con tus entrenadores y compañeros de clase</li>
                <li>Acceder a tu información y estadísticas personales</li>
              </ul>

              <h3 className="text-xl font-semibold text-slate-800 mb-3 mt-6">4.2 Conductas Prohibidas</h3>
              <p className="text-slate-700 leading-relaxed mb-3">No está permitido:</p>
              <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
                <li>Utilizar la plataforma para actividades ilegales o fraudulentas</li>
                <li>Intentar acceder sin autorización a cuentas o datos de otros usuarios</li>
                <li>Cargar contenido malicioso, virus o código dañino</li>
                <li>Realizar ingeniería inversa, descompilar o intentar extraer el código fuente</li>
                <li>Utilizar robots, scrapers o herramientas automatizadas sin autorización</li>
                <li>Acosar, amenazar o intimidar a otros usuarios</li>
                <li>Hacerse pasar por otra persona o entidad</li>
                <li>Violar derechos de propiedad intelectual</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-playtomic-dark mb-4">5. Pagos y Facturación</h2>

              <h3 className="text-xl font-semibold text-slate-800 mb-3 mt-6">5.1 Precios</h3>
              <p className="text-slate-700 leading-relaxed mb-4">
                Los precios de las clases y suscripciones son establecidos por cada club de pádel. PadeLock actúa
                como intermediario de pago. Todos los precios están en Euros (€) e incluyen IVA cuando sea aplicable.
              </p>

              <h3 className="text-xl font-semibold text-slate-800 mb-3 mt-6">5.2 Métodos de Pago</h3>
              <p className="text-slate-700 leading-relaxed mb-4">
                Los pagos se procesan de forma segura a través de Stripe. Aceptamos tarjetas de crédito/débito y
                otros métodos de pago disponibles en Stripe.
              </p>

              <h3 className="text-xl font-semibold text-slate-800 mb-3 mt-6">5.3 Suscripciones Mensuales</h3>
              <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
                <li>Las suscripciones se renuevan automáticamente cada mes</li>
                <li>Se te cobrará al inicio de cada período de facturación</li>
                <li>Puedes cancelar tu suscripción en cualquier momento desde tu perfil</li>
                <li>La cancelación será efectiva al final del período de facturación actual</li>
                <li>No se realizan reembolsos proporcionales por cancelaciones anticipadas</li>
              </ul>

              <h3 className="text-xl font-semibold text-slate-800 mb-3 mt-6">5.4 Política de Reembolsos</h3>
              <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
                <li>Puedes cancelar una reserva hasta 24 horas antes de la clase para obtener un reembolso completo</li>
                <li>Cancelaciones con menos de 24 horas no son reembolsables</li>
                <li>En caso de cancelación de clase por parte del club, se realizará reembolso completo</li>
                <li>Los reembolsos se procesan en 5-10 días hábiles</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-playtomic-dark mb-4">6. Propiedad Intelectual</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                Todo el contenido de la plataforma, incluyendo pero no limitado a diseños, logos, textos, gráficos,
                código fuente, y software, es propiedad de PadeLock o de sus licenciantes y está protegido por leyes
                de propiedad intelectual españolas e internacionales.
              </p>
              <p className="text-slate-700 leading-relaxed">
                Se te concede una licencia limitada, no exclusiva, intransferible y revocable para acceder y utilizar
                la plataforma para uso personal. Esta licencia no incluye derecho a usar la plataforma para fines
                comerciales sin autorización expresa.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-playtomic-dark mb-4">7. Privacidad y Protección de Datos</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                El uso de nuestros servicios está sujeto a nuestra{" "}
                <Link to="/privacy" className="text-playtomic-orange hover:underline font-medium">
                  Política de Privacidad
                </Link>
                , que describe cómo recopilamos, usamos y protegemos tu información personal conforme al RGPD.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-playtomic-dark mb-4">8. Limitación de Responsabilidad</h2>

              <h3 className="text-xl font-semibold text-slate-800 mb-3 mt-6">8.1 Disponibilidad del Servicio</h3>
              <p className="text-slate-700 leading-relaxed mb-4">
                Aunque nos esforzamos por mantener la plataforma disponible 24/7, no garantizamos que el servicio esté
                libre de interrupciones o errores. Nos reservamos el derecho a suspender temporalmente el servicio para
                mantenimiento o actualizaciones.
              </p>

              <h3 className="text-xl font-semibold text-slate-800 mb-3 mt-6">8.2 Responsabilidad por Clases</h3>
              <p className="text-slate-700 leading-relaxed mb-4">
                PadeLock actúa únicamente como intermediario entre clubs/entrenadores y estudiantes. No somos responsables
                de la calidad de las clases, cancelaciones por parte de los clubs, lesiones durante las clases, o
                cualquier disputa entre usuarios.
              </p>

              <h3 className="text-xl font-semibold text-slate-800 mb-3 mt-6">8.3 Exclusión de Garantías</h3>
              <p className="text-slate-700 leading-relaxed mb-4">
                EL SERVICIO SE PROPORCIONA "TAL CUAL" Y "SEGÚN DISPONIBILIDAD", SIN GARANTÍAS DE NINGÚN TIPO, YA SEAN
                EXPRESAS O IMPLÍCITAS. NO GARANTIZAMOS QUE EL SERVICIO CUMPLA CON TUS REQUISITOS O QUE SEA ININTERRUMPIDO,
                OPORTUNO, SEGURO O LIBRE DE ERRORES.
              </p>

              <h3 className="text-xl font-semibold text-slate-800 mb-3 mt-6">8.4 Límite de Daños</h3>
              <p className="text-slate-700 leading-relaxed">
                EN NINGÚN CASO PADELOCK, SUS DIRECTORES, EMPLEADOS O AGENTES SERÁN RESPONSABLES POR DAÑOS INDIRECTOS,
                INCIDENTALES, ESPECIALES, CONSECUENTES O PUNITIVOS, INCLUYENDO PÉRDIDA DE BENEFICIOS, DATOS O USO,
                DERIVADOS DE O RELACIONADOS CON EL USO O LA IMPOSIBILIDAD DE USO DEL SERVICIO.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-playtomic-dark mb-4">9. Indemnización</h2>
              <p className="text-slate-700 leading-relaxed">
                Aceptas indemnizar, defender y eximir de responsabilidad a PadeLock y sus afiliados, directores,
                empleados y agentes de cualquier reclamación, pérdida, daño, responsabilidad, costo o gasto
                (incluyendo honorarios legales razonables) que surjan de:
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4 mt-3">
                <li>Tu uso o mal uso del servicio</li>
                <li>Tu violación de estos Términos</li>
                <li>Tu violación de derechos de terceros</li>
                <li>Cualquier contenido que publiques o compartas en la plataforma</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-playtomic-dark mb-4">10. Modificaciones del Servicio</h2>
              <p className="text-slate-700 leading-relaxed">
                Nos reservamos el derecho de modificar, suspender o discontinuar cualquier aspecto del servicio en
                cualquier momento sin previo aviso. No seremos responsables ante ti o terceros por cualquier modificación,
                suspensión o discontinuación del servicio.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-playtomic-dark mb-4">11. Terminación</h2>

              <h3 className="text-xl font-semibold text-slate-800 mb-3 mt-6">11.1 Por tu Parte</h3>
              <p className="text-slate-700 leading-relaxed mb-4">
                Puedes terminar tu cuenta en cualquier momento desde la configuración de tu perfil o contactándonos
                directamente.
              </p>

              <h3 className="text-xl font-semibold text-slate-800 mb-3 mt-6">11.2 Por Nuestra Parte</h3>
              <p className="text-slate-700 leading-relaxed mb-3">
                Podemos suspender o terminar tu cuenta inmediatamente sin previo aviso si:
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
                <li>Violas estos Términos o nuestra Política de Privacidad</li>
                <li>Tu comportamiento pone en riesgo a otros usuarios o la plataforma</li>
                <li>Realizas actividades fraudulentas o ilegales</li>
                <li>No pagas las cantidades adeudadas</li>
              </ul>

              <h3 className="text-xl font-semibold text-slate-800 mb-3 mt-6">11.3 Efectos de la Terminación</h3>
              <p className="text-slate-700 leading-relaxed">
                Tras la terminación, perderás acceso a tu cuenta y todo el contenido asociado. Las secciones que por
                su naturaleza deben sobrevivir a la terminación continuarán vigentes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-playtomic-dark mb-4">12. Ley Aplicable y Jurisdicción</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                Estos Términos se regirán e interpretarán de acuerdo con las leyes de España, sin dar efecto a ningún
                principio de conflictos de leyes.
              </p>
              <p className="text-slate-700 leading-relaxed">
                Cualquier disputa que surja de o en relación con estos Términos estará sujeta a la jurisdicción
                exclusiva de los tribunales de España.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-playtomic-dark mb-4">13. Modificaciones de los Términos</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                Nos reservamos el derecho de modificar estos Términos en cualquier momento. Te notificaremos sobre
                cambios significativos por email o mediante un aviso destacado en la plataforma.
              </p>
              <p className="text-slate-700 leading-relaxed">
                Tu uso continuado del servicio después de cualquier cambio constituye tu aceptación de los nuevos Términos.
                Si no estás de acuerdo con los cambios, debes dejar de utilizar el servicio.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-playtomic-dark mb-4">14. Disposiciones Generales</h2>

              <h3 className="text-xl font-semibold text-slate-800 mb-3 mt-6">14.1 Acuerdo Completo</h3>
              <p className="text-slate-700 leading-relaxed mb-4">
                Estos Términos, junto con nuestra Política de Privacidad, constituyen el acuerdo completo entre tú y
                PadeLock con respecto al uso del servicio.
              </p>

              <h3 className="text-xl font-semibold text-slate-800 mb-3 mt-6">14.2 Divisibilidad</h3>
              <p className="text-slate-700 leading-relaxed mb-4">
                Si alguna disposición de estos Términos se considera inválida o inaplicable, el resto de las
                disposiciones continuarán en pleno vigor y efecto.
              </p>

              <h3 className="text-xl font-semibold text-slate-800 mb-3 mt-6">14.3 Renuncia</h3>
              <p className="text-slate-700 leading-relaxed mb-4">
                Ninguna renuncia a cualquier término será considerada como una renuncia continuada o adicional de
                dicho término o de cualquier otro término.
              </p>

              <h3 className="text-xl font-semibold text-slate-800 mb-3 mt-6">14.4 Cesión</h3>
              <p className="text-slate-700 leading-relaxed">
                No puedes ceder o transferir estos Términos o tus derechos bajo los mismos. Podemos ceder estos
                Términos sin restricción.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-playtomic-dark mb-4">15. Contacto</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                Si tienes preguntas sobre estos Términos y Condiciones, puedes contactarnos:
              </p>
              <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                <p className="text-slate-700 mb-2">
                  <strong>Email:</strong>{" "}
                  <a href="mailto:infopadelock@gmail.com" className="text-playtomic-orange hover:underline">
                    infopadelock@gmail.com
                  </a>
                </p>
                <p className="text-slate-700 mb-2">
                  <strong>Entidad legal:</strong> PadeLock
                </p>
                <p className="text-slate-700">
                  <strong>Dirección:</strong> España
                </p>
              </div>
            </section>

            <section className="mb-8 p-6 bg-playtomic-orange/5 rounded-lg border-l-4 border-playtomic-orange">
              <h3 className="text-lg font-semibold text-playtomic-dark mb-3">
                Al utilizar PadeLock, confirmas que has leído, entendido y aceptado estos Términos y Condiciones.
              </h3>
              <p className="text-slate-700 text-sm">
                Última actualización: Octubre 2025
              </p>
            </section>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-slate-200">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-slate-500">
                © 2025 PadeLock. Todos los derechos reservados.
              </p>
              <Link to="/privacy">
                <Button variant="link" className="text-playtomic-orange hover:text-playtomic-orange/80">
                  Ver Política de Privacidad
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
