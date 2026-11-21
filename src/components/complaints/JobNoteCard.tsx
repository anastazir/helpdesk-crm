import { useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { StickyNote } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'

import { complaintsApi } from '@/api/complaints.api'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { JobNote } from '@/types/complaint.types'
import { getErrorMessage } from '@/utils/errors'
import { formatDate } from '@/utils/formatters'
import { logger } from '@/utils/logger'

interface JobNoteCardProps {
  complaintId: number
  jobNote: JobNote | null
  canSubmit: boolean
  onSubmitted: () => void
}

interface JobNoteFormValues {
  text: string
}

const JobNoteCard = ({
  complaintId,
  jobNote,
  canSubmit,
  onSubmitted,
}: JobNoteCardProps) => {
  const { t } = useTranslation()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const schema = useMemo(
    () =>
      z.object({
        text: z.string().trim().min(1, t('validation.required')),
      }),
    [t],
  )

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<JobNoteFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { text: '' },
  })

  const submit = async (values: JobNoteFormValues) => {
    setSubmitting(true)
    setError(null)
    try {
      await complaintsApi.submitJobNote(complaintId, { text: values.text })
      logger.info('[JOB NOTE] Submitted.', { complaintId })
      reset({ text: '' })
      toast.success(t('complaint.jobNoteSubmitted'))
      onSubmitted()
    } catch (submitError) {
      logger.error('[JOB NOTE] Submission failed.', submitError)
      const message = getErrorMessage(submitError, t('errors.actionFailed'))
      setError(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (jobNote) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:bg-amber-950/30">
        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
          <StickyNote className="h-4 w-4" />
          <span className="text-sm font-semibold">{t('complaint.jobNote')}</span>
        </div>
        <p className="mt-2 whitespace-pre-wrap text-sm text-amber-900 dark:text-amber-100">
          {jobNote.text}
        </p>
        <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
          {jobNote.created_by?.full_name ?? t('common.notRecorded')} ·{' '}
          {formatDate(jobNote.created_at)}
        </p>
      </div>
    )
  }

  if (!canSubmit) {
    return <p className="text-sm text-muted-foreground">{t('complaint.noJobNote')}</p>
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-2">
      <p className="text-sm text-muted-foreground">{t('complaint.noJobNote')}</p>
      <Textarea
        rows={3}
        placeholder={t('complaint.jobNotePlaceholder')}
        {...register('text')}
      />
      {errors.text && <p className="text-xs text-red-600">{errors.text.message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? t('common.saving') : t('complaint.submitJobNote')}
      </Button>
    </form>
  )
}

export default JobNoteCard
