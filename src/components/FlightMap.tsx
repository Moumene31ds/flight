'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CITIES, City, Route, useGameStore } from '@/lib/store/useGameStore';
import { Plane, Navigation, Plus, CloudLightning } from 'lucide-react';

// Map Dimensions
const MAP_WIDTH = 800;
const MAP_HEIGHT = 400;

// Equirectangular projection conversion
function getCoordinates(lat: number, lng: number) {
  const x = ((lng + 180) * MAP_WIDTH) / 360;
  const y = ((90 - lat) * MAP_HEIGHT) / 180;
  return { x, y };
}

interface FlightMapProps {
  onSelectAirports?: (origin: City, destination: City) => void;
}

export default function FlightMap({ onSelectAirports }: FlightMapProps) {
  const { routes, fleet, activeStorms } = useGameStore();
  const [selectedOrigin, setSelectedOrigin] = useState<City | null>(null);
  const [hoveredCity, setHoveredCity] = useState<City | null>(null);
  
  // Animation progress tick for active planes
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => (t + 0.005) % 1);
    }, 50);
    return () => clearInterval(timer);
  }, []);

  const handleCityClick = (city: City) => {
    if (!selectedOrigin) {
      setSelectedOrigin(city);
    } else if (selectedOrigin.id === city.id) {
      setSelectedOrigin(null);
    } else {
      if (onSelectAirports) {
        onSelectAirports(selectedOrigin, city);
      }
      setSelectedOrigin(null);
    }
  };

  // Helper to calculate Bezier control point for curved flight arcs
  const getBezierPath = (x0: number, y0: number, x2: number, y2: number) => {
    const midX = (x0 + x2) / 2;
    const midY = (y0 + y2) / 2;
    const dx = x2 - x0;
    const dy = y2 - y0;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const curveHeight = Math.min(100, dist * 0.25);
    const x1 = midX;
    const y1 = midY - curveHeight;

    return {
      path: `M ${x0} ${y0} Q ${x1} ${y1} ${x2} ${y2}`,
      x1,
      y1
    };
  };

  // Quadratic Bezier interpolation formula
  const getBezierPoint = (x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, t: number) => {
    const x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * x1 + t * t * x2;
    const y = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * y1 + t * t * y2;
    const tx = 2 * (1 - t) * (x1 - x0) + 2 * t * (x2 - x1);
    const ty = 2 * (1 - t) * (y1 - y0) + 2 * t * (y2 - y1);
    const angle = (Math.atan2(ty, tx) * 180) / Math.PI;

    return { x, y, angle };
  };

  return (
    <div className="w-full glass-panel rounded-2xl p-6 relative overflow-hidden flex flex-col items-center">
      {/* Header operations bar */}
      <div className="w-full flex items-center justify-between mb-4 border-b border-white/5 pb-3 z-10">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-brand-cyan rounded-full animate-ping" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Live Global Radar Grid</span>
        </div>
        {selectedOrigin && (
          <div className="flex items-center gap-2 bg-brand-cyan/15 border border-brand-cyan/30 rounded-lg px-2.5 py-1">
            <span className="text-[11px] font-semibold text-brand-cyan">
              Origin Locked: {selectedOrigin.name} ({selectedOrigin.code})
            </span>
            <button 
              onClick={() => setSelectedOrigin(null)}
              className="text-xs font-bold text-white hover:text-brand-rose transition-colors ps-1.5 border-s border-white/10"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* SVG Map Canvas */}
      <div className="w-full relative aspect-[2/1] bg-slate-950/45 rounded-xl border border-white/5 overflow-hidden">
        <svg 
          viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
          className="w-full h-full select-none"
        >
          {/* Subtle grid lines */}
          {Array.from({ length: 9 }).map((_, i) => {
            const y = (MAP_HEIGHT / 10) * (i + 1);
            return (
              <line
                key={`lat-${i}`}
                x1={0}
                y1={y}
                x2={MAP_WIDTH}
                y2={y}
                stroke="rgba(6, 182, 212, 0.04)"
                strokeWidth={1}
                strokeDasharray="4 8"
              />
            );
          })}
          {Array.from({ length: 19 }).map((_, i) => {
            const x = (MAP_WIDTH / 20) * (i + 1);
            return (
              <line
                key={`lng-${i}`}
                x1={x}
                y1={0}
                x2={x}
                y2={MAP_HEIGHT}
                stroke="rgba(6, 182, 212, 0.04)"
                strokeWidth={1}
                strokeDasharray="4 8"
              />
            );
          })}

          {/* Static continent grid background dots */}
          <rect x={120} y={60} width={140} height={100} rx={40} fill="rgba(255,255,255,0.015)" />
          <rect x={380} y={40} width={380} height={120} rx={45} fill="rgba(255,255,255,0.015)" />
          <rect x={220} y={210} width={80} height={140} rx={30} fill="rgba(255,255,255,0.015)" />
          <rect x={400} y={170} width={120} height={130} rx={35} fill="rgba(255,255,255,0.015)" />
          <rect x={660} y={240} width={110} height={80} rx={30} fill="rgba(255,255,255,0.015)" />

          {/* Dynamic Weather Storm Circles */}
          {activeStorms.map((storm) => {
            const { x, y } = getCoordinates(storm.lat, storm.lng);
            // Convert storm radius (km) to pixel map size
            const pixelRadius = Math.max(20, storm.radius * (MAP_WIDTH / 40000));
            return (
              <g key={storm.id}>
                {/* Glowing red pulse hazard boundary */}
                <circle
                  cx={x}
                  cy={y}
                  r={pixelRadius}
                  fill="rgba(244, 63, 94, 0.04)"
                  stroke="rgba(244, 63, 94, 0.2)"
                  strokeWidth={1.5}
                  strokeDasharray="3 5"
                  className="animate-pulse"
                />
                <circle
                  cx={x}
                  cy={y}
                  r={4}
                  fill="#f43f5e"
                />
                {/* Danger labels */}
                <text
                  x={x}
                  y={y + 14}
                  fill="rgba(244, 63, 94, 0.85)"
                  fontSize={8}
                  fontWeight="bold"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  ⚡ {storm.name.split(' ')[0]}
                </text>
              </g>
            );
          })}

          {/* Active Flight Routes Arcs */}
          {routes.map((route) => {
            const p0 = getCoordinates(route.origin.lat, route.origin.lng);
            const p2 = getCoordinates(route.destination.lat, route.destination.lng);
            const { path } = getBezierPath(p0.x, p0.y, p2.x, p2.y);
            
            return (
              <g key={route.id} className="group/route">
                <path
                  d={path}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.05)"
                  strokeWidth={1.5}
                />
                <path
                  d={path}
                  fill="none"
                  stroke={route.weatherWarning ? "url(#routeStormGlow)" : "url(#routeGlow)"}
                  strokeWidth={2}
                  className="opacity-70 group-hover/route:opacity-100 transition-opacity"
                />
              </g>
            );
          })}

          {/* Flying Aircraft Animations */}
          {routes.map((route, idx) => {
            const p0 = getCoordinates(route.origin.lat, route.origin.lng);
            const p2 = getCoordinates(route.destination.lat, route.destination.lng);
            const { x1, y1 } = getBezierPath(p0.x, p0.y, p2.x, p2.y);
            
            const offset = (idx * 0.3) % 1;
            const progress = (tick + offset) % 1;
            
            const { x, y, angle } = getBezierPoint(p0.x, p0.y, x1, y1, p2.x, p2.y, progress);
            
            const plane = fleet.find(p => p.id === route.aircraftId);
            const isGrounded = plane ? plane.status === 'Under Maintenance' : false;

            if (isGrounded) return null;

            return (
              <g key={`plane-anim-${route.id}`} transform={`translate(${x}, ${y}) rotate(${angle})`}>
                <circle 
                  r={7} 
                  fill={route.weatherWarning ? "rgba(244, 63, 94, 0.4)" : "rgba(6, 182, 212, 0.4)"} 
                  className="animate-ping" 
                />
                <circle r={4} fill={route.weatherWarning ? "#f43f5e" : "#06b6d4"} />
                <path 
                  d="M0,-5 L1,-2 L4,-2 L0,2 L0,5 L-1,5 L-1,2 L-4,-2 L-1,-2 Z"
                  fill="#ffffff"
                  stroke="#020617"
                  strokeWidth={0.5}
                  transform="scale(1.2)"
                />
              </g>
            );
          })}

          {/* Interactive City Nodes */}
          {CITIES.map((city) => {
            const { x, y } = getCoordinates(city.lat, city.lng);
            const isSelected = selectedOrigin?.id === city.id;
            const isHovered = hoveredCity?.id === city.id;

            return (
              <g 
                key={city.id}
                transform={`translate(${x}, ${y})`}
                onClick={() => handleCityClick(city)}
                onMouseEnter={() => setHoveredCity(city)}
                onMouseLeave={() => setHoveredCity(null)}
                className="cursor-pointer"
              >
                <circle
                  r={isHovered || isSelected ? 16 : 8}
                  fill="none"
                  stroke={isSelected ? '#06b6d4' : '#10b981'}
                  strokeWidth={1}
                  className="opacity-40 animate-pulse-slow"
                />
                <circle
                  r={isSelected ? 5 : 4}
                  fill={isSelected ? '#06b6d4' : '#10b981'}
                  className="transition-all duration-300"
                />

                <g transform="translate(0, -12)">
                  <rect
                    x={-22}
                    y={-10}
                    width={44}
                    height={16}
                    rx={4}
                    fill="rgba(10, 15, 30, 0.85)"
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth={0.5}
                    className="backdrop-blur-sm"
                  />
                  <text
                    textAnchor="middle"
                    y={2}
                    fontSize={9}
                    fontWeight="bold"
                    fill={isSelected ? '#06b6d4' : '#ffffff'}
                    fontFamily="monospace"
                  >
                    {city.code}
                  </text>
                </g>
              </g>
            );
          })}

          {/* Definitions for SVG Gradient Shaders */}
          <defs>
            <linearGradient id="routeGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
              <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="routeStormGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
              <stop offset="50%" stopColor="#f43f5e" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.2" />
            </linearGradient>
          </defs>
        </svg>

        {/* Floating City Detail Tooltip */}
        <AnimatePresence>
          {hoveredCity && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute bottom-4 left-4 glass-panel p-3 rounded-xl pointer-events-none flex flex-col z-20"
            >
              <span className="text-xs font-bold text-white">{hoveredCity.name}</span>
              <span className="text-[10px] text-slate-400 mt-0.5">{hoveredCity.country}</span>
              <span className="text-[9px] text-brand-cyan font-mono mt-1">
                LAT: {hoveredCity.lat.toFixed(4)} | LNG: {hoveredCity.lng.toFixed(4)}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <span className="text-[11px] text-slate-400 mt-3.5 text-center leading-relaxed font-medium">
        ✈️ Click on an airport node to lock origin, then click another to plan/assign flight routes.
      </span>
    </div>
  );
}
