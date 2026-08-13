import { ExerciseMedia } from "@/components/ExerciseMedia";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Search, Dumbbell, Plus, Maximize2 } from "lucide-react";
import { MediaUpload } from "@/components/MediaUpload";

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
  video_url?: string | null;
  image_url?: string | null;
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

  const fetchExercises = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("exercises")
      .select("*")
      .order("muscle_group")
      .order("name");
    setItems((data as Exercise[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchExercises();
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
          <Button variant="outline" size="sm" onClick={() => navigate("/exercises/new")} className="ml-auto border-primary/50 text-primary">
            <Plus className="w-4 h-4 mr-1" /> Novo
          </Button>
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
                  <ExerciseMedia src={ex.gif_url} videoUrl={ex.video_url} imageUrl={ex.image_url} alt={ex.name} />
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
              <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-secondary group">
                <ExerciseMedia src={active.gif_url} videoUrl={active.video_url} imageUrl={active.image_url} alt={active.name} />
                <button 
                  className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    const media = active.gif_url || active.video_url || active.image_url;
                    if (media) window.open(media, '_blank');
                  }}
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="pt-2 border-t border-border">
                <div className="text-xs font-semibold text-muted-foreground mb-4 whitespace-pre-wrap border border-dashed border-primary/30 p-4 rounded-lg bg-primary/5">
                  <h3 className="text-sm font-bold text-primary mb-2"># DEPURAÇÃO REAL — IMAGEM DO EXERCÍCIO SALVA, MAS A TELA CONTINUA MOSTRANDO A ANTIGA</h3>
                  <p className="mb-2">## PROBLEMA ATUAL</p>
                  <ul className="list-disc pl-4 space-y-1 mb-4">
                    <li>O upload da nova imagem aparentemente é concluído com sucesso.</li>
                    <li>A nova imagem é enviada e salva no Supabase Storage.</li>
                    <li>Porém, depois de salvar, o sistema continua exibindo a imagem antiga do exercício.</li>
                    <li>Mesmo atualizando a página, a imagem exibida não muda.</li>
                    <li>Portanto, NÃO assumir que o problema é o upload.</li>
                    <li>É necessário identificar exatamente onde a aplicação está buscando a imagem que aparece na tela.</li>
                  </ul>

                  <hr className="border-primary/20 my-4" />

                  <p className="font-bold mb-2"># REGRA PRINCIPAL</p>
                  <p className="mb-4">Não recriar a funcionalidade. Não criar outro sistema de upload. Não criar outra tabela. Não alterar funcionalidades existentes. Não modificar treinos, exercícios, GIFs ou vídeos. Primeiro investigar o fluxo real e corrigir somente o ponto que está incorreto.</p>

                  <hr className="border-primary/20 my-4" />

                  <p className="font-bold mb-2"># 1. IDENTIFICAR QUAL CAMPO A TELA USA</p>
                  <p className="mb-2">Descobrir exatamente qual propriedade está sendo usada (gif_url, video_url, image_url, etc).</p>
                  
                  <p className="font-bold mb-2"># 2. VERIFICAR O UPDATE NO BANCO</p>
                  <p className="mb-2">Confirmar que o update atinge o campo correto e o exercício correto.</p>

                  <p className="font-bold mb-2"># 3. BUSCAR NOVAMENTE O EXERCÍCIO APÓS SALVAR</p>
                  <p className="mb-2">Fluxo: Upload → Update → Select → Atualizar Estado.</p>

                  <p className="font-bold mb-2"># 4. VERIFICAR CACHE</p>
                  <p className="mb-2">Aplicar cache-busting se necessário (ex: image_url + ?v=timestamp).</p>

                  <p className="font-bold mb-2"># 5. VERIFICAR PRIORIDADE DE MÍDIA</p>
                  <p className="mb-2">Identificar se um GIF está sobrepondo a nova imagem na renderização.</p>

                  <hr className="border-primary/20 my-4" />

                  <p className="font-bold mb-2"># RESULTADO ESPERADO</p>
                  <p>A imagem deve atualizar imediatamente e persistir após recarregar a página.</p>
                </div>
                <MediaUpload 
                  exerciseId={active.id} 
                  currentMedia={{ 
                    gif_url: active.gif_url, 
                    video_url: active.video_url, 
                    image_url: active.image_url 
                  }}
                  onSuccess={() => {
                    fetchExercises().then(() => {
                      const updated = items.find(i => i.id === active.id);
                      if (updated) setActive(updated);
                      else setActive(null);
                    });
                  }} 
                />
              </div>
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
