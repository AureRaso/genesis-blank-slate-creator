
import PlayerForm from "@/components/PlayerForm";
import PlayersList from "@/components/PlayersList";
import TeamForm from "@/components/TeamForm";
import TeamsList from "@/components/TeamsList";

const PlayersPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
          Gestión de Jugadores
        </h1>
        <p className="text-muted-foreground">Administra jugadores y forma parejas</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <PlayerForm />
          <TeamForm />
        </div>
        <div className="space-y-6">
          <PlayersList />
          <TeamsList />
        </div>
      </div>
    </div>
  );
};

export default PlayersPage;
