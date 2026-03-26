import { User, Target, ChevronRight } from "lucide-react";

interface StudentCardProps {
  student: {
    id: string;
    full_name: string;
    age: number | null;
    weight: number | null;
    goal: string | null;
  };
  onClick: () => void;
}

const goalLabels: Record<string, string> = {
  emagrecimento: "🔥 Emagrecimento",
  hipertrofia: "💪 Hipertrofia",
  condicionamento: "🏃 Condicionamento",
  saude: "❤️ Saúde",
  reabilitacao: "🩺 Reabilitação",
};

const StudentCard = ({ student, onClick }: StudentCardProps) => {
  return (
    <button
      onClick={onClick}
      className="w-full glass-card p-4 flex items-center gap-4 hover:border-primary/30 transition-colors text-left"
    >
      <div className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
        <User className="w-5 h-5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground truncate">{student.full_name}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
          {student.age && <span>{student.age} anos</span>}
          {student.weight && <span>• {student.weight}kg</span>}
        </div>
        {student.goal && (
          <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            {goalLabels[student.goal] || student.goal}
          </span>
        )}
      </div>
      <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
    </button>
  );
};

export default StudentCard;
