'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SheetProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}

interface SheetContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: 'left' | 'right' | 'top' | 'bottom'
  onClose?: () => void
}

const Sheet = ({ open, onOpenChange, children }: SheetProps) => {
  // Render nothing if not open
  if (!open) return null;
  
  // Portal content to body to avoid layout issues
  return (
    <>
      {children}
    </>
  )
}

const SheetOverlay = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "sheet-overlay",
      "fixed inset-0 bg-black/50",
      "animate-in fade-in-0",
      className
    )}
    {...props}
  />
))
SheetOverlay.displayName = "SheetOverlay"

const SheetContent = React.forwardRef<HTMLDivElement, SheetContentProps>(
  ({ side = 'left', className, children, onClose, ...props }, ref) => {
    const sideClasses = {
      left: 'left-0 top-0 h-full w-[240px] animate-in slide-in-from-left',
      right: 'right-0 top-0 h-full w-[240px] animate-in slide-in-from-right',
      top: 'top-0 left-0 w-full h-[240px] animate-in slide-in-from-top',
      bottom: 'bottom-0 left-0 w-full h-[240px] animate-in slide-in-from-bottom',
    }

    return (
      <>
        <SheetOverlay onClick={onClose} />
        <div
          ref={ref}
          className={cn(
            "sheet-content",
            "fixed bg-white shadow-lg",
            "focus:outline-none",
            sideClasses[side],
            className
          )}
          {...props}
        >
          {children}
        </div>
      </>
    )
  }
)
SheetContent.displayName = "SheetContent"

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
SheetHeader.displayName = "SheetHeader"

const SheetTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-lg font-semibold text-gray-900", className)}
    {...props}
  />
))
SheetTitle.displayName = "SheetTitle"

export { Sheet, SheetContent, SheetHeader, SheetTitle } 