import { useState } from "react";
import { Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExerciseMediaProps {
  src?: string | null;
  videoUrl?: string | null;
  imageUrl?: string | null;
  alt?: string;
  className?: string;
}

export const ExerciseMedia = ({ src, videoUrl, imageUrl, alt = "", className }: ExerciseMediaProps) => {
  const [failed, setFailed] = useState(false);
  
  // Prioridade: GIF (src) > Vídeo > Foto (imageUrl)
  const mediaSrc = src || videoUrl || imageUrl;
  const isVideo = !src && videoUrl;
  const showMedia = mediaSrc && !failed;

  return (
    <div className={cn("w-full h-full flex items-center justify-center bg-muted/30", className)}>
      {showMedia ? (
        isVideo ? (
          <video
            src={mediaSrc!}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
            onError={() => setFailed(true)}
          />
        ) : (
          <img
            src={mediaSrc!}
            alt={alt}
            loading="lazy"
            onError={() => setFailed(true)}
            className="w-full h-full object-cover"
          />
        )
      ) : (
        <div className="flex flex-col items-center justify-center gap-1 text-muted-foreground">
          <Dumbbell className="w-6 h-6 opacity-60" />
          <span className="text-[10px] opacity-60">Sem imagem</span>
        </div>
      )}
    </div>
  );
};

export default ExerciseMedia;
