import { create } from 'zustand';
import type { Coordinates, ServiceLocation, RoadSegment, MapLayer, ServiceCategory } from '../types';

interface GeolocationError {
  code: number;
  message: string;
}

interface MapState {
  center: Coordinates;
  zoom: number;
  selectedLocation: ServiceLocation | null;
  hoveredLocation: ServiceLocation | null;
  selectedCategories: ServiceCategory[];
  searchQuery: string;
  layers: MapLayer[];
  showTraffic: boolean;
  showHeatmap: boolean;
  layerOpacity: Record<string, number>;
  userLocation: Coordinates | null;
  isLocating: boolean;
  isTracking: boolean; // Live GPS tracking
  locationError: string | null;
  watchId: number | null;

  setCenter: (center: Coordinates) => void;
  setZoom: (zoom: number) => void;
  setSelectedLocation: (location: ServiceLocation | null) => void;
  setHoveredLocation: (location: ServiceLocation | null) => void;
  toggleCategory: (category: ServiceCategory) => void;
  setCategories: (categories: ServiceCategory[]) => void;
  setSearchQuery: (query: string) => void;
  toggleLayer: (layerId: string) => void;
  setLayerOpacity: (layerId: string, opacity: number) => void;
  toggleTraffic: () => void;
  toggleHeatmap: () => void;
  setUserLocation: (coords: Coordinates | null) => void;
  setIsLocating: (locating: boolean) => void;
  setLocationError: (error: string | null) => void;
  startTracking: () => void;
  stopTracking: () => void;
  zoomToLocation: (coords: Coordinates, zoom?: number) => void;
  resetView: () => void;
}

export const DEFAULT_LAYERS: MapLayer[] = [
  { id: 'services', name: 'Service Locations', visible: true, opacity: 1, type: 'marker' },
  { id: 'roads', name: 'Road Network', visible: true, opacity: 0.8, type: 'line' },
  { id: 'boundaries', name: 'Administrative Boundaries', visible: false, opacity: 0.5, type: 'polygon' },
  { id: 'heatmap', name: 'Service Heatmap', visible: false, opacity: 0.6, type: 'heatmap' },
];

const KIGALI_CENTER: Coordinates = { lat: -1.96, lng: 30.07 };

export const useMapStore = create<MapState>((set, get) => ({
  center: KIGALI_CENTER,
  zoom: 13,
  selectedLocation: null,
  hoveredLocation: null,
  selectedCategories: [],
  searchQuery: '',
  layers: DEFAULT_LAYERS,
  showTraffic: false,
  showHeatmap: false,
  layerOpacity: {},
  userLocation: null,
  isLocating: false,
  isTracking: false,
  locationError: null,
  watchId: null,

  setCenter: (center) => set({ center }),
  setZoom: (zoom) => set({ zoom }),
  setSelectedLocation: (location) => set({ selectedLocation: location }),
  setHoveredLocation: (location) => set({ hoveredLocation: location }),
  toggleCategory: (category) => {
    const { selectedCategories } = get();
    const newCategories = selectedCategories.includes(category)
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category];
    set({ selectedCategories: newCategories });
  },
  setCategories: (categories) => set({ selectedCategories: categories as ServiceCategory[] }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  toggleLayer: (layerId) => {
    const { layers } = get();
    set({
      layers: layers.map((l) =>
        l.id === layerId ? { ...l, visible: !l.visible } : l
      ),
    });
  },
  setLayerOpacity: (layerId, opacity) => {
    const { layerOpacity } = get();
    set({ layerOpacity: { ...layerOpacity, [layerId]: opacity } });
  },
  toggleTraffic: () => set((state) => ({ showTraffic: !state.showTraffic })),
  toggleHeatmap: () => set((state) => ({ showHeatmap: !state.showHeatmap })),
  setUserLocation: (coords) => set({ userLocation: coords, locationError: null }),
  setIsLocating: (locating) => set({ isLocating: locating }),
  setLocationError: (error) => set({ locationError: error, isLocating: false }),

  // Start continuous GPS tracking
  startTracking: () => {
    if (!navigator.geolocation) {
      set({ locationError: 'Geolocation is not supported by your browser' });
      return;
    }

    // Stop any existing watch
    const { watchId } = get();
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
    }

    set({ isLocating: true, locationError: null });

    const newWatchId = navigator.geolocation.watchPosition(
      (position) => {
        const coords: Coordinates = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        set({
          userLocation: coords,
          isLocating: false,
          isTracking: true,
          locationError: null,
        });
      },
      (error: GeolocationPositionError) => {
        let message = 'Could not get your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location permission denied. Please allow location access in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information is unavailable. Please try again.';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out. Please check your GPS settings.';
            break;
        }
        set({ locationError: message, isLocating: false, isTracking: false });
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000, // Cache for 10 seconds
      }
    );

    set({ watchId: newWatchId });
  },

  // Stop GPS tracking
  stopTracking: () => {
    const { watchId } = get();
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
    }
    set({ watchId: null, isTracking: false });
  },

  zoomToLocation: (coords, zoom = 16) => set({ center: coords, zoom }),
  resetView: () => set({ center: KIGALI_CENTER, zoom: 13 }),
}));
