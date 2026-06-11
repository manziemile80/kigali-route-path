import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Map, Route, MapPin, TrendingUp, Users, Shield, Clock,
  BarChart3, AlertTriangle, TrendingDown, Navigation,
  LocateFixed, ChevronRight, Play, Pause
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useRouteStore } from '../stores/routeStore';

const TRAFFIC_IMAGES = [
  {
    url: 'https://images.pexels.com/photos/1426516/pexels-photo-1426516.jpeg?auto=compress&cs=tinysrgb&w=1200',
    caption: 'Heavy morning rush on Kigali City roads',
    congestion: 'heavy',
  },
  {
    url: 'https://images.pexels.com/photos/2132126/pexels-photo-2132126.jpeg?auto=compress&cs=tinysrgb&w=1200',
    caption: 'Gridlock at major intersections during peak hours',
    congestion: 'heavy',
  },
  {
    url: 'https://images.pexels.com/photos/3656889/pexels-photo-3656889.jpeg?auto=compress&cs=tinysrgb&w=1200',
    caption: 'Urban road network congestion analysis',
    congestion: 'moderate',
  },
  {
    url: 'https://images.pexels.com/photos/1004409/pexels-photo-1004409.jpeg?auto=compress&cs=tinysrgb&w=1200',
    caption: 'Smart routing helps drivers avoid traffic jams',
    congestion: 'low',
  },
];

function TrafficSlider() {
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = () => {
    timerRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % TRAFFIC_IMAGES.length);
    }, 3500);
  };

  const stop = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  useEffect(() => {
    if (playing) start();
    else stop();
    return stop;
  }, [playing]);

  const congestionColors = { heavy: '#ef4444', moderate: '#f59e0b', low: '#22c55e' };

  return (
    <div className="relative overflow-hidden rounded-2xl shadow-2xl aspect-[16/9]">
      {TRAFFIC_IMAGES.map((img, idx) => (
        <div
          key={idx}
          className={`absolute inset-0 transition-opacity duration-1000 ${idx === current ? 'opacity-100' : 'opacity-0'}`}
        >
          <img
            src={img.url}
            alt={img.caption}
            className="w-full h-full object-cover"
          />
          {/* Dark overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Traffic badge */}
          <div className="absolute top-4 right-4 flex items-center space-x-1.5 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full">
            <span
              className="w-2.5 h-2.5 rounded-full animate-pulse"
              style={{ backgroundColor: congestionColors[img.congestion as keyof typeof congestionColors] }}
            />
            <span className="text-white text-xs font-semibold uppercase tracking-wide">
              {img.congestion} traffic
            </span>
          </div>

          {/* Caption */}
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <p className="text-white text-sm font-medium">{img.caption}</p>
          </div>
        </div>
      ))}

      {/* Play / Pause */}
      <button
        onClick={() => setPlaying(!playing)}
        className="absolute bottom-4 right-4 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-full p-2 transition-colors z-10"
      >
        {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
        {TRAFFIC_IMAGES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`h-1.5 rounded-full transition-all ${idx === current ? 'bg-white w-6' : 'bg-white/50 w-1.5'}`}
          />
        ))}
      </div>

      {/* Animated route lines overlay on the active image */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 800 450"
        preserveAspectRatio="xMidYMid slice"
      >
        <path
          d="M50 350 Q 200 200 400 180 Q 600 160 750 100"
          fill="none"
          stroke="#22c55e"
          strokeWidth="3"
          strokeDasharray="12 6"
          className="opacity-80"
          style={{ animation: 'dashMove 3s linear infinite' }}
        />
        <path
          d="M50 380 Q 250 300 500 280 Q 680 260 750 200"
          fill="none"
          stroke="#f59e0b"
          strokeWidth="2"
          strokeDasharray="8 8"
          className="opacity-60"
          style={{ animation: 'dashMove 4s linear infinite reverse' }}
        />
      </svg>
    </div>
  );
}

function QuickRouteWidget() {
  const navigate = useNavigate();
  const { setStart } = useRouteStore();
  const [isLocating, setIsLocating] = useState(false);

  const handleFindRoute = () => {
    if (!navigator.geolocation) {
      navigate('/routes');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setStart({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsLocating(false);
        navigate('/routes');
      },
      () => {
        setIsLocating(false);
        navigate('/routes');
      },
      { timeout: 6000 }
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-6">
      <div className="flex items-center space-x-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-kigali-green/10 flex items-center justify-center">
          <Navigation className="w-4 h-4 text-kigali-green" />
        </div>
        <h3 className="font-semibold text-gray-900 dark:text-white">Find Shortest Route</h3>
      </div>

      <div className="space-y-3">
        <button
          onClick={handleFindRoute}
          disabled={isLocating}
          className="w-full flex items-center space-x-3 p-3 bg-kigali-blue/5 hover:bg-kigali-blue/10 rounded-xl border border-kigali-blue/20 transition-colors text-left"
        >
          <div className="w-8 h-8 rounded-full bg-kigali-blue/10 flex items-center justify-center flex-shrink-0">
            {isLocating ? (
              <div className="w-4 h-4 border-2 border-kigali-blue border-t-transparent rounded-full animate-spin" />
            ) : (
              <LocateFixed className="w-4 h-4 text-kigali-blue" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {isLocating ? 'Getting location...' : 'Use My Current Location'}
            </p>
            <p className="text-xs text-gray-500">Start from where you are now</p>
          </div>
        </button>

        <Link
          to="/routes"
          className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-700 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-4 h-4 text-gray-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Click on the Map</p>
            <p className="text-xs text-gray-500">Pick start & destination manually</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
        </Link>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Routes are optimized to avoid congestion in real-time
        </p>
      </div>
    </div>
  );
}

export function LandingPage() {
  const features = [
    {
      icon: Route,
      title: 'Smart Route Planning',
      description: 'Find shortest, fastest routes to essential services using advanced algorithms',
    },
    {
      icon: Map,
      title: 'Interactive GIS Map',
      description: "Explore Kigali's services with categorized markers, layers, and real-time analysis",
    },
    {
      icon: MapPin,
      title: 'Nearby Service Finder',
      description: 'Discover hospitals, schools, banks, and more within your selected radius',
    },
    {
      icon: TrendingUp,
      title: 'Accessibility Analysis',
      description: 'Evaluate service coverage and identify underserved areas across the city',
    },
  ];

  const serviceCategories = [
    { name: 'Hospitals', count: 4, color: 'bg-red-500' },
    { name: 'Health Centers', count: 4, color: 'bg-orange-500' },
    { name: 'Schools', count: 5, color: 'bg-violet-500' },
    { name: 'Police Stations', count: 3, color: 'bg-blue-500' },
    { name: 'Banks', count: 4, color: 'bg-emerald-500' },
    { name: 'Pharmacies', count: 4, color: 'bg-pink-500' },
    { name: 'Bus Stops', count: 5, color: 'bg-indigo-500' },
    { name: 'Government Offices', count: 4, color: 'bg-slate-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <style>{`
        @keyframes dashMove {
          to { stroke-dashoffset: -100; }
        }
      `}</style>

      {/* ── HERO ─────────────────────────────────── */}
      <section className="relative overflow-hidden pt-20">
        <div className="absolute inset-0 bg-gradient-to-br from-kigali-green/10 via-kigali-blue/5 to-transparent" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-kigali-green/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-kigali-blue/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
            <div>
              <div className="inline-flex items-center space-x-2 bg-kigali-green/10 text-kigali-green px-4 py-1.5 rounded-full text-sm font-medium mb-6">
                <MapPin className="w-4 h-4" />
                <span>Kigali City, Rwanda</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
                Smart Route Planning &<br />
                <span className="text-kigali-green">Spatial Analysis</span>
                <br />for Kigali
              </h1>
              <p className="mt-5 text-lg text-gray-600 dark:text-gray-300">
                Find the shortest, congestion-free paths to essential public services using
                GIS-based route optimization and real-time traffic analysis.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link to="/map">
                  <Button size="lg" className="w-full sm:w-auto">
                    <Map className="w-5 h-5 mr-2" />
                    Explore the Map
                  </Button>
                </Link>
                <Link to="/routes">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    <Route className="w-5 h-5 mr-2" />
                    Plan a Route
                  </Button>
                </Link>
              </div>

              {/* Quick stats */}
              <div className="mt-10 grid grid-cols-4 gap-3">
                {[
                  { label: 'Services', value: '52+' },
                  { label: 'Road km', value: '21' },
                  { label: 'sq km', value: '730' },
                  { label: 'Algorithms', value: '2' },
                ].map((s) => (
                  <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
                    <div className="text-xl font-bold text-kigali-green">{s.value}</div>
                    <div className="text-xs text-gray-500">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-12 lg:mt-0">
              <QuickRouteWidget />
            </div>
          </div>
        </div>
      </section>

      {/* ── TRAFFIC CONGESTION SECTION ────────────── */}
      <section className="py-20 bg-gray-900 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="grid grid-cols-12 gap-1 h-full">
            {Array.from({ length: 60 }).map((_, i) => (
              <div key={i} className="bg-white rounded" />
            ))}
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            {/* Left: animated slider */}
            <div className="order-2 lg:order-1">
              <TrafficSlider />

              {/* Traffic level indicators */}
              <div className="mt-4 grid grid-cols-3 gap-3">
                {[
                  { level: 'Heavy', color: 'bg-red-500', desc: 'Rush hours 7–9 AM & 5–7 PM', dot: 'animate-pulse' },
                  { level: 'Moderate', color: 'bg-yellow-500', desc: 'Mid-day 10 AM – 4 PM', dot: '' },
                  { level: 'Light', color: 'bg-green-500', desc: 'Late night & weekends', dot: '' },
                ].map((t) => (
                  <div key={t.level} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <div className={`w-2.5 h-2.5 rounded-full ${t.color} ${t.dot}`} />
                      <span className="text-white text-xs font-semibold">{t.level}</span>
                    </div>
                    <p className="text-gray-400 text-xs">{t.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: driver suggestion */}
            <div className="order-1 lg:order-2 mb-10 lg:mb-0">
              <div className="inline-flex items-center space-x-2 bg-red-500/20 text-red-400 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
                <AlertTriangle className="w-4 h-4" />
                <span>Traffic Intelligence</span>
              </div>

              <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                Beat Traffic Congestion
                <br />
                <span className="text-kigali-green">Every Drive</span>
              </h2>

              <p className="mt-5 text-lg text-gray-400">
                Our AI-powered routing engine analyzes real-time and simulated traffic
                patterns on Kigali roads, suggesting the fastest path with the least congestion.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  {
                    icon: TrendingDown,
                    color: 'text-green-400',
                    bg: 'bg-green-400/10',
                    title: 'Congestion-Free Routes',
                    desc: 'Algorithms weight congested roads higher, steering you to less-busy streets.',
                  },
                  {
                    icon: Clock,
                    color: 'text-yellow-400',
                    bg: 'bg-yellow-400/10',
                    title: 'Rush Hour Awareness',
                    desc: 'System detects morning (7–9 AM) and evening (5–7 PM) peak periods automatically.',
                  },
                  {
                    icon: Route,
                    color: 'text-blue-400',
                    bg: 'bg-blue-400/10',
                    title: 'Alternative Path Comparison',
                    desc: 'Compare Dijkstra and A* routes to pick the quickest, least-congested option.',
                  },
                  {
                    icon: LocateFixed,
                    color: 'text-kigali-green',
                    bg: 'bg-kigali-green/10',
                    title: 'One-Tap GPS Start',
                    desc: "Press 'Use My Location' and your GPS position is instantly set as the start.",
                  },
                ].map((item) => (
                  <div key={item.title} className="flex items-start space-x-4">
                    <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center flex-shrink-0`}>
                      <item.icon className={`w-5 h-5 ${item.color}`} />
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">{item.title}</h4>
                      <p className="text-gray-400 text-sm mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10">
                <Link to="/routes">
                  <Button
                    size="lg"
                    className="bg-kigali-green hover:bg-kigali-green/90 text-white"
                  >
                    <Navigation className="w-5 h-5 mr-2" />
                    Get Directions Now
                    <ChevronRight className="w-5 h-5 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────── */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Comprehensive GIS Features</h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
              Advanced spatial analysis tools for urban planning and service accessibility
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group bg-gray-50 dark:bg-gray-900 rounded-xl p-6 hover:bg-white dark:hover:bg-gray-800 transition-all shadow-sm hover:shadow-md border border-transparent hover:border-kigali-green/20"
              >
                <div className="w-12 h-12 bg-kigali-green/10 rounded-lg flex items-center justify-center text-kigali-green group-hover:bg-kigali-green group-hover:text-white transition-colors">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">{feature.title}</h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICE COVERAGE ─────────────────────── */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Service Coverage Across Kigali</h2>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
                Our system maps essential public services across Kigali's sectors,
                enabling residents and planners to analyze accessibility and identify gaps.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-3">
                {serviceCategories.map((cat) => (
                  <div key={cat.name} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${cat.color}`} />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{cat.name}</span>
                    </div>
                    <span className="text-sm text-gray-500">{cat.count}</span>
                  </div>
                ))}
              </div>
              <Link to="/accessibility" className="mt-8 inline-block">
                <Button variant="outline">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Accessibility Analysis
                </Button>
              </Link>
            </div>

            <div className="mt-12 lg:mt-0 relative">
              <div className="aspect-square bg-gradient-to-br from-kigali-green to-kigali-blue rounded-3xl opacity-10 absolute inset-0 transform rotate-6" />
              <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4">
                <div className="aspect-[4/3] bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                  <img
                    src="https://images.pexels.com/photos/2846230/pexels-photo-2846230.jpeg?auto=compress&cs=tinysrgb&w=800"
                    alt="Kigali City"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute bottom-8 left-8 right-8 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-4 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Kigali City</div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">Smart City GIS</div>
                    </div>
                    <div className="flex items-center space-x-2 text-kigali-green">
                      <MapPin className="w-5 h-5" />
                      <span className="font-medium">Active</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ALGORITHMS ───────────────────────────── */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Route Optimization Algorithms</h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
              Compare Dijkstra and A* for shortest path analysis
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-kigali-green to-emerald-600 rounded-2xl p-8 text-white">
              <div className="flex items-center space-x-3 mb-4">
                <Route className="w-8 h-8" />
                <h3 className="text-2xl font-bold">Dijkstra's Algorithm</h3>
              </div>
              <p className="text-white/90 mb-6">
                Classic shortest path algorithm. Guarantees the optimal solution by exploring all possible paths.
              </p>
              <ul className="space-y-2">
                {['Guaranteed optimal path', 'Predictable performance', 'Ideal for dense networks'].map((item) => (
                  <li key={item} className="flex items-center space-x-2 text-sm">
                    <Shield className="w-4 h-4 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gradient-to-br from-kigali-blue to-indigo-600 rounded-2xl p-8 text-white">
              <div className="flex items-center space-x-3 mb-4">
                <Route className="w-8 h-8" />
                <h3 className="text-2xl font-bold">A* Algorithm</h3>
              </div>
              <p className="text-white/90 mb-6">
                Informed search using heuristics to prioritize promising routes — often faster than Dijkstra.
              </p>
              <ul className="space-y-2">
                {['Heuristic-guided search', 'Often faster than Dijkstra', 'Best for spatial networks'].map((item) => (
                  <li key={item} className="flex items-center space-x-2 text-sm">
                    <TrendingUp className="w-4 h-4 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-10 text-center">
            <Link to="/routes">
              <Button size="lg">Compare Algorithms Now</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-br from-kigali-green to-kigali-blue">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white">Start Planning Your Routes Today</h2>
          <p className="mt-4 text-lg text-white/90 max-w-2xl mx-auto">
            Access Kigali's comprehensive GIS platform for smart route planning and public service accessibility.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/register">
              <Button variant="outline" size="lg" className="bg-white text-kigali-green hover:bg-gray-100 border-white">
                Create Free Account
              </Button>
            </Link>
            <Link to="/about">
              <Button variant="outline" size="lg" className="text-white border-white hover:bg-white/10">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────── */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-kigali-green flex items-center justify-center">
                  <Map className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Kigali GIS</h3>
                  <p className="text-sm">Smart Route Planning System</p>
                </div>
              </div>
              <p className="text-sm max-w-md">
                A GIS-based spatial decision support system for Kigali City enabling route optimization,
                shortest path analysis, and public service accessibility evaluation.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/map" className="hover:text-white transition-colors">Interactive Map</Link></li>
                <li><Link to="/routes" className="hover:text-white transition-colors">Route Planning</Link></li>
                <li><Link to="/accessibility" className="hover:text-white transition-colors">Accessibility</Link></li>
                <li><Link to="/admin" className="hover:text-white transition-colors">Admin Panel</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/about" className="hover:text-white transition-colors">About Research</Link></li>
                <li><span className="cursor-pointer hover:text-white transition-colors">Documentation</span></li>
                <li><span className="cursor-pointer hover:text-white transition-colors">API Reference</span></li>
                <li><span className="cursor-pointer hover:text-white transition-colors">Datasets</span></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-sm">
            <p>2024 Kigali GIS — Smart Route Planning. Research Project.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
