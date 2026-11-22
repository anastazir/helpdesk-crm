import { useId } from 'react'

import { useTranslation } from 'react-i18next'

export interface TrendPoint {
  label: string
  count: number
}

interface TrendChartProps {
  data: TrendPoint[]
}

const TrendChart = ({ data }: TrendChartProps) => {
  const { t } = useTranslation()
  const gradientId = `trend-${useId().replace(/:/g, '')}`
  const width = 640
  const height = 200
  const paddingX = 28
  const paddingTop = 24
  const paddingBottom = 28
  const maxCount = Math.max(1, ...data.map((point) => point.count))
  const usableWidth = width - paddingX * 2
  const usableHeight = height - paddingTop - paddingBottom
  const step = data.length > 1 ? usableWidth / (data.length - 1) : usableWidth

  const points = data.map((point, index) => {
    const x = paddingX + index * step
    const y = paddingTop + usableHeight - (point.count / maxCount) * usableHeight
    return { ...point, x, y }
  })

  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')
  const areaPath =
    points.length > 0
      ? `M ${points[0].x} ${height - paddingBottom} ${linePath.replace(
          /^M/,
          'L',
        )} L ${points[points.length - 1].x} ${height - paddingBottom} Z`
      : ''

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={t('dashboard.intakeTrend')}
        className="h-52 w-full"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              style={{ stopColor: 'hsl(var(--primary))' }}
              stopOpacity="0.28"
            />
            <stop
              offset="100%"
              style={{ stopColor: 'hsl(var(--primary))' }}
              stopOpacity="0"
            />
          </linearGradient>
        </defs>

        {[0, 1, 2, 3].map((line) => {
          const y = paddingTop + (usableHeight / 3) * line
          return (
            <line
              key={line}
              x1={paddingX}
              x2={width - paddingX}
              y1={y}
              y2={y}
              stroke="currentColor"
              strokeOpacity="0.08"
              strokeDasharray="4 4"
            />
          )
        })}

        {areaPath && <path d={areaPath} fill={`url(#${gradientId})`} />}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="stroke-primary"
          />
        )}

        {points.map((point) => (
          <g key={point.label}>
            <circle
              cx={point.x}
              cy={point.y}
              r="4"
              fill="#FFFFFF"
              strokeWidth="2.5"
              className="stroke-primary"
            />
            <text
              x={point.x}
              y={point.y - 12}
              textAnchor="middle"
              className="fill-slate-500 text-[11px]"
            >
              {point.count}
            </text>
          </g>
        ))}
      </svg>

      <div className="mt-1 flex justify-between px-2 text-xs text-muted-foreground">
        {data.map((point) => (
          <span key={point.label}>{point.label}</span>
        ))}
      </div>
    </div>
  )
}

export default TrendChart
