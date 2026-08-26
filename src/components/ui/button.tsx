import React from "react";
import Link from "next/link";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "warning" | "outline" | "ghost" | "clay";
  size?: "sm" | "md" | "lg";
  href?: string;
  target?: string;
  rel?: string;
  icon?: React.ReactNode;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  href,
  target,
  rel,
  icon,
  ...props
}: ButtonProps) {
  const variantStyles = {
    primary:
      "bg-forest text-paper-raised hover:bg-forest-deep border-forest shadow-xs font-semibold",
    clay: "bg-clay text-paper-raised hover:bg-clay-deep border-clay font-bold shadow-xs",
    secondary:
      "bg-paper text-ink border-line hover:border-forest hover:text-forest",
    outline:
      "bg-transparent text-ink border-line hover:border-forest hover:text-forest",
    warning:
      "bg-pending/10 text-pending border-pending/30 hover:bg-pending/20 font-semibold",
    danger:
      "bg-rejected/10 text-rejected border-rejected/30 hover:bg-rejected/20 font-semibold",
    ghost:
      "bg-transparent text-ink-soft hover:text-ink border-transparent hover:bg-paper-raised/60",
  }[variant];

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-xs",
    lg: "px-6 py-3 text-sm",
  }[size];

  const baseStyles =
    "inline-flex items-center justify-center gap-2 rounded-full border font-mono uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none";

  const combinedClass = `${baseStyles} ${variantStyles} ${sizeStyles} ${className}`;

  if (href) {
    return (
      <Link href={href} target={target} rel={rel} className={combinedClass}>
        {icon && <span className="shrink-0">{icon}</span>}
        <span>{children}</span>
      </Link>
    );
  }

  return (
    <button className={combinedClass} {...props}>
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
}
