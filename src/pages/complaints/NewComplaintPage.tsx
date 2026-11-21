import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'

import { complaintsApi } from '@/api/complaints.api'
import { issuesApi } from '@/api/issues.api'
import { zonesApi } from '@/api/zones.api'
import ErrorBanner from '@/components/common/ErrorBanner'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import PageHeader from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { IssueType } from '@/types/complaint.types'
import type { Zone } from '@/types/zone.types'
import { getErrorMessage } from '@/utils/errors'
import { logger } from '@/utils/logger'

const createSchema = (t: (key: string) => string) =>
  z.object({
    caller_name: z.string(),
    caller_phone: z.string().min(1, t('validation.required')),
    bmid: z.string(),
    aadhaar: z.string(),
    zone_id: z.string().min(1, t('validation.zoneRequired')),
    address: z.string(),
    pincode: z.string(),
    department: z.string(),
    designation: z.string(),
    cpu_serial: z.string(),
    monitor_serial: z.string(),
    issue_ids: z.array(z.number()).min(1, t('validation.issuesRequired')),
    others_description: z.string(),
  })

type ComplaintFormValues = z.infer<ReturnType<typeof createSchema>>

const NewComplaintPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [zones, setZones] = useState<Zone[]>([])
  const [issues, setIssues] = useState<IssueType[]>([])
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [optionsError, setOptionsError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const schema = useMemo(() => createSchema(t), [t])

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    watch,
    formState: { errors },
  } = useForm<ComplaintFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      caller_name: '',
      caller_phone: '',
      bmid: '',
      aadhaar: '',
      zone_id: '',
      address: '',
      pincode: '',
      department: '',
      designation: '',
      cpu_serial: '',
      monitor_serial: '',
      issue_ids: [],
      others_description: '',
    },
  })

  const selectedIssues = watch('issue_ids')
  const selectedZone = watch('zone_id')

  const loadOptions = async () => {
    setLoadingOptions(true)
    setOptionsError(null)
    try {
      const [zonesResponse, issuesResponse] = await Promise.all([
        zonesApi.list(),
        issuesApi.list(),
      ])
      setZones(zonesResponse.data ?? [])
      setIssues(issuesResponse.data ?? [])
    } catch (loadError) {
      logger.error('[COMPLAINT] Failed to load form options.', loadError)
      setOptionsError(getErrorMessage(loadError, t('errors.loadFailed')))
    } finally {
      setLoadingOptions(false)
    }
  }

  useEffect(() => {
    logger.info('[COMPLAINT] New complaint page mounted.')
    void loadOptions()
  }, [])

  const othersIssue = issues.find((issue) => issue.name.toLowerCase() === 'others')

  const toggleIssue = (issueId: number) => {
    const next = selectedIssues.includes(issueId)
      ? selectedIssues.filter((id) => id !== issueId)
      : [...selectedIssues, issueId]
    setValue('issue_ids', next, { shouldValidate: true })
  }

  const submit = async (values: ComplaintFormValues) => {
    if (
      othersIssue &&
      values.issue_ids.includes(othersIssue.id) &&
      values.others_description.trim().length === 0
    ) {
      setError('others_description', {
        message: t('validation.othersRequired'),
      })
      return
    }

    setSubmitting(true)
    setSubmitError(null)
    try {
      logger.info('[COMPLAINT] Submitting new complaint.')
      const response = await complaintsApi.create({
        caller_phone: values.caller_phone.trim(),
        caller_name: values.caller_name.trim() || null,
        bmid: values.bmid.trim() || null,
        aadhaar: values.aadhaar.trim() || null,
        zone_id: Number(values.zone_id),
        address: values.address.trim() || null,
        pincode: values.pincode.trim() || null,
        department: values.department.trim() || null,
        designation: values.designation.trim() || null,
        cpu_serial: values.cpu_serial.trim() || null,
        monitor_serial: values.monitor_serial.trim() || null,
        issue_ids: values.issue_ids,
        others_description: values.others_description.trim() || null,
      })

      if (!response.success || !response.data) {
        throw new Error(response.message || t('errors.actionFailed'))
      }

      toast.success(t('complaint.complaintCreated'))
      navigate(`/complaints/${response.data.id}`)
    } catch (createError) {
      logger.error('[COMPLAINT] Failed to create complaint.', createError)
      const message = getErrorMessage(createError, t('errors.actionFailed'))
      setSubmitError(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingOptions) {
    return <LoadingSpinner />
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title={t('complaint.newComplaint')}
        description={t('complaint.subtitle')}
      />

      {optionsError && <ErrorBanner message={optionsError} onRetry={() => void loadOptions()} />}
      {submitError && <ErrorBanner message={submitError} />}

      <form onSubmit={handleSubmit(submit)} className="space-y-5">
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle>{t('complaint.callerInformation')}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="caller-name">
                {t('complaint.callerName')}{' '}
                <span className="text-muted-foreground">({t('common.optional')})</span>
              </Label>
              <Input id="caller-name" {...register('caller_name')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="caller-phone">
                {t('complaint.callerPhone')} <span className="text-red-500">*</span>
              </Label>
              <Input id="caller-phone" {...register('caller_phone')} />
              {errors.caller_phone && (
                <p className="text-sm text-red-600">{errors.caller_phone.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bmid">
                {t('complaint.bmid')}{' '}
                <span className="text-muted-foreground">({t('common.optional')})</span>
              </Label>
              <Input id="bmid" {...register('bmid')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="aadhaar">
                {t('complaint.aadhaar')}{' '}
                <span className="text-muted-foreground">({t('common.optional')})</span>
              </Label>
              <Input id="aadhaar" {...register('aadhaar')} />
            </div>
            <p className="text-xs text-muted-foreground sm:col-span-2">
              {t('complaint.bmidHelper')}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle>{t('complaint.location')}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>
                {t('complaint.zone')} <span className="text-red-500">*</span>
              </Label>
              <Select
                value={selectedZone || undefined}
                onValueChange={(value) =>
                  setValue('zone_id', value, { shouldValidate: true })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('complaint.selectZone')} />
                </SelectTrigger>
                <SelectContent>
                  {zones.map((zone) => (
                    <SelectItem key={zone.id} value={String(zone.id)}>
                      {zone.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.zone_id && (
                <p className="text-sm text-red-600">{errors.zone_id.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pincode">
                {t('complaint.pincode')}{' '}
                <span className="text-muted-foreground">({t('common.optional')})</span>
              </Label>
              <Input id="pincode" {...register('pincode')} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="address">
                {t('complaint.address')}{' '}
                <span className="text-muted-foreground">({t('common.optional')})</span>
              </Label>
              <Textarea id="address" rows={2} {...register('address')} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle>{t('complaint.callerDetails')}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="department">
                {t('complaint.department')}{' '}
                <span className="text-muted-foreground">({t('common.optional')})</span>
              </Label>
              <Input id="department" {...register('department')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="designation">
                {t('complaint.designation')}{' '}
                <span className="text-muted-foreground">({t('common.optional')})</span>
              </Label>
              <Input id="designation" {...register('designation')} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle>{t('complaint.hardware')}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cpu-serial">
                {t('complaint.cpuSerial')}{' '}
                <span className="text-muted-foreground">({t('common.optional')})</span>
              </Label>
              <Input id="cpu-serial" {...register('cpu_serial')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="monitor-serial">
                {t('complaint.monitorSerial')}{' '}
                <span className="text-muted-foreground">({t('common.optional')})</span>
              </Label>
              <Input id="monitor-serial" {...register('monitor_serial')} />
            </div>
            <p className="text-xs text-muted-foreground sm:col-span-2">
              {t('complaint.hardwareHelper')}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle>
              {t('complaint.reportedIssues')} <span className="text-red-500">*</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {issues.map((issue) => {
                const selected = selectedIssues.includes(issue.id)
                return (
                  <button
                    key={issue.id}
                    type="button"
                    onClick={() => toggleIssue(issue.id)}
                    className={cn(
                      'rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                      selected
                        ? 'border-2 border-primary bg-blue-50 text-primary dark:bg-blue-950/40'
                        : 'border-border bg-white text-slate-700 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300',
                    )}
                  >
                    {issue.name}
                  </button>
                )
              })}
            </div>
            {errors.issue_ids && (
              <p className="mt-2 text-sm text-red-600">{errors.issue_ids.message}</p>
            )}

            {othersIssue && selectedIssues.includes(othersIssue.id) && (
              <div className="mt-4 space-y-1.5">
                <Label htmlFor="others-description">
                  {t('complaint.othersDescription')} <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="others-description"
                  rows={3}
                  {...register('others_description')}
                />
                {errors.others_description && (
                  <p className="text-sm text-red-600">
                    {errors.others_description.message}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" asChild>
            <Link to="/complaints">{t('common.cancel')}</Link>
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? t('complaint.submitting') : t('complaint.submitComplaint')}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default NewComplaintPage
