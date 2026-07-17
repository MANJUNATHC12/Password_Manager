import { useState } from 'react'
import { formatCurrency } from '@/config/expenses'

export interface DonutSlice {
  label: string
  value: number
  color: string
}

interface Props {
  data: DonutSlice[]
  /** center label, e.g. "Total spend" */
  centerLabel?: string
  centerValue?: string
  emptyText?: string
}

const SIZE = 220
const STROKE = 30
const R = (SIZE - STROKE) / 2
const CIRC = 2 * Math.PI * R
const GAP = 0.012 // fraction of circle used as a gap between slices

export function DonutChart({
  data,
  centerLabel,
  centerValue,
  emptyText = 'No data',
}: Props) {
  const [hover, setHover] = useState<number | null>(null)
  const total = data.reduce((s, d) => s + d.value, 0)
  const adjustedTotal = total * (1 + GAP * data.length)

  if (total <= 0) {
    return (
      <div className="flex h-[220px] items-center justify-center text-sm text-slate-400">
        {emptyText}
      </div>
    )
  }

  let offset = 0
  const segments = data.map((d, i) => {
    const frac = d.value / adjustedTotal
    const len = frac * CIRC
    const seg = {
      i,
      color: d.color,
      dash: `${len} ${CIRC - len}`,
      offset: -offset * CIRC,
      label: d.label,
      value: d.value,
      pct: (d.value / total) * 100,
    }
    offset += frac
    return seg
  })

  const focused = hover != null ? data[hover] : null

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          role="img"
          aria-label="Category breakdown"
        >
          <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
            {segments.map((s) => (
              <circle
                key={s.i}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={R}
                fill="none"
                stroke={s.color}
                strokeWidth={hover === s.i ? STROKE + 4 : STROKE}
                strokeDasharray={s.dash}
                strokeDashoffset={s.offset}
                style={{
                  transition: 'stroke-width 120ms ease, opacity 120ms ease',
                  opacity: hover == null || hover === s.i ? 1 : 0.45,
                  cursor: 'pointer',
                }}
                onMouseEnter={() => setHover(s.i)}
                onMouseLeave={() => setHover(null)}
              />
            ))}
          </g>
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-slate-500">
            {focused ? focused.label : centerLabel ?? 'Total'}
          </span>
          <span className="text-lg font-bold text-slate-900">
            {focused ? formatCurrency(focused.value) : centerValue ?? formatCurrency(total)}
          </span>
          {focused && (
            <span className="text-xs text-slate-400">
              {((focused.value / total) * 100).toFixed(1)}%
            </span>
          )}
        </div>
      </div>

      <div className="w-full min-w-0 space-y-1.5">
        {data.map((d, i) => (
          <button
            key={d.label}
            type="button"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            className="flex w-full items-center gap-2 rounded-md px-1 py-0.5 text-left"
          >
            <span
              className="h-3 w-3 shrink-0 rounded-sm"
              style={{ backgroundColor: d.color }}
            />
            <span className="min-w-0 flex-1 truncate text-sm text-slate-600">
              {d.label}
            </span>
            <span className="text-sm font-medium text-slate-900">
              {formatCurrency(d.value)}
            </span>
            <span className="w-12 text-right text-xs text-slate-400">
              {((d.value / total) * 100).toFixed(0)}%
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
