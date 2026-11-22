import { useEffect, useState } from 'react'
import { ExternalLink, Loader2, MapPin, RefreshCw, Save } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { complaintsApi } from '@/api/complaints.api'
import LocationMap from '@/components/maps/LocationMap'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Complaint } from '@/types/complaint.types'
import { getErrorMessage } from '@/utils/errors'
import { logger } from '@/utils/logger'

interface ComplaintMapCardProps {
  complaint: Complaint
  canLocate: boolean
  onUpdated: (complaint: Complaint) => void
}

const ComplaintMapCard = ({
  complaint,
  canLocate,
  onUpdated,
}: ComplaintMapCardProps) => {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [savingPin, setSavingPin] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const latitude = complaint.latitude === null ? null : Number(complaint.latitude)
  const longitude =
    complaint.longitude === null ? null : Number(complaint.longitude)
  const [draftLatitude, setDraftLatitude] = useState<number | null>(latitude)
  const [draftLongitude, setDraftLongitude] = useState<number | null>(longitude)
  const hasCoordinates =
    draftLatitude !== null &&
    draftLongitude !== null &&
    Number.isFinite(draftLatitude) &&
    Number.isFinite(draftLongitude)
  const pinChanged =
    draftLatitude !== latitude || draftLongitude !== longitude

  useEffect(() => {
    setDraftLatitude(latitude)
    setDraftLongitude(longitude)
  }, [latitude, longitude])

  const locate = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await complaintsApi.geocode(complaint.id)
      if (!response.success || !response.data) {
        throw new Error(response.message || t('complaint.locationFailed'))
      }
      onUpdated(response.data)
      logger.info('[GEOCODE] Complaint location refreshed.', {
        complaintId: complaint.id,
      })
    } catch (requestError) {
      logger.error('[GEOCODE] Complaint location refresh failed.', requestError)
      setError(getErrorMessage(requestError, t('complaint.locationFailed')))
    } finally {
      setLoading(false)
    }
  }

  const hasAddress = Boolean(
    complaint.address || complaint.address_remark || complaint.pincode,
  )

  const savePin = async () => {
    if (draftLatitude === null || draftLongitude === null) return
    setSavingPin(true)
    setError(null)
    try {
      const response = await complaintsApi.updateLocation(
        complaint.id,
        draftLatitude,
        draftLongitude,
      )
      if (!response.success || !response.data) {
        throw new Error(response.message || t('complaint.locationFailed'))
      }
      onUpdated(response.data)
      toast.success(t('complaint.pinSaved'))
      logger.info('[GEOCODE] Manual location pin saved.', {
        complaintId: complaint.id,
      })
    } catch (requestError) {
      logger.error('[GEOCODE] Manual pin save failed.', requestError)
      setError(getErrorMessage(requestError, t('complaint.locationFailed')))
    } finally {
      setSavingPin(false)
    }
  }

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          {t('complaint.location')}
        </CardTitle>
        {canLocate && hasAddress && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void locate()}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {t('complaint.refreshLocation')}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {complaint.address_remark && (
          <div className="mb-3 rounded-md bg-muted/50 p-3 text-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t('complaint.addressRemark')}
            </p>
            <p className="mt-1 whitespace-pre-wrap">{complaint.address_remark}</p>
          </div>
        )}
        {error && (
          <p className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
        )}
        {hasCoordinates ? (
          <div className="space-y-2">
            <LocationMap
              latitude={draftLatitude}
              longitude={draftLongitude}
              label={
                pinChanged
                  ? t('complaint.manualPinLabel')
                  : complaint.geocode_label || complaint.address || undefined
              }
              radiusM={pinChanged ? 50 : complaint.map_radius_m}
              interactive={canLocate}
              onCoordinateChange={(nextLatitude, nextLongitude) => {
                setDraftLatitude(Number(nextLatitude.toFixed(6)))
                setDraftLongitude(Number(nextLongitude.toFixed(6)))
              }}
            />
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>
                {pinChanged
                  ? t('complaint.manualPinLabel')
                  : t(`complaint.geocodeStatus.${complaint.geocode_status}`, {
                      defaultValue: complaint.geocode_status,
                    })}
                {complaint.geocode_label ? ` · ${complaint.geocode_label}` : ''}
              </span>
              <a
                className="inline-flex items-center gap-1 text-primary hover:underline"
                href={`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`}
                target="_blank"
                rel="noreferrer"
              >
                {t('complaint.openMap')}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {t('complaint.mapAttribution')}
            </p>
            {canLocate && (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  {t('complaint.pinHint')}
                </p>
                {pinChanged && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void savePin()}
                    disabled={savingPin}
                  >
                    {savingPin ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {t('complaint.savePin')}
                  </Button>
                )}
              </div>
            )}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
            {hasAddress
              ? t('complaint.locationUnavailable')
              : t('complaint.locationNeedsAddress')}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export default ComplaintMapCard
