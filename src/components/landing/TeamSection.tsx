import { Linkedin, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import aurelioImage from "@/assets/aurelio-contreras.jpg";
import sergioImage from "@/assets/sergio-falcon.jpg";
const TeamSection = () => {
  const teamMembers = [{
    name: "Aurelio Contreras",
    role: "Co-founder & CPO",
    image: aurelioImage,
    linkedin: "https://www.linkedin.com/in/aure1/",
    email: "auconmu@gmail.com"
  }, {
    name: "Sergio Falcón",
    role: "Co-founder & CTO",
    image: sergioImage,
    linkedin: "https://www.linkedin.com/in/sergio-falc%C3%B3n-de-la-calle-083787195/",
    email: "sefaca24@gmail.com"
  }];
  return <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Nuestro Equipo
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Conoce a los co-fundadores que están revolucionando la gestión de academias de pádel</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {teamMembers.map((member, index) => <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-0">
                <div className="aspect-square overflow-hidden">
                  <img src={member.image} alt={`${member.name} - ${member.role}`} className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {member.name}
                  </h3>
                  <p className="text-primary font-medium mb-4">
                    {member.role}
                  </p>
                  <div className="flex space-x-4">
                    <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center text-muted-foreground hover:text-primary transition-colors" aria-label={`LinkedIn de ${member.name}`}>
                      <Linkedin className="h-5 w-5" />
                    </a>
                    <a href={`mailto:${member.email}`} className="flex items-center text-muted-foreground hover:text-primary transition-colors" aria-label={`Email de ${member.name}`}>
                      <Mail className="h-5 w-5" />
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>)}
        </div>
      </div>
    </section>;
};
export default TeamSection;