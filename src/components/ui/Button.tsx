import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
};

export function Button({
  children,
  className = "",
  variant = "primary",
  ...props
}: ButtonProps) {
  const variants = {
    primary:
      "bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-300 text-white shadow-lg shadow-cyan-500/20 hover:brightness-110",
    secondary:
      "bg-slate-100 text-slate-900 hover:bg-slate-200 border border-slate-200",
    danger:
      "bg-red-600 text-white hover:bg-red-700 shadow-sm shadow-red-500/20",
    ghost:
      "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  };

  return (
    <button
      className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}