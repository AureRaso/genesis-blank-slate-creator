import { useState } from "react";
import { Play, Maximize2, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VideoPlayerProps {
  videoUrl: string;
  thumbnailUrl?: string | null;
  className?: string;
  autoPlay?: boolean;
}

const VideoPlayer = ({
  videoUrl,
  thumbnailUrl,
  className = "",
  autoPlay = false,
}: VideoPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handlePlayClick = () => {
    setIsPlaying(true);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    const video = document.getElementById("ejercicio-video") as HTMLVideoElement;
    if (video) {
      if (!document.fullscreenElement) {
        video.requestFullscreen();
        setIsFullscreen(true);
      } else {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  if (!isPlaying && thumbnailUrl) {
    return (
      <div
        className={`relative cursor-pointer group ${className}`}
        onClick={handlePlayClick}
      >
        <img
          src={thumbnailUrl}
          alt="Video thumbnail"
          className="w-full h-full object-cover rounded-lg"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors rounded-lg">
          <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Play className="h-8 w-8 text-primary ml-1" fill="currentColor" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
      <video
        id="ejercicio-video"
        src={videoUrl}
        autoPlay={isPlaying}
        muted={isMuted}
        loop
        playsInline
        controls
        className="w-full h-full object-contain"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Custom overlay controls (optional) */}
      <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 bg-black/50 hover:bg-black/70 text-white"
          onClick={toggleMute}
        >
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 bg-black/50 hover:bg-black/70 text-white"
          onClick={toggleFullscreen}
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default VideoPlayer;
