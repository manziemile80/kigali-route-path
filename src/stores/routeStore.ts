import { create } from 'zustand';
import type { Coordinates, RouteResult, TravelMode, AlgorithmType, SavedRoute } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { dijkstra, astar, fetchRoutesWithFallback } from '../utils/routingAlgorithms';

interface RouteHistory {
  id: string;
  name?: string;
  start: Coordinates;
  end: Coordinates;
  startName?: string;
  endName?: string;
  distance_m: number;
  time_min: number;
  trafficScore: number;
  travelMode: TravelMode;
  createdAt: string;
}

interface FavoriteRoute extends SavedRoute {
  isFavorite: boolean;
}

interface TrafficDataRecord {
  id: string;
  start: Coordinates;
  end: Coordinates;
  hour: number;
  dayOfWeek: number;
  congestionLevel: 'low' | 'medium' | 'high';
  actualTimeMinutes: number;
  distanceMeters: number;
  createdAt: string;
}

interface RouteState {
  start: Coordinates | null;
  end: Coordinates | null;
  startName: string | null;
  endName: string | null;
  currentRoute: RouteResult | null;
  alternativeRoute: RouteResult | null;
  routes: RouteResult[];
  selectedRouteIdx: number;
  travelMode: TravelMode;
  algorithm: AlgorithmType;
  isCalculating: boolean;
  savedRoutes: SavedRoute[];
  routeHistory: RouteHistory[];
  favoriteRoutes: FavoriteRoute[];
  trafficRecords: TrafficDataRecord[];

  setStart: (coords: Coordinates | null, name?: string) => void;
  setEnd: (coords: Coordinates | null, name?: string) => void;
  setTravelMode: (mode: TravelMode) => void;
  setAlgorithm: (algorithm: AlgorithmType) => void;
  selectRoute: (idx: number) => void;
  calculateRoute: (roadNetwork?: unknown) => Promise<void>;
  compareAlgorithms: (roadNetwork?: unknown) => Promise<{ dijkstra: RouteResult; astar: RouteResult }>;
  saveRoute: (name: string) => Promise<void>;
  saveToFavorites: (name: string) => Promise<void>;
  removeFromFavorites: (id: string) => Promise<void>;
  loadSavedRoutes: () => Promise<void>;
  loadFavoriteRoutes: () => Promise<void>;
  deleteSavedRoute: (id: string) => Promise<void>;
  addToHistory: () => void;
  loadRouteHistory: () => Promise<void>;
  clearHistory: () => void;
  saveTrafficData: (route: RouteResult) => Promise<void>;
  loadTrafficData: () => Promise<void>;
  getTrafficPrediction: (start: Coordinates, end: Coordinates) => 'low' | 'medium' | 'high';
  clearRoute: () => void;
  swapEndpoints: () => void;
}

export const useRouteStore = create<RouteState>((set, get) => ({
  start: null,
  end: null,
  startName: null,
  endName: null,
  currentRoute: null,
  alternativeRoute: null,
  routes: [],
  selectedRouteIdx: 0,
  travelMode: 'driving',
  algorithm: 'dijkstra',
  isCalculating: false,
  savedRoutes: [],
  routeHistory: [],
  favoriteRoutes: [],
  trafficRecords: [],

  setStart: (coords, name) => set({ start: coords, startName: name || null, currentRoute: null, alternativeRoute: null, routes: [], selectedRouteIdx: 0 }),
  setEnd:   (coords, name) => set({ end: coords, endName: name || null, currentRoute: null, alternativeRoute: null, routes: [], selectedRouteIdx: 0 }),
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

      // Mark the recommended route (lowest traffic)
      if (alternatives.length > 1) {
        alternatives.sort((a, b) => (a.trafficScore || 50) - (b.trafficScore || 50));
        alternatives[0].isRecommended = true;
        alternatives[0].label = 'Recommended (Lowest Traffic)';
      }

      set({
        routes: alternatives,
        selectedRouteIdx: 0,
        currentRoute: alternatives[0] ?? null,
        alternativeRoute: alternatives[1] ?? null,
        isCalculating: false,
      });

      // Add to history
      get().addToHistory();
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
    const { start, end, startName, endName, currentRoute, travelMode, algorithm } = get();
    if (!start || !end || !currentRoute) return;

    if (!isSupabaseConfigured) {
      // Save to localStorage as fallback
      const savedRoute: SavedRoute = {
        id: `local-${Date.now()}`,
        name,
        start_point: start,
        end_point: end,
        total_distance_m: currentRoute.distance_m,
        estimated_time_min: currentRoute.time_min,
        travel_mode: travelMode,
        algorithm_used: algorithm,
        created_at: new Date().toISOString(),
      };
      const existing = JSON.parse(localStorage.getItem('savedRoutes') || '[]');
      localStorage.setItem('savedRoutes', JSON.stringify([...existing, savedRoute]));
      set({ savedRoutes: [...get().savedRoutes, savedRoute] });
      return;
    }

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

  saveToFavorites: async (name) => {
    const { start, end, currentRoute, travelMode, algorithm } = get();
    if (!start || !end || !currentRoute) return;

    if (!isSupabaseConfigured) {
      const favRoute: FavoriteRoute = {
        id: `fav-local-${Date.now()}`,
        name,
        start_point: start,
        end_point: end,
        total_distance_m: currentRoute.distance_m,
        estimated_time_min: currentRoute.time_min,
        travel_mode: travelMode,
        algorithm_used: algorithm,
        created_at: new Date().toISOString(),
        isFavorite: true,
      };
      const existing = JSON.parse(localStorage.getItem('favoriteRoutes') || '[]');
      localStorage.setItem('favoriteRoutes', JSON.stringify([...existing, favRoute]));
      set({ favoriteRoutes: [...get().favoriteRoutes, favRoute] });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Mark as favorite in saved_routes table
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
      is_favorite: true,
    });

    if (error) throw error;
    get().loadFavoriteRoutes();
  },

  removeFromFavorites: async (id) => {
    if (!isSupabaseConfigured) {
      const updated = get().favoriteRoutes.filter((r) => r.id !== id);
      localStorage.setItem('favoriteRoutes', JSON.stringify(updated));
      set({ favoriteRoutes: updated });
      return;
    }

    const { error } = await supabase.from('saved_routes').update({ is_favorite: false }).eq('id', id);
    if (error) throw error;
    set((state) => ({ favoriteRoutes: state.favoriteRoutes.filter((r) => r.id !== id) }));
  },

  loadSavedRoutes: async () => {
    if (!isSupabaseConfigured) {
      const local = JSON.parse(localStorage.getItem('savedRoutes') || '[]');
      set({ savedRoutes: local });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('saved_routes')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_favorite', false)
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

  loadFavoriteRoutes: async () => {
    if (!isSupabaseConfigured) {
      const local = JSON.parse(localStorage.getItem('favoriteRoutes') || '[]');
      set({ favoriteRoutes: local });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('saved_routes')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_favorite', true)
      .order('created_at', { ascending: false });

    if (error) console.error('Error loading favorites:', error);
    else {
      const routes: FavoriteRoute[] = (data || []).map((r) => ({
        ...r,
        start_point: parsePostGISPoint(r.start_point),
        end_point: parsePostGISPoint(r.end_point),
        isFavorite: true,
      }));
      set({ favoriteRoutes: routes });
    }
  },

  deleteSavedRoute: async (id) => {
    if (!isSupabaseConfigured) {
      const updated = get().savedRoutes.filter((r) => r.id !== id);
      localStorage.setItem('savedRoutes', JSON.stringify(updated));
      set({ savedRoutes: updated });
      return;
    }

    const { error } = await supabase.from('saved_routes').delete().eq('id', id);
    if (error) throw error;
    set((state) => ({ savedRoutes: state.savedRoutes.filter((r) => r.id !== id) }));
  },

  addToHistory: () => {
    const { start, end, startName, endName, currentRoute, travelMode } = get();
    if (!start || !end || !currentRoute) return;

    const historyEntry: RouteHistory = {
      id: `hist-${Date.now()}`,
      start,
      end,
      startName: startName || undefined,
      endName: endName || undefined,
      distance_m: currentRoute.distance_m,
      time_min: currentRoute.time_min,
      trafficScore: currentRoute.trafficScore || 50,
      travelMode,
      createdAt: new Date().toISOString(),
    };

    // Keep last 50 history entries
    const history = [...get().routeHistory, historyEntry].slice(-50);
    set({ routeHistory: history });
    localStorage.setItem('routeHistory', JSON.stringify(history));
  },

  loadRouteHistory: async () => {
    const local = JSON.parse(localStorage.getItem('routeHistory') || '[]');
    set({ routeHistory: local });
  },

  clearHistory: () => {
    set({ routeHistory: [] });
    localStorage.removeItem('routeHistory');
  },

  saveTrafficData: async (route) => {
    const { start, end } = get();
    if (!start || !end) return;

    const now = new Date();
    const record: TrafficDataRecord = {
      id: `traffic-${Date.now()}`,
      start,
      end,
      hour: now.getHours(),
      dayOfWeek: now.getDay(),
      congestionLevel: route.trafficScore && route.trafficScore < 30 ? 'low' :
                       route.trafficScore && route.trafficScore < 60 ? 'medium' : 'high',
      actualTimeMinutes: route.time_min,
      distanceMeters: route.distance_m,
      createdAt: now.toISOString(),
    };

    const records = [...get().trafficRecords, record].slice(-100);
    set({ trafficRecords: records });
    localStorage.setItem('trafficData', JSON.stringify(records));
  },

  loadTrafficData: async () => {
    const local = JSON.parse(localStorage.getItem('trafficData') || '[]');
    set({ trafficRecords: local });
  },

  getTrafficPrediction: (start, end) => {
    const { trafficRecords } = get();
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();

    // Find similar routes in traffic records
    const similar = trafficRecords.filter((r) => {
      const distStart = Math.hypot(r.start.lat - start.lat, r.start.lng - start.lng);
      const distEnd = Math.hypot(r.end.lat - end.lat, r.end.lng - end.lng);
      return distStart < 0.02 && distEnd < 0.02 && r.hour === hour && r.dayOfWeek === dayOfWeek;
    });

    if (similar.length === 0) {
      // Fall back to general time-based prediction
      const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
      const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
      if (isRushHour && isWeekday) return 'high';
      if (isWeekday && hour >= 10 && hour <= 16) return 'medium';
      return 'low';
    }

    // Use historical data
    const avgCongestion = similar.reduce((sum, r) => {
      return sum + (r.congestionLevel === 'high' ? 2 : r.congestionLevel === 'medium' ? 1 : 0);
    }, 0) / similar.length;

    return avgCongestion > 1.3 ? 'high' : avgCongestion > 0.6 ? 'medium' : 'low';
  },

  clearRoute: () =>
    set({ start: null, end: null, startName: null, endName: null, currentRoute: null, alternativeRoute: null, routes: [], selectedRouteIdx: 0 }),

  swapEndpoints: () => {
    const { start, end, startName, endName } = get();
    set({ start: end, end: start, startName: endName, endName: startName, currentRoute: null, alternativeRoute: null, routes: [], selectedRouteIdx: 0 });
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
