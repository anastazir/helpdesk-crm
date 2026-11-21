import { MoreHorizontal } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'

import StatusBadge from '@/components/complaints/StatusBadge'
import SLATimer from '@/components/complaints/SLATimer'
import EmptyState from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { ComplaintListItem } from '@/types/complaint.types'
import { formatDate, formatDuration } from '@/utils/formatters'

interface ComplaintTableProps {
  complaints: ComplaintListItem[]
  compact?: boolean
  showActions?: boolean
  onAssign?: (complaint: ComplaintListItem) => void
}

const ComplaintTable = ({
  complaints,
  compact = false,
  showActions = true,
  onAssign,
}: ComplaintTableProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  if (complaints.length === 0) {
    return <EmptyState title={t('complaint.noComplaints')} />
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-white dark:bg-slate-900">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('complaint.complaintId')}</TableHead>
            <TableHead>{t('complaint.callerName')}</TableHead>
            {!compact && <TableHead>{t('complaint.callerPhone')}</TableHead>}
            <TableHead>{t('complaint.zone')}</TableHead>
            {!compact && <TableHead>{t('complaint.issues')}</TableHead>}
            <TableHead>{t('complaint.status')}</TableHead>
            <TableHead>{t('complaint.assignedEngineer')}</TableHead>
            <TableHead>{t('complaint.timeOpen')}</TableHead>
            {!compact && <TableHead>{t('complaint.timeInStatus')}</TableHead>}
            {!compact && <TableHead>{t('complaint.createdAt')}</TableHead>}
            {showActions && !compact && <TableHead>{t('common.actions')}</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {complaints.map((complaint) => (
            <TableRow
              key={complaint.id}
              className="cursor-pointer"
              onClick={() => navigate(`/complaints/${complaint.id}`)}
            >
              <TableCell>
                <Link
                  to={`/complaints/${complaint.id}`}
                  className="font-semibold text-primary hover:underline"
                  onClick={(event) => event.stopPropagation()}
                >
                  #{complaint.id}
                </Link>
              </TableCell>
              <TableCell>{complaint.caller_name ?? t('complaint.notRecorded')}</TableCell>
              {!compact && <TableCell>{complaint.caller_phone}</TableCell>}
              <TableCell>{complaint.zone?.name ?? t('complaint.notRecorded')}</TableCell>
              {!compact && (
                <TableCell className="max-w-48">
                  <span className="line-clamp-2">
                    {complaint.issues.map((issue) => issue.name).join(', ')}
                  </span>
                </TableCell>
              )}
              <TableCell>
                <StatusBadge status={complaint.status} />
              </TableCell>
              <TableCell>
                {complaint.assigned_engineer ?? t('common.unassigned')}
              </TableCell>
              <TableCell>
                <SLATimer seconds={complaint.time_open_seconds} />
              </TableCell>
              {!compact && (
                <TableCell className="text-sm text-muted-foreground">
                  {formatDuration(complaint.time_in_status_seconds)}
                </TableCell>
              )}
              {!compact && (
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                  {formatDate(complaint.created_at)}
                </TableCell>
              )}
              {showActions && !compact && (
                <TableCell onClick={(event) => event.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={t('common.actions')}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onSelect={() => navigate(`/complaints/${complaint.id}`)}
                      >
                        {t('common.viewDetails')}
                      </DropdownMenuItem>
                      {onAssign && !complaint.assigned_engineer && (
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onSelect={() => onAssign(complaint)}
                        >
                          {t('complaint.assignEngineer')}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default ComplaintTable
