import * as React from "react"
import { cn } from "@/lib/utils"

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "outline";
  children: React.ReactNode;
  className?: string;
}

function Badge({ variant = "default", className, children, ...props }: BadgeProps) {
  const variants = {
    default:
      "bg-[#007267]/10 text-[#007267] border-[#007267]/20",
    success:
      "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    warning:
      "bg-amber-500/10 text-amber-600 border-amber-500/20",
    danger:
      "bg-red-500/10 text-red-600 border-red-500/20",
    outline:
      "bg-white text-slate-500 border-slate-200",
  };

  return (
    <span
      data-slot="badge"
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export { Badge }
