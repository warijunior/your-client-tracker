import { cn } from "@/lib/utils";

interface XCLogoProps {
  className?: string;
  size?: number;
  /** "mark" = ícone apenas; "badge" = ícone com fundo gradiente (estilo selo) */
  variant?: "mark" | "badge";
}

/**
 * Identidade visual XConsultoria-Esportiva.
 * Monograma "XC" — letras geométricas e atléticas.
 * Usa tokens semânticos do tema (currentColor + accent) para funcionar
 * automaticamente em fundo claro e escuro.
 */
export const XCLogo = ({ className, size = 32, variant = "mark" }: XCLogoProps) => {
  const svg = (
    <svg
      viewBox="0 0 64 64"
      width={variant === "badge" ? size * 0.6 : size}
      height={variant === "badge" ? size * 0.6 : size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* "X" — duas diagonais com corte atlético */}
      <path
        d="M8 10 L24 32 L8 54"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M32 10 L16 32 L32 54"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.55"
      />
      {/* "C" — arco aberto à direita, em destaque na cor primária */}
      <path
        d="M58 18 A18 18 0 1 0 58 46"
        stroke="hsl(var(--primary))"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      {/* Acento de velocidade no "C" */}
      <circle cx="56" cy="20" r="2.5" fill="hsl(var(--primary))" />
    </svg>
  );

  if (variant === "badge") {
    return (
      <div
        className={cn(
          "inline-flex items-center justify-center rounded-2xl gradient-primary glow-primary",
          className
        )}
        style={{ width: size, height: size, color: "hsl(var(--primary-foreground))" }}
      >
        {svg}
      </div>
    );
  }

  return <span className={cn("inline-flex text-foreground", className)}>{svg}</span>;
};

export default XCLogo;
