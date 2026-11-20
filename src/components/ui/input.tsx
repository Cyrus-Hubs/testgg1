import * as React from 'react'
import { cn } from '../../lib/utils'

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'h-12 w-full bg-paper px-3 text-base text-ink shadow-insetwin outline-none ring-acid placeholder:text-ink/40 focus:ring-2',
      className,
    )}
    {...props}
  />
))
Input.displayName = 'Input'
