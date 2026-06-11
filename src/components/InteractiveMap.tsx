'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { City, Route, useGameStore, CITIES } from '@/lib/store/useGameStore';
import { Plane, Maximize2, Compass, ShieldAlert, CloudLightning, MousePointer } from 'lucide-react';

const MAP_WIDTH = 800;
const MAP_HEIGHT = 400;

interface Point {
  lat: number;
  lng: number;
}

// Coordinate projection conversion
function getCoordinates(lat: number, lng: number) {
  const x = ((lng + 180) * MAP_WIDTH) / 360;
  const y = ((90 - lat) * MAP_HEIGHT) / 180;
  return { x, y };
}

// Convert screen/canvas coordinates back to Latitude and Longitude
function getLatLng(x: number, y: number) {
  const lng = (x * 360) / MAP_WIDTH - 180;
  const lat = 90 - (y * 180) / MAP_HEIGHT;
  return { lat, lng };
}

// High-fidelity polygon definitions for continents in Lat/Lng
const CONTINENTS: Record<string, Point[]> = {
  northAmerica: [
    {lat: 75, lng: -168}, {lat: 78, lng: -120}, {lat: 83, lng: -60}, {lat: 76, lng: -55},
    {lat: 60, lng: -45}, {lat: 53, lng: -55}, {lat: 47, lng: -52}, {lat: 44, lng: -63},
    {lat: 25, lng: -80}, {lat: 23, lng: -82}, {lat: 19, lng: -96}, {lat: 15, lng: -96},
    {lat: 8, lng: -77}, {lat: 10, lng: -83}, {lat: 14, lng: -91}, {lat: 16, lng: -93},
    {lat: 20, lng: -105}, {lat: 23, lng: -110}, {lat: 32, lng: -117}, {lat: 34, lng: -120},
    {lat: 48, lng: -125}, {lat: 58, lng: -136}, {lat: 60, lng: -140}, {lat: 64, lng: -166},
    {lat: 71, lng: -165}, {lat: 71, lng: -155}
  ],
  southAmerica: [
    {lat: 12, lng: -72}, {lat: 10, lng: -62}, {lat: 5, lng: -50}, {lat: -5, lng: -35},
    {lat: -8, lng: -35}, {lat: -23, lng: -43}, {lat: -34, lng: -53}, {lat: -48, lng: -65},
    {lat: -55, lng: -67}, {lat: -53, lng: -72}, {lat: -44, lng: -74}, {lat: -37, lng: -73},
    {lat: -22, lng: -70}, {lat: -17, lng: -72}, {lat: -12, lng: -77}, {lat: -5, lng: -81},
    {lat: 0, lng: -80}, {lat: 5, lng: -77}, {lat: 9, lng: -79}
  ],
  greenland: [
    {lat: 83, lng: -30}, {lat: 81, lng: -10}, {lat: 75, lng: -15}, {lat: 70, lng: -20},
    {lat: 65, lng: -35}, {lat: 60, lng: -43}, {lat: 60, lng: -50}, {lat: 68, lng: -55},
    {lat: 75, lng: -73}, {lat: 78, lng: -73}, {lat: 82, lng: -60}
  ],
  africa: [
    {lat: 37, lng: 11}, {lat: 36, lng: 15}, {lat: 32, lng: 32}, {lat: 31, lng: 34},
    {lat: 30, lng: 32}, {lat: 27, lng: 34}, {lat: 22, lng: 37}, {lat: 13, lng: 43},
    {lat: 11, lng: 51}, {lat: 4, lng: 48}, {lat: -3, lng: 40}, {lat: -15, lng: 38},
    {lat: -25, lng: 33}, {lat: -34, lng: 20}, {lat: -33, lng: 18}, {lat: -29, lng: 15},
    {lat: -15, lng: 12}, {lat: -5, lng: 12}, {lat: 0, lng: 9}, {lat: 5, lng: 10},
    {lat: 6, lng: 3}, {lat: 4, lng: -8}, {lat: 8, lng: -13}, {lat: 15, lng: -17},
    {lat: 21, lng: -17}, {lat: 26, lng: -15}, {lat: 32, lng: -10}, {lat: 35, lng: -6},
    {lat: 36, lng: 2}
  ],
  eurasia: [
    {lat: 36, lng: -6}, {lat: 37, lng: -9}, {lat: 43, lng: -9}, {lat: 46, lng: -2},
    {lat: 48, lng: -4}, {lat: 50, lng: -1}, {lat: 55, lng: 5}, {lat: 58, lng: 5},
    {lat: 62, lng: 10}, {lat: 65, lng: 15}, {lat: 70, lng: 22}, {lat: 71, lng: 26},
    {lat: 70, lng: 30}, {lat: 68, lng: 40}, {lat: 66, lng: 60}, {lat: 73, lng: 80},
    {lat: 76, lng: 100}, {lat: 77, lng: 106}, {lat: 73, lng: 115}, {lat: 72, lng: 130},
    {lat: 72, lng: 145}, {lat: 70, lng: 150}, {lat: 66, lng: 170}, {lat: 60, lng: 170},
    {lat: 56, lng: 163}, {lat: 54, lng: 160}, {lat: 45, lng: 140}, {lat: 35, lng: 140},
    {lat: 30, lng: 130}, {lat: 22, lng: 115}, {lat: 21, lng: 108}, {lat: 10, lng: 104},
    {lat: 6, lng: 100}, {lat: 10, lng: 98}, {lat: 15, lng: 96}, {lat: 22, lng: 91},
    {lat: 21, lng: 80}, {lat: 15, lng: 80}, {lat: 8, lng: 77}, {lat: 10, lng: 76},
    {lat: 20, lng: 73}, {lat: 25, lng: 68}, {lat: 25, lng: 61}, {lat: 12, lng: 44},
    {lat: 15, lng: 39}, {lat: 25, lng: 48}, {lat: 30, lng: 34}, {lat: 31, lng: 32},
    {lat: 36, lng: 36}, {lat: 41, lng: 29}, {lat: 40, lng: 26}, {lat: 38, lng: 23},
    {lat: 36, lng: 22}, {lat: 40, lng: 14}, {lat: 37, lng: 13}, {lat: 41, lng: 5},
    {lat: 43, lng: 6}, {lat: 43, lng: 9}, {lat: 37, lng: 15}, {lat: 37, lng: -2}
  ],
  australia: [
    {lat: -11, lng: 136}, {lat: -10, lng: 142}, {lat: -15, lng: 145}, {lat: -22, lng: 150},
    {lat: -33, lng: 151}, {lat: -38, lng: 146}, {lat: -37, lng: 140}, {lat: -34, lng: 135},
    {lat: -35, lng: 117}, {lat: -33, lng: 115}, {lat: -22, lng: 113}, {lat: -20, lng: 118},
    {lat: -15, lng: 124}, {lat: -12, lng: 130}, {lat: -15, lng: 136}
  ],
  antarctica: [
    {lat: -63, lng: -57}, {lat: -65, lng: -65}, {lat: -72, lng: -72}, {lat: -72, lng: -90},
    {lat: -75, lng: -120}, {lat: -78, lng: -150}, {lat: -82, lng: -180}, {lat: -82, lng: 180},
    {lat: -78, lng: 150}, {lat: -66, lng: 140}, {lat: -66, lng: 100}, {lat: -66, lng: 70},
    {lat: -68, lng: 40}, {lat: -70, lng: 0}, {lat: -70, lng: -40}, {lat: -72, lng: -50}
  ],
  madagascar: [
    {lat: -12, lng: 49}, {lat: -16, lng: 50}, {lat: -25, lng: 47}, {lat: -25, lng: 44},
    {lat: -20, lng: 44}, {lat: -15, lng: 46}
  ],
  japan: [
    {lat: 45, lng: 142}, {lat: 43, lng: 145}, {lat: 40, lng: 141}, {lat: 35, lng: 140},
    {lat: 34, lng: 136}, {lat: 33, lng: 130}, {lat: 34, lng: 131}, {lat: 36, lng: 133},
    {lat: 38, lng: 138}, {lat: 43, lng: 140}
  ],
  unitedKingdom: [
    {lat: 58, lng: -6}, {lat: 58, lng: -2}, {lat: 55, lng: -2}, {lat: 51, lng: 1},
    {lat: 50, lng: -5}, {lat: 52, lng: -10}, {lat: 55, lng: -8}
  ],
  newZealand: [
    {lat: -34, lng: 173}, {lat: -37, lng: 176}, {lat: -41, lng: 175}, {lat: -41, lng: 172},
    {lat: -46, lng: 168}, {lat: -46, lng: 166}, {lat: -41, lng: 171}, {lat: -38, lng: 174}
  ]
};

// Helper to calculate Bezier control point for curved flight arcs
const getBezierPath = (x0: number, y0: number, x2: number, y2: number) => {
  const midX = (x0 + x2) / 2;
  const midY = (y0 + y2) / 2;
  const dx = x2 - x0;
  const dy = y2 - y0;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  // Calculate curved trajectory height depending on distance
  const curveHeight = Math.min(100, dist * 0.22);
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

interface InteractiveMapProps {
  onSelectAirports?: (origin: City, destination: City) => void;
}

export default function InteractiveMap({ onSelectAirports }: InteractiveMapProps) {
  const { routes, fleet, activeStorms } = useGameStore();
  const [selectedOrigin, setSelectedOrigin] = useState<City | null>(null);
  const [hoveredCity, setHoveredCity] = useState<City | null>(null);

  // Zoom & Pan states
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Mouse HUD trackers
  const [hudCoord, setHudCoord] = useState<Point>({ lat: 0, lng: 0 });
  const [mouseCanvasPos, setMouseCanvasPos] = useState({ x: 0, y: 0 });

  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Smooth plane animation progression
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => (t + 0.004) % 1);
    }, 40);
    return () => clearInterval(timer);
  }, []);

  const handleCityClick = (city: City, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent map dragging triggers
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

  // Dragging event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left-click
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!svgRef.current) return;
    
    // Calculate cursor position relative to the SVG canvas taking zoom & pan into account
    const rect = svgRef.current.getBoundingClientRect();
    const canvasX = (e.clientX - rect.left - pan.x) / zoom;
    const canvasY = (e.clientY - rect.top - pan.y) / zoom;
    
    setMouseCanvasPos({ x: canvasX, y: canvasY });
    setHudCoord(getLatLng(canvasX, canvasY));

    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Zooming event handler (wheel)
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!svgRef.current) return;

    const zoomFactor = 1.1;
    const nextZoom = e.deltaY < 0 ? zoom * zoomFactor : zoom / zoomFactor;
    
    // Constraint zoom levels
    const constrainedZoom = Math.min(8, Math.max(0.7, nextZoom));
    setZoom(constrainedZoom);
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Generate SVG polygon coordinates string
  const getPolygonPointsStr = (points: Point[]) => {
    return points
      .map(p => {
        const { x, y } = getCoordinates(p.lat, p.lng);
        return `${x},${y}`;
      })
      .join(' ');
  };

  return (
    <div 
      ref={containerRef}
      className="w-full glass-panel rounded-2xl p-6 relative overflow-hidden flex flex-col items-center"
      style={{ touchAction: 'none' }}
    >
      {/* HUD & Operations Control bar */}
      <div className="w-full flex items-center justify-between mb-4 border-b border-white/5 pb-3 z-10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-brand-cyan rounded-full animate-ping" />
          <span className="text-[11px] font-mono tracking-widest text-slate-300 uppercase">
            OPERATIONAL TAC-RADAR GRID
          </span>
        </div>

        <div className="flex items-center gap-2">
          {selectedOrigin && (
            <div className="flex items-center gap-1.5 bg-brand-cyan/15 border border-brand-cyan/30 rounded-lg px-2 py-0.5 animate-pulse">
              <span className="text-[10px] font-bold text-brand-cyan uppercase">
                Lock Origin: {selectedOrigin.code}
              </span>
              <button 
                onClick={() => setSelectedOrigin(null)}
                className="text-[9px] font-bold text-white hover:text-brand-rose transition-colors ps-1 border-s border-white/10"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Map Screen */}
      <div 
        className="w-full relative aspect-[2/1] bg-slate-950/80 rounded-xl border border-white/5 overflow-hidden cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg 
          ref={svgRef}
          viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
          className="w-full h-full select-none"
        >
          {/* Definitions for gradients and dotted pattern patterns */}
          <defs>
            {/* futuristic neon mesh dots pattern */}
            <pattern id="radarGridPattern" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="0.75" fill="rgba(6, 182, 212, 0.12)" />
            </pattern>
            <pattern id="landmassDotPattern" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
              <circle cx="2.5" cy="2.5" r="1.2" fill="rgba(16, 185, 129, 0.3)" />
            </pattern>

            {/* Glowing lines gradients */}
            <linearGradient id="neonFlightGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.1" />
              <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.1" />
            </linearGradient>
            
            <linearGradient id="stormFlightGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2" />
              <stop offset="50%" stopColor="#f43f5e" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.2" />
            </linearGradient>

            {/* Storm Radial Gradient */}
            <radialGradient id="stormRadialGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
              <stop offset="70%" stopColor="#f43f5e" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Wrapper Group for Zoom & Panning */}
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            
            {/* Background grid mesh */}
            <rect 
              x={-500} 
              y={-250} 
              width={MAP_WIDTH + 1000} 
              height={MAP_HEIGHT + 500} 
              fill="url(#radarGridPattern)" 
            />

            {/* Equator & Prime Meridian indicator lines */}
            <line 
              x1={0} 
              y1={MAP_HEIGHT / 2} 
              x2={MAP_WIDTH} 
              y2={MAP_HEIGHT / 2} 
              stroke="rgba(255, 255, 255, 0.03)" 
              strokeWidth={1.5} 
              strokeDasharray="6 6" 
            />
            <line 
              x1={MAP_WIDTH / 2} 
              y1={0} 
              x2={MAP_WIDTH / 2} 
              y2={MAP_HEIGHT} 
              stroke="rgba(255, 255, 255, 0.03)" 
              strokeWidth={1.5} 
              strokeDasharray="6 6" 
            />

            {/* Realistically Projected Continents */}
            <g id="landmass-group">
              {Object.entries(CONTINENTS).map(([name, points]) => (
                <g key={name}>
                  {/* Underlay base shape */}
                  <polygon
                    points={getPolygonPointsStr(points)}
                    fill="rgba(15, 23, 42, 0.65)"
                    stroke="rgba(255, 255, 255, 0.05)"
                    strokeWidth={1.2 / zoom}
                  />
                  {/* Glowing neon green dot matrix overlay */}
                  <polygon
                    points={getPolygonPointsStr(points)}
                    fill="url(#landmassDotPattern)"
                    className="opacity-70"
                  />
                </g>
              ))}
            </g>

            {/* Active Flight Routes Curves */}
            {routes.map((route) => {
              const p0 = getCoordinates(route.origin.lat, route.origin.lng);
              const p2 = getCoordinates(route.destination.lat, route.destination.lng);
              const { path } = getBezierPath(p0.x, p0.y, p2.x, p2.y);

              return (
                <g key={route.id} className="group/route">
                  {/* Wide transparent hover detection area */}
                  <path
                    d={path}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={12}
                    className="cursor-pointer"
                  />
                  {/* Underlay dark trace line */}
                  <path
                    d={path}
                    fill="none"
                    stroke="rgba(15, 23, 42, 0.8)"
                    strokeWidth={3 / zoom}
                  />
                  {/* Glowing dynamic route line */}
                  <path
                    d={path}
                    fill="none"
                    stroke={route.weatherWarning ? "url(#stormFlightGlow)" : "url(#neonFlightGlow)"}
                    strokeWidth={2 / zoom}
                    className="opacity-80 group-hover/route:opacity-100 transition-opacity"
                    strokeDasharray={route.weatherWarning ? "4 4" : "none"}
                  />
                </g>
              );
            })}

            {/* Dynamic Interactive Dragging/Planning Vector */}
            {selectedOrigin && (
              <line
                x1={getCoordinates(selectedOrigin.lat, selectedOrigin.lng).x}
                y1={getCoordinates(selectedOrigin.lat, selectedOrigin.lng).y}
                x2={mouseCanvasPos.x}
                y2={mouseCanvasPos.y}
                stroke="#06b6d4"
                strokeWidth={1.5 / zoom}
                strokeDasharray="4 4"
                className="opacity-80 pointer-events-none"
              />
            )}

            {/* Weather Storm Front Danger Rings */}
            {activeStorms.map((storm) => {
              const { x, y } = getCoordinates(storm.lat, storm.lng);
              const pixelRadius = Math.max(20, storm.radius * (MAP_WIDTH / 40000));
              return (
                <g key={storm.id}>
                  {/* Soft pulsing danger radial glow */}
                  <circle
                    cx={x}
                    cy={y}
                    r={pixelRadius}
                    fill="url(#stormRadialGlow)"
                    pointerEvents="none"
                  />
                  {/* Dashed red boundary */}
                  <circle
                    cx={x}
                    cy={y}
                    r={pixelRadius}
                    fill="none"
                    stroke="rgba(244, 63, 94, 0.3)"
                    strokeWidth={1 / zoom}
                    strokeDasharray="3 4"
                    className="animate-spin-slow origin-center"
                    style={{ transformOrigin: `${x}px ${y}px` }}
                  />
                  {/* Central Storm core node */}
                  <circle
                    cx={x}
                    cy={y}
                    r={3 / zoom}
                    fill="#f43f5e"
                    className="animate-pulse"
                  />
                  {/* Danger label HUD */}
                  <text
                    x={x}
                    y={y + (pixelRadius + 10) / zoom}
                    fill="rgba(244, 63, 94, 0.85)"
                    fontSize={8 / zoom}
                    fontWeight="bold"
                    textAnchor="middle"
                    fontFamily="monospace"
                  >
                    ⛈️ STORM Sector
                  </text>
                </g>
              );
            })}

            {/* Aircraft Positions in Flight */}
            {routes.map((route, idx) => {
              const p0 = getCoordinates(route.origin.lat, route.origin.lng);
              const p2 = getCoordinates(route.destination.lat, route.destination.lng);
              const { x1, y1 } = getBezierPath(p0.x, p0.y, p2.x, p2.y);
              
              const offset = (idx * 0.35) % 1;
              const progress = (tick + offset) % 1;
              
              const { x, y, angle } = getBezierPoint(p0.x, p0.y, x1, y1, p2.x, p2.y, progress);
              const plane = fleet.find(p => p.id === route.aircraftId);
              
              if (!plane || plane.status === 'Under Maintenance') return null;

              return (
                <g 
                  key={`plane-marker-${route.id}`} 
                  transform={`translate(${x}, ${y}) rotate(${angle})`}
                  className="pointer-events-none"
                >
                  {/* Glowing alert radar ring */}
                  <circle 
                    r={8 / zoom} 
                    fill={route.weatherWarning ? "rgba(244, 63, 94, 0.35)" : "rgba(6, 182, 212, 0.3)"} 
                    className="animate-ping" 
                  />
                  {/* Center flight dot */}
                  <circle r={3 / zoom} fill={route.weatherWarning ? "#f43f5e" : "#06b6d4"} />
                  {/* Futuristic Plane model vector */}
                  <path 
                    d="M0,-4 L1,-2 L4,-2 L0,2 L0,4 L-1,4 L-1,2 L-4,-2 L-1,-2 Z"
                    fill="#ffffff"
                    stroke="#0f172a"
                    strokeWidth={0.5 / zoom}
                    transform={`scale(${1.25 / zoom})`}
                  />
                </g>
              );
            })}

            {/* Airport Hub Nodes */}
            {CITIES.map((city) => {
              const { x, y } = getCoordinates(city.lat, city.lng);
              const isSelected = selectedOrigin?.id === city.id;
              const isHovered = hoveredCity?.id === city.id;

              return (
                <g
                  key={city.id}
                  transform={`translate(${x}, ${y})`}
                  onClick={(e) => handleCityClick(city, e)}
                  onMouseEnter={() => setHoveredCity(city)}
                  onMouseLeave={() => setHoveredCity(null)}
                  className="cursor-pointer group/node"
                >
                  {/* Outer pulsing ring */}
                  <circle
                    r={(isHovered || isSelected ? 14 : 7) / zoom}
                    fill="none"
                    stroke={isSelected ? '#06b6d4' : '#10b981'}
                    strokeWidth={1 / zoom}
                    className="opacity-40 animate-pulse-slow"
                  />
                  {/* Core airport dot */}
                  <circle
                    r={(isSelected ? 4.5 : 3) / zoom}
                    fill={isSelected ? '#06b6d4' : '#10b981'}
                    className="transition-all duration-200 group-hover/node:fill-white"
                  />

                  {/* Airport label box */}
                  <g transform={`translate(0, ${-11 / zoom})`}>
                    <rect
                      x={-18 / zoom}
                      y={-7 / zoom}
                      width={36 / zoom}
                      height={13 / zoom}
                      rx={3 / zoom}
                      fill="rgba(15, 23, 42, 0.85)"
                      stroke={isSelected ? 'rgba(6, 182, 212, 0.4)' : 'rgba(16, 185, 129, 0.2)'}
                      strokeWidth={0.6 / zoom}
                    />
                    <text
                      textAnchor="middle"
                      y={2 / zoom}
                      fontSize={8 / zoom}
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
          </g>
        </svg>

        {/* HUD Coordinate display overlay */}
        <div className="absolute bottom-3 left-3 bg-slate-950/80 border border-white/5 rounded-lg px-2.5 py-1 text-[9px] font-mono text-slate-400 pointer-events-none flex items-center gap-1.5 backdrop-blur-md">
          <Compass className="w-3.5 h-3.5 text-brand-cyan animate-spin-slow" />
          <span>LAT: {hudCoord.lat.toFixed(4)}°N</span>
          <span className="text-white/20">|</span>
          <span>LNG: {hudCoord.lng.toFixed(4)}°E</span>
        </div>

        {/* Map Reset controls */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1">
          <button
            onClick={resetView}
            title="Reset Map View"
            className="p-1.5 bg-slate-950/80 border border-white/5 hover:border-brand-cyan/40 hover:bg-brand-cyan/15 rounded-lg text-slate-400 hover:text-brand-cyan transition-all backdrop-blur-md"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Interactive Floating Tooltip */}
        <AnimatePresence>
          {hoveredCity && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute top-3 left-3 glass-panel p-3.5 rounded-xl pointer-events-none flex flex-col z-20 backdrop-blur-xl border border-white/10"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white">{hoveredCity.name}</span>
                <span className="text-[9px] font-bold bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20 px-1 rounded">
                  {hoveredCity.code}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5">{hoveredCity.country}</span>
              <div className="border-t border-white/5 mt-2 pt-1.5 flex flex-col gap-1 text-[9px] text-slate-500 font-mono">
                <span>LAT: {hoveredCity.lat.toFixed(4)}</span>
                <span>LNG: {hoveredCity.lng.toFixed(4)}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <span className="text-[10px] font-sans text-slate-500 mt-2.5 text-center leading-relaxed max-w-lg">
        🗺️ Drag to Pan | Scroll Wheel to Zoom. Click an airport to select as Origin, click a second to set Route.
      </span>
    </div>
  );
}
