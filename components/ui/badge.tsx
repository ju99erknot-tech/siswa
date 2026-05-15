import React from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'outline'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  children: React.ReactNode
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'primary', className, children, ...props }, ref) => (
    <span
      ref={ref}
      className={cn('badge', `badge-${variant}`, className)}
      {...props}
    >
      {children}
    </span>
  )
)

Badge.displayName = 'Badge'

type AlertVariant = 'success' | 'warning' | 'danger' | 'info'

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant
  icon?: React.ReactNode
  children: React.ReactNode
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ variant = 'info', icon, className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('alert', `alert-${variant}`, className)}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <div>{children}</div>
    </div>
  )
)

Alert.displayName = 'Alert'

interface AlertTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode
}

const AlertTitle = React.forwardRef<HTMLHeadingElement, AlertTitleProps>(
  ({ className, children, ...props }, ref) => (
    <h5 ref={ref} className={cn('font-semibold mb-1', className)} {...props}>
      {children}
    </h5>
  )
)

AlertTitle.displayName = 'AlertTitle'

interface AlertDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode
}

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  AlertDescriptionProps
>(({ className, children, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm', className)} {...props}>
    {children}
  </p>
))

AlertDescription.displayName = 'AlertDescription'

export { Badge, Alert, AlertTitle, AlertDescription }
