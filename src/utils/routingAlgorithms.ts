import type { Coordinates, RoadSegment, RouteResult, TravelMode, AlgorithmType } from '../types';
import * as turf from '@turf/turf';

interface GraphNode {
  id: number;
  coordinates: Coordinates;
  neighbors: { nodeId: number; weight: number; segment: RoadSegment }[];
}

interface RouteGraph {
  nodes: Map<number, GraphNode>;
  segments: RoadSegment[];
}

export function buildGraph(segments: RoadSegment[]): RouteGraph {
  const nodes = new Map<number, GraphNode>();

  segments.forEach((segment) => {
    const sourceId = segment.source_node;
    const targetId = segment.target_node;

    if (!nodes.has(sourceId)) {
      nodes.set(sourceId, {
        id: sourceId,
        coordinates: segment.coordinates[0],
        neighbors: [],
      });
    }

    if (!nodes.has(targetId)) {
      nodes.set(targetId, {
        id: targetId,
        coordinates: segment.coordinates[segment.coordinates.length - 1],
        neighbors: [],
      });
    }

    const weight = calculateSegmentWeight(segment);

    nodes.get(sourceId)!.neighbors.push({
      nodeId: targetId,
      weight,
      segment,
    });

    if (!segment.one_way) {
      nodes.get(targetId)!.neighbors.push({
        nodeId: sourceId,
        weight,
        segment,
      });
    }
  });

  return { nodes, segments };
}

export function calculateSegmentWeight(segment: RoadSegment): number {
  const lengthKm = segment.length_m / 1000;
  const effectiveSpeed = segment.speed_kmh / segment.traffic_factor;
  return (lengthKm / effectiveSpeed) * 60;
}

export function heuristic(a: Coordinates, b: Coordinates): number {
  const from = turf.point([a.lng, a.lat]);
  const to = turf.point([b.lng, b.lat]);
  const distance = turf.distance(from, to, { units: 'kilometers' });
  return distance * 60 / 30;
}

export function findNearestNode(coords: Coordinates, graph: RouteGraph): number {
  let nearestId = 0;
  let minDist = Infinity;

  graph.nodes.forEach((node, id) => {
    const dist = Math.sqrt(
      Math.pow(coords.lat - node.coordinates.lat, 2) +
      Math.pow(coords.lng - node.coordinates.lng, 2)
    );
    if (dist < minDist) {
      minDist = dist;
      nearestId = id;
    }
  });

  return nearestId;
}

export async function dijkstra(
  start: Coordinates,
  end: Coordinates,
  travelMode: TravelMode,
  roadNetwork?: unknown
): Promise<RouteResult> {
  const startTime = performance.now();

  const segments = roadNetwork as RoadSegment[];
  if (!segments || segments.length === 0) {
    return simulateRoute(start, end, 'dijkstra', travelMode);
  }

  const graph = buildGraph(segments);
  const startNode = findNearestNode(start, graph);
  const endNode = findNearestNode(end, graph);

  const distances = new Map<number, number>();
  const previous = new Map<number, { nodeId: number; segment: RoadSegment }>();
  const visited = new Set<number>();
  const priorityQueue: { nodeId: number; distance: number }[] = [];

  graph.nodes.forEach((_, id) => distances.set(id, Infinity));
  distances.set(startNode, 0);
  priorityQueue.push({ nodeId: startNode, distance: 0 });

  while (priorityQueue.length > 0) {
    priorityQueue.sort((a, b) => a.distance - b.distance);
    const { nodeId: current } = priorityQueue.shift()!;

    if (current === endNode) break;
    if (visited.has(current)) continue;
    visited.add(current);

    const node = graph.nodes.get(current);
    if (!node) continue;

    for (const neighbor of node.neighbors) {
      if (visited.has(neighbor.nodeId)) continue;

      const speedModifier = travelMode === 'walking' ? 0.3 :
                           travelMode === 'public_transport' ? 0.7 : 1;
      const alt = distances.get(current)! + neighbor.weight / speedModifier;

      if (alt < distances.get(neighbor.nodeId)!) {
        distances.set(neighbor.nodeId, alt);
        previous.set(neighbor.nodeId, { nodeId: current, segment: neighbor.segment });
        priorityQueue.push({ nodeId: neighbor.nodeId, distance: alt });
      }
    }
  }

  const path: Coordinates[] = [];
  let current = endNode;
  const usedSegments: RoadSegment[] = [];

  while (previous.has(current)) {
    const prev = previous.get(current)!;
    const segment = prev.segment;
    usedSegments.push(segment);

    const segmentCoords = segment.coordinates;
    const isForward = segment.source_node === prev.nodeId;
    const orderedCoords = isForward ? segmentCoords : [...segmentCoords].reverse();

    path.unshift(...orderedCoords.slice(0, -1));
    current = prev.nodeId;
  }

  path.unshift(start);
  path.push(end);

  let totalDistance = 0;
  usedSegments.forEach(s => totalDistance += s.length_m);

  const avgSpeed = travelMode === 'walking' ? 5 :
                   travelMode === 'public_transport' ? 25 : 40;

  const endTime = performance.now();

  return {
    path,
    distance_m: totalDistance || calculateDirectDistance(start, end),
    time_min: distances.get(endNode)! || (totalDistance / 1000) / avgSpeed * 60,
    segments: usedSegments.length,
    algorithm: 'dijkstra',
    execution_time_ms: endTime - startTime,
  };
}

export async function astar(
  start: Coordinates,
  end: Coordinates,
  travelMode: TravelMode,
  roadNetwork?: unknown
): Promise<RouteResult> {
  const startTime = performance.now();

  const segments = roadNetwork as RoadSegment[];
  if (!segments || segments.length === 0) {
    return simulateRoute(start, end, 'astar', travelMode);
  }

  const graph = buildGraph(segments);
  const startNode = findNearestNode(start, graph);
  const endNode = findNearestNode(end, graph);

  const gScore = new Map<number, number>();
  const fScore = new Map<number, number>();
  const previous = new Map<number, { nodeId: number; segment: RoadSegment }>();
  const openSet = new Set<number>([startNode]);
  const closedSet = new Set<number>();

  graph.nodes.forEach((_, id) => {
    gScore.set(id, Infinity);
    fScore.set(id, Infinity);
  });

  gScore.set(startNode, 0);
  const endCoords = graph.nodes.get(endNode)?.coordinates || end;
  fScore.set(startNode, heuristic(start, endCoords));

  while (openSet.size > 0) {
    let current = -1;
    let minF = Infinity;

    openSet.forEach((nodeId) => {
      if (fScore.get(nodeId)! < minF) {
        minF = fScore.get(nodeId)!;
        current = nodeId;
      }
    });

    if (current === endNode) break;
    if (current === -1) break;

    openSet.delete(current);
    closedSet.add(current);

    const node = graph.nodes.get(current);
    if (!node) continue;

    for (const neighbor of node.neighbors) {
      if (closedSet.has(neighbor.nodeId)) continue;

      const speedModifier = travelMode === 'walking' ? 0.3 :
                           travelMode === 'public_transport' ? 0.7 : 1;
      const tentativeG = gScore.get(current)! + neighbor.weight / speedModifier;

      if (!openSet.has(neighbor.nodeId)) {
        openSet.add(neighbor.nodeId);
      } else if (tentativeG >= gScore.get(neighbor.nodeId)!) {
        continue;
      }

      previous.set(neighbor.nodeId, { nodeId: current, segment: neighbor.segment });
      gScore.set(neighbor.nodeId, tentativeG);

      const neighborCoords = graph.nodes.get(neighbor.nodeId)?.coordinates;
      const h = neighborCoords ? heuristic(neighborCoords, endCoords) : 0;
      fScore.set(neighbor.nodeId, tentativeG + h);
    }
  }

  const path: Coordinates[] = [];
  let current = endNode;
  const usedSegments: RoadSegment[] = [];

  while (previous.has(current)) {
    const prev = previous.get(current)!;
    const segment = prev.segment;
    usedSegments.push(segment);

    const segmentCoords = segment.coordinates;
    const isForward = segment.source_node === prev.nodeId;
    const orderedCoords = isForward ? segmentCoords : [...segmentCoords].reverse();

    path.unshift(...orderedCoords.slice(0, -1));
    current = prev.nodeId;
  }

  path.unshift(start);
  path.push(end);

  let totalDistance = 0;
  usedSegments.forEach(s => totalDistance += s.length_m);

  const endTime = performance.now();

  return {
    path,
    distance_m: totalDistance || calculateDirectDistance(start, end),
    time_min: gScore.get(endNode)! || (totalDistance / 1000) / 40 * 60,
    segments: usedSegments.length,
    algorithm: 'astar',
    execution_time_ms: endTime - startTime,
  };
}

function simulateRoute(
  start: Coordinates,
  end: Coordinates,
  algorithm: AlgorithmType,
  travelMode: TravelMode
): RouteResult {
  const startTime = performance.now();

  const distance = calculateDirectDistance(start, end);
  const windingFactor = 1.3;
  const actualDistance = distance * windingFactor;

  const speedKmh = travelMode === 'walking' ? 5 :
                   travelMode === 'public_transport' ? 25 : 40;
  const timeMin = (actualDistance / 1000) / speedKmh * 60;

  const midPoint1 = {
    lat: start.lat + (end.lat - start.lat) * 0.3 + (Math.random() - 0.5) * 0.01,
    lng: start.lng + (end.lng - start.lng) * 0.3 + (Math.random() - 0.5) * 0.01,
  };
  const midPoint2 = {
    lat: start.lat + (end.lat - start.lat) * 0.7 + (Math.random() - 0.5) * 0.01,
    lng: start.lng + (end.lng - start.lng) * 0.7 + (Math.random() - 0.5) * 0.01,
  };

  const path = [start, midPoint1, midPoint2, end];
  const segments = Math.ceil(actualDistance / 200);

  const endTime = performance.now();

  return {
    path,
    distance_m: actualDistance,
    time_min: timeMin,
    segments,
    algorithm,
    execution_time_ms: endTime - startTime,
  };
}

export function calculateDirectDistance(a: Coordinates, b: Coordinates): number {
  const from = turf.point([a.lng, a.lat]);
  const to = turf.point([b.lng, b.lat]);
  return turf.distance(from, to, { units: 'meters' });
}

const ROUTE_COLORS = ['#22c55e', '#3b82f6', '#f59e0b'];
const ROUTE_LABELS = ['Recommended', 'Alternative 1', 'Alternative 2'];

export async function fetchOSRMRoutes(
  start: Coordinates,
  end: Coordinates,
  travelMode: TravelMode
): Promise<RouteResult[]> {
  const profile = travelMode === 'walking' ? 'foot' : 'driving';
  const url =
    `https://router.project-osrm.org/route/v1/${profile}/` +
    `${start.lng},${start.lat};${end.lng},${end.lat}` +
    `?alternatives=3&geometries=geojson&overview=full`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 9000);

  let data: { code: string; routes?: Array<{ geometry: { coordinates: number[][] }; distance: number; duration: number; legs: Array<{ steps: unknown[] }> }> };
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`OSRM ${res.status}`);
    data = await res.json();
  } catch {
    clearTimeout(timer);
    throw new Error('OSRM unavailable');
  }

  if (data.code !== 'Ok' || !data.routes?.length) throw new Error('No OSRM routes');

  const directDist = calculateDirectDistance(start, end);

  return data.routes.slice(0, 3).map((route, i) => {
    const path: Coordinates[] = route.geometry.coordinates.map(
      ([lng, lat]: number[]) => ({ lat, lng })
    );
    const ratio = route.distance / Math.max(directDist, 1);
    const trafficScore = Math.min(100, Math.max(0, Math.round((ratio - 1) * 60)));

    return {
      path,
      distance_m: route.distance,
      time_min: route.duration / 60,
      segments: route.legs?.[0]?.steps?.length ?? path.length,
      algorithm: 'dijkstra' as AlgorithmType,
      execution_time_ms: 0,
      trafficScore,
      color: ROUTE_COLORS[i] ?? '#6b7280',
      label: ROUTE_LABELS[i] ?? `Route ${i + 1}`,
      isRecommended: i === 0,
    };
  });
}

function simulateRouteVariant(
  s: Coordinates, e: Coordinates, mode: TravelMode, spread: number, distFactor: number
): RouteResult {
  const distance = calculateDirectDistance(s, e) * distFactor * 1.3;
  const speedKmh = mode === 'walking' ? 5 : mode === 'public_transport' ? 25 : 40;
  const mid1 = {
    lat: s.lat + (e.lat - s.lat) * 0.3 + (Math.random() - 0.5) * spread,
    lng: s.lng + (e.lng - s.lng) * 0.3 + (Math.random() - 0.5) * spread,
  };
  const mid2 = {
    lat: s.lat + (e.lat - s.lat) * 0.7 + (Math.random() - 0.5) * spread,
    lng: s.lng + (e.lng - s.lng) * 0.7 + (Math.random() - 0.5) * spread,
  };
  return {
    path: [s, mid1, mid2, e],
    distance_m: distance,
    time_min: (distance / 1000) / speedKmh * 60,
    segments: 4,
    algorithm: 'astar',
    execution_time_ms: 0,
  };
}

export async function fetchRoutesWithFallback(
  start: Coordinates,
  end: Coordinates,
  travelMode: TravelMode,
  _roadNetwork?: unknown
): Promise<RouteResult[]> {
  try {
    return await fetchOSRMRoutes(start, end, travelMode);
  } catch {
    const base = simulateRoute(start, end, 'dijkstra', travelMode);
    const alt1 = simulateRouteVariant(start, end, travelMode, 0.08, 1.12);
    const alt2 = simulateRouteVariant(start, end, travelMode, 0.14, 1.25);
    return [
      { ...base, color: ROUTE_COLORS[0], label: ROUTE_LABELS[0], isRecommended: true, trafficScore: 10 },
      { ...alt1, color: ROUTE_COLORS[1], label: ROUTE_LABELS[1], isRecommended: false, trafficScore: 35 },
      { ...alt2, color: ROUTE_COLORS[2], label: ROUTE_LABELS[2], isRecommended: false, trafficScore: 60 },
    ];
  }
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
}

export function formatTime(minutes: number): string {
  if (minutes < 1) {
    return `${Math.round(minutes * 60)} sec`;
  }
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours}h ${mins}m`;
}
