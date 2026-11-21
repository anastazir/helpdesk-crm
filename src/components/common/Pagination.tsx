import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'

interface PaginationProps {
  page: number
  totalPages: number
  count: number
  pageSize: number
  onPageChange: (page: number) => void
}

const Pagination = ({
  page,
  totalPages,
  count,
  pageSize,
  onPageChange,
}: PaginationProps) => {
  const { t } = useTranslation()

  if (totalPages <= 1) return null

  const from = count === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, count)

  return (
    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        {t('pagination.showingRange', { from, to, total: count })}
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
          {t('pagination.previous')}
        </Button>
        <span className="text-sm text-muted-foreground">
          {t('pagination.pageOf', { page, total: totalPages })}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          {t('pagination.next')}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export default Pagination
