-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Users table (linked to Supabase auth)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Administrative boundaries for Kigali
CREATE TABLE admin_boundaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('province', 'district', 'sector', 'cell', 'umudugudu')),
    parent_id UUID REFERENCES admin_boundaries(id),
    geometry GEOMETRY(MULTIPOLYGON, 4326) NOT NULL,
    population INTEGER,
    area_sqkm DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Road network
CREATE TABLE road_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    road_type TEXT NOT NULL CHECK (road_type IN ('primary', 'secondary', 'tertiary', 'residential', 'service', 'footway', 'path')),
    geometry GEOMETRY(LINESTRING, 4326) NOT NULL,
    length_m DECIMAL(10,2),
    speed_kmh INTEGER DEFAULT 30,
    one_way BOOLEAN DEFAULT FALSE,
    surface TEXT DEFAULT 'paved',
    condition TEXT DEFAULT 'good' CHECK (condition IN ('excellent', 'good', 'fair', 'poor')),
    traffic_factor DECIMAL(3,2) DEFAULT 1.0,
    source_node INTEGER,
    target_node INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Road network nodes for routing
CREATE TABLE road_nodes (
    id SERIAL PRIMARY KEY,
    osm_id BIGINT,
    geometry GEOMETRY(POINT, 4326) NOT NULL,
    intersection_type TEXT DEFAULT 'regular',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Spatial index on road_nodes geometry
CREATE INDEX idx_road_nodes_geom ON road_nodes USING GIST(geometry);

-- Service locations ( hospitals, schools, etc.)
CREATE TABLE service_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('hospital', 'health_center', 'school', 'police_station', 'fire_station', 'bank', 'pharmacy', 'bus_stop', 'government_office', 'water_point', 'public_utility')),
    subcategory TEXT,
    address TEXT,
    geometry GEOMETRY(POINT, 4326) NOT NULL,
    contact_phone TEXT,
    contact_email TEXT,
    operating_hours TEXT,
    capacity INTEGER,
    wheelchair_accessible BOOLEAN DEFAULT FALSE,
    emergency_services BOOLEAN DEFAULT FALSE,
    rating DECIMAL(3,2) DEFAULT 0.0,
    verified BOOLEAN DEFAULT FALSE,
    added_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Spatial index on service_locations geometry
CREATE INDEX idx_service_locations_geom ON service_locations USING GIST(geometry);
CREATE INDEX idx_service_locations_category ON service_locations(category);

-- Create point geometries from coordinates for service_locations
-- (Helper for inserts that use lat/lng columns)

-- Saved routes
CREATE TABLE saved_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    name TEXT NOT NULL,
    start_point GEOMETRY(POINT, 4326) NOT NULL,
    end_point GEOMETRY(POINT, 4326) NOT NULL,
    route_geometry GEOMETRY(LINESTRING, 4326),
    total_distance_m DECIMAL(10,2),
    estimated_time_min DECIMAL(10,2),
    travel_mode TEXT DEFAULT 'driving' CHECK (travel_mode IN ('walking', 'driving', 'public_transport')),
    algorithm_used TEXT DEFAULT 'dijkstra' CHECK (algorithm_used IN ('dijkstra', 'astar')),
    waypoints JSONB,
    destination_service_id UUID REFERENCES service_locations(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Spatial index on saved_routes geometries
CREATE INDEX idx_saved_routes_start ON saved_routes USING GIST(start_point);
CREATE INDEX idx_saved_routes_end ON saved_routes USING GIST(end_point);
CREATE INDEX idx_saved_routes_route ON saved_routes USING GIST(route_geometry);

-- Route analysis results
CREATE TABLE route_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    analysis_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    analysis_type TEXT NOT NULL CHECK (analysis_type IN ('shortest_path', 'service_area', 'accessibility', 'traffic_simulation')),
    parameters JSONB NOT NULL,
    results JSONB NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Traffic simulation data
CREATE TABLE traffic_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    road_segment_id UUID REFERENCES road_segments(id),
    hour_of_day INTEGER NOT NULL CHECK (hour_of_day >= 0 AND hour_of_day <= 23),
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    congestion_level DECIMAL(3,2) DEFAULT 1.0,
    average_speed_kmh INTEGER,
    vehicle_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics events for tracking
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    event_type TEXT NOT NULL,
    event_data JSONB,
    session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_boundaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE road_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE road_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE traffic_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Public read policies ( anyone can read public data)
CREATE POLICY "read_admin_boundaries" ON admin_boundaries FOR SELECT TO authenticated USING (true);
CREATE POLICY "read_road_segments" ON road_segments FOR SELECT TO authenticated USING (true);
CREATE POLICY "read_road_nodes" ON road_nodes FOR SELECT TO authenticated USING (true);
CREATE POLICY "read_service_locations" ON service_locations FOR SELECT TO authenticated USING (true);
CREATE POLICY "read_traffic_data" ON traffic_data FOR SELECT TO authenticated USING (true);

-- User-specific policies
CREATE POLICY "read_own_routes" ON saved_routes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_routes" ON saved_routes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_routes" ON saved_routes FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_routes" ON saved_routes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "read_own_analyses" ON route_analyses FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_analyses" ON route_analyses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_analyses" ON route_analyses FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "insert_analytics" ON analytics_events FOR INSERT TO authenticated WITH CHECK (true);

-- Admin policies for service_locations
CREATE POLICY "insert_service_locations" ON service_locations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_service_locations" ON service_locations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_service_locations" ON service_locations FOR DELETE TO authenticated USING (true);

-- Admin policies for road_segments
CREATE POLICY "insert_road_segments" ON road_segments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_road_segments" ON road_segments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_road_segments" ON road_segments FOR DELETE TO authenticated USING (true);

-- User table policies
CREATE POLICY "read_own_user" ON users FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "insert_own_user" ON users FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "update_own_user" ON users FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create update triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_road_segments_updated_at BEFORE UPDATE ON road_segments FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_service_locations_updated_at BEFORE UPDATE ON service_locations FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Create function to calculate distance from geometry
CREATE OR REPLACE FUNCTION calculate_road_length()
RETURNS TRIGGER AS $$
BEGIN
    NEW.length_m := ST_Length(NEW.geometry::geography);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_road_length_trigger BEFORE INSERT OR UPDATE ON road_segments FOR EACH ROW EXECUTE FUNCTION calculate_road_length();