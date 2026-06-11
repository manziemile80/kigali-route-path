import { useState, useEffect } from 'react';
import { InteractiveMap } from '../components/map/InteractiveMap';
import { fetchServiceLocations } from '../utils/api';
import type { ServiceLocation, Coordinates } from '../types';
import { useMapStore } from '../stores/mapStore';
import { useRouteStore } from '../stores/routeStore';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Search, Filter, MapPin, Route, Navigation, X, Loader2 } from 'lucide-react';

export function MapPage() {
  const [services, setServices] = useState<ServiceLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const { selectedLocation, setSelectedLocation, selectedCategories, toggleCategory, setCategories } = useMapStore();
  const { setStart, setEnd, calculateRoute, isCalculating, currentRoute } = useRouteStore();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await fetchServiceLocations();
      setServices(data);
    } catch (err) {
      console.error('Error loading services:', err);
    } finally {
      setLoading(false);
    }
  };

  const categoryFilters = [
    { id: 'hospital', label: 'Hospitals', color: '#ef4444', count: 4 },
    { id: 'health_center', label: 'Health Centers', color: '#f97316', count: 4 },
    { id: 'school', label: 'Schools', color: '#8b5cf6', count: 5 },
    { id: 'police_station', label: 'Police', color: '#3b82f6', count: 3 },
    { id: 'fire_station', label: 'Fire Stations', color: '#dc2626', count: 1 },
    { id: 'bank', label: 'Banks', color: '#059669', count: 4 },
    { id: 'pharmacy', label: 'Pharmacies', color: '#ec4899', count: 4 },
    { id: 'bus_stop', label: 'Bus Stops', color: '#6366f1', count: 5 },
    { id: 'government_office', label: 'Government', color: '#64748b', count: 4 },
    { id: 'water_point', label: 'Water Points', color: '#0ea5e9', count: 4 },
    { id: 'public_utility', label: 'Utilities', color: '#14b8a6', count: 2 },
  ];

  const filteredServices = services.filter((service) => {
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(service.category);
    const matchesSearch = searchQuery === '' ||
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (service.address && service.address.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleGetDirections = (location: ServiceLocation) => {
    setSelectedLocation(location);
    setEnd(location.coordinates);
  };

  return (
    <div className="h-screen pt-16 flex">
      <div className="w-80 bg-white dark:bg-gray-800 shadow-lg z-20 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search services..."
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-kigali-green"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`mt-2 w-full flex items-center justify-center space-x-2 py-2 rounded-lg text-sm font-medium transition-colors ${showFilters ? 'bg-kigali-green text-white' : 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300'}`}
          >
            <Filter className="w-4 h-4" />
            <span>Filters ({selectedCategories.length})</span>
          </button>
        </div>

        {showFilters && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Categories</h3>
              {selectedCategories.length > 0 && (
                <button
                  onClick={() => setCategories([])}
                  className="text-xs text-kigali-green hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {categoryFilters.map((cat) => (
                <label
                  key={cat.id}
                  className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                >
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat.id as any)}
                      onChange={() => toggleCategory(cat.id as any)}
                      className="rounded border-gray-300 text-kigali-green focus:ring-kigali-green"
                    />
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{cat.label}</span>
                  </div>
                  <span className="text-xs text-gray-400">{cat.count}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-kigali-green" />
            </div>
          ) : (
            <div className="p-2">
              <div className="mb-2 px-2 text-xs text-gray-500 dark:text-gray-400">
                {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''} found
              </div>
              {filteredServices.map((service) => (
                <div
                  key={service.id}
                  onClick={() => setSelectedLocation(service)}
                  className={`p-3 rounded-lg cursor-pointer transition-all mb-1 ${
                    selectedLocation?.id === service.id
                      ? 'bg-kigali-green/10 border border-kigali-green'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {service.name}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                        {service.category.replace('_', ' ')}
                      </p>
                      {service.address && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">
                          {service.address}
                        </p>
                      )}
                    </div>
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{
                        backgroundColor: categoryFilters.find((c) => c.id === service.category)?.color || '#6b7280',
                      }}
                    >
                      {service.name.charAt(0)}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center space-x-2">
                    {service.emergency_services && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                        Emergency
                      </span>
                    )}
                    {service.wheelchair_accessible && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                        Accessible
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedLocation && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {selectedLocation.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                  {selectedLocation.category.replace('_', ' ')}
                </p>
              </div>
              <button
                onClick={() => setSelectedLocation(null)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="mt-3 flex items-center space-x-2">
              <Button
                size="sm"
                onClick={() => handleGetDirections(selectedLocation)}
                className="flex-1"
              >
                <Navigation className="w-4 h-4 mr-1" />
                Get Directions
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setStart(selectedLocation.coordinates)}
              >
                <MapPin className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-900">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-kigali-green mx-auto" />
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading map data...</p>
            </div>
          </div>
        ) : (
          <InteractiveMap
            services={filteredServices}
            showControls={true}
            showRouteControls={true}
            showLayerPanel={true}
          />
        )}
      </div>
    </div>
  );
}
