import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Play, X } from "lucide-react";
const VideoDemoSection = () => {
  const [isOpen, setIsOpen] = useState(false);
  return <section className="w-full py-20 bg-gradient-to-br from-background via-accent/5 to-background">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">Descubre cómo PadeLock transforma la gestión de tu academia de pádel con nuestra demostración interactiva</h2>
          
          
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="group relative overflow-hidden bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground px-8 py-4 h-auto">
                <Play className="mr-3 h-6 w-6 group-hover:scale-110 transition-transform" />
                <span className="text-lg font-semibold">Ver Demo en Vivo</span>
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
              </Button>
            </DialogTrigger>
            
            <DialogContent className="max-w-4xl w-full p-0 bg-background">
              <div className="relative">
                <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 z-10 p-2 bg-background/80 backdrop-blur-sm rounded-full hover:bg-background transition-colors">
                  <X className="h-4 w-4" />
                </button>
                
                <div className="aspect-video w-full bg-muted rounded-lg flex items-center justify-center">
                  {/* Placeholder para el video - puedes reemplazar con tu URL de video */}
                  <iframe className="w-full h-full rounded-lg" src="https://www.youtube.com/embed/bCmQ-2syyoE?autoplay=1" title="PadelManager Demo" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                  
                  {/* Descomenta y personaliza según tu video:
                                     
                   Para archivo local:
                   <video
                    className="w-full h-full rounded-lg"
                    controls
                    autoPlay
                    poster="/path-to-thumbnail.jpg"
                   >
                    <source src="/path-to-video.mp4" type="video/mp4" />
                    Tu navegador no soporta video HTML5.
                   </video>
                   */}
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-primary font-bold">5</span>
              </div>
              <p className="text-sm text-muted-foreground">Minutos de demo</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-primary font-bold">✓</span>
              </div>
              <p className="text-sm text-muted-foreground">Funcionalidades clave</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-primary font-bold">🎯</span>
              </div>
              <p className="text-sm text-muted-foreground">Casos de uso reales</p>
            </div>
          </div>
        </div>
      </div>
    </section>;
};
export default VideoDemoSection;