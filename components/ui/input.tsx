import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-12 w-full rounded-luxury border border-charcoal/20 bg-white px-4 py-2 text-sm text-charcoal shadow-soft transition-all placeholder:text-textsoft/70 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold focus-visible:border-gold disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Input }
