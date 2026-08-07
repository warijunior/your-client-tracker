import { useState } from "react";
import { Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface ExerciseMediaProps {
  src?: string | null;
  videoUrl?: string | null;
  imageUrl?: string | null;
  alt?: string;
  className?: string;
}

export const ExerciseMedia = ({ src, videoUrl, imageUrl, alt = "", className }: ExerciseMediaProps) => {
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  
  // Prioridade: GIF (src) > Vídeo > Foto (imageUrl)
  const mediaSrc = src || videoUrl || imageUrl;
  const isVideo = !src && videoUrl;
  const showMedia = mediaSrc && !failed;

  const handleLoad = () => setLoading(false);
  const handleError = () => {
    setLoading(false);
    setFailed(true);
  };

  return (
    <div className={cn("relative w-full h-full flex items-center justify-center bg-muted/30 overflow-hidden", className)}>
      {loading && showMedia && (
        <Skeleton className="absolute inset-0 w-full h-full z-10" />
      )}
      
      {showMedia ? (
        isVideo ? (
          <video
            src={mediaSrc!}
            autoPlay
            loop
            muted
            playsInline
            onLoadedData={handleLoad}
            onError={handleError}
            className={cn("w-full h-full object-cover transition-opacity duration-300", loading ? "opacity-0" : "opacity-100")}
          />
        ) : (
          <img
            src={mediaSrc!}
            alt={alt}
            loading="lazy"
            onLoad={handleLoad}
            onError={handleError}
            className={cn("w-full h-full object-cover transition-opacity duration-300", loading ? "opacity-0" : "opacity-100")}
          />
        )
      ) : (
        <div className="flex flex-col items-center justify-center gap-1 text-muted-foreground p-4">
          <Dumbbell className="w-8 h-8 opacity-40 mb-1" />
          <span className="text-[10px] font-medium opacity-60 uppercase tracking-wider text-center">Imagem Indisponível</span>
        </div>
      )}
    </div>
  );
};

export default ExerciseMedia;
