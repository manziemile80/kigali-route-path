-- Insert Kigali administrative boundaries ( sectors)
INSERT INTO admin_boundaries (name, type, geometry, population, area_sqkm) VALUES
( 'Nyarugenge', 'sector', ST_GeomFromText('MULTIPOLYGON(( (30.05 -1.94, 30.08 -1.94, 30.08 -1.97, 30.05 -1.97, 30.05 -1.94)))', 4326), 125000, 15.2),
( 'Kigali', 'sector', ST_GeomFromText('MULTIPOLYGON(( (30.06 -1.93, 30.10 -1.93, 30.10 -1.96, 30.06 -1.96, 30.06 -1.93)))', 4326), 95000, 12.8),
( 'Gitega', 'sector', ST_GeomFromText('MULTIPOLYGON(( (30.07 -1.96, 30.11 -1.96, 30.11 -1.99, 30.07 -1.99, 30.07 -1.96)))', 4326), 87000, 11.5),
( 'Kacyiru', 'sector', ST_GeomFromText('MULTIPOLYGON(( (30.08 -1.93, 30.12 -1.93, 30.12 -1.96, 30.08 -1.96, 30.08 -1.93)))', 4326), 78000, 14.3),
( 'Kimisagara', 'sector', ST_GeomFromText('MULTIPOLYGON(( (30.04 -1.96, 30.07 -1.96, 30.07 -1.99, 30.04 -1.99, 30.04 -1.96)))', 4326), 65000, 9.8),
( 'Muhima', 'sector', ST_GeomFromText('MULTIPOLYGON(( (30.06 -1.95, 30.09 -1.95, 30.09 -1.98, 30.06 -1.98, 30.06 -1.95)))', 4326), 72000, 10.2);

-- Insert road nodes ( intersections)
INSERT INTO road_nodes (osm_id, geometry, intersection_type) VALUES
( 1001, ST_SetSRID(ST_MakePoint(30.0585, -1.9445), 4326), 'traffic_light'),
( 1002, ST_SetSRID(ST_MakePoint(30.0612, -1.9478), 4326), 'traffic_light'),
( 1003, ST_SetSRID(ST_MakePoint(30.0655, -1.9512), 4326), 'roundabout'),
( 1004, ST_SetSRID(ST_MakePoint(30.0687, -1.9534), 4326), 'regular'),
( 1005, ST_SetSRID(ST_MakePoint(30.0723, -1.9567), 4326), 'traffic_light'),
( 1006, ST_SetSRID(ST_MakePoint(30.0634, -1.9421), 4326), 'roundabout'),
( 1007, ST_SetSRID(ST_MakePoint(30.0678, -1.9456), 4326), 'regular'),
( 1008, ST_SetSRID(ST_MakePoint(30.0712, -1.9489), 4326), 'traffic_light'),
( 1009, ST_SetSRID(ST_MakePoint(30.0745, -1.9523), 4326), 'regular'),
( 1010, ST_SetSRID(ST_MakePoint(30.0778, -1.9556), 4326), 'roundabout');

-- Insert road segments
INSERT INTO road_segments (name, road_type, geometry, speed_kmh, one_way, surface, condition, traffic_factor, source_node, target_node) VALUES
( 'KN 1 Ave', 'primary', ST_GeomFromText('LINESTRING(30.0585 -1.9445, 30.0612 -1.9478)', 4326), 50, false, 'paved', 'excellent', 1.0, 1, 2),
( 'KN 2 Ave', 'primary', ST_GeomFromText('LINESTRING(30.0612 -1.9478, 30.0655 -1.9512)', 4326), 50, false, 'paved', 'good', 1.2, 2, 3),
( 'KG 11 Ave', 'secondary', ST_GeomFromText('LINESTRING(30.0655 -1.9512, 30.0687 -1.9534)', 4326), 40, false, 'paved', 'good', 1.1, 3, 4),
( 'KG 12 Ave', 'secondary', ST_GeomFromText('LINESTRING(30.0687 -1.9534, 30.0723 -1.9567)', 4326), 40, false, 'paved', 'fair', 1.3, 4, 5),
( 'KN 3 Ave', 'primary', ST_GeomFromText('LINESTRING(30.0634 -1.9421, 30.0678 -1.9456)', 4326), 50, false, 'paved', 'excellent', 0.9, 6, 7),
( 'KN 4 Ave', 'tertiary', ST_GeomFromText('LINESTRING(30.0678 -1.9456, 30.0712 -1.9489)', 4326), 30, false, 'paved', 'good', 1.0, 7, 8),
( 'KG 13 Ave', 'secondary', ST_GeomFromText('LINESTRING(30.0712 -1.9489, 30.0745 -1.9523)', 4326), 40, false, 'paved', 'good', 1.1, 8, 9),
( 'KG 14 Ave', 'tertiary', ST_GeomFromText('LINESTRING(30.0745 -1.9523, 30.0778 -1.9556)', 4326), 30, false, 'paved', 'fair', 1.2, 9, 10),
( 'Nyarugenge Road', 'primary', ST_GeomFromText('LINESTRING(30.0585 -1.9445, 30.0634 -1.9421)', 4326), 50, false, 'paved', 'excellent', 1.0, 1, 6),
( 'City Center Link', 'secondary', ST_GeomFromText('LINESTRING(30.0612 -1.9478, 30.0678 -1.9456)', 4326), 40, false, 'paved', 'good', 1.1, 2, 7),
( 'Gishushu Road', 'tertiary', ST_GeomFromText('LINESTRING(30.0655 -1.9512, 30.0712 -1.9489)', 4326), 30, false, 'paved', 'good', 1.0, 3, 8),
( 'Remera Road', 'secondary', ST_GeomFromText('LINESTRING(30.0687 -1.9534, 30.0745 -1.9523)', 4326), 40, false, 'paved', 'fair', 1.4, 4, 9),
( 'Kacyiru Link', 'primary', ST_GeomFromText('LINESTRING(30.0723 -1.9567, 30.0778 -1.9556)', 4326), 50, false, 'paved', 'excellent', 0.9, 5, 10),
( 'Hospital Road', 'residential', ST_GeomFromText('LINESTRING(30.0612 -1.9478, 30.0595 -1.9495)', 4326), 25, false, 'paved', 'good', 1.0, 2, 11),
( 'School Street', 'residential', ST_GeomFromText('LINESTRING(30.0678 -1.9456, 30.0698 -1.9432)', 4326), 25, false, 'paved', 'good', 1.0, 7, 12);

-- Insert road nodes for the additional segments
INSERT INTO road_nodes (osm_id, geometry, intersection_type) VALUES
( 1011, ST_SetSRID(ST_MakePoint(30.0595, -1.9495), 4326), 'regular'),
( 1012, ST_SetSRID(ST_MakePoint(30.0698, -1.9432), 4326), 'regular'),
( 1013, ST_SetSRID(ST_MakePoint(30.0601, -1.9544), 4326), 'regular'),
( 1014, ST_SetSRID(ST_MakePoint(30.0667, -1.9589), 4326), 'traffic_light'),
( 1015, ST_SetSRID(ST_MakePoint(30.0723, -1.9512), 4326), 'roundabout'),
( 1016, ST_SetSRID(ST_MakePoint(30.0789, -1.9623), 4326), 'regular'),
( 1017, ST_SetSRID(ST_MakePoint(30.0745, -1.9489), 4326), 'traffic_light'),
( 1018, ST_SetSRID(ST_MakePoint(30.0612, -1.9601), 4326), 'regular'),
( 1019, ST_SetSRID(ST_MakePoint(30.0701, -1.9632), 4326), 'regular'),
( 1020, ST_SetSRID(ST_MakePoint(30.0812, -1.9589), 4326), 'roundabout');

-- More road segments
INSERT INTO road_segments (name, road_type, geometry, speed_kmh, one_way, surface, condition, traffic_factor, source_node, target_node) VALUES
( 'University Road', 'secondary', ST_GeomFromText('LINESTRING(30.0634 -1.9421, 30.0612 -1.9478)', 4326), 40, false, 'paved', 'good', 1.0, 6, 2),
( 'Police Station Road', 'residential', ST_GeomFromText('LINESTRING(30.0655 -1.9512, 30.0601 -1.9544)', 4326), 25, false, 'paved', 'good', 1.0, 3, 13),
( 'Market Road', 'tertiary', ST_GeomFromText('LINESTRING(30.0687 -1.9534, 30.0667 -1.9589)', 4326), 30, false, 'paved', 'fair', 1.2, 4, 14),
( 'Bus Terminal Link', 'primary', ST_GeomFromText('LINESTRING(30.0723 -1.9567, 30.0723 -1.9512)', 4326), 50, false, 'paved', 'excellent', 1.0, 5, 15),
( 'Airport Road', 'primary', ST_GeomFromText('LINESTRING(30.0778 -1.9556, 30.0789 -1.9623)', 4326), 60, false, 'paved', 'excellent', 0.8, 10, 16),
( 'Central Business', 'secondary', ST_GeomFromText('LINESTRING(30.0712 -1.9489, 30.0745 -1.9489)', 4326), 40, false, 'paved', 'good', 1.3, 8, 17),
( 'Industrial Zone', 'tertiary', ST_GeomFromText('LINESTRING(30.0612 -1.9478, 30.0612 -1.9601)', 4326), 30, false, 'paved', 'fair', 1.4, 2, 18),
( 'Kicukiro Road', 'primary', ST_GeomFromText('LINESTRING(30.0745 -1.9523, 30.0701 -1.9632)', 4326), 50, false, 'paved', 'good', 1.0, 9, 19),
( 'Nyarutarama Link', 'secondary', ST_GeomFromText('LINESTRING(30.0778 -1.9556, 30.0812 -1.9589)', 4326), 40, false, 'paved', 'good', 1.1, 10, 20);

-- Insert service locations ( hospitals, schools, etc.)
INSERT INTO service_locations (name, category, subcategory, address, geometry, contact_phone, operating_hours, capacity, wheelchair_accessible, emergency_services, rating, verified) VALUES
-- Hospitals
( 'King Faisal Hospital', 'hospital', 'tertiary', 'KG 45 St, Kacyiru', ST_SetSRID(ST_MakePoint(30.0698, -1.9545), 4326), '+250 788 300 000', '24/7', 500, true, true, 4.8, true),
( 'CHUK ( Centre Hospitalier Universitaire de Kigali)', 'hospital', 'tertiary', 'KN 4 Ave, Nyarugenge', ST_SetSRID(ST_MakePoint(30.0601, -1.9495), 4326), '+250 788 301 000', '24/7', 350, true, true, 4.6, true),
( 'Kanombe Military Hospital', 'hospital', 'secondary', 'Kanombe, Kicukiro', ST_SetSRID(ST_MakePoint(30.1056, -1.9789), 4326), '+250 788 302 000', '24/7', 200, true, true, 4.5, true),
( 'Police Hospital', 'hospital', 'secondary', 'Gishushu, Kigali', ST_SetSRID(ST_MakePoint(30.0655, -1.9421), 4326), '+250 788 303 000', '24/7', 150, true, true, 4.4, true),

-- Health Centers
( 'Muhima Health Center', 'health_center', 'primary', 'Muhima, Nyarugenge', ST_SetSRID(ST_MakePoint(30.0585, -1.9512), 4326), '+250 788 310 000', '08:00-17:00', 50, true, false, 4.2, true),
( 'Gitega Health Center', 'health_center', 'primary', 'Gitega', ST_SetSRID(ST_MakePoint(30.0723, -1.9645), 4326), '+250 788 311 000', '08:00-17:00', 40, true, false, 4.1, true),
( 'Remera Health Center', 'health_center', 'primary', 'Remera', ST_SetSRID(ST_MakePoint(30.0812, -1.9545), 4326), '+250 788 312 000', '08:00-17:00', 45, true, false, 4.3, true),
( 'Kacyiru Health Center', 'health_center', 'primary', 'Kacyiru', ST_SetSRID(ST_MakePoint(30.0634, -1.9389), 4326), '+250 788 313 000', '08:00-17:00', 35, true, false, 4.0, true),

-- Schools
( 'University of Rwanda', 'school', 'university', 'KN 67 St, Nyarugenge', ST_SetSRID(ST_MakePoint(30.0612, -1.9401), 4326), '+250 788 320 000', '08:00-18:00', 15000, true, false, 4.7, true),
( 'Kigali Institute of Science and Technology', 'school', 'university', 'KN 78 St, Kigali', ST_SetSRID(ST_MakePoint(30.0567, -1.9434), 4326), '+250 788 321 000', '08:00-18:00', 8000, true, false, 4.6, true),
( 'Green Hills Academy', 'school', 'secondary', 'KG 11 Ave, Kacyiru', ST_SetSRID(ST_MakePoint(30.0745, -1.9401), 4326), '+250 788 322 000', '08:00-16:00', 1200, true, false, 4.5, true),
( 'Kigali Parents School', 'school', 'primary', 'KG 12 St, Kacyiru', ST_SetSRID(ST_MakePoint(30.0689, -1.9412), 4326), '+250 788 323 000', '08:00-16:00', 800, true, false, 4.4, true),
( 'FAWE Girls School', 'school', 'secondary', 'Gisozi', ST_SetSRID(ST_MakePoint(30.0778, -1.9467), 4326), '+250 788 324 000', '08:00-16:00', 600, true, false, 4.6, true),

-- Police Stations
( 'Kigali Central Police Station', 'police_station', 'headquarters', 'KG 45 St, Kiyovu', ST_SetSRID(ST_MakePoint(30.0598, -1.9544), 4326), '+250 788 330 000', '24/7', 200, true, true, 4.5, true),
( 'Kacyiru Police Post', 'police_station', 'station', 'KG 11 Ave, Kacyiru', ST_SetSRID(ST_MakePoint(30.0712, -1.9356), 4326), '+250 788 331 000', '24/7', 50, true, true, 4.3, true),
( 'Remera Police Station', 'police_station', 'station', 'KG 15 St, Remera', ST_SetSRID(ST_MakePoint(30.0867, -1.9589), 4326), '+250 788 332 000', '24/7', 75, true, true, 4.4, true),

-- Fire Stations
( 'Kigali Fire Brigade', 'fire_station', 'main', 'KG 23 St, Kiyovu', ST_SetSRID(ST_MakePoint(30.0612, -1.9523), 4326), '+250 788 340 000', '24/7', 100, true, true, 4.7, true),

-- Banks
( 'Bank of Kigali HQ', 'bank', 'headquarters', 'KN 4 Ave, Kigali', ST_SetSRID(ST_MakePoint(30.0598, -1.9445), 4326), '+250 788 350 000', '08:00-17:00', 500, true, false, 4.5, true),
( 'Equity Bank Kigali', 'bank', 'branch', 'KG 12 St, Kacyiru', ST_SetSRID(ST_MakePoint(30.0656, -1.9378), 4326), '+250 788 351 000', '08:00-17:00', 300, true, false, 4.3, true),
( 'I&M Bank', 'bank', 'branch', 'KN 5 St, Nyarugenge', ST_SetSRID(ST_MakePoint(30.0634, -1.9489), 4326), '+250 788 352 000', '08:00-17:00', 250, true, false, 4.4, true),
( 'Kenya Commercial Bank', 'bank', 'branch', 'KG 11 Ave, Remera', ST_SetSRID(ST_MakePoint(30.0789, -1.9523), 4326), '+250 788 353 000', '08:00-17:00', 200, true, false, 4.2, true),

-- Pharmacies
( 'Pharmacie du Centre', 'pharmacy', 'general', 'KN 4 Ave, Kigali', ST_SetSRID(ST_MakePoint(30.0612, -1.9456), 4326), '+250 788 360 000', '08:00-20:00', 50, true, false, 4.4, true),
( 'Pharmacie Kacyiru', 'pharmacy', 'general', 'KG 11 Ave, Kacyiru', ST_SetSRID(ST_MakePoint(30.0701, -1.9434), 4326), '+250 788 361 000', '08:00-20:00', 40, true, false, 4.3, true),
( 'Pharmacie Nyamirambo', 'pharmacy', 'general', 'KN 12 St, Nyamirambo', ST_SetSRID(ST_MakePoint(30.0456, -1.9689), 4326), '+250 788 362 000', '08:00-20:00', 35, true, false, 4.2, true),
( 'Pharmacie Remera', 'pharmacy', 'general', 'KG 15 St, Remera', ST_SetSRID(ST_MakePoint(30.0834, -1.9612), 4326), '+250 788 363 000', '08:00-20:00', 45, true, false, 4.4, true),

-- Bus Stops
( 'Nyabugogo Bus Terminal', 'bus_stop', 'terminal', 'Nyabugogo', ST_SetSRID(ST_MakePoint(30.0345, -1.9345), 4326), '+250 788 370 000', '05:00-22:00', 5000, true, false, 4.0, true),
( 'Kigali City Center Stop', 'bus_stop', 'station', 'KN 5 Rd, Kigali', ST_SetSRID(ST_MakePoint(30.0612, -1.9445), 4326), '+250 788 371 000', '05:00-22:00', 2000, true, false, 4.2, true),
( 'Kacyiru Bus Stop', 'bus_stop', 'station', 'KG 11 Ave, Kacyiru', ST_SetSRID(ST_MakePoint(30.0689, -1.9389), 4326), '+250 788 372 000', '05:00-22:00', 1500, true, false, 4.1, true),
( 'Remera Bus Stop', 'bus_stop', 'station', 'KG 15 St, Remera', ST_SetSRID(ST_MakePoint(30.0812, -1.9567), 4326), '+250 788 373 000', '05:00-22:00', 1200, true, false, 4.0, true),
( 'Kimironko Bus Stop', 'bus_stop', 'station', 'KG 12 St, Kimironko', ST_SetSRID(ST_MakePoint(30.0923, -1.9534), 4326), '+250 788 374 000', '05:00-22:00', 1000, true, false, 4.1, true),

-- Government Offices
( 'Kigali City Hall', 'government_office', 'municipal', 'KN 4 Ave, Kigali', ST_SetSRID(ST_MakePoint(30.0601, -1.9434), 4326), '+250 788 380 000', '08:00-17:00', 500, true, false, 4.5, true),
( 'Ministry of Health', 'government_office', 'ministry', 'KG 11 Ave, Kacyiru', ST_SetSRID(ST_MakePoint(30.0723, -1.9356), 4326), '+250 788 381 000', '08:00-17:00', 300, true, false, 4.4, true),
( 'Ministry of Education', 'government_office', 'ministry', 'KG 12 St, Kacyiru', ST_SetSRID(ST_MakePoint(30.0656, -1.9334), 4326), '+250 788 382 000', '08:00-17:00', 250, true, false, 4.5, true),
( 'Rwanda Revenue Authority', 'government_office', 'agency', 'KG 15 St, Remera', ST_SetSRID(ST_MakePoint(30.0756, -1.9478), 4326), '+250 788 383 000', '08:00-17:00', 400, true, false, 4.3, true),

-- Water Points
( 'Kimisagara Water Point', 'water_point', 'public', 'Kimisagara', ST_SetSRID(ST_MakePoint(30.0434, -1.9612), 4326), '+250 788 390 000', '06:00-18:00', 500, false, false, 3.8, true),
( 'Gitega Water Kiosk', 'water_point', 'kiosk', 'Gitega', ST_SetSRID(ST_MakePoint(30.0689, -1.9678), 4326), '+250 788 391 000', '06:00-18:00', 300, false, false, 4.0, true),
( 'Nyarugenge Public Tap', 'water_point', 'public', 'Nyarugenge', ST_SetSRID(ST_MakePoint(30.0545, -1.9489), 4326), '+250 788 392 000', '06:00-18:00', 400, false, false, 3.9, true),
( 'Kacyiru Water Point', 'water_point', 'public', 'Kacyiru', ST_SetSRID(ST_MakePoint(30.0778, -1.9356), 4326), '+250 788 393 000', '06:00-18:00', 350, false, false, 4.1, true),

-- Public Utilities
( 'REG Kigali Office', 'public_utility', 'electricity', 'KG 12 St, Kigali', ST_SetSRID(ST_MakePoint(30.0634, -1.9412), 4326), '+250 788 400 000', '08:00-17:00', 200, true, false, 4.2, true),
( 'WASAC Office', 'public_utility', 'water', 'KN 5 Ave, Kigali', ST_SetSRID(ST_MakePoint(30.0578, -1.9467), 4326), '+250 788 401 000', '08:00-17:00', 150, true, false, 4.1, true);

-- Insert traffic simulation data
INSERT INTO traffic_data (road_segment_id, hour_of_day, day_of_week, congestion_level, average_speed_kmh, vehicle_count) VALUES
-- Morning rush hours ( 7-9 AM)
( ( SELECT id FROM road_segments WHERE name = 'KN 1 Ave' LIMIT 1), 7, 1, 1.8, 25, 450),
( ( SELECT id FROM road_segments WHERE name = 'KN 2 Ave' LIMIT 1), 8, 1, 2.2, 20, 520),
( ( SELECT id FROM road_segments WHERE name = 'KG 11 Ave' LIMIT 1), 7, 1, 1.5, 30, 380),
( ( SELECT id FROM road_segments WHERE name = 'KN 3 Ave' LIMIT 1), 8, 2, 1.9, 22, 490),
-- Evening rush hours ( 5-7 PM)
( ( SELECT id FROM road_segments WHERE name = 'KN 1 Ave' LIMIT 1), 17, 1, 2.0, 23, 480),
( ( SELECT id FROM road_segments WHERE name = 'KN 2 Ave' LIMIT 1), 18, 2, 2.4, 18, 550),
( ( SELECT id FROM road_segments WHERE name = 'KG 12 Ave' LIMIT 1), 17, 3, 1.7, 28, 420),
( ( SELECT id FROM road_segments WHERE name = 'City Center Link' LIMIT 1), 18, 4, 1.6, 32, 350),
-- Midday traffic
( ( SELECT id FROM road_segments WHERE name = 'KN 1 Ave' LIMIT 1), 12, 2, 1.2, 40, 280),
( ( SELECT id FROM road_segments WHERE name = 'KG 11 Ave' LIMIT 1), 13, 3, 1.1, 38, 250),
-- Weekend traffic
( ( SELECT id FROM road_segments WHERE name = 'KN 1 Ave' LIMIT 1), 10, 6, 1.0, 45, 200),
( ( SELECT id FROM road_segments WHERE name = 'KN 2 Ave' LIMIT 1), 14, 0, 0.9, 48, 180);