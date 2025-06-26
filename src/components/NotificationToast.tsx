
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Bell, Trophy, Users, Calendar } from "lucide-react";

interface NotificationToastProps {
  type: "league_created" | "player_joined" | "match_scheduled" | "payment_received";
  message: string;
  details?: string;
}

const NotificationToast = ({ type, message, details }: NotificationToastProps) => {
  const { toast } = useToast();

  useEffect(() => {
    const getIcon = () => {
      switch (type) {
        case "league_created":
          return "🏆";
        case "player_joined":
          return "👥";
        case "match_scheduled":
          return "📅";
        case "payment_received":
          return "💰";
        default:
          return "🔔";
      }
    };

    toast({
      title: `${getIcon()} ${message}`,
      description: details,
      duration: 5000,
    });
  }, [type, message, details, toast]);

  return null; // This component only triggers toasts
};

export default NotificationToast;
