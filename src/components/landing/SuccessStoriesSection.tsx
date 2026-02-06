import { Star, Quote } from "lucide-react";
import { useTranslation } from "react-i18next";

const SuccessStoriesSection = () => {
  const { t } = useTranslation();

  const testimonials = [
    {
      nameKey: "landing.successStories.testimonials.juanOrtega.name",
      academyKey: "landing.successStories.testimonials.juanOrtega.academy",
      quoteKey: "landing.successStories.testimonials.juanOrtega.quote",
      highlightKey: "landing.successStories.testimonials.juanOrtega.highlight",
      initials: "JO",
      image: "/La-Red-21-2021-Blanco-NC-1024x1024.png",
    },
    {
      nameKey: "landing.successStories.testimonials.juanMolinillo.name",
      academyKey: "landing.successStories.testimonials.juanMolinillo.academy",
      quoteKey: "landing.successStories.testimonials.juanMolinillo.quote",
      highlightKey: "landing.successStories.testimonials.juanMolinillo.highlight",
      initials: "JM",
      image: "/hesperides_logo.jpg",
    },
    {
      nameKey: "landing.successStories.testimonials.fuenteVina.name",
      academyKey: "landing.successStories.testimonials.fuenteVina.academy",
      quoteKey: "landing.successStories.testimonials.fuenteVina.quote",
      highlightKey: "landing.successStories.testimonials.fuenteVina.highlight",
      initials: "FV",
      image: "/fuente_vina.jpeg",
    },
  ];

  const featured = {
    nameKey: "landing.successStories.featured.name",
    academyKey: "landing.successStories.featured.academy",
    quoteKey: "landing.successStories.featured.quote",
    highlightKey: "landing.successStories.featured.highlight",
    initials: "OC",
    image: "/logo_invictus.png",
  };

  return (
    <section id="success-stories" className="py-24 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-72 h-72 bg-playtomic-orange/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-playtomic-orange/3 rounded-full blur-3xl" />
      </div>

      <div className="container relative z-10 mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-playtomic-orange/10 border border-playtomic-orange/20 rounded-full mb-6">
            <span className="text-sm font-medium text-playtomic-orange">
              {t("landing.successStories.badge")}
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {t("landing.successStories.title")}
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            {t("landing.successStories.subtitle")}
          </p>
        </div>

        {/* 3 Testimonial Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-8">
          {testimonials.map((item, index) => (
            <div
              key={index}
              className="group relative bg-white/[0.04] backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/[0.08] hover:border-playtomic-orange/30 transition-all duration-500"
            >
              {/* Quote icon */}
              <Quote className="w-8 h-8 text-playtomic-orange/40 mb-5 rotate-180" />

              {/* Quote text */}
              <blockquote className="text-slate-300 leading-relaxed mb-6 text-[15px]">
                <span className="text-white font-medium">{t(item.highlightKey)}</span>{" "}
                {t(item.quoteKey)}
              </blockquote>

              {/* Stars */}
              <div className="flex gap-1 mb-5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-playtomic-orange text-playtomic-orange" />
                ))}
              </div>

              {/* Author */}
              <div className="flex items-center gap-3 pt-5 border-t border-white/10">
                {item.image ? (
                  <div className="w-11 h-11 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-playtomic-orange/20 overflow-hidden">
                    <img src={item.image} alt={t(item.nameKey)} className="w-full h-full object-cover rounded-full" />
                  </div>
                ) : (
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-playtomic-orange to-orange-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-playtomic-orange/20">
                    <span className="text-sm font-bold text-white">{item.initials}</span>
                  </div>
                )}
                <div>
                  <p className="text-white font-semibold text-sm">{t(item.nameKey)}</p>
                  <p className="text-slate-400 text-xs">{t(item.academyKey)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Featured Testimonial - Oscar */}
        <div className="max-w-6xl mx-auto">
          <div className="relative bg-gradient-to-r from-playtomic-orange/10 via-playtomic-orange/5 to-transparent border border-playtomic-orange/20 rounded-2xl p-8 md:p-10">
            {/* Mobile: same structure as regular cards */}
            <div className="md:hidden">
              <Quote className="w-8 h-8 text-playtomic-orange/40 mb-5 rotate-180" />
              <blockquote className="text-slate-300 leading-relaxed mb-6 text-[15px]">
                <span className="text-white font-medium">{t(featured.highlightKey)}</span>{" "}
                {t(featured.quoteKey)}
              </blockquote>
              <div className="flex gap-1 mb-5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-playtomic-orange text-playtomic-orange" />
                ))}
              </div>
              <div className="flex items-center gap-3 pt-5 border-t border-white/10">
                {featured.image ? (
                  <div className="w-11 h-11 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-playtomic-orange/20 overflow-hidden">
                    <img src={featured.image} alt={t(featured.nameKey)} className="w-full h-full object-contain rounded-full" />
                  </div>
                ) : (
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-playtomic-orange to-orange-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-playtomic-orange/20">
                    <span className="text-sm font-bold text-white">{featured.initials}</span>
                  </div>
                )}
                <div>
                  <p className="text-white font-semibold text-sm">{t(featured.nameKey)}</p>
                  <p className="text-slate-400 text-xs">{t(featured.academyKey)}</p>
                </div>
              </div>
            </div>

            {/* Desktop: side-by-side layout */}
            <div className="hidden md:flex flex-row gap-8 items-start">
              <div className="flex flex-col items-start gap-3 min-w-[160px]">
                {featured.image ? (
                  <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center shadow-lg shadow-playtomic-orange/30 overflow-hidden">
                    <img src={featured.image} alt={t(featured.nameKey)} className="w-14 h-14 object-contain" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-playtomic-orange to-orange-600 flex items-center justify-center shadow-lg shadow-playtomic-orange/30">
                    <span className="text-xl font-bold text-white">{featured.initials}</span>
                  </div>
                )}
                <div className="text-left">
                  <p className="text-white font-bold">{t(featured.nameKey)}</p>
                  <p className="text-slate-400 text-sm">{t(featured.academyKey)}</p>
                </div>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-playtomic-orange text-playtomic-orange" />
                  ))}
                </div>
              </div>
              <div className="flex-1">
                <Quote className="w-10 h-10 text-playtomic-orange/30 mb-4 rotate-180" />
                <blockquote className="text-slate-300 leading-relaxed text-lg">
                  <span className="text-white font-medium">{t(featured.highlightKey)}</span>{" "}
                  {t(featured.quoteKey)}
                </blockquote>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom divider */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-playtomic-orange/30 to-transparent" />
    </section>
  );
};

export default SuccessStoriesSection;
