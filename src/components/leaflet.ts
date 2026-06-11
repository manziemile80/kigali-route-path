import type { Icon } from 'leaflet';
import L from 'leaflet';

export const createCategoryIcon = (category: string): Icon => {
  const colors: Record<string, string> = {
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

  const color = colors[category] || '#6b7280';

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          transform: rotate(45deg);
          width: 16px;
          height: 16px;
          background: white;
          border-radius: 50%;
        "></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [8, 32],
    popupAnchor: [12, -28],
  });
};

export const createStartIcon = (): Icon => {
  return L.divIcon({
    className: 'start-marker',
    html: `
      <div style="
        background: #22c55e;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

export const createEndIcon = (): Icon => {
  return L.divIcon({
    className: 'end-marker',
    html: `
      <div style="
        background: #ef4444;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

export const createUserLocationIcon = (): Icon => {
  return L.divIcon({
    className: 'user-location-marker',
    html: `
      <div style="
        position: relative;
      ">
        <div style="
          background: #3b82f6;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.3);
          animation: pulse 2s infinite;
        "></div>
      </div>
    `,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
};

export const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
