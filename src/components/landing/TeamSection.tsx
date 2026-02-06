import { Linkedin, Mail, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import aurelioImage from "@/assets/aurelio-contreras.jpg";
import sergioImage from "@/assets/sergio-falcon.jpg";

const TeamSection = () => {
  const { t } = useTranslation();

  const teamMembers = [{
    nameKey: "landing.team.members.aurelio.name",
    roleKey: "",
    image: aurelioImage,
    linkedin: "https://www.linkedin.com/in/aure1/",
    email: "auconmu@gmail.com"
  }, {
    nameKey: "landing.team.members.sergio.name",
    roleKey: "",
    image: sergioImage,
    linkedin: "https://www.linkedin.com/in/sergio-falc%C3%B3n-de-la-calle-083787195/",
    email: "sefaca24@gmail.com"
  }, {
    nameKey: "landing.team.members.javi.name",
    roleKey: "",
    image: "/javi_pena.jpeg",
    linkedin: "",
    email: ""
  }];

  return <section id="team" className="pt-12 pb-24 bg-background relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("landing.team.title")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t("landing.team.subtitle")}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {teamMembers.map((member, index) => <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-0">
                <div className="aspect-square overflow-hidden">
                  {member.image ? (
                    <img src={member.image} alt={`${t(member.nameKey)} - ${t(member.roleKey)}`} className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <User className="w-20 h-20 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {t(member.nameKey)}
                  </h3>
                  {member.roleKey && (
                    <p className="text-primary font-medium mb-4">
                      {t(member.roleKey)}
                    </p>
                  )}
                  {(member.linkedin || member.email) && (
                    <div className="flex space-x-4">
                      {member.linkedin && (
                        <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center text-muted-foreground hover:text-primary transition-colors" aria-label={`LinkedIn de ${t(member.nameKey)}`}>
                          <Linkedin className="h-5 w-5" />
                        </a>
                      )}
                      {member.email && (
                        <a href={`mailto:${member.email}`} className="flex items-center text-muted-foreground hover:text-primary transition-colors" aria-label={`Email de ${t(member.nameKey)}`}>
                          <Mail className="h-5 w-5" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>)}
        </div>
      </div>
    </section>;
};
export default TeamSection;