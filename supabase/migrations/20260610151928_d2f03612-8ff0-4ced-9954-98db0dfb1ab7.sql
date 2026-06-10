
-- =========================================================
-- EXERCISES (catálogo global)
-- =========================================================
CREATE TABLE public.exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  muscle_group text NOT NULL,
  secondary_muscles text[] NOT NULL DEFAULT '{}',
  category text NOT NULL DEFAULT 'strength',
  equipment text,
  difficulty text NOT NULL DEFAULT 'intermediate',
  is_unilateral boolean NOT NULL DEFAULT false,
  description text,
  gif_url text,
  source text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.exercises TO authenticated;
GRANT ALL ON public.exercises TO service_role;

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view exercises"
  ON public.exercises FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'trainer'));

CREATE POLICY "Admin can insert exercises"
  ON public.exercises FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update exercises"
  ON public.exercises FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete exercises"
  ON public.exercises FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX exercises_muscle_idx ON public.exercises(muscle_group);
CREATE INDEX exercises_name_idx ON public.exercises USING gin (to_tsvector('simple', name));

-- =========================================================
-- WORKOUTS
-- =========================================================
CREATE TABLE public.workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  trainer_id uuid NOT NULL,
  title text NOT NULL,
  notes text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.workouts TO authenticated;
GRANT ALL ON public.workouts TO service_role;

ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage workouts"
  ON public.workouts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'trainer'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'trainer'));

CREATE POLICY "Student views own workouts"
  ON public.workouts FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.students s WHERE s.id = workouts.student_id AND s.user_id = auth.uid()));

CREATE INDEX workouts_student_idx ON public.workouts(student_id);

CREATE TRIGGER update_workouts_updated_at
  BEFORE UPDATE ON public.workouts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- WORKOUT_EXERCISES
-- =========================================================
CREATE TABLE public.workout_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id uuid NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES public.exercises(id),
  order_index integer NOT NULL DEFAULT 0,
  sets integer NOT NULL DEFAULT 3,
  reps text NOT NULL DEFAULT '10',
  rest_seconds integer NOT NULL DEFAULT 60,
  suggested_load numeric,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_exercises TO authenticated;
GRANT ALL ON public.workout_exercises TO service_role;

ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage workout_exercises"
  ON public.workout_exercises FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'trainer'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'trainer'));

CREATE POLICY "Student views own workout_exercises"
  ON public.workout_exercises FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.workouts w
    JOIN public.students s ON s.id = w.student_id
    WHERE w.id = workout_exercises.workout_id AND s.user_id = auth.uid()
  ));

CREATE INDEX workout_exercises_workout_idx ON public.workout_exercises(workout_id);

-- =========================================================
-- EXERCISE_LOGS (progressão de carga)
-- =========================================================
CREATE TABLE public.exercise_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_exercise_id uuid NOT NULL REFERENCES public.workout_exercises(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  load numeric NOT NULL,
  reps_done integer,
  notes text,
  performed_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.exercise_logs TO authenticated;
GRANT ALL ON public.exercise_logs TO service_role;

ALTER TABLE public.exercise_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff view exercise_logs"
  ON public.exercise_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'trainer'));

CREATE POLICY "Student manages own exercise_logs"
  ON public.exercise_logs FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.students s WHERE s.id = exercise_logs.student_id AND s.user_id = auth.uid())
  );

CREATE INDEX exercise_logs_we_idx ON public.exercise_logs(workout_exercise_id, performed_at DESC);
CREATE INDEX exercise_logs_student_idx ON public.exercise_logs(student_id, performed_at DESC);

-- =========================================================
-- SEED: exercícios populares (free-exercise-db images)
-- =========================================================
INSERT INTO public.exercises (name, muscle_group, secondary_muscles, category, equipment, difficulty, is_unilateral, description, gif_url, source) VALUES
-- PEITO
('Supino Reto com Barra', 'Peito', ARRAY['Tríceps','Ombro anterior'], 'strength', 'Barra', 'intermediate', false, 'Deite no banco, segure a barra com pegada média, desça até o peito e empurre para cima.', 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Bench_Press_-_Medium_Grip/images/0.jpg', 'free-exercise-db'),
('Supino Inclinado com Halteres', 'Peito', ARRAY['Tríceps','Ombro anterior'], 'strength', 'Halteres', 'intermediate', false, 'Banco a 30-45°, empurre os halteres para cima alinhando com o peito superior.', 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Bench_Press/images/0.jpg', 'free-exercise-db'),
('Crucifixo com Halteres', 'Peito', ARRAY['Ombro anterior'], 'strength', 'Halteres', 'beginner', false, 'Abra os braços em arco mantendo leve flexão de cotovelo, contraia o peito.', 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Flyes/images/0.jpg', 'free-exercise-db'),
('Flexão de Braço', 'Peito', ARRAY['Tríceps','Core'], 'strength', 'Peso corporal', 'beginner', false, 'Mãos na largura dos ombros, corpo reto, desça e empurre o chão.', 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Pushups/images/0.jpg', 'free-exercise-db'),
('Crossover no Cabo', 'Peito', ARRAY['Ombro anterior'], 'strength', 'Cabo', 'intermediate', false, 'Em pé entre as polias, traga os cabos à frente cruzando-os abaixo do peito.', 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cable_Crossover/images/0.jpg', 'free-exercise-db'),

-- COSTAS
('Puxada na Polia Alta', 'Costas', ARRAY['Bíceps'], 'strength', 'Polia', 'beginner', false, 'Sente, puxe a barra até o peito mantendo o tronco levemente inclinado.', 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Wide-Grip_Lat_Pulldown/images/0.jpg', 'free-exercise-db'),
('Remada Curvada com Barra', 'Costas', ARRAY['Bíceps','Posterior de ombro'], 'strength', 'Barra', 'intermediate', false, 'Quadril flexionado, costas neutras, puxe a barra ao abdômen.', 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Bent_Over_Barbell_Row/images/0.jpg', 'free-exercise-db'),
('Remada Unilateral com Halter', 'Costas', ARRAY['Bíceps'], 'strength', 'Halteres', 'beginner', true, 'Apoio no banco, puxe o halter ao quadril mantendo cotovelo próximo ao corpo.', 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/One-Arm_Dumbbell_Row/images/0.jpg', 'free-exercise-db'),
('Barra Fixa', 'Costas', ARRAY['Bíceps'], 'strength', 'Barra fixa', 'advanced', false, 'Pegada pronada, puxe o corpo até o queixo passar a barra.', 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Pullups/images/0.jpg', 'free-exercise-db'),
('Remada Sentada na Polia', 'Costas', ARRAY['Bíceps'], 'strength', 'Polia', 'beginner', false, 'Puxe o triângulo até o abdômen, contraindo as escápulas.', 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Seated_Cable_Rows/images/0.jpg', 'free-exercise-db'),

-- PERNA
('Agachamento Livre', 'Perna', ARRAY['Glúteo','Core'], 'strength', 'Barra', 'advanced', false, 'Barra nos trapézios, desça até a coxa paralela ao chão e suba.', 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Squat/images/0.jpg', 'free-exercise-db'),
('Leg Press 45°', 'Perna', ARRAY['Glúteo'], 'strength', 'Máquina', 'beginner', false, 'Pés na plataforma na largura dos ombros, desça até 90° e empurre.', 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Leg_Press/images/0.jpg', 'free-exercise-db'),
('Cadeira Extensora', 'Perna', ARRAY[]::text[], 'strength', 'Máquina', 'beginner', false, 'Estenda os joelhos contraindo o quadríceps no topo.', 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Leg_Extensions/images/0.jpg', 'free-exercise-db'),
('Cadeira Flexora', 'Perna', ARRAY['Glúteo'], 'strength', 'Máquina', 'beginner', false, 'Flexione os joelhos puxando o calcanhar em direção ao glúteo.', 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Lying_Leg_Curls/images/0.jpg', 'free-exercise-db'),
('Stiff com Halteres', 'Perna', ARRAY['Glúteo','Lombar'], 'strength', 'Halteres', 'intermediate', false, 'Quadril para trás, desça os halteres rente às pernas mantendo costas neutras.', 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Romanian_Deadlift/images/0.jpg', 'free-exercise-db'),
('Avanço (Afundo) com Halteres', 'Perna', ARRAY['Glúteo'], 'strength', 'Halteres', 'intermediate', true, 'Dê um passo à frente flexionando os dois joelhos a 90°.', 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Lunges/images/0.jpg', 'free-exercise-db'),
('Panturrilha em Pé', 'Perna', ARRAY[]::text[], 'strength', 'Máquina', 'beginner', false, 'Eleve os calcanhares no maior pico de contração possível.', 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Standing_Calf_Raises/images/0.jpg', 'free-exercise-db'),
('Levantamento Terra', 'Perna', ARRAY['Costas','Glúteo'], 'strength', 'Barra', 'advanced', false, 'Quadril e joelhos flexionados, eleve a barra mantendo costas retas.', 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Deadlift/images/0.jpg', 'free-exercise-db'),

-- GLÚTEO
('Hip Thrust com Barra', 'Glúteo', ARRAY['Posterior de coxa'], 'strength', 'Barra', 'intermediate', false, 'Apoio das escápulas no banco, eleve o quadril contraindo o glúteo no topo.', 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Glute_Bridge/images/0.jpg', 'free-exercise-db'),
('Coice na Polia', 'Glúteo', ARRAY['Posterior de coxa'], 'strength', 'Polia', 'beginner', true, 'Tornozeleira, estenda o quadril para trás contraindo o glúteo.', 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Glute_Kickback/images/0.jpg', 'free-exercise-db'),

-- OMBRO
('Desenvolvimento com Halteres', 'Ombro', ARRAY['Tríceps'], 'strength', 'Halteres', 'intermediate', false, 'Sentado, empurre os halteres acima da cabeça sem travar o cotovelo.', 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Shoulder_Press/images/0.jpg', 'free-exercise-db'),
('Desenvolvimento Militar', 'Ombro', ARRAY['Tríceps'], 'strength', 'Barra', 'advanced', false, 'Em pé, empurre a barra acima da cabeça em linha reta.', 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Standing_Military_Press/images/0.jpg', 'free-exercise-db'),
('Elevação Lateral', 'Ombro', ARRAY[]::text[], 'strength', 'Halteres', 'beginner', false, 'Eleve os halteres lateralmente até a altura dos ombros.', 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Side_Lateral_Raise/images/0.jpg', 'free-exercise-db'),
('Elevação Frontal', 'Ombro', ARRAY[]::text[], 'strength', 'Halteres', 'beginner', false, 'Eleve os halteres à frente até a altura dos ombros.', 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Front_Dumbbell_Raise/images/0.jpg', 'free-exercise-db'),
('Crucifixo Inverso', 'Ombro', ARRAY['Costas'], 'strength', 'Halteres', 'intermediate', false, 'Tronco inclinado, abra os braços lateralmente contraindo o posterior do ombro.', 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Bent_Over_Dumbbell_Rear_Delt_Raise_With_Head_On_Bench/images/0.jpg', 'free-exercise-db'),
('Encolhimento com Halteres', 'Ombro', ARRAY['Trapézio'], 'strength', 'Halteres', 'beginner', false, 'Eleve os ombros em direção às orelhas e contraia.', 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Shrug/images/0.jpg', 'free-exercise-db'),

-- BÍCEPS
('Rosca Direta com Barra', 'Braço', ARRAY['Bíceps','Antebraço'], 'strength', 'Barra', 'beginner', false, 'Em pé, flexione os cotovelos elevando a barra ao peito.', 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Curl/images/0.jpg', 'free-exercise-db'),
('Rosca Alternada com Halteres', 'Braço', ARRAY['Bíceps'], 'strength', 'Halteres', 'beginner', true, 'Flexione um cotovelo de cada vez, supinando o punho.', 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Alternate_Bicep_Curl/images/0.jpg', 'free-exercise-db'),
('Rosca Martelo', 'Braço', ARRAY['Bíceps','Antebraço'], 'strength', 'Halteres', 'beginner', false, 'Punho neutro durante todo o movimento.', 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Hammer_Curls/images/0.jpg', 'free-exercise-db'),
('Rosca Scott', 'Braço', ARRAY['Bíceps'], 'strength', 'Barra', 'intermediate', false, 'Cotovelos apoiados, flexione controlando a descida.', 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Preacher_Curl/images/0.jpg', 'free-exercise-db'),

-- TRÍCEPS
('Tríceps Pulley com Corda', 'Braço', ARRAY['Tríceps'], 'strength', 'Polia', 'beginner', false, 'Cotovelos fixos, estenda os braços puxando a corda para baixo.', 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Triceps_Pushdown/images/0.jpg', 'free-exercise-db'),
('Tríceps Francês', 'Braço', ARRAY['Tríceps'], 'strength', 'Halteres', 'intermediate', false, 'Deitado, desça o halter atrás da cabeça e estenda os cotovelos.', 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Lying_Triceps_Press/images/0.jpg', 'free-exercise-db'),
('Mergulho entre Bancos', 'Braço', ARRAY['Tríceps','Peito'], 'strength', 'Peso corporal', 'intermediate', false, 'Mãos no banco, desça flexionando os cotovelos e empurre.', 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Bench_Dips/images/0.jpg', 'free-exercise-db'),
('Supino Fechado', 'Braço', ARRAY['Tríceps','Peito'], 'strength', 'Barra', 'intermediate', false, 'Pegada estreita, cotovelos junto ao corpo, foco no tríceps.', 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Close-Grip_Barbell_Bench_Press/images/0.jpg', 'free-exercise-db'),

-- CORE
('Prancha', 'Core', ARRAY['Ombro'], 'strength', 'Peso corporal', 'beginner', false, 'Apoie antebraços e pés, mantenha o corpo reto pelo tempo determinado.', 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Plank/images/0.jpg', 'free-exercise-db'),
('Abdominal Crunch', 'Core', ARRAY[]::text[], 'strength', 'Peso corporal', 'beginner', false, 'Deitado, eleve o tronco contraindo o abdômen.', 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Crunches/images/0.jpg', 'free-exercise-db'),
('Elevação de Pernas', 'Core', ARRAY[]::text[], 'strength', 'Peso corporal', 'intermediate', false, 'Deitado, eleve as pernas estendidas até 90°.', 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Leg_Raises/images/0.jpg', 'free-exercise-db'),
('Abdominal Bicicleta', 'Core', ARRAY['Oblíquos'], 'strength', 'Peso corporal', 'beginner', false, 'Alterne cotovelo ao joelho oposto em movimento de pedalada.', 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Air_Bike/images/0.jpg', 'free-exercise-db'),
('Russian Twist', 'Core', ARRAY['Oblíquos'], 'strength', 'Peso corporal', 'intermediate', false, 'Sentado, gire o tronco lateralmente segurando peso.', 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Seated_Russian_Twist/images/0.jpg', 'free-exercise-db');
