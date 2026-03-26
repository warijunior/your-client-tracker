import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, User, Activity, FileText, Plus } from "lucide-react";
import AssessmentForm from "@/components/AssessmentForm";
import ProtocolForm from "@/components/ProtocolForm";
import WeightChart from "@/components/WeightChart";

interface Student {
  id: string;
  full_name: string;
  age: number | null;
  weight: number | null;
  height: number | null;
  goal: string | null;
  health_history: string | null;
  notes: string | null;
}

interface Assessment {
  id: string;
  weight: number | null;
  body_fat: number | null;
  chest: number | null;
  waist: number | null;
  hips: number | null;
  arm: number | null;
  thigh: number | null;
  notes: string | null;
  assessed_at: string;
}

interface Protocol {
  id: string;
  type: string;
  title: string;
  content: string;
  active: boolean;
  created_at: string;
}

const StudentProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [showAssessmentForm, setShowAssessmentForm] = useState(false);
  const [showProtocolForm, setShowProtocolForm] = useState(false);
  const [protocolType, setProtocolType] = useState<"diet" | "training">("training");

  useEffect(() => {
    if (id) {
      fetchStudent();
      fetchAssessments();
      fetchProtocols();
    }
  }, [id]);

  const fetchStudent = async () => {
    const { data } = await supabase
      .from("students")
      .select("*")
      .eq("id", id!)
      .single();
    if (data) setStudent(data);
  };

  const fetchAssessments = async () => {
    const { data } = await supabase
      .from("assessments")
      .select("*")
      .eq("student_id", id!)
      .order("assessed_at", { ascending: true });
    if (data) setAssessments(data);
  };

  const fetchProtocols = async () => {
    const { data } = await supabase
      .from("protocols")
      .select("*")
      .eq("student_id", id!)
      .order("created_at", { ascending: false });
    if (data) setProtocols(data);
  };

  if (!student) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  const goalLabels: Record<string, string> = {
    emagrecimento: "🔥 Emagrecimento",
    hipertrofia: "💪 Hipertrofia",
    condicionamento: "🏃 Condicionamento",
    saude: "❤️ Saúde",
    reabilitacao: "🩺 Reabilitação",
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border p-4">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold text-foreground truncate">{student.full_name}</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* Profile Card */}
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center">
              <User className="w-7 h-7 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">{student.full_name}</h2>
              {student.goal && (
                <span className="text-sm text-primary">{goalLabels[student.goal] || student.goal}</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {student.age && (
              <div className="text-center p-3 rounded-lg bg-secondary">
                <p className="text-lg font-bold text-foreground">{student.age}</p>
                <p className="text-xs text-muted-foreground">anos</p>
              </div>
            )}
            {student.weight && (
              <div className="text-center p-3 rounded-lg bg-secondary">
                <p className="text-lg font-bold text-foreground">{student.weight}</p>
                <p className="text-xs text-muted-foreground">kg</p>
              </div>
            )}
            {student.height && (
              <div className="text-center p-3 rounded-lg bg-secondary">
                <p className="text-lg font-bold text-foreground">{student.height}m</p>
                <p className="text-xs text-muted-foreground">altura</p>
              </div>
            )}
          </div>

          {student.health_history && (
            <div className="p-3 rounded-lg bg-secondary">
              <p className="text-xs text-muted-foreground mb-1">Histórico de saúde</p>
              <p className="text-sm text-secondary-foreground">{student.health_history}</p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="evolution" className="w-full">
          <TabsList className="w-full bg-secondary">
            <TabsTrigger value="evolution" className="flex-1 text-xs">
              <Activity className="w-3.5 h-3.5 mr-1" /> Evolução
            </TabsTrigger>
            <TabsTrigger value="assessments" className="flex-1 text-xs">
              <FileText className="w-3.5 h-3.5 mr-1" /> Avaliações
            </TabsTrigger>
            <TabsTrigger value="protocols" className="flex-1 text-xs">
              <FileText className="w-3.5 h-3.5 mr-1" /> Protocolos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="evolution" className="mt-4">
            {assessments.length > 1 ? (
              <WeightChart assessments={assessments} />
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Adicione pelo menos 2 avaliações para ver o gráfico de evolução.
              </div>
            )}
          </TabsContent>

          <TabsContent value="assessments" className="mt-4 space-y-3">
            <Button
              onClick={() => setShowAssessmentForm(true)}
              className="w-full gradient-primary text-primary-foreground"
            >
              <Plus className="w-4 h-4 mr-2" /> Nova avaliação
            </Button>

            {assessments.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground text-sm">Nenhuma avaliação registrada.</p>
            ) : (
              [...assessments].reverse().map((a) => (
                <div key={a.id} className="glass-card p-4 space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {new Date(a.assessed_at).toLocaleDateString("pt-BR")}
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    {a.weight && <div><span className="text-muted-foreground">Peso:</span> <span className="text-foreground font-medium">{a.weight}kg</span></div>}
                    {a.body_fat && <div><span className="text-muted-foreground">%G:</span> <span className="text-foreground font-medium">{a.body_fat}%</span></div>}
                    {a.chest && <div><span className="text-muted-foreground">Peito:</span> <span className="text-foreground font-medium">{a.chest}cm</span></div>}
                    {a.waist && <div><span className="text-muted-foreground">Cintura:</span> <span className="text-foreground font-medium">{a.waist}cm</span></div>}
                    {a.hips && <div><span className="text-muted-foreground">Quadril:</span> <span className="text-foreground font-medium">{a.hips}cm</span></div>}
                    {a.arm && <div><span className="text-muted-foreground">Braço:</span> <span className="text-foreground font-medium">{a.arm}cm</span></div>}
                    {a.thigh && <div><span className="text-muted-foreground">Coxa:</span> <span className="text-foreground font-medium">{a.thigh}cm</span></div>}
                  </div>
                  {a.notes && <p className="text-xs text-muted-foreground mt-2">{a.notes}</p>}
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="protocols" className="mt-4 space-y-3">
            <div className="flex gap-2">
              <Button
                onClick={() => { setProtocolType("training"); setShowProtocolForm(true); }}
                className="flex-1 gradient-primary text-primary-foreground"
              >
                <Plus className="w-4 h-4 mr-1" /> Treino
              </Button>
              <Button
                onClick={() => { setProtocolType("diet"); setShowProtocolForm(true); }}
                variant="outline"
                className="flex-1 border-primary text-primary"
              >
                <Plus className="w-4 h-4 mr-1" /> Dieta
              </Button>
            </div>

            {protocols.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground text-sm">Nenhum protocolo criado.</p>
            ) : (
              protocols.map((p) => (
                <div key={p.id} className="glass-card p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${p.type === "training" ? "bg-primary/10 text-primary" : "bg-warning/10 text-warning"}`}>
                        {p.type === "training" ? "🏋️ Treino" : "🥗 Dieta"}
                      </span>
                      {p.active && <span className="w-2 h-2 rounded-full bg-primary" />}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <h3 className="font-semibold text-foreground">{p.title}</h3>
                  <p className="text-sm text-secondary-foreground whitespace-pre-wrap">{p.content}</p>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      {showAssessmentForm && (
        <AssessmentForm
          studentId={id!}
          trainerId={user!.id}
          onClose={() => setShowAssessmentForm(false)}
          onSaved={() => { setShowAssessmentForm(false); fetchAssessments(); }}
        />
      )}

      {showProtocolForm && (
        <ProtocolForm
          studentId={id!}
          trainerId={user!.id}
          type={protocolType}
          onClose={() => setShowProtocolForm(false)}
          onSaved={() => { setShowProtocolForm(false); fetchProtocols(); }}
        />
      )}
    </div>
  );
};

export default StudentProfile;
