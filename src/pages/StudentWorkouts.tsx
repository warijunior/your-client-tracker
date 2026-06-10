import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Dumbbell, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Workout {
  id: string;
  title: string;
  notes: string | null;
  active: boolean;
  created_at: string;
}

const StudentWorkouts = () => {
  const { id: studentId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [studentName, setStudentName] = useState("");
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  useEffect(() => {
    if (!studentId) return;
    (async () => {
      const [{ data: s }, { data: w }] = await Promise.all([
        supabase.from("students").select("full_name").eq("id", studentId).single(),
        supabase.from("workouts").select("*").eq("student_id", studentId).order("created_at", { ascending: false }),
      ]);
      if (s) setStudentName(s.full_name);
      setWorkouts((w as Workout[]) ?? []);
      setLoading(false);
    })();
  }, [studentId]);

  const createWorkout = async () => {
    if (!newTitle.trim() || !studentId || !user) return;
    const { data, error } = await supabase
      .from("workouts")
      .insert({ student_id: studentId, trainer_id: user.id, title: newTitle.trim() })
      .select()
      .single();
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    setNewTitle("");
    setCreating(false);
    navigate(`/workouts/${data.id}`);
  };

  const deleteWorkout = async (id: string) => {
    if (!confirm("Excluir este treino?")) return;
    const { error } = await supabase.from("workouts").delete().eq("id", id);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    setWorkouts((prev) => prev.filter((w) => w.id !== id));
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border p-4">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/students/${studentId}`)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Dumbbell className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold text-foreground truncate">Treinos · {studentName}</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {creating ? (
          <div className="glass-card p-4 space-y-3">
            <Label className="text-sm text-muted-foreground">Nome do treino</Label>
            <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Ex: Treino A - Peito/Tríceps" className="bg-secondary border-border" />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setCreating(false)}>Cancelar</Button>
              <Button className="flex-1 gradient-primary text-primary-foreground" onClick={createWorkout}>Criar</Button>
            </div>
          </div>
        ) : (
          <Button onClick={() => setCreating(true)} className="w-full gradient-primary text-primary-foreground">
            <Plus className="w-4 h-4 mr-2" /> Novo treino
          </Button>
        )}

        {loading ? (
          <p className="text-center text-muted-foreground py-8">Carregando...</p>
        ) : workouts.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nenhum treino criado.</p>
        ) : (
          workouts.map((w) => (
            <div key={w.id} className="glass-card p-4 flex items-center justify-between">
              <button className="text-left flex-1" onClick={() => navigate(`/workouts/${w.id}`)}>
                <p className="font-semibold text-foreground">{w.title}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(w.created_at).toLocaleDateString("pt-BR")} {w.active ? "" : "· inativo"}
                </p>
              </button>
              <Button variant="ghost" size="icon" onClick={() => deleteWorkout(w.id)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StudentWorkouts;
