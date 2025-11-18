import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { StickyNavigation } from "@/components/landing/StickyNavigation";
import HeroSection from "@/components/landing/HeroSection";
import ProblemSection from "@/components/landing/ProblemSection";
import SolutionSection from "@/components/landing/SolutionSection";
import WhyNowSection from "@/components/landing/WhyNowSection";
import ProductSection from "@/components/landing/ProductSection";
import OnboardingSection from "@/components/landing/OnboardingSection";
import ComparisonSection from "@/components/landing/ComparisonSection";
import FeaturesHighlightSection from "@/components/landing/FeaturesHighlightSection";
import TeamSection from "@/components/landing/TeamSection";
import { ContactSection } from "@/components/landing/ContactSection";
import { Footer } from "@/components/landing/Footer";

const LandingPage = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect authenticated users to dashboard (fixes iOS Google OAuth redirect issue)
  useEffect(() => {
    if (!loading && user && profile) {
      console.log('🔍 [LANDING] Authenticated user detected, redirecting to dashboard');
      navigate("/dashboard", { replace: true });
    }
  }, [user, profile, loading, navigate]);

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <StickyNavigation />
      <HeroSection />
      <ProblemSection />
      <OnboardingSection />
      {/* <SolutionSection /> */}
      {/* <WhyNowSection /> */}
      <ProductSection />
      <ComparisonSection />
      <FeaturesHighlightSection />
      <TeamSection />
      <ContactSection />
      <Footer />
    </div>
  );
};

export default LandingPage;