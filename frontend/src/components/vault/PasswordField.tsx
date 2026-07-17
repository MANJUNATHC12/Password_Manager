import { useState } from 'react'
import { Eye, EyeOff, Copy, Check } from 'lucide-react'
import { cn } from '@/utils/cn'

export function PasswordField({
  value,
  className,
}: {
  value: string
  className?: string
}) {
  const [show, setShow] = useState(false)
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <span className="font-mono text-sm text-slate-700">
        {show ? value : '•'.repeat(Math.min(Math.max(value.length, 4), 16))}
      </span>
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="rounded p-1 text-slate-400 hover:text-slate-600"
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
      <button
        type="button"
        onClick={copy}
        className="rounded p-1 text-slate-400 hover:text-slate-600"
        aria-label="Copy password"
      >
        {copied ? (
          <Check className="h-4 w-4 text-primary-600" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </button>
    </div>
  )
}
