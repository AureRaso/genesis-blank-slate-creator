import TrainerNotifications from "@/components/TrainerNotifications";

const WaitlistNotifications = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark bg-clip-text text-transparent">
          Lista de Espera
        </h1>
        <p className="text-muted-foreground">
          Gestiona las notificaciones de estudiantes en lista de espera
        </p>
      </div>
      
      <TrainerNotifications />
    </div>
  );
};

export default WaitlistNotifications;