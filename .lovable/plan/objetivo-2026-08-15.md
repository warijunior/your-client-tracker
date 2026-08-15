## Objetivo
Adicionar uma biblioteca completa de exercícios visível **somente para o TREINADOR**, com montagem de treinos para alunos e registro de progressão de carga pelo aluno. Nenhuma tela, fluxo, RLS ou tabela existente será alterada — apenas novas adições.

## Escopo (apenas adições)

### 1. Banco de dados (novas tabelas, nada alterado)

```text
exercises               (catálogo global, leitura para staff)
  id, name, muscle_group, secondary_muscles[], category,
  equipment, difficulty, is_unilateral, description,
  gif_url, source, created_at

workouts                (treino criado pelo treinador para um aluno)
  id, student_id (FK students), trainer_id, title, notes,
  active, created_at, updated_at

workout_exercises       (exercícios dentro de um treino, ordenados)
  id, workout_id, exercise_id, order_index,
  sets, reps, rest_seconds, suggested_load, notes

exercise_logs           (carga registrada pelo aluno por execução)
  id, workout_exercise_id, student_id, user_id,
  load, reps_done, notes, performed_at
```

**RLS (novas políticas, não toca nas existentes):**
- `exercises`: SELECT permitido a admin/trainer (via `has_role`). Aluno **não** lê.
- `workouts` / `workout_exercises`: staff gerencia (admin + trainer); aluno SELECT apenas onde `student_id` corresponde ao seu registro de `students.user_id`.
- `exercise_logs`: aluno insere/lê os próprios; trainer/admin leem os logs dos alunos.

### 2. Seed inicial de exercícios
Migration insere ~30–50 exercícios base (peito, costas, perna, ombro, braço, core), cada um com `gif_url` apontando para a CDN pública **wger** (`https://wger.de/...`) ou imagens placeholder neutras. Estrutura suporta importar milhares depois.

### 3. Novas telas / rotas (treinador)
- `/exercises` — Biblioteca: busca por nome, filtros (grupo muscular, equipamento, dificuldade, unilateral). Card com gif, descrição, músculos.
- `/students/:id/workouts` — Lista de treinos do aluno + botão "Novo treino".
- `/students/:id/workouts/:workoutId` — Editor de treino: adicionar exercícios da biblioteca, definir séries / reps / descanso / carga sugerida / observações, reordenar e remover.

Acesso protegido por `ProtectedRoute` + checagem `isStaff` (já existente).

### 4. Nova tela (aluno)
- `/my-workouts` (no `StudentDashboard`) — Lista de treinos ativos. Ao abrir um treino, mostra cada exercício com:
  - Nome, GIF, séries, reps, descanso, observações
  - Campo "Registrar carga" (load + reps feitas + notas) → grava em `exercise_logs`
  - Última carga usada + melhor carga + mini-histórico cronológico

### 5. Componentes novos
- `ExerciseCard`, `ExerciseLibrary`, `ExerciseFilters`
- `WorkoutBuilder`, `WorkoutExerciseRow`
- `StudentWorkoutView`, `LoadProgressionWidget`

### 6. Performance / UX
- Paginação/virtualização leve na biblioteca (limit + busca server-side via `ilike`).
- GIFs com `loading="lazy"`.
- Layout mobile-first seguindo o tema dark+verde existente.

## O que **não** será mexido
- Tabelas existentes (`students`, `protocols`, `assessments`, `payments`, `appointments`, `checkins`, `messages`, `notifications`, `progress_photos`, `profiles`, `user_roles`, `trainer_invites`).
- Trigger `handle_new_user`, função `has_role`, fluxo de convites de treinador, autenticação, roteamento por papel.
- Telas atuais: `Dashboard`, `StudentProfile`, `StudentDashboard`, `Auth`, `InviteTrainer`, `NewStudent` (apenas adicionarei links de navegação para as novas rotas — sem remover nada).

## Ordem de execução
1. Migration: criar 4 tabelas + GRANTs + RLS + seed inicial.
2. Adicionar rotas em `App.tsx` e links no menu do treinador / aluno.
3. Implementar biblioteca e filtros.
4. Implementar editor de treino.
5. Implementar visualização do aluno + registro de carga + histórico.
6. Verificar build e fluxo nas duas contas.

Confirma para eu seguir?