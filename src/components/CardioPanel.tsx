import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Timer, History, Plus, Minus, Loader2 } from "lucide-react";

interface CardioPanelProps {
  studentId: string;
  userId: string;
  mode?: "student" | "trainer";
}

const CardioPanel = ({ studentId, userId, mode = "student" }: CardioPanelProps) => {
  const [duration, setDuration] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTodayCardio();
  }, [studentId]);

  const fetchTodayCardio = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("cardio_logs")
        .select("duration_minutes")
        .eq("student_id", studentId)
        .eq("logged_at", today)
        .maybeSingle();

      if (error) throw error;
      if (data) setDuration(data.duration_minutes);
      else setDuration(0);
    } catch (error: any) {
      console.error("Error fetching cardio:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCardio = async (newDuration: number) => {
    if (newDuration < 0) return;
    setDuration(newDuration);
    
    setSaving(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const { error } = await supabase
        .from("cardio_logs")
        .upsert({
          student_id: studentId,
          user_id: userId,
          duration_minutes: newDuration,
          logged_at: today,
        }, {
          onConflict: 'student_id,logged_at'
        });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Erro ao salvar cardio",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-card p-6 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="glass-card p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary/10">
            <Timer className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Cardio Diário</h3>
            <p className="text-xs text-muted-foreground">Tempo total de atividade hoje</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-primary">{duration} <span className="text-sm font-normal text-muted-foreground">min</span></p>
        </div>
      </div>

      {mode === "student" && (
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full border-primary/20"
              onClick={() => handleUpdateCardio(Math.max(0, duration - 5))}
              disabled={saving}
            >
              <Minus className="w-6 h-6" />
            </Button>
            
            <div className="w-24 text-center">
              <span className="text-3xl font-bold">{duration}</span>
            </div>

            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full border-primary/20"
              onClick={() => handleUpdateCardio(duration + 5)}
              disabled={saving}
            >
              <Plus className="w-6 h-6" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[15, 30, 45, 60].map((mins) => (
              <Button
                key={mins}
                variant="secondary"
                size="sm"
                className="text-xs"
                onClick={() => handleUpdateCardio(mins)}
                disabled={saving}
              >
                {mins} min
              </Button>
            ))}
            <Button
              variant="secondary"
              size="sm"
              className="text-xs col-span-2"
              onClick={() => handleUpdateCardio(0)}
              disabled={saving}
            >
              Zerar
            </Button>
          </div>
        </div>
      )}

      {mode === "trainer" && (
        <div className="p-3 rounded-lg bg-secondary/50 border border-border">
          <p className="text-xs text-center text-muted-foreground">
            {duration > 0 
              ? `O aluno registrou ${duration} minutos de cardio hoje.` 
              : "O aluno ainda não registrou cardio hoje."}
          </p>
        </div>
      )}
    </div>
  );
};

export default CardioPanel;
