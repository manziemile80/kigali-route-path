import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Coordinates, ServiceLocation, ServiceCategory } from '../../types';
import { useMapStore } from '../../stores/mapStore';
import { useRouteStore } from '../../stores/routeStore';
import { createCategoryIcon, createStartIcon, createEndIcon, createUserLocationIcon } from '../leaflet';
import { Search, Layers, Locate, ZoomIn, ZoomOut, Route } from 'lucide-react';

interface InteractiveMapProps {
  services?: ServiceLocation[];
  showControls?: boolean;
  showRouteControls?: boolean;
  showLayerPanel?: boolean;
  height?: string;
  onLocationSelect?: (coords: Coordinates, type: 'start' | 'end') => void;
}

function LocationMarker() {
  const [position, setPosition] = useState<Coordinates | null>(null);
  const { setUserLocation, setIsLocating } = useMapStore();

  useMapEvents({
    locationfound(e) {
      const coords = { lat: e.latlng.lat, lng: e.latlng.lng };
      setPosition(coords);
      setUserLocation(coords);
      setIsLocating(false);
    },
    locationerror() {
      setIsLocating(false);
    },
  });

  return position ? <Marker position={[position.lat, position.lng]} icon={createUserLocationIcon()} /> : null;
}

function MapClickHandler({ onLocationSelect }: { onLocationSelect?: (coords: Coordinates, type: 'start' | 'end') => void }) {
  const { start, end, setStart, setEnd } = useRouteStore();

  useMapEvents({
    click(e) {
      const coords = { lat: e.latlng.lat, lng: e.latlng.lng };
      if (!start) {
        setStart(coords);
      } else {
        // Always replace end when start is already set (including when end also exists)
        setEnd(coords);
        if (onLocationSelect) {
          onLocationSelect(coords, 'end');
        }
      }
    },
  });
  return null;
}

function MapController() {
  const { center, zoom, setCenter, setZoom } = useMapStore();
  const map = useMap();

  useEffect(() => {
    map.setView([center.lat, center.lng], zoom);
  }, [center, zoom, map]);

  useMapEvents({
    moveend: () => {
      const newCenter = map.getCenter();
      const newZoom = map.getZoom();
      setCenter({ lat: newCenter.lat, lng: newCenter.lng });
      setZoom(newZoom);
    },
  });

  return null;
}

function RouteLine() {
  const { currentRoute, start, end } = useRouteStore();

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

  if (currentRoute && currentRoute.path.length > 0) {
    return (
      <>
        <Polyline
          positions={currentRoute.path.map((p) => [p.lat, p.lng])}
          color="#22c55e"
          weight={5}
          opacity={0.8}
        />
        <Polyline
          positions={currentRoute.path.map((p) => [p.lat, p.lng])}
          color="#16a34a"
          weight={3}
        />
      </>
    );
  }

  return null;
}

function BufferCircle({ center, radius }: { center: Coordinates; radius: number }) {
  return (
    <Circle
      center={[center.lat, center.lng]}
      radius={radius}
      pathOptions={{
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.1,
        weight: 2,
      }}
    />
  );
}

export function InteractiveMap({
  services = [],
  showControls = true,
  showRouteControls = false,
  showLayerPanel = false,
  height = 'h-screen',
  onLocationSelect,
}: InteractiveMapProps) {
  const { center, zoom, selectedLocation, setSelectedLocation, selectedCategories, toggleCategory, isLocating, setIsLocating } = useMapStore();
  const { start, end, currentRoute } = useRouteStore();
  const mapRef = useRef<L.Map | null>(null);
  const [layerPanelOpen, setLayerPanelOpen] = useState(false);
  const [showBuffer, setShowBuffer] = useState(false);
  const [bufferRadius, setBufferRadius] = useState(1000);

  const handleLocate = () => {
    if (mapRef.current) {
      setIsLocating(true);
      mapRef.current.locate({ setView: true, maxZoom: 16 });
    }
  };

  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.zoomOut();
    }
  };

  const filteredServices = selectedCategories.length > 0
    ? services.filter((s) => selectedCategories.includes(s.category))
    : services;

  const categoryFilters: { category: ServiceCategory; label: string; color: string }[] = [
    { category: 'hospital', label: 'Hospitals', color: '#ef4444' },
    { category: 'health_center', label: 'Health Centers', color: '#f97316' },
    { category: 'school', label: 'Schools', color: '#8b5cf6' },
    { category: 'police_station', label: 'Police', color: '#3b82f6' },
    { category: 'bank', label: 'Banks', color: '#059669' },
    { category: 'pharmacy', label: 'Pharmacies', color: '#ec4899' },
    { category: 'bus_stop', label: 'Bus Stops', color: '#6366f1' },
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
        <LocationMarker />

        {showRouteControls && <MapClickHandler onLocationSelect={onLocationSelect} />}

        {filteredServices.map((service) => (
          <Marker
            key={service.id}
            position={[service.coordinates.lat, service.coordinates.lng]}
            icon={createCategoryIcon(service.category)}
            eventHandlers={{
              click: () => setSelectedLocation(service),
            }}
          >
            <Popup>
              <div className="min-w-[200px]">
                <h3 className="font-semibold text-gray-900">{service.name}</h3>
                <p className="text-sm text-gray-500 capitalize">{service.category.replace('_', ' ')}</p>
                {service.address && (
                  <p className="text-xs text-gray-400 mt-1">{service.address}</p>
                )}
                {service.contact_phone && (
                  <p className="text-xs text-gray-500 mt-1">
                    <a href={`tel:${service.contact_phone}`} className="text-kigali-green hover:underline">
                      {service.contact_phone}
                    </a>
                  </p>
                )}
                <div className="mt-2 flex items-center space-x-2">
                  {service.emergency_services && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                      Emergency
                    </span>
                  )}
                  {service.rating > 0 && (
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                      {service.rating}/5
                    </span>
                  )}
                </div>
                {showRouteControls && (
                  <button
                    onClick={() => {
                      setEnd(service.coordinates);
                      if (onLocationSelect) {
                        onLocationSelect(service.coordinates, 'end');
                      }
                    }}
                    className="mt-2 w-full text-sm bg-kigali-green text-white px-3 py-1 rounded hover:bg-kigali-green/90"
                  >
                    Set as Destination
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {start && (
          <Marker position={[start.lat, start.lng]} icon={createStartIcon()}>
            <Popup>
              <div className="font-semibold">Start Point</div>
            </Popup>
          </Marker>
        )}

        {end && (
          <Marker position={[end.lat, end.lng]} icon={createEndIcon()}>
            <Popup>
              <div className="font-semibold">Destination</div>
            </Popup>
          </Marker>
        )}

        <RouteLine />

        {showBuffer && selectedLocation && (
          <BufferCircle center={selectedLocation.coordinates} radius={bufferRadius} />
        )}
      </MapContainer>

      {showControls && (
        <>
          <div className="absolute top-4 left-4 right-4 md:left-16 md:right-auto z-[1000] max-w-sm">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3">
              <div className="flex items-center space-x-2">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search services..."
                  className="flex-1 bg-transparent border-none outline-none text-sm text-gray-700 dark:text-gray-300"
                />
              </div>
            </div>
          </div>

          <div className="absolute right-4 top-20 z-[1000] flex flex-col space-y-2">
            <button
              onClick={handleZoomIn}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-2 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <ZoomIn className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <button
              onClick={handleZoomOut}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-2 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <ZoomOut className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <button
              onClick={handleLocate}
              disabled={isLocating}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-2 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              <Locate className={`w-5 h-5 text-gray-700 dark:text-gray-300 ${isLocating ? 'animate-pulse' : ''}`} />
            </button>
            {showLayerPanel && (
              <button
                onClick={() => setLayerPanelOpen(!layerPanelOpen)}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-2 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  layerPanelOpen ? 'ring-2 ring-kigali-green' : ''
                }`}
              >
                <Layers className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
            )}
          </div>

          {showLayerPanel && layerPanelOpen && (
            <div className="absolute right-16 top-20 z-[1000] bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 w-64">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Filter Services</h3>
              <div className="space-y-2">
                {categoryFilters.map(({ category, label, color }) => (
                  <label
                    key={category}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category)}
                      onChange={() => toggleCategory(category)}
                      className="rounded border-gray-300 text-kigali-green focus:ring-kigali-green"
                    />
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                  </label>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Buffer Analysis</h4>
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

      {showRouteControls && (start || end) && (
        <div className="absolute bottom-4 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 z-[1000]">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-md mx-auto">
            <div className="flex items-center space-x-4">
              {start && (
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-kigali-green" />
                  <div className="ml-2 text-sm">
                    <div className="text-gray-500">From</div>
                    <div className="font-medium text-gray-900 dark:text-white truncate">
                      {start.lat.toFixed(4)}, {start.lng.toFixed(4)}
                    </div>
                  </div>
                </div>
              )}
              <div className="flex-1 flex justify-center">
                <Route className="w-5 h-5 text-gray-400" />
              </div>
              {end && (
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="ml-2 text-sm">
                    <div className="text-gray-500">To</div>
                    <div className="font-medium text-gray-900 dark:text-white truncate">
                      {end.lat.toFixed(4)}, {end.lng.toFixed(4)}
                    </div>
                  </div>
                </div>
              )}
            </div>
            {currentRoute && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-around text-sm">
                <div>
                  <div className="text-gray-500">Distance</div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {currentRoute.distance_m >= 1000
                      ? `${(currentRoute.distance_m / 1000).toFixed(2)} km`
                      : `${Math.round(currentRoute.distance_m)} m`}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Time</div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {currentRoute.time_min >= 60
                      ? `${Math.floor(currentRoute.time_min / 60)}h ${Math.round(currentRoute.time_min % 60)}m`
                      : `${Math.round(currentRoute.time_min)} min`}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Algorithm</div>
                  <div className="font-semibold text-gray-900 dark:text-white capitalize">
                    {currentRoute.algorithm}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
