import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Image as ImageIcon, Film, X, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MediaUploadProps {
  exerciseId: string;
  onSuccess: () => void;
  currentMedia?: {
    gif_url?: string | null;
    video_url?: string | null;
    image_url?: string | null;
  };
}

export const MediaUpload = ({ exerciseId, onSuccess, currentMedia }: MediaUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O limite é 10MB.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${exerciseId}-${Math.random()}.${fileExt}`;
      const filePath = `exercises/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('exercise-media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('exercise-media')
        .getPublicUrl(filePath);

      // Determine which column to update based on extension
      let column = 'image_url';
      if (['gif'].includes(fileExt?.toLowerCase() || '')) column = 'gif_url';
      else if (['mp4', 'webm', 'mov'].includes(fileExt?.toLowerCase() || '')) column = 'video_url';

      const { error: updateError } = await supabase
        .from('exercises')
        .update({ [column]: publicUrl })
        .eq('id', exerciseId);

      if (updateError) throw updateError;

      toast({ title: "Mídia atualizada com sucesso! ✨" });
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Erro no upload",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleUpload}
        accept="image/*,video/*"
        className="hidden"
      />
      
      <div className="grid grid-cols-2 gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="w-full border-dashed"
        >
          {uploading ? "Enviando..." : (
            <><Upload className="w-4 h-4 mr-2" /> Alterar Mídia</>
          )}
        </Button>
        
        <div className="flex items-center gap-2 px-3 py-1 bg-secondary rounded-md border border-border">
          {currentMedia?.gif_url && <span title="GIF disponível">🎞️</span>}
          {currentMedia?.video_url && <span title="Vídeo disponível">🎥</span>}
          {currentMedia?.image_url && <span title="Imagem disponível">🖼️</span>}
          {!currentMedia?.gif_url && !currentMedia?.video_url && !currentMedia?.image_url && (
            <span className="text-[10px] text-muted-foreground italic">Sem mídia customizada</span>
          )}
        </div>
      </div>
    </div>
  );
};
