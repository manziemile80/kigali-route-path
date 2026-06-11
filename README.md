# Smart Route Planning and Shortest Path Analysis for Kigali City

A comprehensive GIS-based web application for route optimization and public service accessibility analysis in Kigali City, Rwanda.

## Overview

This platform provides spatial decision support for urban planning by enabling users to:
- Find optimal routes to essential public services
- Compare shortest path algorithms (Dijkstra and A*)
- Analyze service accessibility across the city
- Identify underserved areas through spatial analysis

## Features

### Interactive GIS Map
- Display of Kigali City administrative boundaries
- Road network visualization with multiple layers
- Service location markers with categorized icons
- Zoom, pan, search, and filter tools
- Layer control panel with customizable opacity

### Smart Route Planning
- Start and destination point selection
- Multiple travel modes: Walking, Driving, Public Transport
- Shortest path computation with two algorithms
- Route visualization on map
- Distance and estimated travel time display

### Shortest Path Analysis
- **Dijkstra's Algorithm**: Guaranteed optimal path with predictable performance
- **A* Algorithm**: Heuristic-guided search, often faster for spatial networks
- Performance comparison with execution time metrics
- Road segment count and route statistics

### Nearby Service Finder
- Buffer analysis with selectable radius (500m, 1km, 2km, 5km, 10km)
- Service locations within specified distance
- Accessibility metrics per category

### GIS Spatial Analysis
- Network analysis capabilities
- Service area mapping
- Accessibility dashboards with charts
- Heatmaps for service density
- Underserved area identification

### Admin Dashboard
- Add/edit/delete service locations
- Manage road network data
- Verify and rate services
- View analytics and statistics

## Technology Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS for styling
- Leaflet / React-Leaflet for mapping
- Turf.js for spatial operations
- Recharts for analytics visualization
- Zustand for state management

### Backend & Database
- Supabase (PostgreSQL + PostGIS)
- Row Level Security (RLS)
- Real-time subscriptions

### Algorithms
- Dijkstra's shortest path algorithm
- A* graph search with heuristics

### GIS Tools
- GeoJSON for data exchange
- WKT/WKB geometry formats
- Spatial indexing (GIST)
- Coordinate System: SRID 4326 (WGS84)

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd kigali-gis-route-planner
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run database migrations
The migrations are already applied with sample data for Kigali City.

5. Start development server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

## Database Schema

### Tables
- `users` - User authentication and roles
- `admin_boundaries` - Kigali administrative units (sectors, districts)
- `road_segments` - Road network with geometry and attributes
- `road_nodes` - Network nodes for routing algorithms
- `service_locations` - Public services (hospitals, schools, etc.)
- `saved_routes` - User-saved route calculations
- `route_analyses` - Analysis history and results
- `traffic_data` - Simulated traffic conditions
- `analytics_events` - Usage tracking

### Spatial Features
- PostGIS extension for geometry support
- Spatial indexes (GIST) for fast queries
- Automatic length calculation for road segments

## Service Categories

The system tracks the following service types:
- Hospitals
- Health Centers
- Schools (primary, secondary, university)
- Police Stations
- Fire Stations
- Banks
- Pharmacies
- Bus Stops
- Government Offices
- Water Points
- Public Utilities

## Sample Data

The system includes pre-loaded data for Kigali City:
- 52 public service locations across 11 categories
- 21 road segments with network topology
- 6 administrative boundaries (sectors)
- 20 road network nodes (intersections)
- Traffic simulation data by hour and day

## Research Components

This platform supports academic research by providing:
- Comparative algorithm performance metrics
- Spatial accessibility indicators
- Route efficiency calculations
- Service coverage analysis
- Exportable analysis reports

## Multi-Language Support

The interface supports:
- English (en)
- Kinyarwanda (rw)

## Pages

1. **Landing Page** - Overview and feature highlights
2. **Interactive Map** - Full map with layer controls
3. **Route Planning** - Route calculation and comparison
4. **Accessibility Dashboard** - Spatial analysis and charts
5. **Admin Panel** - Service management interface
6. **Login/Register** - Authentication pages
7. **About Research** - Research methodology and findings

## API Endpoints

Using Supabase client:
- `fetchServiceLocations()` - Get all services or filter by category
- `fetchRoadSegments()` - Get road network
- `fetchAdminBoundaries()` - Get administrative boundaries
- `createServiceLocation()` - Add new service
- `updateServiceLocation()` - Update existing service
- `deleteServiceLocation()` - Remove service
- `saveAnalysis()` - Save analysis results

## Contributing

This is an academic research project. For contributions, please contact the research team.

## License

Academic use license - contact authors for commercial licensing.

## Acknowledgments

- OpenStreetMap for road network data
- PostGIS for spatial database technology
- Supabase for backend infrastructure
- The open-source GIS community

## Contact

For questions about the research or collaboration opportunities, please reach out through the university channels.

---

**Research Team** - Geomatics and GIS Department
