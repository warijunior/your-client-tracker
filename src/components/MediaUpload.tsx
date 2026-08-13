import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Image as ImageIcon, Film, X, Check, Maximize2, Trash2, Plus } from "lucide-react";
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
      const fileName = `${exerciseId}-${Date.now()}.${fileExt}`;
      const filePath = `exercises/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('exercise-media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('exercise-media')
        .getPublicUrl(filePath);

      // Cache busting
      const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`;

      // Determine which column to update based on extension
      let column = 'image_url';
      if (['gif'].includes(fileExt?.toLowerCase() || '')) column = 'gif_url';
      else if (['mp4', 'webm', 'mov'].includes(fileExt?.toLowerCase() || '')) column = 'video_url';

      const { error: updateError } = await supabase
        .from('exercises')
        .update({ [column]: cacheBustedUrl })
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

  const removeMedia = async (type: 'gif_url' | 'video_url' | 'image_url') => {
    if (!confirm("Deseja remover esta mídia?")) return;
    
    setUploading(true);
    try {
      const { error } = await supabase
        .from('exercises')
        .update({ [type]: null })
        .eq('id', exerciseId);

      if (error) throw error;
      toast({ title: "Mídia removida com sucesso." });
      onSuccess();
    } catch (error: any) {
      toast({ title: "Erro ao remover", description: error.message, variant: "destructive" });
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
      
      <div className="flex flex-col gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="w-full border-primary/30 hover:bg-primary/5 text-primary"
        >
          {uploading ? "Enviando..." : (
            <><Plus className="w-4 h-4 mr-2" /> Adicionar / Alterar Mídia</>
          )}
        </Button>
        
        <div className="flex flex-wrap gap-2">
          {currentMedia?.gif_url && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/50 rounded-full border border-border group">
              <span className="text-xs">GIF</span>
              <button onClick={() => removeMedia('gif_url')} className="opacity-0 group-hover:opacity-100 text-destructive transition-opacity">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}
          {currentMedia?.video_url && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/50 rounded-full border border-border group">
              <span className="text-xs">Vídeo</span>
              <button onClick={() => removeMedia('video_url')} className="opacity-0 group-hover:opacity-100 text-destructive transition-opacity">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}
          {currentMedia?.image_url && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/50 rounded-full border border-border group">
              <span className="text-xs">Foto</span>
              <button onClick={() => removeMedia('image_url')} className="opacity-0 group-hover:opacity-100 text-destructive transition-opacity">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}
          {!currentMedia?.gif_url && !currentMedia?.video_url && !currentMedia?.image_url && (
            <span className="text-[10px] text-muted-foreground italic px-2">Nenhuma mídia vinculada</span>
          )}
        </div>
      </div>
    </div>
  );
};
