import { Link } from "react-router-dom";
import { Linkedin, Mail, MapPin } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-background to-secondary/20 border-t border-border mt-auto">
      <div className="container mx-auto px-3 py-6 sm:px-4 sm:py-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-6">
          {/* About Section */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm sm:text-base">Sobre Nosotros</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Plataforma de gestión de clases de pádel diseñada para simplificar la administración de clubs y mejorar la experiencia de los jugadores.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm sm:text-base">Enlaces Rápidos</h3>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <Link to="/dashboard" className="text-muted-foreground hover:text-primary transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                  Política de Privacidad
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                  Términos de Servicio
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm sm:text-base">Contacto</h3>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Mail className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <a href="mailto:info@padelmanager.com" className="hover:text-primary transition-colors truncate">
                  info@padelmanager.com
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 mt-0.5" />
                <span>España</span>
              </li>
            </ul>
          </div>

          {/* Founders */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm sm:text-base">Fundadores</h3>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <a
                  href="https://www.linkedin.com/in/aure1/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group"
                >
                  <Linkedin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 group-hover:text-[#0077B5]" />
                  <span>Aurelio Contreras</span>
                </a>
              </li>
              <li>
                <a
                  href="https://www.linkedin.com/in/sergio-falc%C3%B3n-de-la-calle-083787195/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group"
                >
                  <Linkedin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 group-hover:text-[#0077B5]" />
                  <span>Sergio Falcón</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-4 sm:pt-6 border-t border-border">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
            <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
              © {currentYear} Padel Manager. Todos los derechos reservados.
            </p>
            <div className="flex gap-4">
              <a
                href="https://www.linkedin.com/in/aure1/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-[#0077B5] transition-colors"
                aria-label="LinkedIn Aurelio Contreras"
              >
                <Linkedin className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
              <a
                href="https://www.linkedin.com/in/sergio-falc%C3%B3n-de-la-calle-083787195/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-[#0077B5] transition-colors"
                aria-label="LinkedIn Sergio Falcón"
              >
                <Linkedin className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
