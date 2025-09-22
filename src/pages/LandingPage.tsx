import { LandingHero } from "@/components/landing/LandingHero";
import VideoDemoSection from "@/components/landing/VideoDemoSection";
import { FeatureSections } from "@/components/landing/FeatureSections";
import { WorkflowDiagram } from "@/components/landing/WorkflowDiagram";
import { BenefitsSection } from "@/components/landing/BenefitsSection";
import TeamSection from "@/components/landing/TeamSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { ContactSection } from "@/components/landing/ContactSection";
import { Footer } from "@/components/landing/Footer";

const LandingPage = () => {
  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <div className="w-full space-y-8">
        <LandingHero />
        <VideoDemoSection />
        <FeatureSections />
        <WorkflowDiagram />
        <BenefitsSection />
        <TeamSection />
        <PricingSection />
        <ContactSection />
        <Footer />
      </div>
    </div>
  );
};

export default LandingPage;