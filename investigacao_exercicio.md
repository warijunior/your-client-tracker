# 🚨 RELATÓRIO DE INVESTIGAÇÃO — IMAGEM DO EXERCÍCIO

## DADOS TÉCNICOS IDENTIFICADOS

**ID do exercício:**
`7eda281e-679e-497c-b59e-10750e2acd7e`

**Nome:**
`Abdução Máquina`

**Componente que renderiza a imagem:**
`ExerciseMedia` (utilizando internamente `AvatarImage` em alguns contextos, mas majoritariamente `<img>` ou `<video>`)

**Arquivo:**
`src/components/ExerciseMedia.tsx`

**Linha/trecho responsável:**
Linhas 14-27 (Lógica de prioridade) e Linhas 35-58 (Renderização).

---

## 🔍 DIAGNÓSTICO DO PROBLEMA

A investigação revelou que o problema **NÃO** é de upload, nem de Storage, nem de cache do navegador. O problema é uma **falha na lógica de prioridade** do componente `ExerciseMedia`.

### Como funciona hoje:
O componente recebe três tipos de mídia: `gif_url`, `video_url` e `image_url`. 
Na linha 19 de `ExerciseMedia.tsx`, a prioridade está definida assim:
`const mediaSrc = src || videoUrl || imageUrl;`

*Nota: `src` é o nome da prop que recebe o `gif_url`.*

### Por que a imagem nova não aparece:
1. A maioria dos exercícios já vem com um `gif_url` padrão (geralmente links externos do GitHub).
2. Quando o treinador faz upload de uma nova imagem, o sistema salva essa imagem no campo `image_url`.
3. Como o `gif_url` (`src`) **não é apagado**, a lógica de prioridade continua escolhendo o GIF antigo em vez da nova imagem.

**Resultado:** O banco de dados tem a imagem nova, o Storage tem o arquivo, mas a tela ignora e mostra o GIF original porque ele tem precedência.

---

## ✅ PLANO DE CORREÇÃO MÍNIMA

1. **Inverter a prioridade** no componente `ExerciseMedia.tsx`: Mídia enviada manualmente pelo treinador (`image_url` ou `video_url`) deve ter precedência sobre o GIF padrão (`gif_url`).
2. **Adicionar Cache-Busting** na biblioteca de exercícios (`ExerciseLibrary.tsx`) para garantir que o estado local do React seja atualizado imediatamente após o sucesso do upload.

**Eu identifiquei o problema real. Posso prosseguir com a correção?**
