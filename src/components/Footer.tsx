import { Link } from "react-router-dom";
import { Linkedin, Mail, MapPin } from "lucide-react";
import padelockLogo from "@/assets/padelock-logo-red.png";
import aurelioPhoto from "@/assets/aurelio-contreras.jpg";
import sergioPhoto from "@/assets/sergio-falcon.jpg";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-gradient-to-br from-playtomic-orange/10 via-orange-50/50 to-playtomic-orange/5 border-t-2 border-playtomic-orange/20">
      <div className="w-full px-4 py-4 sm:px-6 sm:py-5">
        {/* Logo and Main Content */}
        <div className="max-w-7xl mx-auto">
          {/* Logo Section */}
          <div className="flex justify-center mb-4 sm:mb-5">
            <img
              src={padelockLogo}
              alt="PadeLock Logo"
              className="h-8 sm:h-10 w-auto drop-shadow-lg"
            />
          </div>

          {/* Main Footer Content */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-4 sm:mb-5">
            {/* About Section */}
            <div className="space-y-2 text-center sm:text-left">
              <h3 className="font-bold text-xs sm:text-sm text-playtomic-orange">Sobre Nosotros</h3>
              <p className="text-xs text-gray-700 leading-relaxed">
                Plataforma de gestión de clases de pádel diseñada para simplificar la administración de clubs.
              </p>
            </div>

            {/* Quick Links */}
            <div className="space-y-2 text-center sm:text-left">
              <h3 className="font-bold text-xs sm:text-sm text-playtomic-orange">Enlaces Rápidos</h3>
              <ul className="space-y-1 text-xs">
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
            <div className="space-y-2 text-center sm:text-left">
              <h3 className="font-bold text-xs sm:text-sm text-playtomic-orange">Contacto</h3>
              <ul className="space-y-1 text-xs text-gray-700">
                <li className="flex items-center gap-2 justify-center sm:justify-start">
                  <Mail className="h-3 w-3 flex-shrink-0 text-playtomic-orange" />
                  <a href="mailto:infopadelock@gmail.com" className="hover:text-playtomic-orange transition-colors truncate font-medium">
                    infopadelock@gmail.com
                  </a>
                </li>
                <li className="flex items-center gap-2 justify-center sm:justify-start">
                  <MapPin className="h-3 w-3 flex-shrink-0 text-playtomic-orange" />
                  <span className="font-medium">Sevilla, España</span>
                </li>
              </ul>
            </div>

            {/* Founders */}
            <div className="space-y-2 text-center sm:text-left">
              <h3 className="font-bold text-xs sm:text-sm text-playtomic-orange">Fundadores</h3>
              <ul className="space-y-2 text-xs">
                <li className="flex items-center gap-2 justify-center sm:justify-start">
                  <img
                    src={aurelioPhoto}
                    alt="Aurelio Contreras"
                    className="h-8 w-8 rounded-full object-cover border-2 border-playtomic-orange/30"
                  />
                  <a
                    href="https://www.linkedin.com/in/aure1/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-gray-700 hover:text-playtomic-orange transition-colors group font-medium"
                  >
                    <span>Aurelio Contreras</span>
                    <Linkedin className="h-3 w-3 flex-shrink-0 group-hover:text-[#0077B5]" />
                  </a>
                </li>
                <li className="flex items-center gap-2 justify-center sm:justify-start">
                  <img
                    src={sergioPhoto}
                    alt="Sergio Falcón"
                    className="h-8 w-8 rounded-full object-cover border-2 border-playtomic-orange/30"
                  />
                  <a
                    href="https://www.linkedin.com/in/sergio-falc%C3%B3n-de-la-calle-083787195/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-gray-700 hover:text-playtomic-orange transition-colors group font-medium"
                  >
                    <span>Sergio Falcón</span>
                    <Linkedin className="h-3 w-3 flex-shrink-0 group-hover:text-[#0077B5]" />
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-3 sm:pt-4 border-t-2 border-playtomic-orange/20">
            <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4">
              <p className="text-xs text-gray-700 text-center font-medium">
                © {currentYear} PadeLock. Todos los derechos reservados.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
