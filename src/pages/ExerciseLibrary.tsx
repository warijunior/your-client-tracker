import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Search, Dumbbell } from "lucide-react";

interface Exercise {
  id: string;
  name: string;
  muscle_group: string;
  secondary_muscles: string[];
  category: string;
  equipment: string | null;
  difficulty: string;
  is_unilateral: boolean;
  description: string | null;
  gif_url: string | null;
}

const ALL = "__all__";

const ExerciseLibrary = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [muscle, setMuscle] = useState(ALL);
  const [equipment, setEquipment] = useState(ALL);
  const [difficulty, setDifficulty] = useState(ALL);
  const [unilateral, setUnilateral] = useState(ALL);
  const [active, setActive] = useState<Exercise | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("exercises")
        .select("*")
        .order("muscle_group")
        .order("name");
      setItems((data as Exercise[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const muscles = useMemo(() => Array.from(new Set(items.map((i) => i.muscle_group))).sort(), [items]);
  const equipments = useMemo(
    () => Array.from(new Set(items.map((i) => i.equipment).filter(Boolean))) as string[],
    [items]
  );

  const filtered = items.filter((i) => {
    if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (muscle !== ALL && i.muscle_group !== muscle) return false;
    if (equipment !== ALL && i.equipment !== equipment) return false;
    if (difficulty !== ALL && i.difficulty !== difficulty) return false;
    if (unilateral !== ALL && String(i.is_unilateral) !== unilateral) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border p-4">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Dumbbell className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold text-foreground">Biblioteca de exercícios</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar exercício..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-secondary border-border"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Select value={muscle} onValueChange={setMuscle}>
            <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Grupo muscular" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos os grupos</SelectItem>
              {muscles.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={equipment} onValueChange={setEquipment}>
            <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Equipamento" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos equipamentos</SelectItem>
              {equipments.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Nível" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Qualquer nível</SelectItem>
              <SelectItem value="beginner">Iniciante</SelectItem>
              <SelectItem value="intermediate">Intermediário</SelectItem>
              <SelectItem value="advanced">Avançado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={unilateral} onValueChange={setUnilateral}>
            <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Unilateral?" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos</SelectItem>
              <SelectItem value="true">Unilaterais</SelectItem>
              <SelectItem value="false">Bilaterais</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <p className="text-xs text-muted-foreground">{filtered.length} exercício(s)</p>

        <div className="grid grid-cols-2 gap-3">
          {loading ? (
            <p className="col-span-2 text-center text-muted-foreground py-8">Carregando...</p>
          ) : filtered.length === 0 ? (
            <p className="col-span-2 text-center text-muted-foreground py-8">Nenhum exercício.</p>
          ) : (
            filtered.map((ex) => (
              <button
                key={ex.id}
                onClick={() => setActive(ex)}
                className="glass-card p-2 text-left space-y-2 hover:ring-1 hover:ring-primary/50 transition"
              >
                <div className="aspect-square w-full overflow-hidden rounded-md bg-secondary">
                  {ex.gif_url ? (
                    <img src={ex.gif_url} alt={ex.name} loading="lazy" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Dumbbell className="w-8 h-8 text-muted-foreground" /></div>
                  )}
                </div>
                <p className="text-xs font-semibold text-foreground line-clamp-2">{ex.name}</p>
                <p className="text-[10px] text-muted-foreground">{ex.muscle_group}</p>
              </button>
            ))
          )}
        </div>
      </div>

      {active && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-y-auto" onClick={() => setActive(null)}>
          <div className="max-w-lg mx-auto p-4" onClick={(e) => e.stopPropagation()}>
            <div className="glass-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">{active.name}</h2>
                <Button variant="ghost" size="sm" onClick={() => setActive(null)}>Fechar</Button>
              </div>
              {active.gif_url && (
                <img src={active.gif_url} alt={active.name} className="w-full rounded-lg" />
              )}
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-1 rounded-full bg-primary/10 text-primary">{active.muscle_group}</span>
                {active.equipment && <span className="px-2 py-1 rounded-full bg-secondary text-foreground">{active.equipment}</span>}
                <span className="px-2 py-1 rounded-full bg-secondary text-muted-foreground">{active.difficulty}</span>
                {active.is_unilateral && <span className="px-2 py-1 rounded-full bg-secondary text-muted-foreground">Unilateral</span>}
              </div>
              {active.secondary_muscles?.length > 0 && (
                <p className="text-xs text-muted-foreground"><b>Secundários:</b> {active.secondary_muscles.join(", ")}</p>
              )}
              {active.description && (
                <p className="text-sm text-foreground/90 whitespace-pre-wrap">{active.description}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExerciseLibrary;
