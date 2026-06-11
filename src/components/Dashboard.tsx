'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useGameStore, CITIES, AIRCRAFT_MODELS, City, Route } from '@/lib/store/useGameStore';
import StatCard from './ui/StatCard';
import FlightMap from './FlightMap';
import LanguageSwitcher from './LanguageSwitcher';
import { 
  DollarSign, 
  PlaneTakeoff, 
  Map, 
  Activity, 
  Percent, 
  Fuel, 
  Leaf, 
  Trash2, 
  Plus, 
  Clock, 
  Wrench,
  AlertCircle,
  CloudLightning,
  Sparkles,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';

export default function Dashboard() {
  const t = useTranslations('dashboard');
  const tf = useTranslations('fleet');
  const te = useTranslations('economy');
  const ta = useTranslations('alerts');
  const tc = useTranslations('carbon_market');
  const tw = useTranslations('weather');
  const tl = useTranslations('leaderboard');

  // Zustand Store variables
  const {
    balance,
    fuelReserves,
    co2TaxTier,
    totalEmissions,
    dailyExpenses,
    profitMargin,
    fuelPrice,
    co2TaxRate,
    demandFactor,
    marketEvents,
    fleet,
    routes,
    buyAircraft,
    leaseAircraft,
    maintainAircraft,
    establishRoute,
    removeRoute,
    processGameTick,
    
    // Advanced variables
    currentTick,
    carbonCredits,
    carbonCreditPrice,
    carbonHistory,
    activeStorms,
    competitors,
    financeHistory,
    buyCarbonCredits,
    sellCarbonCredits
  } = useGameStore();

  // Local component states
  const [selectedOriginId, setSelectedOriginId] = useState('');
  const [selectedDestId, setSelectedDestId] = useState('');
  const [selectedAircraftId, setSelectedAircraftId] = useState('');
  const [ticketPrice, setTicketPrice] = useState(650);
  const [carbonAmount, setCarbonAmount] = useState(100);
  const [errorMessage, setErrorMessage] = useState('');

  // Auto-tick cycle representing game hours
  useEffect(() => {
    const interval = setInterval(() => {
      processGameTick();
    }, 60000); // Ticks every 60 seconds
    return () => clearInterval(interval);
  }, [processGameTick]);

  // Update selected airports from map interaction
  const handleMapSelect = (origin: City, destination: City) => {
    setSelectedOriginId(origin.id);
    setSelectedDestId(destination.id);
  };

  const handleEstablishRoute = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedOriginId || !selectedDestId || !selectedAircraftId) {
      setErrorMessage('Please select origin, destination and aircraft.');
      return;
    }
    if (selectedOriginId === selectedDestId) {
      setErrorMessage('Origin and destination cannot be the same.');
      return;
    }
    if (ticketPrice <= 0) {
      setErrorMessage('Ticket price must be greater than 0.');
      return;
    }

    const plane = fleet.find(p => p.id === selectedAircraftId);
    if (!plane) return;

    if (plane.assignedRouteId) {
      setErrorMessage('This aircraft is already assigned to a route.');
      return;
    }

    const origin = CITIES.find(c => c.id === selectedOriginId);
    const dest = CITIES.find(c => c.id === selectedDestId);
    if (!origin || !dest) return;

    const model = AIRCRAFT_MODELS.find(m => m.id === plane.modelId);
    if (!model) return;

    // Calculate dynamic distance
    const earthRadius = 6371;
    const dLat = ((dest.lat - origin.lat) * Math.PI) / 180;
    const dLon = ((dest.lng - origin.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((origin.lat * Math.PI) / 180) *
        Math.cos((dest.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = Math.round(earthRadius * c);

    if (dist > model.range) {
      setErrorMessage(`Aircraft range exceeded! Flight range is ${model.range}km, route is ${dist}km.`);
      return;
    }

    establishRoute(selectedOriginId, selectedDestId, selectedAircraftId, ticketPrice);
    
    // Reset form
    setSelectedOriginId('');
    setSelectedDestId('');
    setSelectedAircraftId('');
  };

  // Compile leaderboard data including player
  const leaderboardData = [
    { id: 'player', name: 'Antigravity Airways (You)', fleetSize: fleet.length, activeRoutes: routes.length, balance, score: Math.round(profitMargin * 1.5 + fleet.length * 4) },
    ...competitors
  ].sort((a, b) => b.score - a.score);

  // Check if current carbon footprint exceeds credits owned
  const isCarbonDeficit = totalEmissions > carbonCredits;

  return (
    <div className="flex-1 flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full z-10">
      {/* Top Banner & Language Toggles */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-brand-cyan/15 rounded-xl border border-brand-cyan/30 flex items-center justify-center">
            <PlaneTakeoff className="w-8 h-8 text-brand-cyan animate-pulse-slow" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">{t('title')}</h1>
            <p className="text-xs font-medium text-slate-400 mt-1">{t('airline_name')}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          {/* Manual game cycle trigger */}
          <button 
            onClick={() => processGameTick()}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-cyan/20 border border-brand-cyan/30 text-brand-cyan hover:bg-brand-cyan hover:text-slate-950 transition-all rounded-xl text-xs font-bold font-sans"
          >
            <Clock className="w-3.5 h-3.5" />
            {t('open_control')} (Cycle {currentTick})
          </button>
          
          {/* Language selection switcher */}
          <LanguageSwitcher />
        </div>
      </div>

      {/* Grid of Main Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title={t('cash_balance')}
          value={`$${balance.toLocaleString()}`}
          subValue={`Daily outflow: $${dailyExpenses.toLocaleString()}`}
          icon={<DollarSign className="w-5 h-5" />}
          color="emerald"
        />
        <StatCard 
          title={t('fleet_size')}
          value={`${fleet.length} Planes`}
          subValue={`${fleet.filter(p => p.status === 'In Service').length} in service / ${fleet.filter(p => p.status === 'Under Maintenance').length} servicing`}
          icon={<PlaneTakeoff className="w-5 h-5" />}
          color="cyan"
        />
        <StatCard 
          title={t('active_routes')}
          value={`${routes.length} Routes`}
          subValue={`Target load factor: 85%`}
          icon={<Map className="w-5 h-5" />}
          color="violet"
        />
        <StatCard 
          title={t('roi')}
          value={`${profitMargin}%`}
          subValue={`CO2 emissions: ${totalEmissions.toLocaleString()} Tons`}
          icon={<Percent className="w-5 h-5" />}
          color={profitMargin >= 0 ? "emerald" : "rose"}
        />
      </div>

      {/* Main Game Interface (Radar and Economic Updates Sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Flight Arc Map */}
        <div className="lg:col-span-2">
          <FlightMap onSelectAirports={handleMapSelect} />
        </div>

        {/* Global Market Ticker Sidebar */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col gap-5">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <Activity className="w-4.5 h-4.5 text-brand-cyan" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">{te('title')}</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-950/40 border border-white/5 rounded-xl p-3 flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                <Fuel className="w-3 h-3 text-brand-amber" />
                {te('fuel_price')}
              </span>
              <span className="text-lg font-bold text-white">${fuelPrice.toFixed(2)}</span>
              <span className="text-[9px] text-slate-400">{te('fuel_barrel')}</span>
            </div>

            <div className="bg-slate-950/40 border border-white/5 rounded-xl p-3 flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                <Leaf className="w-3 h-3 text-brand-emerald" />
                {te('co2_tax')}
              </span>
              <span className="text-lg font-bold text-white">${co2TaxRate.toFixed(2)}</span>
              <span className="text-[9px] text-slate-400">{te('co2_ton')}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
              <span>{te('demand_factor')}</span>
              <span className="text-brand-cyan">{Math.round(demandFactor * 100)}%</span>
            </div>
            <div className="w-full bg-white/5 h-2 rounded-full mt-1.5 overflow-hidden">
              <div 
                className="bg-brand-cyan h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, (demandFactor / 2) * 100)}%` }} 
              />
            </div>
          </div>

          {/* Economic News Logs */}
          <div className="flex flex-col gap-3 flex-1">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{te('events')}</h3>
            <div className="flex-1 overflow-y-auto max-h-[160px] flex flex-col gap-3.5 pr-1.5">
              {marketEvents.map((evt) => (
                <div key={evt.id} className="bg-slate-950/30 border-s-2 border-brand-violet p-2.5 rounded-r-lg flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-brand-violet uppercase tracking-wide">
                      {ta('new_event')}
                    </span>
                    <span className="text-[9px] text-slate-400">{evt.timestamp}</span>
                  </div>
                  <h4 className="text-[11px] font-bold text-white">{evt.title}</h4>
                  <p className="text-[10px] text-slate-300 leading-relaxed">{evt.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Features (Carbon Credits & Charts Visualizer) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recharts ROI / Financial Trend Visualizer */}
        <div className="glass-panel rounded-2xl p-6 lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <TrendingUp className="w-4.5 h-4.5 text-brand-cyan" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">Financial Performance Trajectory</h2>
          </div>

          <div className="w-full h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={financeHistory}>
                <defs>
                  <linearGradient id="balanceGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="tick" 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  label={{ value: 'Simulation Cycle (Ticks)', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 9 }}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => `$${(val / 1000000).toFixed(0)}M`}
                />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#fff'
                  }}
                  formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Balance']}
                />
                <Area 
                  type="monotone" 
                  dataKey="balance" 
                  stroke="#10b981" 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#balanceGlow)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Carbon Offset Quotas Market */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <Leaf className="w-4.5 h-4.5 text-brand-emerald" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">{tc('title')}</h2>
          </div>

          <div className="flex flex-col gap-2.5">
            <div className="flex justify-between text-xs text-slate-400">
              <span>{tc('credits_held')}:</span>
              <span className="font-bold text-white">{carbonCredits.toLocaleString()} CO2 credits</span>
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>{tc('price_per_credit')}:</span>
              <span className="font-bold text-brand-emerald">${carbonCreditPrice.toFixed(2)} / credit</span>
            </div>
            
            {isCarbonDeficit && (
              <div className="bg-brand-rose/10 border border-brand-rose/30 rounded-lg p-2.5 mt-1 text-[10px] text-brand-rose leading-relaxed flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>{tc('deficit_warning')}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2.5 mt-2">
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={carbonAmount}
                onChange={(e) => setCarbonAmount(Math.max(10, Number(e.target.value)))}
                className="bg-slate-950/60 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-cyan w-full text-center font-bold"
              />
              <span className="text-xs text-slate-400 font-semibold">Tons</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => buyCarbonCredits(carbonAmount)}
                disabled={balance < carbonAmount * carbonCreditPrice}
                className="py-2 bg-brand-emerald text-slate-950 hover:bg-brand-emerald/80 disabled:opacity-30 disabled:pointer-events-none transition-all rounded-lg text-xs font-bold uppercase"
              >
                {tc('buy')}
              </button>
              <button
                onClick={() => sellCarbonCredits(carbonAmount)}
                disabled={carbonCredits < carbonAmount}
                className="py-2 bg-brand-cyan/20 border border-brand-cyan/30 text-brand-cyan hover:bg-brand-cyan hover:text-slate-950 disabled:opacity-30 disabled:pointer-events-none transition-all rounded-lg text-xs font-bold uppercase"
              >
                {tc('sell')}
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-2 mt-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{tc('history')}</span>
            <div className="overflow-y-auto max-h-[80px] flex flex-col gap-1.5 pr-1">
              {carbonHistory.length === 0 ? (
                <span className="text-[10px] text-slate-500 text-center italic py-2">No transactions recorded.</span>
              ) : (
                carbonHistory.map(tx => (
                  <div key={tx.id} className="flex justify-between items-center bg-slate-950/20 border border-white/5 rounded px-2 py-1 text-[10px]">
                    <span className={`font-bold uppercase ${tx.type === 'buy' ? 'text-brand-emerald' : 'text-brand-cyan'}`}>
                      {tx.type === 'buy' ? 'Bought' : 'Sold'}
                    </span>
                    <span className="text-white font-semibold">{tx.amount} Tons</span>
                    <span className="text-slate-400">${tx.totalCost.toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Weather Warnings & Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Weather Alerts Panel */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <CloudLightning className="w-4.5 h-4.5 text-brand-rose" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">{tw('title')}</h2>
          </div>

          <div className="flex-1 flex flex-col gap-3.5">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{tw('storms_active')}</span>
            
            {activeStorms.length === 0 ? (
              <div className="bg-brand-emerald/10 border border-brand-emerald/20 text-brand-emerald text-xs rounded-xl p-3 flex items-center gap-2">
                <Sparkles className="w-4.5 h-4.5" />
                <span>{tw('clear')}</span>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {activeStorms.map(storm => (
                  <div key={storm.id} className="bg-brand-rose/10 border border-brand-rose/20 text-white rounded-xl p-3.5 flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-brand-rose font-bold text-xs">
                      <CloudLightning className="w-4 h-4 animate-bounce" />
                      <span>{storm.name}</span>
                    </div>
                    <p className="text-[10px] text-slate-300 mt-1 leading-relaxed">
                      Proximity sector: <strong>Lat {storm.lat.toFixed(1)}, Lng {storm.lng.toFixed(1)}</strong>.
                      {tw('detour_penalty')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Competitor Leaderboard */}
        <div className="glass-panel rounded-2xl p-6 lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <BarChart3 className="w-4.5 h-4.5 text-brand-violet" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">{tl('title')}</h2>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-start text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-slate-400 font-bold">
                  <th className="text-start pb-2.5 font-semibold">{tl('airline')}</th>
                  <th className="text-start pb-2.5 font-semibold">{tl('fleet')}</th>
                  <th className="text-start pb-2.5 font-semibold">{tl('routes')}</th>
                  <th className="text-start pb-2.5 font-semibold">Airline Net Worth</th>
                  <th className="text-end pb-2.5 font-semibold">{tl('score')}</th>
                </tr>
              </thead>
              <tbody>
                {leaderboardData.map((comp, idx) => (
                  <tr 
                    key={comp.id} 
                    className={`border-b border-white/5 last:border-0 hover:bg-white/[0.01] transition-colors ${comp.id === 'player' ? 'bg-brand-cyan/5 border-s-2 border-s-brand-cyan' : ''}`}
                  >
                    <td className="py-3 font-semibold text-slate-200 ps-2">
                      <span className="font-mono text-[10px] text-slate-500 me-2">#{idx + 1}</span>
                      {comp.name}
                    </td>
                    <td className="py-3 text-slate-300">{comp.fleetSize} aircraft</td>
                    <td className="py-3 text-slate-300">{comp.activeRoutes} paths</td>
                    <td className="py-3 text-brand-emerald font-bold">${comp.balance.toLocaleString()}</td>
                    <td className="py-3 text-end font-extrabold text-white pe-2">{comp.score} pts</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Fleet & Route establishment forms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Route Planning System */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col gap-5">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <Plus className="w-4.5 h-4.5 text-brand-cyan" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">{t('manage_routes')}</h2>
          </div>

          <form onSubmit={handleEstablishRoute} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Origin Airport</label>
                <select
                  value={selectedOriginId}
                  onChange={(e) => setSelectedOriginId(e.target.value)}
                  className="bg-slate-950/60 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-cyan"
                >
                  <option value="" className="bg-slate-950">Select Origin</option>
                  {CITIES.map(c => (
                    <option key={c.id} value={c.id} className="bg-slate-950">
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Destination Airport</label>
                <select
                  value={selectedDestId}
                  onChange={(e) => setSelectedDestId(e.target.value)}
                  className="bg-slate-950/60 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-cyan"
                >
                  <option value="" className="bg-slate-950">Select Destination</option>
                  {CITIES.map(c => (
                    <option key={c.id} value={c.id} className="bg-slate-950">
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Assign Aircraft</label>
                <select
                  value={selectedAircraftId}
                  onChange={(e) => setSelectedAircraftId(e.target.value)}
                  className="bg-slate-950/60 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-cyan"
                >
                  <option value="" className="bg-slate-950">Select idle plane</option>
                  {fleet.filter(p => !p.assignedRouteId).map(p => (
                    <option key={p.id} value={p.id} className="bg-slate-950">
                      {p.modelName} (Condition: {p.condition}%)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Ticket Price ($)</label>
                <input
                  type="number"
                  value={ticketPrice}
                  onChange={(e) => setTicketPrice(Number(e.target.value))}
                  className="bg-slate-950/60 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-cyan"
                />
              </div>
            </div>

            {errorMessage && (
              <div className="bg-brand-rose/10 border border-brand-rose/30 rounded-lg p-2.5 flex items-center gap-2 text-xs text-brand-rose">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              className="mt-2 w-full py-2.5 bg-brand-cyan text-slate-950 hover:bg-brand-cyan/80 transition-all font-bold rounded-lg text-xs tracking-wider uppercase"
            >
              Establish Dispatch Route
            </button>
          </form>
        </div>

        {/* Aircraft Shop & Maintenance */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col gap-5">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <Wrench className="w-4.5 h-4.5 text-brand-cyan" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">{tf('title')}</h2>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[300px] flex flex-col gap-3.5 pr-1">
            {AIRCRAFT_MODELS.map((model) => (
              <div key={model.id} className="bg-slate-950/40 border border-white/5 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-white/10 transition-colors">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-white">{model.name}</span>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-[10px] text-slate-400">
                    <span>{tf('range')}: <strong>{model.range.toLocaleString()} km</strong></span>
                    <span>Capacity: <strong>{model.capacity} seats</strong></span>
                    <span>{tf('fuel_efficiency')}: <strong>{model.efficiency} L</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <div className="flex flex-col text-end pe-2">
                    <span className="text-[11px] font-bold text-brand-cyan">${(model.price / 1000000).toFixed(1)}M buy</span>
                    <span className="text-[9px] text-slate-400">${(model.leaseRate / 1000).toFixed(0)}k/mo lease</span>
                  </div>

                  <button
                    onClick={() => buyAircraft(model.id)}
                    disabled={balance < model.price}
                    className="px-2.5 py-1.5 bg-brand-emerald text-slate-950 hover:bg-brand-emerald/80 disabled:opacity-30 disabled:pointer-events-none transition-all rounded-lg text-[10px] font-bold uppercase"
                  >
                    {tf('action_buy')}
                  </button>
                  <button
                    onClick={() => leaseAircraft(model.id)}
                    disabled={balance < model.leaseRate}
                    className="px-2.5 py-1.5 bg-brand-cyan/20 border border-brand-cyan/30 text-brand-cyan hover:bg-brand-cyan hover:text-slate-950 disabled:opacity-30 disabled:pointer-events-none transition-all rounded-lg text-[10px] font-bold uppercase"
                  >
                    {tf('action_lease')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active Flights Data Grid */}
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex items-center gap-2 border-b border-white/5 pb-3 mb-4">
          <PlaneTakeoff className="w-4.5 h-4.5 text-brand-cyan" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">{t('active_flights_table')}</h2>
        </div>

        {routes.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            {t('no_flights')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-slate-400 font-bold">
                  <th className="text-start pb-3 font-semibold">{t('flight_no')}</th>
                  <th className="text-start pb-3 font-semibold">{t('route')}</th>
                  <th className="text-start pb-3 font-semibold">Assigned Plane</th>
                  <th className="text-start pb-3 font-semibold">{t('load_factor')}</th>
                  <th className="text-start pb-3 font-semibold">Revenue</th>
                  <th className="text-start pb-3 font-semibold">Fuel & Tax Outflow</th>
                  <th className="text-start pb-3 font-semibold">{t('profit')}</th>
                  <th className="text-end pb-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {routes.map((route, idx) => {
                  const plane = fleet.find(p => p.id === route.aircraftId);
                  const outflow = route.fuelCost + route.carbonTax;
                  const profit = route.revenue - outflow;
                  
                  return (
                    <tr key={route.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 font-mono font-bold text-white">AS-{100 + idx}</td>
                      <td className="py-4 font-semibold text-slate-300">
                        {route.origin.code} ({route.origin.name}) ➔ {route.destination.code} ({route.destination.name})
                        <span className="block text-[10px] text-slate-500">{route.distance.toLocaleString()} km</span>
                        {route.weatherWarning && (
                          <span className="inline-flex items-center gap-0.5 mt-1 px-1.5 py-0.5 rounded bg-brand-rose/25 text-brand-rose text-[9px] font-bold">
                            ⚠️ STORM DETOUR
                          </span>
                        )}
                      </td>
                      <td className="py-4">
                        <span className="font-semibold text-white block">{plane?.modelName}</span>
                        {plane && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[10px] text-slate-400">Condition:</span>
                            <span className={`text-[10px] font-bold ${plane.condition > 75 ? 'text-brand-emerald' : plane.condition > 40 ? 'text-brand-amber' : 'text-brand-rose'}`}>
                              {plane.condition}%
                            </span>
                            {plane.condition < 80 && (
                              <button
                                onClick={() => maintainAircraft(plane.id)}
                                className="flex items-center gap-0.5 px-1.5 py-0.5 bg-brand-amber/15 text-brand-amber hover:bg-brand-amber hover:text-slate-950 transition-all rounded text-[9px] font-bold"
                              >
                                <Wrench className="w-2.5 h-2.5" />
                                Service
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-4 font-medium text-white">
                        {route.occupancy}%
                        <div className="w-16 bg-white/5 h-1 rounded-full mt-1.5 overflow-hidden">
                          <div className="bg-brand-cyan h-full rounded-full" style={{ width: `${route.occupancy}%` }} />
                        </div>
                      </td>
                      <td className="py-4 text-brand-emerald font-semibold">${route.revenue.toLocaleString()}</td>
                      <td className="py-4 text-brand-rose font-semibold">
                        -${outflow.toLocaleString()}
                        <span className="block text-[9px] text-slate-500">Fuel: ${route.fuelCost.toLocaleString()} | Tax: ${route.carbonTax.toLocaleString()}</span>
                      </td>
                      <td className={`py-4 font-bold ${profit >= 0 ? 'text-brand-emerald' : 'text-brand-rose'}`}>
                        {profit >= 0 ? '+' : ''}${profit.toLocaleString()}
                      </td>
                      <td className="py-4 text-end">
                        <button
                          onClick={() => removeRoute(route.id)}
                          className="p-1.5 text-slate-400 hover:text-brand-rose hover:bg-brand-rose/10 transition-all rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
