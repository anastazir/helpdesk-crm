import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Textarea } from '@/components/ui/textarea'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: (remark?: string) => void
  destructive?: boolean
  loading?: boolean
  showRemarkInput?: boolean
  remarkRequired?: boolean
  remarkPlaceholder?: string
  remarkLabel?: string
}

const ConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  destructive = false,
  loading = false,
  showRemarkInput = false,
  remarkRequired = false,
  remarkPlaceholder,
  remarkLabel,
}: ConfirmDialogProps) => {
  const { t } = useTranslation()
  const [remark, setRemark] = useState('')

  useEffect(() => {
    if (!open) setRemark('')
  }, [open])

  const confirmDisabled = loading || (remarkRequired && remark.trim().length === 0)

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        {showRemarkInput && (
          <div className="space-y-2">
            <label
              htmlFor="confirm-remark"
              className="text-sm font-medium text-foreground"
            >
              {remarkLabel ?? t('complaint.statusRemark')}
              {remarkRequired && <span className="ml-1 text-red-500">*</span>}
            </label>
            <Textarea
              id="confirm-remark"
              value={remark}
              onChange={(event) => setRemark(event.target.value)}
              placeholder={remarkPlaceholder ?? t('complaint.statusRemarkPlaceholder')}
              rows={3}
            />
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>
            {cancelLabel ?? t('common.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={confirmDisabled}
            className={cn(
              destructive && buttonVariants({ variant: 'destructive' }),
            )}
            onClick={(event) => {
              event.preventDefault()
              onConfirm(showRemarkInput ? remark : undefined)
            }}
          >
            {loading ? t('common.saving') : (confirmLabel ?? t('common.confirm'))}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default ConfirmDialog
