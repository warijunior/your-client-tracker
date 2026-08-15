# Plano: Preservação de Estado em Navegação Interna

Impedir a perda de dados preenchidos em formulários (Avaliações, Protocolos, Cadastro de Aluno, etc.) quando o usuário navega entre abas ou seções da aplicação sem salvar, mantendo os dados disponíveis até que o componente seja remontado ou o formulário submetido.

## Problema Identificado
Componentes de formulário (`AssessmentForm`, `ProtocolForm`, `NewStudent`) utilizam estados locais (`useState`) que são destruídos quando o componente é desmontado (ex: trocar de aba no `StudentProfile` ou navegar para outra página).

## Solução Técnica

### 1. Sistema de Cache em Memória (Session Storage)
Utilizar `sessionStorage` para persistir temporariamente os rascunhos de formulários.
- **Por que Session Storage?** Dados persistem durante a sessão da aba, não ocupam o banco de dados e são limpos se a aba for fechada, mas sobrevivem a recarregamentos e navegação interna.

### 2. Hook Customizado `useFormDraft`
Criar um hook que gerencia o estado do formulário e sincroniza com o cache.
- `key`: Identificador único (ex: `draft-assessment-${studentId}`).
- `initialValues`: Valores padrão.
- `clearOnSubmit`: Limpar cache após sucesso.

### 3. Implementação nos Componentes Críticos
1.  **AssessmentForm.tsx**: Persistir medidas e notas durante a edição.
2.  **ProtocolForm.tsx**: Persistir título e conteúdo de treinos/dietas.
3.  **NewStudent.tsx**: Persistir dados cadastrais do novo aluno.
4.  **StudentDashboard.tsx**: Persistir o campo de notas do check-in diário.
5.  **HydrationPanel / SupplementsPanel / ExamsPanel**: Persistir inputs de texto/número em progresso.

## Detalhes Técnicos
- Não altera RLS ou Banco de Dados.
- Não altera lógica de salvamento final.
- Garante que ao voltar para a aba "Avaliações", os dados digitados no modal (mesmo que tenha sido fechado pela navegação) reapareçam.
- Implementação de "Debounce" leve para evitar excesso de escritas no storage.

## Ordem de Execução
1. Criar `src/hooks/useFormDraft.ts`.
2. Integrar no `AssessmentForm.tsx`.
3. Integrar no `ProtocolForm.tsx`.
4. Integrar no `NewStudent.tsx`.
5. Verificar outros painéis no `StudentProfile` e `StudentDashboard`.
