import { useTranslation } from 'react-i18next'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { ComplaintListItem } from '@/types/complaint.types'
import type { Zone } from '@/types/zone.types'

interface ZonePerformanceProps {
  zones: Zone[]
  complaints: ComplaintListItem[]
}

const ACTIVE_STATUSES = new Set(['open', 'assigned', 'in_progress', 'parts_requested', 'parts_provided'])

const ZonePerformance = ({ zones, complaints }: ZonePerformanceProps) => {
  const { t } = useTranslation()

  const rows = zones
    .map((zone) => {
      const zoneComplaints = complaints.filter(
        (complaint) => complaint.zone?.id === zone.id,
      )
      return {
        zone,
        total: zone.complaint_count ?? zoneComplaints.length,
        active: zoneComplaints.filter((complaint) =>
          ACTIVE_STATUSES.has(complaint.status),
        ).length,
        closed: zoneComplaints.filter(
          (complaint) => complaint.status === 'closed',
        ).length,
        engineers: zone.engineer_count ?? 0,
      }
    })
    .sort((a, b) => b.total - a.total)

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('dashboard.noZones')}</p>
  }

  return (
    <div className="min-w-0 w-full overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('dashboard.zoneColumn')}</TableHead>
            <TableHead className="text-right">{t('dashboard.totalColumn')}</TableHead>
            <TableHead className="text-right">{t('dashboard.activeColumn')}</TableHead>
            <TableHead className="text-right">{t('dashboard.closedColumn')}</TableHead>
            <TableHead className="text-right">
              {t('dashboard.engineersColumn')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.zone.id}>
              <TableCell className="font-medium">{row.zone.name}</TableCell>
              <TableCell className="text-right">{row.total}</TableCell>
              <TableCell className="text-right text-amber-600">{row.active}</TableCell>
              <TableCell className="text-right text-green-700">{row.closed}</TableCell>
              <TableCell className="text-right">{row.engineers}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default ZonePerformance
