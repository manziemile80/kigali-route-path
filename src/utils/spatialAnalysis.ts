import * as turf from '@turf/turf';
import type { Coordinates, ServiceLocation, ServiceCategory, AccessibilityMetric, BufferedArea } from '../types';

export function createBuffer(center: Coordinates, radiusM: number): GeoJSON.Polygon {
  const point = turf.point([center.lng, center.lat]);
  const buffered = turf.buffer(point, radiusM, { units: 'meters' });
  return buffered?.geometry as GeoJSON.Polygon || {
    type: 'Polygon',
    coordinates: [[[center.lng, center.lat]]],
  };
}

export function pointsWithinBuffer(
  services: ServiceLocation[],
  center: Coordinates,
  radiusM: number
): ServiceLocation[] {
  const centerPoint = turf.point([center.lng, center.lat]);

  return services.filter((service) => {
    const servicePoint = turf.point([service.coordinates.lng, service.coordinates.lat]);
    const distance = turf.distance(centerPoint, servicePoint, { units: 'meters' });
    return distance <= radiusM;
  });
}

export function calculateServiceArea(
  center: Coordinates,
  services: ServiceLocation[],
  category: ServiceCategory,
  radiusOptions: number[]
): Map<number, ServiceLocation[]> {
  const categoryServices = services.filter((s) => s.category === category);
  const result = new Map<number, ServiceLocation[]>();

  radiusOptions.forEach((radius) => {
    result.set(radius, pointsWithinBuffer(categoryServices, center, radius));
  });

  return result;
}

export function findNearestService(
  center: Coordinates,
  services: ServiceLocation[],
  category?: ServiceCategory
): ServiceLocation | null {
  const filtered = category ? services.filter((s) => s.category === category) : services;

  if (filtered.length === 0) return null;

  const centerPoint = turf.point([center.lng, center.lat]);

  let nearest: ServiceLocation | null = null;
  let minDistance = Infinity;

  filtered.forEach((service) => {
    const servicePoint = turf.point([service.coordinates.lng, service.coordinates.lat]);
    const distance = turf.distance(centerPoint, servicePoint, { units: 'meters' });

    if (distance < minDistance) {
      minDistance = distance;
      nearest = service;
    }
  });

  return nearest;
}

export function calculateAccessibilityMetrics(
  center: Coordinates,
  services: ServiceLocation[],
  categories: ServiceCategory[]
): AccessibilityMetric[] {
  const metrics: AccessibilityMetric[] = [];

  categories.forEach((category) => {
    const categoryServices = services.filter((s) => s.category === category);
    const nearbyServices = pointsWithinBuffer(categoryServices, center, 5000);

    if (nearbyServices.length > 0) {
      const centerPoint = turf.point([center.lng, center.lat]);
      const distances = nearbyServices.map((s) => {
        const servicePoint = turf.point([s.coordinates.lng, s.coordinates.lat]);
        return turf.distance(centerPoint, servicePoint, { units: 'meters' });
      });

      const avgDistance = distances.reduce((a, b) => a + b, 0) / distances.length;
      const avgTime = (avgDistance / 1000) / 40 * 60;
      const coveragePercent = (nearbyServices.length / categoryServices.length) * 100;

      metrics.push({
        service_type: category,
        avg_distance_m: avgDistance,
        avg_time_min: avgTime,
        coverage_percent: coveragePercent,
        underserved_areas: [],
      });
    } else {
      metrics.push({
        service_type: category,
        avg_distance_m: 0,
        avg_time_min: 0,
        coverage_percent: 0,
        underserved_areas: [],
      });
    }
  });

  return metrics;
}

export function generateHeatmapData(
  services: ServiceLocation[],
  gridSize: number = 0.01
): { coordinates: [number, number]; weight: number }[] {
  const grid: Map<string, number> = new Map();

  services.forEach((service) => {
    const gridX = Math.floor(service.coordinates.lng / gridSize);
    const gridY = Math.floor(service.coordinates.lat / gridSize);
    const key = `${gridX},${gridY}`;

    grid.set(key, (grid.get(key) || 0) + 1);
  });

  const heatmapData: { coordinates: [number, number]; weight: number }[] = [];

  grid.forEach((count, key) => {
    const [x, y] = key.split(',').map(Number);
    heatmapData.push({
      coordinates: [(x + 0.5) * gridSize, (y + 0.5) * gridSize],
      weight: count,
    });
  });

  return heatmapData;
}

export function calculateServiceDensity(
  services: ServiceLocation[],
  bounds: [[number, number], [number, number]]
): Map<ServiceCategory, number> {
  const density = new Map<ServiceCategory, number>();

  const latDiff = bounds[1][0] - bounds[0][0];
  const lngDiff = bounds[1][1] - bounds[0][1];
  const areaSqKm = (latDiff * 111) * (lngDiff * 111 * Math.cos((bounds[0][0] * Math.PI) / 180));

  const servicesInBounds = services.filter((s) => {
    const { lat, lng } = s.coordinates;
    return lat >= bounds[0][0] && lat <= bounds[1][0] &&
           lng >= bounds[0][1] && lng <= bounds[1][1];
  });

  Object.keys(getDefaultCategoryCounts()).forEach((cat) => {
    const category = cat as ServiceCategory;
    const count = servicesInBounds.filter((s) => s.category === category).length;
    density.set(category, count / areaSqKm);
  });

  return density;
}

function getDefaultCategoryCounts(): Record<ServiceCategory, number> {
  return {
    hospital: 0,
    health_center: 0,
    school: 0,
    police_station: 0,
    fire_station: 0,
    bank: 0,
    pharmacy: 0,
    bus_stop: 0,
    government_office: 0,
    water_point: 0,
    public_utility: 0,
  };
}

export function isochroneWalking(center: Coordinates, minutes: number[]): GeoJSON.FeatureCollection {
  const speedMetersPerMin = 83.33;
  const features = minutes.map((min) => {
    const radius = min * speedMetersPerMin;
    const point = turf.point([center.lng, center.lat]);
    const buffered = turf.buffer(point, radius, { units: 'meters' });

    return buffered ? {
      type: 'Feature' as const,
      properties: { minutes: min },
      geometry: buffered.geometry,
    } : null;
  }).filter(Boolean);

  return {
    type: 'FeatureCollection',
    features: features as GeoJSON.Feature[],
  };
}

export function calculateRouteGeometry(
  start: Coordinates,
  end: Coordinates
): GeoJSON.LineString {
  const startPoint = [start.lng, start.lat] as [number, number];
  const endPoint = [end.lng, end.lat] as [number, number];

  const line = turf.lineString([startPoint, endPoint]);
  const curved = turf.bezierSpline(line);

  return curved.geometry;
}

export function distanceBetweenPoints(a: Coordinates, b: Coordinates): number {
  const from = turf.point([a.lng, a.lat]);
  const to = turf.point([b.lng, b.lat]);
  return turf.distance(from, to, { units: 'meters' });
}

export function getCenterOfMass(coords: Coordinates[]): Coordinates {
  if (coords.length === 0) return { lat: 0, lng: 0 };

  const points = turf.points(coords.map((c) => [c.lng, c.lat]));
  const center = turf.center(points);

  return {
    lng: center.geometry.coordinates[0],
    lat: center.geometry.coordinates[1],
  };
}
