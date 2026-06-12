import { useState, useEffect, useCallback } from 'react';
import { InteractiveMap } from '../components/map/InteractiveMap';
import { fetchServiceLocations, fetchRoadSegments } from '../utils/api';
import { dijkstra, astar, formatDistance, formatTime } from '../utils/routingAlgorithms';
import { useRouteStore } from '../stores/routeStore';
import { useAuthStore } from '../stores/authStore';
import { useMapStore } from '../stores/mapStore';
import type { ServiceLocation, RoadSegment, TravelMode, AlgorithmType } from '../types';
import { Card, CardHeader, CardBody, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import {
  Route, MapPin, Navigation, Timer, ArrowRightLeft,
  GitCompare, Download, Save, Loader2, CheckCircle,
  LocateFixed, AlertTriangle, TrendingDown, Info, Car, Footprints, Bus,
  Star, Gauge,
} from 'lucide-react';

const TRAFFIC_HOURS = { morning: [7, 8, 9], evening: [17, 18, 19] };

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
            <CardBody>
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
                    <p className="text-sm text-gray-400">Click on map or a service marker</p>
                  )}
                </div>
                {end && <button onClick={() => setEnd(null)} className="text-xs text-red-400 hover:text-red-600">Clear</button>}
              </div>
              {!end && (
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 rounded-lg p-2">
                  Tap any service icon on the map and press "Set as Destination"
                </p>
              )}
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

          {/* ── Route Alternatives ─────────────────────────── */}
          {routes.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Route Alternatives
                </h3>
                <span className="text-xs text-gray-400">{routes.length} options found</span>
              </div>

              {routes.map((r, i) => (
                <button
                  key={i}
                  onClick={() => selectRoute(i)}
                  className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                    i === selectedRouteIdx
                      ? 'shadow-md scale-[1.01]'
                      : 'opacity-70 hover:opacity-90 border-gray-200 dark:border-gray-700'
                  }`}
                  style={
                    i === selectedRouteIdx
                      ? { borderColor: r.color, backgroundColor: r.color + '0d' }
                      : {}
                  }
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: r.color }}
                      />
                      <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {r.label}
                      </span>
                      {r.isRecommended && (
                        <span className="flex items-center gap-0.5 text-[10px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full flex-shrink-0">
                          <Star className="w-2.5 h-2.5" />
                          Best
                        </span>
                      )}
                    </div>
                    {r.trafficScore !== undefined && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Gauge className="w-3 h-3 text-gray-400" />
                        <span
                          className={`text-xs font-semibold ${
                            r.trafficScore < 20 ? 'text-green-600' : r.trafficScore < 50 ? 'text-yellow-600' : 'text-red-600'
                          }`}
                        >
                          {r.trafficScore < 20 ? 'Low traffic' : r.trafficScore < 50 ? 'Moderate' : 'High traffic'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div className="text-center bg-white dark:bg-gray-900 rounded-lg py-1.5">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{formatDistance(r.distance_m)}</p>
                      <p className="text-[10px] text-gray-400">Distance</p>
                    </div>
                    <div className="text-center bg-white dark:bg-gray-900 rounded-lg py-1.5">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{formatTime(r.time_min)}</p>
                      <p className="text-[10px] text-gray-400">Est. Time</p>
                    </div>
                  </div>
                  {avoidTraffic && traffic.level !== 'low' && i === 0 && (
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] text-green-700 dark:text-green-400">
                      <TrendingDown className="w-3 h-3" />
                      Avoids {traffic.level} congestion
                    </div>
                  )}
                </button>
              ))}

              <CardFooter className="pt-0 px-0">
                <div className="flex space-x-2 w-full">
                  {isAuthenticated && currentRoute && (
                    <Button variant="outline" size="sm" onClick={handleSaveRoute} disabled={saved} className="flex-1">
                      {saved ? <CheckCircle className="w-4 h-4 mr-1 text-green-500" /> : <Save className="w-4 h-4 mr-1" />}
                      {saved ? 'Saved' : 'Save Route'}
                    </Button>
                  )}
                  {comparisonResults && (
                    <Button variant="outline" size="sm" onClick={handleExportResults} className="flex-1">
                      <Download className="w-4 h-4 mr-1" />
                      Export
                    </Button>
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
