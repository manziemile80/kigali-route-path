import { supabase } from '../lib/supabase';
import type { ServiceLocation, ServiceCategory, RoadSegment, AdminBoundary, Coordinates } from '../types';

export async function fetchServiceLocations(
  categories?: ServiceCategory[]
): Promise<ServiceLocation[]> {
  let query = supabase.from('service_locations').select('*');

  if (categories && categories.length > 0) {
    query = query.in('category', categories);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map(transformServiceLocation);
}

export async function fetchServiceLocationById(id: string): Promise<ServiceLocation | null> {
  const { data, error } = await supabase
    .from('service_locations')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data ? transformServiceLocation(data) : null;
}

export async function searchServiceLocations(query: string): Promise<ServiceLocation[]> {
  const { data, error } = await supabase
    .from('service_locations')
    .select('*')
    .or(`name.ilike.%${query}%,address.ilike.%${query}%`)
    .limit(20);

  if (error) throw error;

  return (data || []).map(transformServiceLocation);
}

export async function createServiceLocation(
  service: Omit<ServiceLocation, 'id' | 'created_at'>
): Promise<ServiceLocation> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('service_locations')
    .insert({
      name: service.name,
      category: service.category,
      subcategory: service.subcategory,
      address: service.address,
      geometry: `POINT(${service.coordinates.lng} ${service.coordinates.lat})`,
      contact_phone: service.contact_phone,
      contact_email: service.contact_email,
      operating_hours: service.operating_hours,
      capacity: service.capacity,
      wheelchair_accessible: service.wheelchair_accessible,
      emergency_services: service.emergency_services,
      rating: service.rating,
      verified: service.verified,
      added_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;

  return transformServiceLocation(data);
}

export async function updateServiceLocation(
  id: string,
  updates: Partial<ServiceLocation>
): Promise<ServiceLocation> {
  const updateData: Record<string, unknown> = {};

  if (updates.name) updateData.name = updates.name;
  if (updates.category) updateData.category = updates.category;
  if (updates.subcategory !== undefined) updateData.subcategory = updates.subcategory;
  if (updates.address !== undefined) updateData.address = updates.address;
  if (updates.coordinates) {
    updateData.geometry = `POINT(${updates.coordinates.lng} ${updates.coordinates.lat})`;
  }
  if (updates.contact_phone !== undefined) updateData.contact_phone = updates.contact_phone;
  if (updates.operating_hours !== undefined) updateData.operating_hours = updates.operating_hours;
  if (updates.capacity !== undefined) updateData.capacity = updates.capacity;
  if (updates.wheelchair_accessible !== undefined) {
    updateData.wheelchair_accessible = updates.wheelchair_accessible;
  }
  if (updates.emergency_services !== undefined) {
    updateData.emergency_services = updates.emergency_services;
  }
  if (updates.rating !== undefined) updateData.rating = updates.rating;

  const { data, error } = await supabase
    .from('service_locations')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return transformServiceLocation(data);
}

export async function deleteServiceLocation(id: string): Promise<void> {
  const { error } = await supabase.from('service_locations').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchRoadSegments(): Promise<RoadSegment[]> {
  const { data, error } = await supabase.from('road_segments').select('*');
  if (error) throw error;

  return (data || []).map(transformRoadSegment);
}

export async function fetchAdminBoundaries(): Promise<AdminBoundary[]> {
  const { data, error } = await supabase.from('admin_boundaries').select('*');
  if (error) throw error;

  return (data || []).map((b) => ({
    ...b,
    geometry: b.geometry as GeoJSON.MultiPolygon,
  }));
}

export async function findServicesWithinRadius(
  center: Coordinates,
  radiusMeters: number,
  category?: ServiceCategory
): Promise<ServiceLocation[]> {
  const { data, error } = await supabase.rpc('find_services_within_radius', {
    lat: center.lat,
    lng: center.lng,
    radius_m: radiusMeters,
    category_filter: category || null,
  });

  if (error) {
    return filterServicesByDistance(
      await fetchServiceLocations(category ? [category] : undefined),
      center,
      radiusMeters
    );
  }

  return (data || []).map(transformServiceLocation);
}

export async function findNearestService(
  center: Coordinates,
  category?: ServiceCategory
): Promise<ServiceLocation | null> {
  const services = await fetchServiceLocations(category ? [category] : undefined);

  if (services.length === 0) return null;

  let nearest: ServiceLocation | null = null;
  let minDist = Infinity;

  services.forEach((service) => {
    const dist = calculateDistanceMeters(center, service.coordinates);
    if (dist < minDist) {
      minDist = dist;
      nearest = service;
    }
  });

  return nearest;
}

export async function fetchTrafficData(): Promise<Map<string, number>> {
  const { data, error } = await supabase.from('traffic_data').select('*');
  if (error) throw error;

  const trafficMap = new Map<string, number>();
  const currentHour = new Date().getHours();
  const currentDay = new Date().getDay();

  (data || []).forEach((t) => {
    if (t.hour_of_day === currentHour && t.day_of_week === currentDay) {
      trafficMap.set(t.road_segment_id, t.congestion_level);
    }
  });

  return trafficMap;
}

export async function saveAnalysis(
  type: string,
  parameters: Record<string, unknown>,
  results: Record<string, unknown>,
  notes?: string
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase.from('route_analyses').insert({
    user_id: user.id,
    analysis_type: type,
    parameters,
    results,
    notes,
  });

  if (error) throw error;
}

export async function fetchUserAnalyses(): Promise<unknown[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('route_analyses')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data || [];
}

function transformServiceLocation(data: Record<string, unknown>): ServiceLocation {
  let coords: Coordinates = { lat: 0, lng: 0 };

  if (data.geometry) {
    if (typeof data.geometry === 'string') {
      const match = data.geometry.match(/POINT\(([^ ]+) ([^)]+)\)/);
      if (match) {
        coords = { lng: parseFloat(match[1]), lat: parseFloat(match[2]) };
      }
    } else if (typeof data.geometry === 'object') {
      const g = data.geometry as { coordinates?: [number, number] };
      if (g.coordinates) {
        coords = { lng: g.coordinates[0], lat: g.coordinates[1] };
      }
    }
  }

  return {
    id: data.id as string,
    name: data.name as string,
    category: data.category as ServiceCategory,
    subcategory: data.subcategory as string | undefined,
    address: data.address as string | undefined,
    coordinates: coords,
    contact_phone: data.contact_phone as string | undefined,
    contact_email: data.contact_email as string | undefined,
    operating_hours: data.operating_hours as string | undefined,
    capacity: data.capacity as number | undefined,
    wheelchair_accessible: data.wheelchair_accessible as boolean,
    emergency_services: data.emergency_services as boolean,
    rating: data.rating as number,
    verified: data.verified as boolean,
    created_at: data.created_at as string,
    updated_at: data.updated_at as string | undefined,
  };
}

function transformRoadSegment(data: Record<string, unknown>): RoadSegment {
  let coords: Coordinates[] = [];

  if (data.geometry) {
    if (typeof data.geometry === 'string') {
      const matches = data.geometry.match(/LINESTRING\(([^)]+)\)/);
      if (matches) {
        const pairs = matches[1].split(',');
        coords = pairs.map((p) => {
          const [lng, lat] = p.trim().split(' ').map(Number);
          return { lng, lat };
        });
      }
    } else if (typeof data.geometry === 'object') {
      const g = data.geometry as { coordinates?: [number, number][] };
      if (g.coordinates) {
        coords = g.coordinates.map(([lng, lat]) => ({ lng, lat }));
      }
    }
  }

  return {
    id: data.id as string,
    name: data.name as string | undefined,
    road_type: data.road_type as RoadSegment['road_type'],
    coordinates: coords,
    length_m: data.length_m as number,
    speed_kmh: data.speed_kmh as number,
    one_way: data.one_way as boolean,
    surface: data.surface as string,
    condition: data.condition as RoadSegment['condition'],
    traffic_factor: data.traffic_factor as number,
    source_node: data.source_node as number,
    target_node: data.target_node as number,
    geometry: data.geometry as GeoJSON.LineString,
  };
}

function filterServicesByDistance(
  services: ServiceLocation[],
  center: Coordinates,
  radiusMeters: number
): ServiceLocation[] {
  return services.filter((service) => {
    const dist = calculateDistanceMeters(center, service.coordinates);
    return dist <= radiusMeters;
  });
}

function calculateDistanceMeters(a: Coordinates, b: Coordinates): number {
  const R = 6371000;
  const phi1 = (a.lat * Math.PI) / 180;
  const phi2 = (b.lat * Math.PI) / 180;
  const deltaPhi = ((b.lat - a.lat) * Math.PI) / 180;
  const deltaLambda = ((b.lng - a.lng) * Math.PI) / 180;

  const sinPhi = Math.sin(deltaPhi / 2);
  const sinLambda = Math.sin(deltaLambda / 2);
  const cosPhi1 = Math.cos(phi1);
  const cosPhi2 = Math.cos(phi2);

  const aHarv = sinPhi * sinPhi + cosPhi1 * cosPhi2 * sinLambda * sinLambda;
  const c = 2 * Math.atan2(Math.sqrt(aHarv), Math.sqrt(1 - aHarv));

  return R * c;
}
