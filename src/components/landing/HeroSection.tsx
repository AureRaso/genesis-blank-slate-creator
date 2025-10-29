import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import padelockLogo from "@/assets/PadeLock_D5Red.png";

const HeroSection = () => {
  const scrollToContact = () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center bg-gradient-to-br from-slate-900 via-playtomic-dark to-slate-900 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-playtomic-orange/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-playtomic-orange/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-playtomic-orange/5 to-transparent rounded-full blur-3xl"></div>
      </div>

      <div className="container relative z-10 mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img
              src={padelockLogo}
              alt="PadeLock Logo"
              className="h-24 md:h-32 w-auto drop-shadow-2xl"
            />
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-playtomic-orange/10 border border-playtomic-orange/20 rounded-full mb-8">
            <span className="text-sm font-medium text-playtomic-orange">
              Diseñado específicamente para academias de pádel
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Ahorra{" "}
            <span className="text-playtomic-orange">4 horas diarias</span>
            <br />
            gestionando tu academia
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-slate-300 mb-10 max-w-2xl mx-auto">
            La primera plataforma diseñada específicamente para academias de pádel.
            Gestiona profesores, clases y alumnos sin complicaciones.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              className="bg-playtomic-orange hover:bg-playtomic-orange/90 text-white px-8 py-6 text-lg group"
              onClick={scrollToContact}
            >
              Solicitar Demo Gratuita
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 px-8 py-6 text-lg"
              onClick={() => document.getElementById('producto')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Ver cómo funciona
            </Button>
          </div>

          {/* Social Proof */}
          <div className="mt-12 flex items-center justify-center gap-8 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-playtomic-orange/20 border-2 border-slate-800" />
                <div className="w-8 h-8 rounded-full bg-playtomic-orange/40 border-2 border-slate-800" />
                <div className="w-8 h-8 rounded-full bg-playtomic-orange/60 border-2 border-slate-800" />
              </div>
              <span>Academias activas</span>
            </div>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">100% español</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">Soporte incluido</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
