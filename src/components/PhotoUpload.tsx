import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { X, Upload } from "lucide-react";

interface Props {
  studentId: string;
  onClose: () => void;
  onSaved: () => void;
}

const PhotoUpload = ({ studentId, onClose, onSaved }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [category, setCategory] = useState("front");
  const [notes, setNotes] = useState("");
  const [takenAt, setTakenAt] = useState(new Date().toISOString().split("T")[0]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(f);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !user) return;
    setLoading(true);

    const ext = file.name.split(".").pop();
    const path = `${user.id}/${studentId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("progress-photos")
      .upload(path, file);

    if (uploadError) {
      toast({ title: "Erro no upload", description: uploadError.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("progress-photos").getPublicUrl(path);

    const { error } = await supabase.from("progress_photos").insert({
      student_id: studentId,
      uploaded_by: user.id,
      photo_url: urlData.publicUrl,
      category,
      notes: notes || null,
      taken_at: takenAt,
    });

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Foto salva! 📸" });
      onSaved();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center">
      <div className="w-full max-w-lg bg-card border border-border rounded-t-2xl sm:rounded-2xl p-6 space-y-4 animate-in slide-in-from-bottom">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Adicionar Foto</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File input */}
          <div className="space-y-2">
            {preview ? (
              <div className="relative">
                <img src={preview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 bg-background/50" onClick={() => { setFile(null); setPreview(null); }}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer bg-secondary">
                <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">Clique para selecionar foto</span>
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
              </label>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="front">Frente</SelectItem>
                  <SelectItem value="back">Costas</SelectItem>
                  <SelectItem value="side">Lateral</SelectItem>
                  <SelectItem value="general">Geral</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Data</Label>
              <Input type="date" value={takenAt} onChange={(e) => setTakenAt(e.target.value)} className="bg-secondary border-border" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">Notas</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observações sobre a foto..." className="bg-secondary border-border min-h-[60px]" />
          </div>

          <Button type="submit" disabled={loading || !file} className="w-full gradient-primary text-primary-foreground font-semibold h-12">
            {loading ? "Enviando..." : "Salvar foto"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default PhotoUpload;
