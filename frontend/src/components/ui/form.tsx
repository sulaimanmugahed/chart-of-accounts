import type {
  ComponentPropsWithRef,
  ReactNode,
  SelectHTMLAttributes,
} from 'react'
import { useId } from 'react'
import { cn } from '@/lib/cn'

/* ------------------------------- Field ------------------------------- */

export interface FieldProps {
  label: string
  htmlFor?: string
  hint?: ReactNode
  error?: string
  required?: boolean
  className?: string
  children: ReactNode
}

export function Field({ label, htmlFor, hint, error, required, className, children }: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={htmlFor} className="text-xs font-semibold text-ink-700">
        {label}
        {required ? <span className="text-rose-600"> *</span> : null}
      </label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-rose-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-ink-500">{hint}</p>
      ) : null}
    </div>
  )
}

const CONTROL_BASE =
  'w-full rounded-xl border bg-white px-3 py-2 text-sm text-ink-800 shadow-sm transition-colors placeholder:text-ink-400 disabled:cursor-not-allowed disabled:bg-ink-100'

/* ------------------------------- Input ------------------------------- */

export interface InputProps extends ComponentPropsWithRef<'input'> {
  invalid?: boolean
}

export function Input({ className, invalid, ...rest }: InputProps) {
  return (
    <input
      className={cn(
        CONTROL_BASE,
        'h-10',
        invalid ? 'border-rose-400 focus:border-rose-500' : 'border-ink-300 focus:border-brand-500',
        className,
      )}
      {...rest}
    />
  )
}

/* ------------------------------ Textarea ------------------------------ */

export interface TextareaProps extends ComponentPropsWithRef<'textarea'> {
  invalid?: boolean
}

export function Textarea({ className, invalid, ...rest }: TextareaProps) {
  return (
    <textarea
      className={cn(
        CONTROL_BASE,
        'min-h-20 resize-y leading-6',
        invalid ? 'border-rose-400 focus:border-rose-500' : 'border-ink-300 focus:border-brand-500',
        className,
      )}
      {...rest}
    />
  )
}

/* ------------------------------- Select ------------------------------- */

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean
  placeholder?: string
  options?: Array<{ value: string | number; label: string; disabled?: boolean }>
}

export function Select({
  className,
  invalid,
  placeholder,
  options,
  children,
  ...rest
}: SelectProps) {
  return (
    <select
      className={cn(
        CONTROL_BASE,
        'h-10 appearance-none bg-[length:14px] bg-no-repeat pe-3 ps-3',
        invalid ? 'border-rose-400' : 'border-ink-300 focus:border-brand-500',
        className,
      )}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
        backgroundPosition: 'left 0.75rem center',
        paddingLeft: '2rem',
      }}
      {...rest}
    >
      {placeholder ? <option value="">{placeholder}</option> : null}
      {options
        ? options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))
        : children}
    </select>
  )
}

/* ------------------------------ Checkbox ------------------------------ */

export interface CheckboxProps extends Omit<ComponentPropsWithRef<'input'>, 'type'> {
  label: ReactNode
  description?: ReactNode
}

export function Checkbox({ label, description, className, ...rest }: CheckboxProps) {
  const id = useId()
  return (
    <div className={cn('flex items-start gap-2', className)}>
      <input
        id={rest.id ?? id}
        type="checkbox"
        className="mt-1 size-4 shrink-0 cursor-pointer rounded border-ink-300 accent-brand-700"
        {...rest}
      />
      <label htmlFor={rest.id ?? id} className="cursor-pointer select-none leading-5">
        <span className="text-sm text-ink-800">{label}</span>
        {description ? <span className="block text-xs text-ink-500">{description}</span> : null}
      </label>
    </div>
  )
}

/* ----------------------------- Radio cards ---------------------------- */

export interface RadioOption<T extends string | number> {
  value: T
  label: string
  description?: string
}

export interface RadioGroupProps<T extends string | number> {
  name: string
  value: T
  onChange: (value: T) => void
  options: RadioOption<T>[]
  className?: string
}

export function RadioGroup<T extends string | number>({
  name,
  value,
  onChange,
  options,
  className,
}: RadioGroupProps<T>) {
  return (
    <div className={cn('flex flex-col gap-2', className)} role="radiogroup">
      {options.map((option) => {
        const selected = option.value === value
        return (
          <label
            key={option.value}
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors',
              selected
                ? 'border-brand-500 bg-brand-50/60'
                : 'border-ink-200 bg-white hover:border-ink-300',
            )}
          >
            <input
              type="radio"
              name={name}
              className="mt-1 size-4 accent-brand-700"
              checked={selected}
              onChange={() => onChange(option.value)}
            />
            <span>
              <span className="block text-sm font-medium text-ink-800">{option.label}</span>
              {option.description ? (
                <span className="mt-0.5 block text-xs leading-5 text-ink-500">
                  {option.description}
                </span>
              ) : null}
            </span>
          </label>
        )
      })}
    </div>
  )
}
