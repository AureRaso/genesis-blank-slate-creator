
import { MapPin, Calendar, Users, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useClubsWithActiveClasses, ClubWithStats } from "@/hooks/useClubsWithActiveClasses";

interface ClubSelectionProps {
  onClubSelect: (clubId: string) => void;
}

const ClubSelection = ({ onClubSelect }: ClubSelectionProps) => {
  const { data: clubs, isLoading } = useClubsWithActiveClasses();

  const formatCourtTypes = (courtTypes: string[]) => {
    const typeMap: { [key: string]: string } = {
      'indoor': 'Interior',
      'outdoor': 'Exterior',
      'panorámicas': 'Panorámicas',
      'muro': 'Muro',
      'cristal': 'Cristal'
    };
    
    return courtTypes.map(type => typeMap[type] || type).join(', ');
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-2">
              <div className="h-4 bg-playtomic-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-playtomic-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="h-3 bg-playtomic-gray-200 rounded"></div>
              <div className="h-3 bg-playtomic-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!clubs?.length) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Calendar className="h-12 w-12 text-playtomic-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-playtomic-gray-900 mb-2">
            No hay clubes con clases disponibles
          </h3>
          <p className="text-playtomic-gray-600 text-center">
            En este momento no hay clubes con clases activas y plazas disponibles.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-playtomic-orange flex items-center justify-center space-x-2">
          <span>🎾</span>
          <span>Elige tu club para empezar a reservar clases</span>
        </h2>
        <p className="text-playtomic-gray-600">
          Selecciona un club para ver sus clases disponibles
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clubs.map((club) => (
          <Card key={club.id} className="hover:shadow-lg transition-shadow border-playtomic-orange/20">
            <CardHeader>
              <CardTitle className="text-lg text-playtomic-gray-900">
                {club.name}
              </CardTitle>
              <CardDescription className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>{club.address}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-playtomic-gray-700">
                    Pistas: {club.court_count}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {formatCourtTypes(club.court_types)}
                  </Badge>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4 text-playtomic-orange" />
                    <span className="text-sm font-medium text-playtomic-orange">
                      {club.active_classes_count} clases activas
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4 text-playtomic-green" />
                    <span className="text-sm font-medium text-playtomic-green">
                      {club.available_spots} plazas libres
                    </span>
                  </div>
                </div>

                {club.description && (
                  <p className="text-sm text-playtomic-gray-600 line-clamp-2">
                    {club.description}
                  </p>
                )}
              </div>

              <Button 
                onClick={() => onClubSelect(club.id)}
                className="w-full bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark hover:from-playtomic-orange-dark hover:to-playtomic-orange"
              >
                Ver clases disponibles
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ClubSelection;
