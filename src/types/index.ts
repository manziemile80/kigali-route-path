import type { LatLng, LatLngExpression } from 'leaflet';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface ServiceLocation {
  id: string;
  name: string;
  category: ServiceCategory;
  subcategory?: string;
  address?: string;
  coordinates: Coordinates;
  contact_phone?: string;
  contact_email?: string;
  operating_hours?: string;
  capacity?: number;
  wheelchair_accessible: boolean;
  emergency_services: boolean;
  rating: number;
  verified: boolean;
  created_at: string;
  updated_at?: string;
}

export type ServiceCategory =
  | 'hospital'
  | 'health_center'
  | 'school'
  | 'police_station'
  | 'fire_station'
  | 'bank'
  | 'pharmacy'
  | 'bus_stop'
  | 'government_office'
  | 'water_point'
  | 'public_utility';

export interface RoadSegment {
  id: string;
  name?: string;
  road_type: RoadType;
  coordinates: Coordinates[];
  length_m: number;
  speed_kmh: number;
  one_way: boolean;
  surface: string;
  condition: RoadCondition;
  traffic_factor: number;
  source_node: number;
  target_node: number;
  geometry: GeoJSON.LineString;
}

export type RoadType = 'primary' | 'secondary' | 'tertiary' | 'residential' | 'service' | 'footway' | 'path';
export type RoadCondition = 'excellent' | 'good' | 'fair' | 'poor';

export interface RoadNode {
  id: number;
  osm_id?: number;
  coordinates: Coordinates;
  intersection_type: 'traffic_light' | 'roundabout' | 'regular';
}

export interface AdminBoundary {
  id: string;
  name: string;
  type: 'province' | 'district' | 'sector' | 'cell' | 'umudugudu';
  parent_id?: string;
  population?: number;
  area_sqkm?: number;
  geometry: GeoJSON.MultiPolygon;
}

export interface SavedRoute {
  id: string;
  name: string;
  start_point: Coordinates;
  end_point: Coordinates;
  route_geometry?: GeoJSON.LineString;
  total_distance_m: number;
  estimated_time_min: number;
  travel_mode: TravelMode;
  algorithm_used: AlgorithmType;
  waypoints?: Coordinates[];
  destination_service_id?: string;
  created_at: string;
}

export type TravelMode = 'walking' | 'driving' | 'public_transport';
export type AlgorithmType = 'dijkstra' | 'astar';

export interface RouteResult {
  path: Coordinates[];
  distance_m: number;
  time_min: number;
  segments: number;
  algorithm: AlgorithmType;
  execution_time_ms: number;
}

export interface RouteAnalysisParams {
  start: Coordinates;
  end: Coordinates;
  travelMode: TravelMode;
  algorithm: AlgorithmType;
}

export interface BufferedArea {
  center: Coordinates;
  radius_m: number;
  geometry: GeoJSON.Polygon;
  services: ServiceLocation[];
}

export interface TrafficData {
  road_segment_id: string;
  hour_of_day: number;
  day_of_week: number;
  congestion_level: number;
  average_speed_kmh: number;
  vehicle_count: number;
}

export interface AccessibilityMetric {
  service_type: ServiceCategory;
  avg_distance_m: number;
  avg_time_min: number;
  coverage_percent: number;
  underserved_areas: Coordinates[];
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: 'user' | 'admin';
  created_at: string;
}

export interface MapLayer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  type: 'marker' | 'line' | 'polygon' | 'heatmap' | 'markercluster';
}

export interface MapViewState {
  center: Coordinates;
  zoom: number;
  bounds?: [[number, number], [number, number]];
}

export interface SearchResult {
  type: 'service' | 'road' | 'boundary';
  id: string;
  name: string;
  category?: string;
  coordinates: Coordinates;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

export interface AnalysisReport {
  id: string;
  type: 'shortest_path' | 'service_area' | 'accessibility' | 'traffic_simulation';
  created_at: string;
  parameters: Record<string, unknown>;
  results: Record<string, unknown>;
  notes?: string;
}

export const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  hospital: 'Hospital',
  health_center: 'Health Center',
  school: 'School',
  police_station: 'Police Station',
  fire_station: 'Fire Station',
  bank: 'Bank',
  pharmacy: 'Pharmacy',
  bus_stop: 'Bus Stop',
  government_office: 'Government Office',
  water_point: 'Water Point',
  public_utility: 'Public Utility',
};

export const CATEGORY_ICONS: Record<ServiceCategory, string> = {
  hospital: 'hospital',
  health_center: 'heart-pulse',
  school: 'graduation-cap',
  police_station: 'shield',
  fire_station: 'flame',
  bank: 'landmark',
  pharmacy: 'pill',
  bus_stop: 'bus',
  government_office: 'building-2',
  water_point: 'droplets',
  public_utility: 'zap',
};

export const RADIUS_OPTIONS = [
  { value: 500, label: '500m' },
  { value: 1000, label: '1 km' },
  { value: 2000, label: '2 km' },
  { value: 5000, label: '5 km' },
  { value: 10000, label: '10 km' },
];

export const KIGALI_CENTER: Coordinates = {
  lat: -1.96,
  lng: 30.07,
};

export const DEFAULT_ZOOM = 13;
