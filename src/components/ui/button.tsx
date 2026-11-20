import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-display font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acid disabled:pointer-events-none disabled:opacity-45 active:translate-x-px active:translate-y-px',
  {
    variants: {
      variant: {
        default: 'bg-acid text-ink shadow-win hover:brightness-110',
        hot: 'bg-hot text-white shadow-win hover:brightness-110',
        steel: 'bg-paper text-ink shadow-win hover:bg-white',
        ghost: 'bg-white/10 text-paper hover:bg-white/20',
        menu: 'bg-[#c9d4c8] text-ink shadow-[2px_2px_0_#05080c] hover:bg-white',
      },
      size: {
        default: 'h-11 min-h-11 px-4 text-sm',
        lg: 'h-12 min-h-12 px-5 text-base',
        sm: 'h-11 min-h-11 px-3 text-xs',
        icon: 'h-11 w-11 min-h-11 min-w-11',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild, type, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button'
  return <Comp ref={ref} type={asChild ? undefined : type ?? 'button'} className={cn(buttonVariants({ variant, size }), className)} {...props} />
})
Button.displayName = 'Button'
