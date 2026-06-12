import { create } from 'zustand';
import type { Coordinates, RouteResult, TravelMode, AlgorithmType, SavedRoute } from '../types';
import { supabase } from '../lib/supabase';
import { dijkstra, astar, fetchRoutesWithFallback } from '../utils/routingAlgorithms';

interface RouteState {
  start: Coordinates | null;
  end: Coordinates | null;
  currentRoute: RouteResult | null;
  alternativeRoute: RouteResult | null;
  routes: RouteResult[];          // all OSRM/simulated alternatives
  selectedRouteIdx: number;       // which alternative is active
  travelMode: TravelMode;
  algorithm: AlgorithmType;
  isCalculating: boolean;
  savedRoutes: SavedRoute[];
  routeHistory: RouteResult[];

  setStart: (coords: Coordinates | null) => void;
  setEnd: (coords: Coordinates | null) => void;
  setTravelMode: (mode: TravelMode) => void;
  setAlgorithm: (algorithm: AlgorithmType) => void;
  selectRoute: (idx: number) => void;
  calculateRoute: (roadNetwork?: unknown) => Promise<void>;
  compareAlgorithms: (roadNetwork?: unknown) => Promise<{ dijkstra: RouteResult; astar: RouteResult }>;
  saveRoute: (name: string) => Promise<void>;
  loadSavedRoutes: () => Promise<void>;
  deleteSavedRoute: (id: string) => Promise<void>;
  clearRoute: () => void;
  swapEndpoints: () => void;
}

export const useRouteStore = create<RouteState>((set, get) => ({
  start: null,
  end: null,
  currentRoute: null,
  alternativeRoute: null,
  routes: [],
  selectedRouteIdx: 0,
  travelMode: 'driving',
  algorithm: 'dijkstra',
  isCalculating: false,
  savedRoutes: [],
  routeHistory: [],

  setStart: (coords) => set({ start: coords, currentRoute: null, alternativeRoute: null, routes: [], selectedRouteIdx: 0 }),
  setEnd:   (coords) => set({ end:   coords, currentRoute: null, alternativeRoute: null, routes: [], selectedRouteIdx: 0 }),
  setTravelMode: (mode) => set({ travelMode: mode }),
  setAlgorithm:  (algorithm) => set({ algorithm }),

  selectRoute: (idx) => {
    const { routes } = get();
    if (idx >= 0 && idx < routes.length) {
      set({ selectedRouteIdx: idx, currentRoute: routes[idx] });
    }
  },

  calculateRoute: async (roadNetwork) => {
    const { start, end, travelMode } = get();
    if (!start || !end) return;

    set({ isCalculating: true });

    try {
      const alternatives = await fetchRoutesWithFallback(start, end, travelMode, roadNetwork);
      set({
        routes: alternatives,
        selectedRouteIdx: 0,
        currentRoute: alternatives[0] ?? null,
        alternativeRoute: alternatives[1] ?? null,
        isCalculating: false,
      });
    } catch (error) {
      console.error('Route calculation error:', error);
      set({ isCalculating: false });
    }
  },

  compareAlgorithms: async (roadNetwork) => {
    const { start, end, travelMode } = get();
    if (!start || !end) throw new Error('Start and end points required');

    set({ isCalculating: true });

    try {
      const [dijkstraResult, astarResult] = await Promise.all([
        dijkstra(start, end, travelMode, roadNetwork),
        astar(start, end, travelMode, roadNetwork),
      ]);

      set({
        currentRoute: dijkstraResult,
        alternativeRoute: astarResult,
        isCalculating: false,
      });

      return { dijkstra: dijkstraResult, astar: astarResult };
    } catch (error) {
      set({ isCalculating: false });
      throw error;
    }
  },

  saveRoute: async (name) => {
    const { start, end, currentRoute, travelMode, algorithm } = get();
    if (!start || !end || !currentRoute) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase.from('saved_routes').insert({
      user_id: user.id,
      name,
      start_point: `POINT(${start.lng} ${start.lat})`,
      end_point: `POINT(${end.lng} ${end.lat})`,
      route_geometry: currentRoute.path
        ? { type: 'LineString', coordinates: currentRoute.path.map((p) => [p.lng, p.lat]) }
        : null,
      total_distance_m: currentRoute.distance_m,
      estimated_time_min: currentRoute.time_min,
      travel_mode: travelMode,
      algorithm_used: algorithm,
    });

    if (error) throw error;
    get().loadSavedRoutes();
  },

  loadSavedRoutes: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('saved_routes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) console.error('Error loading routes:', error);
    else {
      const routes: SavedRoute[] = (data || []).map((r) => ({
        ...r,
        start_point: parsePostGISPoint(r.start_point),
        end_point: parsePostGISPoint(r.end_point),
      }));
      set({ savedRoutes: routes });
    }
  },

  deleteSavedRoute: async (id) => {
    const { error } = await supabase.from('saved_routes').delete().eq('id', id);
    if (error) throw error;
    set((state) => ({ savedRoutes: state.savedRoutes.filter((r) => r.id !== id) }));
  },

  clearRoute: () =>
    set({ start: null, end: null, currentRoute: null, alternativeRoute: null, routes: [], selectedRouteIdx: 0 }),

  swapEndpoints: () => {
    const { start, end } = get();
    set({ start: end, end: start, currentRoute: null, alternativeRoute: null, routes: [], selectedRouteIdx: 0 });
  },
}));

function parsePostGISPoint(pointStr: string): Coordinates {
  if (typeof pointStr === 'object' && pointStr !== null) {
    const p = pointStr as { coordinates?: number[] };
    if (p.coordinates) return { lng: p.coordinates[0], lat: p.coordinates[1] };
  }
  const match = pointStr.match(/POINT\(([^ ]+) ([^)]+)\)/);
  if (match) return { lng: parseFloat(match[1]), lat: parseFloat(match[2]) };
  return { lat: 0, lng: 0 };
}
