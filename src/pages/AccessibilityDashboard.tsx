import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { fetchServiceLocations, fetchAdminBoundaries } from '../utils/api';
import { calculateAccessibilityMetrics, pointsWithinBuffer, generateHeatmapData } from '../utils/spatialAnalysis';
import type { ServiceLocation, AdminBoundary, ServiceCategory, Coordinates } from '../types';
import { KIGALI_CENTER, CATEGORY_LABELS } from '../types';
import {
  BarChart3, MapPin, Users, TrendingUp, AlertTriangle, CheckCircle, Download, RefreshCw, Image as ImageIcon
} from 'lucide-react';

const KIGALI_IMAGES = [
  'https://images.pexels.com/photos/2846230/pexels-photo-2846230.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1426516/pexels-photo-1426516.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/2132126/pexels-photo-2132126.jpeg?auto=compress&cs=tinysrgb&w=800',
];

function KigaliHeroImage() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const img = new window.Image();
    img.onload = () => setLoaded(true);
    img.onerror = () => {
      if (currentIdx < KIGALI_IMAGES.length - 1) {
        setCurrentIdx(currentIdx + 1);
      } else {
        setError(true);
      }
    };
    img.src = KIGALI_IMAGES[currentIdx];
  }, [currentIdx]);

  if (error) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-kigali-green/20 to-kigali-blue/20 flex items-center justify-center">
        <div className="text-center p-6">
          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Kigali City GIS Coverage Map</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {!loaded && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
      )}
      <img
        src={KIGALI_IMAGES[currentIdx]}
        alt="Kigali City GIS coverage map"
        className={`w-full h-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        loading="lazy"
      />
    </>
  );
}

export function AccessibilityDashboard() {
  const [services, setServices] = useState<ServiceLocation[]>([]);
  const [boundaries, setBoundaries] = useState<AdminBoundary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCenter] = useState<Coordinates>(KIGALI_CENTER);
  const [selectedRadius, setSelectedRadius] = useState(5000);
  const [metrics, setMetrics] = useState({
    totalServices: 0,
    byCategory: [] as { category: string; count: number; color: string }[],
    accessibility: [] as { name: string; value: number }[],
    coverage: [] as { name: string; value: number; fill: string }[],
    heatmapData: [] as { name: string; value: number }[],
  });

  const COLORS = {
    hospital: '#ef4444',
    health_center: '#f97316',
    school: '#8b5cf6',
    police_station: '#3b82f6',
    fire_station: '#dc2626',
    bank: '#059669',
    pharmacy: '#ec4899',
    bus_stop: '#6366f1',
    government_office: '#64748b',
    water_point: '#0ea5e9',
    public_utility: '#14b8a6',
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (services.length > 0) {
      calculateMetrics();
    }
  }, [services, selectedRadius]);

  const loadData = async () => {
    try {
      const [servicesData, boundariesData] = await Promise.all([
        fetchServiceLocations(),
        fetchAdminBoundaries(),
      ]);
      setServices(servicesData);
      setBoundaries(boundariesData);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = () => {
    const nearbyServices = pointsWithinBuffer(services, selectedCenter, selectedRadius);
    const categories = Object.keys(COLORS) as ServiceCategory[];

    const byCategory = categories.map((category) => ({
      category: CATEGORY_LABELS[category],
      count: nearbyServices.filter((s) => s.category === category).length,
      color: COLORS[category],
    }));

    const accessibilityMetrics = calculateAccessibilityMetrics(selectedCenter, services, categories);

    const accessibility = accessibilityMetrics.map((m) => ({
      name: CATEGORY_LABELS[m.service_type],
      value: m.avg_distance_m || 0,
    }));

    const coverage = accessibilityMetrics.map((m) => ({
      name: CATEGORY_LABELS[m.service_type],
      value: m.coverage_percent || 0,
      fill: COLORS[m.service_type],
    }));

    const heatmapData = generateHeatmapData(services);

    setMetrics({
      totalServices: services.length,
      byCategory: byCategory.filter((c) => c.count > 0),
      accessibility,
      coverage: coverage.filter((c) => c.value > 0),
      heatmapData: heatmapData.map((h) => ({ name: `${h.coordinates[0].toFixed(2)}, ${h.coordinates[1].toFixed(2)}`, value: h.weight })),
    });
  };

  const handleExportAnalysis = async () => {
    const data = {
      date: new Date().toISOString(),
      center: selectedCenter,
      radius: selectedRadius,
      totalServices: metrics.totalServices,
      categoryBreakdown: metrics.byCategory,
      accessibilityMetrics: metrics.accessibility,
      coverageAnalysis: metrics.coverage,
    };

    await saveAnalysis('accessibility', { center: selectedCenter, radius: selectedRadius }, data);

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `accessibility-analysis-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRadiusChange = (radius: number) => {
    setSelectedRadius(radius);
  };

  const radiusOptions = [
    { value: 500, label: '500m' },
    { value: 1000, label: '1 km' },
    { value: 2000, label: '2 km' },
    { value: 5000, label: '5 km' },
    { value: 10000, label: '10 km' },
  ];

  return (
    <div className="min-h-screen pt-20 bg-gray-50 dark:bg-gray-900">
      {/* Hero Section with Kigali Image */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <KigaliHeroImage />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <div className="max-w-7xl mx-auto">
            <div className="inline-flex items-center space-x-2 bg-kigali-green/90 text-white px-3 py-1 rounded-full text-xs font-medium mb-3">
              <MapPin className="w-3 h-3" />
              <span>Kigali City, Rwanda</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              Accessibility Dashboard
            </h1>
            <p className="mt-2 text-gray-300 max-w-2xl">
              Spatial analysis and service coverage metrics for Kigali City public services
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div className="mt-4 md:mt-0 flex items-center space-x-3">
            <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg shadow-sm p-1">
              {radiusOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleRadiusChange(opt.value)}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    selectedRadius === opt.value
                      ? 'bg-kigali-green text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <Button variant="outline" onClick={handleExportAnalysis}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-kigali-green to-emerald-600 text-white">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Total Services</p>
                  <p className="text-3xl font-bold">{metrics.totalServices}</p>
                </div>
                <MapPin className="w-10 h-10 text-white/30" />
              </div>
            </CardBody>
          </Card>
          <Card className="bg-gradient-to-br from-kigali-blue to-indigo-600 text-white">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Service Categories</p>
                  <p className="text-3xl font-bold">{metrics.byCategory.length}</p>
                </div>
                <BarChart3 className="w-10 h-10 text-white/30" />
              </div>
            </CardBody>
          </Card>
          <Card className="bg-gradient-to-br from-accent-500 to-yellow-500 text-white">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Within {selectedRadius / 1000}km</p>
                  <p className="text-3xl font-bold">
                    {metrics.byCategory.reduce((sum, c) => sum + c.count, 0)}
                  </p>
                </div>
                <Users className="w-10 h-10 text-white/30" />
              </div>
            </CardBody>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500 to-violet-600 text-white">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Coverage Areas</p>
                  <p className="text-3xl font-bold">{boundaries.length}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-white/30" />
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader title="Service Distribution by Category" />
            <CardBody>
              {metrics.byCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metrics.byCategory}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="category" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        border: 'none',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {metrics.byCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  No data available
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Coverage Analysis" />
            <CardBody>
              {metrics.coverage.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={metrics.coverage}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {metrics.coverage.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  No data available
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader title="Average Distance to Services (meters)" />
            <CardBody>
              {metrics.accessibility.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metrics.accessibility} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} />
                    <Tooltip
                      formatter={(value: number) => `${value.toFixed(0)}m`}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        border: 'none',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      }}
                    />
                    <Bar dataKey="value" fill="#22c55e" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  No data available
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Accessibility Radar"
              subtitle="Service accessibility comparison"
            />
            <CardBody>
              {metrics.coverage.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={metrics.coverage}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar
                      name="Coverage %"
                      dataKey="value"
                      stroke="#22c55e"
                      fill="#22c55e"
                      fillOpacity={0.3}
                    />
                    <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  No data available
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader title="Underserved Areas Analysis" />
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {metrics.accessibility.slice(0, 6).map((item, index) => {
                const isUnderserved = item.value > 3000;
                return (
                  <div
                    key={index}
                    className={`p-4 rounded-lg ${isUnderserved ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {item.name}
                        </p>
                        <p className={`text-lg font-bold ${isUnderserved ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                          {(item.value / 1000).toFixed(1)} km
                        </p>
                      </div>
                      {isUnderserved ? (
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                      ) : (
                        <CheckCircle className="w-8 h-8 text-green-500" />
                      )}
                    </div>
                    <p className={`text-xs mt-2 ${isUnderserved ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                      {isUnderserved ? 'Underserved - Consider adding services' : 'Well covered'}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

async function saveAnalysis(type: string, parameters: unknown, results: unknown) {
  const { supabase } = await import('../lib/supabase');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  try {
    await supabase.from('route_analyses').insert({
      user_id: user.id,
      analysis_type: type,
      parameters,
      results,
    });
  } catch (err) {
    console.error('Error saving analysis:', err);
  }
}
