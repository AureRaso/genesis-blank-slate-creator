import { Link } from "react-router-dom";
import { Linkedin, Mail, MapPin } from "lucide-react";
import padelockLogo from "@/assets/PadeLock_D5Red.png";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-gradient-to-br from-playtomic-orange/10 via-orange-50/50 to-playtomic-orange/5 border-t-2 border-playtomic-orange/20 mt-auto">
      <div className="w-full px-4 py-6 sm:px-6 sm:py-8 md:py-10">
        {/* Logo and Main Content */}
        <div className="max-w-7xl mx-auto">
          {/* Logo Section */}
          <div className="flex justify-center mb-6 sm:mb-8">
            <img
              src={padelockLogo}
              alt="PadeLock Logo"
              className="h-16 sm:h-20 md:h-24 w-auto drop-shadow-lg"
            />
          </div>

          {/* Main Footer Content */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
            {/* About Section */}
            <div className="space-y-3 text-center sm:text-left">
              <h3 className="font-bold text-sm sm:text-base text-playtomic-orange">Sobre Nosotros</h3>
              <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                Plataforma de gestión de clases de pádel diseñada para simplificar la administración de clubs.
              </p>
            </div>

            {/* Quick Links */}
            <div className="space-y-3 text-center sm:text-left">
              <h3 className="font-bold text-sm sm:text-base text-playtomic-orange">Enlaces Rápidos</h3>
              <ul className="space-y-2 text-xs sm:text-sm">
                <li>
                  <Link to="/dashboard" className="text-gray-700 hover:text-playtomic-orange transition-colors font-medium">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="text-gray-700 hover:text-playtomic-orange transition-colors font-medium">
                    Política de Privacidad
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="text-gray-700 hover:text-playtomic-orange transition-colors font-medium">
                    Términos de Servicio
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div className="space-y-3 text-center sm:text-left">
              <h3 className="font-bold text-sm sm:text-base text-playtomic-orange">Contacto</h3>
              <ul className="space-y-2 text-xs sm:text-sm text-gray-700">
                <li className="flex items-center gap-2 justify-center sm:justify-start">
                  <Mail className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 text-playtomic-orange" />
                  <a href="mailto:infopadelock@gmail.com" className="hover:text-playtomic-orange transition-colors truncate font-medium">
                    infopadelock@gmail.com
                  </a>
                </li>
                <li className="flex items-center gap-2 justify-center sm:justify-start">
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 text-playtomic-orange" />
                  <span className="font-medium">Sevilla, España</span>
                </li>
              </ul>
            </div>

            {/* Founders */}
            <div className="space-y-3 text-center sm:text-left">
              <h3 className="font-bold text-sm sm:text-base text-playtomic-orange">Fundadores</h3>
              <ul className="space-y-2 text-xs sm:text-sm">
                <li className="flex items-center gap-2 justify-center sm:justify-start">
                  <a
                    href="https://www.linkedin.com/in/aure1/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-gray-700 hover:text-playtomic-orange transition-colors group font-medium"
                  >
                    <Linkedin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 group-hover:text-[#0077B5]" />
                    <span>Aurelio Contreras</span>
                  </a>
                </li>
                <li className="flex items-center gap-2 justify-center sm:justify-start">
                  <a
                    href="https://www.linkedin.com/in/sergio-falc%C3%B3n-de-la-calle-083787195/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-gray-700 hover:text-playtomic-orange transition-colors group font-medium"
                  >
                    <Linkedin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 group-hover:text-[#0077B5]" />
                    <span>Sergio Falcón</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-4 sm:pt-6 border-t-2 border-playtomic-orange/20">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
              <p className="text-xs sm:text-sm text-gray-700 text-center sm:text-left font-medium">
                © {currentYear} PadeLock. Todos los derechos reservados.
              </p>
              <div className="flex gap-4">
                <a
                  href="https://www.linkedin.com/in/aure1/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-[#0077B5] transition-colors p-2 rounded-full hover:bg-white"
                  aria-label="LinkedIn Aurelio Contreras"
                >
                  <Linkedin className="h-5 w-5 sm:h-6 sm:w-6" />
                </a>
                <a
                  href="https://www.linkedin.com/in/sergio-falc%C3%B3n-de-la-calle-083787195/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-[#0077B5] transition-colors p-2 rounded-full hover:bg-white"
                  aria-label="LinkedIn Sergio Falcón"
                >
                  <Linkedin className="h-5 w-5 sm:h-6 sm:w-6" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
