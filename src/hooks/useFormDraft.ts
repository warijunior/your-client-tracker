import { useState, useEffect } from "react";

/**
 * Hook para persistir estados de formulários no sessionStorage.
 * Evita perda de dados em navegação interna ou remontagem.
 */
export function useFormDraft<T>(key: string, initialValues: T) {
  const [state, setState] = useState<T>(() => {
    try {
      const saved = sessionStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Mesclar com initialValues para garantir novas chaves caso o esquema mude
        return { ...initialValues, ...parsed };
      }
    } catch (e) {
      console.error("Erro ao carregar rascunho do formulário:", e);
    }
    return initialValues;
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(key, JSON.stringify(state));
    } catch (e) {
      console.error("Erro ao salvar rascunho do formulário:", e);
    }
  }, [key, state]);

  const clearDraft = () => {
    try {
      sessionStorage.removeItem(key);
      setState(initialValues);
    } catch (e) {
      console.error("Erro ao limpar rascunho do formulário:", e);
    }
  };

  return [state, setState, clearDraft] as const;
}
