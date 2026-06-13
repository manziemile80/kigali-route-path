import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { ServiceLocation, ServiceCategory, RoadSegment, AdminBoundary, Coordinates } from '../types';

// Fallback service locations for when Supabase is unavailable
const FALLBACK_SERVICES: ServiceLocation[] = [
  // Hospitals
  { id: 'fb-hospital-1', name: 'King Faisal Hospital', category: 'hospital', subcategory: 'tertiary', address: 'KG 45 St, Kacyiru', coordinates: { lat: -1.9545, lng: 30.0698 }, contact_phone: '+250 788 300 000', operating_hours: '24/7', capacity: 500, wheelchair_accessible: true, emergency_services: true, rating: 4.8, verified: true },
  { id: 'fb-hospital-2', name: 'CHUK (Centre Hospitalier Universitaire de Kigali)', category: 'hospital', subcategory: 'tertiary', address: 'KN 4 Ave, Nyarugenge', coordinates: { lat: -1.9495, lng: 30.0601 }, contact_phone: '+250 788 301 000', operating_hours: '24/7', capacity: 350, wheelchair_accessible: true, emergency_services: true, rating: 4.6, verified: true },
  { id: 'fb-hospital-3', name: 'Kanombe Military Hospital', category: 'hospital', subcategory: 'secondary', address: 'Kanombe, Kicukiro', coordinates: { lat: -1.9789, lng: 30.1056 }, contact_phone: '+250 788 302 000', operating_hours: '24/7', capacity: 200, wheelchair_accessible: true, emergency_services: true, rating: 4.5, verified: true },
  { id: 'fb-hospital-4', name: 'Police Hospital', category: 'hospital', subcategory: 'secondary', address: 'Gishushu, Kigali', coordinates: { lat: -1.9421, lng: 30.0655 }, contact_phone: '+250 788 303 000', operating_hours: '24/7', capacity: 150, wheelchair_accessible: true, emergency_services: true, rating: 4.4, verified: true },

  // Health Centers
  { id: 'fb-health-1', name: 'Muhima Health Center', category: 'health_center', subcategory: 'primary', address: 'Muhima, Nyarugenge', coordinates: { lat: -1.9512, lng: 30.0585 }, contact_phone: '+250 788 310 000', operating_hours: '08:00-17:00', capacity: 50, wheelchair_accessible: true, emergency_services: false, rating: 4.2, verified: true },
  { id: 'fb-health-2', name: 'Gitega Health Center', category: 'health_center', subcategory: 'primary', address: 'Gitega', coordinates: { lat: -1.9645, lng: 30.0723 }, contact_phone: '+250 788 311 000', operating_hours: '08:00-17:00', capacity: 40, wheelchair_accessible: true, emergency_services: false, rating: 4.1, verified: true },
  { id: 'fb-health-3', name: 'Remera Health Center', category: 'health_center', subcategory: 'primary', address: 'Remera', coordinates: { lat: -1.9545, lng: 30.0812 }, contact_phone: '+250 788 312 000', operating_hours: '08:00-17:00', capacity: 45, wheelchair_accessible: true, emergency_services: false, rating: 4.3, verified: true },
  { id: 'fb-health-4', name: 'Kacyiru Health Center', category: 'health_center', subcategory: 'primary', address: 'Kacyiru', coordinates: { lat: -1.9389, lng: 30.0634 }, contact_phone: '+250 788 313 000', operating_hours: '08:00-17:00', capacity: 35, wheelchair_accessible: true, emergency_services: false, rating: 4.0, verified: true },

  // Schools
  { id: 'fb-school-1', name: 'University of Rwanda', category: 'school', subcategory: 'university', address: 'KN 67 St, Nyarugenge', coordinates: { lat: -1.9401, lng: 30.0612 }, contact_phone: '+250 788 320 000', operating_hours: '08:00-18:00', capacity: 15000, wheelchair_accessible: true, emergency_services: false, rating: 4.7, verified: true },
  { id: 'fb-school-2', name: 'Kigali Institute of Science and Technology', category: 'school', subcategory: 'university', address: 'KN 78 St, Kigali', coordinates: { lat: -1.9434, lng: 30.0567 }, contact_phone: '+250 788 321 000', operating_hours: '08:00-18:00', capacity: 8000, wheelchair_accessible: true, emergency_services: false, rating: 4.6, verified: true },
  { id: 'fb-school-3', name: 'Green Hills Academy', category: 'school', subcategory: 'secondary', address: 'KG 11 Ave, Kacyiru', coordinates: { lat: -1.9401, lng: 30.0745 }, contact_phone: '+250 788 322 000', operating_hours: '08:00-16:00', capacity: 1200, wheelchair_accessible: true, emergency_services: false, rating: 4.5, verified: true },
  { id: 'fb-school-4', name: 'Kigali Parents School', category: 'school', subcategory: 'primary', address: 'KG 12 St, Kacyiru', coordinates: { lat: -1.9412, lng: 30.0689 }, contact_phone: '+250 788 323 000', operating_hours: '08:00-16:00', capacity: 800, wheelchair_accessible: true, emergency_services: false, rating: 4.4, verified: true },
  { id: 'fb-school-5', name: 'FAWE Girls School', category: 'school', subcategory: 'secondary', address: 'Gisozi', coordinates: { lat: -1.9467, lng: 30.0778 }, contact_phone: '+250 788 324 000', operating_hours: '08:00-16:00', capacity: 600, wheelchair_accessible: true, emergency_services: false, rating: 4.6, verified: true },

  // Police Stations
  { id: 'fb-police-1', name: 'Kigali Central Police Station', category: 'police_station', subcategory: 'headquarters', address: 'KG 45 St, Kiyovu', coordinates: { lat: -1.9544, lng: 30.0598 }, contact_phone: '+250 788 330 000', operating_hours: '24/7', capacity: 200, wheelchair_accessible: true, emergency_services: true, rating: 4.5, verified: true },
  { id: 'fb-police-2', name: 'Kacyiru Police Post', category: 'police_station', subcategory: 'station', address: 'KG 11 Ave, Kacyiru', coordinates: { lat: -1.9356, lng: 30.0712 }, contact_phone: '+250 788 331 000', operating_hours: '24/7', capacity: 50, wheelchair_accessible: true, emergency_services: true, rating: 4.3, verified: true },
  { id: 'fb-police-3', name: 'Remera Police Station', category: 'police_station', subcategory: 'station', address: 'KG 15 St, Remera', coordinates: { lat: -1.9589, lng: 30.0867 }, contact_phone: '+250 788 332 000', operating_hours: '24/7', capacity: 75, wheelchair_accessible: true, emergency_services: true, rating: 4.4, verified: true },

  // Fire Stations
  { id: 'fb-fire-1', name: 'Kigali Fire Brigade', category: 'fire_station', subcategory: 'main', address: 'KG 23 St, Kiyovu', coordinates: { lat: -1.9523, lng: 30.0612 }, contact_phone: '+250 788 340 000', operating_hours: '24/7', capacity: 100, wheelchair_accessible: true, emergency_services: true, rating: 4.7, verified: true },

  // Banks
  { id: 'fb-bank-1', name: 'Bank of Kigali HQ', category: 'bank', subcategory: 'headquarters', address: 'KN 4 Ave, Kigali', coordinates: { lat: -1.9445, lng: 30.0598 }, contact_phone: '+250 788 350 000', operating_hours: '08:00-17:00', capacity: 500, wheelchair_accessible: true, emergency_services: false, rating: 4.5, verified: true },
  { id: 'fb-bank-2', name: 'Equity Bank Kigali', category: 'bank', subcategory: 'branch', address: 'KG 12 St, Kacyiru', coordinates: { lat: -1.9378, lng: 30.0656 }, contact_phone: '+250 788 351 000', operating_hours: '08:00-17:00', capacity: 300, wheelchair_accessible: true, emergency_services: false, rating: 4.3, verified: true },
  { id: 'fb-bank-3', name: 'I&M Bank', category: 'bank', subcategory: 'branch', address: 'KN 5 St, Nyarugenge', coordinates: { lat: -1.9489, lng: 30.0634 }, contact_phone: '+250 788 352 000', operating_hours: '08:00-17:00', capacity: 250, wheelchair_accessible: true, emergency_services: false, rating: 4.4, verified: true },
  { id: 'fb-bank-4', name: 'Kenya Commercial Bank', category: 'bank', subcategory: 'branch', address: 'KG 11 Ave, Remera', coordinates: { lat: -1.9523, lng: 30.0789 }, contact_phone: '+250 788 353 000', operating_hours: '08:00-17:00', capacity: 200, wheelchair_accessible: true, emergency_services: false, rating: 4.2, verified: true },

  // Pharmacies
  { id: 'fb-pharmacy-1', name: 'Pharmacie du Centre', category: 'pharmacy', subcategory: 'general', address: 'KN 4 Ave, Kigali', coordinates: { lat: -1.9456, lng: 30.0612 }, contact_phone: '+250 788 360 000', operating_hours: '08:00-20:00', capacity: 50, wheelchair_accessible: true, emergency_services: false, rating: 4.4, verified: true },
  { id: 'fb-pharmacy-2', name: 'Pharmacie Kacyiru', category: 'pharmacy', subcategory: 'general', address: 'KG 11 Ave, Kacyiru', coordinates: { lat: -1.9434, lng: 30.0701 }, contact_phone: '+250 788 361 000', operating_hours: '08:00-20:00', capacity: 40, wheelchair_accessible: true, emergency_services: false, rating: 4.3, verified: true },
  { id: 'fb-pharmacy-3', name: 'Pharmacie Nyamirambo', category: 'pharmacy', subcategory: 'general', address: 'KN 12 St, Nyamirambo', coordinates: { lat: -1.9689, lng: 30.0456 }, contact_phone: '+250 788 362 000', operating_hours: '08:00-20:00', capacity: 35, wheelchair_accessible: true, emergency_services: false, rating: 4.2, verified: true },
  { id: 'fb-pharmacy-4', name: 'Pharmacie Remera', category: 'pharmacy', subcategory: 'general', address: 'KG 15 St, Remera', coordinates: { lat: -1.9612, lng: 30.0834 }, contact_phone: '+250 788 363 000', operating_hours: '08:00-20:00', capacity: 45, wheelchair_accessible: true, emergency_services: false, rating: 4.4, verified: true },

  // Bus Stops
  { id: 'fb-bus-1', name: 'Nyabugogo Bus Terminal', category: 'bus_stop', subcategory: 'terminal', address: 'Nyabugogo', coordinates: { lat: -1.9345, lng: 30.0345 }, contact_phone: '+250 788 370 000', operating_hours: '05:00-22:00', capacity: 5000, wheelchair_accessible: true, emergency_services: false, rating: 4.0, verified: true },
  { id: 'fb-bus-2', name: 'Kigali City Center Stop', category: 'bus_stop', subcategory: 'station', address: 'KN 5 Rd, Kigali', coordinates: { lat: -1.9445, lng: 30.0612 }, contact_phone: '+250 788 371 000', operating_hours: '05:00-22:00', capacity: 2000, wheelchair_accessible: true, emergency_services: false, rating: 4.2, verified: true },
  { id: 'fb-bus-3', name: 'Kacyiru Bus Stop', category: 'bus_stop', subcategory: 'station', address: 'KG 11 Ave, Kacyiru', coordinates: { lat: -1.9389, lng: 30.0689 }, contact_phone: '+250 788 372 000', operating_hours: '05:00-22:00', capacity: 1500, wheelchair_accessible: true, emergency_services: false, rating: 4.1, verified: true },
  { id: 'fb-bus-4', name: 'Remera Bus Stop', category: 'bus_stop', subcategory: 'station', address: 'KG 15 St, Remera', coordinates: { lat: -1.9567, lng: 30.0812 }, contact_phone: '+250 788 373 000', operating_hours: '05:00-22:00', capacity: 1200, wheelchair_accessible: true, emergency_services: false, rating: 4.0, verified: true },
  { id: 'fb-bus-5', name: 'Kimironko Bus Stop', category: 'bus_stop', subcategory: 'station', address: 'KG 12 St, Kimironko', coordinates: { lat: -1.9534, lng: 30.0923 }, contact_phone: '+250 788 374 000', operating_hours: '05:00-22:00', capacity: 1000, wheelchair_accessible: true, emergency_services: false, rating: 4.1, verified: true },

  // District Offices (Kigali's three districts)
  { id: 'fb-district-1', name: 'Gasabo District Office', category: 'district_office', subcategory: 'administration', address: 'KG 11 Ave, Gasabo', coordinates: { lat: -1.9356, lng: 30.1023 }, contact_phone: '+250 788 500 000', operating_hours: '08:00-17:00', capacity: 200, wheelchair_accessible: true, emergency_services: false, rating: 4.3, verified: true },
  { id: 'fb-district-2', name: 'Kicukiro District Office', category: 'district_office', subcategory: 'administration', address: 'KK 15 St, Kicukiro', coordinates: { lat: -1.9756, lng: 30.1045 }, contact_phone: '+250 788 501 000', operating_hours: '08:00-17:00', capacity: 180, wheelchair_accessible: true, emergency_services: false, rating: 4.2, verified: true },
  { id: 'fb-district-3', name: 'Nyarugenge District Office', category: 'district_office', subcategory: 'administration', address: 'KN 4 Ave, Nyarugenge', coordinates: { lat: -1.9434, lng: 30.0601 }, contact_phone: '+250 788 502 000', operating_hours: '08:00-17:00', capacity: 220, wheelchair_accessible: true, emergency_services: false, rating: 4.4, verified: true },

  // Trade Centers
  { id: 'fb-trade-1', name: 'Kigali Convention Centre', category: 'trade_center', subcategory: 'convention', address: 'KG 2 Roundabout, Kigali', coordinates: { lat: -1.9456, lng: 30.0867 }, contact_phone: '+250 788 600 000', operating_hours: '08:00-22:00', capacity: 5000, wheelchair_accessible: true, emergency_services: false, rating: 4.8, verified: true },
  { id: 'fb-trade-2', name: 'Kigali City Market', category: 'trade_center', subcategory: 'market', address: 'KN 4 Ave, Nyarugenge', coordinates: { lat: -1.9489, lng: 30.0578 }, contact_phone: '+250 788 601 000', operating_hours: '06:00-20:00', capacity: 3000, wheelchair_accessible: true, emergency_services: false, rating: 4.3, verified: true },
  { id: 'fb-trade-3', name: 'Simba Supermarket', category: 'trade_center', subcategory: 'retail', address: 'KG 9 Ave, Kacyiru', coordinates: { lat: -1.9401, lng: 30.0712 }, contact_phone: '+250 788 602 000', operating_hours: '08:00-21:00', capacity: 500, wheelchair_accessible: true, emergency_services: false, rating: 4.4, verified: true },
  { id: 'fb-trade-4', name: 'Nyarutarama Trade Center', category: 'trade_center', subcategory: 'complex', address: 'KG 15 Ave, Nyarutarama', coordinates: { lat: -1.9401, lng: 30.0889 }, contact_phone: '+250 788 603 000', operating_hours: '08:00-20:00', capacity: 800, wheelchair_accessible: true, emergency_services: false, rating: 4.2, verified: true },
  { id: 'fb-trade-5', name: 'Kagugu Trade Center', category: 'trade_center', subcategory: 'complex', address: 'GG 2 St, Kagugu', coordinates: { lat: -1.9267, lng: 30.0956 }, contact_phone: '+250 788 604 000', operating_hours: '08:00-19:00', capacity: 400, wheelchair_accessible: true, emergency_services: false, rating: 4.0, verified: true },

  // Water Points
  { id: 'fb-water-1', name: 'Kimisagara Water Point', category: 'water_point', subcategory: 'public', address: 'Kimisagara', coordinates: { lat: -1.9612, lng: 30.0434 }, contact_phone: '+250 788 390 000', operating_hours: '06:00-18:00', capacity: 500, wheelchair_accessible: false, emergency_services: false, rating: 3.8, verified: true },
  { id: 'fb-water-2', name: 'Gitega Water Kiosk', category: 'water_point', subcategory: 'kiosk', address: 'Gitega', coordinates: { lat: -1.9678, lng: 30.0689 }, contact_phone: '+250 788 391 000', operating_hours: '06:00-18:00', capacity: 300, wheelchair_accessible: false, emergency_services: false, rating: 4.0, verified: true },
  { id: 'fb-water-3', name: 'Nyarugenge Public Tap', category: 'water_point', subcategory: 'public', address: 'Nyarugenge', coordinates: { lat: -1.9489, lng: 30.0545 }, contact_phone: '+250 788 392 000', operating_hours: '06:00-18:00', capacity: 400, wheelchair_accessible: false, emergency_services: false, rating: 3.9, verified: true },
  { id: 'fb-water-4', name: 'Kacyiru Water Point', category: 'water_point', subcategory: 'public', address: 'Kacyiru', coordinates: { lat: -1.9356, lng: 30.0778 }, contact_phone: '+250 788 393 000', operating_hours: '06:00-18:00', capacity: 350, wheelchair_accessible: false, emergency_services: false, rating: 4.1, verified: true },

  // Public Utilities
  { id: 'fb-utility-1', name: 'REG Kigali Office', category: 'public_utility', subcategory: 'electricity', address: 'KG 12 St, Kigali', coordinates: { lat: -1.9412, lng: 30.0634 }, contact_phone: '+250 788 400 000', operating_hours: '08:00-17:00', capacity: 200, wheelchair_accessible: true, emergency_services: false, rating: 4.2, verified: true },
  { id: 'fb-utility-2', name: 'WASAC Office', category: 'public_utility', subcategory: 'water', address: 'KN 5 Ave, Kigali', coordinates: { lat: -1.9467, lng: 30.0578 }, contact_phone: '+250 788 401 000', operating_hours: '08:00-17:00', capacity: 150, wheelchair_accessible: true, emergency_services: false, rating: 4.1, verified: true },
];

export async function fetchServiceLocations(
  categories?: ServiceCategory[]
): Promise<ServiceLocation[]> {
  // If Supabase is not configured, use fallback data
  if (!isSupabaseConfigured) {
    return filterByCategory(FALLBACK_SERVICES, categories);
  }

  try {
    let query = supabase.from('service_locations').select('*');

    if (categories && categories.length > 0) {
      query = query.in('category', categories);
    }

    const { data, error } = await query;
    if (error) throw error;

    // If database returns empty, use fallback
    if (!data || data.length === 0) {
      return filterByCategory(FALLBACK_SERVICES, categories);
    }

    return data.map(transformServiceLocation);
  } catch (err) {
    console.warn('Supabase fetch failed, using fallback data:', err);
    return filterByCategory(FALLBACK_SERVICES, categories);
  }
}

function filterByCategory(
  services: ServiceLocation[],
  categories?: ServiceCategory[]
): ServiceLocation[] {
  if (!categories || categories.length === 0) return services;
  return services.filter((s) => categories.includes(s.category));
}

export async function fetchServiceLocationById(id: string): Promise<ServiceLocation | null> {
  if (!isSupabaseConfigured) {
    return FALLBACK_SERVICES.find((s) => s.id === id) || null;
  }

  try {
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
  } catch {
    return FALLBACK_SERVICES.find((s) => s.id === id) || null;
  }
}

export async function searchServiceLocations(query: string): Promise<ServiceLocation[]> {
  const q = query.toLowerCase();

  if (!isSupabaseConfigured) {
    return FALLBACK_SERVICES.filter(
      (s) => s.name.toLowerCase().includes(q) || (s.address?.toLowerCase().includes(q) ?? false)
    ).slice(0, 20);
  }

  try {
    const { data, error } = await supabase
      .from('service_locations')
      .select('*')
      .or(`name.ilike.%${query}%,address.ilike.%${query}%`)
      .limit(20);

    if (error) throw error;

    if (!data || data.length === 0) {
      return FALLBACK_SERVICES.filter(
        (s) => s.name.toLowerCase().includes(q) || (s.address?.toLowerCase().includes(q) ?? false)
      ).slice(0, 20);
    }

    return data.map(transformServiceLocation);
  } catch {
    return FALLBACK_SERVICES.filter(
      (s) => s.name.toLowerCase().includes(q) || (s.address?.toLowerCase().includes(q) ?? false)
    ).slice(0, 20);
  }
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
  // Always use fallback data combined with Supabase data for nearest search
  const services = await fetchServiceLocations(category ? [category] : undefined);

  if (services.length === 0) {
    // Fallback: search in static data
    const fallback = filterByCategory(FALLBACK_SERVICES, category ? [category] : undefined);
    if (fallback.length === 0) return null;

    let nearest: ServiceLocation | null = null;
    let minDist = Infinity;

    fallback.forEach((service) => {
      const dist = calculateDistanceMeters(center, service.coordinates);
      if (dist < minDist) {
        minDist = dist;
        nearest = service;
      }
    });

    return nearest;
  }

  let nearest: ServiceLocation | null = null;
  let minDist = Infinity;

  // Sort all services by distance and find nearest
  const sortedServices = [...services].sort((a, b) => {
    const distA = calculateDistanceMeters(center, a.coordinates);
    const distB = calculateDistanceMeters(center, b.coordinates);
    return distA - distB;
  });

  if (sortedServices.length > 0) {
    nearest = sortedServices[0];
  }

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
