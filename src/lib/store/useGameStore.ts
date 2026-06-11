import { create } from 'zustand';

// Haversine formula for distance in km
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export interface City {
  id: string;
  name: string;
  code: string;
  lat: number;
  lng: number;
  country: string;
}

export interface AircraftModel {
  id: string;
  name: string;
  range: number; // km
  efficiency: number; // L per 100 passenger-km
  capacity: number; // seats
  price: number; // $
  leaseRate: number; // $ per month
}

export interface AircraftInstance {
  id: string;
  modelId: string;
  modelName: string;
  isLeased: boolean;
  condition: number; // 0 - 100
  status: 'In Service' | 'Under Maintenance' | 'Idle';
  assignedRouteId: string | null;
}

export interface Route {
  id: string;
  origin: City;
  destination: City;
  distance: number;
  aircraftId: string;
  ticketPrice: number;
  occupancy: number; // percentage (0 - 100)
  revenue: number; // per flight
  fuelCost: number; // per flight
  carbonTax: number; // per flight
  weatherWarning: boolean; // affected by storms
}

export interface MarketEvent {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  impactType: 'fuel' | 'demand' | 'co2' | 'general';
}

export interface CarbonTransaction {
  id: string;
  type: 'buy' | 'sell';
  amount: number;
  pricePerCredit: number;
  totalCost: number;
  timestamp: string;
}

export interface WeatherStorm {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius: number; // impact radius in km
}

export interface Competitor {
  id: string;
  name: string;
  fleetSize: number;
  activeRoutes: number;
  balance: number;
  score: number;
}

export interface FinanceData {
  tick: number;
  balance: number;
  revenue: number;
  expenses: number;
}

export const CITIES: City[] = [
  { id: 'JFK', name: 'New York', code: 'JFK', lat: 40.6413, lng: -73.7781, country: 'United States' },
  { id: 'LHR', name: 'London', code: 'LHR', lat: 51.4700, lng: -0.4543, country: 'United Kingdom' },
  { id: 'NRT', name: 'Tokyo', code: 'NRT', lat: 35.7767, lng: 140.3929, country: 'Japan' },
  { id: 'DXB', name: 'Dubai', code: 'DXB', lat: 25.2532, lng: 55.3657, country: 'United Arab Emirates' },
  { id: 'CDG', name: 'Paris', code: 'CDG', lat: 49.0097, lng: 2.5479, country: 'France' },
  { id: 'SYD', name: 'Sydney', code: 'SYD', lat: -33.9461, lng: 151.1772, country: 'Australia' },
  { id: 'CAI', name: 'Cairo', code: 'CAI', lat: 30.1219, lng: 31.4056, country: 'Egypt' },
  { id: 'ALG', name: 'Algiers', code: 'ALG', lat: 36.6910, lng: 3.2154, country: 'Algeria' },
  { id: 'LAX', name: 'Los Angeles', code: 'LAX', lat: 33.9416, lng: -118.4085, country: 'United States' },
  { id: 'SIN', name: 'Singapore', code: 'SIN', lat: 1.3644, lng: 103.9915, country: 'Singapore' },
  { id: 'FRA', name: 'Frankfurt', code: 'FRA', lat: 50.0379, lng: 8.5622, country: 'Germany' },
  { id: 'BOM', name: 'Mumbai', code: 'BOM', lat: 19.0896, lng: 72.8656, country: 'India' },
  { id: 'GRU', name: 'São Paulo', code: 'GRU', lat: -23.4356, lng: -46.4731, country: 'Brazil' },
  { id: 'JNB', name: 'Johannesburg', code: 'JNB', lat: -26.1367, lng: 28.2411, country: 'South Africa' },
  { id: 'HKG', name: 'Hong Kong', code: 'HKG', lat: 22.3080, lng: 113.9185, country: 'Hong Kong' },
  { id: 'HNL', name: 'Honolulu', code: 'HNL', lat: 21.3187, lng: -157.9225, country: 'United States' }
];

export const AIRCRAFT_MODELS: AircraftModel[] = [
  { id: 'crj900', name: 'Bombardier CRJ-900', range: 2500, efficiency: 3.2, capacity: 76, price: 45000000, leaseRate: 220000 },
  { id: 'b737_800', name: 'Boeing 737-800', range: 5765, efficiency: 2.5, capacity: 189, price: 90000000, leaseRate: 450000 },
  { id: 'a320neo', name: 'Airbus A320neo', range: 6500, efficiency: 2.1, capacity: 180, price: 110000000, leaseRate: 550000 },
  { id: 'b787_9', name: 'Boeing 787-9 Dreamliner', range: 14140, efficiency: 2.3, capacity: 290, price: 250000000, leaseRate: 1200000 },
  { id: 'b747_8', name: 'Boeing 747-8 Intercontinental', range: 14320, efficiency: 2.8, capacity: 410, price: 380000000, leaseRate: 1800000 },
  { id: 'a380', name: 'Airbus A380 Superjumbo', range: 15200, efficiency: 3.0, capacity: 525, price: 445000000, leaseRate: 2100000 },
  { id: 'concorde', name: 'Aérospatiale Concorde (Supersonic)', range: 7222, efficiency: 13.2, capacity: 100, price: 180000000, leaseRate: 900000 },
  { id: 'b777x', name: 'Boeing 777-9X', range: 13500, efficiency: 2.2, capacity: 384, price: 320000000, leaseRate: 1500000 }
];

interface GameState {
  // Finances & Resources
  balance: number;
  fuelReserves: number;
  co2TaxTier: number;
  totalEmissions: number;
  dailyExpenses: number;
  profitMargin: number;
  currentTick: number;

  // Carbon Market
  carbonCredits: number; // quota assets
  carbonCreditPrice: number; // dynamic price per credit
  carbonHistory: CarbonTransaction[];

  // Weather & Hazards
  activeStorms: WeatherStorm[];

  // Competitor Board
  competitors: Competitor[];

  // Visual Finance Log (For charts)
  financeHistory: FinanceData[];

  // Market indicators
  fuelPrice: number; // per barrel
  co2TaxRate: number; // per ton
  demandFactor: number; // multiplier 0.5 - 2.0
  marketEvents: MarketEvent[];

  // Fleet & Routes
  fleet: AircraftInstance[];
  routes: Route[];

  // Game Speed
  gameSpeed: 'pause' | '1x' | '2x' | '5x' | '10x';

  // Actions
  buyAircraft: (modelId: string) => void;
  leaseAircraft: (modelId: string) => void;
  maintainAircraft: (aircraftId: string) => void;
  establishRoute: (originId: string, destinationId: string, aircraftId: string, ticketPrice: number) => void;
  removeRoute: (routeId: string) => void;
  syncEconomy: (fuelPrice: number, co2TaxRate: number, demandFactor: number, events: MarketEvent[]) => void;
  buyCarbonCredits: (amount: number) => void;
  sellCarbonCredits: (amount: number) => void;
  setGameSpeed: (speed: 'pause' | '1x' | '2x' | '5x' | '10x') => void;
  processGameTick: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  balance: 125000000, // $125M Starting balance
  fuelReserves: 80000, // 80k barrels
  co2TaxTier: 2,
  totalEmissions: 1420, // Tons of CO2
  dailyExpenses: 450000,
  profitMargin: 18.4,
  currentTick: 5,

  // Carbon Market Starting conditions
  carbonCredits: 1500, // Credits held
  carbonCreditPrice: 58.00, // $58 per credit
  carbonHistory: [],

  // Weather Hazards
  activeStorms: [
    { id: 'storm_1', name: 'Atlantic Cyclone Arthur', lat: 48.0, lng: -25.0, radius: 1200 }
  ],

  // Competitor Airlines
  competitors: [
    { id: 'comp_1', name: 'Apex Airways', fleetSize: 5, activeRoutes: 4, balance: 148000000, score: 72 },
    { id: 'comp_2', name: 'GlobalJet', fleetSize: 8, activeRoutes: 6, balance: 210000000, score: 85 },
    { id: 'comp_3', name: 'Skylink Express', fleetSize: 3, activeRoutes: 2, balance: 89000000, score: 58 }
  ],

  // Pre-filled Financial logs for lines graph
  financeHistory: [
    { tick: 1, balance: 110000000, revenue: 120000, expenses: 140000 },
    { tick: 2, balance: 112000000, revenue: 150000, expenses: 130000 },
    { tick: 3, balance: 116000000, revenue: 180000, expenses: 135000 },
    { tick: 4, balance: 120000000, revenue: 210000, expenses: 140000 },
    { tick: 5, balance: 125000000, revenue: 212400, expenses: 145000 }
  ],

  // Market indicators
  fuelPrice: 78.50,
  co2TaxRate: 40.00,
  demandFactor: 1.05,
  marketEvents: [
    {
      id: 'initial',
      title: 'Global Economy Stable',
      description: 'Air travel demand is growing steadily across major business routes.',
      timestamp: new Date().toLocaleTimeString(),
      impactType: 'general'
    }
  ],

  // Fleet & Routes
  fleet: [
    { id: 'plane_1', modelId: 'b737_800', modelName: 'Boeing 737-800', isLeased: false, condition: 98, status: 'In Service', assignedRouteId: 'route_1' },
    { id: 'plane_2', modelId: 'a320neo', modelName: 'Airbus A320neo', isLeased: true, condition: 94, status: 'In Service', assignedRouteId: 'route_2' },
    { id: 'plane_3', modelId: 'crj900', modelName: 'Bombardier CRJ-900', isLeased: false, condition: 76, status: 'Under Maintenance', assignedRouteId: null }
  ],

  gameSpeed: '1x',

  routes: [
    {
      id: 'route_1',
      origin: CITIES[0], // JFK
      destination: CITIES[1], // LHR
      distance: 5550,
      aircraftId: 'plane_1',
      ticketPrice: 620,
      occupancy: 84,
      revenue: 98700,
      fuelCost: 28000,
      carbonTax: 4200,
      weatherWarning: true // Atlantic cyclone near route midpoint (approx lng -37)
    },
    {
      id: 'route_2',
      origin: CITIES[4], // CDG
      destination: CITIES[3], // DXB
      distance: 5240,
      aircraftId: 'plane_2',
      ticketPrice: 710,
      occupancy: 89,
      revenue: 113700,
      fuelCost: 26000,
      carbonTax: 3800,
      weatherWarning: false
    }
  ],

  buyAircraft: (modelId) => {
    const model = AIRCRAFT_MODELS.find(m => m.id === modelId);
    if (!model) return;
    
    const { balance, fleet } = get();
    if (balance < model.price) return;

    const newAircraft: AircraftInstance = {
      id: `plane_${Date.now()}`,
      modelId: model.id,
      modelName: model.name,
      isLeased: false,
      condition: 100,
      status: 'Idle',
      assignedRouteId: null
    };

    set({
      balance: balance - model.price,
      fleet: [...fleet, newAircraft]
    });
  },

  leaseAircraft: (modelId) => {
    const model = AIRCRAFT_MODELS.find(m => m.id === modelId);
    if (!model) return;
    
    const { balance, fleet } = get();
    if (balance < model.leaseRate) return;

    const newAircraft: AircraftInstance = {
      id: `plane_${Date.now()}`,
      modelId: model.id,
      modelName: model.name,
      isLeased: true,
      condition: 100,
      status: 'Idle',
      assignedRouteId: null
    };

    set({
      balance: balance - model.leaseRate,
      fleet: [...fleet, newAircraft]
    });
  },

  maintainAircraft: (aircraftId) => {
    const { fleet, balance } = get();
    const planeIdx = fleet.findIndex(p => p.id === aircraftId);
    if (planeIdx === -1) return;

    const plane = fleet[planeIdx];
    const wear = 100 - plane.condition;
    if (wear === 0) return;

    const model = AIRCRAFT_MODELS.find(m => m.id === plane.modelId);
    if (!model) return;

    const cost = wear * 8500;
    if (balance < cost) return;

    const updatedFleet = [...fleet];
    updatedFleet[planeIdx] = {
      ...plane,
      condition: 100,
      status: 'Under Maintenance'
    };

    set({
      balance: balance - cost,
      fleet: updatedFleet
    });
  },

  establishRoute: (originId, destinationId, aircraftId, ticketPrice) => {
    const { fleet, routes, activeStorms } = get();
    const origin = CITIES.find(c => c.id === originId);
    const destination = CITIES.find(c => c.id === destinationId);
    const planeIdx = fleet.findIndex(p => p.id === aircraftId);

    if (!origin || !destination || planeIdx === -1) return;
    const plane = fleet[planeIdx];
    const model = AIRCRAFT_MODELS.find(m => m.id === plane.modelId);
    if (!model) return;

    const distance = calculateDistance(origin.lat, origin.lng, destination.lat, destination.lng);
    if (distance > model.range) return;

    // Check weather storm proximity along route midpoint
    const midLat = (origin.lat + destination.lat) / 2;
    const midLng = (origin.lng + destination.lng) / 2;
    const weatherWarning = activeStorms.some(storm => {
      const d = calculateDistance(midLat, midLng, storm.lat, storm.lng);
      return d < storm.radius;
    });

    const routeId = `route_${Date.now()}`;
    const baseOccupancy = Math.round((70 + Math.random() * 25) * get().demandFactor);
    const occupancy = Math.min(100, Math.max(20, baseOccupancy));
    const revenueVal = Math.round(model.capacity * (occupancy / 100) * ticketPrice);

    // Weather causes 25% detour fuel surcharge
    const stormMultiplier = weatherWarning ? 1.25 : 1.0;
    const fuelCostVal = Math.round(distance * (model.efficiency / 10) * get().fuelPrice * 0.15 * stormMultiplier);
    const carbonTaxVal = Math.round(distance * 0.04 * get().co2TaxRate);

    const newRoute: Route = {
      id: routeId,
      origin,
      destination,
      distance,
      aircraftId,
      ticketPrice,
      occupancy,
      revenue: revenueVal,
      fuelCost: fuelCostVal,
      carbonTax: carbonTaxVal,
      weatherWarning
    };

    const updatedFleet = [...fleet];
    updatedFleet[planeIdx] = {
      ...plane,
      assignedRouteId: routeId,
      status: 'In Service'
    };

    set({
      routes: [...routes, newRoute],
      fleet: updatedFleet
    });
  },

  removeRoute: (routeId) => {
    const { routes, fleet } = get();
    const route = routes.find(r => r.id === routeId);
    if (!route) return;

    const updatedFleet = fleet.map(p => {
      if (p.id === route.aircraftId) {
        return { ...p, assignedRouteId: null, status: 'Idle' as const };
      }
      return p;
    });

    set({
      routes: routes.filter(r => r.id !== routeId),
      fleet: updatedFleet
    });
  },

  syncEconomy: (fuelPrice, co2TaxRate, demandFactor, events) => {
    // Fluctuating Carbon credits market relative to CO2 tax rate
    const carbonCreditPrice = Math.round(co2TaxRate * 1.35 + (Math.random() * 10 - 5));
    
    set({
      fuelPrice,
      co2TaxRate,
      demandFactor,
      carbonCreditPrice,
      marketEvents: [...events, ...get().marketEvents].slice(0, 15)
    });
  },

  buyCarbonCredits: (amount) => {
    const { balance, carbonCredits, carbonCreditPrice, carbonHistory } = get();
    const cost = amount * carbonCreditPrice;
    if (balance < cost) return;

    const newTx: CarbonTransaction = {
      id: `carbon_${Date.now()}`,
      type: 'buy',
      amount,
      pricePerCredit: carbonCreditPrice,
      totalCost: cost,
      timestamp: new Date().toLocaleTimeString()
    };

    set({
      balance: balance - cost,
      carbonCredits: carbonCredits + amount,
      carbonHistory: [newTx, ...carbonHistory].slice(0, 10)
    });
  },

  sellCarbonCredits: (amount) => {
    const { balance, carbonCredits, carbonCreditPrice, carbonHistory } = get();
    if (carbonCredits < amount) return;

    const earnings = amount * carbonCreditPrice;
    const newTx: CarbonTransaction = {
      id: `carbon_${Date.now()}`,
      type: 'sell',
      amount,
      pricePerCredit: carbonCreditPrice,
      totalCost: earnings,
      timestamp: new Date().toLocaleTimeString()
    };

    set({
      balance: balance + earnings,
      carbonCredits: carbonCredits - amount,
      carbonHistory: [newTx, ...carbonHistory].slice(0, 10)
    });
  },

  setGameSpeed: (speed) => {
    set({ gameSpeed: speed });
  },

  processGameTick: () => {
    const { 
      routes, 
      fleet, 
      balance, 
      fuelPrice, 
      co2TaxRate, 
      demandFactor, 
      currentTick, 
      financeHistory,
      activeStorms,
      competitors,
      carbonCredits,
      carbonCreditPrice
    } = get();
    
    const nextTick = currentTick + 1;
    let netChange = 0;
    let flightEmissions = 0;
    let flightFuelUsed = 0;

    // Process Storm dynamics (25% chance to move or shift storm parameters)
    let updatedStorms = [...activeStorms];
    if (Math.random() < 0.20) {
      if (updatedStorms.length > 0) {
        // Move the storm slightly
        updatedStorms = updatedStorms.map(storm => ({
          ...storm,
          lat: storm.lat + (Math.random() * 4 - 2),
          lng: storm.lng + (Math.random() * 6 - 3)
        }));
      } else {
        // Spawn a storm
        const targetCity = CITIES[Math.floor(Math.random() * CITIES.length)];
        updatedStorms.push({
          id: `storm_${Date.now()}`,
          name: 'Atmospheric Jet Storm',
          lat: targetCity.lat + (Math.random() * 5 - 2.5),
          lng: targetCity.lng + (Math.random() * 5 - 2.5),
          radius: 800 + Math.random() * 500
        });
      }
    }

    // Process active routes
    const updatedRoutes = routes.map(route => {
      const plane = fleet.find(p => p.id === route.aircraftId);
      if (!plane || plane.status === 'Under Maintenance' || plane.condition < 10) {
        return route;
      }

      const model = AIRCRAFT_MODELS.find(m => m.id === plane.modelId);
      if (!model) return route;

      // Check storm collision along midpoint
      const midLat = (route.origin.lat + route.destination.lat) / 2;
      const midLng = (route.origin.lng + route.destination.lng) / 2;
      const isStorming = updatedStorms.some(storm => {
        const d = calculateDistance(midLat, midLng, storm.lat, storm.lng);
        return d < storm.radius;
      });

      const dynamicOccupancy = Math.min(100, Math.max(30, Math.round(route.occupancy * (0.95 + Math.random() * 0.1) * demandFactor)));
      const revenue = Math.round(model.capacity * (dynamicOccupancy / 100) * route.ticketPrice);
      
      const fuelUsedLitres = Math.round(route.distance * (model.efficiency / 10) * model.capacity * (dynamicOccupancy / 100));
      const fuelBarrels = Math.round(fuelUsedLitres / 159);
      
      // Storm forces detour increasing fuel usage by 25%
      const stormMultiplier = isStorming ? 1.25 : 1.0;
      const fuelCost = Math.round(fuelBarrels * fuelPrice * stormMultiplier);
      
      const co2Tons = (fuelUsedLitres * 2.5) / 1000;
      const carbonTax = Math.round(co2Tons * co2TaxRate);

      flightEmissions += co2Tons;
      flightFuelUsed += fuelBarrels;

      netChange += (revenue - fuelCost - carbonTax);

      return {
        ...route,
        occupancy: dynamicOccupancy,
        revenue,
        fuelCost,
        carbonTax,
        weatherWarning: isStorming
      };
    });

    // Pay leases and upkeep
    let totalLeaseCosts = 0;
    let upkeepExpenses = 0;

    fleet.forEach(plane => {
      const model = AIRCRAFT_MODELS.find(m => m.id === plane.modelId);
      if (!model) return;
      if (plane.isLeased) {
        totalLeaseCosts += Math.round(model.leaseRate / 30);
      } else {
        upkeepExpenses += Math.round(model.price * 0.0001);
      }
    });

    netChange -= (totalLeaseCosts + upkeepExpenses);

    // Apply carbon credits penalty if carbon emissions exceed credits owned
    const carbonDeficit = Math.max(0, flightEmissions - carbonCredits);
    const co2Penalty = Math.round(carbonDeficit * carbonCreditPrice * 0.35); // 35% surcharge on deficit
    netChange -= co2Penalty;

    // Aircraft degradation
    const updatedFleet = fleet.map(plane => {
      if (plane.status === 'Under Maintenance') {
        return { ...plane, condition: 100, status: 'Idle' as const };
      }
      if (plane.assignedRouteId) {
        const wear = Math.random() * 1.5 + 0.2;
        const nextCondition = Math.max(0, plane.condition - wear);
        return {
          ...plane,
          condition: parseFloat(nextCondition.toFixed(1)),
          status: nextCondition < 15 ? 'Idle' as const : 'In Service' as const
        };
      }
      return plane;
    });

    const newBalance = balance + netChange;
    const finalEmissions = get().totalEmissions + flightEmissions;
    const nextDailyExpenses = totalLeaseCosts + upkeepExpenses + Math.round(flightFuelUsed * fuelPrice) + co2Penalty;
    
    // Profit margin
    const totalRevenues = updatedRoutes.reduce((acc, r) => acc + r.revenue, 0);
    const totalOutflow = totalLeaseCosts + upkeepExpenses + updatedRoutes.reduce((acc, r) => acc + r.fuelCost + r.carbonTax, 0) + co2Penalty;
    const margin = totalRevenues > 0 ? ((totalRevenues - totalOutflow) / totalRevenues) * 100 : 0;

    // Update NPC Competitor stats dynamically
    const updatedCompetitors = competitors.map(comp => {
      const npcChange = Math.round((comp.fleetSize * 45000 - comp.activeRoutes * 15000) * (0.8 + Math.random() * 0.5));
      const nextBalance = comp.balance + npcChange;
      const score = Math.min(100, Math.max(10, Math.round(comp.score + (Math.random() * 4 - 2))));
      return {
        ...comp,
        balance: nextBalance,
        score
      };
    });

    // Update visual financial metrics log
    const updatedHistory = [
      ...financeHistory,
      {
        tick: nextTick,
        balance: newBalance,
        revenue: totalRevenues,
        expenses: totalOutflow
      }
    ].slice(-6); // Keep latest 6 data points

    // Fluctuating Carbon credits market relative to CO2 tax rate
    const nextCarbonPrice = Math.round(co2TaxRate * 1.35 + (Math.random() * 10 - 5));

    set({
      balance: newBalance,
      fleet: updatedFleet,
      routes: updatedRoutes,
      totalEmissions: parseFloat(finalEmissions.toFixed(1)),
      dailyExpenses: nextDailyExpenses,
      profitMargin: parseFloat(margin.toFixed(1)),
      currentTick: nextTick,
      activeStorms: updatedStorms,
      competitors: updatedCompetitors,
      financeHistory: updatedHistory,
      carbonCreditPrice: nextCarbonPrice
    });
  }
}));
