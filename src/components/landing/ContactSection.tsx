import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Phone, MapPin, Send, CheckCircle, Calendar, Clock, User, Users, Building } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";

export const ContactSection = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    clubName: "",
    clubSize: "",
    role: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const {
    toast
  } = useToast();
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      console.log("📧 Enviando solicitud de demo...", formData);

      // Llamar a la Edge Function para enviar el email
      const { data, error } = await supabase.functions.invoke("send-contact-email", {
        body: formData,
      });

      if (error) {
        console.error("❌ Error al enviar email:", error);
        throw error;
      }

      console.log("✅ Email enviado correctamente:", data);

      setIsSubmitting(false);
      setIsSubmitted(true);
      toast({
        title: t("landing.contact.toast.successTitle"),
        description: t("landing.contact.toast.successDesc")
      });

      // Reset form after 3 seconds
      setTimeout(() => {
        setIsSubmitted(false);
        setFormData({
          name: "",
          email: "",
          phone: "",
          clubName: "",
          clubSize: "",
          role: "",
          message: ""
        });
      }, 3000);
    } catch (error) {
      console.error("❌ Error al procesar la solicitud:", error);
      setIsSubmitting(false);
      toast({
        title: t("landing.contact.toast.errorTitle"),
        description: t("landing.contact.toast.errorDesc"),
        variant: "destructive"
      });
    }
  };
  if (isSubmitted) {
    return <section id="contact" className="py-20 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <Card className="border-primary/20 shadow-lg">
              <CardContent className="p-12 space-y-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-3xl font-bold">{t("landing.contact.success.title")}</h2>
                <p className="text-muted-foreground">
                  {t("landing.contact.success.description")}
                </p>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm">
                    <strong>{t("landing.contact.success.nextSteps")}</strong><br />
                    {t("landing.contact.success.nextStepsDesc")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>;
  }
  return <section id="contact" className="py-2 bg-gradient-to-br from-primary/5 to-accent/5">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary mb-6">
            <Calendar className="h-4 w-4 mr-2" /> {t("landing.contact.badge")}
          </div>

          <h2 className="text-4xl lg:text-5xl font-bold mb-6">{t("landing.contact.title")}</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">{t("landing.contact.subtitle")}</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Left Column - Contact Info */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold">{t("landing.contact.leftColumn.title")}</h3>
              <p className="text-muted-foreground">{t("landing.contact.leftColumn.description")}</p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center space-x-4 p-4 rounded-lg bg-card border">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{t("landing.contact.leftColumn.duration")}</h3>
                  <p className="text-muted-foreground">{t("landing.contact.leftColumn.durationDesc")}</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-4 rounded-lg bg-card border">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{t("landing.contact.leftColumn.oneOnOne")}</h3>
                  <p className="text-muted-foreground">{t("landing.contact.leftColumn.oneOnOneDesc")}</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-4 rounded-lg bg-card border">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Send className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{t("landing.contact.leftColumn.followUp")}</h3>
                  <p className="text-muted-foreground">{t("landing.contact.leftColumn.followUpDesc")}</p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl p-6 border space-y-4">
              <h3 className="font-semibold">{t("landing.contact.leftColumn.includesTitle")}</h3>
              <ul className="space-y-3">
                <li className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-sm">{t("landing.contact.leftColumn.includesItems.tour")}</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-sm">{t("landing.contact.leftColumn.includesItems.config")}</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-sm">{t("landing.contact.leftColumn.includesItems.roi")}</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-sm">{t("landing.contact.leftColumn.includesItems.questions")}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column - Contact Form */}
          <Card className="border-primary/20 shadow-lg">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      {t("landing.contact.form.name")} *
                    </Label>
                    <Input id="name" value={formData.name} onChange={e => handleInputChange("name", e.target.value)} placeholder={t("landing.contact.form.namePlaceholder")} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center">
                      <Phone className="h-4 w-4 mr-1" />
                      {t("landing.contact.form.phone")}
                    </Label>
                    <Input id="phone" value={formData.phone} onChange={e => handleInputChange("phone", e.target.value)} placeholder={t("landing.contact.form.phonePlaceholder")} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center">
                    <Mail className="h-4 w-4 mr-1" />
                    {t("landing.contact.form.email")} *
                  </Label>
                  <Input id="email" type="email" value={formData.email} onChange={e => handleInputChange("email", e.target.value)} placeholder={t("landing.contact.form.emailPlaceholder")} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clubName" className="flex items-center">
                    <Building className="h-4 w-4 mr-1" />
                    {t("landing.contact.form.clubName")}
                  </Label>
                  <Input id="clubName" value={formData.clubName} onChange={e => handleInputChange("clubName", e.target.value)} placeholder={t("landing.contact.form.clubNamePlaceholder")} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clubSize">{t("landing.contact.form.clubSize")}</Label>
                    <Select value={formData.clubSize} onValueChange={value => handleInputChange("clubSize", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("landing.contact.form.clubSizePlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">{t("landing.contact.form.clubSizeSmall")}</SelectItem>
                        <SelectItem value="medium">{t("landing.contact.form.clubSizeMedium")}</SelectItem>
                        <SelectItem value="large">{t("landing.contact.form.clubSizeLarge")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">{t("landing.contact.form.role")}</Label>
                    <Select value={formData.role} onValueChange={value => handleInputChange("role", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("landing.contact.form.rolePlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="owner">{t("landing.contact.form.roleOwner")}</SelectItem>
                        <SelectItem value="manager">{t("landing.contact.form.roleManager")}</SelectItem>
                        <SelectItem value="coach">{t("landing.contact.form.roleCoach")}</SelectItem>
                        <SelectItem value="other">{t("landing.contact.form.roleOther")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">{t("landing.contact.form.message")}</Label>
                  <Textarea id="message" value={formData.message} onChange={e => handleInputChange("message", e.target.value)} placeholder={t("landing.contact.form.messagePlaceholder")} rows={4} />
                </div>

                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 shadow-md shadow-primary/25" size="lg" disabled={isSubmitting}>
                  {isSubmitting ? <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {t("landing.contact.form.submitting")}
                    </> : <>
                      {t("landing.contact.form.submitButton")}
                      <Send className="ml-2 h-4 w-4" />
                    </>}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  {t("landing.contact.form.privacy")}
                </p>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Contact Methods */}
        <div className="mt-16 grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center p-6 rounded-xl bg-card border">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Phone className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">{t("landing.contact.methods.phone.title")}</h3>
            <a href="https://wa.me/34644658069" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 transition-colors">
              {t("landing.contact.methods.phone.link")}
            </a>
            <p className="text-sm text-muted-foreground mt-1">{t("landing.contact.methods.phone.hours")}</p>
          </div>

          <div className="text-center p-6 rounded-xl bg-card border">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">{t("landing.contact.methods.email.title")}</h3>
            <a href="mailto:infopadelock@gmail.com" className="text-primary hover:text-primary/80 transition-colors">
              infopadelock@gmail.com
            </a>
            <p className="text-sm text-muted-foreground mt-1">{t("landing.contact.methods.email.response")}</p>
          </div>

          <div className="text-center p-6 rounded-xl bg-card border">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">{t("landing.contact.methods.location.title")}</h3>
            <p className="text-muted-foreground">{t("landing.contact.methods.location.city")}</p>
            <p className="text-sm text-muted-foreground mt-1">{t("landing.contact.methods.location.appointment")}</p>
          </div>
        </div>
      </div>
    </section>;
};