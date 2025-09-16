import { LandingHero } from "@/components/landing/LandingHero";
import { FeatureSections } from "@/components/landing/FeatureSections";
import { WorkflowDiagram } from "@/components/landing/WorkflowDiagram";
import { BenefitsSection } from "@/components/landing/BenefitsSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { ContactSection } from "@/components/landing/ContactSection";
import { Footer } from "@/components/landing/Footer";

const LandingPage = () => {
  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <div className="w-full space-y-8">
        <LandingHero />
        <FeatureSections />
        <WorkflowDiagram />
        <BenefitsSection />
        <PricingSection />
        <ContactSection />
        <Footer />
      </div>
    </div>
  );
};

export default LandingPage;