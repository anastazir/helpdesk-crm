import { useEffect, useRef, useState } from 'react'
import { Camera, FileText, Image as ImageIcon, Upload, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { uploadsApi } from '@/api/uploads.api'
import { Button } from '@/components/ui/button'
import type { FileUploadBatch, FileUploadItem } from '@/types/complaint.types'
import { getErrorMessage } from '@/utils/errors'
import { formatDate, toMediaUrl } from '@/utils/formatters'
import { logger } from '@/utils/logger'

interface FileUploadSectionProps {
  complaintId: number
  uploads: FileUploadBatch[]
  canUpload: boolean
  onUploaded: () => void
}

interface SelectedFile {
  file: File
  preview: string | null
}

const MAX_FILE_SIZE = 10 * 1024 * 1024
const IMAGE_TYPES = ['image/jpeg', 'image/png']

const isImage = (file: File): boolean => IMAGE_TYPES.includes(file.type)

const validateFiles = (
  files: File[],
  t: (key: string) => string,
): string | null => {
  if (files.length === 0) return null

  const images = files.filter((file) => isImage(file))
  const pdfs = files.filter((file) => file.type === 'application/pdf')
  const other = files.find(
    (file) => !isImage(file) && file.type !== 'application/pdf',
  )

  if (other) return t('complaint.uploadHint')
  if (images.length > 0 && pdfs.length > 0) return t('complaint.uploadHint')
  if (images.length > 3) return t('complaint.uploadHint')
  if (pdfs.length > 1) return t('complaint.uploadHint')
  if (files.some((file) => file.size > MAX_FILE_SIZE)) return t('complaint.uploadHint')

  return null
}

const FileUploadItemCard = ({ file }: { file: FileUploadItem }) => {
  const { t } = useTranslation()
  const url = toMediaUrl(file.file_url)

  if (file.file_type === 'image') {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="group block w-full min-w-0 overflow-hidden rounded-lg border border-border bg-white dark:bg-slate-900"
      >
        <img
          src={url}
          alt={t('complaint.filePreviewAlt')}
          className="h-28 w-full object-cover transition-transform group-hover:scale-105"
        />
        <p className="truncate px-2 py-1 text-xs text-muted-foreground" title={file.original_name}>
          {file.original_name}
        </p>
      </a>
    )
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="flex h-28 w-full min-w-0 flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border border-border bg-slate-50 px-3 text-center hover:bg-slate-100 dark:bg-slate-800"
    title={file.original_name}
    >
      <FileText className="h-8 w-8 text-red-500" />
      <span className="line-clamp-2 w-full break-all text-xs leading-4 text-muted-foreground">
        {file.original_name}
      </span>
    </a>
  )
}

const FileUploadSection = ({
  complaintId,
  uploads,
  canUpload,
  onUploaded,
}: FileUploadSectionProps) => {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [selected, setSelected] = useState<SelectedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(
    () => () => {
      selected.forEach((item) => {
        if (item.preview) URL.revokeObjectURL(item.preview)
      })
    },
    [selected],
  )

  const handleFiles = (files: FileList | null, append = false) => {
    if (!files) return
    const incoming = Array.from(files)
    const existing = append ? selected : []
    const validationError = validateFiles(
      [...existing.map((item) => item.file), ...incoming],
      t,
    )
    if (validationError) {
      setError(validationError)
      if (inputRef.current) inputRef.current.value = ''
      if (cameraRef.current) cameraRef.current.value = ''
      return
    }

    if (!append) {
      selected.forEach((item) => {
        if (item.preview) URL.revokeObjectURL(item.preview)
      })
    }

    const newItems = incoming.map((file) => ({
      file,
      preview: isImage(file) ? URL.createObjectURL(file) : null,
    }))

    setError(null)
    setSelected(append ? [...selected, ...newItems] : newItems)
    if (inputRef.current) inputRef.current.value = ''
    if (cameraRef.current) cameraRef.current.value = ''
  }

  const removeFile = (index: number) => {
    setSelected((current) => {
      const next = [...current]
      const [removed] = next.splice(index, 1)
      if (removed?.preview) URL.revokeObjectURL(removed.preview)
      return next
    })
    if (inputRef.current) inputRef.current.value = ''
    if (cameraRef.current) cameraRef.current.value = ''
  }

  const upload = async () => {
    if (selected.length === 0) return
    setUploading(true)
    setError(null)
    try {
      await uploadsApi.upload(
        complaintId,
        selected.map((item) => item.file),
      )
      logger.info('[UPLOAD] Files uploaded.', { complaintId, count: selected.length })
      toast.success(t('complaint.uploadSuccess'))
      selected.forEach((item) => {
        if (item.preview) URL.revokeObjectURL(item.preview)
      })
      setSelected([])
      if (inputRef.current) inputRef.current.value = ''
      if (cameraRef.current) cameraRef.current.value = ''
      onUploaded()
    } catch (uploadError) {
      logger.error('[UPLOAD] Upload failed.', uploadError)
      const message = getErrorMessage(uploadError, t('errors.uploadFailed'))
      setError(message)
      toast.error(message)
    } finally {
      setUploading(false)
    }
  }

  const latestBatch = uploads[0]
  const batches = showHistory ? uploads : latestBatch ? [latestBatch] : []
  const previousCount = Math.max(uploads.length - 1, 0)

  return (
    <div className="min-w-0 space-y-4">
      {uploads.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('complaint.noUploads')}</p>
      ) : (
        <div className="space-y-4">
          {!showHistory && (
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t('complaint.latestUploads')}
            </p>
          )}
          {batches.map((batch) => (
            <div key={batch.batch_number} className="space-y-2">
              {showHistory && (
                <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">
                    {t('complaint.uploadBatch', { number: batch.batch_number })}
                  </p>
                  <p className="max-w-full break-words text-right text-xs text-muted-foreground">
                    {formatDate(batch.uploaded_at)}
                    {batch.uploaded_by
                      ? ` · ${t('complaint.uploadedBy', {
                          name: batch.uploaded_by.full_name,
                        })}`
                      : ''}
                  </p>
                </div>
              )}
              <div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {batch.files.map((file) => (
                  <FileUploadItemCard key={file.id} file={file} />
                ))}
              </div>
            </div>
          ))}
          {previousCount > 0 && (
            <button
              type="button"
              className="text-sm font-medium text-primary hover:underline"
              onClick={() => setShowHistory((value) => !value)}
            >
              {showHistory
                ? t('complaint.hideUploadHistory')
                : t('complaint.viewUploadHistory', { count: previousCount })}
            </button>
          )}
        </div>
      )}

      {canUpload && (
        <div className="space-y-3 rounded-lg border border-dashed border-border p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">{t('complaint.uploadFiles')}</p>
              <p className="text-xs text-muted-foreground">{t('complaint.uploadHint')}</p>
            </div>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,application/pdf"
              className="sr-only"
              aria-label={t('complaint.chooseFiles')}
              onChange={(event) => handleFiles(event.target.files)}
            />
            <input
              ref={cameraRef}
              type="file"
              accept="image/jpeg,image/png"
              capture="environment"
              className="sr-only"
              aria-label={t('complaint.takePhoto')}
              onChange={(event) => handleFiles(event.target.files, true)}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => cameraRef.current?.click()}
                disabled={uploading}
              >
                <Camera className="h-4 w-4" />
                {t('complaint.takePhoto')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="h-4 w-4" />
                {t('complaint.chooseFiles')}
              </Button>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          {selected.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('complaint.selectedFiles')}
              </p>
              <div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3">
                {selected.map((item, index) => (
                  <div
                    key={`${item.file.name}-${index}`}
                    className="relative min-w-0 overflow-hidden rounded-lg border border-border bg-white dark:bg-slate-900"
                  >
                    {item.preview ? (
                      <img
                        src={item.preview}
                        alt={t('complaint.filePreviewAlt')}
                        className="h-24 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-24 items-center justify-center bg-slate-50 dark:bg-slate-800">
                        <FileText className="h-8 w-8 text-red-500" />
                      </div>
                    )}
                    <div className="flex items-center gap-1 px-2 py-1">
                      {item.preview ? (
                        <ImageIcon className="h-3 w-3 shrink-0 text-muted-foreground" />
                      ) : (
                        <FileText className="h-3 w-3 shrink-0 text-muted-foreground" />
                      )}
                      <span className="truncate text-xs text-muted-foreground" title={item.file.name}>
                        {item.file.name}
                      </span>
                    </div>
                    <button
                      type="button"
                      aria-label={t('complaint.remove')}
                      className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
              <Button type="button" onClick={() => void upload()} disabled={uploading}>
                {uploading ? t('complaint.uploading') : t('complaint.confirmUpload')}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default FileUploadSection
