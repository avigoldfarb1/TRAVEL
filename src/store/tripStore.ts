import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Trip, Flight, Hotel, CarRental, Activity,
  BudgetItem, ChecklistItem, EXCHANGE_RATES_TO_ILS
} from '../types';
import {
  sampleTrip, sampleFlights, sampleHotels, sampleCarRental,
  sampleActivities, sampleBudget, sampleChecklist
} from '../utils/sampleData';

interface TripStore {
  // Multi-trip
  trips: Trip[];
  currentTripId: string;
  trip: Trip;
  lastSaved: string | null;

  // Flat data for all trips (filtered via useCurrentTripData hook)
  flights: Flight[];
  hotels: Hotel[];
  carRentals: CarRental[];
  activities: Activity[];
  budget: BudgetItem[];
  checklist: ChecklistItem[];
  exchangeRates: Record<string, number>;

  // Trip management
  createTrip: (trip: Trip) => void;
  switchTrip: (id: string) => void;
  deleteTrip: (id: string) => void;
  updateTrip: (updates: Partial<Trip>) => void;
  save: () => void;

  // Flights
  addFlight: (flight: Flight) => void;
  updateFlight: (id: string, flight: Partial<Flight>) => void;
  deleteFlight: (id: string) => void;

  // Hotels
  addHotel: (hotel: Hotel) => void;
  updateHotel: (id: string, hotel: Partial<Hotel>) => void;
  deleteHotel: (id: string) => void;

  // Car Rentals
  addCarRental: (car: CarRental) => void;
  updateCarRental: (id: string, car: Partial<CarRental>) => void;
  deleteCarRental: (id: string) => void;

  // Activities
  addActivity: (activity: Activity) => void;
  updateActivity: (id: string, activity: Partial<Activity>) => void;
  deleteActivity: (id: string) => void;

  // Budget
  addBudgetItem: (item: BudgetItem) => void;
  updateBudgetItem: (id: string, item: Partial<BudgetItem>) => void;
  deleteBudgetItem: (id: string) => void;

  // Checklist
  addChecklistItem: (item: ChecklistItem) => void;
  toggleChecklistItem: (id: string) => void;
  updateChecklistItem: (id: string, updates: Partial<ChecklistItem>) => void;
  deleteChecklistItem: (id: string) => void;

  // Utils
  convertToILS: (amount: number, currency: string) => number;
  getTotalBudgetILS: () => number;
  getTotalSpentILS: () => number;
}

export const useTripStore = create<TripStore>()(
  persist(
    (set, get) => ({
      trips: [sampleTrip],
      currentTripId: sampleTrip.id,
      trip: sampleTrip,
      lastSaved: null,

      flights: sampleFlights,
      hotels: sampleHotels,
      carRentals: sampleCarRental,
      activities: sampleActivities,
      budget: sampleBudget,
      checklist: sampleChecklist,
      exchangeRates: EXCHANGE_RATES_TO_ILS,

      createTrip: (newTrip) => set((s) => ({
        trips: [...s.trips, newTrip],
        currentTripId: newTrip.id,
        trip: newTrip,
      })),

      switchTrip: (id) => set((s) => {
        const found = s.trips.find(t => t.id === id);
        if (!found) return s;
        return { currentTripId: id, trip: found };
      }),

      deleteTrip: (id) => set((s) => {
        const remaining = s.trips.filter(t => t.id !== id);
        if (remaining.length === 0) return s; // must keep at least one
        const newCurrent = id === s.currentTripId ? remaining[0] : s.trips.find(t => t.id === s.currentTripId)!;
        return {
          trips: remaining,
          currentTripId: newCurrent.id,
          trip: newCurrent,
          flights: s.flights.filter(f => f.tripId !== id),
          hotels: s.hotels.filter(h => h.tripId !== id),
          carRentals: s.carRentals.filter(c => c.tripId !== id),
          activities: s.activities.filter(a => a.tripId !== id),
          budget: s.budget.filter(b => b.tripId !== id),
          checklist: s.checklist.filter(c => c.tripId !== id),
        };
      }),

      updateTrip: (updates) => set((s) => {
        const updated = { ...s.trip, ...updates };
        return {
          trip: updated,
          trips: s.trips.map(t => t.id === s.currentTripId ? updated : t),
        };
      }),

      save: () => set({ lastSaved: new Date().toLocaleTimeString('he-IL') }),

      addFlight: (flight) => set((s) => ({ flights: [...s.flights, flight] })),
      updateFlight: (id, updates) => set((s) => ({
        flights: s.flights.map(f => f.id === id ? { ...f, ...updates } : f)
      })),
      deleteFlight: (id) => set((s) => ({ flights: s.flights.filter(f => f.id !== id) })),

      addHotel: (hotel) => set((s) => ({ hotels: [...s.hotels, hotel] })),
      updateHotel: (id, updates) => set((s) => ({
        hotels: s.hotels.map(h => h.id === id ? { ...h, ...updates } : h)
      })),
      deleteHotel: (id) => set((s) => ({ hotels: s.hotels.filter(h => h.id !== id) })),

      addCarRental: (car) => set((s) => ({ carRentals: [...s.carRentals, car] })),
      updateCarRental: (id, updates) => set((s) => ({
        carRentals: s.carRentals.map(c => c.id === id ? { ...c, ...updates } : c)
      })),
      deleteCarRental: (id) => set((s) => ({ carRentals: s.carRentals.filter(c => c.id !== id) })),

      addActivity: (activity) => set((s) => ({ activities: [...s.activities, activity] })),
      updateActivity: (id, updates) => set((s) => ({
        activities: s.activities.map(a => a.id === id ? { ...a, ...updates } : a)
      })),
      deleteActivity: (id) => set((s) => ({ activities: s.activities.filter(a => a.id !== id) })),

      addBudgetItem: (item) => set((s) => ({ budget: [...s.budget, item] })),
      updateBudgetItem: (id, updates) => set((s) => ({
        budget: s.budget.map(b => b.id === id ? { ...b, ...updates } : b)
      })),
      deleteBudgetItem: (id) => set((s) => ({ budget: s.budget.filter(b => b.id !== id) })),

      addChecklistItem: (item) => set((s) => ({ checklist: [...s.checklist, item] })),
      toggleChecklistItem: (id) => set((s) => ({
        checklist: s.checklist.map(c => c.id === id ? { ...c, checked: !c.checked } : c)
      })),
      updateChecklistItem: (id, updates) => set((s) => ({
        checklist: s.checklist.map(c => c.id === id ? { ...c, ...updates } : c)
      })),
      deleteChecklistItem: (id) => set((s) => ({ checklist: s.checklist.filter(c => c.id !== id) })),

      convertToILS: (amount, currency) => {
        const rates = get().exchangeRates;
        return amount * (rates[currency] ?? 1);
      },

      getTotalBudgetILS: () => get().convertToILS(get().trip.totalBudget, get().trip.currency),

      getTotalSpentILS: () => {
        const id = get().currentTripId;
        const { budget, convertToILS } = get();
        return budget
          .filter(b => b.tripId === id)
          .reduce((sum, item) => sum + convertToILS(item.amount, item.currency), 0);
      },
    }),
    { name: 'trip-manager-storage' }
  )
);

/** Hook that returns store data filtered to the current trip */
export function useCurrentTripData() {
  const store = useTripStore();
  const id = store.currentTripId;
  return {
    ...store,
    flights: store.flights.filter(f => f.tripId === id),
    hotels: store.hotels.filter(h => h.tripId === id),
    carRentals: store.carRentals.filter(c => c.tripId === id),
    activities: store.activities.filter(a => a.tripId === id),
    budget: store.budget.filter(b => b.tripId === id),
    checklist: store.checklist.filter(c => c.tripId === id),
  };
}
