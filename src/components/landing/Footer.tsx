import { Mail, Phone, MapPin, Linkedin, Twitter, Instagram, Facebook, ArrowRight, Calendar, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import padelockLogo from "@/assets/padelock-logo-red.png";
export const Footer = () => {
  const currentYear = new Date().getFullYear();
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  return <footer className="bg-card border-t">
      <div className="container mx-auto px-4">
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-10 py-16">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <img 
                  src={padelockLogo} 
                  alt="PadeLock Logo" 
                  className="h-12 w-auto"
                />
              </div>
              <p className="text-muted-foreground max-w-md">La plataforma todo-en-uno para la gestión digital de academias de pádel. Diseñada para optimizar operaciones y mejorar la experiencia de entrenadores y jugadores.</p>
            </div>
            
            {/* Founders */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Fundadores</h4>
              <div className="flex flex-col gap-2">
                <a
                  href="https://www.linkedin.com/in/aure1/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
                >
                  <Linkedin className="h-4 w-4 flex-shrink-0 group-hover:text-[#0077B5]" />
                  <span>Aurelio Contreras</span>
                </a>
                <a
                  href="https://www.linkedin.com/in/sergio-falc%C3%B3n-de-la-calle-083787195/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
                >
                  <Linkedin className="h-4 w-4 flex-shrink-0 group-hover:text-[#0077B5]" />
                  <span>Sergio Falcón</span>
                </a>
              </div>
            </div>
            
            {/* Newsletter Subscription */}
            <div className="pt-4">
              <div className="flex items-center space-x-2 text-sm font-medium mb-3">
                <Mail className="h-4 w-4 text-primary" />
                <span>Suscríbete a nuestra newsletter</span>
              </div>
              <div className="flex space-x-2">
                <Input type="email" placeholder="Tu email" className="flex-1 text-sm" />
                <Button size="sm" className="shrink-0">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Product Column */}
          <div className="space-y-5">
            <h4 className="font-semibold text-lg">Plataforma</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <a href="#features" className="hover:text-primary transition-colors flex items-center">
                  <div className="w-1 h-1 bg-primary rounded-full mr-2"></div>
                  Características
                </a>
              </li>
              <li>
                <a href="#workflow" className="hover:text-primary transition-colors flex items-center">
                  <div className="w-1 h-1 bg-primary rounded-full mr-2"></div>
                  Cómo Funciona
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-primary transition-colors flex items-center">
                  <div className="w-1 h-1 bg-primary rounded-full mr-2"></div>
                  Precios
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-primary transition-colors flex items-center">
                  <div className="w-1 h-1 bg-primary rounded-full mr-2"></div>
                  Demo Gratuita
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors flex items-center">
                  <div className="w-1 h-1 bg-primary rounded-full mr-2"></div>
                  Casos de Éxito
                </a>
              </li>
            </ul>
          </div>

          {/* Resources Column */}
          <div className="space-y-5">
            <h4 className="font-semibold text-lg">Recursos</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-primary transition-colors flex items-center">
                  <div className="w-1 h-1 bg-primary rounded-full mr-2"></div>
                  Centro de Ayuda
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors flex items-center">
                  <div className="w-1 h-1 bg-primary rounded-full mr-2"></div>
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors flex items-center">
                  <div className="w-1 h-1 bg-primary rounded-full mr-2"></div>
                  Tutoriales
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors flex items-center">
                  <div className="w-1 h-1 bg-primary rounded-full mr-2"></div>
                  Webinars
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors flex items-center">
                  <div className="w-1 h-1 bg-primary rounded-full mr-2"></div>
                  API Docs
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Column */}
          <div className="space-y-5">
            <h4 className="font-semibold text-lg">Contacto</h4>
            <div className="space-y-4 text-sm">
              <div className="flex items-start space-x-3 text-muted-foreground">
                <Mail className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span>sefaca24@gmail.com</span>
              </div>
              <div className="flex items-start space-x-3 text-muted-foreground">
                <Phone className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <a href="https://wa.me/34662632906" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  Contáctanos por WhatsApp
                </a>
              </div>
              <div className="flex items-start space-x-3 text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Sevilla, España</span>
              </div>
            </div>
            
            {/* Trust Badges */}
            <div className="pt-4 space-y-2">
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <Shield className="h-3 w-3 text-green-500" />
                <span>Datos protegidos RGPD</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <Zap className="h-3 w-3 text-amber-500" />
                <span>Disponibilidad 99.9%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="py-8 border-t">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-muted-foreground">
              © {currentYear} PadeLock. Todos los derechos reservados.
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <a href="/privacy" className="hover:text-primary transition-colors">Política de Privacidad</a>
              <a href="/terms" className="hover:text-primary transition-colors">Términos de Servicio</a>
              <a href="#" className="hover:text-primary transition-colors">Cookies</a>
            </div>
            
            <Button variant="ghost" size="sm" onClick={scrollToTop} className="text-muted-foreground hover:text-primary">
              Volver arriba
            </Button>
          </div>
        </div>
      </div>
    </footer>;
};

// Componente Input para el newsletter (añadir al import si es necesario)
const Input = ({
  className,
  ...props
}) => {
  return <input className={`flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props} />;
};