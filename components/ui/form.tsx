import React from 'react'
import { cn } from '@/lib/utils'
import { AlertCircle } from 'lucide-react'

interface FormGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const FormGroup = React.forwardRef<HTMLDivElement, FormGroupProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('form-group', className)} {...props}>
      {children}
    </div>
  )
)

FormGroup.displayName = 'FormGroup'

interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
  children: React.ReactNode
}

const FormLabel = React.forwardRef<HTMLLabelElement, FormLabelProps>(
  ({ required = false, className, children, ...props }, ref) => (
    <label
      ref={ref}
      className={cn('form-label', required && 'form-label-required', className)}
      {...props}
    >
      {children}
    </label>
  )
)

FormLabel.displayName = 'FormLabel'

interface FormInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn('form-input', className)}
      {...props}
    />
  )
)

FormInput.displayName = 'FormInput'

interface FormTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const FormTextarea = React.forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn('form-textarea', className)}
      {...props}
    />
  )
)

FormTextarea.displayName = 'FormTextarea'

interface FormSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode
}

const FormSelect = React.forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn('form-select', className)}
      {...props}
    >
      {children}
    </select>
  )
)

FormSelect.displayName = 'FormSelect'

interface FormErrorProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const FormError = React.forwardRef<HTMLDivElement, FormErrorProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('form-error', className)}
      {...props}
    >
      <AlertCircle size={14} className="flex-shrink-0" />
      <span>{children}</span>
    </div>
  )
)

FormError.displayName = 'FormError'

interface FormHintProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode
}

const FormHint = React.forwardRef<HTMLParagraphElement, FormHintProps>(
  ({ className, children, ...props }, ref) => (
    <p ref={ref} className={cn('form-hint', className)} {...props}>
      {children}
    </p>
  )
)

FormHint.displayName = 'FormHint'

export {
  FormGroup,
  FormLabel,
  FormInput,
  FormTextarea,
  FormSelect,
  FormError,
  FormHint,
}
