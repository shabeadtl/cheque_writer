import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 cursor-pointer disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007267] focus-visible:ring-offset-2 focus-visible:ring-offset-white",
  {
    variants: {
      variant: {
        default:
          "bg-[#007267] text-white shadow-md hover:bg-[#009688] active:bg-[#004d40]",
        destructive:
          "bg-[#ef4444] text-white shadow-md hover:bg-[#dc2626] active:bg-[#b91c1c]",
        outline:
          "border border-slate-300 bg-transparent text-slate-700 hover:bg-slate-100 hover:border-slate-400",
        secondary:
          "bg-white text-slate-900 border border-slate-300 hover:bg-slate-50",
        ghost:
          "text-slate-600 hover:text-slate-900 hover:bg-slate-100",
        link:
          "text-[#009688] underline-offset-4 hover:underline",
        accent:
          "bg-[#d4af37] text-white shadow-md hover:bg-[#f1c40f] font-semibold",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-lg px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants>) {
  return (
    <button
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
