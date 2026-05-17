"use client"

import "leaflet/dist/leaflet.css"

import L from "leaflet"
import { useEffect, useMemo } from "react"
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet"

import type { SucursalRow } from "./use-admin-sucursales"

/**
 * Wrapper Leaflet. Renderea marcadores por sucursal con popup + permite "pick on map"
 * cuando se pasa `onPick` (callback con lat/lng del click).
 *
 * Iconos: Leaflet por default usa rutas relativas para sus iconos PNG. En bundlers
 * como Webpack/Vite las rutas no resuelven y los markers aparecen rotos. Workaround
 * estándar: registrar URLs absolutas desde el CDN de leaflet en el primer mount.
 */

let iconFixed = false
function fixDefaultIcon() {
  if (iconFixed || typeof window === "undefined") return
  iconFixed = true
  // @ts-expect-error mergeOptions exists on the prototype but isn't typed
  delete L.Icon.Default.prototype._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  })
}

const ECUADOR_CENTER: [number, number] = [-1.8312, -78.1834]
const ECUADOR_DEFAULT_ZOOM = 7

type Props = {
  sucursales: readonly SucursalRow[]
  /** Si presente, hace al mapa clickeable para seleccionar coords. */
  onPick?: (lat: number, lng: number) => void
  /** Marker temporal del modo "pick" para feedback visual. */
  pickedPosition?: [number, number] | null
  height?: number
}

export function SucursalesMap({ sucursales, onPick, pickedPosition, height = 480 }: Props) {
  fixDefaultIcon()

  const conGeo = useMemo(
    () =>
      sucursales.filter(
        (s) => s.latitud !== null && s.longitud !== null && !isNaN(Number(s.latitud)),
      ),
    [sucursales],
  )

  // Si hay sucursales con geo, centramos en la primera. Si no, fallback a Ecuador.
  const center: [number, number] =
    pickedPosition ??
    (conGeo[0]
      ? [Number(conGeo[0].latitud), Number(conGeo[0].longitud)]
      : ECUADOR_CENTER)

  return (
    <div className="overflow-hidden rounded-md border" style={{ height }}>
      <MapContainer
        center={center}
        zoom={conGeo.length > 0 || pickedPosition ? 13 : ECUADOR_DEFAULT_ZOOM}
        style={{ width: "100%", height: "100%" }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitBounds points={conGeo.map((s) => [Number(s.latitud), Number(s.longitud)] as [number, number])} />

        {conGeo.map((s) => (
          <Marker
            key={s.id}
            position={[Number(s.latitud), Number(s.longitud)]}
          >
            <Popup>
              <div className="space-y-1">
                <div className="font-semibold">{s.nombre}</div>
                <div className="text-xs text-muted-foreground">{s.ciudad}</div>
                <div className="text-xs">{s.direccion}</div>
                <div className="text-xs">Tel: {s.telefono}</div>
                <div className="text-xs">
                  Estado:{" "}
                  <span className={s.activa ? "text-emerald-600" : "text-muted-foreground"}>
                    {s.activa ? "Activa" : "Inactiva"}
                  </span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {pickedPosition && (
          <Marker position={pickedPosition}>
            <Popup>Nueva ubicación seleccionada</Popup>
          </Marker>
        )}

        {onPick && <PickHandler onPick={onPick} />}
      </MapContainer>
    </div>
  )
}

function PickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

/** Encuadra el mapa para que se vean todos los markers cuando cambian. */
function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (points.length === 0) return
    if (points.length === 1) {
      map.setView(points[0], 13)
      return
    }
    const bounds = L.latLngBounds(points)
    map.fitBounds(bounds, { padding: [40, 40] })
  }, [map, points])
  return null
}

export default SucursalesMap
