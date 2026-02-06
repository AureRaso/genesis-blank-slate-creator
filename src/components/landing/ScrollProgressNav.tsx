import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const sections = [
  { id: "home", labelKey: "landing.navigation.home" },
  { id: "problem", labelKey: "landing.scrollNav.problem" },
  { id: "success-stories", labelKey: "landing.scrollNav.successStories" },
  { id: "onboarding", labelKey: "landing.scrollNav.onboarding" },
  { id: "product", labelKey: "landing.scrollNav.product" },
  { id: "comparison", labelKey: "landing.scrollNav.comparison" },
  { id: "features", labelKey: "landing.scrollNav.features" },
  { id: "team", labelKey: "landing.scrollNav.team" },
  { id: "contact", labelKey: "landing.scrollNav.contact" },
];

const ScrollProgressNav = () => {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState("home");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show only after scrolling past hero
      setIsVisible(window.scrollY > 300);

      // Find active section
      const scrollPosition = window.scrollY + window.innerHeight / 3;

      for (let i = sections.length - 1; i >= 0; i--) {
        const element = document.getElementById(sections[i].id);
        if (element && element.offsetTop <= scrollPosition) {
          setActiveSection(sections[i].id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav
      className={`fixed right-6 top-1/2 -translate-y-1/2 z-50 hidden lg:flex flex-col items-center gap-3 transition-opacity duration-500 ${
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      {sections.map((section) => {
        const isActive = activeSection === section.id;
        return (
          <button
            key={section.id}
            onClick={() => scrollToSection(section.id)}
            className="group relative flex items-center"
            aria-label={t(section.labelKey)}
          >
            {/* Tooltip */}
            <span
              className={`absolute right-8 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-300 ${
                isActive
                  ? "bg-playtomic-orange text-white opacity-100"
                  : "bg-slate-800 text-slate-300 opacity-0 group-hover:opacity-100"
              } pointer-events-none`}
            >
              {t(section.labelKey)}
            </span>

            {/* Dot */}
            <span
              className={`block rounded-full transition-all duration-300 ${
                isActive
                  ? "w-3 h-3 bg-playtomic-orange shadow-lg shadow-playtomic-orange/40"
                  : "w-2 h-2 bg-white/30 group-hover:bg-white/60"
              }`}
            />
          </button>
        );
      })}
    </nav>
  );
};

export default ScrollProgressNav;
