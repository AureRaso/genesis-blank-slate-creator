
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Trophy, Users, MessageCircle, BarChart3, Plus, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useLeagues } from "@/hooks/useLeagues";
import { usePlayerTeams } from "@/hooks/usePlayerTeams";
import MatchesList from "./MatchesList";
import LeagueStandingsTable from "./LeagueStandingsTable";
import CreateMatchForm from "./CreateMatchForm";
import PartnerSelectionModal from "./PartnerSelectionModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PlayerLeagueDetailsProps {
  leagueId: string;
  onBack: () => void;
}

const PlayerLeagueDetails = ({ leagueId, onBack }: PlayerLeagueDetailsProps) => {
  const [showCreateMatch, setShowCreateMatch] = useState(false);
  const [showPartnerSelection, setShowPartnerSelection] = useState(false);
  const { profile } = useAuth();
  const { data: leagues } = useLeagues();
  const { data: playerTeam } = usePlayerTeams(leagueId, profile?.id);
  
  const league = leagues?.find(l => l.id === leagueId);

  if (!league || !profile) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Liga no encontrada</p>
        <Button onClick={onBack} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
      </div>
    );
  }

  // Determinar quién es el compañero
  const partner = playerTeam ? (
    playerTeam.player1?.id === profile.id ? playerTeam.player2 : playerTeam.player1
  ) : null;

  if (showCreateMatch) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={() => setShowCreateMatch(false)}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-2xl font-bold">Crear Nuevo Partido</h1>
        </div>
        
        <CreateMatchForm 
          leagues={[league]}
          onSuccess={() => setShowCreateMatch(false)}
          onCancel={() => setShowCreateMatch(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{league.name}</h1>
            <p className="text-muted-foreground flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              {league.start_date} - {league.end_date}
            </p>
          </div>
        </div>
        <Button 
          variant="outline"
          className="border-blue-200 text-blue-700 hover:bg-blue-50"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Contactar Admin
        </Button>
      </div>

      {/* Partner Status Section */}
      <Card className="border-2 border-dashed border-green-200 bg-gradient-to-r from-green-50 to-blue-50">
        <CardHeader>
          <CardTitle className="text-green-800 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            {playerTeam ? "Tu Equipo" : "Estado de Emparejamiento"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {playerTeam && partner ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-green-500 text-white">
                      {partner.full_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-green-800">{partner.full_name}</p>
                    <p className="text-sm text-green-600">Tu compañero de equipo</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-green-800">{playerTeam.name}</p>
                  <p className="text-sm text-green-600">Nombre del equipo</p>
                </div>
              </div>
              <Button 
                onClick={() => setShowCreateMatch(true)}
                className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Partido
              </Button>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="p-6">
                <Users className="h-16 w-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  Aún no tienes pareja en esta liga
                </h3>
                <p className="text-green-700 mb-4">
                  Elige un compañero para empezar a jugar y crear partidos
                </p>
                <Button 
                  onClick={() => setShowPartnerSelection(true)}
                  className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Elegir Compañero
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* League Info - Simplified */}
      <Card className="bg-gradient-to-r from-slate-50 to-blue-50 border-slate-200">
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xl font-bold text-slate-700">{league.points_victory}</div>
              <div className="text-xs text-slate-600">Pts Victoria</div>
            </div>
            <div>
              <div className="text-xl font-bold text-slate-700">{league.points_defeat}</div>
              <div className="text-xs text-slate-600">Pts Derrota</div>
            </div>
            <div>
              <div className="text-xl font-bold text-slate-700">
                {league.points_per_set ? "Sí" : "No"}
              </div>
              <div className="text-xs text-slate-600">Pts por Set</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs - Only show if player has a team */}
      {playerTeam && (
        <Tabs defaultValue="matches" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="matches" className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Mis Partidos
            </TabsTrigger>
            <TabsTrigger value="standings" className="flex items-center">
              <BarChart3 className="h-4 w-4 mr-2" />
              Clasificación
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="matches" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Tus Partidos
                </CardTitle>
                <CardDescription>
                  Próximos partidos y resultados anteriores en esta liga
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MatchesList leagueId={leagueId} showPlayerMatches={true} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="standings" className="space-y-4">
            <LeagueStandingsTable leagueId={leagueId} leagueName={league.name} />
          </TabsContent>
        </Tabs>
      )}

      {/* Partner Selection Modal */}
      <PartnerSelectionModal
        open={showPartnerSelection}
        onOpenChange={setShowPartnerSelection}
        leagueId={leagueId}
        currentPlayerId={profile.id}
        leagueName={league.name}
      />
    </div>
  );
};

export default PlayerLeagueDetails;
