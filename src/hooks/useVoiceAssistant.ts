import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRouteStore } from '../stores/routeStore';
import { useMapStore } from '../stores/mapStore';
import { fetchServiceLocations } from '../utils/api';
import { formatDistance, formatTime } from '../utils/routingAlgorithms';
import type { ServiceCategory, ServiceLocation } from '../types';

export type VoiceStatus = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

export interface VoiceMessage {
  id: string;
  type: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

const CATEGORY_KEYWORDS: Record<string, ServiceCategory> = {
  hospital: 'hospital',
  hospitals: 'hospital',
  'health center': 'health_center',
  'health centers': 'health_center',
  clinic: 'health_center',
  school: 'school',
  schools: 'school',
  university: 'school',
  college: 'school',
  police: 'police_station',
  'police station': 'police_station',
  fire: 'fire_station',
  'fire station': 'fire_station',
  bank: 'bank',
  banks: 'bank',
  pharmacy: 'pharmacy',
  pharmacies: 'pharmacy',
  chemist: 'pharmacy',
  'bus stop': 'bus_stop',
  bus: 'bus_stop',
  'bus terminal': 'bus_stop',
  government: 'government_office',
  'government office': 'government_office',
  ministry: 'government_office',
  water: 'water_point',
  'water point': 'water_point',
  utility: 'public_utility',
  utilities: 'public_utility',
};

const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  hospital: 'hospital',
  health_center: 'health center',
  school: 'school',
  police_station: 'police station',
  fire_station: 'fire station',
  bank: 'bank',
  pharmacy: 'pharmacy',
  bus_stop: 'bus stop',
  government_office: 'government office',
  water_point: 'water point',
  public_utility: 'public utility',
};

const HELP_TEXT = `Available commands:
"navigate to hospital" — find nearest service by type.
"use my location" — set GPS as start point.
"calculate route" — compute the current route.
"clear route" — clear route.
"show hospitals" — filter map to a service type.
"zoom in" or "zoom out" — adjust map zoom.
"go to map" or "go to routes" — switch pages.
"what is the distance" — hear route distance.
"what is the travel time" — hear estimated time.
"help" — list all commands.`;

function speak(text: string, onEnd?: () => void) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.volume = 1;

  // Prefer a clear English voice
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find((v) =>
    v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Neural'))
  ) || voices.find((v) => v.lang.startsWith('en'));
  if (preferred) utterance.voice = preferred;

  if (onEnd) utterance.onend = onEnd;
  window.speechSynthesis.speak(utterance);
}

export function useVoiceAssistant() {
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [services, setServices] = useState<ServiceLocation[]>([]);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const listeningRef = useRef(false);

  const navigate = useNavigate();
  const { setStart, setEnd, calculateRoute, clearRoute, currentRoute, start, end } = useRouteStore();
  const { zoom, setZoom, zoomToLocation, selectedCategories, setCategories } = useMapStore();

  // Pre-load services for command matching
  useEffect(() => {
    fetchServiceLocations().then(setServices).catch(() => {});
  }, []);

  const addMessage = useCallback((type: 'user' | 'assistant', text: string) => {
    setMessages((prev) => [
      ...prev.slice(-19), // keep last 20
      { id: `${Date.now()}-${Math.random()}`, type, text, timestamp: new Date() },
    ]);
  }, []);

  const respond = useCallback(
    (text: string, onEnd?: () => void) => {
      addMessage('assistant', text);
      setStatus('speaking');
      speak(text, () => {
        setStatus('idle');
        onEnd?.();
      });
    },
    [addMessage]
  );

  const findNearestService = useCallback(
    (category: ServiceCategory): ServiceLocation | null => {
      const filtered = services.filter((s) => s.category === category);
      if (filtered.length === 0) return null;

      if (start) {
        let nearest: ServiceLocation | null = null;
        let minDist = Infinity;
        filtered.forEach((s) => {
          const d = Math.hypot(s.coordinates.lat - start.lat, s.coordinates.lng - start.lng);
          if (d < minDist) { minDist = d; nearest = s; }
        });
        return nearest;
      }
      return filtered[0];
    },
    [services, start]
  );

  const handleCommand = useCallback(
    async (transcript: string) => {
      const t = transcript.toLowerCase().trim();
      addMessage('user', transcript);
      setStatus('processing');

      // ── HELP ────────────────────────────────────────────────
      if (t === 'help' || t.includes('what can you do') || t.includes('list commands')) {
        respond(HELP_TEXT);
        return;
      }

      // ── GPS LOCATION ────────────────────────────────────────
      if (t.includes('my location') || t.includes('use location') || t.includes('current location') || t.includes('where i am')) {
        if (!navigator.geolocation) {
          respond('Geolocation is not available on this device.');
          return;
        }
        respond('Getting your location.');
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setStart(coords);
            zoomToLocation(coords, 15);
            respond('Your location has been set as the start point.');
          },
          () => respond('I could not access your location. Please enable location permissions.')
        );
        return;
      }

      // ── NAVIGATE / FIND NEAREST SERVICE ─────────────────────
      const navMatch = t.match(/(?:navigate to|go to|find nearest|take me to|directions to|nearest)\s+(.+)/);
      if (navMatch) {
        const query = navMatch[1].trim();

        // Check if it matches a category keyword
        let matchedCategory: ServiceCategory | null = null;
        for (const [keyword, category] of Object.entries(CATEGORY_KEYWORDS)) {
          if (query.includes(keyword)) {
            matchedCategory = category;
            break;
          }
        }

        if (matchedCategory) {
          const nearest = findNearestService(matchedCategory);
          if (nearest) {
            setEnd(nearest.coordinates);
            zoomToLocation(nearest.coordinates, 15);
            respond(`Setting destination to ${nearest.name}. ${nearest.address ? 'Located at ' + nearest.address + '.' : ''} Press Calculate Route to get directions.`);
            navigate('/routes');
          } else {
            respond(`Sorry, I could not find any ${CATEGORY_LABELS[matchedCategory]} nearby.`);
          }
          return;
        }

        // Fuzzy match by service name
        const nameMatch = services.find((s) =>
          s.name.toLowerCase().includes(query) || query.includes(s.name.toLowerCase().split(' ')[0])
        );
        if (nameMatch) {
          setEnd(nameMatch.coordinates);
          zoomToLocation(nameMatch.coordinates, 15);
          respond(`Setting destination to ${nameMatch.name}.`);
          navigate('/routes');
          return;
        }

        respond(`I could not find "${query}". Try saying "navigate to hospital" or "navigate to pharmacy".`);
        return;
      }

      // ── CALCULATE ROUTE ─────────────────────────────────────
      if (t.includes('calculate route') || t.includes('start navigation') || t.includes('get directions') || t.includes('find route')) {
        if (!start) {
          respond('Please set a start point first. Say "use my location" or tap the map.');
          return;
        }
        if (!end) {
          respond('Please set a destination first. Say "navigate to hospital" for example.');
          return;
        }
        respond('Calculating the shortest route now.');
        navigate('/routes');
        setTimeout(() => calculateRoute(), 500);
        return;
      }

      // ── ROUTE INFO ───────────────────────────────────────────
      if (t.includes('distance') || t.includes('how far')) {
        if (currentRoute) {
          respond(`The route distance is ${formatDistance(currentRoute.distance_m)}.`);
        } else {
          respond('No route calculated yet. Say "calculate route" first.');
        }
        return;
      }

      if (t.includes('travel time') || t.includes('how long') || t.includes('duration') || t.includes('estimated time')) {
        if (currentRoute) {
          respond(`The estimated travel time is ${formatTime(currentRoute.time_min)}.`);
        } else {
          respond('No route calculated yet. Say "calculate route" first.');
        }
        return;
      }

      if (t.includes('which algorithm') || t.includes('what algorithm')) {
        if (currentRoute) {
          respond(`The route was calculated using the ${currentRoute.algorithm === 'astar' ? 'A star' : "Dijkstra"} algorithm in ${currentRoute.execution_time_ms.toFixed(1)} milliseconds.`);
        } else {
          respond('No route calculated yet.');
        }
        return;
      }

      // ── CLEAR ROUTE ──────────────────────────────────────────
      if (t.includes('clear route') || t.includes('reset route') || t.includes('cancel route') || t.includes('start over')) {
        clearRoute();
        respond('Route cleared. Ready for a new trip.');
        return;
      }

      // ── SHOW / FILTER CATEGORY ───────────────────────────────
      const showMatch = t.match(/(?:show|display|filter|find all)\s+(.+)/);
      if (showMatch) {
        const query = showMatch[1].trim();
        let matchedCategory: ServiceCategory | null = null;
        for (const [keyword, category] of Object.entries(CATEGORY_KEYWORDS)) {
          if (query.includes(keyword)) {
            matchedCategory = category;
            break;
          }
        }
        if (matchedCategory) {
          setCategories([matchedCategory]);
          navigate('/map');
          respond(`Showing all ${CATEGORY_LABELS[matchedCategory]}s on the map.`);
          return;
        }
        if (query.includes('all') || query.includes('everything')) {
          setCategories([]);
          respond('Showing all services on the map.');
          return;
        }
      }

      // ── ZOOM ─────────────────────────────────────────────────
      if (t.includes('zoom in') || t.includes('zoom in more') || t.includes('get closer')) {
        setZoom(Math.min(zoom + 2, 19));
        respond('Zoomed in.');
        return;
      }
      if (t.includes('zoom out') || t.includes('zoom out more') || t.includes('get further')) {
        setZoom(Math.max(zoom - 2, 3));
        respond('Zoomed out.');
        return;
      }

      // ── PAGE NAVIGATION ──────────────────────────────────────
      if (t.includes('open map') || t.includes('go to map') || t.includes('show map') || t.includes('interactive map')) {
        navigate('/map');
        respond('Opening the interactive map.');
        return;
      }
      if (t.includes('plan route') || t.includes('route planning') || t.includes('go to routes') || t.includes('open routes')) {
        navigate('/routes');
        respond('Opening route planning.');
        return;
      }
      if (t.includes('accessibility') || t.includes('dashboard')) {
        navigate('/accessibility');
        respond('Opening the accessibility dashboard.');
        return;
      }
      if (t.includes('home') || t.includes('go home') || t.includes('landing')) {
        navigate('/');
        respond('Going to the home page.');
        return;
      }

      // ── EMERGENCY ────────────────────────────────────────────
      if (t.includes('emergency') || t.includes('help me') || t.includes('urgent')) {
        const nearest = findNearestService('hospital');
        if (nearest) {
          setEnd(nearest.coordinates);
          respond(`Emergency! Nearest hospital is ${nearest.name}. Setting as destination. Say "calculate route" to get directions immediately.`);
          navigate('/routes');
        } else {
          respond('Emergency services detected. Please call 112 for immediate assistance.');
        }
        return;
      }

      // ── GREETINGS ────────────────────────────────────────────
      if (t.match(/^(hello|hi|hey|good morning|good afternoon|good evening|howdy)/)) {
        respond('Hello! I am your Kigali GIS voice assistant. How can I help you today? Say "help" to hear available commands.');
        return;
      }

      // ── FALLBACK ─────────────────────────────────────────────
      respond(`I did not understand "${transcript}". Say "help" to hear available commands.`);
    },
    [addMessage, respond, findNearestService, setStart, setEnd, calculateRoute, clearRoute, currentRoute, start, end, zoom, setZoom, zoomToLocation, setCategories, navigate, services]
  );

  const startListening = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in your browser. Try Chrome or Edge.');
      setStatus('error');
      return;
    }

    if (listeningRef.current) return;

    setError(null);
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      listeningRef.current = true;
      setStatus('listening');
    };

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = e.results[0][0].transcript;
      recognition.stop();
      handleCommand(transcript);
    };

    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      listeningRef.current = false;
      if (e.error === 'not-allowed') {
        setError('Microphone access denied. Please allow microphone permissions.');
        setStatus('error');
      } else if (e.error === 'no-speech') {
        setStatus('idle');
      } else {
        setStatus('idle');
      }
    };

    recognition.onend = () => {
      listeningRef.current = false;
      if (status === 'listening') setStatus('idle');
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      setStatus('idle');
    }
  }, [handleCommand, status]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    window.speechSynthesis?.cancel();
    listeningRef.current = false;
    setStatus('idle');
  }, []);

  const toggle = useCallback(() => {
    if (status === 'listening') {
      stopListening();
    } else if (status === 'idle') {
      startListening();
    }
  }, [status, startListening, stopListening]);

  const open = useCallback(() => {
    setIsOpen(true);
    if (messages.length === 0) {
      setTimeout(() => {
        respond('Welcome to Kigali GIS voice assistant. Say "help" to hear what I can do for you.');
      }, 300);
    }
  }, [messages.length, respond]);

  const close = useCallback(() => {
    stopListening();
    setIsOpen(false);
  }, [stopListening]);

  const clearMessages = useCallback(() => setMessages([]), []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      window.speechSynthesis?.cancel();
    };
  }, []);

  return {
    status,
    messages,
    isOpen,
    error,
    open,
    close,
    toggle,
    startListening,
    stopListening,
    clearMessages,
  };
}
