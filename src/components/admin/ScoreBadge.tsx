import { Badge } from "@/components/ui/badge";
import { type StudentScoreWithDetails, type ScoreCategory } from "@/hooks/useStudentScoring";

interface ScoreBadgeProps {
  score?: StudentScoreWithDetails | null;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export const getScoreCategoryColor = (category: ScoreCategory): string => {
  switch (category) {
    case 'excellent':
      return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200';
    case 'good':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200';
    case 'regular':
      return 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200';
    case 'problematic':
      return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const ScoreBadge = ({ score, onClick, size = 'md' }: ScoreBadgeProps) => {
  if (!score) {
    return <span className="text-xs text-muted-foreground">-</span>;
  }

  const colorClass = getScoreCategoryColor(score.score_category);

  const sizeClass = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-0.5',
    lg: 'text-base px-3 py-1',
  }[size];

  return (
    <Badge
      variant="outline"
      className={`${colorClass} ${sizeClass} font-semibold ${onClick ? 'cursor-pointer' : 'cursor-default'} transition-colors`}
      onClick={onClick}
    >
      {score.score}
    </Badge>
  );
};