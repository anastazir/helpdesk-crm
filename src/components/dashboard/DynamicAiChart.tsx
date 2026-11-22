import { useTranslation } from 'react-i18next'

import type { AnalyticsResult } from '@/api/ai.api'

interface DynamicAiChartProps {
  result: AnalyticsResult
}

const COLORS = [
  '#2563eb',
  '#059669',
  '#d97706',
  '#7c3aed',
  '#dc2626',
  '#0891b2',
  '#65a30d',
  '#c2410c',
]

const numberValue = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const displayValue = (value: unknown): string => {
  if (value === null || value === undefined) return '—'
  return String(value)
}

const TableView = ({ result }: DynamicAiChartProps) => (
  <div className="overflow-x-auto rounded-lg border border-border">
    <table className="w-full text-left text-sm">
      <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
        <tr>
          {result.columns.map((column) => (
            <th key={column} className="whitespace-nowrap px-3 py-2 font-medium">
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {result.rows.map((row, index) => (
          <tr key={index} className="border-t border-border">
            {result.columns.map((column) => (
              <td key={column} className="whitespace-nowrap px-3 py-2">
                {displayValue(row[column])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

const KpiView = ({ result }: DynamicAiChartProps) => {
  const yField = result.chart.y
  const first = result.rows[0]
  const fallbackKey = result.columns.find(
    (column) =>
      typeof first?.[column] === 'number' ||
      (!Number.isNaN(Number(first?.[column])) &&
        first?.[column] !== null &&
        first?.[column] !== ''),
  )
  const key = yField ?? fallbackKey
  const value = key && first ? first[key] : result.row_count

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-6">
      <p className="text-sm text-muted-foreground">{result.title}</p>
      <p className="mt-2 text-4xl font-semibold text-primary">
        {displayValue(value)}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {result.row_count} row{result.row_count === 1 ? '' : 's'}
      </p>
    </div>
  )
}

const BarView = ({ result }: DynamicAiChartProps) => {
  const xField = result.chart.x
  const yField = result.chart.y
  if (!xField || !yField) return <TableView result={result} />
  const rows = result.rows.slice(0, 30)
  const max = Math.max(...rows.map((row) => numberValue(row[yField])), 1)

  return (
    <div className="space-y-2" role="img" aria-label={result.title}>
      {rows.map((row, index) => {
        const value = numberValue(row[yField])
        return (
          <div key={index} className="grid grid-cols-[minmax(90px,32%)_1fr_auto] items-center gap-2">
            <span className="truncate text-xs text-muted-foreground" title={displayValue(row[xField])}>
              {displayValue(row[xField])}
            </span>
            <div className="h-5 overflow-hidden rounded bg-muted">
              <div
                className="h-full rounded bg-primary transition-all"
                style={{ width: `${Math.max(2, (value / max) * 100)}%` }}
              />
            </div>
            <span className="min-w-10 text-right text-xs font-medium">
              {value.toLocaleString()}
            </span>
          </div>
        )
      })}
    </div>
  )
}

const LineView = ({ result, area }: { result: AnalyticsResult; area: boolean }) => {
  const xField = result.chart.x
  const yField = result.chart.y
  if (!xField || !yField) return <TableView result={result} />
  const rows = result.rows.slice(0, 60)
  const values = rows.map((row) => numberValue(row[yField]))
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const width = 640
  const height = 230
  const padding = 28
  const chartWidth = width - padding * 2
  const chartHeight = height - padding * 2
  const points = rows.map((row, index) => {
    const x = padding + (rows.length === 1 ? chartWidth / 2 : (index / (rows.length - 1)) * chartWidth)
    const y = padding + chartHeight - ((numberValue(row[yField]) - min) / Math.max(max - min, 1)) * chartHeight
    return { x, y, label: displayValue(row[xField]) }
  })
  const pointString = points.map((point) => `${point.x},${point.y}`).join(' ')
  const areaString = `${padding},${height - padding} ${pointString} ${width - padding},${height - padding}`

  return (
    <div className="overflow-hidden rounded-lg border border-border p-2" role="img" aria-label={result.title}>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-60 w-full">
        {[0, 1, 2, 3].map((step) => {
          const y = padding + (step / 3) * chartHeight
          return (
            <line
              key={step}
              x1={padding}
              x2={width - padding}
              y1={y}
              y2={y}
              className="stroke-border"
              strokeDasharray="3 4"
            />
          )
        })}
        {area && <polygon points={areaString} className="fill-primary/10" />}
        <polyline
          points={pointString}
          fill="none"
          strokeWidth="2"
          className="stroke-primary"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {points.map((point, index) => (
          <circle key={index} cx={point.x} cy={point.y} r="3" className="fill-primary" />
        ))}
        {points.length > 0 && (
          <>
            <text x={padding} y={height - 8} className="fill-muted-foreground" fontSize="10">
              {points[0].label}
            </text>
            <text
              x={width - padding}
              y={height - 8}
              textAnchor="end"
              className="fill-muted-foreground"
              fontSize="10"
            >
              {points[points.length - 1].label}
            </text>
          </>
        )}
        <text x={padding} y={14} className="fill-muted-foreground" fontSize="10">
          {max.toLocaleString()}
        </text>
        <text x={padding} y={height - padding + 12} className="fill-muted-foreground" fontSize="10">
          {min.toLocaleString()}
        </text>
      </svg>
    </div>
  )
}

const DonutView = ({ result }: DynamicAiChartProps) => {
  const xField = result.chart.x
  const yField = result.chart.y
  if (!xField || !yField) return <TableView result={result} />
  const rows = result.rows.slice(0, 12)
  const total = rows.reduce((sum, row) => sum + Math.max(0, numberValue(row[yField])), 0)
  if (total <= 0) return <TableView result={result} />
  let running = 0
  const segments = rows.map((row, index) => {
    const value = Math.max(0, numberValue(row[yField]))
    const start = (running / total) * 360
    running += value
    const end = (running / total) * 360
    return { row, value, start, end, color: COLORS[index % COLORS.length] }
  })
  const gradient = segments
    .map((segment) => `${segment.color} ${segment.start}deg ${segment.end}deg`)
    .join(', ')

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <div
        className="relative h-40 w-40 shrink-0 rounded-full"
        style={{ background: `conic-gradient(${gradient})` }}
        role="img"
        aria-label={result.title}
      >
        <div className="absolute inset-6 flex flex-col items-center justify-center rounded-full bg-background">
          <span className="text-2xl font-semibold">{total.toLocaleString()}</span>
          <span className="text-xs text-muted-foreground">total</span>
        </div>
      </div>
      <div className="w-full min-w-0 space-y-2">
        {segments.map((segment, index) => (
          <div key={index} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: segment.color }} />
              <span className="truncate">{displayValue(segment.row[xField])}</span>
            </span>
            <span className="shrink-0 font-medium">{segment.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const DynamicAiChart = ({ result }: DynamicAiChartProps) => {
  const { t } = useTranslation()
  if (result.rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
        {t('ai.analytics.emptyResult')}
      </p>
    )
  }
  if (result.row_count > 500 || result.chart.type === 'table') {
    return <TableView result={result} />
  }
  if (result.chart.type === 'kpi') return <KpiView result={result} />
  if (result.chart.type === 'bar') return <BarView result={result} />
  if (result.chart.type === 'line') return <LineView result={result} area={false} />
  if (result.chart.type === 'area') return <LineView result={result} area />
  if (result.chart.type === 'donut') return <DonutView result={result} />
  return <TableView result={result} />
}

export default DynamicAiChart
