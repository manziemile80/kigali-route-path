import { useState, useEffect, useCallback } from 'react';
import { InteractiveMap } from '../components/map/InteractiveMap';
import { fetchServiceLocations } from '../utils/api';
import type { ServiceLocation, ServiceCategory, Coordinates } from '../types';
import { useMapStore } from '../stores/mapStore';
import { useRouteStore } from '../stores/routeStore';
import { Button } from '../components/ui/Button';
import {
  Search, MapPin, Navigation, X, Loader2,
  LocateFixed, ArrowUpDown, Route,
} from 'lucide-react';

const CATEGORY_FILTERS: { id: ServiceCategory; label: string; color: string }[] = [
  { id: 'hospital',          label: 'Hospitals',    color: '#ef4444' },
  { id: 'health_center',     label: 'Health',       color: '#f97316' },
  { id: 'school',            label: 'Schools',      color: '#8b5cf6' },
  { id: 'police_station',    label: 'Police',       color: '#3b82f6' },
  { id: 'fire_station',      label: 'Fire',         color: '#dc2626' },
  { id: 'bank',              label: 'Banks',        color: '#059669' },
  { id: 'pharmacy',          label: 'Pharmacies',   color: '#ec4899' },
  { id: 'bus_stop',          label: 'Bus Stops',    color: '#6366f1' },
  { id: 'government_office', label: 'Government',   color: '#64748b' },
  { id: 'water_point',       label: 'Water',        color: '#0ea5e9' },
  { id: 'public_utility',    label: 'Utilities',    color: '#14b8a6' },
];

function haversineKm(a: Coordinates, b: Coordinates): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function formatDist(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

type ServiceWithDist = ServiceLocation & { distKm: number | null };

export function MapPage() {
  const [services, setServices]     = useState<ServiceLocation[]>([]);
  const [loading, setLoading]       = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [sortByNearest, setSortByNearest] = useState(false);

  const {
    selectedLocation, setSelectedLocation,
    selectedCategories, toggleCategory, setCategories,
    userLocation, setUserLocation, zoomToLocation,
  } = useMapStore();

  const { setStart, setEnd } = useRouteStore();

  useEffect(() => {
    fetchServiceLocations()
      .then(setServices)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Auto-enable nearest sorting when user location is obtained
  useEffect(() => {
    if (userLocation) setSortByNearest(true);
  }, [userLocation]);

  const handleUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: Coordinates = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(coords);
        setStart(coords);
        zoomToLocation(coords, 14);
        setIsLocating(false);
      },
      () => setIsLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [setUserLocation, setStart, zoomToLocation]);

  // Build a list of services with distance attached
  const baseFiltered: ServiceWithDist[] = services
    .filter((s) => {
      const matchCat = selectedCategories.length === 0 || selectedCategories.includes(s.category);
      const matchQ =
        searchQuery === '' ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.address && s.address.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchQ;
    })
    .map((s) => ({
      ...s,
      distKm: userLocation ? haversineKm(userLocation, s.coordinates) : null,
    }));

  const filteredServices: ServiceWithDist[] =
    sortByNearest && userLocation
      ? [...baseFiltered].sort((a, b) => (a.distKm ?? Infinity) - (b.distKm ?? Infinity))
      : baseFiltered;

  // The plain ServiceLocation[] for passing to the map
  const servicesForMap = filteredServices.map(({ distKm: _, ...s }) => s as ServiceLocation);

  return (
    <div className="h-screen pt-16 flex">
      {/* ── Sidebar ─────────────────────────────────────────── */}
      <div className="w-80 bg-white dark:bg-gray-800 shadow-lg z-20 flex flex-col overflow-hidden">

        {/* GPS / Search header */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-700 space-y-2">
          {/* Use My Location button */}
          <button
            onClick={handleUseMyLocation}
            disabled={isLocating}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
              userLocation
                ? 'bg-kigali-green/10 border-kigali-green/30 text-kigali-green'
                : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-kigali-green/50 hover:text-kigali-green'
            }`}
          >
            {isLocating ? (
              <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
            ) : (
              <LocateFixed className="w-4 h-4 flex-shrink-0" />
            )}
            <span className="flex-1 text-left">
              {isLocating ? 'Getting location…' : userLocation ? 'Location set — tap to update' : 'Use My Location'}
            </span>
            {userLocation && (
              <button
                onClick={(e) => { e.stopPropagation(); setUserLocation(null); setSortByNearest(false); }}
                className="text-gray-400 hover:text-red-500"
                title="Clear location"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </button>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search services…"
              className="w-full pl-9 pr-9 py-2 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-kigali-green"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Category filter chips — always visible */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Filter by category
            </span>
            <div className="flex items-center gap-2">
              {userLocation && (
                <button
                  onClick={() => setSortByNearest(!sortByNearest)}
                  className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border transition-all ${
                    sortByNearest
                      ? 'bg-kigali-blue text-white border-kigali-blue'
                      : 'text-gray-500 border-gray-300 hover:border-kigali-blue hover:text-kigali-blue'
                  }`}
                  title="Sort by nearest"
                >
                  <ArrowUpDown className="w-3 h-3" />
                  Nearest
                </button>
              )}
              {selectedCategories.length > 0 && (
                <button onClick={() => setCategories([])} className="text-xs text-kigali-green hover:underline font-medium">
                  Clear all
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setCategories([])}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                selectedCategories.length === 0
                  ? 'bg-gray-800 dark:bg-white text-white dark:text-gray-900 border-gray-800 dark:border-white shadow-sm'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-gray-500'
              }`}
            >
              All
            </button>

            {CATEGORY_FILTERS.map(({ id, label, color }) => {
              const active = selectedCategories.includes(id);
              return (
                <button
                  key={id}
                  onClick={() => toggleCategory(id)}
                  className="px-2.5 py-1 rounded-full text-xs font-medium border transition-all shadow-sm"
                  style={
                    active
                      ? { backgroundColor: color, borderColor: color, color: '#fff' }
                      : { backgroundColor: 'white', borderColor: color + '60', color }
                  }
                >
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle"
                    style={{ backgroundColor: active ? '#ffffffbb' : color }}
                  />
                  {label}
                </button>
              );
            })}
          </div>

          <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
            {userLocation
              ? `${filteredServices.length} nearby service${filteredServices.length !== 1 ? 's' : ''}`
              : selectedCategories.length === 0
              ? `${services.length} total services`
              : `${filteredServices.length} of ${services.length} shown`}
          </p>
        </div>

        {/* Results list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-kigali-green" />
            </div>
          ) : (
            <div className="p-2">
              {!userLocation && selectedCategories.length === 0 && (
                <div className="mx-2 mb-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                  <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                    Use My Location to see nearest facilities first
                  </p>
                  <p className="text-xs text-blue-500 dark:text-blue-400 mt-0.5">
                    Tap the button above, then select a category to find the closest one.
                  </p>
                </div>
              )}

              {filteredServices.length === 0 ? (
                <div className="text-center py-10 text-gray-400 dark:text-gray-500">
                  <p className="text-sm">No services match your filters.</p>
                  <button
                    onClick={() => { setCategories([]); setSearchQuery(''); }}
                    className="mt-2 text-xs text-kigali-green hover:underline"
                  >
                    Reset filters
                  </button>
                </div>
              ) : (
                filteredServices.map((service, i) => {
                  const cat = CATEGORY_FILTERS.find((c) => c.id === service.category);
                  const isNearest = sortByNearest && userLocation && i === 0;
                  return (
                    <div
                      key={service.id}
                      onClick={() => setSelectedLocation(service)}
                      className={`p-3 rounded-lg cursor-pointer transition-all mb-1 border group ${
                        selectedLocation?.id === service.id
                          ? 'bg-kigali-green/10 border-kigali-green'
                          : isNearest
                          ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 border-transparent'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5"
                          style={{ backgroundColor: cat?.color ?? '#6b7280' }}
                        >
                          {isNearest ? '★' : service.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {service.name}
                            </h4>
                            {service.distKm !== null && (
                              <span
                                className="text-xs font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
                                style={{
                                  backgroundColor: (cat?.color ?? '#6b7280') + '18',
                                  color: cat?.color ?? '#6b7280',
                                }}
                              >
                                {formatDist(service.distKm)}
                              </span>
                            )}
                          </div>
                          <p className="text-xs capitalize" style={{ color: cat?.color ?? '#6b7280' }}>
                            {service.category.replace(/_/g, ' ')}
                          </p>
                          {service.address && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                              {service.address}
                            </p>
                          )}
                        </div>
                      </div>

                      {(service.emergency_services || service.wheelchair_accessible) && (
                        <div className="mt-1.5 flex gap-1.5 ml-10">
                          {service.emergency_services && (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Emergency</span>
                          )}
                          {service.wheelchair_accessible && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Accessible</span>
                          )}
                        </div>
                      )}

                      {/* Quick navigate on hover */}
                      <div className="mt-2 hidden group-hover:flex gap-1.5 ml-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEnd(service.coordinates);
                            setSelectedLocation(service);
                          }}
                          className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full text-white transition-colors"
                          style={{ backgroundColor: cat?.color ?? '#6b7280' }}
                        >
                          <Route className="w-3 h-3" />
                          Navigate
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            zoomToLocation(service.coordinates, 16);
                            setSelectedLocation(service);
                          }}
                          className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
                        >
                          <MapPin className="w-3 h-3" />
                          View
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Selected location action panel */}
        {selectedLocation && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                  {selectedLocation.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                  {selectedLocation.category.replace(/_/g, ' ')}
                </p>
                {selectedLocation.address && (
                  <p className="text-xs text-gray-400 mt-0.5">{selectedLocation.address}</p>
                )}
                {userLocation && (() => {
                  const d = haversineKm(userLocation, selectedLocation.coordinates);
                  return (
                    <p className="text-xs font-semibold text-kigali-green mt-1">
                      {formatDist(d)} from your location
                    </p>
                  );
                })()}
              </div>
              <button
                onClick={() => setSelectedLocation(null)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded ml-2"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={() => setEnd(selectedLocation.coordinates)} className="flex-1">
                <Navigation className="w-4 h-4 mr-1" />
                Navigate Here
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setStart(selectedLocation.coordinates)}
                title="Set as start point"
              >
                <MapPin className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Map ─────────────────────────────────────────────── */}
      <div className="flex-1 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-900">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-kigali-green mx-auto" />
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading map data…</p>
            </div>
          </div>
        ) : (
          <InteractiveMap
            services={servicesForMap}
            showControls={true}
            showRouteControls={true}
            showLayerPanel={false}
          />
        )}
      </div>
    </div>
  );
}
