'use client';

import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface HeatmapPoint {
  lat: number;
  lng: number;
  name: string;
  avgRisk: number;
  intensity: number;
  count: number;
}

const getColor = (risk: number) => {
  if (risk >= 80) return '#ef4444';
  if (risk >= 60) return '#f59e0b';
  if (risk >= 40) return '#eab308';
  if (risk >= 20) return '#06b6d4';
  return '#10b981';
};

export default function MapInner({ data }: { data: HeatmapPoint[] }) {
  return (
    <MapContainer
      center={[20, 40]}
      zoom={2}
      style={{ height: '100%', width: '100%', borderRadius: '0 0 12px 12px', background: '#0a0e1a' }}
      scrollWheelZoom={true}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      {data.map((point, i) => (
        <CircleMarker
          key={i}
          center={[point.lat, point.lng]}
          radius={Math.max(10, point.avgRisk / 3)}
          pathOptions={{
            fillColor: getColor(point.avgRisk),
            color: '#ffffff',
            fillOpacity: 0.85,
            weight: 2,
            opacity: 1,
          }}
        >
          <Tooltip>
            <div style={{ fontFamily: 'Inter', fontSize: 12 }}>
              <strong>{point.name}</strong><br />
              Risk: <span style={{ color: getColor(point.avgRisk), fontWeight: 700 }}>{point.avgRisk}</span><br />
              Shipments: {point.count}
            </div>
          </Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
