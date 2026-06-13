
INSERT INTO public.exercises (name, muscle_group, secondary_muscles, category, equipment, difficulty, is_unilateral, description, gif_url)
SELECT v.name, v.muscle_group, v.secondary_muscles, v.category, v.equipment, v.difficulty, v.is_unilateral, v.description, v.gif_url
FROM (VALUES
  -- PEITO
  ('Supino Máquina', 'Peito', ARRAY['Tríceps','Ombro'], 'strength', 'Máquina', 'beginner', false, 'Pressão horizontal em máquina articulada, ideal para iniciantes e foco em peitoral médio.', null),
  ('Chest Press', 'Peito', ARRAY['Tríceps','Ombro'], 'strength', 'Máquina', 'beginner', false, 'Variação de supino em máquina convergente, trajetória guiada.', null),
  ('Incline Chest Press', 'Peito', ARRAY['Ombro','Tríceps'], 'strength', 'Máquina', 'intermediate', false, 'Pressão inclinada em máquina, enfatiza porção superior do peitoral.', null),
  ('Peck Deck', 'Peito', ARRAY['Ombro anterior'], 'strength', 'Máquina', 'beginner', false, 'Voador peitoral em máquina, isolamento da porção interna.', null),
  ('Crossover Polia Alta', 'Peito', ARRAY['Ombro anterior'], 'strength', 'Polia', 'intermediate', false, 'Cruzamento de polias alta para baixa, enfatiza porção inferior do peitoral.', null),
  ('Crossover Polia Baixa', 'Peito', ARRAY['Ombro anterior'], 'strength', 'Polia', 'intermediate', false, 'Cruzamento de polias baixa para cima, enfatiza porção superior do peitoral.', null),
  ('Supino Smith', 'Peito', ARRAY['Tríceps','Ombro'], 'strength', 'Smith', 'intermediate', false, 'Supino reto na máquina Smith, trajetória guiada.', null),
  ('Supino Inclinado Smith', 'Peito', ARRAY['Ombro','Tríceps'], 'strength', 'Smith', 'intermediate', false, 'Supino inclinado na Smith, ênfase em peitoral superior.', null),

  -- COSTAS
  ('Pulldown', 'Costas', ARRAY['Bíceps','Antebraço'], 'strength', 'Polia', 'beginner', false, 'Puxada frontal em polia alta, foco em latíssimo do dorso.', null),
  ('Pulldown Pegada Neutra', 'Costas', ARRAY['Bíceps'], 'strength', 'Polia', 'beginner', false, 'Puxada com triângulo, pegada neutra, ativa porção média das costas.', null),
  ('Pulldown Pegada Supinada', 'Costas', ARRAY['Bíceps'], 'strength', 'Polia', 'beginner', false, 'Puxada com pegada supinada, recruta mais bíceps e dorsal inferior.', null),
  ('Remada Máquina', 'Costas', ARRAY['Bíceps','Posterior de ombro'], 'strength', 'Máquina', 'beginner', false, 'Remada em máquina sentada, foco em romboides e latíssimo.', null),
  ('Remada Articulada', 'Costas', ARRAY['Bíceps','Posterior de ombro'], 'strength', 'Máquina', 'intermediate', false, 'Remada em máquina articulada (Hammer), permite ação unilateral.', null),
  ('High Row', 'Costas', ARRAY['Posterior de ombro','Bíceps'], 'strength', 'Máquina', 'intermediate', false, 'Remada alta em máquina, ângulo superior, ênfase em dorsal superior.', null),
  ('Low Row', 'Costas', ARRAY['Bíceps','Lombar'], 'strength', 'Máquina', 'beginner', false, 'Remada baixa em máquina, foco em porção média das costas.', null),
  ('Remada Polia Sentada', 'Costas', ARRAY['Bíceps','Posterior de ombro'], 'strength', 'Polia', 'beginner', false, 'Remada cabo sentada com triângulo, foco em espessura das costas.', null),
  ('Pullover Polia', 'Costas', ARRAY['Peito','Tríceps'], 'strength', 'Polia', 'intermediate', false, 'Pullover em pé na polia alta, alongamento e contração do latíssimo.', null),

  -- OMBROS
  ('Desenvolvimento Máquina', 'Ombro', ARRAY['Tríceps','Trapézio'], 'strength', 'Máquina', 'beginner', false, 'Desenvolvimento sentado em máquina, trajetória guiada, foco em deltoide anterior e medial.', null),
  ('Desenvolvimento Smith', 'Ombro', ARRAY['Tríceps','Trapézio'], 'strength', 'Smith', 'intermediate', false, 'Desenvolvimento militar na máquina Smith.', null),
  ('Elevação Lateral Máquina', 'Ombro', ARRAY['Trapézio'], 'strength', 'Máquina', 'beginner', false, 'Elevação lateral em máquina, isolamento do deltoide medial.', null),
  ('Elevação Lateral Polia', 'Ombro', ARRAY['Trapézio'], 'strength', 'Polia', 'intermediate', true, 'Elevação lateral unilateral na polia baixa, tensão constante.', null),
  ('Rear Delt Machine', 'Ombro', ARRAY['Romboides','Trapézio'], 'strength', 'Máquina', 'beginner', false, 'Voador inverso em máquina, isolamento do deltoide posterior.', null),
  ('Crucifixo Inverso Polia', 'Ombro', ARRAY['Romboides'], 'strength', 'Polia', 'intermediate', false, 'Crucifixo inverso em polias cruzadas, foco em posterior de ombro.', null),
  ('Encolhimento Máquina', 'Ombro', ARRAY['Trapézio'], 'strength', 'Máquina', 'beginner', false, 'Encolhimento em máquina específica, isolamento do trapézio superior.', null),

  -- BÍCEPS
  ('Rosca Máquina', 'Bíceps', ARRAY['Antebraço'], 'strength', 'Máquina', 'beginner', false, 'Rosca direta em máquina articulada, isolamento do bíceps.', null),
  ('Rosca Scott Máquina', 'Bíceps', ARRAY['Antebraço'], 'strength', 'Máquina', 'beginner', false, 'Rosca Scott em máquina, braço apoiado, foco em porção curta do bíceps.', null),
  ('Rosca Polia Baixa', 'Bíceps', ARRAY['Antebraço'], 'strength', 'Polia', 'beginner', false, 'Rosca direta na polia baixa, tensão constante em toda amplitude.', null),
  ('Rosca Polia Alta', 'Bíceps', ARRAY['Antebraço'], 'strength', 'Polia', 'intermediate', false, 'Rosca bíceps com polias altas (estilo dupla bíceps), pico de contração.', null),

  -- TRÍCEPS
  ('Tríceps Máquina', 'Tríceps', ARRAY['Ombro'], 'strength', 'Máquina', 'beginner', false, 'Extensão de tríceps em máquina, trajetória guiada.', null),
  ('Tríceps Polia Barra', 'Tríceps', ARRAY[]::text[], 'strength', 'Polia', 'beginner', false, 'Extensão de tríceps na polia alta com barra reta.', null),
  ('Tríceps Polia Corda', 'Tríceps', ARRAY[]::text[], 'strength', 'Polia', 'beginner', false, 'Tríceps corda, com abertura final, ênfase em cabeça lateral.', null),
  ('Tríceps Francês Polia', 'Tríceps', ARRAY[]::text[], 'strength', 'Polia', 'intermediate', false, 'Tríceps francês com corda em polia, alongamento da cabeça longa.', null),
  ('Mergulho Máquina', 'Tríceps', ARRAY['Peito','Ombro'], 'strength', 'Máquina', 'intermediate', false, 'Dip assistido/máquina para tríceps e peitoral inferior.', null),

  -- QUADRÍCEPS
  ('Leg Press 45', 'Quadríceps', ARRAY['Glúteo','Posterior'], 'strength', 'Leg Press', 'beginner', false, 'Leg press inclinado 45 graus, recrutamento global de membros inferiores.', null),
  ('Leg Press Horizontal', 'Quadríceps', ARRAY['Glúteo'], 'strength', 'Leg Press', 'beginner', false, 'Leg press horizontal, menor sobrecarga lombar.', null),
  ('Hack Machine', 'Quadríceps', ARRAY['Glúteo'], 'strength', 'Máquina', 'intermediate', false, 'Agachamento Hack em máquina, ênfase em quadríceps.', null),
  ('Cadeira Extensora', 'Quadríceps', ARRAY[]::text[], 'strength', 'Máquina', 'beginner', false, 'Extensão de joelho em máquina, isolamento do quadríceps.', null),
  ('Smith Squat', 'Quadríceps', ARRAY['Glúteo','Posterior'], 'strength', 'Smith', 'intermediate', false, 'Agachamento livre na máquina Smith, trajetória guiada.', null),
  ('Afundo Smith', 'Quadríceps', ARRAY['Glúteo'], 'strength', 'Smith', 'intermediate', true, 'Afundo unilateral na Smith, foco em quadríceps e glúteo.', null),
  ('Búlgaro Smith', 'Quadríceps', ARRAY['Glúteo'], 'strength', 'Smith', 'advanced', true, 'Agachamento búlgaro com pé elevado na Smith.', null),

  -- POSTERIOR
  ('Mesa Flexora', 'Posterior', ARRAY['Glúteo','Panturrilha'], 'strength', 'Máquina', 'beginner', false, 'Flexão de joelho deitado em mesa flexora, foco em isquiotibiais.', null),
  ('Cadeira Flexora', 'Posterior', ARRAY['Panturrilha'], 'strength', 'Máquina', 'beginner', false, 'Flexão de joelho sentado, isolamento dos isquiotibiais.', null),
  ('Flexora em Pé', 'Posterior', ARRAY['Glúteo'], 'strength', 'Máquina', 'intermediate', true, 'Flexão de joelho em pé, unilateral, foco em isquiotibiais.', null),
  ('Stiff Smith', 'Posterior', ARRAY['Glúteo','Lombar'], 'strength', 'Smith', 'intermediate', false, 'Stiff na máquina Smith, alongamento de isquiotibiais e glúteo.', null),
  ('Good Morning Smith', 'Posterior', ARRAY['Glúteo','Lombar'], 'strength', 'Smith', 'advanced', false, 'Flexão de tronco com barra na Smith, foco em cadeia posterior.', null),

  -- GLÚTEOS
  ('Glúteo Máquina', 'Glúteo', ARRAY['Posterior'], 'strength', 'Máquina', 'beginner', true, 'Extensão de quadril em máquina, isolamento do glúteo máximo.', null),
  ('Coice Máquina', 'Glúteo', ARRAY['Posterior'], 'strength', 'Máquina', 'beginner', true, 'Coice unilateral em máquina, foco em glúteo máximo.', null),
  ('Coice Polia', 'Glúteo', ARRAY['Posterior'], 'strength', 'Polia', 'intermediate', true, 'Extensão de quadril na polia baixa com caneleira, tensão contínua.', null),
  ('Hip Thrust Máquina', 'Glúteo', ARRAY['Posterior'], 'strength', 'Máquina', 'intermediate', false, 'Hip thrust em máquina específica, alta sobrecarga no glúteo.', null),
  ('Hip Thrust Smith', 'Glúteo', ARRAY['Posterior'], 'strength', 'Smith', 'intermediate', false, 'Hip thrust com barra guiada na máquina Smith.', null),
  ('Elevação Pélvica Smith', 'Glúteo', ARRAY['Posterior'], 'strength', 'Smith', 'intermediate', false, 'Elevação pélvica no Smith, ativação de glúteo máximo.', null),

  -- PANTURRILHAS
  ('Panturrilha Leg Press', 'Panturrilha', ARRAY[]::text[], 'strength', 'Leg Press', 'beginner', false, 'Flexão plantar no leg press 45, ênfase em gastrocnêmio.', null),
  ('Panturrilha Sentada', 'Panturrilha', ARRAY[]::text[], 'strength', 'Máquina', 'beginner', false, 'Flexão plantar sentado em máquina, ênfase em sóleo.', null),
  ('Panturrilha Máquina em Pé', 'Panturrilha', ARRAY[]::text[], 'strength', 'Máquina', 'beginner', false, 'Flexão plantar em pé em máquina específica, foco em gastrocnêmio.', null),
  ('Panturrilha Smith', 'Panturrilha', ARRAY[]::text[], 'strength', 'Smith', 'beginner', false, 'Flexão plantar em pé na Smith.', null),

  -- ADUTORES
  ('Adução Máquina', 'Adutores', ARRAY[]::text[], 'strength', 'Máquina', 'beginner', false, 'Adução de quadril em máquina específica, isolamento dos adutores.', null),
  ('Adução Polia', 'Adutores', ARRAY[]::text[], 'strength', 'Polia', 'intermediate', true, 'Adução unilateral na polia baixa com caneleira.', null),

  -- ABDUTORES
  ('Abdução Máquina', 'Abdutores', ARRAY['Glúteo médio'], 'strength', 'Máquina', 'beginner', false, 'Abdução de quadril em máquina, foco em glúteo médio.', null),
  ('Abdução Polia', 'Abdutores', ARRAY['Glúteo médio'], 'strength', 'Polia', 'intermediate', true, 'Abdução unilateral na polia baixa.', null),

  -- CORE
  ('Crunch Máquina', 'Core', ARRAY[]::text[], 'strength', 'Máquina', 'beginner', false, 'Abdominal supra em máquina, sobrecarga progressiva.', null),
  ('Abdominal Polia', 'Core', ARRAY[]::text[], 'strength', 'Polia', 'intermediate', false, 'Abdominal ajoelhado na polia alta com corda.', null),
  ('Rotação Tronco Polia', 'Core', ARRAY['Oblíquos'], 'strength', 'Polia', 'intermediate', true, 'Rotação de tronco em pé na polia (woodchopper), foco em oblíquos.', null),
  ('Flexão Lateral Polia', 'Core', ARRAY['Oblíquos'], 'strength', 'Polia', 'beginner', true, 'Flexão lateral de tronco unilateral na polia baixa.', null)
) AS v(name, muscle_group, secondary_muscles, category, equipment, difficulty, is_unilateral, description, gif_url)
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises e WHERE lower(e.name) = lower(v.name)
);
