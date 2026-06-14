import { useState, useEffect, useCallback, useRef } from 'react';
import { InteractiveMap } from '../components/map/InteractiveMap';
import { fetchServiceLocations, fetchRoadSegments } from '../utils/api';
import { dijkstra, astar, formatDistance, formatTime } from '../utils/routingAlgorithms';
import { useRouteStore } from '../stores/routeStore';
import { useAuthStore } from '../stores/authStore';
import { useMapStore } from '../stores/mapStore';
import type { ServiceLocation, RoadSegment, TravelMode, AlgorithmType, Coordinates, ServiceCategory } from '../types';
import { Card, CardHeader, CardBody, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import {
  Route, MapPin, Navigation, Timer, ArrowRightLeft,
  GitCompare, Download, Save, Loader2, CheckCircle,
  LocateFixed, AlertTriangle, TrendingDown, Info, Car, Footprints, Bus,
  Star, Gauge, Search, X,
} from 'lucide-react';

const TRAFFIC_HOURS = { morning: [7, 8, 9], evening: [17, 18, 19] };

const CATEGORY_COLORS: Record<ServiceCategory, string> = {
  hospital: '#ef4444',
  health_center: '#f97316',
  school: '#8b5cf6',
  police_station: '#3b82f6',
  fire_station: '#dc2626',
  bank: '#059669',
  pharmacy: '#ec4899',
  bus_stop: '#6366f1',
  district_office: '#64748b',
  trade_center: '#ea580c',
  water_point: '#0ea5e9',
  public_utility: '#14b8a6',
};

function getCategoryColor(category: ServiceCategory): string {
  return CATEGORY_COLORS[category] || '#6b7280';
}

function getTrafficLabel(score: number): { label: string; colorClass: string } {
  if (score < 20) return { label: 'Light traffic', colorClass: 'text-green-600' };
  if (score < 50) return { label: 'Moderate traffic', colorClass: 'text-yellow-600' };
  return { label: 'Heavy traffic', colorClass: 'text-red-600' };
}

function getTrafficLevel() {
  const hour = new Date().getHours();
  const isWeekend = [0, 6].includes(new Date().getDay());
  if (isWeekend) return { level: 'low' as const,      label: 'Light Traffic',    color: 'text-green-600',  factor: 0.8 };
  if (TRAFFIC_HOURS.morning.includes(hour) || TRAFFIC_HOURS.evening.includes(hour))
    return     { level: 'heavy' as const,    label: 'Heavy Traffic',    color: 'text-red-600',    factor: 1.8 };
  if (hour >= 10 && hour <= 16)
    return     { level: 'moderate' as const, label: 'Moderate Traffic', color: 'text-yellow-600', factor: 1.2 };
  return       { level: 'low' as const,      label: 'Light Traffic',    color: 'text-green-600',  factor: 0.9 };
}

export function RoutePlanningPage() {
  const [services, setServices] = useState<ServiceLocation[]>([]);
  const [roads, setRoads]       = useState<RoadSegment[]>([]);
  const [loading, setLoading]   = useState(true);
  const [isLocating, setIsLocating]   = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [avoidTraffic, setAvoidTraffic]   = useState(true);
  const [comparisonResults, setComparisonResults] = useState<{
    dijkstra: Awaited<ReturnType<typeof dijkstra>>;
    astar:    Awaited<ReturnType<typeof astar>>;
  } | null>(null);
  const [saved, setSaved] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ServiceLocation[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const traffic = getTrafficLevel();

  const {
    start, end, currentRoute,
    routes, selectedRouteIdx, selectRoute,
    travelMode, setTravelMode,
    algorithm, setAlgorithm,
    setStart, setEnd,
    calculateRoute, isCalculating,
    saveRoute,
  } = useRouteStore();

  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    Promise.all([fetchServiceLocations(), fetchRoadSegments()])
      .then(([s, r]) => { setServices(s); setRoads(r); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Search functionality
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results = services.filter((s) =>
      s.name.toLowerCase().includes(query) ||
      (s.address && s.address.toLowerCase().includes(query)) ||
      s.category.toLowerCase().includes(query)
    ).slice(0, 8);

    setSearchResults(results);
    setShowSearchResults(true);
  }, [searchQuery, services]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectDestination = useCallback((service: ServiceLocation) => {
    setEnd(service.coordinates);
    setSearchQuery('');
    setShowSearchResults(false);
    useMapStore.getState().zoomToLocation(service.coordinates, 15);
  }, [setEnd]);

  const handleManualCoordinateInput = useCallback((input: string) => {
    const match = input.match(/(-?\d+\.?\d*)\s*[,\s]\s*(-?\d+\.?\d*)/);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        setEnd({ lat, lng });
        useMapStore.getState().zoomToLocation({ lat, lng }, 15);
      }
    }
  }, [setEnd]);

  const handleUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) { setLocationError('Geolocation not supported.'); return; }
    setIsLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setStart(coords);
        setIsLocating(false);
        useMapStore.getState().zoomToLocation(coords, 15);
        useMapStore.getState().setUserLocation(coords);
      },
      (err) => {
        setIsLocating(false);
        setLocationError(
          err.code === err.PERMISSION_DENIED
            ? 'Location access denied. Please allow location in your browser.'
            : 'Could not get location. Click on map instead.'
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [setStart]);

  const applyTrafficFactor = (r: RoadSegment[]) =>
    avoidTraffic ? r.map((seg) => ({ ...seg, traffic_factor: seg.traffic_factor * traffic.factor })) : r;

  const handleCalculateRoute = async () => {
    if (!start || !end) return;
    setSaved(false);
    setComparisonResults(null);
    await calculateRoute(applyTrafficFactor(roads));
  };

  const handleCompareAlgorithms = async () => {
    if (!start || !end) return;
    const adjustedRoads = applyTrafficFactor(roads);
    const [dResult, aResult] = await Promise.all([
      dijkstra(start, end, travelMode, adjustedRoads),
      astar(start, end, travelMode, adjustedRoads),
    ]);
    setComparisonResults({ dijkstra: dResult, astar: aResult });
    useRouteStore.setState({ currentRoute: dResult });
    setSaved(false);
  };

  const handleSaveRoute = async () => {
    if (!currentRoute || !isAuthenticated) return;
    try { await saveRoute(`Route ${new Date().toLocaleDateString()}`); setSaved(true); }
    catch { /* ignore */ }
  };

  const handleExportResults = () => {
    if (!comparisonResults) return;
    const blob = new Blob([JSON.stringify({
      date: new Date().toISOString(), start, end, travelMode,
      trafficLevel: traffic.label, avoidTraffic,
      dijkstra: comparisonResults.dijkstra,
      astar: comparisonResults.astar,
    }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `route-analysis-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadTrip = () => {
    if (!currentRoute || !start || !end) return;

    const tripData = {
      tripInfo: {
        date: new Date().toISOString(),
        name: `Trip from ${start.lat.toFixed(4)},${start.lng.toFixed(4)} to ${end.lat.toFixed(4)},${end.lng.toFixed(4)}`,
        travelMode,
      },
      start: {
        coordinates: start,
        name: 'Start Point',
      },
      end: {
        coordinates: end,
        name: 'Destination',
      },
      route: {
        distance: {
          meters: currentRoute.distance_m,
          kilometers: (currentRoute.distance_m / 1000).toFixed(2),
          formatted: formatDistance(currentRoute.distance_m),
        },
        estimatedTime: {
          minutes: currentRoute.time_min,
          formatted: formatTime(currentRoute.time_min),
        },
        trafficScore: currentRoute.trafficScore,
        trafficLevel: currentRoute.trafficScore && currentRoute.trafficScore < 30
          ? 'Low'
          : currentRoute.trafficScore && currentRoute.trafficScore < 60
            ? 'Medium'
            : 'High',
        algorithm: currentRoute.algorithm,
        isRecommended: currentRoute.isRecommended || false,
      },
      path: currentRoute.path.map((p, i) => ({
        index: i,
        lat: p.lat,
        lng: p.lng,
      })),
      trafficConditions: {
        currentLevel: traffic.level,
        currentLabel: traffic.label,
        avoidTrafficEnabled: avoidTraffic,
      },
      metadata: {
        exportedAt: new Date().toLocaleString(),
        exportedBy: 'Smart Route Kigali GIS',
        version: '1.0.0',
      },
    };

    const blob = new Blob([JSON.stringify(tripData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trip-${new Date().toISOString().split('T')[0]}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const TravelModeIcon = travelMode === 'walking' ? Footprints : travelMode === 'public_transport' ? Bus : Car;

  return (
    <div className="h-screen pt-16 flex">
      {/* ── Sidebar ───────────────────────────────────────── */}
      <div className="w-96 bg-white dark:bg-gray-800 shadow-lg z-20 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-kigali-green to-kigali-blue flex-shrink-0">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-2">
              <Route className="w-6 h-6" />
              <div>
                <h1 className="text-lg font-bold">Route Planning</h1>
                <p className="text-sm text-white/80">Shortest Path Analysis</p>
              </div>
            </div>
            <div className="flex items-center space-x-1.5 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium">
              <span className={`w-2 h-2 rounded-full ${traffic.level === 'heavy' ? 'bg-red-400 animate-pulse' : traffic.level === 'moderate' ? 'bg-yellow-300' : 'bg-green-400'}`} />
              <span>{traffic.label}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Traffic alert */}
          {traffic.level === 'heavy' && (
            <div className="flex items-start space-x-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-700 dark:text-red-400">Rush Hour Detected</p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">Heavy traffic. Route uses less-congested paths.</p>
              </div>
            </div>
          )}

          {/* Start Point */}
          <Card>
            <CardHeader title="Start Point" />
            <CardBody className="space-y-3">
              <button
                onClick={handleUseMyLocation}
                disabled={isLocating}
                className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg bg-kigali-blue/10 hover:bg-kigali-blue/20 text-kigali-blue border border-kigali-blue/20 transition-colors disabled:opacity-50"
              >
                {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
                <span className="text-sm font-medium">
                  {isLocating ? 'Getting location...' : 'Use My Current Location'}
                </span>
              </button>
              {locationError && (
                <p className="text-xs text-red-500 flex items-start space-x-1">
                  <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span>{locationError}</span>
                </p>
              )}
              <div className="flex items-center space-x-2 text-xs text-gray-400">
                <div className="flex-1 border-t border-dashed border-gray-300 dark:border-gray-600" />
                <span>or click on map</span>
                <div className="flex-1 border-t border-dashed border-gray-300 dark:border-gray-600" />
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-kigali-green/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-kigali-green" />
                </div>
                <div className="flex-1 min-w-0">
                  {start ? (
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {start.lat.toFixed(5)}, {start.lng.toFixed(5)}
                      </p>
                      <p className="text-xs text-green-600">Start point set</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">No start point selected</p>
                  )}
                </div>
                {start && <button onClick={() => setStart(null)} className="text-xs text-red-400 hover:text-red-600">Clear</button>}
              </div>
            </CardBody>
          </Card>

          {/* Destination */}
          <Card>
            <CardHeader title="Destination" />
            <CardBody className="space-y-3">
              {/* Search box */}
              <div className="relative" ref={searchRef}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
                    placeholder="Search destination by name or address..."
                    className="w-full pl-9 pr-9 py-2.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-kigali-green focus:border-transparent"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => { setSearchQuery(''); setShowSearchResults(false); }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Search results dropdown */}
                {showSearchResults && searchResults.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    {searchResults.map((service) => (
                      <button
                        key={service.id}
                        onClick={() => handleSelectDestination(service)}
                        className="w-full text-left px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                      >
                        <div className="flex items-start gap-2">
                          <div
                            className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                            style={{ backgroundColor: getCategoryColor(service.category) }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{service.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{service.category.replace(/_/g, ' ')}</p>
                            {service.address && <p className="text-xs text-gray-400 truncate">{service.address}</p>}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {showSearchResults && searchQuery.length >= 2 && searchResults.length === 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
                    <p className="text-sm text-gray-500">No results found. Try a different search or click on the map.</p>
                    <button
                      onClick={() => handleManualCoordinateInput(searchQuery)}
                      className="mt-2 text-xs text-kigali-green hover:underline"
                    >
                      Use "{searchQuery}" as coordinates
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2 text-xs text-gray-400">
                <div className="flex-1 border-t border-dashed border-gray-300 dark:border-gray-600" />
                <span>or click on map</span>
                <div className="flex-1 border-t border-dashed border-gray-300 dark:border-gray-600" />
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                  <Navigation className="w-4 h-4 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  {end ? (
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {end.lat.toFixed(5)}, {end.lng.toFixed(5)}
                      </p>
                      <p className="text-xs text-red-500">Destination set</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">Search or click on map</p>
                  )}
                </div>
                {end && <button onClick={() => setEnd(null)} className="text-xs text-red-400 hover:text-red-600">Clear</button>}
              </div>
            </CardBody>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader title="Settings" />
            <CardBody className="space-y-4">
              <Select
                label="Travel Mode"
                value={travelMode}
                onChange={(e) => setTravelMode(e.target.value as TravelMode)}
                options={[
                  { value: 'driving', label: 'Driving' },
                  { value: 'walking', label: 'Walking' },
                  { value: 'public_transport', label: 'Public Transport' },
                ]}
              />
              <Select
                label="Algorithm (comparison)"
                value={algorithm}
                onChange={(e) => setAlgorithm(e.target.value as AlgorithmType)}
                options={[
                  { value: 'dijkstra', label: "Dijkstra's Algorithm" },
                  { value: 'astar', label: 'A* Algorithm' },
                ]}
              />
              <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <div className="flex items-center space-x-2">
                  <TrendingDown className="w-4 h-4 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Avoid Congestion</p>
                    <p className="text-xs text-gray-500">Prefer low-traffic roads</p>
                  </div>
                </div>
                <button
                  onClick={() => setAvoidTraffic(!avoidTraffic)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${avoidTraffic ? 'bg-kigali-green' : 'bg-gray-300 dark:bg-gray-600'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${avoidTraffic ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              <div className="flex items-center justify-center">
                <button
                  onClick={() => { const t = start; setStart(end); setEnd(t); }}
                  disabled={!start || !end}
                  className="flex items-center space-x-2 text-sm text-kigali-green hover:text-kigali-green/80 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>Swap endpoints</span>
                </button>
              </div>
            </CardBody>
          </Card>

          {/* Action buttons */}
          <div className="space-y-2">
            <Button
              onClick={handleCalculateRoute}
              disabled={!start || !end || isCalculating}
              className="w-full"
            >
              {isCalculating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <TravelModeIcon className="w-4 h-4 mr-2" />}
              {isCalculating ? 'Finding routes...' : 'Find Route Alternatives'}
            </Button>
            <Button
              variant="outline"
              onClick={handleCompareAlgorithms}
              disabled={!start || !end || isCalculating}
              className="w-full"
            >
              <GitCompare className="w-4 h-4 mr-2" />
              Compare Algorithms
            </Button>
            {!start && !end && (
              <p className="text-xs text-center text-gray-400 pt-1">Set start &amp; destination first</p>
            )}
            {start && !end && (
              <p className="text-xs text-center text-yellow-600 dark:text-yellow-400 pt-1">
                Now click the map or a service to set your destination
              </p>
            )}
          </div>

          {/* ── Route Alternatives with Legend ─────────────────────────── */}
          {routes.length > 0 && (
            <div className="space-y-3">
              {/* Route Legend */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Route className="w-4 h-4" />
                    Route Legend
                  </h3>
                  <span className="text-xs text-gray-400">{routes.length} options</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {routes.map((r, i) => (
                    <div
                      key={i}
                      onClick={() => selectRoute(i)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all border-2 ${
                        i === selectedRouteIdx
                          ? 'shadow-md scale-105'
                          : 'opacity-60 hover:opacity-100'
                      }`}
                      style={{
                        backgroundColor: r.color + '20',
                        borderColor: i === selectedRouteIdx ? r.color : r.color + '40',
                        color: r.color,
                      }}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: r.color }}
                      />
                      <span>{r.label}</span>
                      {r.isRecommended && <Star className="w-3 h-3 fill-current" />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Route Cards */}
              <div className="space-y-2">
                {routes.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => selectRoute(i)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      i === selectedRouteIdx
                        ? 'shadow-lg scale-[1.01] border-2'
                        : 'opacity-70 hover:opacity-100 border-gray-200 dark:border-gray-700'
                    }`}
                    style={
                      i === selectedRouteIdx
                        ? { borderColor: r.color, backgroundColor: r.color + '08' }
                        : {}
                    }
                  >
                    {/* Header with route color indicator */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-md"
                          style={{ backgroundColor: r.color }}
                        >
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-900 dark:text-white truncate">
                              {r.label}
                            </span>
                            {r.isRecommended && (
                              <span className="flex items-center gap-0.5 text-[10px] font-bold text-white bg-green-600 px-2 py-0.5 rounded-full flex-shrink-0">
                                <Star className="w-2.5 h-2.5" />
                                Recommended
                              </span>
                            )}
                          </div>
                          <p className="text-xs capitalize mt-0.5">
                            {r.trafficScore !== undefined && (
                              <span className={getTrafficLabel(r.trafficScore).colorClass}>
                                {getTrafficLabel(r.trafficScore).label}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Traffic indicator */}
                      {r.trafficScore !== undefined && (
                        <div className="flex flex-col items-end flex-shrink-0">
                          <div className="flex items-center gap-1">
                            <Gauge className="w-4 h-4 text-gray-400" />
                            <span
                              className={`text-sm font-bold ${
                                r.trafficScore < 20 ? 'text-green-600' : r.trafficScore < 50 ? 'text-yellow-600' : 'text-red-600'
                              }`}
                            >
                              {r.trafficScore < 20 ? 'Low' : r.trafficScore < 50 ? 'Medium' : 'High'}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-400">Traffic: {r.trafficScore}/100</span>
                        </div>
                      )}
                    </div>

                    {/* Metrics grid */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center bg-white dark:bg-gray-900 rounded-lg py-2 px-1 shadow-sm">
                        <div className="flex items-center justify-center gap-1 text-gray-400 mb-0.5">
                          <Route className="w-3 h-3" />
                          <span className="text-[10px]">Distance</span>
                        </div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{formatDistance(r.distance_m)}</p>
                      </div>
                      <div className="text-center bg-white dark:bg-gray-900 rounded-lg py-2 px-1 shadow-sm">
                        <div className="flex items-center justify-center gap-1 text-gray-400 mb-0.5">
                          <Timer className="w-3 h-3" />
                          <span className="text-[10px]">Time</span>
                        </div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{formatTime(r.time_min)}</p>
                      </div>
                      <div className="text-center bg-white dark:bg-gray-900 rounded-lg py-2 px-1 shadow-sm">
                        <div className="flex items-center justify-center gap-1 text-gray-400 mb-0.5">
                          <Gauge className="w-3 h-3" />
                          <span className="text-[10px]">Traffic</span>
                        </div>
                        <div className="flex items-center justify-center">
                          <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                r.trafficScore && r.trafficScore < 20
                                  ? 'bg-green-500'
                                  : r.trafficScore && r.trafficScore < 50
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                              }`}
                              style={{ width: `${r.trafficScore || 50}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Traffic avoidance indicator */}
                    {avoidTraffic && traffic.level !== 'low' && i === 0 && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-lg px-2 py-1">
                        <TrendingDown className="w-3.5 h-3.5" />
                        <span>Avoids current {traffic.level} traffic congestion</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <CardFooter className="pt-0 px-0">
                <div className="flex flex-col space-y-2 w-full">
                  <div className="flex space-x-2 w-full">
                    {currentRoute && (
                      <Button variant="outline" size="sm" onClick={handleDownloadTrip} className="flex-1">
                        <Download className="w-4 h-4 mr-1" />
                        Download Trip
                      </Button>
                    )}
                    {isAuthenticated && currentRoute && (
                      <Button variant="outline" size="sm" onClick={handleSaveRoute} disabled={saved} className="flex-1">
                        {saved ? <CheckCircle className="w-4 h-4 mr-1 text-green-500" /> : <Save className="w-4 h-4 mr-1" />}
                        {saved ? 'Saved' : 'Save Route'}
                      </Button>
                    )}
                  </div>
                  {!isAuthenticated && currentRoute && (
                    <p className="text-xs text-center text-gray-400">Sign in to save routes to your account</p>
                  )}
                </div>
              </CardFooter>
            </div>
          )}

          {/* Algorithm Comparison */}
          {comparisonResults && (
            <Card>
              <CardHeader title="Algorithm Comparison" />
              <CardBody>
                <div className="space-y-2">
                  {([
                    { label: 'Dijkstra', data: comparisonResults.dijkstra, color: '#22c55e' },
                    { label: 'A*',       data: comparisonResults.astar,    color: '#3b82f6' },
                  ] as const).map(({ label, data, color }) => (
                    <div key={label} className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <span className="text-sm font-semibold w-16" style={{ color }}>{label}</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{formatDistance(data.distance_m)}</span>
                      <span className="text-sm text-gray-500">{formatTime(data.time_min)}</span>
                      <span className="text-xs text-gray-400">{data.execution_time_ms.toFixed(1)}ms</span>
                    </div>
                  ))}
                </div>
                {comparisonResults.astar.execution_time_ms < comparisonResults.dijkstra.execution_time_ms && (
                  <div className="mt-2 text-center text-xs text-green-600 font-medium bg-green-50 rounded-lg p-2">
                    A* was {((comparisonResults.dijkstra.execution_time_ms - comparisonResults.astar.execution_time_ms) / comparisonResults.dijkstra.execution_time_ms * 100).toFixed(1)}% faster
                  </div>
                )}
                <Button variant="outline" size="sm" onClick={handleExportResults} className="w-full mt-3">
                  <Download className="w-4 h-4 mr-1" />
                  Export Analysis
                </Button>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      {/* ── Map ───────────────────────────────────────────── */}
      <div className="flex-1 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-900">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-kigali-green mx-auto" />
              <p className="mt-3 text-gray-500 text-sm">Loading map data...</p>
            </div>
          </div>
        ) : (
          <InteractiveMap
            services={services}
            showControls={false}
            showRouteControls={true}
            showLayerPanel={false}
          />
        )}

        {/* Instruction overlays */}
        {!start && !loading && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-lg px-5 py-3 flex items-center space-x-3 pointer-events-none">
            <MapPin className="w-5 h-5 text-kigali-green flex-shrink-0" />
            <p className="text-sm text-gray-700 dark:text-gray-200">
              Use "My Location" or <span className="font-semibold">click the map</span> to set your start point
            </p>
          </div>
        )}
        {start && !end && !loading && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-lg px-5 py-3 flex items-center space-x-3 pointer-events-none">
            <Navigation className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-gray-700 dark:text-gray-200">
              Now <span className="font-semibold">click the map</span> or tap a service icon to set destination
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
