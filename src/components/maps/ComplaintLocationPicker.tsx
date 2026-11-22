import { useEffect, useState } from 'react'
import { Loader2, MapPin, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { geocodeApi, type GeocodeResult } from '@/api/geocode.api'
import { Button } from '@/components/ui/button'
import { getErrorMessage } from '@/utils/errors'
import { logger } from '@/utils/logger'

import LocationMap from './LocationMap'

interface ComplaintLocationPickerProps {
  address: string
  addressRemark: string
  pincode: string
  onLocated: (result: GeocodeResult | null) => void
}

const ComplaintLocationPicker = ({
  address,
  addressRemark,
  pincode,
  onLocated,
}: ComplaintLocationPickerProps) => {
  const { t, i18n } = useTranslation()
  const [result, setResult] = useState<GeocodeResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hasAddress = Boolean(address.trim() || addressRemark.trim() || pincode.trim())

  useEffect(() => {
    setResult(null)
    setError(null)
    onLocated(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, addressRemark, pincode])

  const locate = async () => {
    if (!hasAddress) {
      setError(t('complaint.locationNeedsAddress'))
      return
    }
    setLoading(true)
    setError(null)
    try {
      const response = await geocodeApi.preview({
        address,
        address_remark: addressRemark,
        pincode,
        locale: i18n.language,
        use_ai: true,
      })
      if (!response.success || !response.data) {
        throw new Error(response.message || t('complaint.locationFailed'))
      }
      setResult(response.data)
      onLocated(response.data)
      logger.info('[GEOCODE] Location preview received.', {
        status: response.data.status,
      })
    } catch (requestError) {
      logger.error('[GEOCODE] Location preview failed.', requestError)
      setError(getErrorMessage(requestError, t('complaint.locationFailed')))
      onLocated(null)
    } finally {
      setLoading(false)
    }
  }

  const latitude = result?.latitude
  const longitude = result?.longitude
  const hasCoordinates =
    typeof latitude === 'number' && typeof longitude === 'number'

  const handlePin = (nextLatitude: number, nextLongitude: number) => {
    const latitude = Number(nextLatitude.toFixed(6))
    const longitude = Number(nextLongitude.toFixed(6))
    const manual: GeocodeResult = {
      status: 'manual',
      label: t('complaint.manualPinLabel'),
      provider: 'manual',
      latitude,
      longitude,
      map_radius_m: 50,
      queries: result?.queries ?? [],
      ai_assisted: false,
      ai_note: '',
    }
    setResult(manual)
    onLocated(manual)
  }

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-medium">
            <MapPin className="h-4 w-4 text-primary" />
            {t('complaint.approximateLocation')}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t('complaint.locationHint')}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void locate()}
          disabled={loading || !hasAddress}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {loading ? t('complaint.locating') : t('complaint.locate')}
        </Button>
      </div>

      {error && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      {result && hasCoordinates && (
        <div className="mt-4 space-y-2">
          <LocationMap
            latitude={latitude}
            longitude={longitude}
            label={result.label}
            radiusM={result.map_radius_m}
            interactive
            onCoordinateChange={handlePin}
          />
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>
              {t(`complaint.geocodeStatus.${result.status}`, {
                defaultValue: result.status,
              })}
              {result.label ? ` · ${result.label}` : ''}
            </span>
            {result.ai_assisted && (
              <span className="flex items-center gap-1 text-primary">
                <Sparkles className="h-3 w-3" />
                {t('complaint.aiLocation')}
              </span>
            )}
          </div>
          {result.ai_note && (
            <p className="text-xs text-muted-foreground">{result.ai_note}</p>
          )}
          <p className="text-xs text-muted-foreground">
            {t('complaint.pinHint')}
          </p>
        </div>
      )}

      {result?.status === 'not_found' && (
        <p className="mt-3 text-sm text-muted-foreground">
          {t('complaint.locationNotFound')}
        </p>
      )}
    </div>
  )
}

export default ComplaintLocationPicker
