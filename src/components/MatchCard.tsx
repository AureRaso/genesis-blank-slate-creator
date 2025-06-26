
import { useState } from "react";
import { Calendar, Clock, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import MatchResultForm from "./MatchResultForm";

interface MatchCardProps {
  match: any;
  onSignUp?: (matchId: string) => void;
}

const MatchCard = ({ match, onSignUp }: MatchCardProps) => {
  const [showResultForm, setShowResultForm] = useState(false);
  const { isAdmin } = useAuth();

  const getPlayerInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'completed': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'completed': return 'Completado';
      default: return status;
    }
  };

  const formatScore = (result: any) => {
    if (!result) return null;
    
    const sets = [];
    sets.push(`${result.team1_set1}-${result.team2_set1}`);
    sets.push(`${result.team1_set2}-${result.team2_set2}`);
    if (result.team1_set3 !== null && result.team2_set3 !== null) {
      sets.push(`${result.team1_set3}-${result.team2_set3}`);
    }
    
    return sets.join(' ');
  };

  const isWinner = (teamId: string, result: any) => {
    return result?.winner_team_id === teamId;
  };

  if (showResultForm) {
    return (
      <MatchResultForm 
        match={match} 
        onClose={() => setShowResultForm(false)} 
      />
    );
  }

  return (
    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-green-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Badge className={`${getStatusColor(match.status)} font-medium`}>
            {getStatusText(match.status)}
          </Badge>
          <div className="flex items-center text-sm text-muted-foreground">
            <Trophy className="h-4 w-4 mr-1" />
            Ronda {match.round}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Teams and Score */}
        <div className="flex items-center justify-between">
          {/* Team 1 */}
          <div className={`flex items-center space-x-3 flex-1 ${isWinner(match.team1_id, match.match_results?.[0]) ? 'text-green-700 font-semibold' : ''}`}>
            <div className="flex -space-x-2">
              <Avatar className="h-8 w-8 border-2 border-white">
                <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  {getPlayerInitials(match.team1?.player1?.name || '')}
                </AvatarFallback>
              </Avatar>
              <Avatar className="h-8 w-8 border-2 border-white">
                <AvatarFallback className="text-xs bg-gradient-to-br from-green-500 to-blue-600 text-white">
                  {getPlayerInitials(match.team1?.player2?.name || '')}
                </AvatarFallback>
              </Avatar>
            </div>
            <div>
              <div className="font-medium text-sm">{match.team1?.name}</div>
              <div className="text-xs text-muted-foreground">
                {match.team1?.player1?.name} & {match.team1?.player2?.name}
              </div>
            </div>
          </div>

          {/* Score */}
          <div className="px-4">
            {match.match_results?.[0] ? (
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">
                  {formatScore(match.match_results[0])}
                </div>
                <div className="text-xs text-muted-foreground">
                  {match.match_results[0].points_team1} - {match.match_results[0].points_team2} pts
                </div>
              </div>
            ) : (
              <div className="text-center text-2xl font-bold text-gray-400">
                vs
              </div>
            )}
          </div>

          {/* Team 2 */}
          <div className={`flex items-center space-x-3 flex-1 justify-end ${isWinner(match.team2_id, match.match_results?.[0]) ? 'text-green-700 font-semibold' : ''}`}>
            <div className="text-right">
              <div className="font-medium text-sm">{match.team2?.name}</div>
              <div className="text-xs text-muted-foreground">
                {match.team2?.player1?.name} & {match.team2?.player2?.name}
              </div>
            </div>
            <div className="flex -space-x-2">
              <Avatar className="h-8 w-8 border-2 border-white">
                <AvatarFallback className="text-xs bg-gradient-to-br from-orange-500 to-red-600 text-white">
                  {getPlayerInitials(match.team2?.player1?.name || '')}
                </AvatarFallback>
              </Avatar>
              <Avatar className="h-8 w-8 border-2 border-white">
                <AvatarFallback className="text-xs bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                  {getPlayerInitials(match.team2?.player2?.name || '')}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>

        {/* Match Info */}
        {(match.scheduled_date || match.scheduled_time) && (
          <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground bg-gray-50 rounded-lg p-2">
            {match.scheduled_date && (
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {new Date(match.scheduled_date).toLocaleDateString()}
              </div>
            )}
            {match.scheduled_time && (
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {match.scheduled_time}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-2">
          {match.status === 'pending' && onSignUp && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onSignUp(match.id)}
              className="flex-1 border-green-200 text-green-700 hover:bg-green-50"
            >
              <Users className="h-4 w-4 mr-2" />
              Apuntarse
            </Button>
          )}
          
          {isAdmin && match.status === 'pending' && (
            <Button 
              size="sm" 
              onClick={() => setShowResultForm(true)}
              className="flex-1 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
            >
              <Trophy className="h-4 w-4 mr-2" />
              Registrar Resultado
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MatchCard;
