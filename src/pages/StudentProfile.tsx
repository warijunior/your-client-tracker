import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, User, Activity, FileText, Plus, Calendar, Camera, DollarSign, MessageCircle, Trash2, Dumbbell, Upload, Loader2, LayoutDashboard, Droplets, Pill, FlaskConical, ClipboardList, Timer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AssessmentForm from "@/components/AssessmentForm";
import ProtocolForm from "@/components/ProtocolForm";
import WeightChart from "@/components/WeightChart";
import AppointmentForm from "@/components/AppointmentForm";
import PhotoGallery from "@/components/PhotoGallery";
import PaymentManager from "@/components/PaymentManager";
import ChatWindow from "@/components/ChatWindow";
import HydrationPanel from "@/components/HydrationPanel";
import SupplementsPanel from "@/components/SupplementsPanel";
import ExamsPanel from "@/components/ExamsPanel";
import FollowUpPanel from "@/components/FollowUpPanel";
import CardioPanel from "@/components/CardioPanel";


interface Student {
  id: string;
  full_name: string;
  age: number | null;
  weight: number | null;
  height: number | null;
  goal: string | null;
  health_history: string | null;
  notes: string | null;
  user_id: string | null;
  avatar_url?: string | null;
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
  evaluation_type?: "complete" | "simplified";
}

interface Protocol {
  id: string;
  type: string;
  title: string;
  content: string;
  active: boolean;
  created_at: string;
}

interface Appointment {
  id: string;
  title: string;
  description: string | null;
  appointment_date: string;
  start_time: string;
  end_time: string | null;
  status: string;
}

const StudentProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showAssessmentForm, setShowAssessmentForm] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const [showProtocolForm, setShowProtocolForm] = useState(false);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [protocolType, setProtocolType] = useState<"diet" | "training">("training");

  useEffect(() => {
    if (id) {
      fetchStudent();
      fetchAssessments();
      fetchProtocols();
      fetchAppointments();
    }
  }, [id]);

  const fetchStudent = async () => {
    const { data } = await supabase.from("students").select("*").eq("id", id!).single();
    if (data) setStudent(data);
  };

  const handleAvatarUpload = async (file: File) => {
    if (!student) return;

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${student.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, {
          cacheControl: '0',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);
      
      const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("students")
        .update({ avatar_url: cacheBustedUrl })
        .eq("id", student.id);

      if (updateError) throw updateError;

      setStudent({ ...student, avatar_url: cacheBustedUrl });
      toast({ title: "Foto de perfil atualizada!" });
    } catch (error: any) {
      toast({
        title: "Erro ao fazer upload",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchAssessments = async () => {
    const { data } = await supabase.from("assessments").select("*").eq("student_id", id!).order("assessed_at", { ascending: true });
    if (data) {
      setAssessments(data.map(a => ({
        ...a,
        evaluation_type: a.evaluation_type as "complete" | "simplified" | undefined
      })));
    }
  };

  const fetchProtocols = async () => {
    const { data } = await supabase.from("protocols").select("*").eq("student_id", id!).order("created_at", { ascending: false });
    if (data) setProtocols(data);
  };

  const { toast } = useToast();

  const handleDeleteProtocol = async (p: Protocol) => {
    const label = p.type === "training" ? "treino" : "dieta";
    if (!window.confirm(`Excluir ${label} "${p.title}"? Esta ação não pode ser desfeita.`)) return;
    const { error } = await supabase.from("protocols").delete().eq("id", p.id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `${label === "treino" ? "Treino" : "Dieta"} excluído ✅` });
      fetchProtocols();
    }
  };

  const fetchAppointments = async () => {
    const { data } = await supabase
      .from("appointments")
      .select("*")
      .eq("student_id", id!)
      .gte("appointment_date", new Date().toISOString().split("T")[0])
      .order("appointment_date", { ascending: true });
    if (data) setAppointments(data);
  };

  if (!student) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Show chat full screen
  if (showChat && student.user_id) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <ChatWindow
          recipientId={student.user_id}
          recipientName={student.full_name}
          onBack={() => setShowChat(false)}
        />
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

  const lastAssessment = assessments.length ? assessments[assessments.length - 1] : null;



  return (
    <div className="min-h-screen bg-black pb-8 theme-neon">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-black/80 backdrop-blur-xl border-b border-white/5 p-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="w-5 h-5 text-white" />
            </Button>
            <h1 className="text-lg font-bold text-white truncate">👤 Perfil do Aluno</h1>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/students/${id}/workouts`)} title="Treinos">
              <Dumbbell className="w-5 h-5 text-accent" />
            </Button>
            {student.user_id && (
              <Button variant="ghost" size="icon" onClick={() => setShowChat(true)}>
                <MessageCircle className="w-5 h-5 text-accent" />
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* Profile Card */}
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Avatar className="w-16 h-16 border-2 border-primary/20">
                <AvatarImage src={student.avatar_url || ""} alt={student.full_name} className="object-cover" />
                <AvatarFallback className="bg-secondary">
                  <User className="w-8 h-8 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <label 
                htmlFor="avatar-upload" 
                className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
              >
                <Camera className="w-5 h-5 text-white" />
                <input 
                  id="avatar-upload" 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleAvatarUpload(file);
                  }}
                />
              </label>
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
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <div className="-mx-4 px-4 overflow-x-auto scrollbar-none">
            <TabsList className="bg-secondary inline-flex w-auto gap-1">
              <TabsTrigger value="overview" className="text-xs whitespace-nowrap">
                <LayoutDashboard className="w-3.5 h-3.5 mr-1" />Visão Geral
              </TabsTrigger>
              <TabsTrigger value="protocols" className="text-xs whitespace-nowrap">
                <FileText className="w-3.5 h-3.5 mr-1" />Dieta / Treino
              </TabsTrigger>
              <TabsTrigger value="cardio" className="text-xs whitespace-nowrap">
                <Timer className="w-3.5 h-3.5 mr-1" />Cardio
              </TabsTrigger>
              <TabsTrigger value="hydration" className="text-xs whitespace-nowrap">
                <Droplets className="w-3.5 h-3.5 mr-1" />Hidratação
              </TabsTrigger>
              <TabsTrigger value="supplements" className="text-xs whitespace-nowrap">
                <Pill className="w-3.5 h-3.5 mr-1" />Suplementação
              </TabsTrigger>
              <TabsTrigger value="exams" className="text-xs whitespace-nowrap">
                <FlaskConical className="w-3.5 h-3.5 mr-1" />Exames
              </TabsTrigger>
              <TabsTrigger value="followup" className="text-xs whitespace-nowrap">
                <ClipboardList className="w-3.5 h-3.5 mr-1" />Acompanhamento
              </TabsTrigger>
              <TabsTrigger value="evolution" className="text-xs whitespace-nowrap">
                <Activity className="w-3.5 h-3.5 mr-1" />Evolução
              </TabsTrigger>
              <TabsTrigger value="assessments" className="text-xs whitespace-nowrap">
                <FileText className="w-3.5 h-3.5 mr-1" />Avaliações
              </TabsTrigger>
              <TabsTrigger value="schedule" className="text-xs whitespace-nowrap">
                <Calendar className="w-3.5 h-3.5 mr-1" />Agenda
              </TabsTrigger>
              <TabsTrigger value="photos" className="text-xs whitespace-nowrap">
                <Camera className="w-3.5 h-3.5 mr-1" />Fotos
              </TabsTrigger>
              <TabsTrigger value="payments" className="text-xs whitespace-nowrap">
                <DollarSign className="w-3.5 h-3.5 mr-1" />Pgto
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Visão Geral */}
          <TabsContent value="overview" className="mt-4 space-y-3">
            <div className="glass-card p-5 space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12 border border-primary/20">
                  <AvatarImage src={student.avatar_url || ""} alt={student.full_name} className="object-cover" />
                  <AvatarFallback className="bg-secondary"><User className="w-6 h-6 text-muted-foreground" /></AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-foreground">{student.full_name}</h3>
                  <p className="text-xs text-primary">{student.goal ? goalLabels[student.goal] || student.goal : "Objetivo não definido"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-secondary">
                  <p className="text-[11px] text-muted-foreground">Peso atual</p>
                  <p className="font-bold text-foreground">{lastAssessment?.weight ?? student.weight ?? "—"} kg</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary">
                  <p className="text-[11px] text-muted-foreground">Altura</p>
                  <p className="font-bold text-foreground">{student.height ? `${student.height} m` : "—"}</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary">
                  <p className="text-[11px] text-muted-foreground">% de gordura</p>
                  <p className="font-bold text-foreground">{lastAssessment?.body_fat != null ? `${lastAssessment.body_fat}%` : "—"}</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary">
                  <p className="text-[11px] text-muted-foreground">Status</p>
                  <p className="font-bold text-primary">{protocols.some((p) => p.active) ? "Em acompanhamento" : "Sem protocolo ativo"}</p>
                </div>
              </div>
              <div className="space-y-1 text-xs pt-1 border-t border-border">
                <div className="flex justify-between pt-2">
                  <span className="text-muted-foreground">Última atualização</span>
                  <span className="text-foreground">
                    {lastAssessment ? new Date(`${lastAssessment.assessed_at}T12:00:00`).toLocaleDateString("pt-BR") : protocols[0] ? new Date(protocols[0].created_at).toLocaleDateString("pt-BR") : "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Próxima avaliação</span>
                  <span className="text-foreground">
                    {appointments[0] ? `${new Date(`${appointments[0].appointment_date}T12:00:00`).toLocaleDateString("pt-BR")} • ${appointments[0].start_time.slice(0, 5)}` : "—"}
                  </span>
                </div>
              </div>
            </div>
            <FollowUpPanel studentId={id!} />
          </TabsContent>

          {/* Cardio */}
          <TabsContent value="cardio" className="mt-4">
            <CardioPanel studentId={id!} mode="trainer" userId={user!.id} />
          </TabsContent>

          {/* Hidratação */}
          <TabsContent value="hydration" className="mt-4">
            <HydrationPanel studentId={id!} mode="trainer" userId={user!.id} />
          </TabsContent>

          {/* Suplementação */}
          <TabsContent value="supplements" className="mt-4">
            <SupplementsPanel studentId={id!} mode="trainer" userId={user!.id} />
          </TabsContent>

          {/* Exames */}
          <TabsContent value="exams" className="mt-4">
            <ExamsPanel studentId={id!} mode="trainer" userId={user!.id} />
          </TabsContent>

          {/* Acompanhamento */}
          <TabsContent value="followup" className="mt-4">
            <FollowUpPanel studentId={id!} />
          </TabsContent>

          <TabsContent value="evolution" className="mt-4">
            {assessments.length > 1 ? (
              <WeightChart assessments={assessments} />
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Adicione pelo menos 2 avaliações para ver o gráfico.
              </div>
            )}
          </TabsContent>


          <TabsContent value="assessments" className="mt-4 space-y-3">
            <Button onClick={() => { setEditingAssessment(null); setShowAssessmentForm(true); }} className="w-full gradient-neon text-white">
              <Plus className="w-4 h-4 mr-2" /> Nova avaliação
            </Button>
            {assessments.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground text-sm">Nenhuma avaliação registrada.</p>
            ) : (
              [...assessments].reverse().map((a) => (
                <div key={a.id} className="glass-card p-4 space-y-2 cursor-pointer hover:bg-secondary/50 transition-colors group relative" onClick={() => { setEditingAssessment(a); setShowAssessmentForm(true); }}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-muted-foreground">{new Date(`${a.assessed_at}T12:00:00`).toLocaleDateString("pt-BR")}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${a.evaluation_type === 'simplified' ? 'bg-accent/10 text-accent' : 'bg-primary/10 text-primary'}`}>
                      {a.evaluation_type === 'simplified' ? '⚡ SIMPLIFICADA' : '📊 COMPLETA'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    {a.weight && <div><span className="text-muted-foreground">Peso:</span> <span className="text-foreground font-medium">{a.weight}kg</span></div>}
                    {a.evaluation_type !== 'simplified' && (
                      <>
                        {a.body_fat && <div><span className="text-muted-foreground">%G:</span> <span className="text-foreground font-medium">{a.body_fat}%</span></div>}
                        {a.chest && <div><span className="text-muted-foreground">Peito:</span> <span className="text-foreground font-medium">{a.chest}cm</span></div>}
                        {a.waist && <div><span className="text-muted-foreground">Cintura:</span> <span className="text-foreground font-medium">{a.waist}cm</span></div>}
                        {a.hips && <div><span className="text-muted-foreground">Quadril:</span> <span className="text-foreground font-medium">{a.hips}cm</span></div>}
                        {a.arm && <div><span className="text-muted-foreground">Braço:</span> <span className="text-foreground font-medium">{a.arm}cm</span></div>}
                        {a.thigh && <div><span className="text-muted-foreground">Coxa:</span> <span className="text-foreground font-medium">{a.thigh}cm</span></div>}
                      </>
                    )}
                  </div>
                  {a.notes && <p className="text-xs text-muted-foreground mt-2 border-t border-border pt-2 italic line-clamp-2">{a.notes}</p>}
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="protocols" className="mt-4 space-y-3">
            <div className="flex gap-2">
              <Button onClick={() => { setProtocolType("training"); setShowProtocolForm(true); }} className="flex-1 gradient-primary text-white">
                <Plus className="w-4 h-4 mr-1" /> Treino
              </Button>
              <Button onClick={() => { setProtocolType("diet"); setShowProtocolForm(true); }} variant="outline" className="flex-1 border-accent text-accent">
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
                      <span className={`text-xs px-2 py-0.5 rounded-full ${p.type === "training" ? "bg-primary/10 text-primary" : "bg-yellow-500/10 text-yellow-500"}`}>
                        {p.type === "training" ? "🏋️ Treino" : "🥗 Dieta"}
                      </span>
                      {p.active && <span className="w-2 h-2 rounded-full bg-primary" />}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString("pt-BR")}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteProtocol(p)}
                        aria-label="Excluir protocolo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <h3 className="font-semibold text-foreground">{p.title}</h3>
                  <p className="text-sm text-secondary-foreground whitespace-pre-wrap">{p.content}</p>
                </div>
              ))
            )}
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="mt-4 space-y-3">
            <Button onClick={() => setShowAppointmentForm(true)} className="w-full gradient-neon text-white">
              <Plus className="w-4 h-4 mr-2" /> Novo agendamento
            </Button>
            {appointments.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground text-sm">Nenhum agendamento futuro.</p>
            ) : (
              appointments.map((a) => (
                <div key={a.id} className="glass-card p-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground text-sm">{a.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${a.status === "scheduled" ? "bg-primary/10 text-primary" : a.status === "completed" ? "bg-muted text-muted-foreground" : "bg-destructive/10 text-destructive"}`}>
                      {a.status === "scheduled" ? "Agendado" : a.status === "completed" ? "Concluído" : "Cancelado"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    📅 {new Date(a.appointment_date).toLocaleDateString("pt-BR")} • ⏰ {a.start_time.slice(0, 5)}{a.end_time ? ` - ${a.end_time.slice(0, 5)}` : ""}
                  </p>
                  {a.description && <p className="text-xs text-secondary-foreground">{a.description}</p>}
                </div>
              ))
            )}
          </TabsContent>

          {/* Photos Tab */}
          <TabsContent value="photos" className="mt-4">
            <PhotoGallery studentId={id!} canUpload={true} />
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="mt-4">
            <PaymentManager studentId={id!} studentName={student.full_name} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      {showAssessmentForm && (
        <AssessmentForm 
          studentId={id!} 
          trainerId={user!.id} 
          initialData={editingAssessment}
          onClose={() => { setShowAssessmentForm(false); setEditingAssessment(null); }} 
          onSaved={() => { setShowAssessmentForm(false); setEditingAssessment(null); fetchAssessments(); }} 
        />
      )}
      {showProtocolForm && (
        <ProtocolForm studentId={id!} trainerId={user!.id} type={protocolType} onClose={() => setShowProtocolForm(false)} onSaved={() => { setShowProtocolForm(false); fetchProtocols(); }} />
      )}
      {showAppointmentForm && (
        <AppointmentForm studentId={id!} trainerId={user!.id} onClose={() => setShowAppointmentForm(false)} onSaved={() => { setShowAppointmentForm(false); fetchAppointments(); }} />
      )}
    </div>
  );
};

export default StudentProfile;
