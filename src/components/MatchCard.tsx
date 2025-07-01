
import { useState } from "react";
import { Calendar, Clock, Trophy, Users, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useApproveMatchResult } from "@/hooks/useApproveMatchResult";
import MatchResultForm from "./MatchResultForm";

interface MatchCardProps {
  match: any;
  onSignUp?: (matchId: string) => void;
}

const MatchCard = ({ match, onSignUp }: MatchCardProps) => {
  const [showResultForm, setShowResultForm] = useState(false);
  const { user, isAdmin } = useAuth();
  const approveResult = useApproveMatchResult();

  const getPlayerInitials = (name: string) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'completed': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getResultStatusColor = (resultStatus: string) => {
    switch (resultStatus) {
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'disputed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'completed': return 'Completado';
      default: return status;
    }
  };

  const getResultStatusText = (resultStatus: string) => {
    switch (resultStatus) {
      case 'pending': return 'Sin resultado';
      case 'submitted': return 'Esperando aprobación';
      case 'approved': return 'Resultado confirmado';
      case 'disputed': return 'Resultado disputado';
      default: return resultStatus;
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

  // Verificar si el usuario actual puede subir resultados
  const canSubmitResult = () => {
    if (!user?.email || match.result_status !== 'pending') return false;
    
    const team1Emails = [match.team1?.player1?.email, match.team1?.player2?.email].filter(Boolean);
    const team2Emails = [match.team2?.player1?.email, match.team2?.player2?.email].filter(Boolean);
    
    return team1Emails.includes(user.email) || team2Emails.includes(user.email);
  };

  // Verificar si el usuario puede aprobar el resultado
  const canApproveResult = () => {
    if (!user?.email || match.result_status !== 'submitted') return false;
    
    const team1Emails = [match.team1?.player1?.email, match.team1?.player2?.email].filter(Boolean);
    const team2Emails = [match.team2?.player1?.email, match.team2?.player2?.email].filter(Boolean);
    
    // Puede aprobar si pertenece al equipo que NO envió el resultado
    if (match.result_submitted_by_team_id === match.team1_id) {
      return team2Emails.includes(user.email);
    } else if (match.result_submitted_by_team_id === match.team2_id) {
      return team1Emails.includes(user.email);
    }
    
    return false;
  };

  const handleApprove = async (approve: boolean) => {
    await approveResult.mutateAsync({ matchId: match.id, approve });
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
          <div className="flex space-x-2">
            <Badge className={`${getStatusColor(match.status)} font-medium pointer-events-none`}>
              {getStatusText(match.status)}
            </Badge>
            <Badge className={`${getResultStatusColor(match.result_status)} font-medium pointer-events-none`}>
              {getResultStatusText(match.result_status)}
            </Badge>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Trophy className="h-4 w-4 mr-1" />
            {match.created_by_profile_id ? 'Creado por jugador' : `Ronda ${match.round}`}
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
                  {getPlayerInitials(match.team1?.player1?.full_name || '')}
                </AvatarFallback>
              </Avatar>
              <Avatar className="h-8 w-8 border-2 border-white">
                <AvatarFallback className="text-xs bg-gradient-to-br from-green-500 to-blue-600 text-white">
                  {getPlayerInitials(match.team1?.player2?.full_name || '')}
                </AvatarFallback>
              </Avatar>
            </div>
            <div>
              <div className="font-medium text-sm">{match.team1?.name || 'Equipo 1'}</div>
              <div className="text-xs text-muted-foreground">
                {match.team1?.player1?.full_name || 'Jugador 1'} & {match.team1?.player2?.full_name || 'Jugador 2'}
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
              <div className="font-medium text-sm">{match.team2?.name || 'Equipo 2'}</div>
              <div className="text-xs text-muted-foreground">
                {match.team2?.player1?.full_name || 'Jugador 1'} & {match.team2?.player2?.full_name || 'Jugador 2'}
              </div>
            </div>
            <div className="flex -space-x-2">
              <Avatar className="h-8 w-8 border-2 border-white">
                <AvatarFallback className="text-xs bg-gradient-to-br from-orange-500 to-red-600 text-white">
                  {getPlayerInitials(match.team2?.player1?.full_name || '')}
                </AvatarFallback>
              </Avatar>
              <Avatar className="h-8 w-8 border-2 border-white">
                <AvatarFallback className="text-xs bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                  {getPlayerInitials(match.team2?.player2?.full_name || '')}
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
        <div className="space-y-2">
          {/* Botón para subir resultado */}
          {canSubmitResult() && (
            <Button 
              size="sm" 
              onClick={() => setShowResultForm(true)}
              className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
            >
              <Trophy className="h-4 w-4 mr-2" />
              Subir Resultado
            </Button>
          )}

          {/* Botones para aprobar/disputar resultado */}
          {canApproveResult() && (
            <div className="flex space-x-2">
              <Button 
                size="sm" 
                onClick={() => handleApprove(true)}
                disabled={approveResult.isPending}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Aprobar
              </Button>
              <Button 
                size="sm" 
                variant="destructive"
                onClick={() => handleApprove(false)}
                disabled={approveResult.isPending}
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Disputar
              </Button>
            </div>
          )}

          {/* Acciones para admins en partidos disputados */}
          {isAdmin && match.result_status === 'disputed' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center text-amber-800 text-sm">
                <AlertCircle className="h-4 w-4 mr-2" />
                Resultado disputado - Se requiere intervención de administrador
              </div>
            </div>
          )}

          {/* Botón legacy para apuntarse */}
          {match.status === 'pending' && onSignUp && !match.created_by_profile_id && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onSignUp(match.id)}
              className="w-full border-green-200 text-green-700 hover:bg-green-50"
            >
              <Users className="h-4 w-4 mr-2" />
              Apuntarse
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MatchCard;
