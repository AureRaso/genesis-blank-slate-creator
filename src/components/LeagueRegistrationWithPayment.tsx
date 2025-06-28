
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRegisterForLeague, useWithdrawFromLeague, usePlayerRegistration } from "@/hooks/useLeaguePlayers";
import LeagueRegistration from "./LeagueRegistration";
import PaymentIntegration from "./PaymentIntegration";

const LeagueRegistrationWithPayment = () => {
  const { profile: currentPlayer } = useAuth();
  const [selectedLeagueForPayment, setSelectedLeagueForPayment] = useState<string | null>(null);
  
  const registerForLeague = useRegisterForLeague();
  const withdrawFromLeague = useWithdrawFromLeague();

  const handleRegisterWithPayment = (leagueId: string, registrationPrice: number) => {
    if (registrationPrice > 0) {
      setSelectedLeagueForPayment(leagueId);
    } else {
      // Free registration
      if (!currentPlayer) return;
      registerForLeague.mutate({ 
        leagueId, 
        profileId: currentPlayer.id 
      });
    }
  };

  const handlePaymentSuccess = () => {
    if (selectedLeagueForPayment && currentPlayer) {
      registerForLeague.mutate({
        leagueId: selectedLeagueForPayment,
        profileId: currentPlayer.id
      });
      setSelectedLeagueForPayment(null);
    }
  };

  const handleWithdraw = (leagueId: string) => {
    if (!currentPlayer) return;
    withdrawFromLeague.mutate({ leagueId, profileId: currentPlayer.id });
  };

  if (selectedLeagueForPayment) {
    return (
      <PaymentIntegration
        leagueId={selectedLeagueForPayment}
        onSuccess={handlePaymentSuccess}
        onCancel={() => setSelectedLeagueForPayment(null)}
      />
    );
  }

  return (
    <LeagueRegistration
      onRegister={handleRegisterWithPayment}
      onWithdraw={handleWithdraw}
    />
  );
};

export default LeagueRegistrationWithPayment;
