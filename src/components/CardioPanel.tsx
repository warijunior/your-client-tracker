import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Timer, History, Plus, Minus, Loader2, Target, Footprints, Info } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface CardioPanelProps {
  studentId: string;
  userId: string;
  mode?: "student" | "trainer";
}

interface CardioLog {
  id: string;
  duration_minutes: number;
  prescribed_minutes: number;
  logged_at: string;
}

const CardioPanel = ({ studentId, userId, mode = "student" }: CardioPanelProps) => {
  const [duration, setDuration] = useState<number>(0);
  const [prescribed, setPrescribed] = useState<number>(0);
  const [history, setHistory] = useState<CardioLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCardioData();
  }, [studentId]);

  const fetchCardioData = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      
      // Fetch student's prescribed cardio (the current global meta)
      const { data: studentData, error: studentError } = await supabase
        .from("students")
        .select("prescribed_cardio_minutes")
        .eq("id", studentId)
        .single();
      
      if (studentError) throw studentError;
      const currentPrescribed = studentData?.prescribed_cardio_minutes || 0;
      setPrescribed(currentPrescribed);

      // Fetch today's log and history
      const { data: logsData, error: logsError } = await supabase
        .from("cardio_logs")
        .select("id, duration_minutes, prescribed_minutes, logged_at")
        .eq("student_id", studentId)
        .order("logged_at", { ascending: false })
        .limit(7);

      if (logsError) throw logsError;
      
      const logs = logsData || [];
      setHistory(logs);
      
      const todayLog = logs.find(log => log.logged_at === today);
      if (todayLog) {
        setDuration(todayLog.duration_minutes);
      } else {
        setDuration(0);
      }
    } catch (error: any) {
      console.error("Error fetching cardio:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePrescribed = async (newPrescribed: number) => {
    if (newPrescribed < 0) return;
    setPrescribed(newPrescribed);
    setSaving(true);
    try {
      const { error } = await supabase
        .from("students")
        .update({ prescribed_cardio_minutes: newPrescribed })
        .eq("id", studentId);

      if (error) throw error;
      
      toast({
        title: "Meta atualizada",
        description: `Nova meta de cardio: ${newPrescribed} min`,
      });
      
      // Also update today's log if it exists to reflect the new meta immediately
      const today = new Date().toISOString().split("T")[0];
      const todayLog = history.find(l => l.logged_at === today);
      if (todayLog) {
        await supabase
          .from("cardio_logs")
          .update({ prescribed_minutes: newPrescribed })
          .eq("id", todayLog.id);
        fetchCardioData();
      }
    } catch (error: any) {
      toast({
        title: "Erro ao salvar meta",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
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
          prescribed_minutes: prescribed,
          logged_at: today,
        }, {
          onConflict: 'student_id,logged_at'
        });

      if (error) throw error;
      fetchCardioData();
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

  const getStatus = (realized: number, goal: number) => {
    if (goal === 0) return { label: "Sem meta", color: "text-muted-foreground", bg: "bg-muted/20" };
    if (realized === 0) return { label: "Pendente", color: "text-orange-400", bg: "bg-orange-400/10" };
    if (realized < goal) return { label: "Parcial", color: "text-yellow-400", bg: "bg-yellow-400/10" };
    if (realized === goal) return { label: "Concluído", color: "text-green-400", bg: "bg-green-400/10" };
    return { label: "Acima da meta", color: "text-blue-400", bg: "bg-blue-400/10" };
  };

  const progress = prescribed > 0 ? Math.round((duration / prescribed) * 100) : 0;
  const status = getStatus(duration, prescribed);

  return (
    <div className="space-y-6">
      {/* Resumo de Hoje */}
      <div className="glass-card p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Timer className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">Acompanhamento de Cardio</h3>
              <p className="text-xs text-muted-foreground">Progresso diário em relação à meta</p>
            </div>
          </div>
          <div className={cn("px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-current", status.color, status.bg)}>
            {status.label}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-secondary/30 border border-border flex flex-col items-center text-center">
            <Target className="w-4 h-4 text-primary mb-2" />
            <span className="text-[10px] uppercase text-muted-foreground font-bold">🎯 Meta</span>
            <span className="text-xl font-black text-foreground">{prescribed} <span className="text-[10px] font-normal">min</span></span>
          </div>
          <div className="p-4 rounded-xl bg-secondary/30 border border-border flex flex-col items-center text-center">
            <Footprints className="w-4 h-4 text-cyan-400 mb-2" />
            <span className="text-[10px] uppercase text-muted-foreground font-bold">🏃 Realizado</span>
            <span className="text-xl font-black text-cyan-400">{duration} <span className="text-[10px] font-normal text-muted-foreground">min</span></span>
          </div>
        </div>

        {prescribed > 0 ? (
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-muted-foreground">Progresso do objetivo</span>
              <span className="text-primary">{progress}% concluído</span>
            </div>
            <Progress value={Math.min(progress, 100)} className="h-2 bg-secondary" />
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-xs">
            <Info className="w-4 h-4 flex-shrink-0" />
            <p>Tempo de cardio ainda não definido pelo treinador.</p>
          </div>
        )}

        {/* Interface de Ação do Estudante */}
        {mode === "student" && (
          <div className="space-y-4 pt-2 border-t border-border/50">
            <h4 className="text-[10px] uppercase text-muted-foreground font-bold text-center">Registrar Cardio Realizado</h4>
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full border-primary/20 hover:bg-primary/10 transition-all duration-200 active:scale-90"
                onClick={() => handleUpdateCardio(Math.max(0, duration - 5))}
                disabled={saving}
              >
                <Minus className="w-5 h-5" />
              </Button>
              
              <div className="w-16 text-center">
                <span className="text-2xl font-black">{duration}</span>
              </div>

              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full border-primary/20 hover:bg-primary/10 transition-all duration-200 active:scale-90"
                onClick={() => handleUpdateCardio(duration + 5)}
                disabled={saving}
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[15, 30, 45, 60].map((mins) => (
                <Button
                  key={mins}
                  variant="secondary"
                  size="sm"
                  className="text-xs h-9 rounded-lg hover:bg-secondary/80 transition-all"
                  onClick={() => handleUpdateCardio(mins)}
                  disabled={saving}
                >
                  {mins} min
                </Button>
              ))}
              <Button
                variant="secondary"
                size="sm"
                className="text-xs col-span-2 h-9 rounded-lg text-red-400 hover:text-red-300 transition-all"
                onClick={() => handleUpdateCardio(0)}
                disabled={saving}
              >
                Zerar Registro
              </Button>
            </div>
          </div>
        )}

        {/* Interface de Ação do Treinador */}
        {mode === "trainer" && (
          <div className="space-y-4 pt-4 border-t border-border/50">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase text-muted-foreground font-bold">Definir Tempo Prescrito (Meta)</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={prescribed}
                  onChange={(e) => setPrescribed(Number(e.target.value))}
                  className="bg-secondary/50 border-primary/20 focus:border-primary/50 text-foreground font-bold"
                  placeholder="Ex: 30"
                />
                <Button 
                  onClick={() => handleUpdatePrescribed(prescribed)}
                  disabled={saving}
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-1">
                {[20, 30, 40, 60].map(mins => (
                  <button
                    key={mins}
                    onClick={() => handleUpdatePrescribed(mins)}
                    className="px-2 py-1 text-[10px] rounded bg-secondary hover:bg-primary/20 transition-colors"
                  >
                    {mins} min
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Histórico Recente */}
      {history.length > 0 && (
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-2 text-foreground font-bold">
            <History className="w-5 h-5 text-primary" />
            <h3>Histórico Recente</h3>
          </div>
          <div className="space-y-3">
            {history.map((log) => {
              const logStatus = getStatus(log.duration_minutes, log.prescribed_minutes);
              const logProgress = log.prescribed_minutes > 0 ? Math.round((log.duration_minutes / log.prescribed_minutes) * 100) : 0;
              
              return (
                <div key={log.id} className="p-3 rounded-xl bg-secondary/20 border border-border/50 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-muted-foreground">
                      {new Date(log.logged_at + 'T12:00:00').toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                    </span>
                    <span className={cn("text-[9px] px-2 py-0.5 rounded-full font-bold uppercase border border-current", logStatus.color, logStatus.bg)}>
                      {logStatus.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col">
                      <span className="text-[8px] uppercase text-muted-foreground font-bold">Meta</span>
                      <span className="text-xs font-bold">{log.prescribed_minutes} min</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] uppercase text-muted-foreground font-bold">Feito</span>
                      <span className="text-xs font-bold text-primary">{log.duration_minutes} min</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] uppercase text-muted-foreground font-bold">Cumprimento</span>
                      <span className="text-xs font-bold text-cyan-400">{logProgress}%</span>
                    </div>
                  </div>
                  {log.prescribed_minutes > 0 && (
                    <Progress value={Math.min(logProgress, 100)} className="h-1 bg-secondary" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CardioPanel;
