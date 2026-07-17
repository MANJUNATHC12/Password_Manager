import { useState } from 'react'
import { formatCurrency } from '@/config/expenses'

export interface BarDatum {
  label: string
  value: number
  /** optional per-bar color; falls back to color */
  color?: string
}

interface Props {
  data: BarDatum[]
  color?: string
  /** height of the plot area in px */
  height?: number
  emptyText?: string
  /** format the value shown in tooltip/label */
  formatValue?: (v: number) => string
  /** show value on top of each bar */
  showValues?: boolean
}

export function BarChart({
  data,
  color = '#6366f1',
  height = 220,
  emptyText = 'No data',
  formatValue = formatCurrency,
  showValues = false,
}: Props) {
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(0, ...data.map((d) => d.value))
  const width = 600 // viewBox width; scales responsively

  if (data.length === 0 || max <= 0) {
    return (
      <div
        className="flex items-center justify-center text-sm text-slate-400"
        style={{ height }}
      >
        {emptyText}
      </div>
    )
  }

  const padX = 16
  const padTop = showValues ? 22 : 10
  const padBottom = 28
  const innerW = width - padX * 2
  const innerH = height - padTop - padBottom
  const slot = innerW / data.length
  const barW = Math.min(46, slot * 0.6)

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        role="img"
        aria-label="Bar chart"
        style={{ display: 'block' }}
      >
        {/* baseline */}
        <line
          x1={padX}
          y1={padTop + innerH}
          x2={width - padX}
          y2={padTop + innerH}
          stroke="#e2e8f0"
          strokeWidth={1}
        />
        {data.map((d, i) => {
          const h = max > 0 ? (d.value / max) * innerH : 0
          const x = padX + slot * i + (slot - barW) / 2
          const y = padTop + innerH - h
          const fill = d.color ?? color
          const active = hover === i
          return (
            <g
              key={i}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              style={{ cursor: 'pointer' }}
            >
              <rect
                x={padX + slot * i}
                y={padTop}
                width={slot}
                height={innerH}
                fill="transparent"
              />
              <rect
                x={x}
                y={y}
                width={barW}
                height={Math.max(0, h)}
                rx={4}
                fill={fill}
                opacity={hover == null || active ? 1 : 0.55}
                style={{ transition: 'opacity 120ms ease' }}
              />
              {showValues && h > 0 && (
                <text
                  x={x + barW / 2}
                  y={y - 6}
                  textAnchor="middle"
                  className="fill-slate-500"
                  style={{ fontSize: 10 }}
                >
                  {formatValue(d.value)}
                </text>
              )}
              <text
                x={x + barW / 2}
                y={height - 10}
                textAnchor="middle"
                className="fill-slate-500"
                style={{ fontSize: 10 }}
              >
                {d.label.length > 6 ? d.label.slice(0, 6) : d.label}
              </text>
              {active && (
                <g>
                  <text
                    x={Math.min(width - 4, Math.max(4, x + barW / 2))}
                    y={padTop - 6}
                    textAnchor="middle"
                    className="fill-slate-900 font-semibold"
                    style={{ fontSize: 11 }}
                  >
                    {formatValue(d.value)}
                  </text>
                </g>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
