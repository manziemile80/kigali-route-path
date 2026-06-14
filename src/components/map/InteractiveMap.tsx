import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMapEvents, useMap, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Coordinates, ServiceLocation, ServiceCategory } from '../../types';
import { useMapStore } from '../../stores/mapStore';
import { useRouteStore } from '../../stores/routeStore';
import { createCategoryIcon, createStartIcon, createEndIcon, createUserLocationIcon } from '../leaflet';
import { Locate, ZoomIn, ZoomOut } from 'lucide-react';

interface InteractiveMapProps {
  services?: ServiceLocation[];
  showControls?: boolean;
  showRouteControls?: boolean;
  showLayerPanel?: boolean;
  height?: string;
  onLocationSelect?: (coords: Coordinates, type: 'start' | 'end') => void;
}

// ── Live location marker with real-time tracking ───────────────────────────────
function LocationMarker({ autoLocate, enableTracking }: { autoLocate?: boolean; enableTracking?: boolean }) {
  const [position, setPosition] = useState<Coordinates | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const {
    setUserLocation, setIsLocating, userLocation, isTracking,
    setLocationError, locationError
  } = useMapStore();
  const map = useMap();
  const located = useRef(false);
  const watchIdRef = useRef<number | null>(null);

  useMapEvents({
    locationfound(e) {
      const coords = { lat: e.latlng.lat, lng: e.latlng.lng };
      setPosition(coords);
      setAccuracy(e.accuracy || null);
      setHeading(e.heading || null);
      setUserLocation(coords);
      setIsLocating(false);
      setLocationError(null);
    },
    locationerror(e) {
      setIsLocating(false);
      let message = 'Could not get your location';
      if (e.code === 1) {
        message = 'Location permission denied. Please allow location access in your browser settings.';
      } else if (e.code === 2) {
        message = 'Location unavailable. Please check your device GPS settings.';
      } else if (e.code === 3) {
        message = 'Location request timed out. Please try again.';
      }
      setLocationError(message);
    },
  });

  // Restore position from store if already set
  useEffect(() => {
    if (userLocation && !position) {
      setPosition(userLocation);
    }
  }, [userLocation]);

  // Auto-locate once on mount
  useEffect(() => {
    if (autoLocate && !located.current) {
      located.current = true;
      setIsLocating(true);
      map.locate({ setView: false, maximumAge: 30000, enableHighAccuracy: true });
    }
  }, [autoLocate, map]);

  // Enable continuous tracking
  useEffect(() => {
    if (enableTracking && !watchIdRef.current && navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const coords: Coordinates = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setPosition(coords);
          setAccuracy(pos.coords.accuracy);
          setHeading(pos.coords.heading);
          setUserLocation(coords);
          setIsLocating(false);
        },
        (err) => {
          let message = 'Could not track your location';
          if (err.code === 1) {
            message = 'Location permission denied. Please allow location access.';
          }
          setLocationError(message);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
      );
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [enableTracking, setUserLocation, setIsLocating, setLocationError]);

  if (!position) return null;

  return (
    <>
      {/* Accuracy circle */}
      {accuracy && (
        <Circle
          center={[position.lat, position.lng]}
          radius={accuracy}
          pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.15, weight: 1 }}
        />
      )}
      <Marker position={[position.lat, position.lng]} icon={createUserLocationIcon()}>
        <Popup>
          <div className="text-sm font-semibold text-kigali-green flex items-center gap-1">
            {isTracking && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
            Your Location
          </div>
          <div className="text-xs text-gray-500">{position.lat.toFixed(5)}, {position.lng.toFixed(5)}</div>
          {accuracy && <div className="text-xs text-gray-400 mt-1">Accuracy: {Math.round(accuracy)}m</div>}
          {heading && <div className="text-xs text-gray-400">Heading: {Math.round(heading)}°</div>}
        </Popup>
      </Marker>
    </>
  );
}

// ── Click-to-set-route-points ──────────────────────────────────────────────────
function MapClickHandler({ onLocationSelect }: { onLocationSelect?: (coords: Coordinates, type: 'start' | 'end') => void }) {
  const { start, end, setStart, setEnd } = useRouteStore();

  useMapEvents({
    click(e) {
      const coords = { lat: e.latlng.lat, lng: e.latlng.lng };
      if (!start) {
        setStart(coords);
      } else {
        setEnd(coords);
        onLocationSelect?.(coords, 'end');
      }
    },
  });
  return null;
}

// ── Sync store zoom/center to Leaflet ─────────────────────────────────────────
function MapController() {
  const { center, zoom, setCenter, setZoom, isLocating, setIsLocating, setLocationError } = useMapStore();
  const map = useMap();
  // Prevent the moveend listener from feeding back into the store while we're
  // programmatically panning/zooming (avoids the setView → moveend → setCenter infinite loop).
  const isProgrammaticMove = useRef(false);

  useEffect(() => {
    isProgrammaticMove.current = true;
    map.setView([center.lat, center.lng], zoom, { animate: false });
    // Reset the flag after Leaflet finishes processing the move
    setTimeout(() => { isProgrammaticMove.current = false; }, 0);
  }, [center, zoom, map]);

  // Trigger locate when isLocating flag is set externally
  useEffect(() => {
    if (isLocating) {
      map.locate({ setView: true, maxZoom: 16, enableHighAccuracy: true });
    }
  }, [isLocating, map]);

  useMapEvents({
    moveend: () => {
      if (isProgrammaticMove.current) return;
      const c = map.getCenter();
      setCenter({ lat: c.lat, lng: c.lng });
      setZoom(map.getZoom());
    },
    locationfound: () => {
      setIsLocating(false);
      setLocationError(null);
    },
    locationerror: (e) => {
      setIsLocating(false);
      let message = 'Could not get your location';
      if (e.code === 1) {
        message = 'Location permission denied. Please enable location access.';
      } else if (e.code === 2) {
        message = 'Location unavailable. Check your GPS settings.';
      } else if (e.code === 3) {
        message = 'Location request timed out. Try again.';
      }
      setLocationError(message);
    },
  });

  return null;
}

// ── Multi-route polylines ──────────────────────────────────────────────────────
function MultiRouteLine() {
  const { routes, selectedRouteIdx, selectRoute, currentRoute, start, end } = useRouteStore();

  if (routes.length > 0) {
    // Draw non-selected routes first (behind), selected last (on top)
    const sorted = routes
      .map((r, i) => ({ r, i }))
      .sort((a, b) => (a.i === selectedRouteIdx ? 1 : b.i === selectedRouteIdx ? -1 : 0));

    return (
      <>
        {sorted.map(({ r, i }) => {
          const isSelected = i === selectedRouteIdx;
          return (
            <Polyline
              key={i}
              positions={r.path.map((p) => [p.lat, p.lng] as [number, number])}
              color={r.color ?? '#22c55e'}
              weight={isSelected ? 6 : 4}
              opacity={isSelected ? 0.95 : 0.45}
              eventHandlers={{ click: () => selectRoute(i) }}
            />
          );
        })}
      </>
    );
  }

  // Draft dashed line when only endpoints are set
  if (!currentRoute && start && end) {
    return (
      <Polyline
        positions={[[start.lat, start.lng], [end.lat, end.lng]]}
        color="#9ca3af"
        weight={3}
        dashArray="10, 10"
      />
    );
  }

  // Single legacy route fallback
  if (currentRoute?.path?.length) {
    return (
      <>
        <Polyline
          positions={currentRoute.path.map((p) => [p.lat, p.lng] as [number, number])}
          color={currentRoute.color ?? '#22c55e'}
          weight={6}
          opacity={0.9}
        />
        <Polyline
          positions={currentRoute.path.map((p) => [p.lat, p.lng] as [number, number])}
          color="#16a34a"
          weight={2}
          opacity={0.4}
        />
      </>
    );
  }

  return null;
}

// ── Buffer circle ──────────────────────────────────────────────────────────────
function BufferCircle({ center, radius }: { center: Coordinates; radius: number }) {
  return (
    <Circle
      center={[center.lat, center.lng]}
      radius={radius}
      pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1, weight: 2 }}
    />
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export function InteractiveMap({
  services = [],
  showControls = true,
  showRouteControls = false,
  showLayerPanel = false,
  height = 'h-screen',
  onLocationSelect,
}: InteractiveMapProps) {
  const {
    center, zoom, selectedLocation, setSelectedLocation,
    selectedCategories, toggleCategory, isLocating, setIsLocating,
  } = useMapStore();
  const { start, end, routes, selectedRouteIdx, setEnd } = useRouteStore();
  const mapRef = useRef<L.Map | null>(null);
  const [layerPanelOpen, setLayerPanelOpen] = useState(false);
  const [showBuffer, setShowBuffer]         = useState(false);
  const [bufferRadius, setBufferRadius]     = useState(1000);

  const handleLocate = () => {
    if (mapRef.current) {
      setIsLocating(true);
      mapRef.current.locate({ setView: true, maxZoom: 16 });
    }
  };

  const filteredServices = selectedCategories.length > 0
    ? services.filter((s) => selectedCategories.includes(s.category))
    : services;

  const categoryFilters: { category: ServiceCategory; label: string; color: string }[] = [
    { category: 'hospital',          label: 'Hospitals',     color: '#ef4444' },
    { category: 'health_center',     label: 'Health Centers',color: '#f97316' },
    { category: 'school',            label: 'Schools',       color: '#8b5cf6' },
    { category: 'police_station',    label: 'Police',        color: '#3b82f6' },
    { category: 'bank',              label: 'Banks',         color: '#059669' },
    { category: 'pharmacy',          label: 'Pharmacies',    color: '#ec4899' },
    { category: 'bus_stop',          label: 'Bus Stops',     color: '#6366f1' },
    { category: 'district_office',   label: 'Districts',     color: '#64748b' },
    { category: 'trade_center',      label: 'Trade Centers',color: '#ea580c' },
  ];

  return (
    <div className={`relative ${height}`}>
      <MapContainer
        ref={mapRef}
        center={[center.lat, center.lng]}
        zoom={zoom}
        className="w-full h-full z-0"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController />
        <LocationMarker autoLocate />

        {showRouteControls && <MapClickHandler onLocationSelect={onLocationSelect} />}

        {/* Service markers with hover tooltips */}
        {filteredServices.map((service) => (
          <Marker
            key={service.id}
            position={[service.coordinates.lat, service.coordinates.lng]}
            icon={createCategoryIcon(service.category)}
            eventHandlers={{
              click: () => setSelectedLocation(service),
              mouseover: (e) => {
                e.target.openPopup();
              },
            }}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={1}>
              <div className="font-semibold text-sm">{service.name}</div>
              <div className="text-xs text-gray-500 capitalize">{service.category.replace(/_/g, ' ')}</div>
              {service.rating > 0 && (
                <div className="text-xs text-yellow-600">{'★'.repeat(Math.round(service.rating))}</div>
              )}
            </Tooltip>
            <Popup>
              <div className="min-w-[200px]">
                <h3 className="font-semibold text-gray-900">{service.name}</h3>
                <p className="text-sm text-gray-500 capitalize">
                  {service.category.replace(/_/g, ' ')}
                </p>
                {service.address && (
                  <p className="text-xs text-gray-400 mt-1">{service.address}</p>
                )}
                {service.contact_phone && (
                  <p className="text-xs mt-1">
                    <a href={`tel:${service.contact_phone}`} className="text-kigali-green hover:underline">
                      {service.contact_phone}
                    </a>
                  </p>
                )}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {service.emergency_services && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Emergency</span>
                  )}
                  {service.rating > 0 && (
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                      {service.rating}/5
                    </span>
                  )}
                  {service.wheelchair_accessible && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Accessible</span>
                  )}
                </div>
                {showRouteControls && (
                  <button
                    onClick={() => {
                      setEnd(service.coordinates);
                      onLocationSelect?.(service.coordinates, 'end');
                    }}
                    className="mt-3 w-full text-sm bg-kigali-green text-white px-3 py-1.5 rounded-lg hover:bg-kigali-green/90 font-medium"
                  >
                    Set as Destination
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Start / End markers with hover tooltips */}
        {start && (
          <Marker position={[start.lat, start.lng]} icon={createStartIcon()}>
            <Tooltip direction="top" offset={[0, -10]} opacity={1}>
              <div className="font-semibold text-green-600 text-sm">Start Point</div>
              <div className="text-xs text-gray-500">{start.lat.toFixed(5)}, {start.lng.toFixed(5)}</div>
            </Tooltip>
            <Popup><div className="font-semibold text-kigali-green">Start Point</div></Popup>
          </Marker>
        )}
        {end && (
          <Marker position={[end.lat, end.lng]} icon={createEndIcon()}>
            <Tooltip direction="top" offset={[0, -10]} opacity={1}>
              <div className="font-semibold text-red-600 text-sm">Destination</div>
              <div className="text-xs text-gray-500">{end.lat.toFixed(5)}, {end.lng.toFixed(5)}</div>
            </Tooltip>
            <Popup><div className="font-semibold text-red-500">Destination</div></Popup>
          </Marker>
        )}

        <MultiRouteLine />

        {showBuffer && selectedLocation && (
          <BufferCircle center={selectedLocation.coordinates} radius={bufferRadius} />
        )}
      </MapContainer>

      {/* ── Controls overlay ──────────────────────────────── */}
      {showControls && (
        <>
          {/* Zoom + Locate */}
          <div className="absolute right-4 top-20 z-[1000] flex flex-col space-y-2">
            <button
              onClick={() => mapRef.current?.zoomIn()}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-2 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <ZoomIn className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <button
              onClick={() => mapRef.current?.zoomOut()}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-2 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <ZoomOut className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <button
              onClick={handleLocate}
              disabled={isLocating}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-2 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              title="Go to my location"
            >
              <Locate className={`w-5 h-5 text-gray-700 dark:text-gray-300 ${isLocating ? 'animate-pulse' : ''}`} />
            </button>
          </div>

          {/* Layer / Filter panel */}
          {showLayerPanel && (
            <>
              <button
                onClick={() => setLayerPanelOpen(!layerPanelOpen)}
                className={`absolute right-4 top-48 z-[1000] bg-white dark:bg-gray-800 rounded-lg shadow-md p-2 hover:bg-gray-50 dark:hover:bg-gray-700 ${layerPanelOpen ? 'ring-2 ring-kigali-green' : ''}`}
              >
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">F</span>
              </button>

              {layerPanelOpen && (
                <div className="absolute right-16 top-48 z-[1000] bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 w-60">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">Filter Categories</h3>
                  <div className="space-y-2">
                    {categoryFilters.map(({ category, label, color }) => (
                      <label key={category} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category)}
                          onChange={() => toggleCategory(category)}
                          className="rounded border-gray-300 text-kigali-green focus:ring-kigali-green"
                        />
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                      </label>
                    ))}
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Buffer Analysis</h4>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showBuffer}
                        onChange={() => setShowBuffer(!showBuffer)}
                        className="rounded border-gray-300 text-kigali-green focus:ring-kigali-green"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Show Buffer</span>
                    </label>
                    {showBuffer && (
                      <div className="mt-2">
                        <input
                          type="range"
                          min="500"
                          max="5000"
                          step="100"
                          value={bufferRadius}
                          onChange={(e) => setBufferRadius(Number(e.target.value))}
                          className="w-full"
                        />
                        <div className="text-xs text-gray-500 text-center mt-1">
                          {(bufferRadius / 1000).toFixed(1)} km radius
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ── Route info bar (multi-route) ──────────────────── */}
      {showRouteControls && routes.length > 0 && (
        <div className="absolute bottom-4 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 z-[1000]">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-3 max-w-lg mx-auto">
            <p className="text-xs text-gray-500 mb-2 font-medium">
              Route options — tap to switch
            </p>
            <div className="flex gap-2 flex-wrap">
              {routes.map((r, i) => (
                <button
                  key={i}
                  onClick={() => useRouteStore.getState().selectRoute(i)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                    i === selectedRouteIdx
                      ? 'shadow-sm scale-105'
                      : 'opacity-60 hover:opacity-80'
                  }`}
                  style={
                    i === selectedRouteIdx
                      ? { borderColor: r.color, backgroundColor: r.color + '18', color: r.color }
                      : { borderColor: '#e5e7eb', color: '#6b7280' }
                  }
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: r.color }}
                  />
                  <span>{r.label}</span>
                  <span className="font-normal opacity-70">
                    {r.distance_m >= 1000
                      ? `${(r.distance_m / 1000).toFixed(1)} km`
                      : `${Math.round(r.distance_m)} m`}
                  </span>
                  {r.trafficScore !== undefined && (
                    <span
                      className={`ml-0.5 px-1 rounded text-[10px] font-bold ${
                        r.trafficScore < 20 ? 'bg-green-100 text-green-700'
                          : r.trafficScore < 50 ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {r.trafficScore < 20 ? 'Low' : r.trafficScore < 50 ? 'Med' : 'High'}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Single route info fallback ─────────────────────── */}
      {showRouteControls && routes.length === 0 && (start || end) && (
        <div className="absolute bottom-4 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 z-[1000]">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-md mx-auto">
            <div className="flex items-center space-x-4">
              {start && (
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-kigali-green" />
                  <div className="text-sm">
                    <div className="text-gray-500 text-xs">From</div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {start.lat.toFixed(4)}, {start.lng.toFixed(4)}
                    </div>
                  </div>
                </div>
              )}
              {end && (
                <div className="flex items-center space-x-2 ml-4">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="text-sm">
                    <div className="text-gray-500 text-xs">To</div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {end.lat.toFixed(4)}, {end.lng.toFixed(4)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
