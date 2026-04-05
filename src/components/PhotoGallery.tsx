import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Camera, X, ChevronLeft, ChevronRight } from "lucide-react";
import PhotoUpload from "./PhotoUpload";

interface Photo {
  id: string;
  photo_url: string;
  category: string;
  notes: string | null;
  taken_at: string;
}

interface Props {
  studentId: string;
  canUpload?: boolean;
}

const categoryLabels: Record<string, string> = {
  front: "Frente",
  back: "Costas",
  side: "Lateral",
  general: "Geral",
};

const PhotoGallery = ({ studentId, canUpload = true }: Props) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);

  useEffect(() => {
    fetchPhotos();
  }, [studentId]);

  const fetchPhotos = async () => {
    const { data } = await supabase
      .from("progress_photos")
      .select("*")
      .eq("student_id", studentId)
      .order("taken_at", { ascending: false });
    if (data) setPhotos(data);
  };

  return (
    <div className="space-y-3">
      {canUpload && (
        <Button onClick={() => setShowUpload(true)} className="w-full gradient-primary text-primary-foreground" size="sm">
          <Camera className="w-4 h-4 mr-2" /> Adicionar foto
        </Button>
      )}

      {photos.length === 0 ? (
        <p className="text-center py-4 text-muted-foreground text-sm">Nenhuma foto de progresso.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((p, idx) => (
            <div key={p.id} className="relative cursor-pointer group" onClick={() => setSelectedPhoto(idx)}>
              <img src={p.photo_url} alt={categoryLabels[p.category]} className="aspect-square object-cover rounded-lg" />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/80 to-transparent p-1.5 rounded-b-lg">
                <p className="text-[10px] text-foreground">{new Date(p.taken_at).toLocaleDateString("pt-BR")}</p>
                <p className="text-[9px] text-muted-foreground">{categoryLabels[p.category]}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full screen viewer */}
      {selectedPhoto !== null && (
        <div className="fixed inset-0 z-50 bg-background/95 flex flex-col items-center justify-center">
          <Button variant="ghost" size="icon" className="absolute top-4 right-4" onClick={() => setSelectedPhoto(null)}>
            <X className="w-6 h-6" />
          </Button>
          <div className="flex items-center gap-4 w-full max-w-lg px-4">
            <Button variant="ghost" size="icon" onClick={() => setSelectedPhoto(Math.max(0, selectedPhoto - 1))} disabled={selectedPhoto === 0}>
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <div className="flex-1 text-center">
              <img src={photos[selectedPhoto].photo_url} alt="" className="max-h-[60vh] mx-auto rounded-lg object-contain" />
              <p className="text-sm text-foreground mt-3">{categoryLabels[photos[selectedPhoto].category]} — {new Date(photos[selectedPhoto].taken_at).toLocaleDateString("pt-BR")}</p>
              {photos[selectedPhoto].notes && <p className="text-xs text-muted-foreground mt-1">{photos[selectedPhoto].notes}</p>}
            </div>
            <Button variant="ghost" size="icon" onClick={() => setSelectedPhoto(Math.min(photos.length - 1, selectedPhoto + 1))} disabled={selectedPhoto === photos.length - 1}>
              <ChevronRight className="w-6 h-6" />
            </Button>
          </div>
        </div>
      )}

      {showUpload && (
        <PhotoUpload
          studentId={studentId}
          onClose={() => setShowUpload(false)}
          onSaved={() => { setShowUpload(false); fetchPhotos(); }}
        />
      )}
    </div>
  );
};

export default PhotoGallery;
