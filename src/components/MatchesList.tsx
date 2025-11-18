// Stub component - Matches feature is currently disabled
// This exists only to prevent build errors in league components

interface MatchesListProps {
  leagueId?: string;
  showPlayerMatches?: boolean;
}

const MatchesList = ({ leagueId, showPlayerMatches }: MatchesListProps) => {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <p>La funcionalidad de partidos no está disponible actualmente.</p>
    </div>
  );
};

export default MatchesList;
