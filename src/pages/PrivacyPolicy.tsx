import { Link } from "react-router-dom";
import { Shield, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import padelockLogo from "@/assets/PadeLock_D5Red.png";

export default function PrivacyPolicy() {
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
              <Shield className="w-6 h-6 text-playtomic-orange" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-playtomic-dark to-slate-700 bg-clip-text text-transparent">
                Política de Privacidad
              </h1>
              <p className="text-sm text-slate-500 mt-1">Última actualización: Octubre 2025</p>
            </div>
          </div>

          {/* Content */}
          <div className="w-full">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-playtomic-dark mb-4">1. Introducción</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                En PadeLock, nos tomamos muy en serio la privacidad de nuestros usuarios. Esta Política de Privacidad
                describe cómo recopilamos, usamos, almacenamos y protegemos tu información personal cuando utilizas
                nuestra plataforma de gestión de clases de pádel.
              </p>
              <p className="text-slate-700 leading-relaxed">
                Al utilizar PadeLock, aceptas las prácticas descritas en esta política. Si no estás de acuerdo con
                alguna parte de esta política, por favor no utilices nuestros servicios.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-playtomic-dark mb-4">2. Información que Recopilamos</h2>

              <h3 className="text-xl font-semibold text-slate-800 mb-3 mt-6">2.1 Información que Proporcionas</h3>
              <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
                <li><strong>Datos de registro:</strong> Nombre completo, dirección de correo electrónico, contraseña (encriptada)</li>
                <li><strong>Datos de perfil:</strong> Nivel de juego en Playtomic, club de pádel, teléfono</li>
                <li><strong>Información de Google OAuth:</strong> Si eliges registrarte con Google, recopilamos tu nombre, email y foto de perfil</li>
                <li><strong>Datos de pago:</strong> Información procesada de forma segura a través de Stripe (no almacenamos datos de tarjetas)</li>
              </ul>

              <h3 className="text-xl font-semibold text-slate-800 mb-3 mt-6">2.2 Información Generada Automáticamente</h3>
              <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
                <li><strong>Datos de uso:</strong> Clases reservadas, asistencias, participación en actividades</li>
                <li><strong>Información técnica:</strong> Dirección IP, tipo de navegador, sistema operativo, cookies</li>
                <li><strong>Registros de actividad:</strong> Fechas y horas de acceso, acciones realizadas en la plataforma</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-playtomic-dark mb-4">3. Cómo Usamos tu Información</h2>
              <p className="text-slate-700 leading-relaxed mb-3">Utilizamos la información recopilada para:</p>
              <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
                <li>Proporcionar y mantener nuestros servicios de gestión de clases</li>
                <li>Crear y gestionar tu cuenta de usuario</li>
                <li>Procesar reservas y pagos de clases</li>
                <li>Enviar notificaciones importantes sobre tus clases y reservas</li>
                <li>Comunicarnos contigo sobre actualizaciones del servicio</li>
                <li>Mejorar y personalizar tu experiencia en la plataforma</li>
                <li>Prevenir fraudes y garantizar la seguridad de la plataforma</li>
                <li>Cumplir con obligaciones legales y regulatorias</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-playtomic-dark mb-4">4. Compartir Información</h2>
              <p className="text-slate-700 leading-relaxed mb-3">
                No vendemos ni alquilamos tu información personal a terceros. Podemos compartir tu información en las
                siguientes circunstancias:
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
                <li><strong>Con tu club de pádel:</strong> Compartimos información necesaria para gestionar tus clases y reservas</li>
                <li><strong>Con entrenadores:</strong> Los entrenadores pueden ver información de sus estudiantes asignados</li>
                <li><strong>Proveedores de servicios:</strong> Stripe para pagos, Supabase para almacenamiento de datos, Resend para emails</li>
                <li><strong>Obligaciones legales:</strong> Cuando sea requerido por ley o para proteger nuestros derechos legales</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-playtomic-dark mb-4">5. Seguridad de los Datos</h2>
              <p className="text-slate-700 leading-relaxed mb-3">
                Implementamos medidas de seguridad técnicas y organizativas para proteger tu información:
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
                <li>Encriptación de contraseñas con algoritmos seguros</li>
                <li>Conexiones HTTPS para todas las comunicaciones</li>
                <li>Row Level Security (RLS) en nuestra base de datos</li>
                <li>Autenticación de dos factores disponible</li>
                <li>Auditorías regulares de seguridad</li>
                <li>Acceso restringido a datos personales solo para personal autorizado</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-playtomic-dark mb-4">6. Tus Derechos</h2>
              <p className="text-slate-700 leading-relaxed mb-3">
                Conforme al RGPD (Reglamento General de Protección de Datos), tienes los siguientes derechos:
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
                <li><strong>Acceso:</strong> Solicitar una copia de los datos personales que tenemos sobre ti</li>
                <li><strong>Rectificación:</strong> Corregir datos inexactos o incompletos</li>
                <li><strong>Supresión:</strong> Solicitar la eliminación de tus datos personales</li>
                <li><strong>Portabilidad:</strong> Recibir tus datos en un formato estructurado y legible</li>
                <li><strong>Oposición:</strong> Oponerte al procesamiento de tus datos en ciertas circunstancias</li>
                <li><strong>Limitación:</strong> Solicitar la limitación del procesamiento de tus datos</li>
              </ul>
              <p className="text-slate-700 leading-relaxed mt-4">
                Para ejercer cualquiera de estos derechos, contáctanos en{" "}
                <a href="mailto:infopadelock@gmail.com" className="text-playtomic-orange hover:underline font-medium">
                  infopadelock@gmail.com
                </a>
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-playtomic-dark mb-4">7. Cookies y Tecnologías Similares</h2>
              <p className="text-slate-700 leading-relaxed mb-3">
                Utilizamos cookies y tecnologías similares para:
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
                <li>Mantener tu sesión activa</li>
                <li>Recordar tus preferencias</li>
                <li>Analizar el uso de la plataforma</li>
                <li>Mejorar el rendimiento y la experiencia del usuario</li>
              </ul>
              <p className="text-slate-700 leading-relaxed mt-4">
                Puedes configurar tu navegador para rechazar cookies, pero esto puede afectar la funcionalidad de la plataforma.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-playtomic-dark mb-4">8. Retención de Datos</h2>
              <p className="text-slate-700 leading-relaxed">
                Conservamos tu información personal solo durante el tiempo necesario para cumplir con los propósitos
                descritos en esta política, a menos que la ley requiera o permita un período de retención más largo.
                Cuando elimines tu cuenta, eliminaremos o anonimizaremos tus datos personales, excepto cuando debamos
                conservarlos por obligaciones legales.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-playtomic-dark mb-4">9. Transferencias Internacionales</h2>
              <p className="text-slate-700 leading-relaxed">
                Tus datos pueden ser transferidos y procesados en servidores ubicados fuera de tu país de residencia.
                Tomamos medidas para garantizar que tus datos reciban un nivel adecuado de protección mediante cláusulas
                contractuales estándar y otras salvaguardas apropiadas.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-playtomic-dark mb-4">10. Menores de Edad</h2>
              <p className="text-slate-700 leading-relaxed">
                Nuestros servicios no están dirigidos a menores de 16 años. No recopilamos intencionalmente información
                de menores de 16 años. Si eres padre/madre o tutor y tienes conocimiento de que tu hijo nos ha
                proporcionado información personal, contáctanos para que podamos eliminarla.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-playtomic-dark mb-4">11. Cambios a esta Política</h2>
              <p className="text-slate-700 leading-relaxed">
                Podemos actualizar esta Política de Privacidad periódicamente. Te notificaremos sobre cambios
                significativos publicando la nueva política en esta página y actualizando la fecha de "Última
                actualización". Te recomendamos revisar esta política periódicamente.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-playtomic-dark mb-4">12. Contacto</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                Si tienes preguntas, comentarios o inquietudes sobre esta Política de Privacidad o nuestras prácticas
                de datos, puedes contactarnos:
              </p>
              <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                <p className="text-slate-700 mb-2">
                  <strong>Email:</strong>{" "}
                  <a href="mailto:infopadelock@gmail.com" className="text-playtomic-orange hover:underline">
                    infopadelock@gmail.com
                  </a>
                </p>
                <p className="text-slate-700 mb-2">
                  <strong>Responsable de Protección de Datos:</strong> PadeLock
                </p>
                <p className="text-slate-700">
                  <strong>Dirección:</strong> España
                </p>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-slate-200">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-slate-500">
                © 2025 PadeLock. Todos los derechos reservados.
              </p>
              <Link to="/terms">
                <Button variant="link" className="text-playtomic-orange hover:text-playtomic-orange/80">
                  Ver Términos y Condiciones
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
