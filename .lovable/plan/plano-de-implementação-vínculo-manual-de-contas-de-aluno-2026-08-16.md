# Plano de Implementação: Vínculo Manual de Contas de Aluno

Este plano descreve a implementação da funcionalidade que permite aos treinadores vincularem manualmente uma conta de autenticação (criada pelo aluno) a um cadastro de aluno existente, utilizando o e-mail como chave de busca.

## Objetivo
Resolver o problema onde alunos criam contas com o mesmo e-mail cadastrado pelo treinador, mas o sistema não realiza o vínculo automático ou o treinador precisa forçar esse vínculo para garantir o acesso do aluno aos seus dados (treinos, dietas, etc).

## Alterações Técnicas

### 1. Banco de Dados (Supabase)
*   Nenhuma alteração de esquema é necessária, pois a tabela `students` já possui o campo `user_id` para o relacionamento com a conta (`auth.users`).
*   A busca será feita na tabela `profiles` (ou similar) que mapeia `user_id` para informações públicas, ou diretamente via RPC se necessário para buscar por e-mail (considerando que `auth.users` é protegido).
*   **Nota:** Como já existe uma tabela `profiles` com `user_id`, e o sistema de autenticação do Lovable Cloud gerencia isso, utilizaremos o e-mail presente no registro do aluno para localizar o perfil correspondente.

### 2. Componentes e UI
*   **StudentProfile.tsx**: 
    *   Adicionar uma seção "Acesso do Aluno" no topo ou na aba "Visão Geral".
    *   Exibir o status do vínculo: `🟢 Conta vinculada` ou `🟡 Conta não vinculada`.
    *   Adicionar o botão `[VINCULAR CONTA]` quando o `user_id` for nulo.
    *   Implementar o modal/diálogo de confirmação que exibe os dados da conta encontrada antes de realizar o `update`.

### 3. Lógica de Vínculo
*   **Busca**: Ao clicar em "Vincular", o sistema busca na tabela `profiles` um registro onde o e-mail coincida com o e-mail do aluno.
*   **Validação**: 
    *   Verificar se a conta encontrada já não está vinculada a outro registro na tabela `students`.
    *   Exibir erro claro se não encontrar ou se já estiver em uso.
*   **Execução**: Atualizar o campo `user_id` do registro na tabela `students` com o ID encontrado.

## Regras de Segurança
*   Apenas o treinador dono do aluno (`trainer_id`) pode realizar o vínculo.
*   O e-mail é a única chave de busca.
*   Confirmação explícita é obrigatória.

## User Review Required
> [!IMPORTANT]
> A funcionalidade assume que o e-mail cadastrado pelo treinador no perfil do aluno é o mesmo e-mail que o aluno utilizou para criar sua conta. Caso o aluno tenha usado um e-mail diferente, o treinador deverá primeiro editar o e-mail no perfil do aluno para então realizar o vínculo.
