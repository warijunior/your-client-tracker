import { useState } from "react";
import { Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExerciseMediaProps {
  src?: string | null;
  alt?: string;
  className?: string;
}

export const ExerciseMedia = ({ src, alt = "", className }: ExerciseMediaProps) => {
  const [failed, setFailed] = useState(false);
  const showImage = src && !failed;

  return (
    <div className={cn("w-full h-full flex items-center justify-center bg-muted/30", className)}>
      {showImage ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          className="w-full h-full object-cover"
        />
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
