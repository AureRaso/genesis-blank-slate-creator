import { useState, useEffect } from "react";
import { Menu, X, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import padelockLogo from "@/assets/padelock-logo-red.png";

export const StickyNavigation = () => {
  const { t, i18n } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Get the height of the hero section to determine when to show navbar
      const heroSection = document.getElementById('home');
      const heroHeight = heroSection ? heroSection.offsetHeight : 800;

      // Show navbar only after scrolling past the hero section
      setIsScrolled(window.scrollY > heroHeight - 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "es" : "en";
    i18n.changeLanguage(newLang);
  };

  const navigationItems = [
    { labelKey: "landing.navigation.home", href: "#home" },
    { labelKey: "landing.navigation.onboarding", href: "#onboarding" },
    { labelKey: "landing.navigation.problem", href: "#problem" },
    { labelKey: "landing.navigation.product", href: "#product" },
    { labelKey: "landing.navigation.features", href: "#features" },
    { labelKey: "landing.navigation.team", href: "#team" },
    { labelKey: "landing.navigation.contact", href: "#contact" },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);

    const targetId = href.replace("#", "");
    const element = document.getElementById(targetId);

    if (element) {
      const offset = 80; // Height of sticky nav
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/95 backdrop-blur-md shadow-md translate-y-0"
          : "bg-white/90 backdrop-blur-sm -translate-y-full"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <a
            href="#home"
            onClick={(e) => handleNavClick(e, "#home")}
            className="flex items-center space-x-2"
          >
            <img
              src={padelockLogo}
              alt="PadeLock Logo"
              className="h-10 w-auto"
            />
          </a>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navigationItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
              >
                {t(item.labelKey)}
              </a>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
              className="text-slate-700 hover:text-slate-900 hover:bg-slate-100"
            >
              <Globe className="h-4 w-4 mr-2" />
              {i18n.language === "en" ? "ES" : "EN"}
            </Button>
            <Button
              size="sm"
              onClick={() => {
                const element = document.getElementById("contact");
                if (element) {
                  const offset = 80;
                  const elementPosition = element.getBoundingClientRect().top;
                  const offsetPosition = elementPosition + window.pageYOffset - offset;
                  window.scrollTo({ top: offsetPosition, behavior: "smooth" });
                }
              }}
              className="bg-primary hover:bg-primary/90"
            >
              {t("landing.navigation.requestDemo")}
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-4 border-t bg-white/95 backdrop-blur-md">
            <div className="flex flex-col space-y-2">
              {navigationItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  className="px-4 py-3 text-sm font-medium text-slate-700 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                >
                  {t(item.labelKey)}
                </a>
              ))}
              <div className="flex flex-col space-y-2 pt-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleLanguage}
                  className="w-full justify-start text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                >
                  <Globe className="h-4 w-4 mr-2" />
                  {i18n.language === "en" ? "Español" : "English"}
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    const element = document.getElementById("contact");
                    if (element) {
                      const offset = 80;
                      const elementPosition = element.getBoundingClientRect().top;
                      const offsetPosition = elementPosition + window.pageYOffset - offset;
                      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
                    }
                  }}
                  className="bg-primary hover:bg-primary/90"
                >
                  {t("landing.navigation.requestDemo")}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
