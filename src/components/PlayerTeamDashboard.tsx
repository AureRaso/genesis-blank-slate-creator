
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Trophy, Swords, Eye, Calendar, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import LeagueHeader from "./league/LeagueHeader";
import PlayerLeagueTabs from "./league/PlayerLeagueTabs";

interface PlayerTeamDashboardProps {
  league: {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
  };
  playerTeam: any;
  partner: any;
  onBack: () => void;
}

const PlayerTeamDashboard = ({ league, playerTeam, partner, onBack }: PlayerTeamDashboardProps) => {
  const navigate = useNavigate();

  const handleViewMatches = () => {
    navigate('/matches');
  };

  const handleViewStandings = () => {
    navigate('/standings');
  };

  return (
    <div className="space-y-6">
      <LeagueHeader league={league} onBack={onBack} />

      {/* Team Status Card - Pantalla alternativa */}
      <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-blue-50">
        <CardHeader>
          <CardTitle className="text-green-800 flex items-center justify-between">
            <div className="flex items-center">
              <Trophy className="h-5 w-5 mr-2" />
              Ya tienes pareja en esta liga
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Equipo Creado
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-green-700 mb-4">
                Tu equipo ya está creado. Puedes comenzar a jugar partidos o revisar tu posición.
              </p>
            </div>

            <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-green-200">
              <div className="flex items-center space-x-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-green-500 text-white">
                    {partner?.[0]?.full_name?.charAt(0).toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-green-800">{partner?.[0]?.full_name || 'Compañero'}</p>
                  <p className="text-sm text-green-600">Tu compañero de equipo</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-green-800">{playerTeam.name}</p>
                <p className="text-sm text-green-600">Nombre del equipo</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button 
                onClick={handleViewMatches}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Ver mis partidos
              </Button>
              <Button 
                onClick={handleViewStandings}
                variant="outline"
                className="border-green-200 text-green-700 hover:bg-green-50"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Clasificaciones
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for matches and standings */}
      <PlayerLeagueTabs leagueId={league.id} leagueName={league.name} />
    </div>
  );
};

export default PlayerTeamDashboard;
