import { User, Target, ChevronRight, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface StudentCardProps {
  student: {
    id: string;
    full_name: string;
    age: number | null;
    weight: number | null;
    goal: string | null;
    avatar_url?: string | null;
  };
  onClick: () => void;
  onDelete?: () => void;
}

const goalLabels: Record<string, string> = {
  emagrecimento: "🔥 Emagrecimento",
  hipertrofia: "💪 Hipertrofia",
  condicionamento: "🏃 Condicionamento",
  saude: "❤️ Saúde",
  reabilitacao: "🩺 Reabilitação",
};

const StudentCard = ({ student, onClick, onDelete }: StudentCardProps) => {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onClick}
        className="flex-1 glass-card p-4 flex items-center gap-4 hover:border-accent/50 transition-all text-left min-w-0"
      >
        <Avatar className="w-11 h-11 border border-border">
          <AvatarImage src={student.avatar_url || ""} alt={student.full_name} className="object-cover" />
          <AvatarFallback className="bg-secondary">
            <User className="w-5 h-5 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground truncate">{student.full_name}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            {student.age && <span>{student.age} anos</span>}
            {student.weight && <span>• {student.weight}kg</span>}
          </div>
          {student.goal && (
            <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent">
              {goalLabels[student.goal] || student.goal}
            </span>
          )}
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
      </button>

      {onDelete && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
              <Trash2 className="w-4 h-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-background border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">Deseja realmente excluir este aluno?</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                Esta ação removerá o vínculo do aluno <strong>{student.full_name}</strong> com você.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-secondary text-foreground hover:bg-secondary/80 border-none">Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={onDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Confirmar exclusão
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

export default StudentCard;
