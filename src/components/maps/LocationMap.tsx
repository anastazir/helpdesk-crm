import { useEffect } from 'react'
import { divIcon } from 'leaflet'
import {
  Circle,
  CircleMarker,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import { useTranslation } from 'react-i18next'

interface LocationMapProps {
  latitude: number
  longitude: number
  label?: string
  radiusM?: number | null
  className?: string
  interactive?: boolean
  onCoordinateChange?: (latitude: number, longitude: number) => void
}

const pinIcon = divIcon({
  className: '',
  html: '<div style="width:18px;height:18px;border-radius:50%;background:#2563eb;border:3px solid white;box-shadow:0 0 0 2px #2563eb"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

const MapSync = ({ latitude, longitude }: { latitude: number; longitude: number }) => {
  const map = useMap()
  useEffect(() => {
    map.setView([latitude, longitude], map.getZoom(), { animate: true })
  }, [latitude, longitude, map])
  return null
}

const MapClick = ({
  onCoordinateChange,
}: {
  onCoordinateChange?: (latitude: number, longitude: number) => void
}) => {
  useMapEvents({
    click(event) {
      onCoordinateChange?.(event.latlng.lat, event.latlng.lng)
    },
  })
  return null
}

const LocationMap = ({
  latitude,
  longitude,
  label,
  radiusM,
  className = 'h-64 w-full',
  interactive = false,
  onCoordinateChange,
}: LocationMapProps) => {
  const { t } = useTranslation()
  const radius = radiusM && radiusM > 0 ? radiusM : 200

  return (
    <div
      className={`overflow-hidden rounded-lg border border-border ${className} ${
        interactive ? 'cursor-crosshair' : ''
      }`}
    >
      <MapContainer
        center={[latitude, longitude]}
        zoom={15}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={19}
        />
        <MapSync latitude={latitude} longitude={longitude} />
        <Circle
          center={[latitude, longitude]}
          radius={radius}
          eventHandlers={
            onCoordinateChange
              ? {
                  click: (event) =>
                    onCoordinateChange(event.latlng.lat, event.latlng.lng),
                }
              : undefined
          }
          pathOptions={{ color: '#2563eb', fillColor: '#2563eb', fillOpacity: 0.08 }}
        />
        {interactive ? (
          <Marker
            position={[latitude, longitude]}
            icon={pinIcon}
            draggable
            eventHandlers={{
              dragend: (event) => {
                const position = event.target.getLatLng()
                onCoordinateChange?.(position.lat, position.lng)
              },
            }}
          >
            <Popup>{label || t('complaint.approximateLocation')}</Popup>
          </Marker>
        ) : (
          <CircleMarker
            center={[latitude, longitude]}
            radius={7}
            pathOptions={{ color: '#1d4ed8', fillColor: '#2563eb', fillOpacity: 1 }}
          >
            <Popup>{label || t('complaint.approximateLocation')}</Popup>
          </CircleMarker>
        )}
        {interactive && <MapClick onCoordinateChange={onCoordinateChange} />}
      </MapContainer>
    </div>
  )
}

export default LocationMap
