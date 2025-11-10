import HeroSection from "@/components/landing/HeroSection";
import ProblemSection from "@/components/landing/ProblemSection";
import SolutionSection from "@/components/landing/SolutionSection";
import WhyNowSection from "@/components/landing/WhyNowSection";
import ProductSection from "@/components/landing/ProductSection";
import ComparisonSection from "@/components/landing/ComparisonSection";
import TeamSection from "@/components/landing/TeamSection";
import { ContactSection } from "@/components/landing/ContactSection";
import { Footer } from "@/components/landing/Footer";

const LandingPage = () => {
  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <WhyNowSection />
      <ProductSection />
      <ComparisonSection />
      <TeamSection />
      <ContactSection />
      <Footer />
    </div>
  );
};

export default LandingPage;