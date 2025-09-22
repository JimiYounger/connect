import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { useMobileDevice } from "@/hooks/useMobileDevice"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
        // New mobile-optimized sizes
        mobile: "min-h-[44px] px-6 py-3 text-base",
        mobileLg: "min-h-[52px] px-8 py-4 text-lg",
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
  /** Enable mobile optimizations automatically */
  mobileOptimized?: boolean
  /** Enable touch feedback effects */
  touchFeedback?: boolean
}

/**
 * Enhanced Button Component
 * Single responsibility: Clickable button with mobile optimizations
 * Auto-detects mobile and applies appropriate styles
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, mobileOptimized = true, touchFeedback: _touchFeedback = true, ...props }, ref) => {
    const { isMobile, isTouchDevice } = useMobileDevice()
    const Comp = asChild ? Slot : "button"

    // Auto-adjust size for mobile if not explicitly set
    const effectiveSize = React.useMemo(() => {
      if (mobileOptimized && isMobile && !size) {
        return "mobile"
      }
      return size
    }, [mobileOptimized, isMobile, size])

    // Mobile-optimized classes
    const mobileClasses = mobileOptimized && isTouchDevice
      ? cn(
          // Touch optimization
          "touch-manipulation",
          // Remove tap highlight
          "[-webkit-tap-highlight-color:transparent]",
          // Active state for touch
          "active:scale-95 active:opacity-90",
          // Ensure minimum touch target
          "min-h-[44px]",
          // Smooth transitions
          "transition-all duration-200"
        )
      : ""

    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size: effectiveSize, className }),
          mobileClasses,
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
