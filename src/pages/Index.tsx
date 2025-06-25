
import { useState } from "react";
import { Plus, Users, Trophy, Calendar, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Sidebar from "@/components/Sidebar";

const Index = () => {
  const [currentView, setCurrentView] = useState<"dashboard" | "players" | "leagues" | "matches" | "standings">("dashboard");

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Dashboard de Pádel
          </h1>
          <p className="text-muted-foreground">Gestiona tu liga de pádel de manera eficiente</p>
        </div>
        <Button 
          onClick={() => setCurrentView("leagues")}
          className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nueva Liga
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jugadores Activos</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">0</div>
            <p className="text-xs text-muted-foreground">
              +0 desde el mes pasado
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ligas Activas</CardTitle>
            <Trophy className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">0</div>
            <p className="text-xs text-muted-foreground">
              Ninguna liga en curso
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Partidos Programados</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">0</div>
            <p className="text-xs text-muted-foreground">
              Esta semana
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Partidos Completados</CardTitle>
            <BarChart3 className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">0</div>
            <p className="text-xs text-muted-foreground">
              Total temporada
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Bienvenido a PadelApp</CardTitle>
          <CardDescription>Sistema de gestión de ligas de pádel</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 space-y-4">
            <Trophy className="h-16 w-16 text-green-600 mx-auto" />
            <h3 className="text-xl font-semibold">¡Comienza tu primera liga!</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Crea jugadores, forma parejas y organiza ligas completas con sistema Round Robin automático.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
              <Button 
                onClick={() => setCurrentView("players")}
                variant="outline"
                className="border-green-200 text-green-700 hover:bg-green-50"
              >
                <Users className="mr-2 h-4 w-4" />
                Gestionar Jugadores
              </Button>
              <Button 
                onClick={() => setCurrentView("leagues")}
                className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
              >
                <Trophy className="mr-2 h-4 w-4" />
                Crear Liga
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPlaceholder = (title: string, description: string) => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      
      <Card className="border-0 shadow-lg">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Próximamente disponible</h3>
            <p className="text-muted-foreground">
              Esta funcionalidad se implementará en las siguientes fases del desarrollo.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50">
      <div className="flex w-full">
        <Sidebar currentView={currentView} onViewChange={setCurrentView} />
        <main className="flex-1 p-6 overflow-hidden">
          {currentView === "dashboard" && renderDashboard()}
          {currentView === "players" && renderPlaceholder("Gestión de Jugadores", "Administra jugadores y forma parejas")}
          {currentView === "leagues" && renderPlaceholder("Gestión de Ligas", "Crea y administra ligas de pádel")}
          {currentView === "matches" && renderPlaceholder("Gestión de Partidos", "Programa partidos y registra resultados")}
          {currentView === "standings" && renderPlaceholder("Clasificaciones", "Consulta las tablas de posiciones")}
        </main>
      </div>
    </div>
  );
};

export default Index;
