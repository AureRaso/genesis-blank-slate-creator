import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Phone, MapPin, CheckCircle, Calendar, Clock, User, MessageCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

export const ContactSection = () => {
  const { t } = useTranslation();

  const handleWhatsAppClick = () => {
    window.open("https://wa.me/34644658069?text=Hola,%20me%20gustaría%20solicitar%20una%20demo%20de%20PadeLock", "_blank");
  };

  return (
    <section id="contact" className="py-20 bg-gradient-to-br from-primary/5 to-accent/5">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary mb-6">
            <Calendar className="h-4 w-4 mr-2" /> {t("landing.contact.badge")}
          </div>

          <h2 className="text-4xl lg:text-5xl font-bold mb-6">{t("landing.contact.title")}</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">{t("landing.contact.subtitle")}</p>
        </div>

        <div className="max-w-5xl mx-auto">
          {/* Main CTA Card */}
          <Card className="border-primary/20 shadow-2xl mb-12 overflow-hidden">
            <CardContent className="p-0">
              <div className="grid lg:grid-cols-2">
                {/* Left side - Info */}
                <div className="p-8 lg:p-12 bg-gradient-to-br from-primary/5 to-primary/10">
                  <h3 className="text-2xl font-bold mb-6">{t("landing.contact.leftColumn.title")}</h3>
                  <p className="text-muted-foreground mb-8">{t("landing.contact.leftColumn.description")}</p>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{t("landing.contact.leftColumn.duration")}</p>
                        <p className="text-sm text-muted-foreground">{t("landing.contact.leftColumn.durationDesc")}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{t("landing.contact.leftColumn.oneOnOne")}</p>
                        <p className="text-sm text-muted-foreground">{t("landing.contact.leftColumn.oneOnOneDesc")}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{t("landing.contact.leftColumn.followUp")}</p>
                        <p className="text-sm text-muted-foreground">{t("landing.contact.leftColumn.followUpDesc")}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-card/50 rounded-xl p-4 border border-primary/20">
                    <h4 className="font-semibold text-sm mb-3">{t("landing.contact.leftColumn.includesTitle")}</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <span>{t("landing.contact.leftColumn.includesItems.tour")}</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <span>{t("landing.contact.leftColumn.includesItems.config")}</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <span>{t("landing.contact.leftColumn.includesItems.roi")}</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <span>{t("landing.contact.leftColumn.includesItems.questions")}</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Right side - WhatsApp CTA */}
                <div className="p-8 lg:p-12 flex flex-col items-center justify-center bg-white">
                  <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-lg">
                    <MessageCircle className="h-10 w-10 text-white" />
                  </div>

                  <h3 className="text-2xl font-bold text-center mb-4">
                    {t("landing.contact.whatsapp.title")}
                  </h3>

                  <p className="text-center text-muted-foreground mb-8 max-w-sm">
                    {t("landing.contact.whatsapp.description")}
                  </p>

                  <Button
                    size="lg"
                    onClick={handleWhatsAppClick}
                    className="bg-green-500 hover:bg-green-600 text-white px-8 py-6 text-lg w-full max-w-sm shadow-lg hover:shadow-xl transition-all"
                  >
                    <MessageCircle className="mr-2 h-5 w-5" />
                    {t("landing.contact.whatsapp.button")}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center mt-4 max-w-sm">
                    {t("landing.contact.whatsapp.availability")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Methods */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Phone className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{t("landing.contact.methods.phone.title")}</h3>
              <a
                href="https://wa.me/34644658069"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 transition-colors"
              >
                {t("landing.contact.methods.phone.link")}
              </a>
              <p className="text-sm text-muted-foreground mt-1">{t("landing.contact.methods.phone.hours")}</p>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{t("landing.contact.methods.email.title")}</h3>
              <a
                href="mailto:infopadelock@gmail.com"
                className="text-primary hover:text-primary/80 transition-colors break-all"
              >
                infopadelock@gmail.com
              </a>
              <p className="text-sm text-muted-foreground mt-1">{t("landing.contact.methods.email.response")}</p>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{t("landing.contact.methods.location.title")}</h3>
              <p className="text-muted-foreground">{t("landing.contact.methods.location.city")}</p>
              <p className="text-sm text-muted-foreground mt-1">{t("landing.contact.methods.location.appointment")}</p>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};
