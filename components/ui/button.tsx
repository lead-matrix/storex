import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-luxury text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-gold text-black hover:bg-gold-light shadow-gold",
        luxury: "bg-gold text-black hover:bg-gold-light border-none",
        gold: "bg-gold text-black hover:bg-gold-light shadow-gold uppercase tracking-wide",
        outline: "border border-white/20 bg-transparent hover:bg-white/5 text-white",
        "outline-gold": "border border-gold text-gold hover:bg-gold hover:text-black uppercase tracking-wide",
        destructive: "bg-red-900/10 border border-red-900/50 text-red-500 hover:bg-red-900/20",
        secondary: "bg-obsidian text-white border border-luxury-border hover:bg-white/5",
        ghost: "hover:bg-white/5 text-luxury-subtext hover:text-white",
        link: "text-gold underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12 px-8 py-3",
        sm: "h-9 px-4 text-xs",
        lg: "h-14 px-12 text-base tracking-[0.1em]",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }