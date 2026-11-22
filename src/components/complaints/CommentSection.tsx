import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'

import { commentsApi } from '@/api/comments.api'
import RoleBadge from '@/components/common/RoleBadge'
import SpeechButton from '@/components/common/SpeechButton'
import UserAvatar from '@/components/common/UserAvatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { Comment } from '@/types/complaint.types'
import type { User } from '@/types/auth.types'
import { getErrorMessage } from '@/utils/errors'
import { formatDate } from '@/utils/formatters'
import { logger } from '@/utils/logger'

interface CommentSectionProps {
  complaintId: number
  comments: Comment[]
  currentUser: User
  canComment: boolean
  onChanged: () => void
}

interface CommentFormValues {
  body: string
}

const CommentSection = ({
  complaintId,
  comments,
  currentUser,
  canComment,
  onChanged,
}: CommentSectionProps) => {
  const { t, i18n } = useTranslation()
  const [editingId, setEditingId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const schema = useMemo(
    () =>
      z.object({
        body: z.string().trim().min(1, t('validation.commentRequired')),
      }),
    [t],
  )

  const createForm = useForm<CommentFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { body: '' },
  })

  const editForm = useForm<CommentFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { body: '' },
  })

  useEffect(() => {
    if (editingId === null) {
      editForm.reset({ body: '' })
    }
  }, [editingId, editForm])

  const lastCommentId = comments.length > 0 ? comments[comments.length - 1].id : null

  const createComment = async (values: CommentFormValues) => {
    setSubmitting(true)
    setError(null)
    try {
      await commentsApi.create(complaintId, values.body)
      logger.info('[COMMENT] Comment added.', { complaintId })
      createForm.reset({ body: '' })
      toast.success(t('complaint.commentAdded'))
      onChanged()
    } catch (createError) {
      logger.error('[COMMENT] Failed to add comment.', createError)
      const message = getErrorMessage(createError, t('errors.saveFailed'))
      setError(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const startEdit = (comment: Comment) => {
    setEditingId(comment.id)
    editForm.reset({ body: comment.body })
  }

  const saveEdit = async (values: CommentFormValues) => {
    if (editingId === null) return
    setSavingEdit(true)
    setError(null)
    try {
      await commentsApi.update(complaintId, editingId, values.body)
      logger.info('[COMMENT] Comment updated.', { complaintId, commentId: editingId })
      setEditingId(null)
      toast.success(t('complaint.commentUpdated'))
      onChanged()
    } catch (editError) {
      logger.error('[COMMENT] Failed to update comment.', editError)
      const message = getErrorMessage(editError, t('errors.saveFailed'))
      setError(message)
      toast.error(message)
    } finally {
      setSavingEdit(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-600">{error}</p>}

      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('complaint.noComments')}</p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => {
            const isEditing = editingId === comment.id
            const canEdit =
              canComment &&
              comment.author.id === currentUser.id &&
              comment.id === lastCommentId

            return (
              <div key={comment.id} className="flex gap-3">
                <UserAvatar
                  id={comment.author.id}
                  fullName={comment.author.full_name}
                  className="h-8 w-8 shrink-0"
                />
                <div className="min-w-0 flex-1 rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{comment.author.full_name}</span>
                    <RoleBadge role={comment.author.role} className="text-[10px]" />
                    <span className="text-xs text-muted-foreground">
                      {formatDate(comment.created_at)}
                    </span>
                    {comment.is_edited && (
                      <span className="text-xs italic text-muted-foreground">
                        {t('common.edited')}
                      </span>
                    )}
                    {canEdit && !isEditing && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="ml-auto h-7 w-7"
                        aria-label={t('complaint.editComment')}
                        onClick={() => startEdit(comment)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>

                  {isEditing ? (
                    <form
                      className="mt-2 space-y-2"
                      onSubmit={editForm.handleSubmit(saveEdit)}
                    >
                      <Textarea rows={3} {...editForm.register('body')} />
                      {editForm.formState.errors.body && (
                        <p className="text-xs text-red-600">
                          {editForm.formState.errors.body.message}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <Button type="submit" size="sm" disabled={savingEdit}>
                          {t('complaint.saveComment')}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={savingEdit}
                          onClick={() => setEditingId(null)}
                        >
                          {t('complaint.cancelEdit')}
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                      {comment.body}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {canComment && (
        <form
          className="space-y-2 border-t border-border pt-4"
          onSubmit={createForm.handleSubmit(createComment)}
        >
          <div className="flex items-start gap-2">
            <Textarea
              rows={3}
              placeholder={t('complaint.addCommentPlaceholder')}
              {...createForm.register('body')}
            />
            <SpeechButton
              onTranscript={(text) =>
                createForm.setValue(
                  'body',
                  `${createForm.getValues('body')} ${text}`.trim(),
                  { shouldDirty: true },
                )
              }
              language={i18n.language.startsWith('hi') ? 'hi-IN' : 'en-IN'}
              disabled={submitting}
            />
          </div>
          {createForm.formState.errors.body && (
            <p className="text-xs text-red-600">
              {createForm.formState.errors.body.message}
            </p>
          )}
          <div className="flex justify-end">
            <Button type="submit" disabled={submitting}>
              {submitting ? t('complaint.sending') : t('complaint.send')}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}

export default CommentSection
